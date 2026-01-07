/**
 * Recyclage Form Dialog Component
 * Domain: DMS-RH
 *
 * Dialog form for scheduling employee retraining
 */
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

// Domain imports
import { Employee, Formation, Formateur, RecyclageEmployee } from '@domains/dms-rh';
import { environment } from '../../../../../environments/environment';
import { EmployeeAutocompleteComponent } from '@shared/components/employee-autocomplete/employee-autocomplete.component';

interface RecyclageSchedule {
    id?: number;
    employeeId: number;
    formationId: number;
    trainerId?: number;
    scheduledDate: Date;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    notes?: string;
}

@Component({
    selector: 'app-recyclage-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DialogModule,
        InputTextModule,
        ButtonModule,
        SelectModule,
        DatePickerModule,
        ToastModule,
        RippleModule,
        DividerModule,
        TextareaModule,
        AvatarModule,
        TagModule,
        EmployeeAutocompleteComponent
    ],
    providers: [MessageService],
    template: `
        <p-dialog [(visible)]="visible"
                  [header]="isEdit ? 'Modifier Recyclage' : 'Planifier un Recyclage'"
                  [modal]="true"
                  [style]="{width: '650px', maxWidth: '95vw'}"
                  [draggable]="false"
                  [resizable]="false"
                  styleClass="hr-dialog"
                  (onHide)="onCancel()">

            <form [formGroup]="form" class="recyclage-form">
                <!-- Employee Alert if Pre-selected -->
                <div class="employee-alert" *ngIf="preselectedEmployee">
                    <div class="alert-icon" [ngClass]="preselectedEmployee.isOverdue ? 'alert-danger' : 'alert-warning'">
                        <i class="pi" [ngClass]="preselectedEmployee.isOverdue ? 'pi-exclamation-triangle' : 'pi-clock'"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">
                            {{ preselectedEmployee.isOverdue ? 'Recyclage en retard' : 'Recyclage à prévoir' }}
                        </div>
                        <div class="alert-text">
                            {{ preselectedEmployee.isOverdue
                                ? 'Cet employé a dépassé la date de recyclage de ' + getAbsoluteDays(preselectedEmployee.daysUntilRecyclage) + ' jours'
                                : 'Recyclage prévu dans ' + preselectedEmployee.daysUntilRecyclage + ' jours' }}
                        </div>
                    </div>
                </div>

                <!-- Employee Selection -->
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="pi pi-user"></i>
                        Employé
                    </h3>

                    <div class="form-field">
                        <label for="employee">Sélectionner l'Employé *</label>
                        <app-employee-autocomplete
                            formControlName="employeeId"
                            placeholder="Rechercher un employé..."
                            [disabled]="!!preselectedEmployee"
                            [showClear]="true"
                            appendTo="body">
                        </app-employee-autocomplete>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Formation Selection -->
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="pi pi-book"></i>
                        Formation de Recyclage
                    </h3>

                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label for="formation">Formation *</label>
                            <p-select id="formation"
                                      formControlName="formationId"
                                      [options]="recyclageFormations"
                                      optionLabel="name"
                                      optionValue="id"
                                      placeholder="Sélectionner une formation"
                                      [filter]="true"
                                      appendTo="body"
                                      styleClass="w-full">
                                <ng-template let-formation pTemplate="item">
                                    <div class="formation-option">
                                        <i class="pi pi-book"></i>
                                        <div class="formation-info">
                                            <span class="formation-name">{{ formation.name }}</span>
                                            <span class="formation-duration">{{ formation.duration_hours }}h</span>
                                        </div>
                                    </div>
                                </ng-template>
                            </p-select>
                        </div>

                        <div class="form-field">
                            <label for="trainer">Formateur</label>
                            <p-select id="trainer"
                                      formControlName="trainerId"
                                      [options]="trainers"
                                      optionLabel="name"
                                      optionValue="id"
                                      placeholder="Sélectionner un formateur"
                                      [filter]="true"
                                      [showClear]="true"
                                      appendTo="body"
                                      styleClass="w-full">
                            </p-select>
                        </div>

                        <div class="form-field">
                            <label for="scheduledDate">Date Prévue *</label>
                            <p-datepicker id="scheduledDate"
                                          formControlName="scheduledDate"
                                          [showIcon]="true"
                                          dateFormat="dd/mm/yy"
                                          [minDate]="minDate"
                                          placeholder="Sélectionner une date"
                                          appendTo="body"
                                          styleClass="w-full">
                            </p-datepicker>
                        </div>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Status & Notes -->
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="pi pi-info-circle"></i>
                        Détails Supplémentaires
                    </h3>

                    <div class="form-grid">
                        <div class="form-field" *ngIf="isEdit">
                            <label for="status">Statut</label>
                            <p-select id="status"
                                      formControlName="status"
                                      [options]="statusOptions"
                                      optionLabel="label"
                                      optionValue="value"
                                      appendTo="body"
                                      styleClass="w-full">
                                <ng-template let-status pTemplate="item">
                                    <div class="status-option">
                                        <span class="status-dot" [ngClass]="'status-' + status.value"></span>
                                        <span>{{ status.label }}</span>
                                    </div>
                                </ng-template>
                            </p-select>
                        </div>

                        <div class="form-field" [ngClass]="{'full-width': !isEdit}">
                            <label for="notes">Notes</label>
                            <textarea pTextarea id="notes"
                                      formControlName="notes"
                                      rows="3"
                                      placeholder="Ajouter des notes ou commentaires..."
                                      [autoResize]="true">
                            </textarea>
                        </div>
                    </div>
                </div>
            </form>

            <ng-template pTemplate="footer">
                <div class="dialog-footer">
                    <button pButton pRipple
                            type="button"
                            label="Annuler"
                            icon="pi pi-times"
                            class="p-button-outlined"
                            (click)="onCancel()">
                    </button>
                    <button pButton pRipple
                            type="button"
                            [label]="isEdit ? 'Mettre à jour' : 'Planifier'"
                            icon="pi pi-check"
                            class="p-button-primary"
                            [loading]="saving"
                            [disabled]="form.invalid || saving"
                            (click)="onSave()">
                    </button>
                </div>
            </ng-template>
        </p-dialog>

        <p-toast position="bottom-right"></p-toast>
    `,
    styles: [`
        .recyclage-form {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .employee-alert {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            background: var(--surface-50);
            border-left: 4px solid;

            &:has(.alert-danger) {
                border-left-color: var(--red-500);
                background: rgba(239, 68, 68, 0.05);
            }

            &:has(.alert-warning) {
                border-left-color: var(--yellow-500);
                background: rgba(245, 158, 11, 0.05);
            }
        }

        .alert-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;

            i {
                font-size: 1.25rem;
            }

            &.alert-danger {
                background: rgba(239, 68, 68, 0.1);
                color: var(--red-500);
            }

            &.alert-warning {
                background: rgba(245, 158, 11, 0.1);
                color: var(--yellow-600);
            }
        }

        .alert-content {
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .alert-title {
            font-weight: 600;
            color: var(--text-color);
            font-size: 0.875rem;
        }

        .alert-text {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }

        .form-section {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .section-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin: 0;
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-color);

            i {
                color: var(--hr-primary, #8B5CF6);
            }
        }

        .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
        }

        .form-field {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;

            &.full-width {
                grid-column: 1 / -1;
            }

            label {
                font-weight: 500;
                font-size: 0.875rem;
                color: var(--text-color);
            }

            input, textarea, :host ::ng-deep .p-select, :host ::ng-deep .p-datepicker {
                width: 100%;
            }
        }

        .employee-option {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .employee-info {
            display: flex;
            flex-direction: column;
            flex: 1;

            .employee-name {
                font-weight: 500;
                color: var(--text-color);
            }

            .employee-dept {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
            }
        }

        .formation-option {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            i {
                color: var(--hr-primary);
            }
        }

        .formation-info {
            display: flex;
            flex-direction: column;

            .formation-name {
                font-weight: 500;
                color: var(--text-color);
            }

            .formation-duration {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
            }
        }

        .status-option {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;

            &.status-scheduled {
                background: var(--blue-500);
            }

            &.status-in_progress {
                background: var(--yellow-500);
            }

            &.status-completed {
                background: var(--green-500);
            }

            &.status-cancelled {
                background: var(--gray-400);
            }
        }

        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            padding-top: 0.5rem;
        }

        :host ::ng-deep {
            .hr-dialog {
                .p-dialog-header {
                    background: var(--surface-50);
                    border-bottom: 1px solid var(--surface-border);
                    padding: 1.25rem 1.5rem;
                }

                .p-dialog-content {
                    padding: 1.5rem;
                }

                .p-dialog-footer {
                    border-top: 1px solid var(--surface-border);
                    padding: 1rem 1.5rem;
                }
            }
        }

        @media (max-width: 576px) {
            .form-grid {
                grid-template-columns: 1fr;
            }

            .form-field.full-width {
                grid-column: 1;
            }
        }
    `]
})
export class RecyclageFormDialogComponent implements OnInit, OnChanges {
    @Input() visible = false;
    @Input() schedule: RecyclageSchedule | null = null;
    @Input() preselectedEmployee: RecyclageEmployee | null = null;
    @Input() formations: Formation[] = [];
    @Input() trainers: Formateur[] = [];

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<RecyclageSchedule>();
    @Output() cancel = new EventEmitter<void>();

