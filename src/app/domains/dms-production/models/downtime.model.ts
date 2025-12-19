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
