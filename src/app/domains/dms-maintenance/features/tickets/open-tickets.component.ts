/**
 * Open Tickets Component
 * Domain: DMS-Maintenance
 *
 * Displays open maintenance tickets with filtering and editing capabilities
 * Based on Image 1: Open Tickets list view
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG v19
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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Domain imports
import { DmsMaintenanceService } from '../../services/maintenance.service';
import { MaintenanceTicket, TicketStatus, TicketStatusColors } from '../../models';
import { AlertPanelComponent } from '../alerts/alert-panel.component';
import { DowntimeNotificationService, DowntimeAlert } from '@core/services/downtime-notification.service';
import { MaintenanceService } from '@core/services/maintenance.service';

@Component({
    selector: 'app-open-tickets',
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
        IconFieldModule,
        InputIconModule,
        ToastModule,
        AlertPanelComponent
    ],
    providers: [MessageService],
    template: `
        <div class="open-tickets">
            <p-toast></p-toast>

            <!-- Main Layout: Vertical Flexbox -->
            <div class="main-layout">

                <!-- TOP SECTION: Alert Panel (Collapsible) -->
                <section class="alerts-section" *ngIf="showAlertPanel">
                    <app-alert-panel
                        [expanded]="alertPanelExpanded"
                        (alertClicked)="onAlertClicked($event)"
                        (acknowledgeClicked)="onAcknowledgeAlert($event)"
                        (takeOverClicked)="onTakeOverAlert($event)">
                    </app-alert-panel>
                </section>

                <!-- BOTTOM SECTION: Tickets List -->
                <section class="tickets-section">
                    <!-- Header with Edit Ticket Button -->
                    <div class="header-section mb-3">
                        <div class="flex justify-content-between align-items-center flex-wrap gap-2">
                            <div class="flex align-items-center gap-2">
                                <button pButton
                                        [icon]="showAlertPanel ? 'pi pi-chevron-up' : 'pi pi-bell'"
                                        class="p-button-rounded p-button-text toggle-alerts-btn"
                                        [class.has-alerts]="unreadAlertCount > 0"
                                        [pTooltip]="showAlertPanel ? 'Masquer les alertes' : 'Afficher les alertes'"
                                        (click)="toggleAlertPanel()">
                                    <span *ngIf="!showAlertPanel && unreadAlertCount > 0"
                                          class="alert-badge">{{ unreadAlertCount }}</span>
                                </button>
                                <p-select [options]="ticketOptions"
                                          [(ngModel)]="selectedTicketId"
                                          optionLabel="label"
                                          optionValue="value"
                                          placeholder="Ticket No."
                                          [filter]="true"
                                          filterPlaceholder="Search..."
                                          styleClass="ticket-select">
                                </p-select>
                                <button pButton label="Edit ticket" icon="pi pi-pencil"
                                        [disabled]="!selectedTicketId"
                                        (click)="openEditDialog()"
                                        class="p-button-outlined">
                                </button>
                            </div>
                            <div class="flex align-items-center gap-2">
                                <button pButton icon="pi pi-refresh" class="p-button-text p-button-rounded"
                                        pTooltip="Refresh" (click)="loadTickets()">
                                </button>
                                <span class="text-sm text-color-secondary">
                                    <i class="pi pi-clock mr-1"></i>
                                    Last updated: {{ lastUpdated | date:'HH:mm:ss' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Stats -->
                    <div class="stats-row mb-3" *ngIf="tickets.length > 0">
                        <div class="stat-item stat-open">
                            <span class="stat-value">{{ getOpenCount() }}</span>
                            <span class="stat-label">Open</span>
                        </div>
                        <div class="stat-item stat-progress">
                            <span class="stat-value">{{ getInProgressCount() }}</span>
                            <span class="stat-label">In Progress</span>
                        </div>
                        <div class="stat-item stat-assigned">
                            <span class="stat-value">{{ getAssignedCount() }}</span>
                            <span class="stat-label">Assigned</span>
                        </div>
                        <div class="stat-item stat-critical">
                            <span class="stat-value">{{ getCriticalCount() }}</span>
                            <span class="stat-label">Critical</span>
                        </div>
                    </div>

                    <!-- Main Table Card -->
                    <p-card styleClass="ticket-table-card">
                <p-table [value]="tickets"
                         [loading]="loading"
                         [paginator]="true"
                         [rows]="15"
                         [rowsPerPageOptions]="[10, 15, 25, 50]"
                         [rowHover]="true"
                         [showCurrentPageReport]="true"
                         currentPageReportTemplate="Showing {first} to {last} of {totalRecords} tickets"
                         [globalFilterFields]="['TicketNo', 'Zone', 'Project', 'ProductionLine', 'Machine', 'Description']"
                         [reorderableColumns]="true"
                         [resizableColumns]="true"
                         columnResizeMode="expand"
                         styleClass="p-datatable-sm p-datatable-gridlines"
                         [scrollable]="true"
                         scrollHeight="calc(100vh - 280px)"
                         #dt>

                    <!-- Caption with search -->
                    <ng-template pTemplate="caption">
                        <div class="table-caption">
                            <span class="caption-hint text-sm text-color-secondary">
                                <i class="pi pi-info-circle mr-1"></i>
                                Drag a column header here to group by that column
                            </span>
                            <p-iconfield iconPosition="left" class="search-field">
                                <p-inputicon styleClass="pi pi-search"></p-inputicon>
                                <input pInputText type="text"
                                       (input)="dt.filterGlobal($any($event.target).value, 'contains')"
                                       placeholder="Search..." />
                            </p-iconfield>
                        </div>
                    </ng-template>

                    <ng-template pTemplate="header">
                        <tr>
                            <th pSortableColumn="TicketNo" pReorderableColumn style="min-width: 100px">
                                Ticket <p-sortIcon field="TicketNo"></p-sortIcon>
                            </th>
                            <th pSortableColumn="Zone" pReorderableColumn style="min-width: 120px">
                                Zone <p-sortIcon field="Zone"></p-sortIcon>
                            </th>
                            <th pSortableColumn="Project" pReorderableColumn style="min-width: 150px">
                                Project <p-sortIcon field="Project"></p-sortIcon>
                            </th>
                            <th pSortableColumn="ProductionLine" pReorderableColumn style="min-width: 180px">
                                Production Line <p-sortIcon field="ProductionLine"></p-sortIcon>
                            </th>
                            <th pSortableColumn="Workstation" pReorderableColumn style="min-width: 150px">
                                Workstation <p-sortIcon field="Workstation"></p-sortIcon>
                            </th>
                            <th pSortableColumn="Machine" pReorderableColumn style="min-width: 120px">
                                Machine <p-sortIcon field="Machine"></p-sortIcon>
                            </th>
                            <th pSortableColumn="Description" pReorderableColumn style="min-width: 200px">
                                Description <p-sortIcon field="Description"></p-sortIcon>
                            </th>
                            <th pSortableColumn="Status" pReorderableColumn style="min-width: 100px">
                                Status <p-sortIcon field="Status"></p-sortIcon>
                            </th>
                            <th pSortableColumn="DowntimeStartsAt" pReorderableColumn style="min-width: 160px">
                                Downtime starts at <p-sortIcon field="DowntimeStartsAt"></p-sortIcon>
                            </th>
                            <th pSortableColumn="CreatedOn" pReorderableColumn style="min-width: 160px">
                                Created on <p-sortIcon field="CreatedOn"></p-sortIcon>
                            </th>
                            <th pSortableColumn="AssignedTo" pReorderableColumn style="min-width: 150px">
                                Assigned to <p-sortIcon field="AssignedTo"></p-sortIcon>
                            </th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-ticket>
                        <tr [class.row-open]="ticket.Status === 'Open'"
                            [class.row-closed]="ticket.Status === 'Closed'"
                            (click)="selectTicket(ticket)"
                            [class.selected-row]="selectedTicketId === ticket.Id_Ticket">
                            <td>
                                <span class="ticket-no">{{ ticket.TicketNo }}</span>
                            </td>
                            <td>{{ ticket.Zone }}</td>
                            <td>{{ ticket.Project }}</td>
                            <td>{{ ticket.ProductionLine }}</td>
                            <td>{{ ticket.Workstation }}</td>
                            <td>
                                <span class="machine-code">{{ ticket.Machine }}</span>
                            </td>
                            <td>
                                <span [pTooltip]="ticket.Description" tooltipPosition="top">
                                    {{ truncateText(ticket.Description, 30) }}
                                </span>
                            </td>
                            <td>
                                <p-tag [value]="ticket.Status"
                                       [severity]="getStatusSeverity(ticket.Status)"
                                       styleClass="status-tag">
                                </p-tag>
                            </td>
                            <td>{{ ticket.DowntimeStartsAt | date:'dd/MM/yyyy HH:mm' }}</td>
                            <td>{{ ticket.CreatedOn | date:'dd/MM/yyyy HH:mm' }}</td>
                            <td>{{ ticket.AssignedTo || '-' }}</td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="11" class="text-center p-4">
                                <i class="pi pi-inbox text-4xl text-color-secondary mb-2"></i>
                                <p class="font-semibold m-0">No Open Tickets</p>
                                <p class="text-sm text-color-secondary m-0">
                                    All maintenance tickets have been resolved
                                </p>
                            </td>
                        </tr>
                    </ng-template>
                    </p-table>
                    </p-card>
                </section>
            </div>

            <!-- Edit Ticket Dialog -->
            <p-dialog [(visible)]="editDialogVisible"
                      [modal]="true"
                      header="Edit Ticket"
                      [style]="{ width: '700px' }"
                      [draggable]="true"
                      [resizable]="true">
                <form *ngIf="editForm" [formGroup]="editForm" class="grid p-fluid">
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Ticket No.</label>
                        <input pInputText formControlName="TicketNo" [readonly]="true" />
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Status</label>
                        <p-select [options]="statusOptions"
                                  formControlName="Status"
                                  optionLabel="label"
                                  optionValue="value">
                        </p-select>
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Zone</label>
                        <input pInputText formControlName="Zone" />
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Project</label>
                        <input pInputText formControlName="Project" />
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Production Line</label>
                        <input pInputText formControlName="ProductionLine" />
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Machine</label>
                        <input pInputText formControlName="Machine" />
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Assigned To</label>
                        <p-select [options]="technicianOptions"
                                  formControlName="AssignedTo"
                                  optionLabel="label"
                                  optionValue="value"
                                  [showClear]="true"
                                  placeholder="Select Technician">
                        </p-select>
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Downtime Starts At</label>
                        <p-datepicker formControlName="DowntimeStartsAt"
                                      [showTime]="true"
                                      [showIcon]="true"
                                      dateFormat="dd/mm/yy">
                        </p-datepicker>
                    </div>
                    <div class="col-12">
                        <label class="block mb-2 font-medium">Description</label>
                        <textarea pTextarea formControlName="Description" rows="3"></textarea>
                    </div>
                    <div class="col-12">
                        <label class="block mb-2 font-medium">Actions / Resolution</label>
                        <textarea pTextarea formControlName="Actions" rows="3"
                                  placeholder="Enter actions taken or resolution..."></textarea>
                    </div>
                </form>
                <ng-template pTemplate="footer">
                    <button pButton label="Cancel" icon="pi pi-times"
                            class="p-button-text" (click)="editDialogVisible = false">
                    </button>
                    <button pButton label="Save" icon="pi pi-check"
                            (click)="saveTicket()" [disabled]="editForm && !editForm.valid">
                    </button>
                </ng-template>
            </p-dialog>
        </div>
    `,
    styles: [`
        .open-tickets {
            padding: 1rem;
            background: var(--surface-ground);
            min-height: calc(100vh - 120px);
        }

        /* ==================== MAIN LAYOUT - FLEXBOX VERTICAL ==================== */
        .main-layout {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            width: 100%;
        }

        /* ==================== ALERTS SECTION (TOP) ==================== */
        .alerts-section {
            width: 100%;
            animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
                max-height: 0;
            }
            to {
                opacity: 1;
                transform: translateY(0);
                max-height: 500px;
            }
        }

        /* ==================== TICKETS SECTION (BOTTOM) ==================== */
        .tickets-section {
            width: 100%;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .header-section {
            background: var(--surface-card);
            padding: 0.75rem 1rem;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .toggle-alerts-btn {
            position: relative;
            transition: all 0.3s ease;
        }

        .toggle-alerts-btn.has-alerts {
            background: var(--red-50);
            color: var(--red-500);
        }

        .ticket-select {
            min-width: 200px;
        }

        :host ::ng-deep .ticket-table-card {
            .p-card-body {
                padding: 0;
            }
            .p-card-content {
                padding: 0;
            }
        }

        .table-caption {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 1rem;
            background: var(--surface-50);
            border-bottom: 1px solid var(--surface-border);
        }

        .caption-hint {
            font-style: italic;
        }

        .search-field {
            width: 300px;
        }

        .ticket-no {
            font-family: monospace;
            font-weight: 600;
            color: var(--primary-color);
        }

        .machine-code {
            font-family: monospace;
            background: var(--surface-100);
            padding: 0.15rem 0.5rem;
            border-radius: 4px;
            font-size: 0.85rem;
        }

        :host ::ng-deep .status-tag {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
        }

        .row-open {
            background-color: rgba(245, 158, 11, 0.05);
        }

        .row-closed {
            background-color: rgba(16, 185, 129, 0.05);
        }

        .selected-row {
            background-color: var(--primary-50) !important;
        }

        :host ::ng-deep .p-datatable {
            .p-datatable-thead > tr > th {
                background: var(--surface-100);
                font-weight: 600;
                font-size: 0.85rem;
                padding: 0.75rem 0.5rem;
                white-space: nowrap;
            }

            .p-datatable-tbody > tr > td {
                padding: 0.5rem;
                font-size: 0.85rem;
            }

            .p-datatable-tbody > tr {
                cursor: pointer;
                transition: background-color 0.2s;

                &:hover {
                    background-color: var(--surface-hover);
                }
            }
        }

        :host ::ng-deep .p-paginator {
            padding: 0.75rem 1rem;
            background: var(--surface-card);
            border-top: 1px solid var(--surface-border);
        }

        /* Alert badge */
        .alert-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: var(--red-500);
            color: white;
            font-size: 0.7rem;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 10px;
            min-width: 18px;
            text-align: center;
        }

        /* Stats row */
        .stats-row {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            min-width: 100px;
        }

        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
        }

        .stat-label {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }

        .stat-open {
            background: var(--orange-50);
            border: 1px solid var(--orange-200);
        }
        .stat-open .stat-value { color: var(--orange-600); }

        .stat-progress {
            background: var(--blue-50);
            border: 1px solid var(--blue-200);
        }
        .stat-progress .stat-value { color: var(--blue-600); }

        .stat-assigned {
            background: var(--green-50);
            border: 1px solid var(--green-200);
        }
        .stat-assigned .stat-value { color: var(--green-600); }

        .stat-critical {
            background: var(--red-50);
            border: 1px solid var(--red-200);
        }
        .stat-critical .stat-value { color: var(--red-600); }

        /* Responsive */
        @media (max-width: 768px) {
            .stats-row {
                justify-content: center;
            }
            .stat-item {
                min-width: 80px;
                padding: 0.5rem 1rem;
            }
        }
    `]
})
export class OpenTicketsComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    tickets: MaintenanceTicket[] = [];
    loading = false;
    selectedTicketId: number | null = null;
    lastUpdated = new Date();

    // Alert panel state
    showAlertPanel = true;
    alertPanelExpanded = false;
    unreadAlertCount = 0;

    ticketOptions: { label: string; value: number }[] = [];

    statusOptions = [
        { label: 'Open', value: 'Open' },
        { label: 'Closed', value: 'Closed' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Assigned', value: 'Assigned' }
    ];

    technicianOptions = [
        { label: 'ZIAR Mohamed', value: 'ZIAR Mohamed' },
        { label: 'DAHRI Abdellalif', value: 'DAHRI Abdellalif' },
        { label: 'EL HOUSSI Khalid', value: 'EL HOUSSI Khalid' },
        { label: 'SENHOUNI YASSINE', value: 'SENHOUNI YASSINE' }
    ];

    editDialogVisible = false;
    editForm: FormGroup | null = null;

    constructor(
        private fb: FormBuilder,
        private maintenanceService: DmsMaintenanceService,
        private coreMaintenanceService: MaintenanceService,
        private notificationService: DowntimeNotificationService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadTickets();
        this.initializeNotifications();
    }

    private initializeNotifications(): void {
        // Start notification polling
        this.notificationService.startPolling(10);

        // Subscribe to unread count
        this.notificationService.unreadCount$
            .pipe(takeUntil(this.destroy$))
            .subscribe(count => {
                this.unreadAlertCount = count;
            });

        // Subscribe to new alerts for auto-refresh
        this.notificationService.newAlert$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                // Refresh tickets when new downtime is declared
                this.loadTickets();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.notificationService.stopPolling();
    }

    // ==================== Alert Panel Methods ====================

    toggleAlertPanel(): void {
        this.showAlertPanel = !this.showAlertPanel;
    }

    onAlertClicked(alert: DowntimeAlert): void {
        // Find and select the ticket related to this alert
        const ticket = this.tickets.find(t =>
            t.TicketNo === alert.ticketNumber ||
            t.Workstation === alert.workstation
        );
        if (ticket) {
            this.selectedTicketId = ticket.Id_Ticket;
            this.messageService.add({
                severity: 'info',
                summary: 'Ticket Selected',
                detail: `Ticket ${ticket.TicketNo} selected`
            });
        }
    }

    onAcknowledgeAlert(alert: DowntimeAlert): void {
        this.coreMaintenanceService.acknowledgeDeclaration(alert.declarationId, {
            acknowledged_by: 1 // TODO: Get current user ID
        }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Acknowledged',
                    detail: `Alert for ${alert.workstation} acknowledged`
                });
                this.loadTickets();
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to acknowledge alert'
                });
            }
        });
    }

    onTakeOverAlert(alert: DowntimeAlert): void {
        // TODO: Get current user ID from auth service
        const currentUserId = 1;
        this.coreMaintenanceService.startWorkOnDeclaration(alert.declarationId, currentUserId).subscribe({
            next: () => {
                this.notificationService.notifyWorkStarted(alert.declarationId, 'Current User');
                this.messageService.add({
                    severity: 'success',
                    summary: 'Assigned',
                    detail: `You are now working on ${alert.workstation}`
                });
                this.loadTickets();
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to take over alert'
                });
            }
        });
    }

    // ==================== Statistics Methods ====================

    getOpenCount(): number {
        return this.tickets.filter(t => t.Status === 'Open').length;
    }

    getInProgressCount(): number {
        return this.tickets.filter(t => t.Status === 'In Progress').length;
    }

    getAssignedCount(): number {
        return this.tickets.filter(t => t.Status === 'Assigned').length;
    }

    getCriticalCount(): number {
        return this.tickets.filter(t => t.Priority === 'critical').length;
    }

    // ==================== Data Loading ====================

    loadTickets(): void {
        this.loading = true;
        this.maintenanceService.getTickets({ status: 'Open' })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.tickets = data;
                    this.ticketOptions = data.map(t => ({
                        label: t.TicketNo,
                        value: t.Id_Ticket
                    }));
                    this.loading = false;
                    this.lastUpdated = new Date();
                },
                error: () => {
                    this.loading = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load tickets'
                    });
                }
            });
    }

    selectTicket(ticket: MaintenanceTicket): void {
        this.selectedTicketId = ticket.Id_Ticket;
    }

    openEditDialog(): void {
        const ticket = this.tickets.find(t => t.Id_Ticket === this.selectedTicketId);
        if (!ticket) return;

        this.editForm = this.fb.group({
            TicketNo: [ticket.TicketNo],
            Status: [ticket.Status, Validators.required],
            Zone: [ticket.Zone],
            Project: [ticket.Project],
            ProductionLine: [ticket.ProductionLine],
            Machine: [ticket.Machine],
            AssignedTo: [ticket.AssignedTo],
            DowntimeStartsAt: [ticket.DowntimeStartsAt ? new Date(ticket.DowntimeStartsAt) : null],
            Description: [ticket.Description],
            Actions: [ticket.Actions || '']
        });

        this.editDialogVisible = true;
    }

    saveTicket(): void {
        if (!this.editForm || !this.editForm.valid || !this.selectedTicketId) return;

        const formValue = this.editForm.value;
        this.maintenanceService.updateTicket(this.selectedTicketId, formValue)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Ticket updated successfully'
                    });
                    this.editDialogVisible = false;
                    this.loadTickets();
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

    truncateText(text: string, length: number): string {
        if (!text) return '-';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    getStatusSeverity(status: TicketStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: Record<TicketStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            'Open': 'warn',
            'Closed': 'success',
            'In Progress': 'info',
            'Assigned': 'secondary'
        };
        return map[status] || 'info';
    }
}
