/**
 * Downtime Declaration Dialog Component
 * Domain: DMS-Production
 *
 * Enhanced downtime declaration with full details and maintenance notification
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Domain imports
import { DmsProductionService } from '../../services/production.service';
import { Workstation, Machine, ProductionLine } from '../../models/production.model';
import { DowntimeProblem } from '../../models/downtime.model';
import { MaintenanceService } from '@core/services/maintenance.service';

export interface DowntimeDeclarationData {
    // Core fields
    workstation: number | null;
    machine: number | null;
    problemType: number | null;
    duration: number;
    reason: string;
    description: string;

    // Enhanced fields
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    declarationType: 'planned' | 'unplanned' | 'emergency';
    estimatedResolution: number | null;

    // Maintenance notification
    notifyMaintenance: boolean;

    // Context (set by parent)
    productionLineId?: number;
    hourlyProductionId?: number;
}

interface ImpactOption {
    label: string;
    value: 'low' | 'medium' | 'high' | 'critical';
    severity: 'success' | 'info' | 'warn' | 'danger';
    description: string;
}

interface DeclarationTypeOption {
    label: string;
    value: 'planned' | 'unplanned' | 'emergency';
    icon: string;
    description: string;
}

@Component({
    selector: 'app-downtime-declaration-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DialogModule,
        ButtonModule,
        SelectModule,
        InputNumberModule,
        InputTextModule,
        TextareaModule,
        CheckboxModule,
        TagModule,
        DividerModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
        <p-dialog [(visible)]="visible"
                  [modal]="true"
                  [header]="dialogTitle"
                  [style]="{ width: '700px', maxWidth: '95vw' }"
                  [draggable]="true"
                  [resizable]="false"
                  (onHide)="onCancel()">

            <p-toast position="top-center"></p-toast>

            <form [formGroup]="form" class="declaration-form">
                <!-- Impact Level Selection -->
                <div class="impact-selection mb-4">
                    <label class="block mb-2 font-semibold">
                        <i class="pi pi-exclamation-triangle mr-2"></i>Impact Level
                    </label>
                    <div class="impact-options">
                        <div *ngFor="let option of impactOptions"
                             class="impact-option"
                             [class.selected]="form.get('impactLevel')?.value === option.value"
                             [class]="'impact-' + option.value"
                             (click)="selectImpact(option.value)">
                            <p-tag [value]="option.label" [severity]="option.severity"></p-tag>
                            <span class="impact-desc">{{ option.description }}</span>
                        </div>
                    </div>
                </div>

                <!-- Declaration Type -->
                <div class="type-selection mb-4">
                    <label class="block mb-2 font-semibold">
                        <i class="pi pi-tag mr-2"></i>Declaration Type
                    </label>
                    <div class="type-options">
                        <div *ngFor="let option of typeOptions"
                             class="type-option"
                             [class.selected]="form.get('declarationType')?.value === option.value"
                             (click)="selectType(option.value)">
                            <i [class]="option.icon + ' type-icon'"></i>
                            <span class="type-label">{{ option.label }}</span>
                            <span class="type-desc">{{ option.description }}</span>
                        </div>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Location Selection -->
                <div class="grid mb-3">
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">
                            <i class="pi pi-sitemap mr-1"></i>Workstation <span class="text-red-500">*</span>
                        </label>
                        <p-select [options]="workstations"
                                  formControlName="workstation"
                                  optionLabel="Name_Workstation"
                                  optionValue="Id_Workstation"
                                  placeholder="Select Workstation"
                                  [filter]="true"
                                  filterBy="Name_Workstation"
                                  styleClass="w-full"
                                  (onChange)="onWorkstationChange()">
                        </p-select>
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">
                            <i class="pi pi-cog mr-1"></i>Machine
                        </label>
                        <p-select [options]="machines"
                                  formControlName="machine"
                                  optionLabel="name"
                                  optionValue="id"
                                  placeholder="Select Machine (optional)"
                                  [filter]="true"
                                  filterBy="name"
                                  [showClear]="true"
                                  styleClass="w-full"
                                  [disabled]="!form.get('workstation')?.value">
                        </p-select>
                    </div>
                </div>

                <!-- Problem Type -->
                <div class="mb-3">
                    <label class="block mb-2 font-medium">
                        <i class="pi pi-exclamation-circle mr-1"></i>Problem Type <span class="text-red-500">*</span>
                    </label>
                    <p-select [options]="downtimeProblems"
                              formControlName="problemType"
                              optionLabel="Name_DowntimeProblems"
                              optionValue="Id_DowntimeProblems"
                              placeholder="Select Problem Type"
                              [filter]="true"
                              filterBy="Name_DowntimeProblems"
                              styleClass="w-full">
                    </p-select>
                </div>

                <!-- Duration and Estimated Resolution -->
                <div class="grid mb-3">
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">
                            <i class="pi pi-clock mr-1"></i>Duration (minutes) <span class="text-red-500">*</span>
                        </label>
                        <p-inputNumber formControlName="duration"
                                       [min]="1"
                                       [max]="480"
                                       [showButtons]="true"
                                       buttonLayout="horizontal"
                                       spinnerMode="horizontal"
                                       decrementButtonClass="p-button-secondary"
                                       incrementButtonClass="p-button-secondary"
                                       incrementButtonIcon="pi pi-plus"
                                       decrementButtonIcon="pi pi-minus"
                                       styleClass="w-full">
                        </p-inputNumber>
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">
                            <i class="pi pi-stopwatch mr-1"></i>Estimated Resolution (min)
                        </label>
                        <p-inputNumber formControlName="estimatedResolution"
                                       [min]="0"
                                       [max]="480"
                                       [showButtons]="true"
                                       placeholder="Optional"
                                       styleClass="w-full">
                        </p-inputNumber>
                    </div>
                </div>

                <!-- Reason -->
                <div class="mb-3">
                    <label class="block mb-2 font-medium">
                        <i class="pi pi-info-circle mr-1"></i>Reason <span class="text-red-500">*</span>
                    </label>
                    <input pInputText formControlName="reason"
                           placeholder="Brief reason for downtime (e.g., Machine breakdown, Material shortage)"
                           class="w-full">
                </div>

                <!-- Description -->
                <div class="mb-3">
                    <label class="block mb-2 font-medium">
                        <i class="pi pi-align-left mr-1"></i>Detailed Description
                    </label>
                    <textarea pTextarea formControlName="description"
                              placeholder="Provide additional details about the downtime..."
                              rows="3"
                              class="w-full">
                    </textarea>
                </div>

                <p-divider></p-divider>

                <!-- Maintenance Notification -->
                <div class="maintenance-notification mb-3" [class.active]="form.get('notifyMaintenance')?.value">
                    <div class="flex align-items-center gap-3">
                        <p-checkbox formControlName="notifyMaintenance"
                                    [binary]="true"
                                    inputId="notifyMaint">
                        </p-checkbox>
                        <label for="notifyMaint" class="flex-grow-1 cursor-pointer">
                            <span class="font-semibold">
                                <i class="pi pi-bell mr-2"></i>Notify Maintenance Team
                            </span>
                            <p class="text-sm text-color-secondary mt-1 mb-0">
                                Send an alert to the maintenance team for immediate attention
                            </p>
                        </label>
                    </div>
                    <div *ngIf="form.get('notifyMaintenance')?.value" class="notification-preview mt-3">
                        <div class="preview-header">
                            <i class="pi pi-send"></i>
                            <span>Alert Preview</span>
                        </div>
                        <div class="preview-content">
                            <p-tag [value]="getImpactLabel()" [severity]="getImpactSeverity()"></p-tag>
                            <span class="preview-text">
                                {{ getPreviewMessage() }}
                            </span>
                        </div>
                    </div>
                </div>
            </form>

            <ng-template pTemplate="footer">
                <div class="flex justify-content-between align-items-center w-full">
                    <span class="text-sm text-color-secondary" *ngIf="form.get('notifyMaintenance')?.value">
                        <i class="pi pi-info-circle mr-1"></i>
                        Maintenance team will be notified immediately
                    </span>
                    <div class="flex gap-2">
                        <button pButton label="Cancel" icon="pi pi-times"
                                class="p-button-text"
                                (click)="onCancel()">
                        </button>
                        <button pButton [label]="submitLabel" icon="pi pi-check"
                                class="p-button-warning"
                                [disabled]="!form.valid || submitting"
                                [loading]="submitting"
                                (click)="onSubmit()">
                        </button>
                    </div>
                </div>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        .declaration-form {
            padding: 0.5rem;
        }

        .impact-selection, .type-selection {
            background: var(--surface-50);
            padding: 1rem;
            border-radius: 8px;
        }

        .impact-options {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.75rem;
        }

        .impact-option {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.75rem;
            border: 2px solid var(--surface-border);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;

            &:hover {
                border-color: var(--primary-color);
                background: var(--surface-card);
            }

            &.selected {
                border-color: var(--primary-color);
                background: var(--primary-50);
            }

            &.impact-critical.selected {
                border-color: var(--red-500);
                background: var(--red-50);
            }
            &.impact-high.selected {
                border-color: var(--orange-500);
                background: var(--orange-50);
            }
            &.impact-medium.selected {
                border-color: var(--yellow-500);
                background: var(--yellow-50);
            }
            &.impact-low.selected {
                border-color: var(--green-500);
                background: var(--green-50);
            }
        }

        .impact-desc {
            font-size: 0.7rem;
            color: var(--text-color-secondary);
            margin-top: 0.5rem;
        }

        .type-options {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
        }

        .type-option {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem;
            border: 2px solid var(--surface-border);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;

            &:hover {
                border-color: var(--primary-color);
                background: var(--surface-card);
            }

            &.selected {
                border-color: var(--primary-color);
                background: var(--primary-50);
            }
        }

        .type-icon {
            font-size: 1.5rem;
            color: var(--primary-color);
            margin-bottom: 0.5rem;
        }

        .type-label {
            font-weight: 600;
            font-size: 0.875rem;
        }

        .type-desc {
            font-size: 0.7rem;
            color: var(--text-color-secondary);
            margin-top: 0.25rem;
        }

        .maintenance-notification {
            background: var(--surface-50);
            padding: 1rem;
            border-radius: 8px;
            border: 2px solid var(--surface-border);
            transition: all 0.3s;

            &.active {
                border-color: var(--orange-500);
                background: var(--orange-50);
            }
        }

        .notification-preview {
            background: var(--surface-card);
            border-radius: 6px;
            padding: 0.75rem;
            border-left: 4px solid var(--orange-500);
        }

        .preview-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            margin-bottom: 0.5rem;
        }

        .preview-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .preview-text {
            font-size: 0.875rem;
        }

        @media (max-width: 768px) {
            .impact-options {
                grid-template-columns: repeat(2, 1fr);
            }
            .type-options {
                grid-template-columns: 1fr;
            }
        }
    `]
})
export class DowntimeDeclarationDialogComponent implements OnInit, OnDestroy {
    @Input() visible = false;
    @Input() productionLineId: number | null = null;
    @Input() hourlyProductionId: number | null = null;
    @Input() editData: DowntimeDeclarationData | null = null;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() declared = new EventEmitter<DowntimeDeclarationData>();
    @Output() cancelled = new EventEmitter<void>();

    private destroy$ = new Subject<void>();

    form!: FormGroup;
    submitting = false;

    workstations: Workstation[] = [];
    machines: Machine[] = [];
    downtimeProblems: DowntimeProblem[] = [];

    impactOptions: ImpactOption[] = [
        { label: 'Low', value: 'low', severity: 'success', description: 'Minor impact' },
        { label: 'Medium', value: 'medium', severity: 'info', description: 'Moderate impact' },
        { label: 'High', value: 'high', severity: 'warn', description: 'Significant impact' },
        { label: 'Critical', value: 'critical', severity: 'danger', description: 'Line stopped' }
    ];

    typeOptions: DeclarationTypeOption[] = [
        { label: 'Planned', value: 'planned', icon: 'pi pi-calendar', description: 'Scheduled maintenance' },
        { label: 'Unplanned', value: 'unplanned', icon: 'pi pi-exclamation-triangle', description: 'Unexpected issue' },
        { label: 'Emergency', value: 'emergency', icon: 'pi pi-bolt', description: 'Urgent - needs immediate action' }
    ];

    constructor(
        private fb: FormBuilder,
        private productionService: DmsProductionService,
        private maintenanceService: MaintenanceService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.initForm();
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initForm(): void {
        this.form = this.fb.group({
            workstation: [null, Validators.required],
            machine: [null],
            problemType: [null, Validators.required],
            duration: [15, [Validators.required, Validators.min(1), Validators.max(480)]],
            reason: ['', [Validators.required, Validators.minLength(5)]],
            description: [''],
            impactLevel: ['medium', Validators.required],
            declarationType: ['unplanned', Validators.required],
            estimatedResolution: [null],
            notifyMaintenance: [false]
        });

        // If editing, populate form
        if (this.editData) {
            this.form.patchValue(this.editData);
        }
    }

    private loadData(): void {
        // Load workstations for the production line
        if (this.productionLineId) {
            this.productionService.getWorkstations(this.productionLineId)
                .pipe(takeUntil(this.destroy$))
                .subscribe(ws => this.workstations = ws);
        } else {
            // Load all workstations if no line specified
            this.productionService.getWorkstations()
                .pipe(takeUntil(this.destroy$))
                .subscribe(ws => this.workstations = ws);
        }

        // Load downtime problems
        this.productionService.getDowntimeProblems()
            .pipe(takeUntil(this.destroy$))
            .subscribe(problems => this.downtimeProblems = problems);
    }

    onWorkstationChange(): void {
        const workstationId = this.form.get('workstation')?.value;
        this.form.patchValue({ machine: null });

        if (workstationId) {
            this.productionService.getMachines(workstationId)
                .pipe(takeUntil(this.destroy$))
                .subscribe(machines => this.machines = machines);
        } else {
            this.machines = [];
        }
    }

    selectImpact(value: 'low' | 'medium' | 'high' | 'critical'): void {
        this.form.patchValue({ impactLevel: value });

        // Auto-enable maintenance notification for high/critical
        if (value === 'high' || value === 'critical') {
            this.form.patchValue({ notifyMaintenance: true });
        }
    }

    selectType(value: 'planned' | 'unplanned' | 'emergency'): void {
        this.form.patchValue({ declarationType: value });

        // Auto-enable maintenance notification for emergency
        if (value === 'emergency') {
            this.form.patchValue({
                notifyMaintenance: true,
                impactLevel: 'critical'
            });
        }
    }

    getImpactLabel(): string {
        const impact = this.form.get('impactLevel')?.value;
        const option = this.impactOptions.find(o => o.value === impact);
        return option?.label || 'Medium';
    }

    getImpactSeverity(): 'success' | 'info' | 'warn' | 'danger' {
        const impact = this.form.get('impactLevel')?.value;
        const option = this.impactOptions.find(o => o.value === impact);
        return option?.severity || 'info';
    }

    getPreviewMessage(): string {
        const ws = this.workstations.find(w => w.Id_Workstation === this.form.get('workstation')?.value);
        const reason = this.form.get('reason')?.value || 'Downtime declared';
        const wsName = ws?.Name_Workstation || 'Workstation';
        return `${wsName}: ${reason}`;
    }

    get dialogTitle(): string {
        return this.editData ? 'Edit Downtime Declaration' : 'Declare Downtime';
    }

    get submitLabel(): string {
        return this.editData ? 'Update' : 'Declare Downtime';
    }

    onSubmit(): void {
        if (!this.form.valid) return;

        this.submitting = true;
        const formValue = this.form.value;

        const declarationData: DowntimeDeclarationData = {
            workstation: formValue.workstation,
            machine: formValue.machine,
            problemType: formValue.problemType,
            duration: formValue.duration,
            reason: formValue.reason,
            description: formValue.description,
            impactLevel: formValue.impactLevel,
            declarationType: formValue.declarationType,
            estimatedResolution: formValue.estimatedResolution,
            notifyMaintenance: formValue.notifyMaintenance,
            productionLineId: this.productionLineId || undefined,
            hourlyProductionId: this.hourlyProductionId || undefined
        };

        // If notify maintenance is enabled, create a declaration in maintenance system
        if (formValue.notifyMaintenance && this.productionLineId) {
            this.createMaintenanceDeclaration(declarationData);
        } else {
            this.completeSubmission(declarationData);
        }
    }

    private createMaintenanceDeclaration(data: DowntimeDeclarationData): void {
        // Validate required fields before creating declaration
        if (!data.workstation || !data.productionLineId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Missing Data',
                detail: 'Workstation and production line are required for maintenance notification'
            });
            this.completeSubmission(data);
            return;
        }

        const maintenanceDeclaration = {
            workstation: data.workstation,
            machine: data.machine || undefined,
            production_line: data.productionLineId,
            declaration_type: data.declarationType,
            impact_level: data.impactLevel,
            reason: data.reason,
            description: data.description,
            expected_start: new Date().toISOString(),
            expected_end: data.estimatedResolution
                ? new Date(Date.now() + data.estimatedResolution * 60000).toISOString()
                : undefined
        };

        this.maintenanceService.createDeclaration(maintenanceDeclaration)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Maintenance Notified',
                        detail: 'The maintenance team has been alerted'
                    });
                    this.completeSubmission(data);
                },
                error: (err) => {
                    console.error('Failed to notify maintenance:', err);
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Notification Failed',
                        detail: 'Could not notify maintenance, but downtime was recorded'
                    });
                    this.completeSubmission(data);
                }
            });
    }

    private completeSubmission(data: DowntimeDeclarationData): void {
        this.submitting = false;
        this.declared.emit(data);
        this.close();
    }

    onCancel(): void {
        this.cancelled.emit();
        this.close();
    }

    private close(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.form.reset({
            impactLevel: 'medium',
            declarationType: 'unplanned',
            duration: 15,
            notifyMaintenance: false
        });
    }
}
