import { Routes } from '@angular/router';

export default [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'dashboard' }
    },
    {
        path: 'employees',
        loadComponent: () => import('./hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'employees' }
    },
    {
        path: 'formations',
        loadComponent: () => import('./hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'formations' }
    },
    {
        path: 'qualifications',
        loadComponent: () => import('./hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'qualifications' }
    },
    {
        path: 'versatility',
        loadComponent: () => import('./hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'versatility' }
    },
    {
        path: 'recyclage',
        loadComponent: () => import('./hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'recyclage' }
    },
    {
        path: 'teams',
        loadComponent: () => import('./hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'teams' }
    }
] as Routes;
