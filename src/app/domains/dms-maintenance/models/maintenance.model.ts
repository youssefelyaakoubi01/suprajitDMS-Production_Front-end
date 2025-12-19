/**
 * DMS-Maintenance Models
 * Domain: Maintenance Operations Management
 * Based on actual system images
 */

// ==================== MAINTENANCE TICKET (Open Tickets View) ====================
export interface MaintenanceTicket {
    Id_Ticket: number;
    TicketNo: string;
    Zone: string;
    Project: string;
    ProductionLine: string;
    Workstation: string;
    Machine: string;
    Description: string;
    Status: TicketStatus;
    DowntimeStartsAt: Date;
    CreatedOn: Date;
    AssignedTo?: string;
    AcceptedBy?: string;
    ClosedAt?: Date;
    InterventionTime?: number; // in minutes
    ReactivityTime?: number; // in minutes
    WaitingTime?: number; // in minutes
    Causes?: string;
    Actions?: string;
    Resolution?: string;
    Priority?: MaintenancePriority;
}

// ==================== MAINTENANCE DOWNTIME ====================
export interface MaintenanceDowntime {
    DowntimeID: number;
    DateTimeDT: Date;
    WorkstationDT: string;
    DowntimeStart: Date;
    StartIntervention?: Date;
    EndIntervention?: Date;
    MaintUserID?: number;
    DowntimeStatus: 'open' | 'in_progress' | 'closed';
    CauseDT: string;
    ActionsMaint?: string;
    Priority: MaintenancePriority;
}

// ==================== DASHBOARD DATA ====================
export interface MaintenanceDashboardData {
    topProjects: ChartDataItem[];
    topMachines: ChartDataItem[];
    topEmployees: EmployeePerformance[];
    downtimeList: DowntimeListItem[];
}

export interface ChartDataItem {
    name: string;
    value: number;
}

export interface EmployeePerformance {
    name: string;
    closedTickets: number;
}

export interface DowntimeListItem {
    ticket: string;
    zone: string;
    impactedProject: string;
    impactedMachine: string;
    description: string;
    status: TicketStatus;
    createdAt: Date;
    acceptedBy?: string;
    downtimeStartsAt: Date;
    closedAt?: Date;
    interventionTime?: number;
    reactivityTime?: number;
    waitingTime?: number;
}

// ==================== KPI DATA (Weekly Follow-up) ====================
export interface MaintenanceKPIData {
    weekNumber: number;
    totalDowntime: number;
    downtimeMin: number;
    downtimePercent: number;
    downtimeTargetPercent: number;
    mtbf: number;
    mtbfTarget: number;
    mttrMin: number;
    mttrTarget: number;
}

export interface MaintenanceKPISummary {
    weeks: MaintenanceKPIData[];
    followUpDowntimePercent: ChartSeriesData;
    weeklyMTTR: ChartSeriesData;
    weeklyMTBF: ChartSeriesData;
}

export interface ChartSeriesData {
    labels: string[];
    actual: number[];
    target: number[];
}

// ==================== PRODUCTION KPI ====================
export interface ProductionKPIData {
    date: Date;
    hp: number;
    tempOuverture: number;
    weekNumber: number;
}

// ==================== PREVENTIVE MAINTENANCE ====================
export interface PreventiveMaintenance {
    Id_PM: number;
    Machine: string;
    Description: string;
    Frequency: MaintenanceFrequency;
    LastExecuted?: Date;
    NextDue: Date;
    AssignedTo: number;
    Status: 'pending' | 'completed' | 'overdue';
}

// ==================== MAINTENANCE USER ====================
export interface MaintenanceUser {
    Id_MaintUser: number;
    Name: string;
    Specialization: string;
    Available: boolean;
}

// ==================== FILTER OPTIONS ====================
export interface MaintenanceFilterOptions {
    zones: string[];
    projects: string[];
    productionLines: string[];
    machines: string[];
    statuses: TicketStatus[];
}

// ==================== ENUMS & TYPES ====================
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'Open' | 'Closed' | 'In Progress' | 'Assigned';
export type MaintenanceFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type DateFilterType = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'last30Days' | 'custom';

export const PriorityLabels: Record<MaintenancePriority, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    critical: 'Critique'
};

export const PriorityColors: Record<MaintenancePriority, string> = {
    low: '#10B981',
    medium: '#3B82F6',
    high: '#F59E0B',
    critical: '#EF4444'
};

export const TicketStatusLabels: Record<TicketStatus, string> = {
    'Open': 'Ouvert',
    'Closed': 'Fermé',
    'In Progress': 'En cours',
    'Assigned': 'Assigné'
};

export const TicketStatusColors: Record<TicketStatus, string> = {
    'Open': '#F59E0B',
    'Closed': '#10B981',
    'In Progress': '#3B82F6',
    'Assigned': '#8B5CF6'
};

export const FrequencyLabels: Record<MaintenanceFrequency, string> = {
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    quarterly: 'Trimestriel',
    yearly: 'Annuel'
};

// ==================== MAINTENANCE STATS ====================
export interface MaintenanceStats {
    openTickets: number;
    inProgressTickets: number;
    closedTickets: number;
    avgResolutionTime: number;
    avgInterventionTime: number;
    avgReactivityTime: number;
    ticketsByPriority: { priority: MaintenancePriority; count: number }[];
    ticketsByZone: { zone: string; count: number }[];
    ticketsByProject: { project: string; count: number }[];
    upcomingPM: PreventiveMaintenance[];
    overduePM: PreventiveMaintenance[];
}
