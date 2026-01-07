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
 * - Shift Targets & Headcount
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
        path: 'targets',
        loadComponent: () =>
            import('./features/targets.component').then(m => m.TargetsComponent),
        title: 'Targets Configuration'
    },
    {
        path: 'part-line-assignments',
        loadComponent: () =>
            import('./features/part-line-assignments.component').then(m => m.PartLineAssignmentsComponent),
        title: 'Part-Line Assignments'
    },
    {
        path: 'headcount-config',
        loadComponent: () =>
            import('./features/headcount-config.component').then(m => m.HeadcountConfigComponent),
        title: 'Headcount Configuration'
    },
    {
        path: 'problem-types',
        loadComponent: () =>
            import('./features/problem-types.component').then(m => m.ProblemTypesComponent),
        title: 'Problem Types Management'
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
    }
];

export default DMS_TECH_ROUTES;
