import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { TimelineModule } from 'primeng/timeline';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { MessageService } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';
import { forkJoin } from 'rxjs';

interface HourlyProductionHistory {
    id: number;
    hourly_production: number | null;
    hourly_production_id: number | null;
    record_date: string;
    shift_name: string;
    hour: number;
    part_number: string;
    production_line_name: string;
    process_name: string;
    project_name: string;
    change_type: 'create' | 'update' | 'delete';
    change_type_display: string;
    field_name: string;
    old_value: string;
    new_value: string;
    changed_by: string;
    changed_at: string;
}

interface SelectOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-production-history',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        CardModule,
        ToolbarModule,
        TagModule,
        ToastModule,
        SelectModule,
        DatePickerModule,
        InputTextModule,
        TooltipModule,
        TimelineModule,
        ToggleButtonModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="left">
                    <h2 class="m-0">
                        <i class="pi pi-history mr-2"></i>Production Records History
                    </h2>
                </ng-template>
                <ng-template pTemplate="center">
                    <div class="flex align-items-center gap-3 flex-wrap">
                        <div class="flex align-items-center gap-2">
                            <label for="projectFilter" class="font-medium">Project:</label>
                            <p-select
                                id="projectFilter"
                                [(ngModel)]="selectedProject"
                                [options]="projectOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="All Projects"
                                [filter]="true"
                                filterPlaceholder="Search..."
                                [showClear]="true"
                                styleClass="w-10rem"
                                (onChange)="applyFilters()">
                            </p-select>
                        </div>
                        <div class="flex align-items-center gap-2">
                            <label for="lineFilter" class="font-medium">Line:</label>
                            <p-select
                                id="lineFilter"
                                [(ngModel)]="selectedLine"
                                [options]="lineOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="All Lines"
                                [filter]="true"
                                filterPlaceholder="Search..."
                                [showClear]="true"
                                styleClass="w-10rem"
                                (onChange)="applyFilters()">
                            </p-select>
                        </div>
                        <div class="flex align-items-center gap-2">
                            <label for="changeTypeFilter" class="font-medium">Action:</label>
                            <p-select
                                id="changeTypeFilter"
                                [(ngModel)]="selectedChangeType"
                                [options]="changeTypeOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="All Actions"
                                [showClear]="true"
                                styleClass="w-9rem"
                                (onChange)="applyFilters()">
                            </p-select>
                        </div>
                        <div class="flex align-items-center gap-2">
                            <label for="userFilter" class="font-medium">User:</label>
                            <p-select
                                id="userFilter"
                                [(ngModel)]="selectedUser"
                                [options]="userOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="All Users"
                                [filter]="true"
                                filterPlaceholder="Search..."
                                [showClear]="true"
                                styleClass="w-9rem"
                                (onChange)="applyFilters()">
                            </p-select>
                        </div>
                        <div class="flex align-items-center gap-2">
                            <label for="dateRange" class="font-medium">Date:</label>
                            <p-datepicker
                                id="dateRange"
                                [(ngModel)]="dateRange"
                                selectionMode="range"
                                [showIcon]="true"
                                [showButtonBar]="true"
                                dateFormat="yy-mm-dd"
                                placeholder="Select date range"
                                styleClass="w-14rem"
                                (onSelect)="applyFilters()"
                                (onClear)="applyFilters()">
                            </p-datepicker>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="right">
                    <div class="flex align-items-center gap-2">
                        <p-toggleButton
                            [(ngModel)]="timelineView"
                            onIcon="pi pi-list"
                            offIcon="pi pi-table"
                            onLabel="Timeline"
                            offLabel="Table"
                            styleClass="w-7rem"
                            (onChange)="toggleView()">
                        </p-toggleButton>
                        <p-button
                            icon="pi pi-download"
                            label="Export"
                            styleClass="p-button-outlined"
                            pTooltip="Export to CSV"
                            (onClick)="exportToCSV()">
                        </p-button>
                        <p-button
                            icon="pi pi-refresh"
                            styleClass="p-button-outlined"
                            pTooltip="Refresh"
                            (onClick)="loadData()">
                        </p-button>
                    </div>
                </ng-template>
            </p-toolbar>

            <!-- Table View -->
            <p-table
                *ngIf="!timelineView"
                [value]="filteredHistory"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="15"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                dataKey="id"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 160px" pSortableColumn="changed_at">
                            Date/Time <p-sortIcon field="changed_at"></p-sortIcon>
                        </th>
                        <th pSortableColumn="record_date">
                            Record Date <p-sortIcon field="record_date"></p-sortIcon>
                        </th>
                        <th>Shift / Hour</th>
                        <th pSortableColumn="part_number">
                            Part Number <p-sortIcon field="part_number"></p-sortIcon>
                        </th>
                        <th>Line / Process</th>
                        <th>Project</th>
                        <th style="width: 100px" pSortableColumn="change_type">
                            Action <p-sortIcon field="change_type"></p-sortIcon>
                        </th>
                        <th>Field</th>
                        <th>Old Value</th>
                        <th>New Value</th>
                        <th pSortableColumn="changed_by">
                            User <p-sortIcon field="changed_by"></p-sortIcon>
                        </th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-record>
                    <tr>
                        <td>
                            <div class="flex flex-column">
                                <span class="font-medium">{{ record.changed_at | date:'MMM d, yyyy' }}</span>
                                <span class="text-sm text-gray-500">{{ record.changed_at | date:'HH:mm:ss' }}</span>
                            </div>
                        </td>
                        <td>
                            <span class="font-medium">{{ record.record_date | date:'MMM d, yyyy' }}</span>
                        </td>
                        <td>
                            <div class="flex flex-column">
                                <span class="font-medium">{{ record.shift_name }}</span>
                                <span class="text-sm text-gray-500">Hour {{ record.hour }}</span>
                            </div>
                        </td>
                        <td>
                            <strong class="text-primary">{{ record.part_number }}</strong>
                        </td>
                        <td>
                            <div class="flex flex-column">
                                <span *ngIf="record.production_line_name" class="font-medium">{{ record.production_line_name }}</span>
                                <span *ngIf="record.process_name" class="text-sm text-gray-500">{{ record.process_name }}</span>
                                <span *ngIf="!record.production_line_name && !record.process_name" class="text-gray-400">-</span>
                            </div>
                        </td>
                        <td>
                            <p-tag *ngIf="record.project_name" [value]="record.project_name" severity="info"></p-tag>
                            <span *ngIf="!record.project_name" class="text-gray-400">-</span>
                        </td>
                        <td>
                            <p-tag
                                [value]="record.change_type_display"
                                [severity]="getActionSeverity(record.change_type)"
                                [icon]="getActionIcon(record.change_type)">
                            </p-tag>
                        </td>
                        <td>
                            <span *ngIf="record.field_name" class="font-medium">{{ record.field_name }}</span>
                            <span *ngIf="!record.field_name" class="text-gray-400">-</span>
                        </td>
                        <td>
                            <span *ngIf="record.old_value" class="old-value">{{ truncateValue(record.old_value) }}</span>
                            <span *ngIf="!record.old_value" class="text-gray-400">-</span>
                        </td>
                        <td>
                            <span *ngIf="record.new_value" class="new-value">{{ truncateValue(record.new_value) }}</span>
                            <span *ngIf="!record.new_value" class="text-gray-400">-</span>
                        </td>
                        <td>
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-user text-gray-400"></i>
                                <span>{{ record.changed_by }}</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="11" class="text-center p-4">
                            <i class="pi pi-inbox text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No history records found.</span>
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <!-- Timeline View -->
            <div *ngIf="timelineView" class="timeline-container">
                <p-timeline [value]="groupedHistory" align="alternate" styleClass="customized-timeline">
                    <ng-template pTemplate="marker" let-event>
                        <span class="timeline-marker" [ngClass]="'marker-' + event.change_type">
                            <i [class]="getActionIcon(event.change_type)"></i>
                        </span>
                    </ng-template>
                    <ng-template pTemplate="content" let-event>
                        <p-card [styleClass]="'timeline-card ' + event.change_type + '-card'">
                            <ng-template pTemplate="header">
                                <div class="timeline-card-header">
                                    <p-tag
                                        [value]="event.change_type_display"
                                        [severity]="getActionSeverity(event.change_type)">
                                    </p-tag>
                                    <span class="ml-2">
                                        <strong class="text-primary">{{ event.part_number }}</strong>
                                        <span class="text-gray-500"> - {{ event.shift_name }} H{{ event.hour }}</span>
                                    </span>
                                </div>
                            </ng-template>
                            <div class="timeline-card-content">
                                <div class="record-info mb-2">
                                    <span *ngIf="event.production_line_name" class="mr-2">
                                        <i class="pi pi-cog text-gray-400 mr-1"></i>{{ event.production_line_name }}
                                    </span>
                                    <span *ngIf="event.project_name">
                                        <i class="pi pi-folder text-gray-400 mr-1"></i>{{ event.project_name }}
                                    </span>
                                </div>
                                <div *ngIf="event.field_name" class="field-change">
                                    <span class="field-name">{{ event.field_name }}:</span>
                                    <span *ngIf="event.old_value" class="old-value">{{ truncateValue(event.old_value) }}</span>
                                    <i *ngIf="event.old_value && event.new_value" class="pi pi-arrow-right mx-2"></i>
                                    <span *ngIf="event.new_value" class="new-value">{{ truncateValue(event.new_value) }}</span>
                                </div>
                                <div class="timeline-meta">
                                    <span class="user-info">
                                        <i class="pi pi-user mr-1"></i>{{ event.changed_by }}
                                    </span>
                                    <span class="date-info">
                                        <i class="pi pi-calendar mr-1"></i>{{ event.changed_at | date:'MMM d, yyyy HH:mm' }}
                                    </span>
                                </div>
                            </div>
                        </p-card>
                    </ng-template>
                </p-timeline>

                <div *ngIf="groupedHistory.length === 0" class="text-center p-4">
                    <i class="pi pi-inbox text-4xl text-gray-400 mb-3 block"></i>
                    <span class="text-gray-500">No history records found.</span>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--surface-50);
        }

        .old-value {
            background-color: #fee2e2;
            color: #dc2626;
            padding: 0.125rem 0.5rem;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.85rem;
        }

        .new-value {
            background-color: #d1fae5;
            color: #047857;
            padding: 0.125rem 0.5rem;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.85rem;
        }

        /* Timeline Styles */
        .timeline-container {
            padding: 1rem;
            max-height: 600px;
            overflow-y: auto;
        }

        :host ::ng-deep .customized-timeline .p-timeline-event-opposite {
            flex: 0;
        }

        .timeline-marker {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 50%;
            color: white;
        }

        .marker-create {
            background-color: var(--green-500);
        }

        .marker-update {
            background-color: var(--orange-500);
        }

        .marker-delete {
            background-color: var(--red-500);
        }

        :host ::ng-deep .timeline-card {
            margin: 0.5rem;
        }

        :host ::ng-deep .timeline-card .p-card-body {
            padding: 0.75rem;
        }

        .timeline-card-header {
            display: flex;
            align-items: center;
            padding: 0.5rem 0.75rem;
            background-color: var(--surface-50);
            border-bottom: 1px solid var(--surface-200);
        }

        .timeline-card-content {
            padding: 0.5rem 0;
        }

        .record-info {
            font-size: 0.85rem;
            color: var(--text-color-secondary);
        }

        .field-change {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }

        .field-name {
            font-weight: 600;
            color: var(--text-color);
        }

        .timeline-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.8rem;
            color: var(--text-color-secondary);
            margin-top: 0.5rem;
        }

        .user-info, .date-info {
            display: flex;
            align-items: center;
        }

        :host ::ng-deep .create-card {
            border-left: 4px solid var(--green-500);
        }

        :host ::ng-deep .update-card {
            border-left: 4px solid var(--orange-500);
        }

        :host ::ng-deep .delete-card {
            border-left: 4px solid var(--red-500);
        }

        @media (max-width: 768px) {
            .flex-wrap {
                flex-wrap: wrap;
            }
        }
    `]
})
export class ProductionHistoryComponent implements OnInit {
    history: HourlyProductionHistory[] = [];
    filteredHistory: HourlyProductionHistory[] = [];
    groupedHistory: HourlyProductionHistory[] = [];

    // Filter options
    projectOptions: SelectOption[] = [];
    lineOptions: SelectOption[] = [];
    userOptions: SelectOption[] = [];

    // Selected filters
    selectedProject: string | null = null;
    selectedLine: string | null = null;
    selectedChangeType: string | null = null;
    selectedUser: string | null = null;
    dateRange: Date[] | null = null;

    // View toggle
    timelineView = false;

    loading = false;

    changeTypeOptions: SelectOption[] = [
        { label: 'Created', value: 'create' },
        { label: 'Updated', value: 'update' },
        { label: 'Deleted', value: 'delete' }
    ];

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;

        forkJoin({
            history: this.productionService.getHourlyProductionHistory(),
            users: this.productionService.getHourlyProductionHistoryUsers(),
            projects: this.productionService.getHourlyProductionHistoryProjects(),
            lines: this.productionService.getHourlyProductionHistoryProductionLines()
        }).subscribe({
            next: (data: any) => {
                this.history = data.history.results || data.history || [];

                // Build filter options
                this.userOptions = (data.users || []).map((u: string) => ({
                    label: u,
                    value: u
                }));

                this.projectOptions = (data.projects || []).map((p: string) => ({
                    label: p,
                    value: p
                }));

                this.lineOptions = (data.lines || []).map((l: string) => ({
                    label: l,
                    value: l
                }));

                this.applyFilters();
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading history:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load history data'
                });
                this.loading = false;
            }
        });
    }

    applyFilters(): void {
        let result = [...this.history];

        // Filter by project
        if (this.selectedProject) {
            result = result.filter(h => h.project_name === this.selectedProject);
        }

        // Filter by production line
        if (this.selectedLine) {
            result = result.filter(h => h.production_line_name === this.selectedLine);
        }

        // Filter by change type
        if (this.selectedChangeType) {
            result = result.filter(h => h.change_type === this.selectedChangeType);
        }

        // Filter by user
        if (this.selectedUser) {
            result = result.filter(h => h.changed_by === this.selectedUser);
        }

        // Filter by date range
        if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
            const startDate = new Date(this.dateRange[0]);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(this.dateRange[1]);
            endDate.setHours(23, 59, 59, 999);

            result = result.filter(h => {
                const recordDate = new Date(h.changed_at);
                return recordDate >= startDate && recordDate <= endDate;
            });
        }

        this.filteredHistory = result;
        this.groupedHistory = this.groupHistoryForTimeline(result);
    }

    groupHistoryForTimeline(history: HourlyProductionHistory[]): HourlyProductionHistory[] {
        // For timeline view, return the filtered history sorted by date desc
        return history.sort((a, b) =>
            new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
        );
    }

    toggleView(): void {
        // View is toggled by the toggleButton binding
    }

    getActionSeverity(changeType: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast' {
        switch (changeType) {
            case 'create': return 'success';
            case 'update': return 'warn';
            case 'delete': return 'danger';
            default: return 'info';
        }
    }

    getActionIcon(changeType: string): string {
        switch (changeType) {
            case 'create': return 'pi pi-plus';
            case 'update': return 'pi pi-pencil';
            case 'delete': return 'pi pi-trash';
            default: return 'pi pi-circle';
        }
    }

    truncateValue(value: string, maxLength: number = 50): string {
        if (!value) return '-';
        if (value.length <= maxLength) return value;
        return value.substring(0, maxLength) + '...';
    }

    exportToCSV(): void {
        if (this.filteredHistory.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Data',
                detail: 'No records to export'
            });
            return;
        }

        // Prepare CSV content
        const headers = [
            'Change Date/Time', 'Record Date', 'Shift', 'Hour', 'Part Number',
            'Production Line', 'Process', 'Project', 'Action', 'Field',
            'Old Value', 'New Value', 'User'
        ];
        const rows = this.filteredHistory.map(h => [
            new Date(h.changed_at).toISOString(),
            h.record_date,
            h.shift_name,
            h.hour,
            h.part_number,
            h.production_line_name || '',
            h.process_name || '',
            h.project_name || '',
            h.change_type_display,
            h.field_name || '',
            h.old_value || '',
            h.new_value || '',
            h.changed_by
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `production_history_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.messageService.add({
            severity: 'success',
            summary: 'Exported',
            detail: `${this.filteredHistory.length} records exported to CSV`
        });
    }
}
