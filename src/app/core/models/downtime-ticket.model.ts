export interface DowntimeTicket {
    Id_DowntimeTicket: number;
    TicketNo: string;
    Type: string;                    // Assembly, Die Casting, Pressing, etc.
    Zone: string;
    ImpactedProject: string;
    ProductionLine: string;          // Production line name
    Workstation: string;             // Workstation name
    ImpactedMachine: string;
    Status: 'Open' | 'In Progress' | 'Closed';
    DowntimeStartsAt: Date;
    TicketCreatedAt: Date;
    ClosedAt: Date | null;
    AssignedTo: string;
    AssignedToId: number;
    LeaderConfirmeClosedAt: Date | null;
    Description: string;
    Priority: 'Low' | 'Medium' | 'High' | 'Critical';
    DowntimeDuration: number; // in minutes
    Resolution: string | null;
}

export interface DowntimeZone {
    Id_Zone: number;
    Name_Zone: string;
    Code_Zone: string;
}

export interface DowntimeMachine {
    Id_Machine: number;
    Name_Machine: string;
    Code_Machine: string;
    Id_Zone: number;
    Id_Project: number;
}
