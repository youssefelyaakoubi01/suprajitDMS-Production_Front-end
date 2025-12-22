import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginCredentials, TokenResponse, User, AuthState } from '../models/auth.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly TOKEN_KEY = 'access_token';
    private readonly REFRESH_TOKEN_KEY = 'refresh_token';
    private readonly USER_KEY = 'user';

    private authState$ = new BehaviorSubject<AuthState>({
        isAuthenticated: this.hasToken(),
        user: this.getStoredUser(),
        accessToken: this.getAccessToken(),
        refreshToken: this.getRefreshToken()
    });

    constructor(
        private http: HttpClient,
        private router: Router
    ) {}

    login(credentials: LoginCredentials): Observable<TokenResponse> {
        return this.http.post<TokenResponse>(`${environment.apiUrl}/token/`, credentials)
            .pipe(
                tap(response => {
                    this.setTokens(response.access, response.refresh);
                    this.updateAuthState(true);
                })
            );
    }

    logout(): void {
        this.clearTokens();
        this.updateAuthState(false);
        this.router.navigate(['/dms-login']);
    }

    refreshToken(): Observable<TokenResponse> {
        const refreshToken = this.getRefreshToken();
        return this.http.post<TokenResponse>(`${environment.apiUrl}/token/refresh/`, {
            refresh: refreshToken
        }).pipe(
            tap(response => {
                this.setTokens(response.access, response.refresh);
            })
        );
    }

    getAccessToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    isAuthenticated(): boolean {
        return this.hasToken();
    }

    getAuthState(): Observable<AuthState> {
        return this.authState$.asObservable();
    }

    setUser(user: User): void {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.authState$.next({
            ...this.authState$.value,
            user
        });
    }

    getCurrentUser(): User | null {
        return this.authState$.value.user;
    }

    /**
     * Fetch current user profile from API
     * Uses the /users/me/ endpoint
     */
    getUserProfile(): Observable<User> {
        const token = this.getAccessToken();
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        return this.http.get<User>(`${environment.apiUrl}/users/me/`, { headers }).pipe(
            tap(user => {
                this.setUser(user);
            }),
            catchError(error => {
                console.error('Failed to fetch user profile:', error);
                // Try to decode user from JWT token as fallback
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        const basicUser: User = {
                            id: payload.user_id || payload.sub || 0,
                            username: payload.username || 'user',
                            email: payload.email || '',
                            first_name: payload.first_name || payload.username || '',
                            last_name: payload.last_name || '',
                            position: 'viewer',
                            status: 'active'
                        };
                        this.setUser(basicUser);
                        return of(basicUser);
                    } catch {
                        // Token is not decodable
                    }
                }
                throw error;
            })
        );
    }

    /**
     * Check if current user has specific permission
     */
    hasPermission(permission: keyof User): boolean {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (user.position === 'admin') return true;
        return user[permission] === true;
    }

    /**
     * Check if current user has access to a specific DMS module
     */
    hasModuleAccess(moduleName: string): boolean {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (user.position === 'admin') return true;

        const modulePermissionMap: { [key: string]: keyof User } = {
            'admin': 'dms_admin',
            'production': 'dms_production',
            'hr': 'dms_hr',
            'maintenance': 'dms_maintenance',
            'inventory': 'dms_inventory',
            'quality': 'dms_quality',
            'tech': 'dms_tech',
            'analytics': 'dms_analytics',
            'kpi': 'dms_kpi',
            'll': 'dms_ll'
        };

        const permission = modulePermissionMap[moduleName];
        if (!permission) return true; // Unknown module, allow access

        return user[permission] === true;
    }

    private setTokens(access: string, refresh: string): void {
        localStorage.setItem(this.TOKEN_KEY, access);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh);
    }

    private clearTokens(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    private hasToken(): boolean {
        return !!this.getAccessToken();
    }

    private getStoredUser(): User | null {
        const userJson = localStorage.getItem(this.USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    }

    private updateAuthState(isAuthenticated: boolean): void {
        this.authState$.next({
            isAuthenticated,
            user: isAuthenticated ? this.getStoredUser() : null,
            accessToken: isAuthenticated ? this.getAccessToken() : null,
            refreshToken: isAuthenticated ? this.getRefreshToken() : null
        });
    }
}
