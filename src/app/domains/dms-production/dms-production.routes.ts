/**
 * DMS-Production Routes
 * Domain: Production Management
 *
 * These routes are designed to be lazy-loaded as children of the main layout.
 * Uses standalone components from the domains structure.
 */
import { Routes } from '@angular/router';

export const DMS_PRODUCTION_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/dashboard/production-dashboard.component').then(m => m.ProductionDashboardComponent),
        title: 'Production Dashboard'
    },
    {
        path: 'tracking',
        loadComponent: () =>
            import('./features/production-tracking/production-tracking.component').then(m => m.ProductionTrackingComponent),
        title: 'Production Tracking'
    },
    {
        path: 'downtime',
        loadComponent: () =>
            import('./features/downtime/downtime-list.component').then(m => m.DowntimeListComponent),
        title: 'Downtime List'
    },
    {
        path: 'downtime-list',
        loadComponent: () =>
            import('./features/downtime/downtime-list.component').then(m => m.DowntimeListComponent),
        title: 'Downtime List'
    },
    {
        path: 'production',
        loadComponent: () =>
            import('@features/production/production.component').then(m => m.ProductionComponent),
        title: 'Production Entry'
    },
    {
        path: 'production-list',
        loadComponent: () =>
            import('@features/production/production-list.component').then(m => m.ProductionListComponent),
        title: 'Production History'
    },
    {
        path: 'downtime-declaration',
        loadComponent: () =>
            import('./features/downtime/downtime-declaration.component').then(m => m.DowntimeDeclarationComponent),
        title: 'Downtime Declaration'
    },
    {
        path: 'profile',
        loadComponent: () =>
            import('@features/profile/profile.component').then(m => m.ProfileComponent),
        title: 'My Profile'
    },
    {
        path: 'user-settings',
        loadComponent: () =>
            import('@features/settings/user-settings.component').then(m => m.UserSettingsComponent),
        title: 'User Settings'
    },
    {
        path: 'qualified-employees',
        loadComponent: () =>
            import('./features/qualified-employees/qualified-employees.component').then(m => m.QualifiedEmployeesComponent),
        title: 'Qualified Employees'
    }
];

export default DMS_PRODUCTION_ROUTES;
