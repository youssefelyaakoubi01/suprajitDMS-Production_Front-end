import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DowntimeTicket, Zone, Machine } from '../../core/models';

@Injectable({
    providedIn: 'root'
})
export class DowntimeListService {

    getDowntimeTickets(): Observable<DowntimeTicket[]> {
        const tickets: DowntimeTicket[] = [
            {
                Id_DowntimeTicket: 1,
                TicketNo: 'DT-2024-001',
                Zone: 'Assembly Zone A',
                ImpactedProject: 'VW Handle Assy',
                ImpactedMachine: 'Assembly Station 1',
                Status: 'Open',
                DowntimeStartsAt: new Date('2024-11-23T08:30:00'),
                TicketCreatedAt: new Date('2024-11-23T08:35:00'),
                ClosedAt: null,
                AssignedTo: 'Ahmed Benali',
                AssignedToId: 55,
                LeaderConfirmeClosedAt: null,
                Description: 'Machine stopped due to sensor malfunction',
                Priority: 'High',
                DowntimeDuration: 45,
                Resolution: null
            },
            {
                Id_DowntimeTicket: 2,
                TicketNo: 'DT-2024-002',
                Zone: 'Assembly Zone B',
                ImpactedProject: 'HÖRMANN',
                ImpactedMachine: 'Packaging Station',
                Status: 'In Progress',
                DowntimeStartsAt: new Date('2024-11-23T09:15:00'),
                TicketCreatedAt: new Date('2024-11-23T09:20:00'),
                ClosedAt: null,
                AssignedTo: 'Mohamed Alami',
                AssignedToId: 56,
                LeaderConfirmeClosedAt: null,
                Description: 'Conveyor belt issue',
                Priority: 'Medium',
                DowntimeDuration: 30,
                Resolution: null
            },
            {
                Id_DowntimeTicket: 3,
                TicketNo: 'DT-2024-003',
                Zone: 'Quality Zone',
                ImpactedProject: 'WITTE',
                ImpactedMachine: 'Quality Check Station',
                Status: 'Closed',
                DowntimeStartsAt: new Date('2024-11-22T14:00:00'),
                TicketCreatedAt: new Date('2024-11-22T14:05:00'),
                ClosedAt: new Date('2024-11-22T15:30:00'),
                AssignedTo: 'Fatima Zahra',
                AssignedToId: 57,
                LeaderConfirmeClosedAt: new Date('2024-11-22T15:45:00'),
                Description: 'Camera calibration required',
                Priority: 'Low',
                DowntimeDuration: 90,
                Resolution: 'Camera recalibrated and tested'
            },
            {
                Id_DowntimeTicket: 4,
                TicketNo: 'DT-2024-004',
                Zone: 'Assembly Zone A',
                ImpactedProject: 'VW Handle Assy',
                ImpactedMachine: 'Assembly Station 2',
                Status: 'Closed',
                DowntimeStartsAt: new Date('2024-11-22T10:00:00'),
                TicketCreatedAt: new Date('2024-11-22T10:02:00'),
                ClosedAt: new Date('2024-11-22T11:00:00'),
                AssignedTo: 'Youssef Kadiri',
                AssignedToId: 58,
                LeaderConfirmeClosedAt: new Date('2024-11-22T11:15:00'),
                Description: 'Pneumatic system failure',
                Priority: 'Critical',
                DowntimeDuration: 60,
                Resolution: 'Replaced pneumatic valve and tested system'
            },
            {
                Id_DowntimeTicket: 5,
                TicketNo: 'DT-2024-005',
                Zone: 'Packaging Zone',
                ImpactedProject: 'Grammer',
                ImpactedMachine: 'Labeling Machine',
                Status: 'Open',
                DowntimeStartsAt: new Date('2024-11-23T11:00:00'),
                TicketCreatedAt: new Date('2024-11-23T11:05:00'),
                ClosedAt: null,
                AssignedTo: 'Karim Tazi',
                AssignedToId: 59,
                LeaderConfirmeClosedAt: null,
                Description: 'Label printer jam',
                Priority: 'Medium',
                DowntimeDuration: 15,
                Resolution: null
            },
            {
                Id_DowntimeTicket: 6,
                TicketNo: 'DT-2024-006',
                Zone: 'Assembly Zone B',
                ImpactedProject: 'HÖRMANN',
                ImpactedMachine: 'Welding Station',
                Status: 'Closed',
                DowntimeStartsAt: new Date('2024-11-21T16:30:00'),
                TicketCreatedAt: new Date('2024-11-21T16:32:00'),
                ClosedAt: new Date('2024-11-21T18:00:00'),
                AssignedTo: 'Omar Benjelloun',
                AssignedToId: 60,
                LeaderConfirmeClosedAt: new Date('2024-11-21T18:20:00'),
                Description: 'Welding electrode worn out',
                Priority: 'High',
                DowntimeDuration: 90,
                Resolution: 'Replaced welding electrodes and calibrated welder'
            }
        ];

        return of(tickets).pipe(delay(300));
    }

