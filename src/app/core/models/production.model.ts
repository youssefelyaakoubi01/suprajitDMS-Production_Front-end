export interface ProductionLine {
    id: number;
    name: string;
    project: string;
    projectId: number;
    status: 'running' | 'downtime' | 'setup';
    efficiency: number;
    output: number;
    target: number;
}

export interface HourlyProduction {
    Id_HourlyProd: number;
    Date_HourlyProd: Date;
    Shift_HourlyProd: string;
    Hour_HourlyProd: number;
    Id_Part: number;
    Result_HourlyProdPN: number;
    Target_HourlyProdPN: number;
    HC_HourlyProdPN: number;
    Id_ProdLine: number;
    Scrap_HourlyProdPN?: number;
}

export interface Part {
    Id_Part: number;
    PN_Part: string;
    Id_Project: number;
    ShiftTarget_Part: number;
    ScrapTarget_Part: number; // Target maximum scrap per shift
    Price_Part: number;
    Efficiency: number;
    MATSTATUS: string;
}

export interface Project {
    Id_Project: number;
    Name_Project: string;
    Code_Project: string;
    Status_Project: string;
}

export interface Downtime {
    Id_Downtime: number;
    Total_Downtime: number;
    Comment_Downtime: string;
    Id_HourlyProd: number;
    Id_DowntimeProblems: number;
    zone?: number;
    zone_name?: string;
    zone_code?: string;
    machine?: number;
    machine_name?: string;
    machine_code?: string;
    // Additional display fields
    production_line_name?: string;
    project_name?: string;
    workstation_name?: string;
    date?: string;
    shift_name?: string;
    hour?: number;
    status?: string;
    resolution?: string;
    assigned_to?: string;
    created_at?: string;
}

export interface DowntimeProblem {
    id?: number;
    name: string;
    code: string;
    category: 'mechanical' | 'electrical' | 'quality' | 'material' | 'manpower' | 'other';
    description?: string;
    is_active: boolean;
    // Legacy fields for backward compatibility
    Id_DowntimeProblems?: number;
    Name_DowntimeProblems?: string;
    Category_DowntimeProblems?: string;
}

export interface Workstation {
    id: number;
    name: string;
    code: string;
    description?: string;
    production_line: number;
    production_line_name?: string;
    project?: number;
    project_name?: string;
    process_order?: number;
    process_mode?: string;
    typ_order?: number;
    cycle_time_seconds?: number;
    max_operators?: number;
    is_critical?: boolean;
    is_active?: boolean;
    machines_count?: number;
    // Legacy fields for backward compatibility
    Id_Workstation?: number;
    Name_Workstation?: string;
    Code_Workstation?: string;
    Id_ProdLine?: number;
}

export interface Machine {
    id: number;
    name: string;
    code: string;
    workstation: number;
    workstation_name?: string;
    workstation_code?: string;
    production_line_name?: string;
    production_line_id?: number;
    description?: string;
    manufacturer?: string;
    model_number?: string;
    serial_number?: string;
    status: 'operational' | 'maintenance' | 'breakdown' | 'idle';
    installation_date?: string;
    last_maintenance_date?: string;
    next_maintenance_date?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Shift {
    id: number;
    name: string;
    code: string;
    start_time: string;  // Format: "HH:MM:SS"
    end_time: string;    // Format: "HH:MM:SS"
    is_active: boolean;
    // Computed fields for frontend convenience
    startHour?: number;
    endHour?: number;
}

export interface ShiftType {
    id: number;
    name: string;
    code: string;
    target_percentage: number;  // 0-100: percentage of base target
    description?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export type ZoneType = 'production' | 'maintenance' | 'storage' | 'quality';

export interface Zone {
    id: number;
    name: string;
    code: string;
    description?: string;
    project?: number;
    project_name?: string;
    zone_type: ZoneType;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface PartLineAssignment {
    id: number;
    part: number;
    part_number?: string;
    part_name?: string;
    part_default_target?: number;
    production_line: number;
    line_name?: string;
    line_code?: string;
    project_name?: string;
    specific_target?: number;
    specific_efficiency?: number;
    specific_cycle_time?: number;
    effective_target?: number;
    effective_efficiency?: number;
    is_primary: boolean;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface HeadcountRequirement {
    id?: number;
    production_line: number;
    line_name?: string;
    line_code?: string;
    project_name?: string;
    part?: number;
    part_number?: string;
    part_name?: string;
    shift_type?: number;
    shift_type_name?: string;
    shift_type_code?: string;
    operators_required: number;
    technicians_required: number;
    quality_agents_required: number;
    total_required?: number;
    notes?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface TeamAssignment {
    Id_Assignment: number;
    Id_Emp: number;
    Id_Workstation: number;
    Id_HourlyProd: number;
    AssignedAt: Date;
}
