/**
 * DMS-RH Models - Team
 * Domain: Human Resources Management
 */

// ==================== TEAM ====================
export interface Team {
    id?: number;
    name: string;
    code: string;
    description?: string;
    memberCount?: number;
    leader?: string;
    // Legacy
    teamID?: number;
    teamName?: string;
}

// ==================== TEAM MEMBER ====================
export interface TeamMember {
    id: number;
    teamId: number;
    employeeId: number;
    role: 'leader' | 'member';
    assignedDate: Date;
}

// ==================== TEAM STATS ====================
export interface TeamStats {
    teamId: number;
    teamName: string;
    memberCount: number;
    avgVersatility: number;
    qualificationRate: number;
}
