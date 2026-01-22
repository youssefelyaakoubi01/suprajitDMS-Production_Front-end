/**
 * DMS-Production Models
 * Domain: Production Management
 */

// ==================== PRODUCTION LINE ====================
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

// ==================== HOURLY PRODUCTION ====================
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
    partNumber?: string;
    efficiency?: number;
    downtimes?: HourlyProductionDowntime[];
}

// ==================== HOURLY PRODUCTION DOWNTIME ====================
export interface HourlyProductionDowntime {
    id: number;
    duration: number;
    comment: string;
    problem: number;
    problem_name?: string;
    machine?: number;
    machine_name?: string;
    status?: string;
}

// ==================== PART ====================
export interface Part {
    Id_Part: number;
    PN_Part: string;
    Id_Project: number;
    ShiftTarget_Part: number;
    ScrapTarget_Part: number;
    Price_Part: number;
    Efficiency: number;
    MATSTATUS: string;
}

// ==================== PROJECT ====================
export interface Project {
    Id_Project: number;
    Name_Project: string;
    Code_Project: string;
    Status_Project: string;
}

// ==================== WORKSTATION ====================
export interface Workstation {
    Id_Workstation: number;
    Name_Workstation: string;
    Code_Workstation: string;
    Id_ProdLine: number;
    project?: number;
    machines_count?: number;
}

// ==================== MACHINE ====================
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

// ==================== SHIFT ====================
export interface Shift {
    id: number;
    name: string;
    code: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
    startHour?: number;
    endHour?: number;
}

// ==================== TEAM ASSIGNMENT ====================
export interface TeamAssignment {
    Id_Assignment: number;
    Id_Emp: number;
    Id_Workstation: number;
    Id_HourlyProd: number;
    AssignedAt: Date;
}

// ==================== DASHBOARD ====================
export interface ProductionDashboardStats {
    totalOutput: number;
    totalTarget: number;
    efficiency: number;
    scrapRate: number;
    activeLines: number;
    downtimeMinutes: number;
}

export interface HourlyOutputData {
    hour: number;
    output: number;
    target: number;
    efficiency: number;
}

// ==================== ZONE ====================
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

// ==================== PART-LINE ASSIGNMENT ====================
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

// ==================== HEADCOUNT REQUIREMENT ====================
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
