/**
 * Process Form Dialog Component
 * Domain: DMS-RH
 *
 * Dialog form for creating and editing manufacturing processes
 */
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';

// Domain imports
import { Process } from '../../models';

@Component({
    selector: 'app-process-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DialogModule,
        InputTextModule,
        ButtonModule,
        ToastModule,
        RippleModule,
        TextareaModule,
        ToggleSwitchModule
    ],
    providers: [MessageService],
    template: `
        <p-dialog [(visible)]="visible"
                  [header]="process ? 'Modifier Processus' : 'Nouveau Processus'"
                  [modal]="true"
                  [style]="{width: '500px', maxWidth: '95vw'}"
                  [draggable]="false"
                  [resizable]="false"
                  styleClass="hr-dialog"
                  (onHide)="onCancel()">

            <form [formGroup]="form" class="process-form">
                <!-- Process Identity -->
                <div class="form-section">
                    <div class="form-field">
                        <label for="name">Nom du Processus *</label>
                        <input pInputText id="name" formControlName="name"
                               placeholder="Ex: Assemblage, Soudure, Contrôle Qualité..." />
                        <small *ngIf="form.get('name')?.invalid && form.get('name')?.touched"
                               class="p-error">
                            Le nom est requis (min. 3 caractères)
                        </small>
                    </div>

                    <div class="form-field">
                        <label for="description">Description *</label>
                        <textarea pTextarea id="description"
                                  formControlName="description"
                                  rows="3"
                                  placeholder="Décrivez ce processus de fabrication..."
                                  [autoResize]="true">
                        </textarea>
                        <small *ngIf="form.get('description')?.invalid && form.get('description')?.touched"
                               class="p-error">
                            La description est requise (min. 10 caractères)
                        </small>
                    </div>

                    <div class="form-field toggle-field">
                        <label for="is_active">Statut</label>
                        <div class="toggle-container">
                            <p-toggleSwitch formControlName="is_active" inputId="is_active"></p-toggleSwitch>
                            <span class="toggle-label">{{ form.get('is_active')?.value ? 'Actif' : 'Inactif' }}</span>
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
                            [label]="process ? 'Mettre à jour' : 'Créer'"
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
        .process-form {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-section {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
        }

        .form-field {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;

            label {
                font-weight: 500;
                font-size: 0.875rem;
                color: var(--text-color);
            }

            input, textarea {
                width: 100%;
            }
        }

        .toggle-field {
            .toggle-container {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .toggle-label {
                font-size: 0.875rem;
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
        }
    `]
})
export class ProcessFormDialogComponent implements OnChanges {
    @Input() visible = false;
    @Input() process: Process | null = null;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<Partial<Process>>();
    @Output() cancel = new EventEmitter<void>();

    form!: FormGroup;
    saving = false;

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService
    ) {
        this.initForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['process'] && this.form) {
            if (this.process) {
                this.populateForm();
            } else {
                this.resetForm();
            }
        }
    }

    private initForm(): void {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: ['', [Validators.required, Validators.minLength(10)]],
            is_active: [true]
        });
    }

    private populateForm(): void {
        if (!this.process) return;

        this.form.patchValue({
            name: this.process.name,
            description: this.process.description || '',
            is_active: this.process.is_active !== false
        });
    }

    private resetForm(): void {
        this.form.reset({
            name: '',
            description: '',
            is_active: true
        });
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

        const formValue = this.form.value;

        const processData: Partial<Process> = {
            name: formValue.name,
            description: formValue.description || null,
            is_active: formValue.is_active
        };

        this.save.emit(processData);
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
