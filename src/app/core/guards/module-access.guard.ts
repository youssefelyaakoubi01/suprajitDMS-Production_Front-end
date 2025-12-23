/**
 * Module Access Guards
 * Creates guards for specific DMS module access based on user permissions
 */
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Factory function to create module-specific guards
 * @param moduleKey The permission key (e.g., 'dms_production', 'dms_hr')
 * @param loginUrl Custom login URL for this module (defaults to /dms-login)
 */
export const createModuleGuard = (moduleKey: string, loginUrl: string = '/dms-login'): CanActivateFn => {
    return (route, state) => {
        const authService = inject(AuthService);
        const router = inject(Router);

        // Check if authenticated
        if (!authService.isAuthenticated()) {
            router.navigate([loginUrl], {
                queryParams: { returnUrl: state.url }
            });
            return false;
        }

        // Check module permission
        const user = authService.getCurrentUser();

        // Admin has access to everything
        if (user && user.position === 'admin') {
            return true;
        }

        if (user && (user as any)[moduleKey]) {
            return true;
        }

        // Redirect to home if no permission
        router.navigate(['/dms-home']);
        return false;
    };
};

/**
 * Production Guard - Redirects to /dms-production-login
 * Checks authentication and dms_production permission
 */
export const productionGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Check if authenticated
    if (!authService.isAuthenticated()) {
        router.navigate(['/dms-production-login']);
        return false;
    }

    // Check module permission
    const user = authService.getCurrentUser();

    // Admin has access to everything
    if (user && user.position === 'admin') {
        return true;
    }

    // Check dms_production permission
    if (user && (user as any).dms_production) {
        return true;
    }

    // Redirect to home if no permission (user is logged in but no access)
    router.navigate(['/dms-home']);
    return false;
};

// Pre-defined guards for other modules
export const hrGuard: CanActivateFn = createModuleGuard('dms_hr');
export const maintenanceGuard: CanActivateFn = createModuleGuard('dms_maintenance');
export const inventoryGuard: CanActivateFn = createModuleGuard('dms_inventory');
export const qualityGuard: CanActivateFn = createModuleGuard('dms_quality');
export const analyticsGuard: CanActivateFn = createModuleGuard('dms_analytics');
export const techGuard: CanActivateFn = createModuleGuard('dms_tech');
export const kpiGuard: CanActivateFn = createModuleGuard('dms_kpi');
export const llGuard: CanActivateFn = createModuleGuard('dms_ll');
