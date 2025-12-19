/**
 * Quality Dashboard Component
 * Domain: DMS-Quality
 *
 * Displays quality KPIs, defect trends, and quality metrics
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { KnobModule } from 'primeng/knob';

// Domain imports
import { DmsQualityService, DefectSummary } from '@domains/dms-quality';

interface QualityKpi {
    label: string;
    value: number;
    target: number;
    unit: string;
    icon: string;
    color: string;
    trend?: number;
    status: 'success' | 'warning' | 'danger';
}

@Component({
    selector: 'app-quality-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        ChartModule,
        TagModule,
        ProgressBarModule,
        ButtonModule,
        TooltipModule,
        KnobModule
    ],
    template: `
        <div class="quality-dashboard">
            <!-- KPI Cards -->
            <div class="kpi-grid">
                <div *ngFor="let kpi of kpiCards" class="kpi-card" [ngClass]="'kpi-' + kpi.status">
                    <div class="kpi-header">
                        <span class="kpi-label">{{ kpi.label }}</span>
                        <div class="kpi-icon" [ngClass]="'bg-' + kpi.color">
                            <i [class]="kpi.icon"></i>
                        </div>
                    </div>
                    <div class="kpi-body">
                        <span class="kpi-value">{{ kpi.value | number:'1.1-1' }}</span>
                        <span class="kpi-unit">{{ kpi.unit }}</span>
                    </div>
                    <div class="kpi-footer">
                        <span class="kpi-target">Target: {{ kpi.target }}{{ kpi.unit }}</span>
                        <p-tag *ngIf="kpi.trend !== undefined"
                               [value]="(kpi.trend >= 0 ? '+' : '') + kpi.trend + '%'"
                               [severity]="kpi.trend <= 0 ? 'success' : 'danger'"
                               styleClass="text-xs">
                        </p-tag>
                    </div>
                    <p-progressBar [value]="getKpiProgress(kpi)" [showValue]="false"
                                   styleClass="h-1 mt-2"></p-progressBar>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="charts-grid mt-4">
                <!-- Defect Trend -->
                <p-card>
                    <ng-template pTemplate="header">
                        <div class="flex justify-content-between align-items-center p-3">
                            <span class="font-semibold">Defect Trend (Last 7 Days)</span>
                            <button pButton icon="pi pi-refresh" class="p-button-text p-button-sm"
                                    (click)="refresh()" [loading]="loading">
                            </button>
                        </div>
                    </ng-template>
                    <div class="chart-container">
                        <p-chart type="line" [data]="defectTrendData" [options]="lineChartOptions"></p-chart>
                    </div>
                </p-card>

                <!-- Defect by Category -->
                <p-card>
                    <ng-template pTemplate="header">
                        <div class="p-3">
                            <span class="font-semibold">Defects by Category</span>
                        </div>
                    </ng-template>
                    <div class="chart-container">
                        <p-chart type="doughnut" [data]="defectCategoryData" [options]="pieChartOptions"></p-chart>
                    </div>
                </p-card>
            </div>

            <!-- Quality Gauges -->
            <div class="gauges-grid mt-4">
                <p-card styleClass="text-center">
                    <ng-template pTemplate="header">
                        <div class="p-3">
                            <span class="font-semibold">FPY (First Pass Yield)</span>
                        </div>
                    </ng-template>
                    <div class="gauge-container">
                        <p-knob [(ngModel)]="fpyValue" [readonly]="true" [size]="150"
                                [strokeWidth]="10" valueTemplate="{value}%"
                                [valueColor]="getGaugeColor(fpyValue, 95)">
                        </p-knob>
                        <p class="mt-2 text-color-secondary">Target: 95%</p>
                    </div>
                </p-card>

                <p-card styleClass="text-center">
                    <ng-template pTemplate="header">
                        <div class="p-3">
                            <span class="font-semibold">Scrap Rate</span>
                        </div>
                    </ng-template>
                    <div class="gauge-container">
                        <p-knob [(ngModel)]="scrapRate" [readonly]="true" [size]="150"
                                [strokeWidth]="10" valueTemplate="{value}%"
                                [valueColor]="getGaugeColor(100 - scrapRate, 98)">
                        </p-knob>
                        <p class="mt-2 text-color-secondary">Target: &lt; 2%</p>
                    </div>
                </p-card>

                <p-card styleClass="text-center">
                    <ng-template pTemplate="header">
                        <div class="p-3">
                            <span class="font-semibold">Customer Returns (PPM)</span>
                        </div>
                    </ng-template>
                    <div class="gauge-container">
                        <p-knob [(ngModel)]="customerPPM" [readonly]="true" [size]="150"
                                [strokeWidth]="10" [max]="500" valueTemplate="{value}"
                                [valueColor]="customerPPM <= 50 ? '#10B981' : customerPPM <= 100 ? '#F59E0B' : '#EF4444'">
                        </p-knob>
                        <p class="mt-2 text-color-secondary">Target: &lt; 50 PPM</p>
                    </div>
                </p-card>
            </div>

            <!-- Top Defects Table -->
            <p-card styleClass="mt-4">
                <ng-template pTemplate="header">
                    <div class="flex justify-content-between align-items-center p-3">
                        <span class="text-xl font-semibold">Top Defects Today</span>
                        <button pButton label="View All" icon="pi pi-arrow-right"
                                class="p-button-text" (click)="viewAllDefects.emit()">
                        </button>
                    </div>
                </ng-template>

                <p-table [value]="topDefects" [loading]="loading" styleClass="p-datatable-sm">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Defect Code</th>
                            <th>Description</th>
                            <th>Workstation</th>
                            <th class="text-center">Quantity</th>
                            <th class="text-center">% of Total</th>
                            <th>Severity</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-defect>
                        <tr>
                            <td>
                                <span class="font-semibold text-primary">{{ defect.code }}</span>
                            </td>
                            <td>{{ defect.description }}</td>
                            <td>
                                <span class="text-color-secondary">{{ defect.workstation }}</span>
                            </td>
                            <td class="text-center">
                                <span class="text-xl font-bold">{{ defect.quantity }}</span>
                            </td>
                            <td class="text-center">
                                <div class="percent-bar">
                                    <p-progressBar [value]="defect.percentage" [showValue]="false"
                                                   styleClass="h-1"></p-progressBar>
                                    <span class="percent-label">{{ defect.percentage }}%</span>
                                </div>
                            </td>
                            <td>
                                <p-tag [value]="defect.severity"
                                       [severity]="getSeverityColor(defect.severity)">
                                </p-tag>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="6" class="text-center p-4">
                                <i class="pi pi-check-circle text-4xl text-green-500 mb-2"></i>
                                <p class="font-semibold">No Defects Recorded</p>
                                <p class="text-sm text-color-secondary">Great job! Zero defects today.</p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>

            <!-- Defect by Line Chart -->
            <p-card styleClass="mt-4">
                <ng-template pTemplate="header">
                    <div class="p-3">
                        <span class="font-semibold">Defects by Production Line</span>
                    </div>
                </ng-template>
                <div class="chart-container-large">
                    <p-chart type="bar" [data]="defectByLineData" [options]="barChartOptions"></p-chart>
                </div>
            </p-card>
        </div>
    `,
    styles: [`
        .quality-dashboard {
            padding: 1rem;
        }

        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1rem;
        }

        .kpi-card {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1.25rem;
            border-left: 4px solid;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: all 0.2s;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            }

            &.kpi-success { border-left-color: var(--green-500); }
            &.kpi-warning { border-left-color: var(--orange-500); }
            &.kpi-danger { border-left-color: var(--red-500); }
        }

        .kpi-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.75rem;
        }

        .kpi-label {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-color-secondary);
        }

        .kpi-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;

            &.bg-red { background: var(--red-500); }
            &.bg-green { background: var(--green-500); }
            &.bg-orange { background: var(--orange-500); }
            &.bg-blue { background: var(--blue-500); }
        }

        .kpi-body {
            display: flex;
            align-items: baseline;
            gap: 0.25rem;
        }

        .kpi-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-color);
        }

        .kpi-unit {
            font-size: 1rem;
            color: var(--text-color-secondary);
        }

        .kpi-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 0.5rem;
        }

        .kpi-target {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
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
            height: 280px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .chart-container-large {
            height: 350px;
        }

        .gauges-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;

            @media (max-width: 992px) {
                grid-template-columns: repeat(2, 1fr);
            }

            @media (max-width: 576px) {
                grid-template-columns: 1fr;
            }
        }

        .gauge-container {
            padding: 1rem;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .percent-bar {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            width: 100%;

            .percent-label {
                font-size: 0.75rem;
                font-weight: 600;
            }
        }
    `]
})
export class QualityDashboardComponent implements OnInit, OnDestroy {
    @Input() autoRefresh = true;
    @Input() refreshInterval = 30000;

    @Output() viewAllDefects = new EventEmitter<void>();
    @Output() defectClicked = new EventEmitter<DefectSummary>();

    private destroy$ = new Subject<void>();

    loading = false;
    kpiCards: QualityKpi[] = [];
    topDefects: DefectSummary[] = [];

    // Gauge values
    fpyValue = 0;
    scrapRate = 0;
    customerPPM = 0;

    // Chart data
    defectTrendData: any;
    defectCategoryData: any;
    defectByLineData: any;

    lineChartOptions = {
        plugins: {
            legend: { display: true, position: 'bottom' }
        },
        scales: { y: { beginAtZero: true } },
        maintainAspectRatio: false
    };

    pieChartOptions = {
        plugins: { legend: { position: 'bottom' } },
        maintainAspectRatio: false
    };

    barChartOptions = {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
        maintainAspectRatio: false,
        indexAxis: 'y'
    };

    constructor(private qualityService: DmsQualityService) {}

    ngOnInit(): void {
        this.loadData();

        if (this.autoRefresh) {
            this.startAutoRefresh();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadData(): void {
        this.loading = true;
        this.buildKpiCards();
        this.buildCharts();
        this.loadTopDefects();
        this.loading = false;
    }

    private startAutoRefresh(): void {
        interval(this.refreshInterval)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.loadData());
    }

    private buildKpiCards(): void {
        // Mock data - replace with actual service call
        this.fpyValue = 96.5;
        this.scrapRate = 1.8;
        this.customerPPM = 35;

        this.kpiCards = [
            {
                label: 'Total Defects Today',
                value: 47,
                target: 50,
                unit: 'pcs',
                icon: 'pi pi-exclamation-triangle',
                color: 'red',
                trend: -8,
                status: 47 <= 50 ? 'success' : 47 <= 75 ? 'warning' : 'danger'
            },
            {
                label: 'Scrap Rate',
                value: this.scrapRate,
                target: 2,
                unit: '%',
                icon: 'pi pi-trash',
                color: 'orange',
                trend: -5,
                status: this.scrapRate <= 2 ? 'success' : this.scrapRate <= 3 ? 'warning' : 'danger'
            },
            {
                label: 'First Pass Yield',
                value: this.fpyValue,
                target: 95,
                unit: '%',
                icon: 'pi pi-check-circle',
                color: 'green',
                trend: 2,
                status: this.fpyValue >= 95 ? 'success' : this.fpyValue >= 90 ? 'warning' : 'danger'
            },
            {
                label: 'Customer PPM',
                value: this.customerPPM,
                target: 50,
                unit: ' PPM',
                icon: 'pi pi-users',
                color: 'blue',
                trend: -12,
                status: this.customerPPM <= 50 ? 'success' : this.customerPPM <= 100 ? 'warning' : 'danger'
            }
        ];
    }

    private buildCharts(): void {
        // Defect trend (last 7 days)
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        this.defectTrendData = {
            labels: days,
            datasets: [
                {
                    label: 'Defects',
                    data: [62, 55, 48, 52, 45, 38, 47],
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Target',
                    data: [50, 50, 50, 50, 50, 50, 50],
                    borderColor: '#9CA3AF',
                    borderDash: [5, 5],
                    fill: false
                }
            ]
        };

        // Defect by category
        this.defectCategoryData = {
            labels: ['Visual', 'Dimensional', 'Functional', 'Material', 'Assembly'],
            datasets: [{
                data: [35, 25, 18, 12, 10],
                backgroundColor: ['#EF4444', '#F59E0B', '#8B5CF6', '#3B82F6', '#10B981']
            }]
        };

        // Defects by production line
        this.defectByLineData = {
            labels: ['Line A', 'Line B', 'Line C', 'Line D', 'Line E'],
            datasets: [{
                label: 'Defects',
                data: [15, 12, 8, 7, 5],
                backgroundColor: '#EF4444'
            }]
        };
    }

    private loadTopDefects(): void {
        // Mock data - replace with actual service call
        this.topDefects = [
            { code: 'DEF-001', description: 'Surface scratch', workstation: 'Assembly A1', quantity: 12, percentage: 25.5, severity: 'Major' },
            { code: 'DEF-002', description: 'Dimension out of spec', workstation: 'Machining B2', quantity: 9, percentage: 19.1, severity: 'Critical' },
            { code: 'DEF-003', description: 'Missing component', workstation: 'Assembly A3', quantity: 7, percentage: 14.9, severity: 'Minor' },
            { code: 'DEF-004', description: 'Color mismatch', workstation: 'Painting C1', quantity: 6, percentage: 12.8, severity: 'Minor' },
            { code: 'DEF-005', description: 'Weld defect', workstation: 'Welding D1', quantity: 5, percentage: 10.6, severity: 'Major' }
        ];
    }

    refresh(): void {
        this.loadData();
    }

    getKpiProgress(kpi: QualityKpi): number {
        // For metrics where lower is better (defects, scrap), invert the progress
        if (kpi.label.includes('Defect') || kpi.label.includes('Scrap') || kpi.label.includes('PPM')) {
            return Math.max(0, 100 - ((kpi.value / kpi.target) * 100));
        }
        return Math.min((kpi.value / kpi.target) * 100, 100);
    }

    getGaugeColor(value: number, target: number): string {
        if (value >= target) return '#10B981';
        if (value >= target * 0.95) return '#F59E0B';
        return '#EF4444';
    }

    getSeverityColor(severity: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const map: Record<string, 'danger' | 'warn' | 'info'> = {
            'Critical': 'danger',
            'Major': 'warn',
            'Minor': 'info'
        };
        return map[severity] || 'secondary';
    }
}
