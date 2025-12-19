/**
 * Production Tracking Component
 * Domain: DMS-Production
 *
 * Tracks hourly production output, team assignments, and shift management
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TextareaModule } from 'primeng/textarea';

// Domain imports
import {
    DmsProductionService,
    HourlyProduction,
    ProductionLine,
    Part,
    Project
} from '@domains/dms-production';

interface ShiftOption {
    label: string;
    value: string;
}

interface HourOption {
    label: string;
    value: number;
}

@Component({
    selector: 'app-production-tracking',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CardModule,
        TableModule,
        ButtonModule,
        SelectModule,
        DatePickerModule,
        InputNumberModule,
        InputTextModule,
        TagModule,
        TooltipModule,
        DialogModule,
        ProgressBarModule,
        TextareaModule
    ],
    template: `
        <div class="production-tracking">
            <!-- Shift Selection Form -->
            <p-card styleClass="mb-4">
                <ng-template pTemplate="header">
                    <div class="flex justify-content-between align-items-center p-3">
                        <span class="text-xl font-semibold">
                            <i class="pi pi-calendar mr-2"></i>Shift Configuration
                        </span>
                    </div>
                </ng-template>

                <form [formGroup]="shiftForm" class="grid p-fluid">
                    <div class="col-12 md:col-4 lg:col-2">
                        <label class="block mb-2 font-medium">Shift</label>
                        <p-select [options]="shifts" formControlName="shift"
                                  placeholder="Select Shift" styleClass="w-full">
                        </p-select>
                    </div>
                    <div class="col-12 md:col-4 lg:col-2">
                        <label class="block mb-2 font-medium">Date</label>
                        <p-datepicker formControlName="date" [showIcon]="true"
                                      dateFormat="dd/mm/yy" styleClass="w-full">
                        </p-datepicker>
                    </div>
                    <div class="col-12 md:col-4 lg:col-2">
                        <label class="block mb-2 font-medium">Project</label>
                        <p-select [options]="projects" formControlName="projectId"
                                  optionLabel="name" optionValue="id"
                                  placeholder="Select Project" styleClass="w-full"
                                  (onChange)="onProjectChange()">
                        </p-select>
                    </div>
                    <div class="col-12 md:col-4 lg:col-2">
                        <label class="block mb-2 font-medium">Production Line</label>
                        <p-select [options]="productionLines" formControlName="productionLineId"
                                  optionLabel="name" optionValue="id"
                                  placeholder="Select Line" styleClass="w-full"
                                  (onChange)="onLineChange()">
                        </p-select>
                    </div>
                    <div class="col-12 md:col-4 lg:col-2">
                        <label class="block mb-2 font-medium">Part Number</label>
                        <p-select [options]="parts" formControlName="partId"
                                  optionLabel="PN_Part" optionValue="Id_Part"
                                  placeholder="Select Part" styleClass="w-full"
                                  [filter]="true" filterBy="PN_Part"
                                  (onChange)="onPartChange()">
                        </p-select>
                    </div>
                    <div class="col-12 md:col-4 lg:col-2">
                        <label class="block mb-2 font-medium">Hour</label>
                        <p-select [options]="hours" formControlName="hour"
                                  placeholder="Select Hour" styleClass="w-full">
                        </p-select>
                    </div>
                </form>
            </p-card>

            <!-- Output Metrics -->
            <div class="metrics-grid mb-4">
                <div class="metric-card output-card">
                    <div class="metric-header">
                        <span class="metric-label">Output</span>
                        <i class="pi pi-box metric-icon"></i>
                    </div>
                    <div class="metric-body">
                        <p-inputNumber [(ngModel)]="currentOutput" [showButtons]="true"
                                       [min]="0" [max]="9999" styleClass="metric-input"
                                       (onInput)="calculateEfficiency()">
                        </p-inputNumber>
                    </div>
                </div>

                <div class="metric-card target-card">
                    <div class="metric-header">
                        <span class="metric-label">Target</span>
                        <i class="pi pi-bullseye metric-icon"></i>
                    </div>
                    <div class="metric-body">
                        <span class="metric-value">{{ currentTarget }}</span>
                        <span class="metric-unit">pcs/h</span>
                    </div>
                </div>

                <div class="metric-card efficiency-card" [ngClass]="getEfficiencyClass()">
                    <div class="metric-header">
                        <span class="metric-label">Efficiency</span>
                        <i class="pi pi-percentage metric-icon"></i>
                    </div>
                    <div class="metric-body">
                        <span class="metric-value">{{ currentEfficiency }}</span>
                        <span class="metric-unit">%</span>
                    </div>
                    <p-progressBar [value]="currentEfficiency" [showValue]="false"
                                   styleClass="h-1 mt-2"></p-progressBar>
                </div>

                <div class="metric-card downtime-card">
                    <div class="metric-header">
                        <span class="metric-label">Downtime (min)</span>
                        <i class="pi pi-clock metric-icon"></i>
                    </div>
                    <div class="metric-body">
                        <p-inputNumber [(ngModel)]="currentDowntime" [showButtons]="true"
                                       [min]="0" [max]="60" styleClass="metric-input-sm">
                        </p-inputNumber>
                    </div>
                </div>
            </div>

            <!-- Downtime Details (shown when downtime > 0) -->
            <div class="downtime-details-card mb-4" *ngIf="currentDowntime > 0">
                <p-card styleClass="border-left-warning">
                    <div class="grid p-fluid">
                        <div class="col-12 md:col-6">
                            <label class="block mb-2 font-medium">Problem Type</label>
                            <p-select [options]="downtimeProblems" [(ngModel)]="selectedProblem"
                                      optionLabel="Name_DowntimeProblems" optionValue="Id_DowntimeProblems"
                                      placeholder="Select Problem Type" styleClass="w-full">
                            </p-select>
                        </div>
                        <div class="col-12 md:col-6">
                            <label class="block mb-2 font-medium">Comment (optional)</label>
                            <input pInputText [(ngModel)]="downtimeComment" placeholder="Describe the issue..." class="w-full">
                        </div>
                    </div>
                </p-card>
            </div>

            <!-- Save Button -->
            <div class="save-button-container mb-4">
                <button pButton label="Save Production Data" icon="pi pi-save"
                        class="p-button-success p-button-lg"
                        [disabled]="!shiftForm.valid || currentOutput === 0 || (currentDowntime > 0 && !selectedProblem)"
                        (click)="saveOutput()">
                </button>
                <span class="save-hint" *ngIf="currentDowntime > 0 && !selectedProblem">
                    <i class="pi pi-info-circle mr-1"></i>Please select a problem type for downtime
                </span>
            </div>

            <!-- Hourly Production Table -->
            <p-card>
                <ng-template pTemplate="header">
                    <div class="flex justify-content-between align-items-center p-3">
                        <span class="text-xl font-semibold">
                            <i class="pi pi-clock mr-2"></i>Hourly Production
                        </span>
                        <div class="flex gap-2">
                            <button pButton icon="pi pi-refresh" class="p-button-text"
                                    (click)="loadHourlyData()" [loading]="loading"
                                    pTooltip="Refresh">
                            </button>
                            <button pButton icon="pi pi-file-excel" class="p-button-text"
                                    pTooltip="Export" (click)="exportData()">
                            </button>
                        </div>
                    </div>
                </ng-template>

                <p-table [value]="hourlyProductions" [loading]="loading"
                         [rowHover]="true" styleClass="p-datatable-sm">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Hour</th>
                            <th>Part Number</th>
                            <th class="text-center">Output</th>
                            <th class="text-center">Target</th>
                            <th class="text-center">Efficiency</th>
                            <th class="text-center">Downtime</th>
                            <th class="text-center">HC</th>
                            <th class="text-center">Status</th>
                            <th>Actions</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-prod>
                        <tr>
                            <td>
                                <span class="font-semibold">{{ formatHour(prod.Hour_HourlyProd) }}</span>
                            </td>
                            <td>
                                <span class="text-color-secondary">{{ prod.partNumber || '-' }}</span>
                            </td>
                            <td class="text-center">
                                <span class="text-xl font-bold">{{ prod.Result_HourlyProdPN }}</span>
                            </td>
                            <td class="text-center">
                                <span class="text-color-secondary">{{ prod.Target_HourlyProdPN }}</span>
                            </td>
                            <td class="text-center">
                                <span class="efficiency-badge"
                                      [ngClass]="getEfficiencyBadgeClass(prod.efficiency)">
                                    {{ prod.efficiency || 0 }}%
                                </span>
                            </td>
                            <td class="text-center">
                                <span class="downtime-badge" *ngIf="getTotalDowntimeForProd(prod) > 0"
                                      [ngClass]="{'has-downtime': getTotalDowntimeForProd(prod) > 0}">
                                    {{ getTotalDowntimeForProd(prod) }} min
                                </span>
                                <span *ngIf="getTotalDowntimeForProd(prod) === 0" class="text-color-secondary">--</span>
                            </td>
                            <td class="text-center">
                                <p-tag [value]="prod.HC_HourlyProdPN?.toString() || '0'"
                                       severity="info">
                                </p-tag>
                            </td>
                            <td class="text-center">
                                <p-tag [value]="getProductionStatus(prod)"
                                       [severity]="getProductionStatusSeverity(prod)">
                                </p-tag>
                            </td>
                            <td>
                                <button pButton icon="pi pi-pencil"
                                        class="p-button-text p-button-sm"
                                        (click)="editProduction(prod)" pTooltip="Edit">
                                </button>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="9" class="text-center p-4">
                                <i class="pi pi-inbox text-4xl text-color-secondary mb-2"></i>
                                <p>No hourly production data</p>
                                <p class="text-sm text-color-secondary">
                                    Select shift configuration and start tracking
                                </p>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="summary">
                        <div class="summary-row">
                            <span class="font-semibold">Shift Totals:</span>
                            <span>Output: <strong>{{ getTotalOutput() }}</strong></span>
                            <span>Target: <strong>{{ getTotalTarget() }}</strong></span>
                            <span>Efficiency: <strong>{{ getShiftEfficiency() }}%</strong></span>
                            <span>Downtime: <strong>{{ getTotalShiftDowntime() }} min</strong></span>
                        </div>
                    </ng-template>
                </p-table>
            </p-card>
        </div>
    `,
    styles: [`
        .production-tracking {
            padding: 1rem;
        }

        .metrics-grid {
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

        .metric-card {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: all 0.2s;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            }
        }

        .metric-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }

        .metric-label {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-color-secondary);
        }

        .metric-icon {
            font-size: 1.5rem;
            color: var(--primary-color);
        }

        .metric-body {
            display: flex;
            align-items: baseline;
            gap: 0.25rem;
        }

        .metric-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--text-color);
        }

        .metric-unit {
            font-size: 1rem;
            color: var(--text-color-secondary);
        }

        .output-card {
            border-left: 4px solid var(--blue-500);
        }

        .target-card {
            border-left: 4px solid var(--purple-500);
        }

        .efficiency-card {
            border-left: 4px solid var(--green-500);

            &.low { border-left-color: var(--red-500); }
            &.medium { border-left-color: var(--orange-500); }
            &.high { border-left-color: var(--green-500); }
        }

        .action-card {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem;
        }

        :host ::ng-deep .metric-input .p-inputnumber-input {
            font-size: 2rem;
            font-weight: 700;
            text-align: center;
        }

        .efficiency-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-weight: 600;

            &.high {
                background: var(--green-100);
                color: var(--green-700);
            }
            &.medium {
                background: var(--orange-100);
                color: var(--orange-700);
            }
            &.low {
                background: var(--red-100);
                color: var(--red-700);
            }
        }

        .summary-row {
            display: flex;
            gap: 2rem;
            padding: 0.5rem 0;
            font-size: 0.875rem;
        }

        .existing-downtimes-list {
            background: var(--surface-50);
            border-radius: 8px;
            padding: 0.5rem;
            max-height: 200px;
            overflow-y: auto;
        }

        .downtime-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0.75rem;
            background: var(--surface-card);
            border-radius: 6px;
            margin-bottom: 0.5rem;
            border-left: 3px solid var(--orange-500);

            &:last-child {
                margin-bottom: 0;
            }
        }

        .downtime-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .downtime-duration {
            font-weight: 700;
            font-size: 1rem;
            color: var(--orange-600);
        }

        .downtime-problem {
            font-size: 0.875rem;
            color: var(--text-color);
        }

        .downtime-comment {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            font-style: italic;
        }

        .downtime-actions {
            display: flex;
            gap: 0.25rem;
        }

        .downtime-card {
            border-left: 4px solid var(--orange-500);
        }

        :host ::ng-deep .metric-input-sm .p-inputnumber-input {
            font-size: 1.5rem;
            font-weight: 700;
            text-align: center;
        }

        .downtime-details-card {
            animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        :host ::ng-deep .border-left-warning {
            border-left: 4px solid var(--orange-500) !important;
        }

        .save-button-container {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .save-hint {
            color: var(--orange-600);
            font-size: 0.875rem;
        }

        .downtime-badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.875rem;

            &.has-downtime {
                background: var(--orange-100);
                color: var(--orange-700);
            }
        }
    `]
})
export class ProductionTrackingComponent implements OnInit, OnDestroy {
    @Input() projects: Project[] = [];
    @Input() productionLines: ProductionLine[] = [];
    @Input() parts: Part[] = [];

    @Output() outputSaved = new EventEmitter<HourlyProduction>();
    @Output() downtimeSaved = new EventEmitter<any>();

    private destroy$ = new Subject<void>();

    shiftForm!: FormGroup;
    loading = false;

    shifts: ShiftOption[] = [
        { label: 'Morning (6h-14h)', value: 'M' },
        { label: 'Afternoon (14h-22h)', value: 'A' },
        { label: 'Night (22h-6h)', value: 'N' }
    ];

    hours: HourOption[] = [];
    hourlyProductions: HourlyProduction[] = [];
    downtimeProblems: any[] = [];

    currentOutput = 0;
    currentTarget = 0;
    currentEfficiency = 0;
    currentDowntime = 0;

    // Downtime fields (inline with hourly production)
    selectedProblem: number | null = null;
    downtimeComment = '';

    // For editing existing production
    editingProductionId: number | null = null;

    constructor(
        private fb: FormBuilder,
        private productionService: DmsProductionService
    ) {}

    ngOnInit(): void {
        this.initForm();
        this.generateHours();
        this.loadProjects();
        this.loadDowntimeProblems();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initForm(): void {
        this.shiftForm = this.fb.group({
            shift: ['M', Validators.required],
            date: [new Date(), Validators.required],
            projectId: [null, Validators.required],
            productionLineId: [null, Validators.required],
            partId: [null, Validators.required],
            hour: [null, Validators.required]
        });
    }

    private generateHours(): void {
        for (let i = 6; i <= 22; i++) {
            this.hours.push({
                label: `${i.toString().padStart(2, '0')}:00 - ${(i + 1).toString().padStart(2, '0')}:00`,
                value: i
            });
        }
    }

    private loadProjects(): void {
        if (this.projects.length === 0) {
            this.productionService.getProjects()
                .pipe(takeUntil(this.destroy$))
                .subscribe(projects => this.projects = projects);
        }
    }

    private loadDowntimeProblems(): void {
        this.productionService.getDowntimeProblems()
            .pipe(takeUntil(this.destroy$))
            .subscribe(problems => this.downtimeProblems = problems);
    }

    onProjectChange(): void {
        const projectId = this.shiftForm.get('projectId')?.value;
        if (projectId) {
            this.productionService.getProductionLinesByProject(projectId)
                .pipe(takeUntil(this.destroy$))
                .subscribe(lines => {
                    this.productionLines = lines;
                    this.shiftForm.patchValue({ productionLineId: null, partId: null });
                });
        }
    }

    onLineChange(): void {
        const projectId = this.shiftForm.get('projectId')?.value;
        if (projectId) {
            this.productionService.getPartsByProject(projectId)
                .pipe(takeUntil(this.destroy$))
                .subscribe(parts => {
                    this.parts = parts;
                    this.shiftForm.patchValue({ partId: null });
                });
        }
        this.loadHourlyData();
    }

    onPartChange(): void {
        const partId = this.shiftForm.get('partId')?.value;
        const part = this.parts.find(p => p.Id_Part === partId);
        if (part) {
            this.currentTarget = part.ShiftTarget_Part || 0;
            this.calculateEfficiency();
        }
    }

    loadHourlyData(): void {
        const { date, shift, productionLineId } = this.shiftForm.value;
        if (!date || !shift || !productionLineId) return;

        this.loading = true;
        this.productionService.getHourlyProduction({
            date,
            shift,
            lineId: productionLineId
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.hourlyProductions = data;
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    calculateEfficiency(): void {
        if (this.currentTarget > 0) {
            this.currentEfficiency = Math.round((this.currentOutput / this.currentTarget) * 100);
        } else {
            this.currentEfficiency = 0;
        }
    }

    saveOutput(): void {
        if (!this.shiftForm.valid) return;

        // Validate downtime requires a problem type
        if (this.currentDowntime > 0 && !this.selectedProblem) {
            return;
        }

        const formValue = this.shiftForm.value;
        const hourlyProd: Partial<HourlyProduction> = {
            Date_HourlyProd: formValue.date,
            Shift_HourlyProd: formValue.shift,
            Hour_HourlyProd: formValue.hour,
            Id_Part: formValue.partId,
            Id_ProdLine: formValue.productionLineId,
            Result_HourlyProdPN: this.currentOutput,
            Target_HourlyProdPN: this.currentTarget
        };

        // If editing, include the ID
        if (this.editingProductionId) {
            hourlyProd.Id_HourlyProd = this.editingProductionId;
        }

        this.productionService.saveHourlyProduction(hourlyProd as HourlyProduction)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (saved) => {
                    this.outputSaved.emit(saved);

                    // Save downtime if specified
                    if (this.currentDowntime > 0 && this.selectedProblem) {
                        this.saveDowntimeForProduction(saved.Id_HourlyProd);
                    } else {
                        this.resetForm();
                        this.loadHourlyData();
                    }
                }
            });
    }

    private saveDowntimeForProduction(hourlyProdId: number): void {
        const downtime = {
            Total_Downtime: this.currentDowntime,
            Comment_Downtime: this.downtimeComment,
            Id_HourlyProd: hourlyProdId,
            Id_DowntimeProblems: this.selectedProblem
        };

        this.productionService.saveDowntime(downtime)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.resetForm();
                    this.loadHourlyData();
                },
                error: () => {
                    // Even if downtime save fails, reset and reload
                    this.resetForm();
                    this.loadHourlyData();
                }
            });
    }

    private resetForm(): void {
        this.currentOutput = 0;
        this.currentDowntime = 0;
        this.selectedProblem = null;
        this.downtimeComment = '';
        this.editingProductionId = null;
    }

    editProduction(prod: HourlyProduction): void {
        this.shiftForm.patchValue({
            hour: prod.Hour_HourlyProd,
            partId: prod.Id_Part
        });
        this.currentOutput = prod.Result_HourlyProdPN;
        this.currentTarget = prod.Target_HourlyProdPN;
        this.editingProductionId = prod.Id_HourlyProd;
        this.calculateEfficiency();

        // Load existing downtime for this production
        if (prod.Id_HourlyProd) {
            this.productionService.getDowntimesByHourlyProduction(prod.Id_HourlyProd)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (downtimes) => {
                        if (downtimes && downtimes.length > 0) {
                            const firstDowntime = downtimes[0];
                            this.currentDowntime = firstDowntime.duration || 0;
                            this.selectedProblem = firstDowntime.problem || null;
                            this.downtimeComment = firstDowntime.comment || '';
                        } else {
                            this.currentDowntime = 0;
                            this.selectedProblem = null;
                            this.downtimeComment = '';
                        }
                    }
                });
        }
    }

    // Helper method to get total downtime for a production record
    getTotalDowntimeForProd(prod: HourlyProduction): number {
        if (prod.downtimes && prod.downtimes.length > 0) {
            return prod.downtimes.reduce((sum, d) => sum + (d.duration || 0), 0);
        }
        return 0;
    }

    // Helper method to get total shift downtime
    getTotalShiftDowntime(): number {
        return this.hourlyProductions.reduce((sum, prod) => sum + this.getTotalDowntimeForProd(prod), 0);
    }

    exportData(): void {
        // Export functionality
    }

    formatHour(hour: number): string {
        return `${hour.toString().padStart(2, '0')}:00`;
    }

    getEfficiencyClass(): string {
        if (this.currentEfficiency >= 90) return 'high';
        if (this.currentEfficiency >= 75) return 'medium';
        return 'low';
    }

    getEfficiencyBadgeClass(efficiency: number): string {
        if (efficiency >= 90) return 'high';
        if (efficiency >= 75) return 'medium';
        return 'low';
    }

    getProductionStatus(prod: HourlyProduction): string {
        const efficiency = prod.Target_HourlyProdPN > 0
            ? (prod.Result_HourlyProdPN / prod.Target_HourlyProdPN) * 100
            : 0;
        if (efficiency >= 100) return 'Exceeded';
        if (efficiency >= 90) return 'On Target';
        if (efficiency >= 75) return 'Below Target';
        return 'Critical';
    }

    getProductionStatusSeverity(prod: HourlyProduction): 'success' | 'info' | 'warn' | 'danger' {
        const efficiency = prod.Target_HourlyProdPN > 0
            ? (prod.Result_HourlyProdPN / prod.Target_HourlyProdPN) * 100
            : 0;
        if (efficiency >= 100) return 'success';
        if (efficiency >= 90) return 'info';
        if (efficiency >= 75) return 'warn';
        return 'danger';
    }

    getTotalOutput(): number {
        return this.hourlyProductions.reduce((sum, p) => sum + p.Result_HourlyProdPN, 0);
    }

    getTotalTarget(): number {
        return this.hourlyProductions.reduce((sum, p) => sum + p.Target_HourlyProdPN, 0);
    }

    getShiftEfficiency(): number {
        const totalTarget = this.getTotalTarget();
        if (totalTarget === 0) return 0;
        return Math.round((this.getTotalOutput() / totalTarget) * 100);
    }
}
