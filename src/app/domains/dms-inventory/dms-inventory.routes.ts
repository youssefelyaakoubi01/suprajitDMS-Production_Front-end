/**
 * DMS-Inventory Routes
 * Domain: Inventory & Stock Management
 *
 * Uses new standalone components from the domains structure.
 */
import { Routes } from '@angular/router';

export const DMS_INVENTORY_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/dashboard/inventory-dashboard.component').then(m => m.InventoryDashboardComponent),
        title: 'Inventory Dashboard'
    },
    {
        path: 'parts',
        loadComponent: () =>
            import('./features/parts/parts-list.component').then(m => m.PartsListComponent),
        title: 'Parts List'
    },
    // Legacy route - fallback to old component
    {
        path: 'legacy',
        loadComponent: () =>
            import('@features/inventory/inventory.component').then(m => m.InventoryComponent),
        title: 'Inventory (Legacy)'
    }
];

export default DMS_INVENTORY_ROUTES;
