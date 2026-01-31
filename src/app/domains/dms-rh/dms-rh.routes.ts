/**
 * DMS-RH Routes
 * Domain: Human Resources Management
 *
 * Each route loads a separate lightweight component for optimal performance.
 * Components are lazy-loaded and split into separate chunks.
 */
import { Routes } from '@angular/router';

export const DMS_RH_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/rh-dashboard/rh-dashboard.component').then(m => m.RhDashboardComponent),
        title: 'RH Dashboard'
    },
    {
        path: 'employees',
        loadComponent: () =>
            import('./features/employees/employees-list.component').then(m => m.EmployeesListComponent),
        title: 'Employees'
    },
    {
        path: 'categories',
        loadComponent: () =>
            import('./features/categories/categories-list.component').then(m => m.CategoriesListComponent),
        title: 'Catégories'
    },
    {
        path: 'formations',
        loadComponent: () =>
            import('./features/formations/formations-list.component').then(m => m.FormationsListComponent),
        title: 'Formations'
    },
    {
        path: 'processes',
        loadComponent: () =>
            import('./features/processes/processes-list.component').then(m => m.ProcessesListComponent),
        title: 'Processus'
    },
    {
        path: 'qualifications',
        loadComponent: () =>
            import('./features/qualifications/qualifications-list.component').then(m => m.QualificationsListComponent),
        title: 'Qualifications'
    },
    {
        path: 'recyclage',
        loadComponent: () =>
            import('./features/recyclage/recyclage-list.component').then(m => m.RecyclageListComponent),
        title: 'Recyclage'
    },
    {
        path: 'users',
        loadComponent: () =>
            import('./features/users/users-list.component').then(m => m.UsersListComponent),
        title: 'Users & Access'
    },
    {
        path: 'qualifications-list',
        loadComponent: () =>
            import('./features/qualifications/qualifications-list.component').then(m => m.QualificationsListComponent),
        title: 'Gestion des Qualifications'
    },
    {
        path: 'formateurs',
        loadComponent: () =>
            import('./features/formateurs/formateurs-list.component').then(m => m.FormateursListComponent),
        title: 'Formateurs'
    },
    {
        path: 'presences',
        loadComponent: () =>
            import('./features/presences/presences-list.component').then(m => m.PresencesListComponent),
        title: 'Gestion des Présences'
    },
    {
        path: 'non-qualified-assignments',
        loadComponent: () =>
            import('./features/non-qualified-assignments/non-qualified-assignments.component').then(m => m.NonQualifiedAssignmentsComponent),
        title: 'Affectations Non Qualifiées'
    },
    {
        path: 'departements',
        loadComponent: () =>
            import('./features/departements/departements-list.component').then(m => m.DepartementsListComponent),
        title: 'Départements'
    }
];

export default DMS_RH_ROUTES;
