/**
 * Admin Guard
 * Restricts access to admin-only routes
 */
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Check if authenticated
    if (!authService.isAuthenticated()) {
        router.navigate(['/dms-login'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }

    // Check if user is admin (by position OR by dms_admin permission)
    const user = authService.getCurrentUser();
    if (user) {
        // Allow access if position is 'admin' OR dms_admin permission is true
        const isAdmin = user.position === 'admin' || user.dms_admin === true;
        if (isAdmin) {
            return true;
        }
    }

    // For development: allow access if no user restrictions are set
    // TODO: Remove this in production
    if (user && !user.position && user.dms_admin === undefined) {
        console.warn('Admin Guard: No admin restrictions found, allowing access for development');
        return true;
    }

    // Redirect non-admin users to home
    router.navigate(['/dms-home']);
    return false;
};
