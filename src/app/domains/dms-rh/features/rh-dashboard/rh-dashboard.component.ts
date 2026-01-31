/**
 * RH Dashboard Component
 * Domain: DMS-RH
 *
 * Displays HR KPIs, statistics, and charts with modern Sakai template styling
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';

// Domain imports
import { DmsRhDashboardService, HRDashboardStats, HRKpi, HRQuickStats } from '@domains/dms-rh';

interface KpiCard {
    label: string;
    value: number;
    icon: string;
    color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    trend: number;
    progress: number;
    subtitle?: string;
}

@Component({
    selector: 'app-rh-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        CardModule,
        ChartModule,
        ProgressBarModule,
        SkeletonModule,
        TagModule,
        ButtonModule,
        TooltipModule,
        AvatarModule,
        RippleModule
    ],
    template: `
        <div class="rh-dashboard">
            <!-- Page Header -->
            <div class="hr-page-header">
                <div class="header-title">
                    <div class="header-icon">
                        <i class="pi pi-users"></i>
                    </div>
                    <div class="title-text">
                        <h1>HR Dashboard</h1>
                        <span class="subtitle">Overview of human resources metrics</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button pButton pRipple
                            icon="pi pi-upload"
                            label="Import HR Data"
                            class="p-button-outlined p-button-sm mr-2"
                            routerLink="/dms-admin/data-import"
                            [queryParams]="{module: 'hr'}"
                            pTooltip="Import HR data from Excel">
                    </button>
                    <button pButton pRipple
                            icon="pi pi-refresh"
                            class="p-button-text p-button-rounded"
                            (click)="loadStats()"
                            [loading]="loading"
                            pTooltip="Refresh data">
                    </button>
                </div>
            </div>

            <!-- Loading Skeleton -->
            <div class="hr-kpi-grid" *ngIf="loading">
                <div class="hr-kpi-card kpi-primary" *ngFor="let i of [1,2,3,4]">
                    <div class="kpi-header">
                        <p-skeleton width="80px" height="14px"></p-skeleton>
                        <p-skeleton width="48px" height="48px" borderRadius="12px"></p-skeleton>
                    </div>
                    <p-skeleton width="80px" height="40px" styleClass="mb-2"></p-skeleton>
                    <p-skeleton width="100%" height="6px" borderRadius="3px"></p-skeleton>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="hr-kpi-grid" *ngIf="!loading && kpiCards.length">
                <div class="hr-kpi-card"
                     [ngClass]="'kpi-' + kpi.color"
                     *ngFor="let kpi of kpiCards"
                     (click)="onKpiClick(kpi)"
                     pRipple>
                    <div class="kpi-header">
                        <span class="kpi-label">{{ kpi.label }}</span>
                        <div class="kpi-icon" [ngClass]="'icon-' + kpi.color">
                            <i [class]="kpi.icon"></i>
                        </div>
                    </div>
                    <div class="kpi-value">{{ kpi.value | number }}</div>
                    <div class="kpi-trend" [ngClass]="kpi.trend >= 0 ? 'trend-up' : 'trend-down'">
                        <i [class]="kpi.trend >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                        {{ kpi.trend >= 0 ? '+' : '' }}{{ kpi.trend }}%
                    </div>
                    <div class="kpi-progress">
                        <div class="progress-fill"
                             [ngClass]="'fill-' + kpi.color"
                             [style.width.%]="kpi.progress"></div>
                    </div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="grid" *ngIf="!loading && stats">
                <div class="col-12 lg:col-4">
                    <div class="hr-section-card">
                        <div class="section-header">
                            <span class="section-title">
                                <i class="pi pi-building"></i>
                                Employees by Department
                            </span>
                        </div>
                        <div class="section-body">
                            <div class="hr-chart-container">
                                <p-chart type="doughnut"
                                         [data]="employeesByDeptChart"
                                         [options]="doughnutOptions"
                                         [style]="{'width': '100%', 'height': '100%'}">
                                </p-chart>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 lg:col-4">
                    <div class="hr-section-card">
                        <div class="section-header">
                            <span class="section-title">
                                <i class="pi pi-tags"></i>
                                Employees by Category
                            </span>
                        </div>
                        <div class="section-body">
                            <div class="hr-chart-container">
                                <p-chart type="pie"
                                         [data]="employeesByCategoryChart"
                                         [options]="pieOptions"
                                         [style]="{'width': '100%', 'height': '100%'}">
                                </p-chart>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 lg:col-4">
                    <div class="hr-section-card">
                        <div class="section-header">
                            <span class="section-title">
                                <i class="pi pi-chart-bar"></i>
                                Qualification Rate
                            </span>
                        </div>
                        <div class="section-body">
                            <div class="hr-chart-container">
                                <p-chart type="bar"
                                         [data]="qualificationChart"
                                         [options]="barOptions"
                                         [style]="{'width': '100%', 'height': '100%'}">
                                </p-chart>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Row -->
            <div class="grid mt-3" *ngIf="!loading && stats">
                <div class="col-12 md:col-6">
                    <div class="hr-section-card">
                        <div class="section-header">
                            <span class="section-title">
                                <i class="pi pi-verified"></i>
                                Qualification Completion
                            </span>
                        </div>
                        <div class="section-body">
                            <div class="completion-display">
                                <div class="completion-value">{{ stats.qualificationCompletionRate | number:'1.0-0' }}%</div>
                                <div class="completion-bar">
                                    <div class="completion-fill"
                                         [style.width.%]="stats.qualificationCompletionRate">
                                    </div>
                                </div>
                                <span class="completion-label">of employees fully qualified</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Hires -->
            <div class="hr-section-card mt-3" *ngIf="!loading && stats?.recentHires?.length">
                <div class="section-header">
                    <span class="section-title">
                        <i class="pi pi-user-plus"></i>
                        Recent Hires
                    </span>
                    <p-tag [value]="(stats?.recentHires?.length || 0) + ' new'" severity="info"></p-tag>
                </div>
                <div class="section-body">
                    <div class="recent-hires-grid">
                        <div class="hire-card" *ngFor="let hire of (stats?.recentHires || []).slice(0, 6)">
                            <div class="hr-avatar-badge">
                                <p-avatar [label]="getInitials(hire)"
                                          shape="circle"
                                          size="large"
                                          [style]="{'background': 'var(--hr-gradient)', 'color': 'white'}">
                                </p-avatar>
                                <span class="badge badge-active"></span>
                            </div>
                            <div class="hire-info">
                                <span class="hire-name">{{ hire.Prenom_Emp }} {{ hire.Nom_Emp }}</span>
                                <span class="hire-dept">{{ hire.Departement_Emp }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .rh-dashboard {
            padding: 1.5rem;
        }

        /* Completion Display */
        .completion-display {
            text-align: center;
            padding: 1rem 0;
        }

        .completion-value {
            font-size: 3rem;
            font-weight: 700;
            color: var(--hr-success);
            line-height: 1;
            margin-bottom: 1rem;
        }

        .completion-bar {
            height: 12px;
            background: var(--surface-border);
            border-radius: 6px;
            overflow: hidden;
            margin-bottom: 0.75rem;
        }

        .completion-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--hr-success) 0%, #34D399 100%);
            border-radius: 6px;
            transition: width 0.5s ease;
        }

        .completion-label {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
        }

        /* Recent Hires Grid */
        .recent-hires-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 1rem;
        }

        .hire-card {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem;
            background: var(--surface-50);
            border-radius: 12px;
            transition: all 0.2s ease;

            &:hover {
                background: var(--surface-100);
            }
        }

        .hire-info {
            display: flex;
            flex-direction: column;

            .hire-name {
                font-weight: 600;
                color: var(--text-color);
                font-size: 0.9375rem;
            }

            .hire-dept {
                font-size: 0.8125rem;
                color: var(--text-color-secondary);
            }
        }

    `]
})
export class RhDashboardComponent implements OnInit, OnDestroy {
    @Input() stats: HRDashboardStats | null = null;
    @Output() kpiClicked = new EventEmitter<KpiCard>();

    private destroy$ = new Subject<void>();

    loading = false;
    kpiCards: KpiCard[] = [];

    // Chart data
    employeesByDeptChart: any;
    employeesByCategoryChart: any;
    qualificationChart: any;

    doughnutOptions = {
        cutout: '60%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 16
                }
            }
        },
        maintainAspectRatio: false
    };

    pieOptions = {
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 16
                }
            }
        },
        maintainAspectRatio: false
    };

    barOptions = {
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        },
        maintainAspectRatio: false
    };

    constructor(
        private dashboardService: DmsRhDashboardService,
        private router: Router
    ) {}

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
            averageVersatility: data.average_versatility ?? data.averageVersatility ?? 0,
            nonQualifiedAssignmentsActive: data.non_qualified_assignments_active ?? data.nonQualifiedAssignmentsActive ?? 0,
            nonQualifiedAssignmentsTotal: data.non_qualified_assignments_total ?? data.nonQualifiedAssignmentsTotal ?? 0
        };
    }

    private buildKpiCards(): void {
        if (!this.stats) return;

        const totalEmployees = this.stats.totalEmployees || 1;

        this.kpiCards = [
            {
                label: 'Total Employees',
                value: this.stats.totalEmployees || 0,
                icon: 'pi pi-users',
                color: 'primary',
                trend: 5,
                progress: 100,
                subtitle: 'All registered employees'
            },
            {
                label: 'Active Employees',
                value: this.stats.activeEmployees || 0,
                icon: 'pi pi-check-circle',
                color: 'success',
                trend: 3,
                progress: ((this.stats.activeEmployees || 0) / totalEmployees) * 100,
                subtitle: 'Currently working'
            },
            {
                label: 'Recyclage Required',
                value: this.stats.employeesRequiringRecyclage || 0,
                icon: 'pi pi-refresh',
                color: this.stats.employeesRequiringRecyclage > 5 ? 'danger' : 'warning',
                trend: -2,
                progress: ((this.stats.employeesRequiringRecyclage || 0) / totalEmployees) * 100,
                subtitle: 'Need retraining'
            }
        ];
    }

    private buildCharts(): void {
        if (!this.stats) return;

        const colors = [
            '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
            '#3B82F6', '#EC4899', '#06B6D4', '#84CC16'
        ];

        const deptData = this.stats.employeesByDepartment || [];
        this.employeesByDeptChart = {
            labels: deptData.map((d: any) => d.department || d.Departement_Emp),
            datasets: [{
                data: deptData.map((d: any) => d.count || d.total),
                backgroundColor: colors.slice(0, deptData.length),
                borderWidth: 0,
                hoverOffset: 8
            }]
        };

        const categoryData = this.stats.employeesByCategory || [];
        this.employeesByCategoryChart = {
            labels: categoryData.map((c: any) => c.category || c.Categorie_Emp),
            datasets: [{
                data: categoryData.map((c: any) => c.count || c.total),
                backgroundColor: colors.slice(0, categoryData.length),
                borderWidth: 0,
                hoverOffset: 8
            }]
        };

        const qualRate = this.stats.qualificationCompletionRate || 0;
        this.qualificationChart = {
            labels: ['Qualified', 'In Training', 'Not Qualified'],
            datasets: [{
                data: [
                    Math.round(qualRate),
                    Math.round((100 - qualRate) * 0.4),
                    Math.round((100 - qualRate) * 0.6)
                ],
                backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                borderWidth: 0,
                borderRadius: 4,
                barThickness: 40
            }]
        };
    }

    getInitials(employee: any): string {
        const first = employee?.Prenom_Emp?.charAt(0) || '';
        const last = employee?.Nom_Emp?.charAt(0) || '';
        return (first + last).toUpperCase() || '?';
    }

    onKpiClick(kpi: KpiCard): void {
        this.kpiClicked.emit(kpi);
    }
}
