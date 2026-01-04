/**
 * Team Form Dialog Component
 * Domain: DMS-RH
 *
 * Dialog form for creating and editing teams
 */
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { AvatarModule } from 'primeng/avatar';
import { ChipModule } from 'primeng/chip';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';

// Domain imports
import { Team, Employee } from '@domains/dms-rh';

@Component({
    selector: 'app-team-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DialogModule,
        InputTextModule,
        ButtonModule,
        SelectModule,
        ToastModule,
        RippleModule,
        DividerModule,
        TextareaModule,
        AvatarModule,
        ChipModule,
        MultiSelectModule
    ],
    providers: [MessageService],
    template: `
        <p-dialog [(visible)]="visible"
                  [header]="team ? 'Modifier Équipe' : 'Nouvelle Équipe'"
                  [modal]="true"
                  [style]="{width: '600px', maxWidth: '95vw'}"
                  [draggable]="false"
                  [resizable]="false"
                  styleClass="hr-dialog"
                  (onHide)="onCancel()">

            <form [formGroup]="form" class="team-form">
                <!-- Team Identity -->
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="pi pi-users"></i>
                        Identité de l'Équipe
                    </h3>

                    <div class="form-grid">
                        <div class="form-field">
                            <label for="name">Nom de l'Équipe *</label>
                            <input pInputText id="name" formControlName="name"
                                   placeholder="Ex: Équipe Production A" />
                            <small *ngIf="form.get('name')?.invalid && form.get('name')?.touched"
                                   class="p-error">
                                Le nom est requis (min. 2 caractères)
                            </small>
                        </div>

                        <div class="form-field">
                            <label for="code">Code Équipe *</label>
                            <input pInputText id="code" formControlName="code"
                                   placeholder="Ex: PROD-A"
                                   [style]="{'text-transform': 'uppercase'}" />
                            <small *ngIf="form.get('code')?.invalid && form.get('code')?.touched"
                                   class="p-error">
                                Le code est requis (3-10 caractères)
                            </small>
                        </div>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Team Leader -->
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="pi pi-star"></i>
                        Chef d'Équipe
                    </h3>

                    <div class="form-field">
                        <label for="leader">Sélectionner le Chef d'Équipe</label>
                        <p-select id="leader"
                                  formControlName="leaderId"
                                  [options]="availableLeaders"
                                  optionLabel="fullName"
                                  optionValue="Id_Emp"
                                  placeholder="Sélectionner un chef d'équipe"
                                  [filter]="true"
                                  filterPlaceholder="Rechercher..."
                                  [showClear]="true"
                                  appendTo="body"
                                  styleClass="w-full">
                            <ng-template let-employee pTemplate="item">
                                <div class="leader-option">
                                    <p-avatar [image]="getEmployeePhoto(employee)"
                                              [label]="!employee.Picture ? getInitials(employee) : undefined"
                                              shape="circle"
                                              size="normal"
                                              [style]="{'background': 'var(--hr-gradient)', 'color': 'white'}">
                                    </p-avatar>
                                    <div class="leader-info">
                                        <span class="leader-name">{{ employee.fullName }}</span>
                                        <span class="leader-dept">{{ employee.Departement_Emp }}</span>
                                    </div>
                                </div>
                            </ng-template>
                            <ng-template let-employee pTemplate="selectedItem">
                                <div class="leader-option" *ngIf="employee">
                                    <p-avatar [image]="getEmployeePhoto(employee)"
                                              [label]="!employee.Picture ? getInitials(employee) : undefined"
                                              shape="circle"
                                              size="normal"
                                              [style]="{'background': 'var(--hr-gradient)', 'color': 'white', 'width': '28px', 'height': '28px', 'font-size': '0.75rem'}">
                                    </p-avatar>
                                    <span>{{ employee.fullName }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                        <small class="field-hint">
                            Le chef d'équipe supervisera les membres de cette équipe
                        </small>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Team Members -->
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="pi pi-user-plus"></i>
                        Membres de l'Équipe
                    </h3>

                    <div class="form-field">
                        <label for="members">Sélectionner les Membres</label>
                        <p-multiselect id="members"
                                       formControlName="memberIds"
                                       [options]="availableMembers"
                                       optionLabel="fullName"
                                       optionValue="Id_Emp"
                                       placeholder="Sélectionner les membres"
                                       [filter]="true"
                                       filterPlaceholder="Rechercher..."
                                       [showClear]="true"
                                       [maxSelectedLabels]="3"
                                       selectedItemsLabel="{0} membres sélectionnés"
                                       appendTo="body"
                                       styleClass="w-full">
                            <ng-template let-employee pTemplate="item">
                                <div class="member-option">
                                    <p-avatar [image]="getEmployeePhoto(employee)"
                                              [label]="!employee.Picture ? getInitials(employee) : undefined"
                                              shape="circle"
                                              size="normal"
                                              [style]="{'background': 'var(--primary-color)', 'color': 'white', 'width': '28px', 'height': '28px', 'font-size': '0.75rem'}">
                                    </p-avatar>
                                    <span>{{ employee.fullName }}</span>
                                </div>
                            </ng-template>
                        </p-multiselect>
                        <small class="field-hint">
                            {{ form.get('memberIds')?.value?.length || 0 }} membre(s) sélectionné(s)
                        </small>
                    </div>

                    <!-- Selected Members Preview -->
                    <div class="selected-members" *ngIf="form.get('memberIds')?.value?.length > 0">
                        <div class="members-grid">
                            <p-chip *ngFor="let memberId of form.get('memberIds')?.value?.slice(0, 6)"
                                    [label]="getMemberName(memberId)"
                                    [removable]="true"
                                    (onRemove)="removeMember(memberId)"
                                    styleClass="member-chip">
                            </p-chip>
                            <p-chip *ngIf="form.get('memberIds')?.value?.length > 6"
                                    [label]="'+' + (form.get('memberIds')?.value?.length - 6) + ' autres'"
                                    styleClass="member-chip more-chip">
                            </p-chip>
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

                    <div class="form-field">
                        <label for="description">Description de l'Équipe</label>
                        <textarea pTextarea id="description"
                                  formControlName="description"
                                  rows="3"
                                  placeholder="Décrivez le rôle et les responsabilités de l'équipe..."
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
                            [label]="team ? 'Mettre à jour' : 'Créer'"
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
        .team-form {
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

            label {
                font-weight: 500;
                font-size: 0.875rem;
                color: var(--text-color);
            }

            input, textarea, :host ::ng-deep .p-select, :host ::ng-deep .p-multiselect {
                width: 100%;
            }
        }

        .field-hint {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }

        .leader-option, .member-option {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .leader-info {
            display: flex;
            flex-direction: column;

            .leader-name {
                font-weight: 500;
                color: var(--text-color);
            }

            .leader-dept {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
            }
        }

        .selected-members {
            margin-top: 0.75rem;
        }

        .members-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        :host ::ng-deep {
            .member-chip {
                background: var(--surface-100);
                border-radius: 16px;

                &.more-chip {
                    background: var(--hr-primary);
                    color: white;
                }
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
        }
    `]
})
export class TeamFormDialogComponent implements OnInit, OnChanges {
    @Input() visible = false;
    @Input() team: Team | null = null;
    @Input() employees: Employee[] = [];

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    form!: FormGroup;
    saving = false;

