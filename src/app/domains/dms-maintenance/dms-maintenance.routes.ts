/**
 * DMS-Maintenance Routes
 * Domain: Maintenance Operations Management
 *
 * Routes based on sidebar menu from images:
 * - Open Tickets
 * - Dashboard
 * - Data
 * - Weekly Follow-up
 * - Production KPI
 */
import { Routes } from '@angular/router';

export const DMS_MAINTENANCE_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'open-tickets',
        pathMatch: 'full'
    },
    {
        path: 'open-tickets',
        loadComponent: () =>
            import('./features/tickets/open-tickets.component').then(m => m.OpenTicketsComponent),
        title: 'Open Tickets'
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/dashboard/maintenance-dashboard.component').then(m => m.MaintenanceDashboardComponent),
        title: 'Maintenance Dashboard'
    },
    {
        path: 'data',
        loadComponent: () =>
            import('./features/data/maintenance-data.component').then(m => m.MaintenanceDataComponent),
        title: 'Maintenance Data'
    },
    {
        path: 'weekly-followup',
        loadComponent: () =>
            import('./features/weekly-followup/weekly-followup.component').then(m => m.WeeklyFollowupComponent),
        title: 'Weekly Follow-up'
    },
    {
        path: 'production-kpi',
        loadComponent: () =>
            import('./features/production-kpi/production-kpi.component').then(m => m.ProductionKpiComponent),
        title: 'Production KPI'
    },
    // Legacy routes
    {
        path: 'tickets',
        loadComponent: () =>
            import('./features/tickets/tickets-list.component').then(m => m.TicketsListComponent),
        title: 'Maintenance Tickets'
    },
    {
        path: 'legacy',
        loadComponent: () =>
            import('@features/maintenance/maintenance.component').then(m => m.MaintenanceComponent),
        title: 'Maintenance (Legacy)'
    }
];

export default DMS_MAINTENANCE_ROUTES;
