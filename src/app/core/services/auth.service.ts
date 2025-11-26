import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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
