import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DowntimeListService } from './downtime-list.service';
import { DowntimeTicket, Zone, Machine } from '../../core/models';

@Component({
    selector: 'app-downtime-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        TagModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        DialogModule,
        TextareaModule,
        ToastModule,
        TooltipModule
    ],
    providers: [MessageService],
    templateUrl: './downtime-list.component.html',
    styleUrls: ['./downtime-list.component.scss']
})
export class DowntimeListComponent implements OnInit {
    tickets: DowntimeTicket[] = [];
    filteredTickets: DowntimeTicket[] = [];
    zones: Zone[] = [];
    machines: Machine[] = [];

    // Filters
    searchText = '';
    selectedStatus: string | null = null;
    selectedZone: string | null = null;
    selectedPriority: string | null = null;

    // Dialog
    showDetailDialog = false;
    showCloseDialog = false;
    selectedTicket: DowntimeTicket | null = null;
    resolution = '';

    // Stats
    openCount = 0;
    inProgressCount = 0;
    closedCount = 0;
    totalDowntimeMinutes = 0;

    statuses = [
        { label: 'All', value: null },
        { label: 'Open', value: 'Open' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Closed', value: 'Closed' }
    ];

    priorities = [
        { label: 'All', value: null },
        { label: 'Low', value: 'Low' },
        { label: 'Medium', value: 'Medium' },
        { label: 'High', value: 'High' },
        { label: 'Critical', value: 'Critical' }
    ];

    constructor(
        private downtimeService: DowntimeListService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.downtimeService.getDowntimeTickets().subscribe(tickets => {
            this.tickets = tickets;
            this.filteredTickets = tickets;
            this.calculateStats();
        });

        this.downtimeService.getZones().subscribe(zones => {
            this.zones = zones;
        });

        this.downtimeService.getMachines().subscribe(machines => {
            this.machines = machines;
        });
    }

    calculateStats(): void {
        this.openCount = this.tickets.filter(t => t.Status === 'Open').length;
        this.inProgressCount = this.tickets.filter(t => t.Status === 'In Progress').length;
        this.closedCount = this.tickets.filter(t => t.Status === 'Closed').length;
        this.totalDowntimeMinutes = this.tickets.reduce((sum, t) => sum + t.DowntimeDuration, 0);
    }

    applyFilters(): void {
        this.filteredTickets = this.tickets.filter(ticket => {
            const matchesSearch = !this.searchText ||
                ticket.TicketNo.toLowerCase().includes(this.searchText.toLowerCase()) ||
                ticket.ImpactedProject.toLowerCase().includes(this.searchText.toLowerCase()) ||
                ticket.ImpactedMachine.toLowerCase().includes(this.searchText.toLowerCase()) ||
                ticket.AssignedTo.toLowerCase().includes(this.searchText.toLowerCase());

            const matchesStatus = !this.selectedStatus || ticket.Status === this.selectedStatus;
            const matchesZone = !this.selectedZone || ticket.Zone === this.selectedZone;
            const matchesPriority = !this.selectedPriority || ticket.Priority === this.selectedPriority;

            return matchesSearch && matchesStatus && matchesZone && matchesPriority;
        });
    }

    clearFilters(): void {
        this.searchText = '';
        this.selectedStatus = null;
        this.selectedZone = null;
        this.selectedPriority = null;
        this.filteredTickets = this.tickets;
    }

    viewDetails(ticket: DowntimeTicket): void {
        this.selectedTicket = ticket;
        this.showDetailDialog = true;
    }

    openCloseDialog(ticket: DowntimeTicket): void {
        this.selectedTicket = ticket;
        this.resolution = '';
        this.showCloseDialog = true;
    }

    closeTicket(): void {
        if (!this.selectedTicket || !this.resolution.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please provide a resolution'
            });
            return;
        }

        this.downtimeService.closeTicket(this.selectedTicket.Id_DowntimeTicket, this.resolution).subscribe({
            next: () => {
                if (this.selectedTicket) {
                    this.selectedTicket.Status = 'Closed';
                    this.selectedTicket.ClosedAt = new Date();
                    this.selectedTicket.Resolution = this.resolution;
                }
                this.calculateStats();
                this.showCloseDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Ticket closed successfully'
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to close ticket'
                });
            }
        });
    }

    confirmLeaderClose(ticket: DowntimeTicket): void {
        this.downtimeService.confirmClose(ticket.Id_DowntimeTicket).subscribe({
            next: () => {
                ticket.LeaderConfirmeClosedAt = new Date();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Leader confirmation recorded'
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to confirm closure'
                });
            }
        });
    }

    getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
        switch (status) {
            case 'Open': return 'danger';
            case 'In Progress': return 'warn';
            case 'Closed': return 'success';
            default: return 'secondary';
        }
    }

    getPrioritySeverity(priority: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
        switch (priority) {
            case 'Low': return 'info';
            case 'Medium': return 'warn';
            case 'High': return 'danger';
            case 'Critical': return 'danger';
            default: return 'secondary';
        }
    }

    formatDuration(minutes: number): string {
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    getTotalDowntimeFormatted(): string {
        return this.formatDuration(this.totalDowntimeMinutes);
    }
}
