/**
 * Downtime List Component
 * Domain: DMS-Production
 *
 * Displays and manages production downtime records
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { ChartModule } from 'primeng/chart';
import { DialogModule } from 'primeng/dialog';

// Domain imports
import { DmsProductionService, Downtime, DowntimeProblem } from '@domains/dms-production';
import { Shift } from '@core/models';
import { ExportService } from '@core/services';

// Extended interface for internal use (Date object instead of string)
interface DowntimeWithDetails extends Downtime {
    dateObj?: Date;  // Parsed Date object from date string
}

@Component({
    selector: 'app-downtime-list',
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
        SelectModule,
        DatePickerModule,
        ChartModule,
        DialogModule
    ],
    template: `
        <div class="downtime-list">
            <!-- Summary Cards -->
            <div class="summary-grid mb-4">
                <div class="summary-card total">
                    <div class="summary-icon">
                        <i class="pi pi-clock"></i>
                    </div>
                    <div class="summary-content">
                        <span class="summary-value">{{ totalDowntimeMinutes }}</span>
                        <span class="summary-label">Total Minutes</span>
                    </div>
                </div>

                <div class="summary-card incidents">
                    <div class="summary-icon">
                        <i class="pi pi-exclamation-triangle"></i>
                    </div>
                    <div class="summary-content">
                        <span class="summary-value">{{ downtimes.length }}</span>
                        <span class="summary-label">Incidents</span>
                    </div>
                </div>

                <div class="summary-card average">
                    <div class="summary-icon">
                        <i class="pi pi-chart-line"></i>
                    </div>
                    <div class="summary-content">
                        <span class="summary-value">{{ averageDowntime }}</span>
                        <span class="summary-label">Avg Min/Incident</span>
                    </div>
                </div>

                <div class="summary-card top-issue">
                    <div class="summary-icon">
                        <i class="pi pi-flag"></i>
                    </div>
                    <div class="summary-content">
                        <span class="summary-value text-base">{{ topIssue }}</span>
                        <span class="summary-label">Top Issue</span>
                    </div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="charts-grid mb-4">
                <p-card styleClass="h-full">
                    <ng-template pTemplate="header">
                        <div class="p-3">
                            <span class="font-semibold">Downtime by Category</span>
                        </div>
                    </ng-template>
                    <div class="chart-container">
                        <p-chart type="doughnut" [data]="categoryChartData"
                                 [options]="pieChartOptions"></p-chart>
                    </div>
                </p-card>

                <p-card styleClass="h-full">
                    <ng-template pTemplate="header">
                        <div class="p-3">
                            <span class="font-semibold">Downtime Trend (Last 7 Days)</span>
                        </div>
                    </ng-template>
                    <div class="chart-container">
                        <p-chart type="bar" [data]="trendChartData"
                                 [options]="barChartOptions"></p-chart>
                    </div>
                </p-card>
            </div>

            <!-- Downtime Table -->
            <p-card>
                <ng-template pTemplate="header">
                    <p-toolbar styleClass="border-none bg-transparent">
                        <ng-template #start>
                            <span class="text-xl font-semibold">
                                <i class="pi pi-list mr-2"></i>Downtime Records
                            </span>
                        </ng-template>
                        <ng-template #end>
                            <div class="flex gap-2 align-items-center">
                                <p-datepicker [(ngModel)]="filterDate" [showIcon]="true"
                                              placeholder="Filter by Date" selectionMode="range"
                                              (onSelect)="onDateFilter()" dateFormat="dd/mm/yy">
                                </p-datepicker>
                                <p-select [options]="problems" [(ngModel)]="filterProblem"
                                          optionLabel="Name_DowntimeProblems"
                                          optionValue="Id_DowntimeProblems"
                                          placeholder="Filter by Problem"
                                          [showClear]="true"
                                          (onChange)="onProblemFilter()">
                                </p-select>
                                <button pButton icon="pi pi-file-excel" class="p-button-text p-button-success"
                                        (click)="exportToExcel()" [disabled]="filteredDowntimes.length === 0"
                                        pTooltip="Export Excel">
                                </button>
                                <button pButton icon="pi pi-file" class="p-button-text p-button-info"
                                        (click)="exportToCsv()" [disabled]="filteredDowntimes.length === 0"
                                        pTooltip="Export CSV">
                                </button>
                                <button pButton icon="pi pi-refresh" class="p-button-text"
                                        (click)="loadDowntimes()" [loading]="loading"
                                        pTooltip="Refresh">
                                </button>
                            </div>
                        </ng-template>
                    </p-toolbar>
                </ng-template>

                <p-table [value]="filteredDowntimes"
                         [loading]="loading"
                         [paginator]="true"
                         [rows]="10"
                         [rowHover]="true"
                         [showCurrentPageReport]="true"
                         currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                         styleClass="p-datatable-sm p-datatable-gridlines">

                    <ng-template pTemplate="header">
                        <tr>
                            <th pSortableColumn="date">Date <p-sortIcon field="date"></p-sortIcon></th>
                            <th>Hour</th>
                            <th>Production Line</th>
                            <th>Problem</th>
                            <th pSortableColumn="Total_Downtime" class="text-center">
                                Duration <p-sortIcon field="Total_Downtime"></p-sortIcon>
                            </th>
                            <th>Comment</th>
                            <th>Actions</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-dt>
                        <tr>
                            <td>
                                <span class="font-medium">
                                    {{ dt.date | date:'dd/MM/yyyy' }}
                                </span>
                            </td>
                            <td>
                                <span class="text-color-secondary">
                                    {{ formatHour(dt.hour, dt.shift_name) }}
                                </span>
                            </td>
                            <td>
                                <span>{{ dt.production_line_name || '-' }}</span>
                            </td>
                            <td>
                                <p-tag [value]="dt.problem_name || 'Unknown'"
                                       [severity]="getProblemSeverity(dt.Id_DowntimeProblems)">
                                </p-tag>
                            </td>
                            <td class="text-center">
                                <span class="duration-badge" [ngClass]="getDurationClass(dt.Total_Downtime)">
                                    {{ dt.Total_Downtime }} min
                                </span>
                            </td>
                            <td>
                                <span class="comment-text" [pTooltip]="dt.Comment_Downtime"
                                      tooltipPosition="top">
                                    {{ truncateComment(dt.Comment_Downtime) }}
                                </span>
                            </td>
                            <td>
                                <button pButton icon="pi pi-eye"
                                        class="p-button-text p-button-sm"
                                        (click)="viewDetails(dt)" pTooltip="View Details">
                                </button>
                                <button pButton icon="pi pi-pencil"
                                        class="p-button-text p-button-sm"
                                        (click)="editDowntime(dt)" pTooltip="Edit">
                                </button>
                                <button pButton icon="pi pi-trash"
                                        class="p-button-text p-button-sm p-button-danger"
                                        (click)="deleteDowntime(dt)" pTooltip="Delete">
                                </button>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="7" class="text-center p-4">
                                <i class="pi pi-check-circle text-4xl text-green-500 mb-2"></i>
                                <p class="font-semibold">No Downtime Records</p>
                                <p class="text-sm text-color-secondary">
                                    Great! No downtime incidents found for the selected period.
                                </p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>

            <!-- Details Dialog -->
            <p-dialog [(visible)]="detailsDialogVisible" [modal]="true"
                      header="Downtime Details" [style]="{ width: '600px' }">
                <div class="details-content" *ngIf="selectedDowntime">
                    <div class="detail-row">
                        <span class="detail-label">Date & Time:</span>
                        <span class="detail-value">
                            {{ selectedDowntime.date | date:'dd/MM/yyyy' }} at {{ formatHour(selectedDowntime.hour, selectedDowntime.shift_name) }}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Production Line:</span>
                        <span class="detail-value">{{ selectedDowntime.production_line_name || '-' }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Problem Type:</span>
                        <p-tag [value]="selectedDowntime.problem_name || 'Unknown'"
                               [severity]="getProblemSeverity(selectedDowntime.Id_DowntimeProblems)">
                        </p-tag>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value font-bold text-xl">
                            {{ selectedDowntime.Total_Downtime }} minutes
                        </span>
                    </div>
                    <div class="detail-row" *ngIf="selectedDowntime.Comment_Downtime">
                        <span class="detail-label">Comment:</span>
                        <p class="detail-value comment-full">
                            {{ selectedDowntime.Comment_Downtime }}
                        </p>
                    </div>
                </div>
            </p-dialog>
        </div>
    `,
    styles: [`
        .downtime-list {
            padding: 1rem;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;

            @media (max-width: 992px) {
                grid-template-columns: repeat(2, 1fr);
            }

            @media (max-width: 576px) {
                grid-template-columns: 1fr;
            }
        }

        .summary-card {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1.25rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: all 0.2s;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            }

            &.total {
                border-left: 4px solid var(--red-500);
                .summary-icon { background: var(--red-100); color: var(--red-600); }
            }
            &.incidents {
                border-left: 4px solid var(--orange-500);
                .summary-icon { background: var(--orange-100); color: var(--orange-600); }
            }
            &.average {
                border-left: 4px solid var(--blue-500);
                .summary-icon { background: var(--blue-100); color: var(--blue-600); }
            }
            &.top-issue {
                border-left: 4px solid var(--purple-500);
                .summary-icon { background: var(--purple-100); color: var(--purple-600); }
            }
        }

        .summary-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }

        .summary-content {
            display: flex;
            flex-direction: column;
        }

        .summary-value {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--text-color);
        }

        .summary-label {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .charts-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;

            @media (max-width: 992px) {
                grid-template-columns: 1fr;
            }
        }

        .chart-container {
            height: 250px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .duration-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-weight: 600;
            font-size: 0.875rem;

            &.short {
                background: var(--green-100);
                color: var(--green-700);
            }
            &.medium {
                background: var(--orange-100);
                color: var(--orange-700);
            }
            &.long {
                background: var(--red-100);
                color: var(--red-700);
            }
        }

        .comment-text {
            display: inline-block;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: help;
        }

        .details-content {
            .detail-row {
                display: flex;
                padding: 0.75rem 0;
                border-bottom: 1px solid var(--surface-border);

                &:last-child {
                    border-bottom: none;
                }
            }

            .detail-label {
                width: 140px;
                font-weight: 500;
                color: var(--text-color-secondary);
            }

            .detail-value {
                flex: 1;
                color: var(--text-color);
            }

            .comment-full {
                margin: 0;
                white-space: pre-wrap;
            }
        }
    `]
})
export class DowntimeListComponent implements OnInit, OnDestroy {
    @Input() downtimes: DowntimeWithDetails[] = [];
    @Input() problems: DowntimeProblem[] = [];
    @Input() loading = false;

    @Output() edit = new EventEmitter<Downtime>();
    @Output() delete = new EventEmitter<Downtime>();

    private destroy$ = new Subject<void>();

    filteredDowntimes: DowntimeWithDetails[] = [];
    shifts: Shift[] = [];
    filterDate: Date[] | null = null;
    filterProblem: number | null = null;

    // Charts
    categoryChartData: any;
    trendChartData: any;
    pieChartOptions = {
        plugins: { legend: { position: 'bottom' } },
        maintainAspectRatio: false
    };
    barChartOptions = {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
        maintainAspectRatio: false
    };

    // Details dialog
    detailsDialogVisible = false;
    selectedDowntime: DowntimeWithDetails | null = null;

    constructor(
        private productionService: DmsProductionService,
        private exportService: ExportService
    ) {}

    ngOnInit(): void {
        // Load shifts for hour formatting
        this.loadShifts();

        if (this.downtimes.length === 0) {
            this.loadDowntimes();
        } else {
            this.filteredDowntimes = [...this.downtimes];
            this.buildCharts();
        }

        if (this.problems.length === 0) {
            this.loadProblems();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadDowntimes(): void {
        this.loading = true;
        this.productionService.getDowntimes()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    // Parse dates and map backend field names to frontend field names
                    this.downtimes = data.map(dt => ({
                        ...dt,
                        // Map backend fields to frontend expected fields
                        Id_Downtime: dt.id ?? dt.Id_Downtime,
                        Total_Downtime: dt.duration ?? dt.Total_Downtime ?? 0,
                        Comment_Downtime: dt.comment ?? dt.Comment_Downtime ?? '',
                        Id_DowntimeProblems: dt.problem ?? dt.Id_DowntimeProblems,
                        Id_HourlyProd: dt.hourly_production_id ?? dt.Id_HourlyProd,
                        dateObj: dt.date ? new Date(dt.date) : undefined
                    }));
                    this.filteredDowntimes = [...this.downtimes];
                    this.buildCharts();
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    loadProblems(): void {
        this.productionService.getDowntimeProblems()
            .pipe(takeUntil(this.destroy$))
            .subscribe(problems => this.problems = problems);
    }

    loadShifts(): void {
        this.productionService.getShifts()
            .pipe(takeUntil(this.destroy$))
            .subscribe(shifts => this.shifts = shifts);
    }

    onDateFilter(): void {
        this.applyFilters();
    }

    onProblemFilter(): void {
        this.applyFilters();
    }

    private applyFilters(): void {
        let filtered = [...this.downtimes];

        if (this.filterDate && this.filterDate.length === 2) {
            const [start, end] = this.filterDate;
            filtered = filtered.filter(dt => {
                const date = new Date(dt.date!);
                return date >= start && date <= end;
            });
        }

        if (this.filterProblem) {
            filtered = filtered.filter(dt => dt.Id_DowntimeProblems === this.filterProblem);
        }

        this.filteredDowntimes = filtered;
    }

    private buildCharts(): void {
        // Category chart - using problem_name from backend
        const categoryMap = new Map<string, number>();
        this.downtimes.forEach(dt => {
            const name = dt.problem_name || 'Unknown';
            categoryMap.set(name, (categoryMap.get(name) || 0) + dt.Total_Downtime);
        });

        this.categoryChartData = {
            labels: Array.from(categoryMap.keys()),
            datasets: [{
                data: Array.from(categoryMap.values()),
                backgroundColor: ['#EF4444', '#F59E0B', '#8B5CF6', '#3B82F6', '#10B981', '#6B7280']
            }]
        };

        // Trend chart - Real data for last 7 days
        this.buildTrendChart();
    }

    private buildTrendChart(): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Create array of last 7 days
        const last7Days: { date: Date; label: string; total: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            last7Days.push({
                date: date,
                label: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
                total: 0
            });
        }

        // Aggregate downtime by day using dateObj or parsing date string
        this.downtimes.forEach(dt => {
            let dtDate: Date | undefined = dt.dateObj;

            // If no dateObj, try to parse from date string
            if (!dtDate && dt.date) {
                dtDate = new Date(dt.date);
            }

            if (!dtDate || isNaN(dtDate.getTime())) return;

            // Normalize to midnight
            const normalizedDate = new Date(dtDate);
            normalizedDate.setHours(0, 0, 0, 0);

            const dayEntry = last7Days.find(day => {
                return day.date.getTime() === normalizedDate.getTime();
            });

            if (dayEntry) {
                dayEntry.total += dt.Total_Downtime || 0;
            }
        });

        // Build chart data with dynamic colors based on severity
        this.trendChartData = {
            labels: last7Days.map(d => d.label),
            datasets: [{
                label: 'Downtime (min)',
                data: last7Days.map(d => d.total),
                backgroundColor: last7Days.map(d => d.total > 60 ? '#EF4444' : d.total > 30 ? '#F59E0B' : '#10B981'),
                borderRadius: 4
            }]
        };
    }

    get totalDowntimeMinutes(): number {
        return this.downtimes.reduce((sum, dt) => sum + dt.Total_Downtime, 0);
    }

    get averageDowntime(): number {
        if (this.downtimes.length === 0) return 0;
        return Math.round(this.totalDowntimeMinutes / this.downtimes.length);
    }

    get topIssue(): string {
        if (this.downtimes.length === 0) return 'None';

        const problemMap = new Map<string, number>();
        this.downtimes.forEach(dt => {
            const name = dt.problem_name || 'Unknown';
            problemMap.set(name, (problemMap.get(name) || 0) + 1);
        });

        let maxCount = 0;
        let topProblem = 'None';
        problemMap.forEach((count, name) => {
            if (count > maxCount) {
                maxCount = count;
                topProblem = name;
            }
        });

        return topProblem;
    }

    formatHour(hour: number | undefined, shiftName?: string): string {
        if (hour === undefined || hour === null) return '-';

        // Get shift start hour based on shift name
        const shiftStartHour = this.getShiftStartHour(shiftName);

        // Calculate actual start and end hours based on shift start + hour offset
        // hour is 1-based (H1, H2, etc.), so we use (hour - 1) for the offset
        const actualStartHour = (shiftStartHour + hour - 1) % 24;
        const actualEndHour = (shiftStartHour + hour) % 24;

        return `${actualStartHour.toString().padStart(2, '0')}:00 - ${actualEndHour.toString().padStart(2, '0')}:00`;
    }

    getShiftStartHour(shiftName?: string): number {
        if (!shiftName) return 6; // Default to morning shift

        // Find shift from loaded shifts by name (case-insensitive)
        const shift = this.shifts.find(s =>
            s.name.toLowerCase() === shiftName.toLowerCase()
        );

        if (shift?.startHour !== undefined) {
            return shift.startHour;
        }

        // Fallback to default shift hours based on common naming patterns
        const shiftMap: Record<string, number> = {
            'morning': 6,
            'matin': 6,
            'jour': 6,
            'day': 6,
            'afternoon': 14,
            'après-midi': 14,
            'soir': 14,
            'evening': 14,
            'night': 22,
            'nuit': 22
        };

        const normalizedName = shiftName.toLowerCase();
        for (const [key, hour] of Object.entries(shiftMap)) {
            if (normalizedName.includes(key)) {
                return hour;
            }
        }

        return 6; // Default fallback
    }

    truncateComment(comment: string | undefined): string {
        if (!comment) return '-';
        return comment.length > 30 ? comment.substring(0, 30) + '...' : comment;
    }

    getDurationClass(minutes: number): string {
        if (minutes <= 15) return 'short';
        if (minutes <= 30) return 'medium';
        return 'long';
    }

    getProblemSeverity(problemId: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        // Map problem types to severities
        const severityMap: Record<number, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            1: 'danger',    // Machine breakdown
            2: 'warn',      // Material shortage
            3: 'info',      // Quality issue
            4: 'secondary'  // Setup
        };
        return severityMap[problemId] || 'secondary';
    }

    viewDetails(dt: DowntimeWithDetails): void {
        this.selectedDowntime = dt;
        this.detailsDialogVisible = true;
    }

    editDowntime(dt: Downtime): void {
        this.edit.emit(dt);
    }

    deleteDowntime(dt: Downtime): void {
        this.delete.emit(dt);
    }

    /**
     * Prepare downtime data for export
     */
    private prepareExportData(): any[] {
        return this.filteredDowntimes.map(dt => ({
            'Date': dt.date ? this.exportService.formatDate(dt.date) : '-',
            'Heure': this.formatHour(dt.hour, dt.shift_name),
            'Shift': dt.shift_name || '-',
            'Ligne de Production': dt.production_line_name || '-',
            'Zone': dt.zone_name || '-',
            'Poste de Travail': dt.workstation_name || '-',
            'Machine': dt.machine_name || '-',
            'Projet': dt.project_name || '-',
            'Part Number': dt.part_number || '-',
            'Type de Problème': dt.problem_name || '-',
            'Catégorie': dt.problem_category || '-',
            'Durée (min)': dt.Total_Downtime || 0,
            'Commentaire': dt.Comment_Downtime || '-'
        }));
    }

    /**
     * Export downtime list to Excel
     */
    exportToExcel(): void {
        const data = this.prepareExportData();
        const filename = `downtimes_export_${this.exportService.formatDate(new Date())}`;
        this.exportService.exportToExcel(data, filename, 'Downtimes');
    }

    /**
     * Export downtime list to CSV
     */
    exportToCsv(): void {
        const data = this.prepareExportData();
        const filename = `downtimes_export_${this.exportService.formatDate(new Date())}`;
        this.exportService.exportToCsv(data, filename);
    }
}
