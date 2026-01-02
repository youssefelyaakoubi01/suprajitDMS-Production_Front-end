import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EmployeeWithAssignment, ProductionRole } from '../models/employee.model';

const SESSION_STORAGE_KEY = 'dms_production_session';

export interface TeamByRole {
    operators: EmployeeWithAssignment[];
    lineLeaders: EmployeeWithAssignment[];
    qualityAgents: EmployeeWithAssignment[];
    maintenanceTechs: EmployeeWithAssignment[];
    pqc: EmployeeWithAssignment[];
}

/**
 * TeamAssignmentStateService - Angular Signals-based state management for team assignments.
 *
 * This service provides reactive state management for the production team assignments,
 * ensuring automatic UI updates when team members are added or removed. Includes
 * automatic localStorage synchronization via effect().
 */
@Injectable({ providedIn: 'root' })
export class TeamAssignmentStateService {
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);

    // ==================== Private Writable Signals ====================

    /** Team members array */
    private readonly _team = signal<EmployeeWithAssignment[]>([]);

    /** Loading state */
    private readonly _loading = signal<boolean>(false);

    /** Flag to prevent localStorage sync during restoration */
    private _isRestoring = false;

    // ==================== Public Readonly Signals ====================

    /** Read-only access to team array */
    readonly team = this._team.asReadonly();

    /** Read-only access to loading state */
    readonly loading = this._loading.asReadonly();

    // ==================== Computed Signals ====================

    /** Team member count */
    readonly teamCount = computed(() => this._team().length);

    /** Check if team has at least one member */
    readonly isTeamComplete = computed(() => this._team().length > 0);

    /** Group team members by role */
    readonly teamByRole = computed<TeamByRole>(() => {
        const team = this._team();
        return {
            operators: team.filter(m => m.role === 'operator' || !m.role),
            lineLeaders: team.filter(m => m.role === 'line_leader'),
            qualityAgents: team.filter(m => m.role === 'quality_agent'),
            maintenanceTechs: team.filter(m => m.role === 'maintenance_tech'),
            pqc: team.filter(m => m.role === 'pqc')
        };
    });

    /** Get unique workstations from team */
    readonly assignedWorkstations = computed(() => {
        const workstations = new Set<string>();
        this._team().forEach(m => {
            if (m.workstation) {
                workstations.add(m.workstation);
            }
        });
        return Array.from(workstations);
    });

    constructor() {
        // Effect: Automatically sync team to localStorage when it changes
        if (this.isBrowser) {
            effect(() => {
                const team = this._team();

                // Skip sync during restoration to avoid circular updates
                if (this._isRestoring) {
                    return;
                }

                // Sync to localStorage
                this.syncTeamToLocalStorage(team);
            });
        }
    }

    // ==================== State Mutations ====================

    /**
     * Set loading state
     */
    setLoading(loading: boolean): void {
        this._loading.set(loading);
    }

    /**
     * Set the full team list (replaces existing data)
     */
    setTeam(team: EmployeeWithAssignment[]): void {
        this._team.set(team);
    }

    /**
     * Add a new team member (immutable update).
     * Returns false if employee is already in team.
     */
    addMember(member: EmployeeWithAssignment): boolean {
        // Check for duplicates
        if (this._team().some(m => m.Id_Emp === member.Id_Emp)) {
            return false;
        }
        this._team.update(current => [...current, member]);
        return true;
    }

    /**
     * Remove a team member by employee ID (immutable update)
     */
    removeMember(employeeId: number): void {
        this._team.update(current =>
            current.filter(m => m.Id_Emp !== employeeId)
        );
    }

    /**
     * Update a team member's properties (immutable update)
     */
    updateMember(employeeId: number, updates: Partial<EmployeeWithAssignment>): void {
        this._team.update(current =>
            current.map(m => m.Id_Emp === employeeId ? { ...m, ...updates } : m)
        );
    }

    /**
     * Update a team member's role
     */
    updateMemberRole(employeeId: number, role: ProductionRole): void {
        this.updateMember(employeeId, { role });
    }

    /**
     * Update a team member's workstation
     */
    updateMemberWorkstation(employeeId: number, workstation: string, workstationId?: number): void {
        this.updateMember(employeeId, { workstation, workstationId });
    }

    /**
     * Clear all team members
     */
    clearTeam(): void {
        this._team.set([]);
    }

    /**
     * Check if an employee is already in the team
     */
    isEmployeeInTeam(employeeId: number): boolean {
        return this._team().some(m => m.Id_Emp === employeeId);
    }

    /**
     * Get a team member by employee ID
     */
    getMember(employeeId: number): EmployeeWithAssignment | undefined {
        return this._team().find(m => m.Id_Emp === employeeId);
    }

    // ==================== localStorage Integration ====================

    /**
     * Sync team array to localStorage (updates only the team portion of the session)
     */
    private syncTeamToLocalStorage(team: EmployeeWithAssignment[]): void {
        if (!this.isBrowser) return;

        try {
            const savedData = localStorage.getItem(SESSION_STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                parsed.session.team = team;
                parsed.timestamp = new Date().toISOString();
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
            }
        } catch (e) {
            console.error('[TeamAssignmentStateService] Error syncing team to localStorage:', e);
        }
    }

    /**
     * Load team from localStorage and set it in the signal.
     * Returns the loaded team array.
     */
    loadFromLocalStorage(): EmployeeWithAssignment[] {
        if (!this.isBrowser) return [];

        try {
            this._isRestoring = true;
            const savedData = localStorage.getItem(SESSION_STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                const team = parsed.session?.team || [];
                this._team.set(team);
                return team;
            }
        } catch (e) {
            console.error('[TeamAssignmentStateService] Error loading team from localStorage:', e);
        } finally {
            // Reset restoration flag after a tick to allow effect to run
            setTimeout(() => {
                this._isRestoring = false;
            }, 0);
        }
        return [];
    }

    /**
     * Check if there's a saved session with team data
     */
    hasSavedSession(): boolean {
        if (!this.isBrowser) return false;

        try {
            const savedData = localStorage.getItem(SESSION_STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                return parsed.session?.team && parsed.session.team.length > 0;
            }
        } catch (e) {
            console.error('[TeamAssignmentStateService] Error checking saved session:', e);
        }
        return false;
    }

    /**
     * Reset state (clear team and loading)
     */
    reset(): void {
        this._team.set([]);
        this._loading.set(false);
    }
}
