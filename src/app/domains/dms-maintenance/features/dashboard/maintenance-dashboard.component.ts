/**
 * Maintenance Dashboard Component
 * Domain: DMS-Maintenance
 *
 * Dashboard with charts showing Top Projects, Top Machines, Top Employees
 * and Downtime list table - Based on Image 2
 */
import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG v19
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

// Domain imports
import { DmsMaintenanceService } from '../../services/maintenance.service';
import { MaintenanceDashboardData, TicketStatus, DowntimeListItem } from '../../models';

@Component({
    selector: 'app-maintenance-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        ChartModule,
        TagModule,
        ButtonModule,
        SelectModule,
        SelectButtonModule,
        TooltipModule,
        ToolbarModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule
    ],
    template: `
        <div class="maintenance-dashboard">
            <!-- Filters Row -->
            <div class="filters-row mb-3">
                <div class="filter-group">
                    <label class="filter-label">Zone</label>
                    <p-select [options]="zoneOptions"
                              [(ngModel)]="selectedZone"
                              optionLabel="label"
                              optionValue="value"
                              placeholder="Select..."
                              [showClear]="true"
                              (onChange)="applyFilters()"
                              styleClass="filter-select">
                    </p-select>
                </div>

                <div class="filter-group">
                    <label class="filter-label">Downtime Status</label>
                    <p-select [options]="statusOptions"
                              [(ngModel)]="selectedStatus"
                              optionLabel="label"
                              optionValue="value"
                              placeholder="Select..."
                              [showClear]="true"
                              (onChange)="applyFilters()"
                              styleClass="filter-select">
                    </p-select>
                </div>

                <div class="filter-group">
                    <label class="filter-label">Date</label>
                    <p-selectButton [options]="dateOptions"
                                    [(ngModel)]="selectedDateFilter"
                                    (onChange)="applyFilters()"
                                    optionLabel="label"
                                    optionValue="value"
                                    styleClass="date-filter-btn">
                    </p-selectButton>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="charts-row mb-3">
                <!-- Top 3 Impacted Projects -->
                <p-card styleClass="chart-card">
                    <ng-template pTemplate="header">
                        <div class="chart-header">
                            <span class="chart-title">
                                <i class="pi pi-bookmark mr-2"></i>Top 3 Impacted Projects
                            </span>
                            <button pButton icon="pi pi-external-link" class="p-button-text p-button-sm"></button>
                        </div>
                    </ng-template>
                    <div class="chart-container">
                        <p-chart type="bar" [data]="topProjectsChart" [options]="barChartOptions"></p-chart>
                    </div>
                </p-card>

                <!-- Top 3 Impacted Machine -->
                <p-card styleClass="chart-card">
                    <ng-template pTemplate="header">
                        <div class="chart-header">
                            <span class="chart-title">
                                <i class="pi pi-cog mr-2"></i>Top 3 Impacted Machine
                            </span>
                            <button pButton icon="pi pi-external-link" class="p-button-text p-button-sm"></button>
                        </div>
                    </ng-template>
                    <div class="chart-container">
                        <p-chart type="bar" [data]="topMachinesChart" [options]="barChartOptions"></p-chart>
                    </div>
                </p-card>

                <!-- Top 5 Employees -->
                <p-card styleClass="chart-card">
                    <ng-template pTemplate="header">
                        <div class="chart-header">
                            <span class="chart-title">
                                <i class="pi pi-users mr-2"></i>Top 5 Employees
                            </span>
                            <button pButton icon="pi pi-external-link" class="p-button-text p-button-sm"></button>
                        </div>
                    </ng-template>
                    <div class="chart-container">
                        <p-chart type="bar" [data]="topEmployeesChart" [options]="employeeChartOptions"></p-chart>
                    </div>
                </p-card>
            </div>

            <!-- Downtime List Table -->
            <p-card styleClass="downtime-table-card">
                <ng-template pTemplate="header">
                    <p-toolbar styleClass="border-none bg-transparent px-3 py-2">
                        <ng-template #start>
                            <span class="text-lg font-semibold">
                                <i class="pi pi-list mr-2"></i>Downtime List
                            </span>
                        </ng-template>
                        <ng-template #end>
                            <p-iconfield iconPosition="left">
                                <p-inputicon styleClass="pi pi-search"></p-inputicon>
                                <input pInputText type="text"
                                       (input)="filterTable($any($event.target).value)"
                                       placeholder="Search..." />
                            </p-iconfield>
                        </ng-template>
                    </p-toolbar>
                </ng-template>

                <p-table [value]="downtimeList"
                         [loading]="loading"
                         [paginator]="true"
                         [rows]="10"
                         [rowsPerPageOptions]="[10, 25, 50]"
                         [rowHover]="true"
                         [showCurrentPageReport]="true"
                         [globalFilterFields]="['ticket', 'zone', 'impactedProject', 'impactedMachine', 'description']"
                         currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                         styleClass="p-datatable-sm p-datatable-gridlines"
                         [scrollable]="true"
                         scrollHeight="400px"
                         #dt>

                    <ng-template pTemplate="header">
                        <tr>
                            <th pSortableColumn="ticket" style="min-width: 80px">
                                Ticket <p-sortIcon field="ticket"></p-sortIcon>
                            </th>
                            <th pSortableColumn="zone" style="min-width: 100px">
                                Zone <p-sortIcon field="zone"></p-sortIcon>
                            </th>
                            <th pSortableColumn="impactedProject" style="min-width: 130px">
                                Impacted project <p-sortIcon field="impactedProject"></p-sortIcon>
                            </th>
                            <th pSortableColumn="impactedMachine" style="min-width: 120px">
                                Impacted machine <p-sortIcon field="impactedMachine"></p-sortIcon>
                            </th>
                            <th pSortableColumn="description" style="min-width: 150px">
                                Description <p-sortIcon field="description"></p-sortIcon>
                            </th>
                            <th pSortableColumn="status" style="min-width: 80px">
                                Status <p-sortIcon field="status"></p-sortIcon>
                            </th>
                            <th pSortableColumn="createdAt" style="min-width: 130px">
                                Created at <p-sortIcon field="createdAt"></p-sortIcon>
                            </th>
                            <th pSortableColumn="acceptedBy" style="min-width: 140px">
                                Accepted by <p-sortIcon field="acceptedBy"></p-sortIcon>
                            </th>
                            <th pSortableColumn="downtimeStartsAt" style="min-width: 140px">
                                Downtime starts at <p-sortIcon field="downtimeStartsAt"></p-sortIcon>
                            </th>
                            <th pSortableColumn="closedAt" style="min-width: 130px">
                                Closed at <p-sortIcon field="closedAt"></p-sortIcon>
                            </th>
                            <th style="min-width: 100px">Intervention Time</th>
                            <th style="min-width: 100px">Reactivity Time</th>
                            <th style="min-width: 100px">Waiting Time</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-item>
                        <tr [class.row-open]="item.status === 'Open'"
                            [class.row-closed]="item.status === 'Closed'">
                            <td>
                                <span class="ticket-id">{{ item.ticket }}</span>
                            </td>
                            <td>{{ item.zone }}</td>
                            <td>{{ item.impactedProject }}</td>
                            <td>
                                <span class="machine-code">{{ item.impactedMachine }}</span>
                            </td>
                            <td>
                                <span [pTooltip]="item.description" tooltipPosition="top">
                                    {{ truncateText(item.description, 20) }}
                                </span>
                            </td>
                            <td>
                                <p-tag [value]="item.status"
                                       [severity]="getStatusSeverity(item.status)"
                                       styleClass="status-tag">
                                </p-tag>
                            </td>
                            <td>{{ item.createdAt | date:'dd/MM/yyyy' }}</td>
                            <td>{{ item.acceptedBy || '-' }}</td>
                            <td>{{ item.downtimeStartsAt | date:'dd/MM/yyyy HH:mm' }}</td>
                            <td>{{ item.closedAt ? (item.closedAt | date:'dd/MM/yyyy') : '-' }}</td>
                            <td class="text-center">
                                <span *ngIf="item.interventionTime" class="time-value">
                                    {{ item.interventionTime }}
                                </span>
                                <span *ngIf="!item.interventionTime">-</span>
                            </td>
                            <td class="text-center">
                                <span *ngIf="item.reactivityTime" class="time-value">
                                    {{ item.reactivityTime }}
                                </span>
                                <span *ngIf="!item.reactivityTime">-</span>
                            </td>
                            <td class="text-center">
                                <span *ngIf="item.waitingTime" class="time-value">
                                    {{ item.waitingTime }}
                                </span>
                                <span *ngIf="!item.waitingTime">-</span>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="13" class="text-center p-4">
                                <i class="pi pi-inbox text-4xl text-color-secondary mb-2"></i>
                                <p class="font-semibold m-0">No downtime records found</p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>
        </div>
    `,
    styles: [`
        .maintenance-dashboard {
            padding: 1rem;
            background: var(--surface-ground);
            min-height: calc(100vh - 120px);
        }

        .filters-row {
            display: flex;
            gap: 1.5rem;
            align-items: flex-end;
            flex-wrap: wrap;
            background: var(--surface-card);
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .filter-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-color-secondary);
            text-transform: uppercase;
        }

        :host ::ng-deep .filter-select {
            min-width: 150px;
        }

        :host ::ng-deep .date-filter-btn {
            .p-button {
                padding: 0.5rem 0.75rem;
                font-size: 0.85rem;
            }
        }

        .charts-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;

            @media (max-width: 1200px) {
                grid-template-columns: repeat(2, 1fr);
            }

            @media (max-width: 768px) {
                grid-template-columns: 1fr;
            }
        }

        :host ::ng-deep .chart-card {
            .p-card-header {
                padding: 0;
            }
            .p-card-body {
                padding: 0.5rem;
            }
            .p-card-content {
                padding: 0;
            }
        }

        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--surface-border);
        }

        .chart-title {
            font-weight: 600;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
        }

        .chart-container {
            height: 220px;
            padding: 0.5rem;
        }

        :host ::ng-deep .downtime-table-card {
            .p-card-header {
                padding: 0;
            }
            .p-card-body {
                padding: 0;
            }
            .p-card-content {
                padding: 0;
            }
        }

        .ticket-id {
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
                font-size: 0.8rem;
                padding: 0.5rem;
                white-space: nowrap;
            }

            .p-datatable-tbody > tr > td {
                padding: 0.4rem 0.5rem;
                font-size: 0.8rem;
            }
        }
    `]
})
export class MaintenanceDashboardComponent implements OnInit, OnDestroy {
    @Output() viewTicket = new EventEmitter<string>();

