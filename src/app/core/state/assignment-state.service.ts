import { Injectable, signal, computed } from '@angular/core';
import { EmployeeWorkstationAssignment, AssignmentStats } from '../../domains/dms-rh/models/assignment.model';

/**
 * AssignmentStateService - Angular Signals-based state management for workstation assignments.
 *
 * This service provides reactive state management using Angular Signals, ensuring
 * automatic UI updates when assignment data changes. Includes built-in filtering
 * with computed signals and initialization tracking to prevent redundant API calls.
 */
@Injectable({ providedIn: 'root' })
export class AssignmentStateService {
    // ==================== Private Writable Signals ====================

    /** Core assignments data */
    private readonly _assignments = signal<EmployeeWorkstationAssignment[]>([]);

    /** Loading state */
    private readonly _loading = signal<boolean>(false);

    /** Data has been loaded at least once */
    private readonly _initialized = signal<boolean>(false);

    /** Search term filter */
    private readonly _searchTerm = signal<string>('');

    /** Workstation filter */
    private readonly _workstationFilter = signal<number | null>(null);

    /** Production line filter */
    private readonly _productionLineFilter = signal<number | null>(null);

    /** Primary assignment filter */
    private readonly _isPrimaryFilter = signal<boolean | null>(null);

    // ==================== Public Readonly Signals ====================

    /** Read-only access to assignments array */
    readonly assignments = this._assignments.asReadonly();

    /** Read-only access to loading state */
    readonly loading = this._loading.asReadonly();

    /** Read-only access to initialized state */
    readonly initialized = this._initialized.asReadonly();

    /** Read-only access to search term */
    readonly searchTerm = this._searchTerm.asReadonly();

    // ==================== Computed Signals ====================

    /**
     * Filtered assignments - automatically recalculated when any filter changes.
     */
    readonly filteredAssignments = computed(() => {
        let result = this._assignments();

        const search = this._searchTerm().toLowerCase().trim();
        const workstationId = this._workstationFilter();
        const productionLineId = this._productionLineFilter();
        const isPrimary = this._isPrimaryFilter();

        // Filter by search term
        if (search) {
            result = result.filter(a =>
                a.employee_name?.toLowerCase().includes(search) ||
                a.employee_badge?.toLowerCase().includes(search) ||
                a.workstation_name?.toLowerCase().includes(search) ||
                a.machine_name?.toLowerCase().includes(search) ||
                a.production_line_name?.toLowerCase().includes(search)
            );
        }

        // Filter by workstation
        if (workstationId !== null) {
            result = result.filter(a => a.workstation === workstationId);
        }

        // Filter by production line
        if (productionLineId !== null) {
            result = result.filter(a => a.production_line_id === productionLineId);
        }

        // Filter by primary status
        if (isPrimary !== null) {
            result = result.filter(a => a.is_primary === isPrimary);
        }

        return result;
    });

    /**
     * Statistics computed from the full assignments list.
     */
    readonly stats = computed<AssignmentStats>(() => {
        const assignments = this._assignments();

        // Group by workstation for stats
        const byWorkstation = new Map<string, number>();
        const employeesWithAssignments = new Set<number>();
        const employeesWithPrimary = new Set<number>();

        assignments.forEach(a => {
            // Count by workstation
            const wsName = a.workstation_name || 'Unknown';
            byWorkstation.set(wsName, (byWorkstation.get(wsName) || 0) + 1);

            // Track unique employees
            employeesWithAssignments.add(a.employee);
            if (a.is_primary) {
                employeesWithPrimary.add(a.employee);
            }
        });

        return {
            total_assignments: assignments.length,
            employees_with_assignments: employeesWithAssignments.size,
            employees_with_primary: employeesWithPrimary.size,
            by_workstation: Array.from(byWorkstation.entries()).map(([name, count]) => ({
                workstation__name: name,
                count
            }))
        };
    });

    /** Total assignment count */
    readonly assignmentCount = computed(() => this._assignments().length);

    /** Check if there are any active filters */
    readonly hasActiveFilters = computed(() => {
        return this._searchTerm().trim() !== '' ||
               this._workstationFilter() !== null ||
               this._productionLineFilter() !== null ||
               this._isPrimaryFilter() !== null;
    });

    // ==================== State Mutations ====================

    /**
     * Set loading state
     */
    setLoading(loading: boolean): void {
        this._loading.set(loading);
    }

    /**
     * Set initialized state
     */
    setInitialized(initialized: boolean): void {
        this._initialized.set(initialized);
    }

    /**
     * Check if data needs to be loaded
     */
    needsLoading(): boolean {
        return !this._initialized() && !this._loading();
    }

    /**
     * Set the full assignments list (replaces existing data)
     */
    setAssignments(assignments: EmployeeWorkstationAssignment[]): void {
        this._assignments.set(assignments);
        this._initialized.set(true);
    }

    /**
     * Add a new assignment (immutable update)
     */
    addAssignment(assignment: EmployeeWorkstationAssignment): void {
        this._assignments.update(current => [...current, assignment]);
    }

    /**
     * Update an existing assignment by ID (immutable update)
     */
    updateAssignment(id: number, updated: EmployeeWorkstationAssignment): void {
        this._assignments.update(current =>
            current.map(a => a.id === id ? { ...a, ...updated } : a)
        );
    }

    /**
     * Remove an assignment by ID (immutable update)
     */
    removeAssignment(id: number): void {
        this._assignments.update(current =>
            current.filter(a => a.id !== id)
        );
    }

    /**
     * Check if an employee has an assignment for a specific workstation
     */
    hasAssignment(employeeId: number, workstationId: number): boolean {
        return this._assignments().some(
            a => a.employee === employeeId && a.workstation === workstationId
        );
    }

    /**
     * Get assignments for a specific employee
     */
    getEmployeeAssignments(employeeId: number): EmployeeWorkstationAssignment[] {
        return this._assignments().filter(a => a.employee === employeeId);
    }

    /**
     * Get primary assignment for an employee
     */
    getPrimaryAssignment(employeeId: number): EmployeeWorkstationAssignment | undefined {
        return this._assignments().find(a => a.employee === employeeId && a.is_primary);
    }

    // ==================== Filter Mutations ====================

    /**
     * Set search term filter
     */
    setSearchTerm(term: string): void {
        this._searchTerm.set(term);
    }

    /**
     * Set workstation filter
     */
    setWorkstationFilter(workstationId: number | null): void {
        this._workstationFilter.set(workstationId);
    }

    /**
     * Set production line filter
     */
    setProductionLineFilter(productionLineId: number | null): void {
        this._productionLineFilter.set(productionLineId);
    }

    /**
     * Set primary filter
     */
    setIsPrimaryFilter(isPrimary: boolean | null): void {
        this._isPrimaryFilter.set(isPrimary);
    }

    /**
     * Clear all filters
     */
    clearFilters(): void {
        this._searchTerm.set('');
        this._workstationFilter.set(null);
        this._productionLineFilter.set(null);
        this._isPrimaryFilter.set(null);
    }

    /**
     * Force reload on next access
     */
    invalidate(): void {
        this._initialized.set(false);
    }

    /**
     * Reset state (clear assignments, filters, and initialized flag)
     */
    reset(): void {
        this._assignments.set([]);
        this._loading.set(false);
        this._initialized.set(false);
        this.clearFilters();
    }
}
