import { Shift, Project, ProductionLine, Part, DowntimeProblem, Machine, Zone } from './production.model';
import { EmployeeWithAssignment } from './employee.model';

// Use existing Downtime interface from production.model.ts
export interface DowntimeExtended {
    id?: number;
    Id_Downtime?: number;
    Total_Downtime: number;
    Comment_Downtime: string;
    Id_DowntimeProblems: number;
    Id_HourlyProd?: number;
    problemName?: string;
    machine?: number;
    machine_name?: string;
}

export type HourStatus = 'not_started' | 'in_progress' | 'completed';
export type HourType = 'normal' | 'setup' | 'break' | 'extra_hour_break';

export interface HourlyProductionState {
    hour: number;
    timeRange: string; // "09:00 - 10:00"
    startTime: string; // "09:00"
    endTime: string; // "10:00"
    isOvertime: boolean;
    hourType: HourType; // Type of hour: normal, setup, break, extra_hour_break
    status: HourStatus;
    output: number | null;
    scrap: number | null;
    target: number;
    scrapTarget: number;
    efficiency: number | null;
    scrapRate: number | null;
    downtimes: DowntimeExtended[];
    totalDowntime: number; // Sum of all downtimes in minutes
    hourlyProductionId: number | null; // ID after save
    team: EmployeeWithAssignment[]; // Team assigned to this specific hour
    quickEntryMode?: boolean; // Enable quick entry mode for simple hours
    quickOutput?: number | null; // Quick entry output value
}

// Target percentages for each hour type
export const HOUR_TYPE_TARGET_PERCENTAGE: Record<HourType, number> = {
    'normal': 100,      // 100% of target
    'setup': 50,        // 50% of target (setup time reduces production)
    'break': 0,         // 0% target during break
    'extra_hour_break': 50  // 50% of target for extra hour break
};

export interface ActorInfo {
    badgeId: string;
    name: string;
    qualification: string;
    employeeId?: number;
}

export interface ProductionActors {
    lineLeader: ActorInfo;
    qualityAgent: ActorInfo;
    maintenanceTech: ActorInfo;
    pqc: ActorInfo;
}

export interface ShiftProductionSession {
    // Shift Information
    shift: Shift | null;
    date: Date;
    project: Project | null;
    productionLine: ProductionLine | null;
    part: Part | null;
    machine: Machine | null;
    zone: Zone | null;

    // Order Number
    orderNo: string;

    // Team
    team: EmployeeWithAssignment[];
    actors: ProductionActors;

    // Hourly production tracking
    hours: HourlyProductionState[];

    // Session state
    isSetupComplete: boolean;
    isTeamComplete: boolean;
    currentHourIndex: number | null;
}

export interface DowntimeDialogItem {
    id?: number;
    duration: number;
    problemId: number;
    machineId?: number;
    comment: string;
}

export interface HourProductionInput {
    output: number;
    scrap: number;
    hasDowntime: boolean;
    downtimes?: DowntimeDialogItem[];
    downtime?: {
        duration: number;
        problemId: number;
        machineId?: number;
        comment: string;
    };
}

// Workflow step type for stepper navigation
export type WorkflowStep = 1 | 2 | 3;

// MeterGroup item for efficiency visualization
export interface MeterItem {
    label: string;
    value: number;
    color: string;
    icon?: string;
}
