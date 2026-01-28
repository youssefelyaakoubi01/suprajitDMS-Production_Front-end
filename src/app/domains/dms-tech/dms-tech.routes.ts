/**
 * DMS-Tech Routes
 * Domain: Technical Configuration & Data Management
 *
 * Module for configuring and managing production master data:
 * - Projects
 * - Production Lines
 * - Part Numbers
 * - Machines
 * - Zones
 * - Hourly Targets & Headcount
 */
import { Routes } from '@angular/router';

export const DMS_TECH_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/tech-dashboard.component').then(m => m.TechDashboardComponent),
        title: 'DMS-Tech Dashboard'
    },
    {
        path: 'projects',
        loadComponent: () =>
            import('./features/projects.component').then(m => m.ProjectsComponent),
        title: 'Projects Management'
    },
    {
        path: 'production-lines',
        loadComponent: () =>
            import('./features/production-lines.component').then(m => m.ProductionLinesComponent),
        title: 'Production Lines Management'
    },
    {
        path: 'parts',
        loadComponent: () =>
            import('./features/parts.component').then(m => m.PartsComponent),
        title: 'Parts Management'
    },
    {
        path: 'machines',
        loadComponent: () =>
            import('./features/machines.component').then(m => m.MachinesComponent),
        title: 'Machines Management'
    },
    {
        path: 'zones',
        loadComponent: () =>
            import('./features/zones.component').then(m => m.ZonesComponent),
        title: 'Zones Management'
    },
    {
        path: 'workstations',
        loadComponent: () =>
            import('./features/workstations.component').then(m => m.WorkstationsComponent),
        title: 'Workstations Management'
    },
    {
        path: 'processes',
        loadComponent: () =>
            import('./features/processes.component').then(m => m.ProcessesComponent),
        title: 'Processes Management'
    },
    {
        path: 'shifts',
        loadComponent: () =>
            import('./features/shifts.component').then(m => m.ShiftsComponent),
        title: 'Shifts Management'
    },
    {
        path: 'shift-types',
        loadComponent: () =>
            import('./features/shift-types.component').then(m => m.ShiftTypesComponent),
        title: 'Shift Types Management'
    },
    {
        path: 'mh-calculator',
        loadComponent: () =>
            import('./features/mh-calculator.component').then(m => m.MHCalculatorComponent),
        title: 'MH Calculator'
    }
];

export default DMS_TECH_ROUTES;
