/**
 * DMS-Admin Routes
 * Domain: User & Permission Administration
 */
import { Routes } from '@angular/router';

export const DMS_ADMIN_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/admin-dashboard/admin-dashboard.component')
                .then(m => m.AdminDashboardComponent),
        title: 'Admin Dashboard'
    },
    {
        path: 'users',
        loadComponent: () =>
            import('./features/users-management/users-list.component')
                .then(m => m.UsersListComponent),
        title: 'Gestion Utilisateurs'
    },
    {
        path: 'activity-logs',
        loadComponent: () =>
            import('./features/activity-logs/activity-logs.component')
                .then(m => m.ActivityLogsComponent),
        title: 'Logs d\'activité'
    }
];

export default DMS_ADMIN_ROUTES;
