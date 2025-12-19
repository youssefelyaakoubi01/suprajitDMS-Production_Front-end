/**
 * DMS-Analytics Routes
 * Domain: Analytics & Reporting
 */
import { Routes } from '@angular/router';

export const DMS_ANALYTICS_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'kpi',
        pathMatch: 'full'
    },
    {
        path: 'kpi',
        loadComponent: () =>
            import('@features/kpi/kpi.component').then(m => m.KpiComponent),
        title: 'KPI Dashboard'
    },
    {
        path: 'lessons',
        loadComponent: () =>
            import('@features/lessons/lessons.component').then(m => m.LessonsComponent),
        title: 'Lessons Learned'
    }
    // TODO: Add more analytics-specific routes as features are developed
    // {
    //     path: 'reports',
    //     loadComponent: () =>
    //         import('./features/reports/reports.component').then(m => m.ReportsComponent),
    //     title: 'Reports'
    // }
];

export default DMS_ANALYTICS_ROUTES;
