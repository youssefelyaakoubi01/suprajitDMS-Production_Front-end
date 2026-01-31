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
    },
    {
        path: 'activity-logs/parts-history',
        loadComponent: () =>
            import('../dms-tech/features/parts-history.component')
                .then(m => m.PartsHistoryComponent),
        title: 'Parts History'
    },
    {
        path: 'activity-logs/projects-history',
        loadComponent: () =>
            import('../dms-tech/features/projects-history.component')
                .then(m => m.ProjectsHistoryComponent),
        title: 'Projects History'
    },
    {
        path: 'activity-logs/zones-history',
        loadComponent: () =>
            import('../dms-tech/features/zones-history.component')
                .then(m => m.ZonesHistoryComponent),
        title: 'Zones History'
    },
    {
        path: 'activity-logs/production-lines-history',
        loadComponent: () =>
            import('../dms-tech/features/production-lines-history.component')
                .then(m => m.ProductionLinesHistoryComponent),
        title: 'Production Lines History'
    },
    {
        path: 'activity-logs/processes-history',
        loadComponent: () =>
            import('../dms-tech/features/processes-history.component')
                .then(m => m.ProcessesHistoryComponent),
        title: 'Processes History'
    },
    {
        path: 'positions',
        loadComponent: () =>
            import('./features/positions/positions-list.component')
                .then(m => m.PositionsListComponent),
        title: 'Gestion des Positions'
    },
    // ==================== DATA IMPORT ====================
    {
        path: 'data-import',
        loadComponent: () =>
            import('./features/data-import/import-dashboard.component')
                .then(m => m.ImportDashboardComponent),
        title: 'Import de Données'
    },
    {
        path: 'data-import/preview',
        loadComponent: () =>
            import('./features/data-import/import-preview.component')
                .then(m => m.ImportPreviewComponent),
        title: 'Prévisualisation Import'
    },
    {
        path: 'data-import/execute',
        loadComponent: () =>
            import('./features/data-import/import-execution.component')
                .then(m => m.ImportExecutionComponent),
        title: 'Exécution Import'
    }
];

export default DMS_ADMIN_ROUTES;
