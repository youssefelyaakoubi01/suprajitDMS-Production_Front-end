/**
 * Maintenance Tickets List Component
 * Domain: DMS-Maintenance
 *
 * Displays and manages maintenance tickets
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { StepsModule } from 'primeng/steps';
import { BadgeModule } from 'primeng/badge';

// Domain imports
import { DmsMaintenanceService, MaintenanceTicket } from '@domains/dms-maintenance';

@Component({
    selector: 'app-tickets-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        CardModule,
        ButtonModule,
        TagModule,
        TooltipModule,
        ToolbarModule,
        SelectModule,
        DatePickerModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        StepsModule,
        BadgeModule
    ],
    template: `
        <div class="tickets-list">
            <!-- Summary Stats -->
            <div class="stats-grid mb-4">
                <div class="stat-card" *ngFor="let stat of statusStats">
                    <div class="stat-icon" [ngClass]="'bg-' + stat.color">
                        <i [class]="stat.icon"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-value">{{ stat.count }}</span>
                        <span class="stat-label">{{ stat.label }}</span>
                    </div>
                </div>
            </div>

            <!-- Main Table -->
            <p-card>
                <ng-template pTemplate="header">
                    <p-toolbar styleClass="border-none bg-transparent">
                        <ng-template #start>
                            <span class="text-xl font-semibold">
                                <i class="pi pi-wrench mr-2"></i>Maintenance Tickets
                            </span>
                        </ng-template>
                        <ng-template #end>
                            <div class="flex gap-2 flex-wrap">
                                <p-select [options]="statusOptions" [(ngModel)]="filterStatus"
                                          placeholder="Status" [showClear]="true"
                                          (onChange)="applyFilters()">
                                </p-select>
                                <p-select [options]="priorityOptions" [(ngModel)]="filterPriority"
                                          placeholder="Priority" [showClear]="true"
                                          (onChange)="applyFilters()">
                                </p-select>
                                <p-datepicker [(ngModel)]="filterDateRange" selectionMode="range"
                                              placeholder="Date Range" [showIcon]="true"
                                              (onSelect)="applyFilters()" dateFormat="dd/mm/yy">
                                </p-datepicker>
                                <button pButton icon="pi pi-plus" label="New Ticket"
                                        (click)="openCreateDialog()">
                                </button>
                            </div>
                        </ng-template>
                    </p-toolbar>
                </ng-template>

                <p-table [value]="filteredTickets"
                         [loading]="loading"
                         [paginator]="true"
                         [rows]="10"
                         [rowsPerPageOptions]="[10, 25, 50]"
                         [rowHover]="true"
                         [showCurrentPageReport]="true"
                         currentPageReportTemplate="Showing {first} to {last} of {totalRecords} tickets"
                         styleClass="p-datatable-sm">

                    <ng-template pTemplate="header">
                        <tr>
                            <th pSortableColumn="ticketNumber" style="width: 120px">
                                Ticket <p-sortIcon field="ticketNumber"></p-sortIcon>
                            </th>
                            <th pSortableColumn="CreatedAt">
                                Created <p-sortIcon field="CreatedAt"></p-sortIcon>
                            </th>
                            <th>Equipment</th>
                            <th>Issue</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Assigned To</th>
                            <th>Actions</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-ticket>
                        <tr>
                            <td>
                                <span class="ticket-number">TKT-{{ ticket.Id_Ticket }}</span>
                            </td>
                            <td>
                                <div class="date-cell">
                                    <span>{{ ticket.CreatedOn | date:'dd/MM/yyyy' }}</span>
                                    <span class="text-xs text-color-secondary">
                                        {{ ticket.CreatedOn | date:'HH:mm' }}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div class="equipment-cell">
                                    <i class="pi pi-cog mr-2 text-color-secondary"></i>
                                    {{ ticket.Machine }}
                                </div>
                            </td>
                            <td>
                                <span [pTooltip]="ticket.Description" tooltipPosition="top">
                                    {{ truncateText(ticket.Description, 40) }}
                                </span>
                            </td>
                            <td>
                                <p-tag [value]="ticket.Priority"
                                       [severity]="getPrioritySeverity(ticket.Priority)"
                                       styleClass="priority-tag">
                                </p-tag>
                            </td>
                            <td>
                                <p-tag [value]="ticket.Status"
                                       [severity]="getStatusSeverity(ticket.Status)">
                                </p-tag>
                            </td>
                            <td>
                                <div class="assignee-cell" *ngIf="ticket.AssignedTo">
                                    <span class="assignee-avatar">
                                        {{ getInitials(ticket.AssignedTo + '') }}
                                    </span>
                                    <span>{{ ticket.AssignedTo }}</span>
                                </div>
                                <span *ngIf="!ticket.AssignedTo" class="text-color-secondary">
                                    Unassigned
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button pButton icon="pi pi-eye"
                                            class="p-button-text p-button-sm"
                                            (click)="viewTicket(ticket)" pTooltip="View">
                                    </button>
                                    <button pButton icon="pi pi-pencil"
                                            class="p-button-text p-button-sm"
                                            (click)="editTicket(ticket)" pTooltip="Edit">
                                    </button>
                                    <button pButton icon="pi pi-play"
                                            class="p-button-text p-button-sm p-button-success"
                                            *ngIf="ticket.Status === 'open'"
                                            (click)="startTicket(ticket)" pTooltip="Start">
                                    </button>
                                    <button pButton icon="pi pi-check"
                                            class="p-button-text p-button-sm p-button-success"
                                            *ngIf="ticket.Status === 'in_progress'"
                                            (click)="completeTicket(ticket)" pTooltip="Complete">
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="8" class="text-center p-4">
                                <i class="pi pi-inbox text-4xl text-color-secondary mb-2"></i>
                                <p class="font-semibold">No Tickets Found</p>
                                <p class="text-sm text-color-secondary">
                                    No maintenance tickets match your filters.
                                </p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>

            <!-- Create/Edit Dialog -->
            <p-dialog [(visible)]="dialogVisible" [modal]="true"
                      [header]="editMode ? 'Edit Ticket' : 'Create Maintenance Ticket'"
                      [style]="{ width: '700px' }">
                <form [formGroup]="ticketForm" class="grid p-fluid">
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Equipment *</label>
                        <p-select [options]="equipmentList" formControlName="equipment"
                                  optionLabel="name" optionValue="name"
                                  placeholder="Select Equipment">
                        </p-select>
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Category *</label>
                        <p-select [options]="categoryOptions" formControlName="category"
                                  placeholder="Select Category">
                        </p-select>
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Priority *</label>
                        <p-select [options]="priorityOptions" formControlName="priority"
                                  placeholder="Select Priority">
                        </p-select>
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Assigned To</label>
                        <p-select [options]="technicianList" formControlName="assignedTo"
                                  optionLabel="name" optionValue="name"
                                  placeholder="Assign Technician" [showClear]="true">
                        </p-select>
                    </div>
                    <div class="col-12">
                        <label class="block mb-2 font-medium">Description *</label>
                        <textarea pTextarea formControlName="description" rows="4"
                                  placeholder="Describe the issue in detail..."></textarea>
                    </div>
                </form>
                <ng-template pTemplate="footer">
                    <button pButton label="Cancel" icon="pi pi-times"
                            class="p-button-text" (click)="dialogVisible = false">
                    </button>
                    <button pButton [label]="editMode ? 'Update' : 'Create'" icon="pi pi-check"
                            (click)="saveTicket()" [disabled]="!ticketForm.valid">
                    </button>
                </ng-template>
            </p-dialog>

            <!-- View Dialog -->
            <p-dialog [(visible)]="viewDialogVisible" [modal]="true"
                      header="Ticket Details" [style]="{ width: '700px' }">
                <div *ngIf="selectedTicket" class="ticket-details">
                    <div class="ticket-header mb-4">
                        <span class="ticket-number-large">TKT-{{ selectedTicket.Id_Ticket }}</span>
                        <div class="ticket-tags">
                            <p-tag [value]="selectedTicket.Priority || 'medium'"
                                   [severity]="getPrioritySeverity(selectedTicket.Priority || 'medium')">
                            </p-tag>
                            <p-tag [value]="selectedTicket.Status"
                                   [severity]="getStatusSeverity(selectedTicket.Status)">
                            </p-tag>
                        </div>
                    </div>

                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Equipment</span>
                            <span class="detail-value">{{ selectedTicket.Machine }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Zone</span>
                            <span class="detail-value">{{ selectedTicket.Zone }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Created</span>
                            <span class="detail-value">
                                {{ selectedTicket.CreatedOn | date:'dd/MM/yyyy HH:mm' }}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Assigned To</span>
                            <span class="detail-value">
                                {{ selectedTicket.AssignedTo || 'Unassigned' }}
                            </span>
                        </div>
                    </div>

                    <div class="detail-full mt-3">
                        <span class="detail-label">Description</span>
                        <p class="detail-text">{{ selectedTicket.Description }}</p>
                    </div>

                    <div class="detail-full mt-3" *ngIf="selectedTicket.Resolution">
                        <span class="detail-label">Resolution</span>
                        <p class="detail-text">{{ selectedTicket.Resolution }}</p>
                    </div>
                </div>
            </p-dialog>
        </div>
    `,
    styles: [`
        .tickets-list {
            padding: 1rem;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
        }

        .stat-card {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.25rem;

            &.bg-blue { background: var(--blue-500); }
            &.bg-orange { background: var(--orange-500); }
            &.bg-green { background: var(--green-500); }
            &.bg-red { background: var(--red-500); }
            &.bg-gray { background: var(--gray-500); }
        }

        .stat-info {
            display: flex;
            flex-direction: column;
        }

        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
        }

        .stat-label {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            text-transform: uppercase;
        }

        .ticket-number {
            font-family: monospace;
            font-weight: 600;
            color: var(--primary-color);
            background: var(--primary-50);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
        }

        .date-cell {
            display: flex;
            flex-direction: column;
        }

        .equipment-cell {
            display: flex;
            align-items: center;
        }

        .assignee-cell {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .assignee-avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--primary-100);
            color: var(--primary-700);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .action-buttons {
            display: flex;
            gap: 0.25rem;
        }

        .ticket-details {
            .ticket-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 1rem;
                border-bottom: 1px solid var(--surface-border);
            }

            .ticket-number-large {
                font-size: 1.5rem;
                font-weight: 700;
                font-family: monospace;
                color: var(--primary-color);
            }

            .ticket-tags {
                display: flex;
                gap: 0.5rem;
            }

            .detail-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
            }

            .detail-item {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }

            .detail-label {
                font-size: 0.75rem;
                font-weight: 500;
                color: var(--text-color-secondary);
                text-transform: uppercase;
            }

            .detail-value {
                font-weight: 500;
            }

            .detail-full {
                .detail-label {
                    display: block;
                    margin-bottom: 0.5rem;
                }
                .detail-text {
                    margin: 0;
                    padding: 0.75rem;
                    background: var(--surface-ground);
                    border-radius: 8px;
                }
            }
        }
    `]
})
export class TicketsListComponent implements OnInit, OnDestroy {
    @Input() tickets: MaintenanceTicket[] = [];
    @Input() loading = false;

    @Output() create = new EventEmitter<Partial<MaintenanceTicket>>();
    @Output() update = new EventEmitter<MaintenanceTicket>();
    @Output() statusChange = new EventEmitter<{ ticket: MaintenanceTicket; newStatus: string }>();

    private destroy$ = new Subject<void>();

    filteredTickets: MaintenanceTicket[] = [];
    filterStatus: string | null = null;
    filterPriority: string | null = null;
    filterDateRange: Date[] | null = null;

    statusOptions = [
        { label: 'Open', value: 'Open' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Pending Parts', value: 'Pending Parts' },
        { label: 'Completed', value: 'Completed' }
    ];

    priorityOptions = [
        { label: 'Critical', value: 'Critical' },
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' }
    ];

    categoryOptions = [
        { label: 'Mechanical', value: 'Mechanical' },
        { label: 'Electrical', value: 'Electrical' },
        { label: 'Software', value: 'Software' },
        { label: 'Preventive', value: 'Preventive' },
        { label: 'Calibration', value: 'Calibration' }
    ];

    equipmentList = [
        { name: 'CNC Machine A1' },
        { name: 'Conveyor B2' },
        { name: 'Assembly Robot C1' },
        { name: 'Hydraulic Press D1' },
        { name: 'Paint Booth E1' }
    ];

    technicianList = [
        { name: 'John Smith' },
        { name: 'Mike Johnson' },
        { name: 'Sarah Wilson' },
        { name: 'Robert Brown' }
    ];

    statusStats: any[] = [];

    // Dialog
    dialogVisible = false;
    editMode = false;
    ticketForm!: FormGroup;

    // View dialog
    viewDialogVisible = false;
    selectedTicket: MaintenanceTicket | null = null;

    constructor(
        private fb: FormBuilder,
        private maintenanceService: DmsMaintenanceService
    ) {}

    ngOnInit(): void {
        this.initForm();
        if (this.tickets.length === 0) {
            this.loadTickets();
        } else {
            this.filteredTickets = [...this.tickets];
            this.calculateStats();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initForm(): void {
        this.ticketForm = this.fb.group({
            equipment: ['', Validators.required],
            category: ['', Validators.required],
            priority: ['Medium', Validators.required],
            assignedTo: [''],
            description: ['', [Validators.required, Validators.minLength(10)]]
        });
    }

    loadTickets(): void {
        this.loading = true;
        this.maintenanceService.getTickets()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data: MaintenanceTicket[]) => {
                    this.tickets = data;
                    this.filteredTickets = [...data];
                    this.calculateStats();
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    private calculateStats(): void {
        const counts = {
            open: 0,
            inProgress: 0,
            completed: 0,
            pending: 0
        };

        this.tickets.forEach(t => {
            switch (t.Status) {
                case 'Open': counts.open++; break;
                case 'In Progress': counts.inProgress++; break;
                case 'Closed': counts.completed++; break;
                case 'Assigned': counts.pending++; break;
            }
        });

        this.statusStats = [
            { label: 'Open', count: counts.open, icon: 'pi pi-inbox', color: 'blue' },
            { label: 'In Progress', count: counts.inProgress, icon: 'pi pi-spinner', color: 'orange' },
            { label: 'Closed', count: counts.completed, icon: 'pi pi-check-circle', color: 'green' },
            { label: 'Assigned', count: counts.pending, icon: 'pi pi-clock', color: 'gray' }
        ];
    }

    applyFilters(): void {
        let filtered = [...this.tickets];

        if (this.filterStatus) {
            filtered = filtered.filter(t => t.Status === this.filterStatus);
        }

        if (this.filterPriority) {
            filtered = filtered.filter(t => t.Priority === this.filterPriority);
        }

        if (this.filterDateRange && this.filterDateRange.length === 2) {
            const [start, end] = this.filterDateRange;
            filtered = filtered.filter(t => {
                const date = new Date(t.CreatedOn);
                return date >= start && date <= end;
            });
        }

        this.filteredTickets = filtered;
    }

    truncateText(text: string, length: number): string {
        if (!text) return '-';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    getInitials(name: string): string {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' {
        const map: Record<string, 'danger' | 'warn' | 'info' | 'success'> = {
            'critical': 'danger',
            'high': 'warn',
            'medium': 'info',
            'low': 'success'
        };
        return map[priority] || 'info';
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'secondary'> = {
            'Open': 'info',
            'In Progress': 'warn',
            'Assigned': 'secondary',
            'Closed': 'success'
        };
        return map[status] || 'info';
    }

    openCreateDialog(): void {
        this.editMode = false;
        this.ticketForm.reset({ priority: 'Medium' });
        this.dialogVisible = true;
    }

    viewTicket(ticket: MaintenanceTicket): void {
        this.selectedTicket = ticket;
        this.viewDialogVisible = true;
    }

    editTicket(ticket: MaintenanceTicket): void {
        this.editMode = true;
        this.selectedTicket = ticket;
        this.ticketForm.patchValue(ticket);
        this.dialogVisible = true;
    }

    startTicket(ticket: MaintenanceTicket): void {
        this.statusChange.emit({ ticket, newStatus: 'In Progress' });
    }

    completeTicket(ticket: MaintenanceTicket): void {
        this.statusChange.emit({ ticket, newStatus: 'Completed' });
    }

    saveTicket(): void {
        if (!this.ticketForm.valid) return;

        const ticketData = this.ticketForm.value;
        if (this.editMode && this.selectedTicket) {
            this.update.emit({ ...this.selectedTicket, ...ticketData });
        } else {
            this.create.emit(ticketData);
        }
        this.dialogVisible = false;
        this.loadTickets();
    }
}
