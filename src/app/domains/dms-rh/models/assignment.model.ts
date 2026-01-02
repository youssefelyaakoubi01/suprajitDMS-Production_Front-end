/**
 * DMS-RH Models - Employee Workstation Assignment
 * Domain: Human Resources Management
 * Used for managing employee default workstation/machine assignments
 */

/**
 * Full assignment record with read-only computed fields
 */
export interface EmployeeWorkstationAssignment {
    id: number;
    employee: number;
    employee_name?: string;
    employee_badge?: string;
    employee_picture?: string;
    workstation: number;
    workstation_name?: string;
    workstation_code?: string;
    machine?: number | null;
    machine_name?: string | null;
    production_line_id?: number;
    production_line_name?: string;
    is_primary: boolean;
    notes?: string;
    created_by?: string;
    created_at?: Date;
    updated_at?: Date;
}

/**
 * Request payload for creating/updating assignments
 */
export interface AssignmentCreateRequest {
    employee: number;
    workstation: number;
    machine?: number | null;
    is_primary: boolean;
    notes?: string;
    created_by?: string;
}

/**
 * Primary assignment response with qualification validation
 * Used by Production module when scanning employee badges
 */
export interface EmployeePrimaryAssignment {
    workstation_id: number;
    workstation_name: string;
    workstation_code: string;
    machine_id: number | null;
    machine_name: string | null;
    production_line_id: number;
    production_line_name: string;
    is_qualified: boolean;
    qualification_valid: boolean;
    qualification_end_date: Date | null;
    qualification_name: string | null;
}

/**
 * Statistics about workstation assignments
 */
export interface AssignmentStats {
    total_assignments: number;
    employees_with_assignments: number;
    employees_with_primary: number;
    by_workstation: { workstation__name: string; count: number }[];
}
