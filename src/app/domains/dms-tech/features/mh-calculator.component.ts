import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
interface MHConfiguration {
    id?: number;
    part: number;
    part_number?: string;
    production_line?: number;
    production_line_name?: string;
    mh_per_part: number;
    headcount_target: number;
    time_per_shift: number;
    target_per_head_shift: number;
    output_target_without_control: number;
    bottleneck_cycle_time?: number;
    shift_target: number;
    real_output?: number;
    total_efficiency?: number;
    target_60min: number;
    target_50min: number;
    target_45min: number;
    target_30min: number;
    new_shift_target: number;
    dms_shift_target: number;
    gap: number;
    status: string;
    created_at?: string;
    updated_at?: string;
}

@Component({
    selector: 'app-mh-calculator',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        SelectModule,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        CardModule,
        ToolbarModule,
        TooltipModule,
        DividerModule,
        IconFieldModule,
        InputIconModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="left">
                    <h2 class="m-0">
                        <i class="pi pi-calculator mr-2"></i>MH Calculator
                    </h2>
                </ng-template>
                <ng-template pTemplate="center">
                    <div class="flex align-items-center gap-2">
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input
                                pInputText
                                type="text"
                                [(ngModel)]="searchTerm"
                                (ngModelChange)="onSearchChange($event)"
                                placeholder="Search..."
                                class="w-12rem" />
                        </p-iconfield>
                        <p-select
                            [(ngModel)]="selectedStatusFilter"
                            [options]="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="All Statuses"
                            [showClear]="true"
                            (onChange)="onFilterChange()"
                            styleClass="w-10rem">
                        </p-select>
                        <p-button *ngIf="searchTerm || selectedStatusFilter"
                            icon="pi pi-times"
                            styleClass="p-button-text"
                            (onClick)="clearFilters()">
                        </p-button>
                    </div>
                </ng-template>
                <ng-template pTemplate="right">
                    <p-button
                        label="New Entry"
                        icon="pi pi-plus"
                        styleClass="p-button-success mr-2"
                        (onClick)="openNew()">
                    </p-button>
                    <p-button
                        label="Refresh"
                        icon="pi pi-refresh"
                        styleClass="p-button-outlined"
                        (onClick)="loadData()">
                    </p-button>
                </ng-template>
            </p-toolbar>

            <p-table
                [value]="filteredConfigurations"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} configurations"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 60px">ID</th>
                        <th pSortableColumn="part_number">Part Number <p-sortIcon field="part_number"></p-sortIcon></th>
                        <th>Line</th>
                        <th pSortableColumn="mh_per_part" style="width: 100px">MH/Part <p-sortIcon field="mh_per_part"></p-sortIcon></th>
                        <th style="width: 100px">Headcount</th>
                        <th pSortableColumn="shift_target" style="width: 120px">Shift Target <p-sortIcon field="shift_target"></p-sortIcon></th>
                        <th style="width: 110px">Target/60min</th>
                        <th style="width: 110px">Real Output</th>
                        <th pSortableColumn="total_efficiency" style="width: 100px">Efficiency <p-sortIcon field="total_efficiency"></p-sortIcon></th>
                        <th pSortableColumn="gap" style="width: 80px">GAP <p-sortIcon field="gap"></p-sortIcon></th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 100px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-config>
                    <tr>
                        <td>{{ config.id }}</td>
                        <td><strong class="text-primary">{{ config.part_number }}</strong></td>
                        <td>{{ config.production_line_name }}</td>
                        <td class="text-center">{{ config.mh_per_part | number:'1.2-2' }}</td>
                        <td class="text-center">{{ config.headcount_target }}</td>
                        <td class="text-center font-bold">{{ config.shift_target | number:'1.0-0' }}</td>
                        <td class="text-center">{{ config.target_60min | number:'1.0-0' }}</td>
                        <td class="text-center">{{ config.real_output || '-' }}</td>
                        <td class="text-center">
                            <p-tag
                                *ngIf="config.total_efficiency !== null && config.total_efficiency !== undefined"
                                [value]="(config.total_efficiency | number:'1.1-1') + '%'"
                                [severity]="getEfficiencySeverity(config.total_efficiency)">
                            </p-tag>
                            <span *ngIf="config.total_efficiency === null || config.total_efficiency === undefined">-</span>
                        </td>
                        <td class="text-center">
                            <span [ngClass]="{'text-red-500': config.gap > 0, 'text-green-500': config.gap < 0}">
                                {{ config.gap | number:'1.0-0' }}
                            </span>
                        </td>
                        <td>
                            <p-tag
                                [value]="config.status"
                                [severity]="getStatusSeverity(config.status)">
                            </p-tag>
                        </td>
                        <td>
                            <p-button
                                icon="pi pi-pencil"
                                styleClass="p-button-rounded p-button-warning p-button-text mr-1"
                                pTooltip="Edit"
                                (onClick)="editConfiguration(config)">
                            </p-button>
                            <p-button
                                icon="pi pi-trash"
                                styleClass="p-button-rounded p-button-danger p-button-text"
                                pTooltip="Delete"
                                (onClick)="confirmDelete(config)">
                            </p-button>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="12" class="text-center p-4">
                            <i class="pi pi-inbox text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No MH configurations found.</span>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Create/Edit Dialog -->
        <p-dialog
            [(visible)]="configDialog"
            [style]="{width: '750px'}"
            [header]="editMode ? 'Edit MH Configuration' : 'New MH Configuration'"
            [modal]="true"
            styleClass="p-fluid form-dialog">

            <ng-template pTemplate="content">
                <!-- Input Section -->
                <div class="form-section mb-4">
                    <h4 class="text-lg font-semibold mb-3">
                        <i class="pi pi-pencil mr-2"></i>Input Parameters
                    </h4>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="mhPerPart">MH per Part <span class="required">*</span></label>
                            <p-inputNumber
                                id="mhPerPart"
                                [(ngModel)]="config.mh_per_part"
                                [min]="0.01"
                                [step]="0.01"
                                [minFractionDigits]="2"
                                [maxFractionDigits]="4"
                                placeholder="e.g., 0.55"
                                (onInput)="onInputChange()"
                                [ngClass]="{'ng-invalid ng-dirty': submitted && !config.mh_per_part}">
                            </p-inputNumber>
                            <small class="error-message" *ngIf="submitted && !config.mh_per_part">MH per Part is required.</small>
                        </div>

                        <div class="form-field">
                            <label for="headcountTarget">Headcount Target <span class="required">*</span></label>
                            <p-inputNumber
                                id="headcountTarget"
                                [(ngModel)]="config.headcount_target"
                                [min]="1"
                                [showButtons]="true"
                                placeholder="e.g., 2"
                                (onInput)="onInputChange()"
                                [ngClass]="{'ng-invalid ng-dirty': submitted && !config.headcount_target}">
                            </p-inputNumber>
                            <small class="error-message" *ngIf="submitted && !config.headcount_target">Headcount is required.</small>
                        </div>

                        <div class="form-field">
                            <label for="timePerShift">Time/Shift (Min) <span class="required">*</span></label>
                            <p-inputNumber
                                id="timePerShift"
                                [(ngModel)]="config.time_per_shift"
                                [min]="1"
                                [showButtons]="true"
                                placeholder="e.g., 465"
                                (onInput)="onInputChange()"
                                [ngClass]="{'ng-invalid ng-dirty': submitted && !config.time_per_shift}">
                            </p-inputNumber>
                            <small class="error-message" *ngIf="submitted && !config.time_per_shift">Time per shift is required.</small>
                        </div>

                        <div class="form-field">
                            <label for="bottleneckCycleTime">Bottleneck Cycle Time (Sec)</label>
                            <p-inputNumber
                                id="bottleneckCycleTime"
                                [(ngModel)]="config.bottleneck_cycle_time"
                                [min]="0"
                                placeholder="Optional">
                            </p-inputNumber>
                        </div>

                        <div class="form-field">
                            <label for="newShiftTarget">NEW Shift Target <span class="required">*</span></label>
                            <p-inputNumber
                                id="newShiftTarget"
                                [(ngModel)]="config.new_shift_target"
                                [min]="0"
                                placeholder="e.g., 900"
                                (onInput)="onInputChange()"
                                [ngClass]="{'ng-invalid ng-dirty': submitted && config.new_shift_target === null}">
                            </p-inputNumber>
                        </div>

                        <div class="form-field">
                            <label for="dmsShiftTarget">DMS Shift Target <span class="required">*</span></label>
                            <p-inputNumber
                                id="dmsShiftTarget"
                                [(ngModel)]="config.dms_shift_target"
                                [min]="0"
                                placeholder="e.g., 900"
                                [ngClass]="{'ng-invalid ng-dirty': submitted && config.dms_shift_target === null}">
                            </p-inputNumber>
                        </div>

                        <div class="form-field">
                            <label for="realOutput">Real Output</label>
                            <p-inputNumber
                                id="realOutput"
                                [(ngModel)]="config.real_output"
                                [min]="0"
                                placeholder="Optional"
                                (onInput)="onInputChange()">
                            </p-inputNumber>
                        </div>

                        <div class="form-field">
                            <label for="status">Status</label>
                            <p-select
                                id="status"
                                [(ngModel)]="config.status"
                                [options]="statusOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select Status">
                            </p-select>
                        </div>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Calculated Values Section -->
                <div class="form-section">
                    <h4 class="text-lg font-semibold mb-3">
                        <i class="pi pi-calculator mr-2"></i>Calculated Values (Auto)
                    </h4>
                    <div class="calculated-grid">
                        <div class="calculated-item" pTooltip="Time/Shift ÷ MH per Part">
                            <span class="calculated-label">Target/Head/Shift</span>
                            <span class="calculated-value">{{ config.target_per_head_shift | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= {{ config.time_per_shift }} ÷ {{ config.mh_per_part }}</span>
                        </div>
                        <div class="calculated-item" pTooltip="Target/Head/Shift × Headcount">
                            <span class="calculated-label">Output Target</span>
                            <span class="calculated-value">{{ config.output_target_without_control | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= ({{ config.time_per_shift }} ÷ {{ config.mh_per_part }}) × {{ config.headcount_target }}</span>
                        </div>
                        <div class="calculated-item" pTooltip="= Output Target">
                            <span class="calculated-label">Shift Target</span>
                            <span class="calculated-value font-bold text-primary">{{ config.shift_target | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= Output Target</span>
                        </div>
                    </div>

                    <p-divider></p-divider>

                    <div class="calculated-grid">
                        <div class="calculated-item" pTooltip="Shift Target ÷ (Time/Shift ÷ 60)">
                            <span class="calculated-label">Target/60min</span>
                            <span class="calculated-value">{{ config.target_60min | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= {{ config.shift_target }} ÷ {{ (config.time_per_shift || 0) / 60 | number:'1.2-2' }}h</span>
                        </div>
                        <div class="calculated-item" pTooltip="Target/60min × (50/60)">
                            <span class="calculated-label">Target/50min</span>
                            <span class="calculated-value">{{ config.target_50min | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= Target/60min × 50/60</span>
                        </div>
                        <div class="calculated-item" pTooltip="Target/60min × (45/60)">
                            <span class="calculated-label">Target/45min</span>
                            <span class="calculated-value">{{ config.target_45min | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= Target/60min × 45/60</span>
                        </div>
                        <div class="calculated-item" pTooltip="Target/60min × (30/60)">
                            <span class="calculated-label">Target/30min</span>
                            <span class="calculated-value">{{ config.target_30min | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= Target/60min × 30/60</span>
                        </div>
                    </div>

                    <p-divider></p-divider>

                    <div class="calculated-grid">
                        <div class="calculated-item" pTooltip="Shift Target - NEW Shift Target">
                            <span class="calculated-label">GAP</span>
                            <span class="calculated-value" [ngClass]="{'text-red-500': (config.gap || 0) > 0, 'text-green-500': (config.gap || 0) < 0}">
                                {{ config.gap | number:'1.0-0' }}
                            </span>
                            <span class="calculated-formula">= {{ config.shift_target }} - {{ config.new_shift_target }}</span>
                        </div>
                        <div class="calculated-item" pTooltip="(Shift Target × MH/Part) ÷ (Headcount × Time/Shift) × 100">
                            <span class="calculated-label">Efficiency</span>
                            <span class="calculated-value">
                                <span *ngIf="config.total_efficiency !== null && config.total_efficiency !== undefined">
                                    {{ config.total_efficiency | number:'1.1-1' }}%
                                </span>
                                <span *ngIf="config.total_efficiency === null || config.total_efficiency === undefined">-</span>
                            </span>
                            <span class="calculated-formula">= (ST × MH) ÷ (HC × T) × 100</span>
                        </div>
                    </div>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="saveConfiguration()"></p-button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--surface-50);
        }

        .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }

        .form-field {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-field label {
            font-weight: 500;
            color: var(--text-color);
        }

        .required {
            color: var(--red-500);
        }

        .error-message {
            color: var(--red-500);
            font-size: 0.75rem;
        }

        .form-section {
            background: var(--surface-50);
            padding: 1rem;
            border-radius: 8px;
        }

        .calculated-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
        }

        .calculated-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.75rem;
            background: var(--surface-0);
            border-radius: 6px;
            border: 1px solid var(--surface-200);
        }

        .calculated-label {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            margin-bottom: 0.25rem;
        }

        .calculated-value {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-color);
        }

        .calculated-formula {
            font-size: 0.65rem;
            color: var(--text-color-secondary);
            margin-top: 0.25rem;
            font-style: italic;
            opacity: 0.8;
        }

        @media (max-width: 768px) {
            .form-grid {
                grid-template-columns: 1fr;
            }

            .calculated-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MHCalculatorComponent implements OnInit, OnDestroy {
    configurations: MHConfiguration[] = [];
    filteredConfigurations: MHConfiguration[] = [];
    config: Partial<MHConfiguration> = {};

    statusOptions = [
        { label: 'No change', value: 'No change' },
        { label: 'Updated', value: 'Updated' },
        { label: 'New', value: 'New' },
        { label: 'Pending', value: 'Pending' }
    ];

    configDialog = false;
    editMode = false;
    submitted = false;
    loading = false;

    // Filter properties
    searchTerm = '';
    selectedStatusFilter: string | null = null;
    private searchSubject = new Subject<string>();
    private filterSubject = new Subject<void>();
    private calcSubject = new Subject<void>();
    private destroy$ = new Subject<void>();

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.setupSearch();
        this.setupCalculation();
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setupSearch(): void {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.applyFilters();
        });

        // Debounced dropdown filter changes
        this.filterSubject.pipe(
            debounceTime(100),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.applyFilters();
        });
    }

    private setupCalculation(): void {
        this.calcSubject.pipe(
            debounceTime(150),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.calculateValues();
            this.cdr.markForCheck();
        });
    }

    onSearchChange(value: string): void {
        this.searchSubject.next(value);
    }

    onFilterChange(): void {
        this.filterSubject.next();
    }

    onInputChange(): void {
        this.calcSubject.next();
    }

    applyFilters(): void {
        let result = [...this.configurations];

        if (this.searchTerm) {
            const search = this.searchTerm.toLowerCase();
            result = result.filter(item =>
                item.part_number?.toLowerCase().includes(search) ||
                item.production_line_name?.toLowerCase().includes(search)
            );
        }

        if (this.selectedStatusFilter) {
            result = result.filter(item => item.status === this.selectedStatusFilter);
        }

        this.filteredConfigurations = result;
        this.cdr.markForCheck();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.selectedStatusFilter = null;
        this.applyFilters();
    }

    loadData(): void {
        this.loading = true;

        this.productionService.getMHConfigurations().subscribe({
            next: (data: any) => {
                this.configurations = (data.results || data || []).map((c: any) => ({
                    ...c,
                    part_number: c.part_number || 'Unknown',
                    production_line_name: c.production_line_name || '-'
                }));
                this.applyFilters();
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data' });
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    openNew(): void {
        // MH Configuration should now be opened from Parts Management
        // This method is kept for backward compatibility but won't create new entries directly
        this.messageService.add({
            severity: 'info',
            summary: 'Info',
            detail: 'Please use the MH Config button from Parts Management to create new configurations'
        });
    }

    editConfiguration(configuration: MHConfiguration): void {
        this.config = { ...configuration };
        this.calculateValues();
        this.editMode = true;
        this.submitted = false;
        this.configDialog = true;
    }

    hideDialog(): void {
        this.configDialog = false;
        this.submitted = false;
    }

    calculateValues(): void {
        const mhPerPart = this.config.mh_per_part || 0;
        const headcount = this.config.headcount_target || 0;
        const timePerShift = this.config.time_per_shift || 0;
        const realOutput = this.config.real_output;
        const newShiftTarget = this.config.new_shift_target || 0;

        // Calculate target per head per shift (keep as float for precision)
        // Formula: time_per_shift / mh_per_part
        // Example: 465 min / 0.55 MH = 845.45 parts per head per shift
        let targetPerHeadShift = 0;
        if (mhPerPart > 0) {
            targetPerHeadShift = timePerShift / mhPerPart;
        }
        this.config.target_per_head_shift = Math.round(targetPerHeadShift);

        // Calculate output target without control (round only at final result)
        // Formula: (time_per_shift / mh_per_part) * headcount
        // Example: 465 / 0.55 * 2 = 1690.909 → 1691
        this.config.output_target_without_control = Math.round(targetPerHeadShift * headcount);

        // Shift target equals output target
        this.config.shift_target = this.config.output_target_without_control;

        // Calculate hourly targets based on shift target and time per shift
        const hoursPerShift = timePerShift / 60;
        if (hoursPerShift > 0) {
            const hourlyRate = (this.config.shift_target || 0) / hoursPerShift;
            this.config.target_60min = Math.round(hourlyRate);
            this.config.target_50min = Math.round(hourlyRate * (50 / 60));
            this.config.target_45min = Math.round(hourlyRate * (45 / 60));
            this.config.target_30min = Math.round(hourlyRate * (30 / 60));
        } else {
            this.config.target_60min = 0;
            this.config.target_50min = 0;
            this.config.target_45min = 0;
            this.config.target_30min = 0;
        }

        // Calculate efficiency
        // Formula: (shift_target * mh_per_part) / (headcount * time_per_shift)
        if (this.config.shift_target && headcount > 0 && timePerShift > 0) {
            this.config.total_efficiency = ((this.config.shift_target * mhPerPart) / (headcount * timePerShift)) * 100;
        } else {
            this.config.total_efficiency = undefined;
        }

        // Calculate GAP
        this.config.gap = (this.config.shift_target || 0) - newShiftTarget;
    }

    saveConfiguration(): void {
        this.submitted = true;

        // Validation - part is required (set from Parts Management), production_line is now optional
        if (!this.config.part || !this.config.mh_per_part ||
            !this.config.headcount_target || !this.config.time_per_shift) {
            this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields' });
            return;
        }

        // Recalculate before saving
        this.calculateValues();

        // Prepare data
        const configData: any = {
            part: this.config.part,
            production_line: this.config.production_line || null,
            mh_per_part: this.config.mh_per_part,
            headcount_target: this.config.headcount_target,
            time_per_shift: this.config.time_per_shift,
            target_per_head_shift: this.config.target_per_head_shift,
            output_target_without_control: this.config.output_target_without_control,
            bottleneck_cycle_time: this.config.bottleneck_cycle_time || null,
            shift_target: this.config.shift_target,
            real_output: this.config.real_output || null,
            total_efficiency: this.config.total_efficiency || null,
            target_60min: this.config.target_60min,
            target_50min: this.config.target_50min,
            target_45min: this.config.target_45min,
            target_30min: this.config.target_30min,
            new_shift_target: this.config.new_shift_target || 0,
            dms_shift_target: this.config.dms_shift_target || 0,
            gap: this.config.gap,
            status: this.config.status || 'New'
        };

        if (this.editMode && this.config.id) {
            this.productionService.updateMHConfiguration(this.config.id, configData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Configuration updated successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to update configuration' });
                }
            });
        } else {
            this.productionService.createMHConfiguration(configData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Configuration created successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    let errorMsg = 'Failed to create configuration';
                    if (error.error) {
                        if (typeof error.error === 'object') {
                            const messages = Object.entries(error.error)
                                .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                                .join('; ');
                            errorMsg = messages || errorMsg;
                        } else if (error.error.detail) {
                            errorMsg = error.error.detail;
                        }
                    }
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                }
            });
        }
    }

    confirmDelete(configuration: MHConfiguration): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete this MH configuration for "${configuration.part_number}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteConfiguration(configuration)
        });
    }

    deleteConfiguration(configuration: MHConfiguration): void {
        if (!configuration.id) return;
        this.productionService.deleteMHConfiguration(configuration.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Configuration deleted successfully' });
                this.loadData();
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to delete configuration' });
            }
        });
    }

    getEfficiencySeverity(efficiency: number): 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast' | undefined {
        if (efficiency >= 95) return 'success';
        if (efficiency >= 85) return 'info';
        if (efficiency >= 70) return 'warn';
        return 'danger';
    }

    getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast' | undefined {
        switch (status) {
            case 'Updated': return 'success';
            case 'New': return 'info';
            case 'Pending': return 'warn';
            default: return 'secondary';
        }
    }
}
