export interface DowntimeTicket {
    Id_DowntimeTicket: number;
    TicketNo: string;
    Zone: string;
    ImpactedProject: string;
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

export interface Zone {
    Id_Zone: number;
    Name_Zone: string;
    Code_Zone: string;
}

export interface Machine {
    Id_Machine: number;
    Name_Machine: string;
    Code_Machine: string;
    Id_Zone: number;
    Id_Project: number;
}
