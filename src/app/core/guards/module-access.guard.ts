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
 */
export const createModuleGuard = (moduleKey: string): CanActivateFn => {
    return (route, state) => {
        const authService = inject(AuthService);
        const router = inject(Router);

        // Check if authenticated
        if (!authService.isAuthenticated()) {
            router.navigate(['/dms-login'], {
                queryParams: { returnUrl: state.url }
            });
            return false;
        }

        // Check module permission
        const user = authService.getCurrentUser();
        if (user && (user as any)[moduleKey]) {
            return true;
        }

        // Admin has access to everything
        if (user && user.position === 'admin') {
            return true;
        }

        // Redirect to home if no permission
        router.navigate(['/dms-home']);
        return false;
    };
};

// Pre-defined guards for each module
export const productionGuard: CanActivateFn = createModuleGuard('dms_production');
export const hrGuard: CanActivateFn = createModuleGuard('dms_hr');
export const maintenanceGuard: CanActivateFn = createModuleGuard('dms_maintenance');
export const inventoryGuard: CanActivateFn = createModuleGuard('dms_inventory');
export const qualityGuard: CanActivateFn = createModuleGuard('dms_quality');
export const analyticsGuard: CanActivateFn = createModuleGuard('dms_analytics');
export const techGuard: CanActivateFn = createModuleGuard('dms_tech');
export const kpiGuard: CanActivateFn = createModuleGuard('dms_kpi');
export const llGuard: CanActivateFn = createModuleGuard('dms_ll');
