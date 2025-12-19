/**
 * Maintenance Data Component
 * Domain: DMS-Maintenance
 *
 * Detailed view of all maintenance tickets with full information
 * Based on Image 3 - Data view with all columns
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG v19
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Domain imports
import { DmsMaintenanceService } from '../../services/maintenance.service';
import { MaintenanceTicket, TicketStatus } from '../../models';

@Component({
    selector: 'app-maintenance-data',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        CardModule,
        ButtonModule,
        TagModule,
        TooltipModule,
        ToolbarModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
        <div class="maintenance-data">
            <p-toast></p-toast>

            <!-- Toolbar -->
            <div class="toolbar-section mb-3">
                <button pButton icon="pi pi-refresh" label="Refresh"
                        class="p-button-outlined mr-2"
                        (click)="loadData()">
                </button>
                <button pButton icon="pi pi-download" label="Export"
                        class="p-button-outlined"
                        (click)="exportData()">
                </button>
            </div>

            <!-- Main Table -->
            <p-card styleClass="data-table-card">
                <ng-template pTemplate="header">
                    <div class="table-header">
                        <span class="caption-hint text-sm text-color-secondary">
                            <i class="pi pi-info-circle mr-1"></i>
                            Drag a column header here to group by that column
                        </span>
                        <p-iconfield iconPosition="left">
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input pInputText type="text"
                                   (input)="dt.filterGlobal($any($event.target).value, 'contains')"
                                   placeholder="Search..." />
                        </p-iconfield>
                    </div>
                </ng-template>

                <p-table [value]="tickets"
                         [loading]="loading"
                         [paginator]="true"
                         [rows]="15"
                         [rowsPerPageOptions]="[10, 15, 25, 50]"
                         [rowHover]="true"
                         [showCurrentPageReport]="true"
                         currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                         [globalFilterFields]="['TicketNo', 'Zone', 'Project', 'ProductionLine', 'Machine', 'Description', 'AssignedTo']"
                         [reorderableColumns]="true"
                         [resizableColumns]="true"
                         columnResizeMode="expand"
                         styleClass="p-datatable-sm p-datatable-gridlines"
                         [scrollable]="true"
                         scrollHeight="calc(100vh - 260px)"
                         #dt>

                    <ng-template pTemplate="header">
                        <tr>
                            <th pSortableColumn="TicketNo" pReorderableColumn style="min-width: 80px">
                                Ticket No <p-sortIcon field="TicketNo"></p-sortIcon>
                            </th>
                            <th pSortableColumn="CreatedOn" pReorderableColumn style="min-width: 100px">
                                Date <p-sortIcon field="CreatedOn"></p-sortIcon>
                            </th>
                            <th pSortableColumn="CreatedOn" pReorderableColumn style="min-width: 120px">
                                Created on <p-sortIcon field="CreatedOn"></p-sortIcon>
                            </th>
                            <th pSortableColumn="Zone" pReorderableColumn style="min-width: 100px">
                                Zone <p-sortIcon field="Zone"></p-sortIcon>
                            </th>
                            <th pSortableColumn="Project" pReorderableColumn style="min-width: 120px">
                                Project <p-sortIcon field="Project"></p-sortIcon>
                            </th>
                            <th pSortableColumn="ProductionLine" pReorderableColumn style="min-width: 130px">
                                Production <p-sortIcon field="ProductionLine"></p-sortIcon>
                            </th>
                            <th pSortableColumn="Workstation" pReorderableColumn style="min-width: 120px">
                                Workstation <p-sortIcon field="Workstation"></p-sortIcon>
                            </th>
                            <th pSortableColumn="Machine" pReorderableColumn style="min-width: 100px">
                                Machine <p-sortIcon field="Machine"></p-sortIcon>
                            </th>
                            <th pSortableColumn="DowntimeStartsAt" pReorderableColumn style="min-width: 120px">
                                Downtime <p-sortIcon field="DowntimeStartsAt"></p-sortIcon>
                            </th>
                            <th pSortableColumn="Description" pReorderableColumn style="min-width: 130px">
                                Description <p-sortIcon field="Description"></p-sortIcon>
                            </th>
                            <th pSortableColumn="Status" pReorderableColumn style="min-width: 80px">
                                Status <p-sortIcon field="Status"></p-sortIcon>
                            </th>
                            <th pSortableColumn="AssignedTo" pReorderableColumn style="min-width: 120px">
                                Assigned to <p-sortIcon field="AssignedTo"></p-sortIcon>
                            </th>
                            <th style="min-width: 100px">Intervention</th>
                            <th style="min-width: 100px">Causes</th>
                            <th style="min-width: 100px">Actions/C</th>
                            <th style="min-width: 100px">Intervention Time</th>
                            <th style="min-width: 100px">Reactivity</th>
                            <th style="min-width: 100px">Waiting Time</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-ticket>
                        <tr [class.row-open]="ticket.Status === 'Open'"
                            [class.row-closed]="ticket.Status === 'Closed'">
                            <td>
                                <span class="ticket-no">{{ ticket.TicketNo }}</span>
                            </td>
                            <td>{{ ticket.CreatedOn | date:'dd/MM/yyyy' }}</td>
                            <td>{{ ticket.CreatedOn | date:'dd/MM/yyyy' }}</td>
                            <td>{{ ticket.Zone }}</td>
                            <td>{{ ticket.Project }}</td>
                            <td>
                                <span [pTooltip]="ticket.ProductionLine" tooltipPosition="top">
                                    {{ truncateText(ticket.ProductionLine, 15) }}
                                </span>
                            </td>
                            <td>
                                <span [pTooltip]="ticket.Workstation" tooltipPosition="top">
                                    {{ truncateText(ticket.Workstation, 12) }}
                                </span>
                            </td>
                            <td>
                                <span class="machine-code">{{ ticket.Machine }}</span>
                            </td>
                            <td>{{ ticket.DowntimeStartsAt | date:'dd/MM/yyyy' }}</td>
                            <td>
                                <span [pTooltip]="ticket.Description" tooltipPosition="top">
                                    {{ truncateText(ticket.Description, 15) }}
                                </span>
                            </td>
                            <td>
                                <p-tag [value]="ticket.Status"
                                       [severity]="getStatusSeverity(ticket.Status)"
                                       styleClass="status-tag">
                                </p-tag>
                            </td>
                            <td>{{ ticket.AssignedTo || '-' }}</td>
                            <td>{{ ticket.InterventionTime || '-' }}</td>
                            <td>
                                <span [pTooltip]="ticket.Causes" tooltipPosition="top">
                                    {{ truncateText(ticket.Causes || '', 12) }}
                                </span>
                            </td>
                            <td>
                                <span [pTooltip]="ticket.Actions" tooltipPosition="top">
                                    {{ truncateText(ticket.Actions || '', 12) }}
                                </span>
                            </td>
                            <td class="text-center">
                                <span *ngIf="ticket.InterventionTime" class="time-value">
                                    {{ ticket.InterventionTime }}
                                </span>
                                <span *ngIf="!ticket.InterventionTime">-</span>
                            </td>
                            <td class="text-center">
                                <span *ngIf="ticket.ReactivityTime" class="time-value">
                                    {{ ticket.ReactivityTime }}
                                </span>
                                <span *ngIf="!ticket.ReactivityTime">-</span>
                            </td>
                            <td class="text-center">
                                <span *ngIf="ticket.WaitingTime" class="time-value">
                                    {{ ticket.WaitingTime }}
                                </span>
                                <span *ngIf="!ticket.WaitingTime">-</span>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="18" class="text-center p-4">
                                <i class="pi pi-inbox text-4xl text-color-secondary mb-2"></i>
                                <p class="font-semibold m-0">No data found</p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>
        </div>
    `,
    styles: [`
        .maintenance-data {
            padding: 1rem;
            background: var(--surface-ground);
            min-height: calc(100vh - 120px);
        }

        .toolbar-section {
            background: var(--surface-card);
            padding: 0.75rem 1rem;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        :host ::ng-deep .data-table-card {
            .p-card-body {
                padding: 0;
            }
            .p-card-content {
                padding: 0;
            }
        }

        .table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem;
            background: var(--surface-50);
            border-bottom: 1px solid var(--surface-border);
        }

        .caption-hint {
            font-style: italic;
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
            font-size: 0.8rem;
        }

        :host ::ng-deep .status-tag {
            font-size: 0.7rem;
            padding: 0.2rem 0.4rem;
        }

        .time-value {
            font-family: monospace;
            font-weight: 500;
        }

        .row-open {
            background-color: rgba(245, 158, 11, 0.05);
        }

        .row-closed {
            background-color: rgba(16, 185, 129, 0.05);
        }

        :host ::ng-deep .p-datatable {
            .p-datatable-thead > tr > th {
                background: var(--surface-100);
                font-weight: 600;
                font-size: 0.75rem;
                padding: 0.5rem 0.35rem;
                white-space: nowrap;
            }

            .p-datatable-tbody > tr > td {
                padding: 0.35rem;
                font-size: 0.8rem;
            }

            .p-datatable-tbody > tr {
                cursor: pointer;
                transition: background-color 0.2s;

                &:hover {
                    background-color: var(--surface-hover);
                }
            }
        }
    `]
})
export class MaintenanceDataComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    tickets: MaintenanceTicket[] = [];
    loading = false;

    constructor(
        private maintenanceService: DmsMaintenanceService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadData(): void {
        this.loading = true;
        this.maintenanceService.getTickets()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.tickets = data;
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load data'
                    });
                }
            });
    }

    exportData(): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Export',
            detail: 'Exporting data...'
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
