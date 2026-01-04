/**
 * Formation Form Dialog Component
 * Domain: DMS-RH
 *
 * Dialog form for creating and editing formations
 */
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';

// Domain imports
import { Formation, FormationType, FormationTypeLabels } from '@domains/dms-rh';

interface Process {
    id: number;
    name: string;
}

@Component({
    selector: 'app-formation-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DialogModule,
        InputTextModule,
        ButtonModule,
        SelectModule,
        InputNumberModule,
        ToastModule,
        RippleModule,
        DividerModule,
        TextareaModule,
        ToggleSwitchModule
    ],
    providers: [MessageService],
    template: `
        <p-dialog [(visible)]="visible"
                  [header]="formation ? 'Modifier Formation' : 'Nouvelle Formation'"
                  [modal]="true"
                  [style]="{width: '600px', maxWidth: '95vw'}"
                  [draggable]="false"
                  [resizable]="false"
                  styleClass="hr-dialog"
                  (onHide)="onCancel()">

            <form [formGroup]="form" class="formation-form">
                <!-- Basic Information -->
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="pi pi-book"></i>
                        Informations de Base
                    </h3>

                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label for="name">Nom de la Formation *</label>
                            <input pInputText id="name" formControlName="name"
                                   placeholder="Ex: Formation Sécurité au Travail" />
                            <small *ngIf="form.get('name')?.invalid && form.get('name')?.touched"
                                   class="p-error">
                                Le nom est requis (min. 3 caractères)
                            </small>
                        </div>

                        <div class="form-field">
                            <label for="type">Type de Formation *</label>
                            <p-select id="type"
                                      formControlName="type"
                                      [options]="typeOptions"
                                      optionLabel="label"
                                      optionValue="value"
                                      placeholder="Sélectionner le type"
                                      appendTo="body"
                                      styleClass="w-full">
                                <ng-template let-option pTemplate="item">
                                    <div class="flex align-items-center gap-2">
                                        <i [class]="getTypeIcon(option.value)"></i>
                                        <span>{{ option.label }}</span>
                                    </div>
                                </ng-template>
                            </p-select>
                        </div>

                        <div class="form-field">
                            <label for="duration">Durée (heures) *</label>
                            <p-inputNumber id="duration"
                                           formControlName="duration_hours"
                                           [min]="0.5"
                                           [max]="1000"
                                           [step]="0.5"
                                           [showButtons]="true"
                                           buttonLayout="horizontal"
                                           decrementButtonClass="p-button-outlined"
                                           incrementButtonClass="p-button-outlined"
                                           incrementButtonIcon="pi pi-plus"
                                           decrementButtonIcon="pi pi-minus"
                                           suffix=" h"
                                           styleClass="w-full">
                            </p-inputNumber>
                        </div>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Association -->
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="pi pi-link"></i>
                        Association
                    </h3>

                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label for="process">Processus Associé</label>
                            <p-select id="process"
                                      formControlName="process"
                                      [options]="processes"
                                      optionLabel="name"
                                      optionValue="id"
                                      placeholder="Sélectionner un processus"
                                      [filter]="true"
                                      [showClear]="true"
                                      appendTo="body"
                                      styleClass="w-full">
                            </p-select>
                            <small class="field-hint">
                                Associez cette formation à un processus de production
                            </small>
                        </div>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Description -->
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="pi pi-align-left"></i>
                        Description
                    </h3>

                    <div class="form-field full-width">
                        <label for="description">Description de la Formation</label>
                        <textarea pTextarea id="description"
                                  formControlName="description"
                                  rows="4"
                                  placeholder="Décrivez les objectifs et le contenu de la formation..."
                                  [autoResize]="true">
                        </textarea>
                        <small class="field-hint">
                            {{ form.get('description')?.value?.length || 0 }} / 500 caractères
                        </small>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Status -->
                <div class="form-section">
                    <div class="status-toggle">
                        <div class="toggle-label">
                            <span class="label-text">Formation Active</span>
                            <span class="label-hint">Les formations inactives ne seront pas proposées</span>
                        </div>
                        <p-toggleSwitch formControlName="is_active"></p-toggleSwitch>
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
                            [label]="formation ? 'Mettre à jour' : 'Créer'"
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
        .formation-form {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
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

            input, textarea, :host ::ng-deep .p-select, :host ::ng-deep .p-inputnumber {
                width: 100%;
            }
        }

        .field-hint {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }

        .status-toggle {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: var(--surface-50);
            border-radius: 8px;
        }

        .toggle-label {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            .label-text {
                font-weight: 500;
                color: var(--text-color);
            }

            .label-hint {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
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

            .p-inputnumber-buttons-horizontal .p-inputnumber-input {
                text-align: center;
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
export class FormationFormDialogComponent implements OnInit, OnChanges {
    @Input() visible = false;
    @Input() formation: Formation | null = null;
    @Input() processes: Process[] = [];

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<Partial<Formation>>();
    @Output() cancel = new EventEmitter<void>();

    form!: FormGroup;
    saving = false;

    typeOptions = [
        { label: 'Formation Initiale', value: 'initial' },
        { label: 'Formation Continue', value: 'continuous' },
        { label: 'Recyclage', value: 'recyclage' },
        { label: 'Certification', value: 'certification' }
    ];

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        if (this.formation) {
            this.populateForm();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['formation'] && this.form) {
            if (this.formation) {
                this.populateForm();
            } else {
                this.form.reset({ is_active: true, duration_hours: 1 });
            }
        }
    }

    private initForm(): void {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            type: ['', Validators.required],
            duration_hours: [1, [Validators.required, Validators.min(0.5)]],
            process: [null],
            description: ['', Validators.maxLength(500)],
            is_active: [true]
        });
    }

    private populateForm(): void {
        if (!this.formation) return;

        this.form.patchValue({
            name: this.formation.name,
            type: this.formation.type,
            duration_hours: this.formation.duration_hours || 1,
            process: this.formation.process || null,
            description: this.formation.description || '',
            is_active: this.formation.is_active !== false
        });
    }

    getTypeIcon(type: string): string {
        const icons: Record<string, string> = {
            'initial': 'pi pi-play',
            'continuous': 'pi pi-sync',
            'recyclage': 'pi pi-refresh',
            'certification': 'pi pi-verified'
        };
        return icons[type] || 'pi pi-book';
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

        const formData: Partial<Formation> = {
            ...this.form.value,
            id: this.formation?.id
        };

        this.save.emit(formData);
    }

    onCancel(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.cancel.emit();
        this.form.reset({ is_active: true, duration_hours: 1 });
    }

    setSaving(value: boolean): void {
        this.saving = value;
    }
}
