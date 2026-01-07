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
        path: 'qualifications',
        loadComponent: () =>
            import('./features/qualifications/qualifications-list.component').then(m => m.QualificationsListComponent),
        title: 'Qualifications'
    },
    {
        path: 'versatility',
        loadComponent: () =>
            import('./features/versatility/versatility-matrix.component').then(m => m.VersatilityMatrixComponent),
        title: 'Versatility Matrix'
    },
    {
        path: 'recyclage',
        loadComponent: () =>
            import('./features/recyclage/recyclage-list.component').then(m => m.RecyclageListComponent),
        title: 'Recyclage'
    },
    {
        path: 'teams',
        loadComponent: () =>
            import('./features/teams/teams-list.component').then(m => m.TeamsListComponent),
        title: 'Teams & Trainers'
    },
    {
        path: 'users',
        loadComponent: () =>
            import('./features/users/users-list.component').then(m => m.UsersListComponent),
        title: 'Users & Access'
    },
    {
        path: 'licenses',
        loadComponent: () =>
            import('./features/licenses/licenses-manager.component').then(m => m.LicensesManagerComponent),
        title: 'Licenses Manager'
    },
    {
        path: 'workstations',
        loadComponent: () =>
            import('./features/workstations/workstations-manager.component').then(m => m.WorkstationsManagerComponent),
        title: 'Workstations'
    },
    {
        path: 'affectations',
        loadComponent: () =>
            import('./features/affectations/affectations.component').then(m => m.AffectationsComponent),
        title: 'Workstation Assignments'
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
    }
];

export default DMS_RH_ROUTES;
