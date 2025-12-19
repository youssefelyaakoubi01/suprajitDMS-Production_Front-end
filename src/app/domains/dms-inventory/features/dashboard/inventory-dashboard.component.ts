/**
 * Inventory Dashboard Component
 * Domain: DMS-Inventory
 *
 * Displays inventory KPIs, stock levels, and alerts
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';

// Domain imports
import { DmsInventoryService, InventoryItem } from '@domains/dms-inventory';

interface InventoryKpi {
    label: string;
    value: number | string;
    unit: string;
    icon: string;
    color: string;
    status: 'success' | 'warning' | 'danger';
}

interface DashboardStockAlert {
    partNumber: string;
    message: string;
    currentStock: number;
    minStock: number;
    type: 'low_stock' | 'out_of_stock' | 'critical';
    severity: 'warning' | 'critical';
}

@Component({
    selector: 'app-inventory-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        TableModule,
        ChartModule,
        TagModule,
        ProgressBarModule,
        ButtonModule,
        TooltipModule,
        BadgeModule
    ],
    template: `
        <div class="inventory-dashboard">
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
                        <span class="kpi-value">{{ kpi.value }}</span>
                        <span class="kpi-unit">{{ kpi.unit }}</span>
                    </div>
                </div>
            </div>

            <!-- Alerts Section -->
            <div class="alerts-section mt-4" *ngIf="stockAlerts.length > 0">
                <p-card styleClass="alert-card">
                    <ng-template pTemplate="header">
                        <div class="flex justify-content-between align-items-center p-3">
                            <span class="text-xl font-semibold text-red-500">
                                <i class="pi pi-exclamation-circle mr-2"></i>
                                Stock Alerts ({{ stockAlerts.length }})
                            </span>
                            <button pButton label="View All" icon="pi pi-arrow-right"
                                    class="p-button-text p-button-danger"
                                    (click)="viewAllAlerts.emit()">
                            </button>
                        </div>
                    </ng-template>

                    <div class="alerts-list">
                        <div *ngFor="let alert of stockAlerts.slice(0, 5)" class="alert-item"
                             [ngClass]="'alert-' + alert.severity">
                            <div class="alert-icon">
                                <i [class]="getAlertIcon(alert.type)"></i>
                            </div>
                            <div class="alert-content">
                                <span class="alert-pn">{{ alert.partNumber }}</span>
                                <span class="alert-message">{{ alert.message }}</span>
                            </div>
                            <div class="alert-stock">
                                <span class="stock-value">{{ alert.currentStock }}</span>
                                <span class="stock-label">in stock</span>
                            </div>
                            <button pButton icon="pi pi-shopping-cart" class="p-button-sm"
                                    pTooltip="Reorder" (click)="reorderPart(alert)">
                            </button>
                        </div>
                    </div>
                </p-card>
            </div>

            <!-- Main Content Grid -->
            <div class="main-grid mt-4">
                <!-- Stock by Category -->
                <p-card>
                    <ng-template pTemplate="header">
                        <div class="p-3">
                            <span class="font-semibold">Stock Value by Category</span>
                        </div>
                    </ng-template>
                    <div class="chart-container">
                        <p-chart type="doughnut" [data]="categoryChartData"
                                 [options]="pieChartOptions"></p-chart>
                    </div>
                </p-card>

                <!-- Stock Movement Trend -->
                <p-card>
                    <ng-template pTemplate="header">
                        <div class="p-3">
                            <span class="font-semibold">Stock Movement (Last 7 Days)</span>
                        </div>
                    </ng-template>
                    <div class="chart-container">
                        <p-chart type="line" [data]="movementChartData"
                                 [options]="lineChartOptions"></p-chart>
                    </div>
                </p-card>
            </div>

            <!-- Top Parts Table -->
            <p-card styleClass="mt-4">
                <ng-template pTemplate="header">
                    <div class="flex justify-content-between align-items-center p-3">
                        <span class="text-xl font-semibold">
                            <i class="pi pi-box mr-2"></i>Top Moving Parts
                        </span>
                        <button pButton label="View All Parts" icon="pi pi-arrow-right"
                                class="p-button-text" (click)="viewAllParts.emit()">
                        </button>
                    </div>
                </ng-template>

                <p-table [value]="topMovingParts" [loading]="loading"
                         styleClass="p-datatable-sm" [rowHover]="true">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Part Number</th>
                            <th>Description</th>
                            <th class="text-center">Stock</th>
                            <th class="text-center">Min Level</th>
                            <th class="text-center">Status</th>
                            <th class="text-right">Value</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-part>
                        <tr (click)="onPartClick(part)" style="cursor: pointer">
                            <td>
                                <span class="part-number">{{ part.PN }}</span>
                            </td>
                            <td>
                                <span class="text-color-secondary">{{ part.PNDESC }}</span>
                            </td>
                            <td class="text-center">
                                <span class="stock-badge" [ngClass]="getStockClass(part)">
                                    {{ part.TOTALSTOCK }} {{ part.UNIT }}
                                </span>
                            </td>
                            <td class="text-center">
                                <span class="text-color-secondary">{{ part.minStock || 10 }}</span>
                            </td>
                            <td class="text-center">
                                <p-tag [value]="getStockStatus(part)"
                                       [severity]="getStockStatusSeverity(part)">
                                </p-tag>
                            </td>
                            <td class="text-right">
                                <span class="font-semibold">
                                    {{ (part.TOTALSTOCK * part.PRICE) | currency:'EUR':'symbol':'1.0-0' }}
                                </span>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="6" class="text-center p-4">
                                <i class="pi pi-inbox text-4xl text-color-secondary mb-2"></i>
                                <p>No parts data available</p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>

            <!-- Recent Entries -->
            <p-card styleClass="mt-4">
                <ng-template pTemplate="header">
                    <div class="flex justify-content-between align-items-center p-3">
                        <span class="text-xl font-semibold">
                            <i class="pi pi-history mr-2"></i>Recent Stock Entries
                        </span>
                        <button pButton icon="pi pi-plus" label="New Entry"
                                (click)="newEntry.emit()">
                        </button>
                    </div>
                </ng-template>

                <p-table [value]="recentEntries" [loading]="loading"
                         styleClass="p-datatable-sm">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Date</th>
                            <th>Part Number</th>
                            <th>Batch No</th>
                            <th>Supplier</th>
                            <th class="text-center">Qty</th>
                            <th>Area</th>
                            <th>User</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-entry>
                        <tr>
                            <td>{{ entry.DATEENTRY | date:'dd/MM/yyyy HH:mm' }}</td>
                            <td><span class="part-number">{{ entry.PN }}</span></td>
                            <td>{{ entry.BATCHNO }}</td>
                            <td>{{ entry.SUNO }}</td>
                            <td class="text-center">
                                <span class="qty-badge">+{{ entry.QTY }}</span>
                            </td>
                            <td><p-tag [value]="entry.AREA" severity="info"></p-tag></td>
                            <td>{{ entry.USERID }}</td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="7" class="text-center p-4">
                                <p>No recent entries</p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>
        </div>
    `,
    styles: [`
        .inventory-dashboard {
            padding: 1rem;
        }

        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
            margin-bottom: 0.5rem;
        }

        .kpi-label {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-color-secondary);
        }

        .kpi-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;

            &.bg-blue { background: var(--blue-500); }
            &.bg-green { background: var(--green-500); }
            &.bg-orange { background: var(--orange-500); }
            &.bg-red { background: var(--red-500); }
            &.bg-purple { background: var(--purple-500); }
        }

        .kpi-body {
            display: flex;
            align-items: baseline;
            gap: 0.25rem;
        }

        .kpi-value {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--text-color);
        }

        .kpi-unit {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
        }

        .alert-card {
            border: 1px solid var(--red-200);
            background: var(--red-50);
        }

        .alerts-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .alert-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem;
            background: var(--surface-card);
            border-radius: 8px;
            border-left: 3px solid;

            &.alert-critical { border-left-color: var(--red-500); }
            &.alert-warning { border-left-color: var(--orange-500); }
            &.alert-info { border-left-color: var(--blue-500); }

            .alert-icon {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                background: var(--red-100);
                color: var(--red-600);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .alert-content {
                flex: 1;
                display: flex;
                flex-direction: column;

                .alert-pn {
                    font-weight: 600;
                }
                .alert-message {
                    font-size: 0.875rem;
                    color: var(--text-color-secondary);
                }
            }

            .alert-stock {
                text-align: center;

                .stock-value {
                    display: block;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--red-500);
                }
                .stock-label {
                    font-size: 0.75rem;
                    color: var(--text-color-secondary);
                }
            }
        }

        .main-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;

            @media (max-width: 992px) {
                grid-template-columns: 1fr;
            }
        }

        .chart-container {
            height: 280px;
        }

        .part-number {
            font-family: monospace;
            font-weight: 600;
            color: var(--primary-color);
        }

        .stock-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-weight: 600;

            &.critical {
                background: var(--red-100);
                color: var(--red-700);
            }
            &.low {
                background: var(--orange-100);
                color: var(--orange-700);
            }
            &.normal {
                background: var(--green-100);
                color: var(--green-700);
            }
        }

        .qty-badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: 600;
            background: var(--green-100);
            color: var(--green-700);
        }
    `]
})
export class InventoryDashboardComponent implements OnInit, OnDestroy {
    @Input() autoRefresh = true;
    @Input() refreshInterval = 60000;

    @Output() viewAllAlerts = new EventEmitter<void>();
    @Output() viewAllParts = new EventEmitter<void>();
    @Output() partClicked = new EventEmitter<InventoryItem>();
    @Output() newEntry = new EventEmitter<void>();
    @Output() reorder = new EventEmitter<DashboardStockAlert>();

    private destroy$ = new Subject<void>();

    loading = false;
    kpiCards: InventoryKpi[] = [];
    stockAlerts: DashboardStockAlert[] = [];
    topMovingParts: InventoryItem[] = [];
    recentEntries: any[] = [];

    // Charts
    categoryChartData: any;
    movementChartData: any;

    pieChartOptions = {
        plugins: { legend: { position: 'bottom' } },
        maintainAspectRatio: false
    };

    lineChartOptions = {
        plugins: { legend: { display: true, position: 'bottom' } },
        scales: { y: { beginAtZero: true } },
        maintainAspectRatio: false
    };

    constructor(private inventoryService: DmsInventoryService) {}

    ngOnInit(): void {
        this.loadData();

        if (this.autoRefresh) {
            interval(this.refreshInterval)
                .pipe(takeUntil(this.destroy$))
                .subscribe(() => this.loadData());
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadData(): void {
        this.loading = true;
        this.buildKpiCards();
        this.loadStockAlerts();
        this.loadTopMovingParts();
        this.loadRecentEntries();
        this.buildCharts();
        this.loading = false;
    }

    private buildKpiCards(): void {
        this.kpiCards = [
            {
                label: 'Total SKUs',
                value: '1,247',
                unit: 'parts',
                icon: 'pi pi-box',
                color: 'blue',
                status: 'success'
            },
            {
                label: 'Stock Value',
                value: '2.4M',
                unit: 'EUR',
                icon: 'pi pi-euro',
                color: 'green',
                status: 'success'
            },
            {
                label: 'Low Stock Items',
                value: '23',
                unit: 'alerts',
                icon: 'pi pi-exclamation-triangle',
                color: 'orange',
                status: 23 <= 10 ? 'success' : 23 <= 30 ? 'warning' : 'danger'
            },
            {
                label: 'Out of Stock',
                value: '5',
                unit: 'items',
                icon: 'pi pi-times-circle',
                color: 'red',
                status: 'warning' as const
            },
            {
                label: 'Pending Orders',
                value: '12',
                unit: 'orders',
                icon: 'pi pi-shopping-cart',
                color: 'purple',
                status: 'warning'
            }
        ];
    }

    private loadStockAlerts(): void {
        this.stockAlerts = [
            { partNumber: 'PN-001-A', message: 'Stock below minimum level', currentStock: 5, minStock: 20, type: 'low_stock', severity: 'critical' },
            { partNumber: 'PN-002-B', message: 'Out of stock - Production impact', currentStock: 0, minStock: 15, type: 'out_of_stock', severity: 'critical' },
            { partNumber: 'PN-003-C', message: 'Approaching minimum level', currentStock: 18, minStock: 15, type: 'low_stock', severity: 'warning' },
            { partNumber: 'PN-004-D', message: 'Stock below minimum level', currentStock: 8, minStock: 25, type: 'low_stock', severity: 'critical' }
        ];
    }

    private loadTopMovingParts(): void {
        this.topMovingParts = [
            { PN: 'PN-001-A', PNDESC: 'Bearing Assembly 25mm', UNIT: 'pcs', TOTALSTOCK: 5, PRICE: 45.50, minStock: 20 },
            { PN: 'PN-002-B', PNDESC: 'Hydraulic Seal Kit', UNIT: 'set', TOTALSTOCK: 0, PRICE: 125.00, minStock: 15 },
            { PN: 'PN-003-C', PNDESC: 'Motor Coupling', UNIT: 'pcs', TOTALSTOCK: 18, PRICE: 89.00, minStock: 15 },
            { PN: 'PN-004-D', PNDESC: 'Control Board PCB', UNIT: 'pcs', TOTALSTOCK: 8, PRICE: 320.00, minStock: 25 },
            { PN: 'PN-005-E', PNDESC: 'Pneumatic Cylinder', UNIT: 'pcs', TOTALSTOCK: 45, PRICE: 185.00, minStock: 10 }
        ] as any[];
    }

    private loadRecentEntries(): void {
        this.recentEntries = [
            { DATEENTRY: new Date(), PN: 'PN-005-E', BATCHNO: 'B2025-001', SUNO: 'SUP-A', QTY: 50, AREA: 'Warehouse A', USERID: 'john.smith' },
            { DATEENTRY: new Date(Date.now() - 3600000), PN: 'PN-003-C', BATCHNO: 'B2025-002', SUNO: 'SUP-B', QTY: 100, AREA: 'Warehouse B', USERID: 'sarah.wilson' },
            { DATEENTRY: new Date(Date.now() - 7200000), PN: 'PN-001-A', BATCHNO: 'B2025-003', SUNO: 'SUP-A', QTY: 25, AREA: 'Warehouse A', USERID: 'mike.johnson' }
        ];
    }

    private buildCharts(): void {
        // Stock by category
        this.categoryChartData = {
            labels: ['Mechanical', 'Electrical', 'Electronics', 'Consumables', 'Safety'],
            datasets: [{
                data: [850000, 650000, 420000, 280000, 200000],
                backgroundColor: ['#3B82F6', '#F59E0B', '#8B5CF6', '#10B981', '#EF4444']
            }]
        };

        // Stock movement
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        this.movementChartData = {
            labels: days,
            datasets: [
                {
                    label: 'Incoming',
                    data: [150, 120, 180, 90, 200, 50, 30],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Outgoing',
                    data: [120, 140, 160, 130, 170, 40, 20],
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        };
    }

    onPartClick(part: InventoryItem): void {
        this.partClicked.emit(part);
    }

    reorderPart(alert: DashboardStockAlert): void {
        this.reorder.emit(alert);
    }

    getAlertIcon(type: string): string {
        const icons: Record<string, string> = {
            'low_stock': 'pi pi-arrow-down',
            'out_of_stock': 'pi pi-times',
            'expiring': 'pi pi-clock'
        };
        return icons[type] || 'pi pi-exclamation-triangle';
    }

    getStockClass(part: any): string {
        const ratio = part.TOTALSTOCK / (part.minStock || 10);
        if (ratio === 0) return 'critical';
        if (ratio < 1) return 'low';
        return 'normal';
    }

    getStockStatus(part: any): string {
        const ratio = part.TOTALSTOCK / (part.minStock || 10);
        if (ratio === 0) return 'Out of Stock';
        if (ratio < 1) return 'Low Stock';
        return 'In Stock';
    }

    getStockStatusSeverity(part: any): 'success' | 'warn' | 'danger' {
        const ratio = part.TOTALSTOCK / (part.minStock || 10);
        if (ratio === 0) return 'danger';
        if (ratio < 1) return 'warn';
        return 'success';
    }
}
