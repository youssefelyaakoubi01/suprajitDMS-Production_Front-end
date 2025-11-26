import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { AppDmsLayout } from './app/layout/component/app.dms-layout';

export const appRoutes: Routes = [
    {
        path: '',
        redirectTo: 'dms-login',
        pathMatch: 'full'
    },
    {
        path: 'dms-login',
        loadComponent: () => import('./app/features/dms-login/dms-login.component').then(m => m.DmsLoginComponent)
    },
    {
        path: 'dms-production',
        component: AppDmsLayout,
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./app/features/dashboard/dashboard.component').then(m => m.DmsDashboardComponent)
            },
            {
                path: 'production',
                loadComponent: () => import('./app/features/production/production.component').then(m => m.ProductionComponent)
            },
            {
                path: 'production-list',
                loadComponent: () => import('./app/features/production/production-list.component').then(m => m.ProductionListComponent)
            },
            {
                path: 'downtime-list',
                loadComponent: () => import('./app/features/downtime-list/downtime-list.component').then(m => m.DowntimeListComponent)
            },
            {
                path: 'settings/shifts',
                loadComponent: () => import('./app/features/settings/shifts.component').then(m => m.ShiftsComponent)
            }
        ]
    },
    {
        path: '',
        component: AppLayout,
        children: [
            {
                path: 'inventory',
                loadComponent: () => import('./app/features/inventory/inventory.component').then(m => m.InventoryComponent)
            },
            {
                path: 'hr',
                loadComponent: () => import('./app/features/hr/hr.component').then(m => m.HrComponent)
            },
            {
                path: 'quality',
                loadComponent: () => import('./app/features/quality/quality.component').then(m => m.QualityComponent)
            },
            {
                path: 'maintenance',
                loadComponent: () => import('./app/features/maintenance/maintenance.component').then(m => m.MaintenanceComponent)
            },
            {
                path: 'kpi',
                loadComponent: () => import('./app/features/kpi/kpi.component').then(m => m.KpiComponent)
            },
            {
                path: 'lessons',
                loadComponent: () => import('./app/features/lessons/lessons.component').then(m => m.LessonsComponent)
            },
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
