import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { MaintenanceDowntime } from '../../core/models';

@Component({
    selector: 'app-maintenance',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, TableModule, ButtonModule, TagModule, ToastModule, DialogModule, SelectModule, TextareaModule],
    providers: [MessageService],
    templateUrl: './maintenance.component.html',
    styleUrls: ['./maintenance.component.scss']
})
export class MaintenanceComponent implements OnInit {
    tickets: MaintenanceDowntime[] = [];
    showTicketDialog = false;

    ngOnInit(): void {
        this.loadTickets();
    }

    loadTickets(): void {
        this.tickets = [
            { DowntimeID: 62402, DateTimeDT: new Date(), WorkstationDT: 'Assembly Line 1', DowntimeStart: new Date(), DowntimeStatus: 'open', CauseDT: 'Machine Breakdown', Priority: 'high' },
            { DowntimeID: 62403, DateTimeDT: new Date(), WorkstationDT: 'Molding Station', DowntimeStart: new Date(), StartIntervention: new Date(), DowntimeStatus: 'in_progress', CauseDT: 'Sensor Malfunction', Priority: 'medium' },
            { DowntimeID: 62404, DateTimeDT: new Date(), WorkstationDT: 'Packaging', DowntimeStart: new Date(), EndIntervention: new Date(), DowntimeStatus: 'closed', CauseDT: 'Belt Replacement', Priority: 'low' }
        ];
    }

    getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
        const map: Record<string, 'success' | 'warn' | 'danger'> = { closed: 'success', in_progress: 'warn', open: 'danger' };
        return map[status] || 'info';
    }

    getPrioritySeverity(priority: string): 'success' | 'warn' | 'danger' | 'info' {
        const map: Record<string, 'success' | 'warn' | 'danger'> = { low: 'success', medium: 'warn', high: 'danger', critical: 'danger' };
        return map[priority] || 'info';
    }

    openTicketDialog(): void { this.showTicketDialog = true; }
    closeTicketDialog(): void { this.showTicketDialog = false; }

    getOpenTickets(): number {
        return this.tickets.filter(t => t.DowntimeStatus === 'open').length;
    }

    getInProgressTickets(): number {
        return this.tickets.filter(t => t.DowntimeStatus === 'in_progress').length;
    }

    getClosedTickets(): number {
        return this.tickets.filter(t => t.DowntimeStatus === 'closed').length;
    }
}
