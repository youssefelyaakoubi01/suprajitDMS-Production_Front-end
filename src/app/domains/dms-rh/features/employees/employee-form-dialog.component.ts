/**
 * Employee Form Dialog Component
 * Domain: DMS-RH
 *
 * Dialog form for creating and editing employees
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
import { FileUploadModule } from 'primeng/fileupload';
import { AvatarModule } from 'primeng/avatar';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';

// Domain imports
import { Employee, Department, EmployeeCategory, Team } from '@domains/dms-rh';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-employee-form-dialog',
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
        FileUploadModule,
        AvatarModule,
        ToastModule,
        RippleModule,
        DividerModule,
        TextareaModule
    ],
    providers: [MessageService],
    template: `
        <p-dialog [(visible)]="visible"
                  [header]="employee ? 'Modifier Employé' : 'Nouvel Employé'"
                  [modal]="true"
                  [style]="{width: '700px', maxWidth: '95vw'}"
                  [draggable]="false"
                  [resizable]="false"
                  styleClass="hr-dialog"
                  (onHide)="onCancel()">

            <form [formGroup]="form" class="employee-form">
                <!-- Photo Section -->
                <div class="photo-section">
                    <div class="photo-preview">
                        <p-avatar [image]="photoPreview || getEmployeePhoto()"
                                  [label]="!photoPreview && !employee?.Picture ? getFormInitials() : undefined"
                                  shape="circle"
                                  [style]="{'width': '120px', 'height': '120px', 'font-size': '2rem', 'background': 'var(--hr-gradient)', 'color': 'white'}">
                        </p-avatar>
                        <div class="photo-actions">
                            <p-fileUpload mode="basic"
                                          name="photo"
                                          accept="image/*"
                                          [maxFileSize]="5000000"
                                          chooseLabel="Choisir photo"
                                          chooseIcon="pi pi-camera"
                                          styleClass="p-button-outlined p-button-sm"
                                          (onSelect)="onPhotoSelect($event)">
                            </p-fileUpload>
                            <button *ngIf="photoPreview || employee?.Picture"
                                    pButton pRipple
                                    type="button"
                                    icon="pi pi-trash"
                                    class="p-button-outlined p-button-danger p-button-sm"
                                    (click)="removePhoto()">
                            </button>
                        </div>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Personal Information -->
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="pi pi-user"></i>
                        Informations Personnelles
                    </h3>

                    <div class="form-grid">
                        <div class="form-field">
                            <label for="prenom">Prénom *</label>
                            <input pInputText id="prenom" formControlName="Prenom_Emp"
                                   placeholder="Entrez le prénom" />
                            <small *ngIf="form.get('Prenom_Emp')?.invalid && form.get('Prenom_Emp')?.touched"
                                   class="p-error">
                                Le prénom est requis
                            </small>
                        </div>

                        <div class="form-field">
                            <label for="nom">Nom *</label>
                            <input pInputText id="nom" formControlName="Nom_Emp"
                                   placeholder="Entrez le nom" />
                            <small *ngIf="form.get('Nom_Emp')?.invalid && form.get('Nom_Emp')?.touched"
                                   class="p-error">
                                Le nom est requis
                            </small>
                        </div>

                        <div class="form-field">
                            <label for="dateNaissance">Date de Naissance</label>
                            <p-datepicker id="dateNaissance"
                                          formControlName="DateNaissance_Emp"
                                          [showIcon]="true"
                                          dateFormat="dd/mm/yy"
                                          placeholder="Sélectionner une date"
                                          [maxDate]="maxBirthDate"
                                          appendTo="body"
                                          styleClass="w-full">
                            </p-datepicker>
                        </div>

                        <div class="form-field">
                            <label for="genre">Genre *</label>
                            <p-select id="genre"
                                      formControlName="Genre_Emp"
                                      [options]="genderOptions"
                                      optionLabel="label"
                                      optionValue="value"
                                      placeholder="Sélectionner le genre"
                                      appendTo="body"
                                      styleClass="w-full">
                            </p-select>
                        </div>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Professional Information -->
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="pi pi-briefcase"></i>
                        Informations Professionnelles
                    </h3>

                    <div class="form-grid">
                        <div class="form-field">
                            <label for="badgeNumber">Numéro de Badge</label>
                            <input pInputText id="badgeNumber" formControlName="BadgeNumber"
                                   placeholder="Ex: B001234" />
                        </div>

                        <div class="form-field">
                            <label for="dateEmbauche">Date d'Embauche *</label>
                            <p-datepicker id="dateEmbauche"
                                          formControlName="DateEmbauche_Emp"
                                          [showIcon]="true"
                                          dateFormat="dd/mm/yy"
                                          placeholder="Sélectionner une date"
                                          appendTo="body"
                                          styleClass="w-full">
                            </p-datepicker>
                        </div>

                        <div class="form-field">
                            <label for="departement">Département *</label>
                            <p-select id="departement"
                                      formControlName="Departement_Emp"
                                      [options]="departments"
                                      optionLabel="department"
                                      optionValue="department"
                                      placeholder="Sélectionner un département"
                                      [filter]="true"
                                      filterPlaceholder="Rechercher..."
                                      appendTo="body"
                                      styleClass="w-full">
                            </p-select>
                        </div>

                        <div class="form-field">
                            <label for="categorie">Catégorie *</label>
                            <p-select id="categorie"
                                      formControlName="Categorie_Emp"
                                      [options]="categories"
                                      optionLabel="name"
                                      optionValue="name"
                                      placeholder="Sélectionner une catégorie"
                                      appendTo="body"
                                      styleClass="w-full">
                            </p-select>
                        </div>

                        <div class="form-field">
                            <label for="team">Équipe</label>
                            <p-select id="team"
                                      formControlName="teamID"
                                      [options]="teams"
                                      optionLabel="name"
                                      optionValue="id"
                                      placeholder="Sélectionner une équipe"
                                      [filter]="true"
                                      [showClear]="true"
                                      appendTo="body"
                                      styleClass="w-full">
                            </p-select>
                        </div>

                        <div class="form-field">
                            <label for="status">Statut *</label>
                            <p-select id="status"
                                      formControlName="EmpStatus"
                                      [options]="statusOptions"
                                      optionLabel="label"
                                      optionValue="value"
                                      placeholder="Sélectionner le statut"
                                      appendTo="body"
                                      styleClass="w-full">
                            </p-select>
                        </div>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Contact Information -->
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="pi pi-phone"></i>
                        Informations de Contact
                    </h3>

                    <div class="form-grid">
                        <div class="form-field">
                            <label for="phone">Téléphone</label>
                            <input pInputText id="phone" formControlName="Phone_Emp"
                                   placeholder="Ex: 0612345678" />
                        </div>

                        <div class="form-field">
                            <label for="email">Email</label>
                            <input pInputText id="email" formControlName="Email_Emp"
                                   type="email"
                                   placeholder="Ex: nom@exemple.com" />
                            <small *ngIf="form.get('Email_Emp')?.invalid && form.get('Email_Emp')?.touched"
                                   class="p-error">
                                Format email invalide
                            </small>
                        </div>

                        <div class="form-field">
                            <label for="cin">Carte Nationale (CIN)</label>
                            <input pInputText id="cin" formControlName="CIN_Emp"
                                   placeholder="Ex: AB123456" />
                        </div>

                        <div class="form-field" *ngIf="form.get('EmpStatus')?.value === 'terminated' || form.get('EmpStatus')?.value === 'inactive'">
                            <label for="dateDepart">Date de Départ</label>
                            <p-datepicker id="dateDepart"
                                          formControlName="DateDepart_Emp"
                                          [showIcon]="true"
                                          dateFormat="dd/mm/yy"
                                          placeholder="Sélectionner une date"
                                          appendTo="body"
                                          styleClass="w-full">
                            </p-datepicker>
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
                            [label]="employee ? 'Mettre à jour' : 'Créer'"
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
        .employee-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .photo-section {
            display: flex;
            justify-content: center;
            padding: 1rem 0;
        }

        .photo-preview {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }

        .photo-actions {
            display: flex;
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

            label {
                font-weight: 500;
                font-size: 0.875rem;
                color: var(--text-color);
            }

            input, :host ::ng-deep .p-select, :host ::ng-deep .p-datepicker {
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

            .p-fileupload-choose {
                font-size: 0.875rem;
            }
        }

        @media (max-width: 576px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
        }
    `]
})
export class EmployeeFormDialogComponent implements OnInit, OnChanges {
    @Input() visible = false;
    @Input() employee: Employee | null = null;
    @Input() departments: Department[] = [];
    @Input() categories: EmployeeCategory[] = [];
    @Input() teams: Team[] = [];

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<{ employee: Partial<Employee>; photo: File | null }>();
    @Output() cancel = new EventEmitter<void>();

    form!: FormGroup;
    photoPreview: string | null = null;
    photoFile: File | null = null;
    saving = false;

    maxBirthDate = new Date();

    genderOptions = [
        { label: 'Homme', value: 'M' },
        { label: 'Femme', value: 'F' }
    ];

    statusOptions = [
        { label: 'Actif', value: 'active' },
        { label: 'En congé', value: 'on_leave' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Terminé', value: 'terminated' }
    ];

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService
    ) {
        this.maxBirthDate.setFullYear(this.maxBirthDate.getFullYear() - 18);
        this.initForm();
    }

    ngOnInit(): void {
        if (this.employee) {
            this.populateForm();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['employee'] && this.form) {
            if (this.employee) {
                this.populateForm();
            } else {
                this.form.reset({ EmpStatus: 'active' });
                this.photoPreview = null;
            }
        }

        if (changes['visible']) {
            if (this.visible) {
                // Reset saving state when dialog opens
                this.saving = false;
            } else {
                // Reset photo when dialog closes
                this.photoPreview = null;
                this.photoFile = null;
            }
        }
    }

    private initForm(): void {
        this.form = this.fb.group({
            Prenom_Emp: ['', [Validators.required, Validators.minLength(2)]],
            Nom_Emp: ['', [Validators.required, Validators.minLength(2)]],
            DateNaissance_Emp: [null],
            Genre_Emp: ['', Validators.required],
            BadgeNumber: [''],
            DateEmbauche_Emp: [null, Validators.required],
            Departement_Emp: ['', Validators.required],
            Categorie_Emp: ['', Validators.required],
            teamID: [null],
            EmpStatus: ['active', Validators.required],
            Phone_Emp: [''],
            Email_Emp: ['', [Validators.email]],
            CIN_Emp: [''],
            DateDepart_Emp: [null]
        });
    }

    private populateForm(): void {
        if (!this.employee) return;

        const emp = this.employee as any;
        // Map status to lowercase for form
        const status = (emp.EmpStatus || emp.status || 'active').toLowerCase().replace(' ', '_');

        this.form.patchValue({
            Prenom_Emp: emp.Prenom_Emp || emp.first_name,
            Nom_Emp: emp.Nom_Emp || emp.last_name,
            DateNaissance_Emp: emp.DateNaissance_Emp || emp.date_of_birth ? new Date(emp.DateNaissance_Emp || emp.date_of_birth) : null,
            Genre_Emp: emp.Genre_Emp || emp.gender,
            BadgeNumber: emp.BadgeNumber || emp.employee_id || '',
            DateEmbauche_Emp: emp.DateEmbauche_Emp || emp.hire_date ? new Date(emp.DateEmbauche_Emp || emp.hire_date) : null,
            Departement_Emp: emp.Departement_Emp || emp.department,
            Categorie_Emp: emp.Categorie_Emp || emp.category,
            teamID: emp.teamID || emp.team || null,
            EmpStatus: status,
            Phone_Emp: emp.Phone_Emp || emp.phone || '',
            Email_Emp: emp.Email_Emp || emp.email || '',
            CIN_Emp: emp.CIN_Emp || emp.cin || '',
            DateDepart_Emp: emp.DateDepart_Emp || emp.departure_date ? new Date(emp.DateDepart_Emp || emp.departure_date) : null
        });
    }

    getEmployeePhoto(): string | undefined {
        if (!this.employee?.Picture) return undefined;
        if (this.employee.Picture.startsWith('http')) return this.employee.Picture;
        // Ensure the path starts with /
        const picturePath = this.employee.Picture.startsWith('/') ? this.employee.Picture : `/${this.employee.Picture}`;
        return `${environment.mediaUrl}${picturePath}`;
    }

    getFormInitials(): string {
        const prenom = this.form.get('Prenom_Emp')?.value || '';
        const nom = this.form.get('Nom_Emp')?.value || '';
        return ((prenom.charAt(0) || '') + (nom.charAt(0) || '')).toUpperCase() || '?';
    }

    onPhotoSelect(event: any): void {
        const file = event.files?.[0];
        if (file) {
            this.photoFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.photoPreview = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    removePhoto(): void {
        this.photoPreview = null;
        this.photoFile = null;
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

        // Format dates to YYYY-MM-DD string format for the API
        const formData: Partial<Employee> = {
            ...formValue,
            Id_Emp: this.employee?.Id_Emp,
            DateNaissance_Emp: this.formatDate(formValue.DateNaissance_Emp),
            DateEmbauche_Emp: this.formatDate(formValue.DateEmbauche_Emp),
            DateDepart_Emp: this.formatDate(formValue.DateDepart_Emp)
        };

        // Remove null/undefined/empty string values to avoid backend validation issues
        Object.keys(formData).forEach(key => {
            const value = (formData as any)[key];
            if (value === null || value === undefined || value === '') {
                delete (formData as any)[key];
            }
        });

        // Emit both employee data and photo file
        this.save.emit({ employee: formData, photo: this.photoFile });
    }

    /**
     * Format a Date object to YYYY-MM-DD string for API
     */
    private formatDate(date: Date | string | null | undefined): string | null {
        if (!date) return null;

        if (typeof date === 'string') {
            // Already a string, check if it's a valid date format
            if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return date; // Already in YYYY-MM-DD format
            }
            // Try to parse the string as a date
            const parsed = new Date(date);
            if (!isNaN(parsed.getTime())) {
                return this.formatDateObject(parsed);
            }
            return null;
        }

        if (date instanceof Date && !isNaN(date.getTime())) {
            return this.formatDateObject(date);
        }

        return null;
    }

    private formatDateObject(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    onCancel(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.cancel.emit();
        this.form.reset({ EmpStatus: 'active' });
        this.photoPreview = null;
        this.photoFile = null;
        this.saving = false;
    }

    // Called by parent to reset saving state
    setSaving(value: boolean): void {
        this.saving = value;
    }
}