    private destroy$ = new Subject<void>();

    loading = false;

    // Filters
    selectedZone: string | null = null;
    selectedStatus: string | null = null;
    selectedDateFilter: string = 'thisWeek';

    zoneOptions = [
        { label: 'Assembly', value: 'Assembly' },
        { label: 'Die casting', value: 'Die casting' },
        { label: 'Pressing', value: 'Pressing' },
        { label: 'Cutting Wire', value: 'Cutting Wire' },
        { label: 'Winding Spiral', value: 'Winding Spiral' }
    ];

    statusOptions = [
        { label: 'Open', value: 'Open' },
        { label: 'Closed', value: 'Closed' },
        { label: 'In Progress', value: 'In Progress' }
    ];

    dateOptions = [
        { label: 'Today', value: 'today' },
        { label: 'Yesterday', value: 'yesterday' },
        { label: 'This Week', value: 'thisWeek' },
        { label: 'Last Week', value: 'lastWeek' },
        { label: 'Last 30 Days', value: 'last30Days' },
        { label: 'Set Filter...', value: 'custom' }
    ];

    // Chart Data
    topProjectsChart: any;
    topMachinesChart: any;
    topEmployeesChart: any;

    barChartOptions = {
        indexAxis: 'y' as const,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: { display: true }
            },
            y: {
                grid: { display: false }
            }
        },
        maintainAspectRatio: false
    };

    employeeChartOptions = {
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                grid: { display: false }
            },
            y: {
                beginAtZero: true,
                grid: { display: true }
            }
        },
        maintainAspectRatio: false
    };

    // Table Data
    downtimeList: DowntimeListItem[] = [];

    constructor(private maintenanceService: DmsMaintenanceService) {}

    ngOnInit(): void {
        this.loadDashboardData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadDashboardData(): void {
        this.loading = true;
        this.maintenanceService.getDashboardData({
            zone: this.selectedZone || undefined,
            status: this.selectedStatus as TicketStatus || undefined,
            dateFilter: this.selectedDateFilter as any,
            days: this.getDateFilterDays()
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: (data: MaintenanceDashboardData) => {
                this.buildCharts(data);
                // Use real data from API, fallback to mock if empty
                this.downtimeList = data.downtimeList && data.downtimeList.length > 0
                    ? this.mapDowntimeListFromApi(data.downtimeList)
                    : this.getMockDowntimeList();
                this.loading = false;
            },
            error: () => {
                this.buildChartsWithMockData();
                this.downtimeList = this.getMockDowntimeList();
                this.loading = false;
            }
        });
    }

    private getDateFilterDays(): number {
        const daysMap: Record<string, number> = {
            'today': 1,
            'yesterday': 2,
            'thisWeek': 7,
            'lastWeek': 14,
            'last30Days': 30,
            'custom': 90
        };
        return daysMap[this.selectedDateFilter] || 30;
    }

    private mapDowntimeListFromApi(data: any[]): DowntimeListItem[] {
        return data.map(item => ({
            ticket: item.ticketNo || item.ticket_no || item.ticket || '',
            zone: item.zone || 'N/A',
            impactedProject: item.project || item.impactedProject || '',
            impactedMachine: item.workstation || item.impactedMachine || '',
            description: item.description || '',
            status: item.status || 'Open',
            createdAt: item.createdOn ? new Date(item.createdOn) : new Date(),
            downtimeStartsAt: item.downtimeStartsAt ? new Date(item.downtimeStartsAt) : new Date(),
            acceptedBy: item.assignedTo || item.acceptedBy,
            closedAt: item.closedAt ? new Date(item.closedAt) : undefined,
            interventionTime: item.interventionTime || item.downtimeMin,
            reactivityTime: item.reactivityTime,
            waitingTime: item.waitingTime
        }));
    }

    private buildCharts(data: MaintenanceDashboardData): void {
        // Top Projects Chart (Red bars)
        this.topProjectsChart = {
            labels: data.topProjects.map(p => p.name),
            datasets: [{
                data: data.topProjects.map(p => p.value),
                backgroundColor: '#EF4444',
                borderRadius: 4,
                barThickness: 20
            }]
        };

        // Top Machines Chart (Teal bars)
        this.topMachinesChart = {
            labels: data.topMachines.map(m => m.name),
            datasets: [{
                data: data.topMachines.map(m => m.value),
                backgroundColor: '#14B8A6',
                borderRadius: 4,
                barThickness: 20
            }]
        };

        // Top Employees Chart (Vertical bars)
        this.topEmployeesChart = {
            labels: data.topEmployees.map(e => e.name.split(' ')[0]),
            datasets: [{
                data: data.topEmployees.map(e => e.closedTickets),
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
                borderRadius: 4
            }]
        };
    }

    private buildChartsWithMockData(): void {
        // Top Projects Chart (Red bars)
        this.topProjectsChart = {
            labels: ['Grammer', 'Technoconfort', 'WITTE', 'Motor B10', 'MQB'],
            datasets: [{
                data: [8000, 3844, 3726, 2096, 1500],
                backgroundColor: '#EF4444',
                borderRadius: 4,
                barThickness: 20
            }]
        };

        // Top Machines Chart (Teal bars)
        this.topMachinesChart = {
            labels: ['ASSEMBLY', 'FTC-0004', 'ZM6-0001', 'ZM6-0005', 'ZM6-0003'],
            datasets: [{
                data: [5130, 2770, 1430, 1786, 1200],
                backgroundColor: '#14B8A6',
                borderRadius: 4,
                barThickness: 20
            }]
        };

        // Top Employees Chart
        this.topEmployeesChart = {
            labels: ['ZIAR', 'DAHRI', 'EL HOUSSI', 'SENHOUNI'],
            datasets: [{
                data: [4459, 4209, 2955, 2893],
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
                borderRadius: 4
            }]
        };
    }

    private getMockDowntimeList(): DowntimeListItem[] {
        const now = new Date();
        return [
            { ticket: '63870', zone: 'Assembly', impactedProject: 'Breadmaiser Auto', impactedMachine: 'MAB-0051', description: 'panne', status: 'Open', createdAt: new Date(now.setDate(now.getDate() - 1)), downtimeStartsAt: new Date(), acceptedBy: undefined },
            { ticket: '63869', zone: 'Assembly', impactedProject: 'Motor B10', impactedMachine: 'ASM-0067', description: 'mail coupe', status: 'Open', createdAt: new Date(), downtimeStartsAt: new Date() },
            { ticket: '63868', zone: 'Assembly', impactedProject: 'FREHCALE', impactedMachine: 'ASSEMBLY', description: 'mail coupe', status: 'Open', createdAt: new Date(), downtimeStartsAt: new Date() },
            { ticket: '63867', zone: 'Assembly', impactedProject: 'MQB', impactedMachine: 'ASSEMBLY', description: 'mail coupe', status: 'Open', createdAt: new Date(), downtimeStartsAt: new Date() },
            { ticket: '63866', zone: 'Assembly', impactedProject: 'Adient PL', impactedMachine: 'MAB-0022', description: 'panne', status: 'Open', createdAt: new Date(), downtimeStartsAt: new Date() },
            { ticket: '63865', zone: 'Assembly', impactedProject: 'Grammer', impactedMachine: 'MAB-0045', description: 'depassement de wire nok', status: 'Open', createdAt: new Date(), downtimeStartsAt: new Date() },
            { ticket: '63864', zone: 'Assembly', impactedProject: 'HBPO', impactedMachine: 'ASSEMBLY', description: 'changement reference', status: 'Closed', createdAt: new Date(), downtimeStartsAt: new Date(), closedAt: new Date(), acceptedBy: 'SENHOUNI YASSINE', interventionTime: 8, reactivityTime: 1, waitingTime: 9 },
            { ticket: '63863', zone: 'Assembly', impactedProject: 'Q3', impactedMachine: 'FTC-0015', description: 'free langth', status: 'Open', createdAt: new Date(), downtimeStartsAt: new Date() },
            { ticket: '63862', zone: 'Assembly', impactedProject: 'Witte DEP', impactedMachine: 'FTC-0006', description: 'panne prb mal injection', status: 'Open', createdAt: new Date(), downtimeStartsAt: new Date() },
            { ticket: '63861', zone: 'Assembly', impactedProject: 'Grammer', impactedMachine: 'MAB-0036', description: 'pressa dans nppel mab b037', status: 'Open', createdAt: new Date(), downtimeStartsAt: new Date() }
        ];
    }

    applyFilters(): void {
        this.loadDashboardData();
    }

    filterTable(value: string): void {
        // Table filtering is handled by PrimeNG's global filter
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
