/**
 * Weekly Follow-up Component
 * Domain: DMS-Maintenance
 *
 * Displays KPI metrics (MTBF, MTTR, Downtime %) with charts
 * Based on Image 4 - Dashboard KPIs with weekly follow-up charts
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG v19
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

// Domain imports
import { DmsMaintenanceService } from '../../services/maintenance.service';
import { MaintenanceKPISummary, MaintenanceKPIData } from '../../models';

@Component({
    selector: 'app-weekly-followup',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        ChartModule,
        TableModule,
        SelectModule,
        ButtonModule,
        TooltipModule
    ],
    template: `
        <div class="weekly-followup">
            <!-- Filters -->
            <div class="filters-row mb-3">
                <div class="filter-group">
                    <label class="filter-label">Production Line</label>
                    <p-select [options]="productionLineOptions"
                              [(ngModel)]="selectedProductionLine"
                              optionLabel="label"
                              optionValue="value"
                              placeholder="Select..."
                              [showClear]="true"
                              (onChange)="loadKPIData()"
                              styleClass="filter-select">
                    </p-select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Zone</label>
                    <p-select [options]="zoneOptions"
                              [(ngModel)]="selectedZone"
                              optionLabel="label"
                              optionValue="value"
                              placeholder="Select..."
                              [showClear]="true"
                              (onChange)="loadKPIData()"
                              styleClass="filter-select">
                    </p-select>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="main-grid">
                <!-- KPI Table -->
                <p-card styleClass="kpi-table-card">
                    <ng-template pTemplate="header">
                        <div class="card-header">
                            <span class="card-title">KPIs</span>
                        </div>
                    </ng-template>
                    <div class="kpi-table-container">
                        <table class="kpi-table">
                            <thead>
                                <tr>
                                    <th class="kpi-label-col"></th>
                                    <th *ngFor="let week of kpiData?.weeks || []" class="week-col">
                                        W{{ week.weekNumber }}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="kpi-label">Total Downtime</td>
                                    <td *ngFor="let week of kpiData?.weeks || []" class="kpi-value">
                                        {{ week.totalDowntime | number:'1.2-2' }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="kpi-label">Downtime Min</td>
                                    <td *ngFor="let week of kpiData?.weeks || []" class="kpi-value">
                                        {{ week.downtimeMin | number:'1.2-2' }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="kpi-label">DT %</td>
                                    <td *ngFor="let week of kpiData?.weeks || []" class="kpi-value">
                                        {{ week.downtimePercent | number:'1.2-2' }}%
                                    </td>
                                </tr>
                                <tr>
                                    <td class="kpi-label">DT Target % (94)</td>
                                    <td *ngFor="let week of kpiData?.weeks || []" class="kpi-value">
                                        {{ week.downtimeTargetPercent | number:'1.2-2' }}%
                                    </td>
                                </tr>
                                <tr>
                                    <td class="kpi-label">MTBF</td>
                                    <td *ngFor="let week of kpiData?.weeks || []" class="kpi-value">
                                        {{ week.mtbf | number:'1.2-2' }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="kpi-label">MTBF Target M</td>
                                    <td *ngFor="let week of kpiData?.weeks || []" class="kpi-value">
                                        {{ week.mtbfTarget | number:'1.2-2' }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="kpi-label">MTTR Min</td>
                                    <td *ngFor="let week of kpiData?.weeks || []" class="kpi-value">
                                        {{ week.mttrMin | number:'1.2-2' }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="kpi-label">MTTR Target Min</td>
                                    <td *ngFor="let week of kpiData?.weeks || []" class="kpi-value">
                                        {{ week.mttrTarget | number:'1.2-2' }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </p-card>

                <!-- Follow up Downtime % Chart -->
                <p-card styleClass="chart-card">
                    <ng-template pTemplate="header">
                        <div class="card-header">
                            <span class="card-title">
                                <i class="pi pi-chart-bar mr-2"></i>Follow up Downtime %
                            </span>
                            <button pButton icon="pi pi-external-link" class="p-button-text p-button-sm"></button>
                        </div>
                    </ng-template>
                    <div class="chart-container">
                        <p-chart type="bar" [data]="downtimeChart" [options]="downtimeChartOptions"></p-chart>
                    </div>
                </p-card>
            </div>

            <!-- Bottom Charts Row -->
            <div class="charts-row mt-3">
                <!-- Weekly Follow up MTTR Chart -->
                <p-card styleClass="chart-card">
                    <ng-template pTemplate="header">
                        <div class="card-header">
                            <span class="card-title">
                                <i class="pi pi-chart-line mr-2"></i>Weekly Follow up MTTR of (Min)
                            </span>
                            <button pButton icon="pi pi-external-link" class="p-button-text p-button-sm"></button>
                        </div>
                    </ng-template>
                    <div class="chart-container-wide">
                        <p-chart type="bar" [data]="mttrChart" [options]="mttrChartOptions"></p-chart>
                    </div>
                </p-card>

                <!-- Weekly Follow up MTBF Chart -->
                <p-card styleClass="chart-card">
                    <ng-template pTemplate="header">
                        <div class="card-header">
                            <span class="card-title">
                                <i class="pi pi-chart-line mr-2"></i>Weekly Follow up MTBF of (Min)
                            </span>
                            <button pButton icon="pi pi-external-link" class="p-button-text p-button-sm"></button>
                        </div>
                    </ng-template>
                    <div class="chart-container-wide">
                        <p-chart type="bar" [data]="mtbfChart" [options]="mtbfChartOptions"></p-chart>
                    </div>
                </p-card>
            </div>
        </div>
    `,
    styles: [`
        .weekly-followup {
            padding: 1rem;
            background: var(--surface-ground);
            min-height: calc(100vh - 120px);
        }

        .filters-row {
            display: flex;
            gap: 1.5rem;
            align-items: flex-end;
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
            min-width: 180px;
        }

        .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;

            @media (max-width: 1200px) {
                grid-template-columns: 1fr;
            }
        }

        :host ::ng-deep .kpi-table-card,
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

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--surface-border);
        }

        .card-title {
            font-weight: 600;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
        }

        .kpi-table-container {
            overflow-x: auto;
            padding: 0.5rem;
        }

        .kpi-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.8rem;
            background: #d1fae5;
            border-radius: 8px;
            overflow: hidden;

            th, td {
                padding: 0.5rem 0.75rem;
                text-align: right;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            }

            th {
                background: #a7f3d0;
                font-weight: 600;
                font-size: 0.75rem;
            }

            .kpi-label-col {
                text-align: left;
                width: 150px;
            }

            .kpi-label {
                text-align: left;
                font-weight: 500;
            }

            .kpi-value {
                font-family: monospace;
                font-weight: 500;
            }

            .week-col {
                min-width: 80px;
            }
        }

        .chart-container {
            height: 280px;
            padding: 0.5rem;
        }

        .chart-container-wide {
            height: 250px;
            padding: 0.5rem;
        }

        .charts-row {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;

            @media (max-width: 1200px) {
                grid-template-columns: 1fr;
            }
        }
    `]
})
export class WeeklyFollowupComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    loading = false;

    selectedProductionLine: string | null = null;
    selectedZone: string | null = null;

    productionLineOptions = [
        { label: 'HBPO Production Line 1', value: 'HBPO Production Line 1' },
        { label: 'Motor B10 line 2', value: 'Motor B10 line 2' },
        { label: 'Faurecia Pilsen Production', value: 'Faurecia Pilsen Production' },
        { label: 'Die casting 2nd side', value: 'Die casting 2nd side' }
    ];

    zoneOptions = [
        { label: 'Assembly', value: 'Assembly' },
        { label: 'Die casting', value: 'Die casting' },
        { label: 'Pressing', value: 'Pressing' },
        { label: 'Cutting Wire', value: 'Cutting Wire' }
    ];

    kpiData: MaintenanceKPISummary | null = null;

    // Charts
    downtimeChart: any;
    mttrChart: any;
    mtbfChart: any;

    downtimeChartOptions = {
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, max: 2500 }
        },
        maintainAspectRatio: false
    };

    mttrChartOptions = {
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true }
        },
        maintainAspectRatio: false
    };

    mtbfChartOptions = {
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true }
        },
        maintainAspectRatio: false
    };

    constructor(private maintenanceService: DmsMaintenanceService) {}

    ngOnInit(): void {
        this.loadKPIData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadKPIData(): void {
        this.loading = true;
        this.maintenanceService.getKPIData({
            productionLine: this.selectedProductionLine || undefined,
            zone: this.selectedZone || undefined
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: (data: MaintenanceKPISummary) => {
                this.kpiData = data;
                this.buildCharts(data);
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    private buildCharts(data: MaintenanceKPISummary): void {
        // Downtime % Chart
        this.downtimeChart = {
            labels: ['1', '6', '11', '18', '21', '28', '31', '36', '41', '46', '51'],
            datasets: [
                {
                    label: 'Downtime',
                    data: [0, 0, 0, 0, 0, 2300, 0, 0, 0, 0, 0],
                    backgroundColor: '#0ea5e9',
                    borderRadius: 2
                },
                {
                    label: 'Target',
                    data: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
                    backgroundColor: '#22c55e',
                    borderRadius: 2
                }
            ]
        };

        // MTTR Chart
        this.mttrChart = {
            labels: data.weeklyMTTR.labels,
            datasets: [
                {
                    label: 'MTTR',
                    data: data.weeklyMTTR.actual,
                    backgroundColor: '#0ea5e9',
                    borderRadius: 2
                },
                {
                    label: 'MTTR Target',
                    data: data.weeklyMTTR.target,
                    backgroundColor: '#ef4444',
                    borderRadius: 2
                }
            ]
        };

        // MTBF Chart
        this.mtbfChart = {
            labels: data.weeklyMTBF.labels,
            datasets: [
                {
                    label: 'MTBF',
                    data: data.weeklyMTBF.actual,
                    backgroundColor: '#0ea5e9',
                    borderRadius: 2
                },
                {
                    label: 'MTBF Target',
                    data: data.weeklyMTBF.target,
                    backgroundColor: '#ef4444',
                    borderRadius: 2
                }
            ]
        };
    }
}
