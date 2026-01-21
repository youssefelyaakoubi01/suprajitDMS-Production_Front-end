/**
 * DMS-RH Models - Non-Qualified Assignment
 * Domain: Human Resources Management
 *
 * Tracks assignments where employees are assigned to workstations
 * without valid qualifications for traceability purposes.
 */

export interface NonQualifiedAssignment {
    id: number;
    employee_id: number;
    employee_name: string;
    employee_badge: string;
    employee_picture?: string;
    workstation_id: number;
    workstation_name: string;
    workstation_code: string;
    production_line_id: number;
    production_line_name: string;
    machine_id?: number;
    machine_name?: string;
    required_qualification?: string;
    assignment_date: Date;
    assigned_by: number;
    assigned_by_name: string;
    reason?: string;
    status: 'active' | 'resolved' | 'acknowledged';
    resolved_date?: Date;
    resolved_by?: number;
    resolved_by_name?: string;
    notes?: string;
    created_at: Date;
    updated_at: Date;
}

export interface NonQualifiedAssignmentCreate {
    employee_id: number;
    workstation_id: number;
    machine_id?: number;
    hourly_production_id?: number;
    reason?: string;
}

export interface NonQualifiedAssignmentStats {
    total: number;
    active: number;
    resolved: number;
    acknowledged: number;
    by_production_line: { line_id: number; line_name: string; count: number }[];
}

export interface QualificationCheckResult {
    is_qualified: boolean;
    qualification_valid: boolean;
    qualification_end_date: Date | null;
    qualification_name: string | null;
}
