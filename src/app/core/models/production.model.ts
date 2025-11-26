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
}

export interface DowntimeProblem {
    Id_DowntimeProblems: number;
    Name_DowntimeProblems: string;
    Category_DowntimeProblems?: string;
}

export interface Workstation {
    Id_Workstation: number;
    Name_Workstation: string;
    Code_Workstation: string;
    Id_ProdLine: number;
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

export interface TeamAssignment {
    Id_Assignment: number;
    Id_Emp: number;
    Id_Workstation: number;
    Id_HourlyProd: number;
    AssignedAt: Date;
}
