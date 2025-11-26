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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService, ConfirmationService } from 'primeng/api';
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
        TooltipModule,
        ConfirmDialogModule,
        InputNumberModule,
        DatePickerModule
    ],
    providers: [MessageService, ConfirmationService],
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
    showEditDialog = false;
    selectedTicket: DowntimeTicket | null = null;
    resolution = '';

    // Edit Form
    editForm: Partial<DowntimeTicket> = {};

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
        private messageService: MessageService,
        private confirmationService: ConfirmationService
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
            next: (updatedTicket) => {
                // Update local ticket with response from API
                const index = this.tickets.findIndex(t => t.Id_DowntimeTicket === this.selectedTicket!.Id_DowntimeTicket);
                if (index !== -1) {
                    this.tickets[index] = updatedTicket;
                }
                this.applyFilters();
                this.calculateStats();
                this.showCloseDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Ticket closed successfully'
                });
            },
            error: (err) => {
                console.error('Error closing ticket:', err);
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
            next: (updatedTicket) => {
                // Update local ticket with response from API
                const index = this.tickets.findIndex(t => t.Id_DowntimeTicket === ticket.Id_DowntimeTicket);
                if (index !== -1) {
                    this.tickets[index] = updatedTicket;
                }
                this.applyFilters();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Leader confirmation recorded'
                });
            },
            error: (err) => {
                console.error('Error confirming closure:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err?.error?.error || 'Failed to confirm closure'
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

    // ==================== EDIT FUNCTIONALITY ====================

    openEditDialog(ticket: DowntimeTicket): void {
        this.selectedTicket = ticket;
        this.editForm = {
            ...ticket,
            DowntimeStartsAt: new Date(ticket.DowntimeStartsAt)
        };
        this.showEditDialog = true;
    }

    saveEdit(): void {
        if (!this.selectedTicket || !this.editForm.Zone || !this.editForm.ImpactedMachine) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please fill in all required fields'
            });
            return;
        }

        this.downtimeService.updateTicket(this.selectedTicket.Id_DowntimeTicket, this.editForm).subscribe({
            next: (updatedTicket) => {
                // Update the ticket in the local array
                const index = this.tickets.findIndex(t => t.Id_DowntimeTicket === this.selectedTicket!.Id_DowntimeTicket);
                if (index !== -1) {
                    this.tickets[index] = {
                        ...this.tickets[index],
                        ...this.editForm
                    };
                    this.applyFilters();
                    this.calculateStats();
                }

                this.showEditDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Ticket updated successfully'
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update ticket'
                });
            }
        });
    }

    // ==================== DELETE FUNCTIONALITY ====================

    confirmDelete(ticket: DowntimeTicket): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ticket <strong>${ticket.TicketNo}</strong>?<br><br>This action cannot be undone.`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteTicket(ticket);
            }
        });
    }

    deleteTicket(ticket: DowntimeTicket): void {
        this.downtimeService.deleteTicket(ticket.Id_DowntimeTicket).subscribe({
            next: () => {
                // Remove the ticket from the local array
                this.tickets = this.tickets.filter(t => t.Id_DowntimeTicket !== ticket.Id_DowntimeTicket);
                this.applyFilters();
                this.calculateStats();

                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Ticket ${ticket.TicketNo} deleted successfully`
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to delete ticket'
                });
            }
        });
    }
}
