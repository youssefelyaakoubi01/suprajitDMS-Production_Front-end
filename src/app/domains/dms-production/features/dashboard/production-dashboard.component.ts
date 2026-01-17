/**
 * Production Dashboard Component
 * Domain: DMS-Production
 *
 * Displays production KPIs, line status, and charts
 * Uses the DashboardService for data
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, interval, Subscription } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
import { DashboardService, DashboardResponse } from '../../services/dashboard.service';
import { ProductionService } from '@core/services/production.service';

// Components
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { ProductionLineCardComponent } from './components/production-line-card/production-line-card.component';

// Models
import { KPI, ProductionLine, Project } from '@core/models';

@Component({
    selector: 'app-production-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        ChartModule,
        TagModule,
        ProgressBarModule,
        ProgressSpinnerModule,
        SkeletonModule,
        ButtonModule,
        TooltipModule,
        SelectModule,
        DatePickerModule,
        ToastModule,
        KpiCardComponent,
        ProductionLineCardComponent
    ],
    providers: [MessageService],
    template: `
        <div class="dashboard-container">
            <!-- Loading Overlay -->
            <div *ngIf="loading" class="loading-overlay">
                <p-progressSpinner></p-progressSpinner>
            </div>

            <!-- Dashboard Header -->
            <div class="dashboard-header">
                <div>
                    <h1 class="dashboard-title">Production Dashboard</h1>
                    <p class="dashboard-subtitle">Real-time production monitoring</p>
                </div>
                <div class="header-actions">
                    <p-datepicker
                        [(ngModel)]="selectedDate"
                        (onSelect)="onDateChange()"
                        [showIcon]="true"
                        [maxDate]="today"
                        dateFormat="dd/mm/yy"
                        [style]="{'width': '150px'}"
                        styleClass="date-picker">
                    </p-datepicker>
                    <p-select
                        [options]="projectOptions"
                        [(ngModel)]="selectedProjectId"
                        (onChange)="onProjectChange()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select Project"
                        [style]="{'min-width': '200px'}"
                        styleClass="project-dropdown">
                    </p-select>
                    <span class="last-updated">Last updated: {{ lastUpdated | date:'HH:mm:ss' }}</span>
                    <p-button icon="pi pi-refresh" [rounded]="true" [text]="true" (click)="refresh()"></p-button>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="kpi-grid">
                <app-kpi-card *ngFor="let kpi of kpis" [kpi]="kpi"></app-kpi-card>
            </div>

            <!-- Production Lines Status -->
            <p-card styleClass="production-lines-card">
                <ng-template pTemplate="header">
                    <div class="card-header">
                        <h2 class="card-title">Production Lines Status</h2>
                        <p-tag [value]="productionLines.length + ' Lines'" severity="info"></p-tag>
                    </div>
                </ng-template>

                <div class="production-lines-list">
                    <app-production-line-card
                        *ngFor="let line of productionLines"
                        [line]="line"
                        (lineClick)="onLineClick($event)">
                    </app-production-line-card>
                </div>

                <div *ngIf="productionLines.length === 0 && !loading" class="empty-state">
                    <i class="pi pi-inbox empty-icon"></i>
                    <p>No production lines available</p>
                </div>
            </p-card>

            <!-- Charts Row -->
            <div class="charts-grid">
                <!-- Output per Hour Chart -->
                <p-card styleClass="chart-card">
                    <ng-template pTemplate="header">
                        <div class="card-header">
                            <h3 class="card-title">Output / Hour</h3>
                        </div>
                    </ng-template>
                    <div class="chart-container">
                        <p-chart type="bar" [data]="outputChartData" [options]="chartOptions"></p-chart>
                    </div>
                </p-card>

                <!-- Downtime by Category Chart -->
                <p-card styleClass="chart-card">
                    <ng-template pTemplate="header">
                        <div class="card-header">
                            <h3 class="card-title">Downtime by Category</h3>
                        </div>
                    </ng-template>
                    <div class="chart-container">
                        <p-chart type="bar" [data]="downtimeChartData" [options]="horizontalChartOptions"></p-chart>
                    </div>
                </p-card>
            </div>

            <!-- Downtime by Machine Chart Row -->
            <div class="charts-grid charts-grid-full">
                <p-card styleClass="chart-card">
                    <ng-template pTemplate="header">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="pi pi-cog mr-2"></i>Downtime by Machine
                            </h3>
                        </div>
                    </ng-template>
                    <div class="chart-container">
                        <p-chart type="bar" [data]="machineDowntimeChartData" [options]="horizontalChartOptions"></p-chart>
                    </div>
                </p-card>
            </div>
        </div>

        <p-toast position="top-right"></p-toast>
    `,
    styles: [`
        .dashboard-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            padding: 1rem;
            position: relative;
        }

        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .dashboard-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-color);
            margin: 0;
        }

        .dashboard-subtitle {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
            margin: 0.25rem 0 0 0;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .last-updated {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }

        /* KPI Grid */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
        }

        @media (max-width: 1200px) {
            .kpi-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 576px) {
            .kpi-grid {
                grid-template-columns: 1fr;
            }
        }

        /* Card Styles */
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--surface-border);
        }

        .card-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-color);
            margin: 0;
        }

        /* Production Lines */
        :host ::ng-deep .production-lines-card {
            .p-card-body {
                padding: 0;
            }
        }

        .production-lines-list {
            max-height: 400px;
            overflow-y: auto;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            color: var(--text-color-secondary);
        }

        .empty-state .empty-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .empty-state p {
            margin: 0;
        }

        /* Charts Grid */
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;

            &.charts-grid-full {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 992px) {
            .charts-grid {
                grid-template-columns: 1fr;
            }
        }

        :host ::ng-deep .chart-card {
            .p-card-body {
                padding: 0;
            }

            .p-card-content {
                padding: 1.5rem;
            }
        }

        .chart-container {
            height: 300px;
        }
    `]
})
export class ProductionDashboardComponent implements OnInit, OnDestroy {
    @Input() autoRefresh = true;
    @Input() refreshInterval = 30000; // 30 seconds

    @Output() lineClicked = new EventEmitter<ProductionLine>();
    @Output() refreshed = new EventEmitter<void>();

    private destroy$ = new Subject<void>();
    private refreshSubscription?: Subscription;

    loading = false;
    kpis: KPI[] = [];
    productionLines: ProductionLine[] = [];
    lastUpdated: Date = new Date();

    // Project selection
    projects: Project[] = [];
    selectedProjectId: number | null = null;
    projectOptions: { label: string; value: number | null }[] = [];

    // Date selection
    selectedDate: Date = new Date();
    today: Date = new Date();

    // Chart data
    outputChartData: any;
    downtimeChartData: any;
    machineDowntimeChartData: any;
    chartOptions: any;
    horizontalChartOptions: any;

    constructor(
        private dashboardService: DashboardService,
        private productionService: ProductionService,
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.initChartOptions();
        this.loadProjects();
        this.loadDashboardData();

        if (this.autoRefresh) {
            this.startAutoRefresh();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.refreshSubscription?.unsubscribe();
    }

    loadProjects(): void {
        this.productionService.getProjects().subscribe({
            next: (response: any) => {
                const projects = Array.isArray(response) ? response : (response.results || []);
                this.projects = projects;
                this.projectOptions = [
                    { label: 'All Projects', value: null },
                    ...projects.map((p: any) => ({
                        label: p.name || p.Name_Project,
                        value: p.id || p.Id_Project
                    }))
                ];
            },
            error: (error) => {
                console.error('Error loading projects:', error);
            }
        });
    }

    loadDashboardData(): void {
        this.loading = true;
        const projectId = this.selectedProjectId ?? undefined;
        const dateStr = this.formatDate(this.selectedDate);

        this.dashboardService.getDashboardData(projectId, dateStr)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.kpis = data.kpis;
                    this.productionLines = data.production_lines;
                    this.setupOutputChart(data.output_chart);
                    this.setupDowntimeChart(data.downtime_chart);
                    this.setupMachineDowntimeChart(data.machine_downtime_chart);
                    this.lastUpdated = new Date(data.last_updated);
                    this.loading = false;
                    this.refreshed.emit();
                },
                error: (error) => {
                    this.loading = false;
                    console.error('Dashboard error:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load dashboard data'
                    });
                }
            });
    }

    private startAutoRefresh(): void {
        const projectId = this.selectedProjectId ?? undefined;
        const dateStr = this.formatDate(this.selectedDate);

        this.refreshSubscription = interval(this.refreshInterval)
            .pipe(
                takeUntil(this.destroy$),
                switchMap(() => this.dashboardService.getDashboardData(projectId, dateStr))
            )
            .subscribe({
                next: (data) => {
                    this.kpis = data.kpis;
                    this.productionLines = data.production_lines;
                    this.setupOutputChart(data.output_chart);
                    this.setupDowntimeChart(data.downtime_chart);
                    this.setupMachineDowntimeChart(data.machine_downtime_chart);
                    this.lastUpdated = new Date(data.last_updated);
                    this.refreshed.emit();
                }
            });
    }

    private restartAutoRefresh(): void {
        this.refreshSubscription?.unsubscribe();
        if (this.autoRefresh) {
            this.startAutoRefresh();
        }
    }

    onProjectChange(): void {
        this.restartAutoRefresh();
        this.loadDashboardData();
    }

    onDateChange(): void {
        this.restartAutoRefresh();
        this.loadDashboardData();
    }

    refresh(): void {
        this.loadDashboardData();
    }

    onLineClick(line: ProductionLine): void {
        this.lineClicked.emit(line);
        this.router.navigate(['/dms-production/production'], { queryParams: { lineId: line.id } });
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private initChartOptions(): void {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color') || '#374151';
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6B7280';
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#E5E7EB';

        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: textColor }
                }
            },
            scales: {
                x: {
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                }
            }
        };

        this.horizontalChartOptions = {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                },
                y: {
                    ticks: { color: textColorSecondary },
                    grid: { display: false }
                }
            }
        };
    }

    private setupOutputChart(data: { labels: string[]; data: number[]; targets: number[] }): void {
        const documentStyle = getComputedStyle(document.documentElement);

        this.outputChartData = {
            labels: data.labels,
            datasets: [
                {
                    label: 'Output',
                    data: data.data,
                    backgroundColor: documentStyle.getPropertyValue('--primary-color') || '#2563EB',
                    borderRadius: 4
                },
                {
                    label: 'Target',
                    data: data.targets,
                    backgroundColor: documentStyle.getPropertyValue('--surface-400') || '#9CA3AF',
                    borderRadius: 4
                }
            ]
        };
    }

    private setupDowntimeChart(data: { labels: string[]; data: number[] }): void {
        const documentStyle = getComputedStyle(document.documentElement);

        this.downtimeChartData = {
            labels: data.labels,
            datasets: [
                {
                    label: 'Minutes',
                    data: data.data,
                    backgroundColor: [
                        documentStyle.getPropertyValue('--red-500') || '#EF4444',
                        documentStyle.getPropertyValue('--orange-500') || '#F59E0B',
                        documentStyle.getPropertyValue('--yellow-500') || '#EAB308',
                        documentStyle.getPropertyValue('--blue-500') || '#3B82F6',
                        documentStyle.getPropertyValue('--gray-500') || '#6B7280'
                    ],
                    borderRadius: 4
                }
            ]
        };
    }

    private setupMachineDowntimeChart(data?: { labels: string[]; data: number[] }): void {
        if (!data || !data.labels || data.labels.length === 0) {
            // Default empty chart if no machine data
            this.machineDowntimeChartData = {
                labels: ['No Data'],
                datasets: [{
                    label: 'Minutes',
                    data: [0],
                    backgroundColor: ['#9CA3AF'],
                    borderRadius: 4
                }]
            };
            return;
        }

        // Generate colors based on downtime severity
        const colors = data.data.map(value => {
            if (value > 120) return '#EF4444'; // Red for > 2 hours
            if (value > 60) return '#F59E0B';  // Orange for > 1 hour
            if (value > 30) return '#3B82F6';  // Blue for > 30 min
            return '#10B981';                   // Green for <= 30 min
        });

        this.machineDowntimeChartData = {
            labels: data.labels,
            datasets: [{
                label: 'Minutes',
                data: data.data,
                backgroundColor: colors,
                borderRadius: 4
            }]
        };
    }
}
