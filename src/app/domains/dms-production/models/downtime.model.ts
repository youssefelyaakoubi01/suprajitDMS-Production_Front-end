/**
 * DMS-Production Models - Downtime
 * Domain: Production Management
 */

// ==================== DOWNTIME ====================
export interface Downtime {
    Id_Downtime: number;
    Total_Downtime: number;
    Comment_Downtime: string;
    Id_HourlyProd: number;
    Id_DowntimeProblems: number;
    machine?: number;
    machine_name?: string;
    machine_code?: string;
    // Fields from backend serializer (actual field names from API)
    id?: number;              // Backend uses 'id' instead of 'Id_Downtime'
    duration?: number;        // Backend uses 'duration' instead of 'Total_Downtime'
    comment?: string;         // Backend uses 'comment' instead of 'Comment_Downtime'
    problem?: number;         // Backend uses 'problem' instead of 'Id_DowntimeProblems'
    hourly_production_id?: number; // Backend uses 'hourly_production_id'
    // Fields from backend serializer (via HourlyProduction)
    date?: string;
    hour?: number;
    shift_name?: string;
    production_line_name?: string;
    project_name?: string;
    workstation_name?: string;
    part_number?: string;
    zone_name?: string;
    zone_code?: string;
    problem_name?: string;
    problem_category?: string;
    // Status and resolution fields
    status?: 'open' | 'in_progress' | 'closed';
    resolution?: string;
    assigned_to?: string;
    closed_at?: string;
    leader_confirmed_at?: string;
    created_at?: string;
    updated_at?: string;
}

// ==================== DOWNTIME PROBLEM ====================
export interface DowntimeProblem {
    Id_DowntimeProblems: number;
    Name_DowntimeProblems: string;
    Category_DowntimeProblems?: string;
}

// ==================== DOWNTIME CATEGORY ====================
export interface DowntimeCategory {
    id: number;
    name: string;
    code: string;
    color?: string;
    is_active: boolean;
}

// ==================== DOWNTIME ANALYSIS ====================
export interface DowntimeAnalysis {
    problemId: number;
    problemName: string;
    category: string;
    totalMinutes: number;
    occurrences: number;
    percentage: number;
}

export interface DowntimeByHour {
    hour: number;
    totalMinutes: number;
    problems: DowntimeAnalysis[];
}

// ==================== DOWNTIME FORM ====================
export interface DowntimeCreatePayload {
    Total_Downtime: number;
    Comment_Downtime: string;
    Id_HourlyProd: number;
    Id_DowntimeProblems: number;
    machine?: number;
}

export interface DowntimeUpdatePayload extends Partial<DowntimeCreatePayload> {
    Id_Downtime: number;
}
