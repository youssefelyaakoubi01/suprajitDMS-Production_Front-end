/**
 * DMS-RH Routes
 * Domain: Human Resources Management
 *
 * Uses the existing well-styled HrComponent which contains all HR functionality
 * in a single component with tabs: Dashboard, Employees, Formations, Versatility,
 * Recyclage, Teams, Users, Licenses, Workstations.
 */
import { Routes } from '@angular/router';

export const DMS_RH_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    // All routes use the existing HrComponent with different tab data
    {
        path: 'dashboard',
        loadComponent: () =>
            import('@features/hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'dashboard' },
        title: 'RH Dashboard'
    },
    {
        path: 'employees',
        loadComponent: () =>
            import('@features/hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'employees' },
        title: 'Employees'
    },
    {
        path: 'formations',
        loadComponent: () =>
            import('@features/hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'formations' },
        title: 'Formations'
    },
    {
        path: 'versatility',
        loadComponent: () =>
            import('@features/hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'versatility' },
        title: 'Versatility Matrix'
    },
    {
        path: 'recyclage',
        loadComponent: () =>
            import('@features/hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'recyclage' },
        title: 'Recyclage'
    },
    {
        path: 'teams',
        loadComponent: () =>
            import('@features/hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'teams' },
        title: 'Teams & Trainers'
    },
    {
        path: 'users',
        loadComponent: () =>
            import('@features/hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'users' },
        title: 'Users & Access'
    },
    {
        path: 'licenses',
        loadComponent: () =>
            import('@features/hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'licenses' },
        title: 'Licenses Manager'
    },
    {
        path: 'workstations',
        loadComponent: () =>
            import('@features/hr/hr.component').then(m => m.HrComponent),
        data: { tab: 'workstations' },
        title: 'Workstations'
    }
];

export default DMS_RH_ROUTES;
