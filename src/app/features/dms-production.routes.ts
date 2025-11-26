import { Routes } from '@angular/router';

export default [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DmsDashboardComponent)
    },
    {
        path: 'production',
        loadComponent: () => import('./production/production.component').then(m => m.ProductionComponent)
    },
    {
        path: 'production-list',
        loadComponent: () => import('./production/production-list.component').then(m => m.ProductionListComponent)
    },
    {
        path: 'downtime-list',
        loadComponent: () => import('./downtime-list/downtime-list.component').then(m => m.DowntimeListComponent)
    },
    {
        path: 'settings/shifts',
        loadComponent: () => import('./settings/shifts.component').then(m => m.ShiftsComponent)
    }
] as Routes;