    form!: FormGroup;
    saving = false;
    minDate = new Date();

    recyclageFormations: Formation[] = [];

    statusOptions = [
        { label: 'Planifié', value: 'scheduled' },
        { label: 'En cours', value: 'in_progress' },
        { label: 'Terminé', value: 'completed' },
        { label: 'Annulé', value: 'cancelled' }
    ];

    get isEdit(): boolean {
        return !!this.schedule;
    }

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.prepareData();
        if (this.schedule) {
            this.populateForm();
        } else if (this.preselectedEmployee) {
            this.form.patchValue({
                employeeId: this.preselectedEmployee.Id_Emp
            });
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['formations']) {
            this.prepareData();
        }

        if (changes['schedule'] && this.form) {
            if (this.schedule) {
                this.populateForm();
            } else {
                this.resetForm();
            }
        }

        if (changes['preselectedEmployee'] && this.preselectedEmployee && this.form) {
            this.form.patchValue({
                employeeId: this.preselectedEmployee.Id_Emp
            });
        }
    }

    private initForm(): void {
        this.form = this.fb.group({
            employeeId: [null, Validators.required],
            formationId: [null, Validators.required],
            trainerId: [null],
            scheduledDate: [null, Validators.required],
            status: ['scheduled'],
            notes: ['']
        });
    }

    private prepareData(): void {
        // Filter formations for recyclage type
        this.recyclageFormations = this.formations.filter(f =>
            f.type?.toLowerCase() === 'recyclage' || f.is_active !== false
        );
    }

    private populateForm(): void {
        if (!this.schedule) return;

        this.form.patchValue({
            employeeId: this.schedule.employeeId,
            formationId: this.schedule.formationId,
            trainerId: this.schedule.trainerId,
            scheduledDate: this.schedule.scheduledDate ? new Date(this.schedule.scheduledDate) : null,
            status: this.schedule.status,
            notes: this.schedule.notes || ''
        });
    }

    private resetForm(): void {
        this.form.reset({
            status: 'scheduled'
        });

        if (this.preselectedEmployee) {
            this.form.patchValue({
                employeeId: this.preselectedEmployee.Id_Emp
            });
        }
    }

    getEmployeePhoto(employee: any): string | undefined {
        if (!employee?.Picture) return undefined;
        if (employee.Picture.startsWith('http')) return employee.Picture;
        return `${environment.mediaUrl}${employee.Picture}`;
    }

    getInitials(employee: any): string {
        const first = employee?.Prenom_Emp?.charAt(0) || '';
        const last = employee?.Nom_Emp?.charAt(0) || '';
        return (first + last).toUpperCase() || '?';
    }

    getAbsoluteDays(days: number): number {
        return Math.abs(days);
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Veuillez remplir tous les champs obligatoires'
            });
            return;
        }

        this.saving = true;

        const formData: RecyclageSchedule = {
            id: this.schedule?.id,
            ...this.form.value
        };

        this.save.emit(formData);
    }

    onCancel(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.cancel.emit();
        this.resetForm();
    }

    setSaving(value: boolean): void {
        this.saving = value;
    }
}
