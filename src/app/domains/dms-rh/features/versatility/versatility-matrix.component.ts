/**
 * Versatility Matrix Component
 * Domain: DMS-RH
 *
 * Displays and manages the employee versatility/qualification matrix
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
        ProgressSpinnerModule
    ],
    template: `
        <div class="versatility-matrix">
            <!-- Toolbar -->
            <p-toolbar styleClass="mb-3 surface-ground border-round">
                <ng-template #start>
                    <span class="text-xl font-semibold">Versatility Matrix</span>
                </ng-template>
                <ng-template #center>
                    <p-select [options]="productionLines"
                              [(ngModel)]="selectedProductionLine"
                              (onChange)="loadMatrix()"
                              placeholder="Select Production Line"
                              optionLabel="name"
                              optionValue="id"
                              styleClass="mr-2"
                              [style]="{'min-width': '200px'}">
                    </p-select>
                    <p-select [options]="processes"
                              [(ngModel)]="selectedProcess"
                              (onChange)="loadMatrix()"
                              placeholder="Select Process"
                              optionLabel="name"
                              optionValue="id"
                              [showClear]="true"
                              [style]="{'min-width': '200px'}">
                    </p-select>
                </ng-template>
                <ng-template #end>
                    <button pButton icon="pi pi-download" label="Export"
                            class="p-button-secondary" (click)="onExport()">
                    </button>
                </ng-template>
            </p-toolbar>

            <!-- Legend -->
            <p-card styleClass="mb-3">
                <div class="legend">
                    <span class="legend-title">Qualification Levels:</span>
                    <div class="legend-items">
                        <div *ngFor="let level of qualificationLevels" class="legend-item">
                            <span class="level-badge" [style.background]="getLevelColor(level.value)">
                                {{ level.value }}
                            </span>
                            <span class="level-label">{{ level.label }}</span>
                        </div>
                    </div>
                </div>
            </p-card>

            <!-- Loading State -->
            <div *ngIf="loading" class="matrix-loading">
                <div class="loading-overlay">
                    <p-progressSpinner strokeWidth="4" animationDuration=".5s"></p-progressSpinner>
                    <span class="loading-text">Loading Versatility Matrix...</span>
                </div>
            </div>

            <!-- Matrix Table -->
            <div *ngIf="!loading && matrix" class="matrix-container">
                <p-table [value]="matrix.employees"
                         [scrollable]="true"
                         scrollHeight="500px"
                         [frozenColumns]="frozenCols"
                         styleClass="p-datatable-sm p-datatable-gridlines matrix-table">

                    <ng-template pTemplate="header">
                        <tr>
                            <th class="frozen-col employee-header" style="width: 200px; min-width: 200px">
                                Employee
                            </th>
                            <th *ngFor="let ws of uniqueWorkstations"
                                class="workstation-header"
                                [pTooltip]="ws.desc_workstation"
                                style="width: 80px; min-width: 80px; text-align: center">
                                {{ ws.desc_workstation | slice:0:10 }}
                            </th>
                            <th style="width: 100px; text-align: center">Average</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-employee>
                        <tr>
                            <td class="frozen-col employee-cell">
                                <div class="employee-info">
                                    <p-avatar [label]="getInitials(employee)"
                                              shape="circle"
                                              size="normal">
                                    </p-avatar>
                                    <div class="employee-name">
                                        <span class="name">{{ employee.Nom_Emp }} {{ employee.Prenom_Emp }}</span>
                                        <span class="id">ID: {{ employee.Id_Emp }}</span>
                                    </div>
                                </div>
                            </td>
                            <td *ngFor="let ws of uniqueWorkstations"
                                class="level-cell"
                                (click)="onCellClick(employee, ws)"
                                [pTooltip]="getCellTooltip(employee, ws)">
                                <span class="level-badge"
                                      [style.background]="getCellColor(employee, ws)"
                                      [class.editable]="editable">
                                    {{ getCellLevel(employee, ws) }}
                                </span>
                            </td>
                            <td class="average-cell">
                                <span class="average-value">{{ getEmployeeAverage(employee) | number:'1.1-1' }}</span>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="footer">
                        <tr>
                            <td class="frozen-col font-bold">Workstation Average</td>
                            <td *ngFor="let ws of uniqueWorkstations" class="text-center font-bold">
                                {{ getWorkstationAverage(ws) | number:'1.1-1' }}
                            </td>
                            <td class="text-center font-bold">
                                {{ getGlobalAverage() | number:'1.1-1' }}
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>

            <!-- Empty State -->
            <div *ngIf="!loading && !matrix" class="empty-state">
                <i class="pi pi-th-large text-6xl text-color-secondary mb-3"></i>
                <h3>Select a production line</h3>
                <p class="text-color-secondary">Choose a production line to view the versatility matrix</p>
            </div>
        </div>
    `,
    styles: [`
        .versatility-matrix {
            padding: 1rem;
        }

        .legend {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .legend-title {
            font-weight: 600;
            color: var(--text-color);
        }

        .legend-items {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .level-badge {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 0.875rem;

            &.editable {
                cursor: pointer;
                transition: transform 0.15s;

                &:hover {
                    transform: scale(1.1);
                }
            }
        }

        .level-label {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
        }

        .matrix-container {
            overflow-x: auto;
        }

        .matrix-table {
            min-width: 100%;
        }

        .frozen-col {
            background: var(--surface-card) !important;
            z-index: 1;
        }

        .employee-header {
            font-weight: 600;
        }

        .workstation-header {
            font-size: 0.75rem;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            transform: rotate(180deg);
            height: 100px;
            padding: 0.5rem 0.25rem !important;
        }

        .employee-cell {
            padding: 0.5rem !important;
        }

        .employee-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .employee-name {
            display: flex;
            flex-direction: column;

            .name {
                font-weight: 500;
                font-size: 0.875rem;
            }

            .id {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
            }
        }

        .level-cell {
            text-align: center;
            padding: 0.5rem !important;
            cursor: pointer;

            &:hover {
                background: var(--surface-hover);
            }
        }

        .average-cell {
            text-align: center;
        }

        .average-value {
            font-weight: 600;
            color: var(--primary-color);
        }

        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
        }

        .matrix-loading {
            padding: 2rem;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
        }

        .loading-overlay {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
        }

        .loading-text {
            font-size: 1.1rem;
            color: var(--text-color-secondary);
            font-weight: 500;
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
    frozenCols = [{ field: 'employee', header: 'Employee' }];

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
            const name = ws.desc_workstation?.toLowerCase().trim() || '';
            if (seen.has(name)) {
                return false;
            }
            seen.add(name);
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
        const cell = this.getCell(employee.Id_Emp, workstation.id_workstation);
        return cell?.level ?? 0;
    }

    getCellColor(employee: Employee, workstation: HRWorkstation): string {
        const level = this.getCellLevel(employee, workstation) as QualificationLevel;
        return QualificationLevelColors[level] || QualificationLevelColors[0];
    }

    getLevelColor(level: QualificationLevel): string {
        return QualificationLevelColors[level];
    }

    getCellTooltip(employee: Employee, workstation: HRWorkstation): string {
        const level = this.getCellLevel(employee, workstation) as QualificationLevel;
        return `${employee.Nom_Emp} ${employee.Prenom_Emp} - ${workstation.desc_workstation}: ${QualificationLevelLabels[level]}`;
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

    onCellClick(employee: Employee, workstation: HRWorkstation): void {
        if (!this.editable) return;

        const currentLevel = this.getCellLevel(employee, workstation) as QualificationLevel;
        this.cellClicked.emit({ employee, workstation, currentLevel });
    }

    onExport(): void {
        this.export.emit();
    }
}