    getZones(): Observable<Zone[]> {
        return of([
            { Id_Zone: 1, Name_Zone: 'Assembly Zone A', Code_Zone: 'AZA' },
            { Id_Zone: 2, Name_Zone: 'Assembly Zone B', Code_Zone: 'AZB' },
            { Id_Zone: 3, Name_Zone: 'Quality Zone', Code_Zone: 'QZ' },
            { Id_Zone: 4, Name_Zone: 'Packaging Zone', Code_Zone: 'PZ' },
            { Id_Zone: 5, Name_Zone: 'Warehouse Zone', Code_Zone: 'WZ' }
        ]).pipe(delay(200));
    }

    getMachines(): Observable<Machine[]> {
        return of([
            { Id_Machine: 1, Name_Machine: 'Assembly Station 1', Code_Machine: 'ASB-001', Id_Zone: 1, Id_Project: 1 },
            { Id_Machine: 2, Name_Machine: 'Assembly Station 2', Code_Machine: 'ASB-002', Id_Zone: 1, Id_Project: 1 },
            { Id_Machine: 3, Name_Machine: 'Packaging Station', Code_Machine: 'PKG-001', Id_Zone: 2, Id_Project: 2 },
            { Id_Machine: 4, Name_Machine: 'Quality Check Station', Code_Machine: 'QC-001', Id_Zone: 3, Id_Project: 3 },
            { Id_Machine: 5, Name_Machine: 'Labeling Machine', Code_Machine: 'LBL-001', Id_Zone: 4, Id_Project: 4 },
            { Id_Machine: 6, Name_Machine: 'Welding Station', Code_Machine: 'WLD-001', Id_Zone: 2, Id_Project: 2 }
        ]).pipe(delay(200));
    }

    createTicket(ticket: Partial<DowntimeTicket>): Observable<DowntimeTicket> {
        const newTicket: DowntimeTicket = {
            Id_DowntimeTicket: Math.floor(Math.random() * 10000),
            TicketNo: `DT-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            Zone: '',
            ImpactedProject: '',
            ImpactedMachine: '',
            Status: 'Open',
            DowntimeStartsAt: new Date(),
            TicketCreatedAt: new Date(),
            ClosedAt: null,
            AssignedTo: '',
            AssignedToId: 0,
            LeaderConfirmeClosedAt: null,
            Description: '',
            Priority: 'Medium',
            DowntimeDuration: 0,
            Resolution: null,
            ...ticket
        };
        return of(newTicket).pipe(delay(500));
    }

    updateTicketStatus(ticketId: number, status: 'Open' | 'In Progress' | 'Closed'): Observable<boolean> {
        return of(true).pipe(delay(300));
    }

    closeTicket(ticketId: number, resolution: string): Observable<boolean> {
        return of(true).pipe(delay(500));
    }

    confirmClose(ticketId: number): Observable<boolean> {
        return of(true).pipe(delay(300));
    }
}
