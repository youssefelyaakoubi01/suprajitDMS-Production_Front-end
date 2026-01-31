/**
 * Departement Form Dialog Component
 * Domain: DMS-RH
 *
 * Dialog form for creating and editing departements
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
import { MessageService } from 'primeng/api';

// Domain imports
import { Departement } from '@domains/dms-rh';

@Component({
    selector: 'app-departement-form-dialog',
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
        TextareaModule
    ],
    providers: [MessageService],
    template: `
        <p-dialog [(visible)]="visible"
                  [header]="departement ? 'Modifier Département' : 'Nouveau Département'"
                  [modal]="true"
                  [style]="{width: '500px', maxWidth: '95vw'}"
                  [draggable]="false"
                  [resizable]="false"
                  styleClass="hr-dialog"
                  (onHide)="onCancel()">

            <form [formGroup]="form" class="departement-form">
                <!-- Departement Identity -->
                <div class="form-section">
                    <div class="form-field">
                        <label for="name">Nom du Département *</label>
                        <input pInputText id="name" formControlName="name"
                               placeholder="Ex: Production, Qualité, Maintenance..." />
                        <small *ngIf="form.get('name')?.invalid && form.get('name')?.touched"
                               class="p-error">
                            Le nom est requis (min. 2 caractères)
                        </small>
                    </div>

                    <div class="form-field">
                        <label for="description">Description</label>
                        <textarea pTextarea id="description"
                                  formControlName="description"
                                  rows="3"
                                  placeholder="Décrivez ce département..."
                                  [autoResize]="true">
                        </textarea>
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
                            [label]="departement ? 'Mettre à jour' : 'Créer'"
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
        .departement-form {
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
export class DepartementFormDialogComponent implements OnChanges {
    @Input() visible = false;
    @Input() departement: Departement | null = null;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<Partial<Departement>>();
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
        if (changes['departement'] && this.form) {
            if (this.departement) {
                this.populateForm();
            } else {
                this.form.reset();
            }
        }
    }

    private initForm(): void {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            description: ['']
        });
    }

    private populateForm(): void {
        if (!this.departement) return;

        this.form.patchValue({
            name: this.departement.name,
            description: this.departement.description || ''
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

        const departementData: Partial<Departement> = {
            id: this.departement?.id,
            name: formValue.name,
            description: formValue.description || null
        };

        this.save.emit(departementData);
    }

    onCancel(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.cancel.emit();
        this.form.reset();
    }

    setSaving(value: boolean): void {
        this.saving = value;
    }
}
