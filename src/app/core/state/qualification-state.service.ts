import { Injectable, signal, computed } from '@angular/core';
import { Qualification } from '../models/employee.model';

export interface QualificationStats {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    inProgress: number;
}

/**
 * QualificationStateService - Angular Signals-based state management for qualifications.
 *
 * This service provides reactive state management using Angular Signals, ensuring
 * automatic UI updates when qualification data changes. All mutations are immutable,
 * triggering proper change detection.
 */
@Injectable({ providedIn: 'root' })
export class QualificationStateService {
    // ==================== Private Writable Signals ====================

    /** Core qualifications data */
    private readonly _qualifications = signal<Qualification[]>([]);

    /** Loading state */
    private readonly _loading = signal<boolean>(false);

    /** Search term filter */
    private readonly _searchTerm = signal<string>('');

    /** Status filter (passed, failed, pending, in_progress) */
    private readonly _statusFilter = signal<string | null>(null);

    /** Employee ID filter */
    private readonly _employeeFilter = signal<number | null>(null);

    /** Formation ID filter */
    private readonly _formationFilter = signal<number | null>(null);

    // ==================== Public Readonly Signals ====================

    /** Read-only access to qualifications array */
    readonly qualifications = this._qualifications.asReadonly();

    /** Read-only access to loading state */
    readonly loading = this._loading.asReadonly();

    /** Read-only access to search term */
    readonly searchTerm = this._searchTerm.asReadonly();

    /** Read-only access to status filter */
    readonly statusFilter = this._statusFilter.asReadonly();

    // ==================== Computed Signals ====================

    /**
     * Filtered qualifications - automatically recalculated when any filter changes.
     * Combines search term, status, employee, and formation filters.
     */
    readonly filteredQualifications = computed(() => {
        let result = this._qualifications();

        const search = this._searchTerm().toLowerCase().trim();
        const status = this._statusFilter();
        const empId = this._employeeFilter();
        const formationId = this._formationFilter();

        // Filter by search term (employee name or formation name)
        if (search) {
            result = result.filter(q => {
                const employeeName = (q.Employee?.Nom_Emp || '').toLowerCase() + ' ' +
                                     (q.Employee?.Prenom_Emp || '').toLowerCase();
                const formationName = (q.Formation?.name || '').toLowerCase();
                const trainerName = (q.TrainerName || '').toLowerCase();

                return employeeName.includes(search) ||
                       formationName.includes(search) ||
                       trainerName.includes(search);
            });
        }

        // Filter by status
        if (status) {
            result = result.filter(q => q.test_result === status);
        }

        // Filter by employee ID
        if (empId) {
            result = result.filter(q => q.employee === empId);
        }

        // Filter by formation ID
        if (formationId) {
            result = result.filter(q => q.formation === formationId);
        }

        return result;
    });

    /**
     * Statistics computed from the full qualifications list.
     * Automatically recalculated when qualifications change.
     */
    readonly stats = computed<QualificationStats>(() => {
        const quals = this._qualifications();
        return {
            total: quals.length,
            passed: quals.filter(q => q.test_result === 'passed').length,
            failed: quals.filter(q => q.test_result === 'failed').length,
            pending: quals.filter(q => q.test_result === 'pending').length,
            inProgress: quals.filter(q => q.test_result === 'in_progress').length
        };
    });

    /**
     * Check if there are any active filters
     */
    readonly hasActiveFilters = computed(() => {
        return this._searchTerm().trim() !== '' ||
               this._statusFilter() !== null ||
               this._employeeFilter() !== null ||
               this._formationFilter() !== null;
    });

    // ==================== State Mutations ====================

    /**
     * Set loading state
     */
    setLoading(loading: boolean): void {
        this._loading.set(loading);
    }

    /**
     * Set the full qualifications list (replaces existing data)
     */
    setQualifications(qualifications: Qualification[]): void {
        this._qualifications.set(qualifications);
    }

    /**
     * Add a new qualification to the list (immutable update)
     */
    addQualification(qualification: Qualification): void {
        this._qualifications.update(current => [...current, qualification]);
    }

    /**
     * Update an existing qualification by ID (immutable update)
     * Preserves enriched fields (employee_name, formation_name, trainer_name)
     * when they are not present or null in the update
     */
    updateQualification(id: number, updated: Qualification): void {
        // Fields that should be preserved if the update doesn't include them
        const enrichedFields = ['employee_name', 'formation_name', 'trainer_name', 'employee_badge', 'employee_picture'];

        this._qualifications.update(current =>
            current.map(q => {
                if (q.id !== id) return q;

                // Create merged object, preserving enriched fields if update has null/undefined
                const merged = { ...q };
                for (const key in updated) {
                    const value = updated[key as keyof Qualification];
                    // For enriched fields, only update if the new value is truthy
                    if (enrichedFields.includes(key)) {
                        if (value != null && value !== '') {
                            (merged as any)[key] = value;
                        }
                        // else: keep existing value
                    } else {
                        // For other fields, always update
                        (merged as any)[key] = value;
                    }
                }
                return merged;
            })
        );
    }

    /**
     * Remove a qualification by ID (immutable update)
     */
    removeQualification(id: number): void {
        this._qualifications.update(current =>
            current.filter(q => q.id !== id)
        );
    }

    // ==================== Filter Mutations ====================

    /**
     * Set search term filter
     */
    setSearchTerm(term: string): void {
        this._searchTerm.set(term);
    }

    /**
     * Set status filter
     */
    setStatusFilter(status: string | null): void {
        this._statusFilter.set(status);
    }

    /**
     * Set employee filter
     */
    setEmployeeFilter(employeeId: number | null): void {
        this._employeeFilter.set(employeeId);
    }

    /**
     * Set formation filter
     */
    setFormationFilter(formationId: number | null): void {
        this._formationFilter.set(formationId);
    }

    /**
     * Clear all filters
     */
    clearFilters(): void {
        this._searchTerm.set('');
        this._statusFilter.set(null);
        this._employeeFilter.set(null);
        this._formationFilter.set(null);
    }

    /**
     * Reset state (clear qualifications and filters)
     */
    reset(): void {
        this._qualifications.set([]);
        this._loading.set(false);
        this.clearFilters();
    }
}