    availableLeaders: any[] = [];
    availableMembers: any[] = [];
    private apiUrl = '';

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.prepareEmployeeLists();
        if (this.team) {
            this.populateForm();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['employees']) {
            this.prepareEmployeeLists();
        }

        if (changes['team'] && this.form) {
            if (this.team) {
                this.populateForm();
            } else {
                this.form.reset();
            }
        }
    }

    private initForm(): void {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(10)]],
            leaderId: [null],
            memberIds: [[]],
            description: ['']
        });
    }

    private prepareEmployeeLists(): void {
        // Prepare employees with full name
        const preparedEmployees = this.employees.map(emp => ({
            ...emp,
            fullName: `${emp.Prenom_Emp} ${emp.Nom_Emp}`
        }));

        this.availableLeaders = preparedEmployees;
        this.availableMembers = preparedEmployees;
    }

    private populateForm(): void {
        if (!this.team) return;

        this.form.patchValue({
            name: this.team.name,
            code: this.team.code,
            leaderId: this.team.leader ? this.findEmployeeIdByName(this.team.leader) : null,
            memberIds: [], // Would need to fetch actual member IDs
            description: this.team.description || ''
        });
    }

    private findEmployeeIdByName(name: string): number | null {
        const employee = this.employees.find(e =>
            `${e.Prenom_Emp} ${e.Nom_Emp}` === name
        );
        return employee?.Id_Emp || null;
    }

    getEmployeePhoto(employee: any): string | undefined {
        if (!employee?.Picture) return undefined;
        if (employee.Picture.startsWith('http')) return employee.Picture;
        return `${this.apiUrl}${employee.Picture}`;
    }

    getInitials(employee: any): string {
        const first = employee?.Prenom_Emp?.charAt(0) || '';
        const last = employee?.Nom_Emp?.charAt(0) || '';
        return (first + last).toUpperCase() || '?';
    }

    getMemberName(memberId: number): string {
        const employee = this.employees.find(e => e.Id_Emp === memberId);
        return employee ? `${employee.Prenom_Emp} ${employee.Nom_Emp}` : 'Unknown';
    }

    removeMember(memberId: number): void {
        const currentMembers = this.form.get('memberIds')?.value || [];
        const updatedMembers = currentMembers.filter((id: number) => id !== memberId);
        this.form.patchValue({ memberIds: updatedMembers });
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

        const teamData = {
            id: this.team?.id,
            name: formValue.name,
            code: formValue.code.toUpperCase(),
            description: formValue.description,
            leaderId: formValue.leaderId,
            memberIds: formValue.memberIds
        };

        this.save.emit(teamData);
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
