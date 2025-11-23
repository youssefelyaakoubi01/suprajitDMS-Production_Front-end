import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const notificationService = inject(NotificationService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An error occurred';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = error.error.message;
            } else {
                // Server-side error
                switch (error.status) {
                    case 400:
                        errorMessage = 'Bad Request';
                        break;
                    case 401:
                        errorMessage = 'Unauthorized';
                        break;
                    case 403:
                        errorMessage = 'Access Denied';
                        break;
                    case 404:
                        errorMessage = 'Resource Not Found';
                        break;
                    case 500:
                        errorMessage = 'Internal Server Error';
                        break;
                    default:
                        errorMessage = `Error: ${error.status}`;
                }
            }

            notificationService.error('Error', errorMessage);
            return throwError(() => error);
        })
    );
};
