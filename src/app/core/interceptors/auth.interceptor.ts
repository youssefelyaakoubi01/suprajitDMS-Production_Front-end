import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Skip token for login and refresh endpoints
    if (req.url.includes('/token/') || req.url.includes('/token/refresh/')) {
        return next(req);
    }

    // Add token to request
    const token = authService.getAccessToken();
    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Handle 401 Unauthorized - token expired
            if (error.status === 401 && token) {
                return authService.refreshToken().pipe(
                    switchMap(() => {
                        // Retry the request with new token
                        const newToken = authService.getAccessToken();
                        const clonedReq = req.clone({
                            setHeaders: {
                                Authorization: `Bearer ${newToken}`
                            }
                        });
                        return next(clonedReq);
                    }),
                    catchError(refreshError => {
                        // Refresh token failed, logout user
                        authService.logout();
                        router.navigate(['/dms-login']);
                        return throwError(() => refreshError);
                    })
                );
            }

            return throwError(() => error);
        })
    );
};
