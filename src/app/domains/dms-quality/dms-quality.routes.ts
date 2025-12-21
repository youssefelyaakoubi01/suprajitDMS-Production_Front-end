/**
 * DMS-Quality Routes
 * Domain: Quality Control Management
 *
 * Uses new standalone components from the domains structure.
 */
import { Routes } from '@angular/router';

export const DMS_QUALITY_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/dashboard/quality-dashboard.component').then(m => m.QualityDashboardComponent),
        title: 'Quality Dashboard'
    },
    {
        path: 'defects',
        loadComponent: () =>
            import('./features/defects/defects-list.component').then(m => m.DefectsListComponent),
        title: 'Defects List'
    }
];

export default DMS_QUALITY_ROUTES;
