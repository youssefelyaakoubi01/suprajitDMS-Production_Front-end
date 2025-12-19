/**
 * DMS Application Routes
 *
 * Main routing configuration using modular domain routes.
 * Each DMS domain has its own route file in @domains/{domain-name}/
 */
import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { AppDmsLayout } from './app/layout/component/app.dms-layout';
import { AppDmsHrLayout } from './app/layout/component/app.dms-hr-layout';
import { AppDmsMaintenanceLayout } from './app/layout/component/app.dms-maintenance-layout';

export const appRoutes: Routes = [
    {
        path: '',
        redirectTo: 'dms-home',
        pathMatch: 'full'
    },
    // ==================== DMS HOME (SELECTOR) ====================
    {
        path: 'dms-home',
        loadComponent: () => import('./app/features/dms-selector/dms-selector.component').then(m => m.DmsSelectorComponent),
        title: 'DMS - Home'
    },
    {
        path: 'dms-login',
        loadComponent: () => import('./app/features/dms-login/dms-login.component').then(m => m.DmsLoginComponent),
        title: 'DMS - Login'
    },
    // ==================== DMS PRODUCTION ====================
    {
        path: 'dms-production',
        component: AppDmsLayout,
        title: 'DMS Production',
        loadChildren: () => import('./app/domains/dms-production/dms-production.routes').then(m => m.DMS_PRODUCTION_ROUTES)
    },
    // ==================== DMS HR ====================
    {
        path: 'dms-hr',
        component: AppDmsHrLayout,
        title: 'DMS RH',
        loadChildren: () => import('./app/domains/dms-rh/dms-rh.routes').then(m => m.DMS_RH_ROUTES)
    },
    // ==================== DMS MAINTENANCE ====================
    {
        path: 'dms-maintenance',
        component: AppDmsMaintenanceLayout,
        title: 'DMS Maintenance',
        loadChildren: () => import('./app/domains/dms-maintenance/dms-maintenance.routes').then(m => m.DMS_MAINTENANCE_ROUTES)
    },
    // ==================== DMS INVENTORY ====================
    {
        path: 'dms-inventory',
        component: AppDmsLayout,
        title: 'DMS Inventory',
        loadChildren: () => import('./app/domains/dms-inventory/dms-inventory.routes').then(m => m.DMS_INVENTORY_ROUTES)
    },
    // ==================== DMS QUALITY ====================
    {
        path: 'dms-quality',
        component: AppDmsLayout,
        title: 'DMS Quality',
        loadChildren: () => import('./app/domains/dms-quality/dms-quality.routes').then(m => m.DMS_QUALITY_ROUTES)
    },
    // ==================== ANALYTICS ====================
    {
        path: 'analytics',
        component: AppDmsLayout,
        title: 'DMS Analytics',
        loadChildren: () => import('./app/domains/dms-analytics/dms-analytics.routes').then(m => m.DMS_ANALYTICS_ROUTES)
    },
    // ==================== OTHER ====================
    {
        path: '',
        component: AppLayout,
        children: [
            {
                path: 'uikit',
                loadChildren: () => import('./app/pages/uikit/uikit.routes')
            },
            {
                path: 'documentation',
                loadComponent: () => import('./app/pages/documentation/documentation').then(m => m.Documentation)
            },
            {
                path: 'pages',
                loadChildren: () => import('./app/pages/pages.routes')
            }
        ]
    },
    {
        path: 'landing',
        loadComponent: () => import('./app/pages/landing/landing').then(m => m.Landing)
    },
    {
        path: 'notfound',
        loadComponent: () => import('./app/pages/notfound/notfound').then(m => m.Notfound)
    },
    {
        path: 'auth',
        loadChildren: () => import('./app/pages/auth/auth.routes')
    },
    { path: '**', redirectTo: '/notfound' }
];
