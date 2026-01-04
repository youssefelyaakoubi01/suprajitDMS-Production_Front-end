/**
 * Versatility Matrix Component
 * Domain: DMS-RH
 *
 * Displays and manages the employee versatility/qualification matrix with modern styling
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { BadgeModule } from 'primeng/badge';

// Domain imports
import {
    DmsQualificationService,
    VersatilityMatrix,
    VersatilityCell,
    QualificationLevel,
    QualificationLevelLabels,
    QualificationLevelColors,
    Employee,
    HRWorkstation
} from '@domains/dms-rh';

@Component({
    selector: 'app-versatility-matrix',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        ButtonModule,
        SelectModule,
        ToolbarModule,
        TooltipModule,
        SkeletonModule,
        TagModule,
        AvatarModule,
        ProgressSpinnerModule,
        RippleModule,
        BadgeModule
    ],
    template: `
        <div class="versatility-matrix">
            <!-- Page Header -->
            <div class="hr-page-header">
                <div class="header-title">
                    <div class="header-icon" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
                        <i class="pi pi-th-large"></i>
                    </div>
                    <div class="title-text">
                        <h1>Versatility Matrix</h1>
                        <span class="subtitle">Employee skill and qualification overview</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button pButton pRipple
                            icon="pi pi-download"
                            label="Export"
                            class="p-button-outlined"
                            (click)="onExport()">
                    </button>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="stats-row" *ngIf="matrix">
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: var(--hr-primary);">
                        <i class="pi pi-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ matrix.employees.length || 0 }}</div>
                        <div class="stat-label">Employees</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--hr-info);">
                        <i class="pi pi-cog"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-info">{{ uniqueWorkstations.length }}</div>
                        <div class="stat-label">Workstations</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--hr-success);">
                        <i class="pi pi-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-success">{{ getGlobalAverage() | number:'1.1-1' }}</div>
                        <div class="stat-label">Avg. Level</div>
                    </div>
                </div>
            </div>

            <!-- Filter Section -->
            <div class="hr-section-card">
                <div class="section-header">
                    <span class="section-title">
                        <i class="pi pi-filter"></i>
                        Filters
                    </span>
                </div>
                <div class="section-body">
                    <div class="filter-row">
                        <div class="filter-item">
                            <label>Production Line</label>
                            <p-select [options]="productionLines"
                                      [(ngModel)]="selectedProductionLine"
                                      (onChange)="loadMatrix()"
                                      placeholder="Select Production Line"
                                      optionLabel="name"
                                      optionValue="id"
                                      styleClass="w-full">
                            </p-select>
                        </div>
                        <div class="filter-item">
                            <label>Process</label>
                            <p-select [options]="processes"
                                      [(ngModel)]="selectedProcess"
                                      (onChange)="loadMatrix()"
                                      placeholder="All Processes"
                                      optionLabel="name"
                                      optionValue="id"
                                      [showClear]="true"
                                      styleClass="w-full">
                            </p-select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Legend Card -->
            <div class="hr-legend">
                <span class="legend-title">Qualification Levels:</span>
                <div class="legend-items">
                    <div *ngFor="let level of qualificationLevels" class="legend-item">
                        <span class="legend-badge hr-qual-badge" [ngClass]="'level-' + level.value">
                            {{ level.value }}
                        </span>
                        <span class="legend-label">{{ level.label }}</span>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="loading" class="hr-loading">
                <p-progressSpinner strokeWidth="4" animationDuration=".5s"></p-progressSpinner>
                <span class="loading-text">Loading Versatility Matrix...</span>
            </div>

            <!-- Matrix Table -->
            <div class="hr-section-card" *ngIf="!loading && matrix">
                <div class="section-header">
                    <span class="section-title">
                        <i class="pi pi-table"></i>
                        Qualification Matrix
                    </span>
                    <p-badge [value]="(matrix.employees.length || 0) + ' x ' + uniqueWorkstations.length" severity="info"></p-badge>
                </div>
                <div class="section-body p-0">
                    <div class="matrix-container">
                        <p-table [value]="matrix.employees"
                                 [scrollable]="true"
                                 scrollHeight="500px"
                                 styleClass="hr-table matrix-table">

                            <ng-template pTemplate="header">
                                <tr>
                                    <th class="frozen-col employee-header">
                                        Employee
                                    </th>
                                    <th *ngFor="let ws of uniqueWorkstations"
                                        class="workstation-header"
                                        [pTooltip]="ws.name">
                                        <span class="ws-label">{{ ws.name | slice:0:10 }}</span>
                                    </th>
                                    <th class="average-header">Avg</th>
                                </tr>
                            </ng-template>

                            <ng-template pTemplate="body" let-employee>
                                <tr>
                                    <td class="frozen-col employee-cell">
                                        <div class="hr-employee-info">
                                            <div class="hr-avatar-badge">
                                                <p-avatar [label]="getInitials(employee)"
                                                          shape="circle"
                                                          size="normal"
                                                          [style]="{'background': 'var(--hr-gradient)', 'color': 'white'}">
                                                </p-avatar>
                                            </div>
                                            <div class="employee-details">
                                                <span class="employee-name">{{ employee.Nom_Emp }} {{ employee.Prenom_Emp }}</span>
                                                <span class="employee-meta">ID: {{ employee.Id_Emp }}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td *ngFor="let ws of uniqueWorkstations"
                                        class="level-cell"
                                        (click)="onCellClick(employee, ws)"
                                        pRipple>
                                        <span class="hr-qual-badge"
                                              [ngClass]="'level-' + getCellLevel(employee, ws)"
                                              [class.editable]="editable"
                                              [pTooltip]="getCellTooltip(employee, ws)">
                                            {{ getCellLevel(employee, ws) }}
                                        </span>
                                    </td>
                                    <td class="average-cell">
                                        <span class="average-value" [ngClass]="getAverageClass(getEmployeeAverage(employee))">
                                            {{ getEmployeeAverage(employee) | number:'1.1-1' }}
                                        </span>
                                    </td>
                                </tr>
                            </ng-template>

                            <ng-template pTemplate="footer">
                                <tr class="footer-row">
                                    <td class="frozen-col font-bold">Workstation Average</td>
                                    <td *ngFor="let ws of uniqueWorkstations" class="text-center">
                                        <span class="footer-average">{{ getWorkstationAverage(ws) | number:'1.1-1' }}</span>
                                    </td>
                                    <td class="text-center">
                                        <span class="global-average">{{ getGlobalAverage() | number:'1.1-1' }}</span>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="!loading && !matrix" class="hr-empty-state">
                <i class="empty-icon pi pi-th-large"></i>
                <h3>Select a production line</h3>
                <p>Choose a production line to view the versatility matrix</p>
            </div>
        </div>
    `,
    styles: [`
        .versatility-matrix {
            padding: 1.5rem;
        }

        /* Stats Row */
        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        /* Filter Row */
        .filter-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
        }

        .filter-item {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;

            label {
                font-weight: 600;
                font-size: 0.875rem;
                color: var(--text-color);
            }
        }

        /* Matrix Container */
        .matrix-container {
            overflow-x: auto;
        }

        /* Table Styles */
        .matrix-table {
            min-width: 100%;

            .frozen-col {
                position: sticky;
                left: 0;
                background: var(--surface-card) !important;
                z-index: 2;
                min-width: 220px;
            }

            .employee-header {
                font-weight: 600;
                width: 220px;
            }

            .workstation-header {
                width: 70px;
                min-width: 70px;
                text-align: center;
                padding: 0.5rem 0.25rem !important;
                vertical-align: bottom;

                .ws-label {
                    display: block;
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                    transform: rotate(180deg);
                    font-size: 0.75rem;
                    font-weight: 500;
                    max-height: 100px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            }

            .average-header {
                width: 80px;
                text-align: center;
                font-weight: 600;
            }

            .employee-cell {
                padding: 0.75rem !important;
            }

            .level-cell {
                text-align: center;
                padding: 0.5rem !important;
                cursor: pointer;
                transition: background-color 0.2s ease;

                &:hover {
                    background: var(--surface-hover);
                }
            }

            .average-cell {
                text-align: center;
                padding: 0.75rem !important;
            }

            .average-value {
                font-weight: 700;
                font-size: 0.9375rem;
                padding: 0.25rem 0.5rem;
                border-radius: 6px;

                &.level-low {
                    color: var(--qual-level-0);
                    background: rgba(156, 163, 175, 0.1);
                }

                &.level-medium {
                    color: var(--qual-level-2);
                    background: rgba(59, 130, 246, 0.1);
                }

                &.level-high {
                    color: var(--qual-level-3);
                    background: rgba(16, 185, 129, 0.1);
                }

                &.level-expert {
                    color: var(--qual-level-4);
                    background: rgba(139, 92, 246, 0.1);
                }
            }

            .footer-row {
                background: var(--surface-50);

                td {
                    border-top: 2px solid var(--surface-border);
                }
            }

            .footer-average {
                font-weight: 600;
                color: var(--text-color);
            }

            .global-average {
                font-weight: 700;
                font-size: 1rem;
                color: var(--hr-primary);
            }
        }

        /* Editable Badge */
        :host ::ng-deep .hr-qual-badge.editable {
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease;

            &:hover {
                transform: scale(1.15);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            }
        }

        /* Table Customization */
        :host ::ng-deep {
            .p-datatable .p-datatable-thead > tr > th {
                background: var(--surface-50);
                padding: 1rem 0.5rem;
            }

            .p-datatable .p-datatable-tbody > tr > td {
                padding: 0.5rem;
            }

            .p-datatable .p-datatable-tfoot > tr > td {
                padding: 0.75rem 0.5rem;
            }
        }
    `]
})
export class VersatilityMatrixComponent implements OnInit, OnDestroy {
    @Input() matrix: VersatilityMatrix | null = null;
    @Input() productionLines: any[] = [];
    @Input() processes: any[] = [];
    @Input() editable = true;
    @Input() loading = false;

    @Output() cellClicked = new EventEmitter<{ employee: Employee; workstation: HRWorkstation; currentLevel: QualificationLevel }>();
    @Output() export = new EventEmitter<void>();

    private destroy$ = new Subject<void>();

    selectedProductionLine: number | null = null;
    selectedProcess: number | null = null;

    qualificationLevels = [
        { value: 0 as QualificationLevel, label: QualificationLevelLabels[0] },
        { value: 1 as QualificationLevel, label: QualificationLevelLabels[1] },
        { value: 2 as QualificationLevel, label: QualificationLevelLabels[2] },
        { value: 3 as QualificationLevel, label: QualificationLevelLabels[3] },
        { value: 4 as QualificationLevel, label: QualificationLevelLabels[4] }
    ];

    private cellMap: Map<string, VersatilityCell> = new Map();

    get uniqueWorkstations(): HRWorkstation[] {
        if (!this.matrix) return [];
        const seen = new Set<string>();
        return this.matrix.workstations.filter(ws => {
            const wsName = ws.name?.toLowerCase().trim() || '';
            if (seen.has(wsName)) {
                return false;
            }
            seen.add(wsName);
            return true;
        });
    }

    constructor(private qualificationService: DmsQualificationService) {}

    ngOnInit(): void {
        if (this.matrix) {
            this.buildCellMap();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadMatrix(): void {
        if (!this.selectedProductionLine) return;

        this.loading = true;
        this.qualificationService.getVersatilityMatrix({
            productionLineId: this.selectedProductionLine,
            processId: this.selectedProcess || undefined
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: (matrix) => {
                this.matrix = matrix;
                this.buildCellMap();
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    private buildCellMap(): void {
        this.cellMap.clear();
        if (!this.matrix) return;

        this.matrix.cells.forEach(cell => {
            const key = `${cell.employeeId}-${cell.workstationId}`;
            this.cellMap.set(key, cell);
        });
    }

    getCell(employeeId: number, workstationId: number): VersatilityCell | undefined {
        return this.cellMap.get(`${employeeId}-${workstationId}`);
    }

    getCellLevel(employee: Employee, workstation: HRWorkstation): number {
        const cell = this.getCell(employee.Id_Emp, workstation.id);
        return cell?.level ?? 0;
    }

    getCellTooltip(employee: Employee, workstation: HRWorkstation): string {
        const level = this.getCellLevel(employee, workstation) as QualificationLevel;
        return `${employee.Nom_Emp} ${employee.Prenom_Emp} - ${workstation.name}: ${QualificationLevelLabels[level]}`;
    }

    getInitials(employee: Employee): string {
        const first = employee.Prenom_Emp?.charAt(0) || '';
        const last = employee.Nom_Emp?.charAt(0) || '';
        return (first + last).toUpperCase();
    }

    getEmployeeAverage(employee: Employee): number {
        if (!this.matrix) return 0;

        let total = 0;
        let count = 0;

        this.uniqueWorkstations.forEach(ws => {
            const level = this.getCellLevel(employee, ws);
            total += level;
            count++;
        });

        return count > 0 ? total / count : 0;
    }

    getWorkstationAverage(workstation: HRWorkstation): number {
        if (!this.matrix) return 0;

        let total = 0;
        let count = 0;

        this.matrix.employees.forEach(emp => {
            const level = this.getCellLevel(emp, workstation);
            total += level;
            count++;
        });

        return count > 0 ? total / count : 0;
    }

    getGlobalAverage(): number {
        if (!this.matrix) return 0;

        let total = 0;
        let count = 0;

        this.matrix.employees.forEach(emp => {
            this.uniqueWorkstations.forEach(ws => {
                total += this.getCellLevel(emp, ws);
                count++;
            });
        });

        return count > 0 ? total / count : 0;
    }

    getAverageClass(average: number): string {
        if (average < 1) return 'level-low';
        if (average < 2) return 'level-medium';
        if (average < 3) return 'level-high';
        return 'level-expert';
    }

    onCellClick(employee: Employee, workstation: HRWorkstation): void {
        if (!this.editable) return;

        const currentLevel = this.getCellLevel(employee, workstation) as QualificationLevel;
        this.cellClicked.emit({ employee, workstation, currentLevel });
    }

    onExport(): void {
        this.export.emit();
    }
}
