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
    Priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface MaintenanceTicket {
    Id_Ticket: number;
    Machine: string;
    Description: string;
    Category: string;
    Priority: 'low' | 'medium' | 'high' | 'critical';
    Status: 'open' | 'assigned' | 'in_progress' | 'closed';
    CreatedAt: Date;
    CreatedBy: number;
    AssignedTo?: number;
    ClosedAt?: Date;
    Resolution?: string;
}

export interface PreventiveMaintenance {
    Id_PM: number;
    Machine: string;
    Description: string;
    Frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    LastExecuted?: Date;
    NextDue: Date;
    AssignedTo: number;
    Status: 'pending' | 'completed' | 'overdue';
}

export interface MaintenanceUser {
    Id_MaintUser: number;
    Name: string;
    Specialization: string;
    Available: boolean;
}
