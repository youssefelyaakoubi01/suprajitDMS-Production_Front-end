import { Injectable, signal, computed } from '@angular/core';
import { Employee, Team, Department } from '../models/employee.model';

/**
 * HRCacheStateService - Angular Signals-based cache for HR data.
 *
 * This service replaces the BehaviorSubject-based caching in HRService,
 * providing reactive state management with automatic UI updates.
 * The cache is populated by HTTP calls and provides computed values
 * for common filtering operations.
 */
@Injectable({ providedIn: 'root' })
export class HRCacheStateService {
    // ==================== Private Writable Signals ====================

    /** Cached employees */
    private readonly _employees = signal<Employee[]>([]);

    /** Cached teams */
    private readonly _teams = signal<Team[]>([]);

    /** Cached departments */
    private readonly _departments = signal<Department[]>([]);

    /** Loading state for employees */
    private readonly _loadingEmployees = signal<boolean>(false);

    // ==================== Public Readonly Signals ====================

    /** Read-only access to employees cache */
    readonly employees = this._employees.asReadonly();

    /** Read-only access to teams cache */
    readonly teams = this._teams.asReadonly();

    /** Read-only access to departments cache */
    readonly departments = this._departments.asReadonly();

    /** Read-only access to employees loading state */
    readonly loadingEmployees = this._loadingEmployees.asReadonly();

    // ==================== Computed Signals ====================

    /** Active employees only (EmpStatus === 'active') */
    readonly activeEmployees = computed(() =>
        this._employees().filter(e => e.EmpStatus === 'active' || e.EmpStatus === 'Active')
    );

    /** Operators only (for qualification/recyclage forms) */
    readonly operatorEmployees = computed(() =>
        this._employees().filter(e => {
            const category = e.Categorie_Emp?.toLowerCase() || '';
            return category.includes('operator') || category.includes('op');
        })
    );

    /** Employee count */
    readonly employeeCount = computed(() => this._employees().length);

    /** Active employee count */
    readonly activeEmployeeCount = computed(() => this.activeEmployees().length);

    /** Employees grouped by department */
    readonly employeesByDepartment = computed(() => {
        const result = new Map<string, Employee[]>();
        this._employees().forEach(e => {
            const dept = e.Departement_Emp || 'Unknown';
            if (!result.has(dept)) {
                result.set(dept, []);
            }
            result.get(dept)!.push(e);
        });
        return result;
    });

    /** Employee count by department */
    readonly employeeCountByDepartment = computed(() => {
        const result = new Map<string, number>();
        this._employees().forEach(e => {
            const dept = e.Departement_Emp || 'Unknown';
            result.set(dept, (result.get(dept) || 0) + 1);
        });
        return result;
    });

    /** Employees grouped by category */
    readonly employeesByCategory = computed(() => {
        const result = new Map<string, Employee[]>();
        this._employees().forEach(e => {
            const category = e.Categorie_Emp || 'Unknown';
            if (!result.has(category)) {
                result.set(category, []);
            }
            result.get(category)!.push(e);
        });
        return result;
    });

    // ==================== Employee Mutations ====================

    /**
     * Set loading state for employees
     */
    setLoadingEmployees(loading: boolean): void {
        this._loadingEmployees.set(loading);
    }

    /**
     * Set the full employees list (replaces existing cache)
     */
    setEmployees(employees: Employee[]): void {
        this._employees.set(employees);
    }

    /**
     * Add a new employee to the cache (immutable update)
     */
    addEmployee(employee: Employee): void {
        this._employees.update(current => [...current, employee]);
    }

    /**
     * Update an existing employee by ID (immutable update)
     */
    updateEmployee(id: number, updated: Employee): void {
        this._employees.update(current =>
            current.map(e => e.Id_Emp === id ? { ...e, ...updated } : e)
        );
    }

    /**
     * Remove an employee by ID (immutable update)
     */
    removeEmployee(id: number): void {
        this._employees.update(current =>
            current.filter(e => e.Id_Emp !== id)
        );
    }

    /**
     * Get an employee by ID from cache
     */
    getEmployeeById(id: number): Employee | undefined {
        return this._employees().find(e => e.Id_Emp === id);
    }

    /**
     * Check if employees cache is empty
     */
    isEmployeesCacheEmpty(): boolean {
        return this._employees().length === 0;
    }

    // ==================== Team Mutations ====================

    /**
     * Set the full teams list (replaces existing cache)
     */
    setTeams(teams: Team[]): void {
        this._teams.set(teams);
    }

    /**
     * Add a new team to the cache (immutable update)
     */
    addTeam(team: Team): void {
        this._teams.update(current => [...current, team]);
    }

    /**
     * Update an existing team by ID (immutable update)
     */
    updateTeam(id: number, updated: Team): void {
        this._teams.update(current =>
            current.map(t => (t.id === id || t.teamID === id) ? { ...t, ...updated } : t)
        );
    }

    /**
     * Remove a team by ID (immutable update)
     */
    removeTeam(id: number): void {
        this._teams.update(current =>
            current.filter(t => t.id !== id && t.teamID !== id)
        );
    }

    /**
     * Check if teams cache is empty
     */
    isTeamsCacheEmpty(): boolean {
        return this._teams().length === 0;
    }

    // ==================== Department Mutations ====================

    /**
     * Set the full departments list (replaces existing cache)
     */
    setDepartments(departments: Department[]): void {
        this._departments.set(departments);
    }

    /**
     * Add a new department to the cache (immutable update)
     */
    addDepartment(department: Department): void {
        this._departments.update(current => [...current, department]);
    }

    /**
     * Update an existing department by ID (immutable update)
     */
    updateDepartment(id: number, updated: Department): void {
        this._departments.update(current =>
            current.map(d => d.id === id ? { ...d, ...updated } : d)
        );
    }

    /**
     * Remove a department by ID (immutable update)
     */
    removeDepartment(id: number): void {
        this._departments.update(current =>
            current.filter(d => d.id !== id)
        );
    }

    /**
     * Check if departments cache is empty
     */
    isDepartmentsCacheEmpty(): boolean {
        return this._departments().length === 0;
    }

    // ==================== Cache Management ====================

    /**
     * Clear all caches
     */
    clearAll(): void {
        this._employees.set([]);
        this._teams.set([]);
        this._departments.set([]);
        this._loadingEmployees.set(false);
    }

    /**
     * Clear employees cache only
     */
    clearEmployees(): void {
        this._employees.set([]);
    }

    /**
     * Clear teams cache only
     */
    clearTeams(): void {
        this._teams.set([]);
    }

    /**
     * Clear departments cache only
     */
    clearDepartments(): void {
        this._departments.set([]);
    }
}
