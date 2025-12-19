/**
 * RH Dashboard Component
 * Domain: DMS-RH
 *
 * Displays HR KPIs, statistics, and charts
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';

// Domain imports
import { DmsRhDashboardService, HRDashboardStats, HRKpi, HRQuickStats } from '@domains/dms-rh';

interface KpiCard {
    label: string;
    value: number;
    icon: string;
    color: string;
    trend: number;
    progress: number;
}

@Component({
    selector: 'app-rh-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ChartModule,
        ProgressBarModule,
        SkeletonModule,
        TagModule
    ],
    template: `
        <div class="rh-dashboard">
            <!-- Loading Skeleton -->
            <div class="kpi-row" *ngIf="loading">
                <div class="modern-kpi-card" *ngFor="let i of [1,2,3,4]">
                    <div class="flex justify-content-between mb-3">
                        <p-skeleton width="60%" height="1rem"></p-skeleton>
                        <p-skeleton shape="circle" size="3rem"></p-skeleton>
                    </div>
                    <p-skeleton width="40%" height="2rem" styleClass="mb-2"></p-skeleton>
                    <p-skeleton width="80%" height="0.5rem"></p-skeleton>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="kpi-row" *ngIf="!loading && kpiCards.length">
                <div class="modern-kpi-card" *ngFor="let kpi of kpiCards"
                     (click)="onKpiClick(kpi)">
                    <div class="kpi-header">
                        <span class="kpi-label">{{ kpi.label }}</span>
                        <div class="kpi-icon-wrapper" [ngClass]="'bg-' + kpi.color + '-100'">
                            <i [ngClass]="kpi.icon + ' text-' + kpi.color + '-500'"></i>
                        </div>
                    </div>
                    <div class="kpi-body">
                        <span class="kpi-value">{{ kpi.value }}</span>
                        <div class="kpi-trend" [class.positive]="kpi.trend > 0" [class.negative]="kpi.trend < 0">
                            <i [ngClass]="kpi.trend >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                            <span>{{ kpi.trend >= 0 ? '+' : '' }}{{ kpi.trend }}% vs last month</span>
                        </div>
                    </div>
                    <p-progressBar [value]="kpi.progress" [showValue]="false" styleClass="h-1 mt-3"></p-progressBar>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="charts-row" *ngIf="!loading && stats">
                <p-card header="Employees by Department">
                    <div class="chart-container">
                        <p-chart type="doughnut" [data]="employeesByDeptChart" [options]="pieChartOptions"></p-chart>
                    </div>
                </p-card>

                <p-card header="Employees by Category">
                    <div class="chart-container">
                        <p-chart type="pie" [data]="employeesByCategoryChart" [options]="pieChartOptions"></p-chart>
                    </div>
                </p-card>

                <p-card header="Qualification Rate">
                    <div class="chart-container">
                        <p-chart type="bar" [data]="qualificationChart" [options]="barChartOptions"></p-chart>
                    </div>
                </p-card>
            </div>

            <!-- Stats Row -->
            <div class="stats-row" *ngIf="!loading && stats">
                <p-card header="Versatility Score">
                    <div class="versatility-score">
                        <div class="score-circle">
                            <span class="score-value">{{ stats.averageVersatility | number:'1.1-1' }}</span>
                            <span class="score-max">/ 4</span>
                        </div>
                        <p-progressBar [value]="(stats.averageVersatility / 4) * 100" [showValue]="false"></p-progressBar>
                        <span class="score-label">Average Versatility Level</span>
                    </div>
                </p-card>

                <p-card header="Recyclage Alerts">
                    <div class="recyclage-info">
                        <span class="alert-count" [class.danger]="stats.employeesRequiringRecyclage > 5">
                            {{ stats.employeesRequiringRecyclage }}
                        </span>
                        <span class="alert-label">Employees requiring recyclage</span>
                        <button class="p-button p-button-text p-button-sm mt-2" (click)="onViewRecyclage()">
                            View Details <i class="pi pi-arrow-right ml-1"></i>
                        </button>
                    </div>
                </p-card>

                <p-card header="Qualification Completion">
                    <div class="completion-info">
                        <span class="completion-rate">{{ stats.qualificationCompletionRate }}%</span>
                        <p-progressBar [value]="stats.qualificationCompletionRate" [showValue]="false"></p-progressBar>
                        <span class="completion-label">Qualification completion rate</span>
                    </div>
                </p-card>
            </div>
        </div>
    `,
    styles: [`
        .rh-dashboard {
            padding: 1rem;
        }

        .kpi-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .modern-kpi-card {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            }
        }

        .kpi-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }

        .kpi-label {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
            font-weight: 500;
        }

        .kpi-icon-wrapper {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;

            i {
                font-size: 1.5rem;
            }
        }

        .kpi-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-color);
        }

        .kpi-trend {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.75rem;
            margin-top: 0.5rem;

            &.positive {
                color: var(--green-500);
            }

            &.negative {
                color: var(--red-500);
            }
        }

        .charts-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .chart-container {
            height: 250px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1rem;
        }

        .versatility-score,
        .recyclage-info,
        .completion-info {
            text-align: center;
            padding: 1rem;
        }

        .score-circle {
            display: flex;
            align-items: baseline;
            justify-content: center;
            margin-bottom: 1rem;
        }

        .score-value {
            font-size: 3rem;
            font-weight: 700;
            color: var(--primary-color);
        }

        .score-max {
            font-size: 1.25rem;
            color: var(--text-color-secondary);
        }

        .score-label,
        .alert-label,
        .completion-label {
            display: block;
            margin-top: 0.5rem;
            font-size: 0.875rem;
            color: var(--text-color-secondary);
        }

        .alert-count {
            font-size: 3rem;
            font-weight: 700;
            color: var(--orange-500);

            &.danger {
                color: var(--red-500);
            }
        }

        .completion-rate {
            font-size: 3rem;
            font-weight: 700;
            color: var(--green-500);
        }
    `]
})
export class RhDashboardComponent implements OnInit, OnDestroy {
    @Input() stats: HRDashboardStats | null = null;
    @Output() kpiClicked = new EventEmitter<KpiCard>();
    @Output() viewRecyclage = new EventEmitter<void>();

    private destroy$ = new Subject<void>();

    loading = false;
    kpiCards: KpiCard[] = [];

    // Chart data
    employeesByDeptChart: any;
    employeesByCategoryChart: any;
    qualificationChart: any;

    pieChartOptions = {
        plugins: {
            legend: {
                position: 'bottom'
            }
        },
        maintainAspectRatio: false
    };

    barChartOptions = {
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        },
        maintainAspectRatio: false
    };

    constructor(private dashboardService: DmsRhDashboardService) {}

    ngOnInit(): void {
        if (!this.stats) {
            this.loadStats();
        } else {
            this.buildKpiCards();
            this.buildCharts();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadStats(): void {
        this.loading = true;
        this.dashboardService.getDashboardStats()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (stats: any) => {
                    // Map snake_case API response to camelCase model
                    this.stats = this.mapApiResponse(stats);
                    this.buildKpiCards();
                    this.buildCharts();
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    private mapApiResponse(data: any): HRDashboardStats {
        return {
            totalEmployees: data.total_employees ?? data.totalEmployees ?? 0,
            activeEmployees: data.active_employees ?? data.activeEmployees ?? 0,
            inactiveEmployees: data.inactive_employees ?? data.inactiveEmployees ?? 0,
            employeesByDepartment: (data.employees_by_department ?? data.employeesByDepartment ?? []),
            employeesByCategory: (data.employees_by_category ?? data.employeesByCategory ?? []),
            recentHires: data.recent_hires ?? data.recentHires ?? [],
            employeesRequiringRecyclage: data.employees_requiring_recyclage ?? data.employeesRequiringRecyclage ?? 0,
            qualificationCompletionRate: data.qualification_rate ?? data.qualificationCompletionRate ?? 0,
            averageVersatility: data.average_versatility ?? data.averageVersatility ?? 0
        };
    }

    private buildKpiCards(): void {
        if (!this.stats) return;

        const totalEmployees = this.stats.totalEmployees || 1; // Avoid division by zero

        this.kpiCards = [
            {
                label: 'Total Employees',
                value: this.stats.totalEmployees || 0,
                icon: 'pi pi-users',
                color: 'blue',
                trend: 5,
                progress: 100
            },
            {
                label: 'Active Employees',
                value: this.stats.activeEmployees || 0,
                icon: 'pi pi-check-circle',
                color: 'green',
                trend: 3,
                progress: ((this.stats.activeEmployees || 0) / totalEmployees) * 100
            },
            {
                label: 'Recyclage Required',
                value: this.stats.employeesRequiringRecyclage || 0,
                icon: 'pi pi-refresh',
                color: 'orange',
                trend: -2,
                progress: ((this.stats.employeesRequiringRecyclage || 0) / totalEmployees) * 100
            },
            {
                label: 'Qualification Rate',
                value: Math.round(this.stats.qualificationCompletionRate || 0),
                icon: 'pi pi-chart-line',
                color: 'purple',
                trend: 8,
                progress: this.stats.qualificationCompletionRate || 0
            }
        ];
    }

    private buildCharts(): void {
        if (!this.stats) return;

        const colors = [
            '#2563EB', '#10B981', '#F59E0B', '#EF4444',
            '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
        ];

        // Employees by Department - with null check
        const deptData = this.stats.employeesByDepartment || [];
        this.employeesByDeptChart = {
            labels: deptData.map((d: any) => d.department),
            datasets: [{
                data: deptData.map((d: any) => d.count),
                backgroundColor: colors.slice(0, deptData.length)
            }]
        };

        // Employees by Category - with null check
        const categoryData = this.stats.employeesByCategory || [];
        this.employeesByCategoryChart = {
            labels: categoryData.map((c: any) => c.category),
            datasets: [{
                data: categoryData.map((c: any) => c.count),
                backgroundColor: colors.slice(0, categoryData.length)
            }]
        };

        // Qualification Chart
        const qualRate = this.stats.qualificationCompletionRate || 0;
        this.qualificationChart = {
            labels: ['Qualified', 'In Training', 'Not Qualified'],
            datasets: [{
                data: [
                    Math.round(qualRate),
                    Math.round((100 - qualRate) * 0.4),
                    Math.round((100 - qualRate) * 0.6)
                ],
                backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
            }]
        };
    }

    onKpiClick(kpi: KpiCard): void {
        this.kpiClicked.emit(kpi);
    }

    onViewRecyclage(): void {
        this.viewRecyclage.emit();
    }
}
