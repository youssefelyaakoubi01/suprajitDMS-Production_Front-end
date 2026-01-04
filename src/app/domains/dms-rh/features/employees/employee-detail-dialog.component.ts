/**
 * Employee Detail Dialog Component
 * Domain: DMS-RH
 *
 * Read-only dialog to view employee details
 */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';

// Domain imports
import { Employee } from '@domains/dms-rh';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-employee-detail-dialog',
    standalone: true,
    imports: [
        CommonModule,
        DialogModule,
        ButtonModule,
        AvatarModule,
        TagModule,
        DividerModule,
        RippleModule,
        TooltipModule
    ],
    template: `
        <p-dialog [(visible)]="visible"
                  [header]="'Fiche Employé'"
                  [modal]="true"
                  [style]="{width: '750px', maxWidth: '95vw'}"
                  [draggable]="false"
                  [resizable]="false"
                  styleClass="employee-detail-dialog"
                  (onHide)="onClose()">

            <div class="employee-detail" *ngIf="employee">
                <!-- Header Section with Photo -->
                <div class="detail-header">
                    <div class="employee-photo">
                        <p-avatar [image]="getEmployeePhoto()"
                                  [label]="!hasPhoto() ? getInitials() : undefined"
                                  shape="circle"
                                  [style]="{'width': '120px', 'height': '120px', 'font-size': '2.5rem', 'background': 'var(--hr-gradient)', 'color': 'white'}">
                        </p-avatar>
                        <p-tag [value]="getStatusLabel()"
                               [severity]="getStatusSeverity()"
                               styleClass="status-tag">
                        </p-tag>
                    </div>
                    <div class="employee-header-info">
                        <h2 class="employee-name">{{ getFirstName() }} {{ getLastName() }}</h2>
                        <div class="employee-badges">
                            <span class="badge-item" *ngIf="getBadgeNumber()">
                                <i class="pi pi-id-card"></i>
                                {{ getBadgeNumber() }}
                            </span>
                            <span class="badge-item" *ngIf="getCIN()">
                                <i class="pi pi-credit-card"></i>
                                {{ getCIN() }}
                            </span>
                        </div>
                        <div class="employee-category">
                            <p-tag [value]="getCategory()"
                                   [severity]="getCategorySeverity()"
                                   [rounded]="true">
                            </p-tag>
                            <span class="department-text" *ngIf="getDepartment()">
                                <i class="pi pi-building"></i>
                                {{ getDepartment() }}
                            </span>
                        </div>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Personal Information -->
                <div class="detail-section">
                    <h3 class="section-title">
                        <i class="pi pi-user"></i>
                        Informations Personnelles
                    </h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Prénom</span>
                            <span class="info-value">{{ getFirstName() }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Nom</span>
                            <span class="info-value">{{ getLastName() }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Date de Naissance</span>
                            <span class="info-value">{{ formatDate(getDateOfBirth()) }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Genre</span>
                            <span class="info-value">{{ getGenderLabel() }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">CIN</span>
                            <span class="info-value">{{ getCIN() || '-' }}</span>
                        </div>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Professional Information -->
                <div class="detail-section">
                    <h3 class="section-title">
                        <i class="pi pi-briefcase"></i>
                        Informations Professionnelles
                    </h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Numéro de Badge</span>
                            <span class="info-value badge-value">{{ getBadgeNumber() || '-' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Date d'Embauche</span>
                            <span class="info-value">{{ formatDate(getHireDate()) }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Département</span>
                            <span class="info-value">{{ getDepartment() || '-' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Catégorie</span>
                            <span class="info-value">{{ getCategory() }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Équipe</span>
                            <span class="info-value">{{ getTeamName() || '-' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Statut</span>
                            <span class="info-value">
                                <p-tag [value]="getStatusLabel()"
                                       [severity]="getStatusSeverity()"
                                       [rounded]="true">
                                </p-tag>
                            </span>
                        </div>
                        <div class="info-item" *ngIf="getDepartureDate()">
                            <span class="info-label">Date de Départ</span>
                            <span class="info-value text-danger">{{ formatDate(getDepartureDate()) }}</span>
                        </div>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Contact Information -->
                <div class="detail-section">
                    <h3 class="section-title">
                        <i class="pi pi-phone"></i>
                        Informations de Contact
                    </h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Téléphone</span>
                            <span class="info-value">
                                <a *ngIf="getPhone()" [href]="'tel:' + getPhone()" class="contact-link">
                                    <i class="pi pi-phone"></i>
                                    {{ getPhone() }}
                                </a>
                                <span *ngIf="!getPhone()">-</span>
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Email</span>
                            <span class="info-value">
                                <a *ngIf="getEmail()" [href]="'mailto:' + getEmail()" class="contact-link">
                                    <i class="pi pi-envelope"></i>
                                    {{ getEmail() }}
                                </a>
                                <span *ngIf="!getEmail()">-</span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Qualification Info (if available) -->
                <ng-container *ngIf="getCurrentQualification()">
                    <p-divider></p-divider>
                    <div class="detail-section">
                        <h3 class="section-title">
                            <i class="pi pi-graduation-cap"></i>
                            Qualification Actuelle
                        </h3>
                        <div class="info-grid">
                            <div class="info-item full-width">
                                <span class="info-label">Formation</span>
                                <span class="info-value">{{ getCurrentQualification() }}</span>
                            </div>
                            <div class="info-item" *ngIf="getCurrentQualificationLevel()">
                                <span class="info-label">Niveau</span>
                                <span class="info-value">{{ getCurrentQualificationLevel() }}</span>
                            </div>
                            <div class="info-item" *ngIf="getLastQualificationDate()">
                                <span class="info-label">Dernière Qualification</span>
                                <span class="info-value">{{ formatDate(getLastQualificationDate()) }}</span>
                            </div>
                        </div>
                    </div>
                </ng-container>
            </div>

            <ng-template pTemplate="footer">
                <div class="dialog-footer">
                    <button pButton pRipple
                            type="button"
                            label="Modifier"
                            icon="pi pi-pencil"
                            class="p-button-outlined"
                            (click)="onEdit()">
                    </button>
                    <button pButton pRipple
                            type="button"
                            label="Fermer"
                            icon="pi pi-times"
                            class="p-button-secondary"
                            (click)="onClose()">
                    </button>
                </div>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        .employee-detail {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        /* Header Section */
        .detail-header {
            display: flex;
            gap: 1.5rem;
            align-items: flex-start;
            padding: 1rem 0;
        }

        .employee-photo {
            position: relative;
            flex-shrink: 0;
        }

        .employee-photo :host ::ng-deep .status-tag {
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
        }

        .employee-header-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .employee-name {
            margin: 0;
            font-size: 1.75rem;
            font-weight: 600;
            color: var(--text-color);
        }

        .employee-badges {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .badge-item {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            background: var(--surface-100);
            border-radius: 6px;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-color);

            i {
                color: var(--primary-color);
            }
        }

        .employee-category {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .department-text {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-color-secondary);
            font-size: 0.9rem;

            i {
                font-size: 0.875rem;
            }
        }

        /* Sections */
        .detail-section {
            padding: 0.5rem 0;
        }

        .section-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin: 0 0 1rem 0;
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-color);

            i {
                color: var(--hr-primary, #8B5CF6);
                font-size: 1.1rem;
            }
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem 2rem;
        }

        .info-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            &.full-width {
                grid-column: span 2;
            }
        }

        .info-label {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--text-color-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-value {
            font-size: 0.9375rem;
            color: var(--text-color);
            font-weight: 500;

            &.badge-value {
                font-family: 'JetBrains Mono', 'Fira Code', monospace;
                color: var(--primary-color);
            }

            &.text-danger {
                color: var(--red-500);
            }
        }

        .contact-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--primary-color);
            text-decoration: none;
            transition: color 0.2s;

            &:hover {
                color: var(--primary-700);
                text-decoration: underline;
            }

            i {
                font-size: 0.875rem;
            }
        }

        /* Footer */
        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            padding-top: 0.5rem;
        }

        /* Dialog Styling */
        :host ::ng-deep {
            .employee-detail-dialog {
                .p-dialog-header {
                    background: var(--surface-50);
                    border-bottom: 1px solid var(--surface-border);
                    padding: 1.25rem 1.5rem;
                }

                .p-dialog-content {
                    padding: 1rem 1.5rem;
                }

                .p-dialog-footer {
                    border-top: 1px solid var(--surface-border);
                    padding: 1rem 1.5rem;
                }
            }
        }

        /* Responsive */
        @media (max-width: 576px) {
            .detail-header {
                flex-direction: column;
                align-items: center;
                text-align: center;
            }

            .employee-header-info {
                align-items: center;
            }

            .employee-badges {
                justify-content: center;
            }

            .employee-category {
                flex-direction: column;
            }

            .info-grid {
                grid-template-columns: 1fr;
            }

            .info-item.full-width {
                grid-column: span 1;
            }
        }
    `]
})
export class EmployeeDetailDialogComponent {
    @Input() visible = false;
    @Input() employee: Employee | null = null;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() close = new EventEmitter<void>();
    @Output() edit = new EventEmitter<Employee>();

    getEmployeePhoto(): string | undefined {
        const emp = this.employee as any;
        const picture = emp?.Picture || emp?.picture;
        if (!picture) return undefined;
        if (picture.startsWith('http')) return picture;
        // Ensure the path starts with /
        const picturePath = picture.startsWith('/') ? picture : `/${picture}`;
        return `${environment.mediaUrl}${picturePath}`;
    }

    hasPhoto(): boolean {
        const emp = this.employee as any;
        return !!(emp?.Picture || emp?.picture);
    }

    getInitials(): string {
        const prenom = this.getFirstName();
        const nom = this.getLastName();
        return ((prenom.charAt(0) || '') + (nom.charAt(0) || '')).toUpperCase() || '?';
    }

    getFirstName(): string {
        const emp = this.employee as any;
        return emp?.Prenom_Emp || emp?.first_name || '-';
    }

    getLastName(): string {
        const emp = this.employee as any;
        return emp?.Nom_Emp || emp?.last_name || '-';
    }

    getDateOfBirth(): string | null {
        const emp = this.employee as any;
        return emp?.DateNaissance_Emp || emp?.date_of_birth || null;
    }

    getHireDate(): string | null {
        const emp = this.employee as any;
        return emp?.DateEmbauche_Emp || emp?.hire_date || null;
    }

    getCategory(): string {
        const emp = this.employee as any;
        return emp?.Categorie_Emp || emp?.category || '-';
    }

    getBadgeNumber(): string | null {
        const emp = this.employee as any;
        return emp?.BadgeNumber || emp?.employee_id || null;
    }

    getCIN(): string | null {
        const emp = this.employee as any;
        return emp?.CIN_Emp || emp?.cin || null;
    }

    getDepartment(): string | null {
        const emp = this.employee as any;
        return emp?.Departement_Emp || emp?.department || null;
    }

    getTeamName(): string | null {
        const emp = this.employee as any;
        const team = emp?.team_detail || emp?.team;
        if (team && typeof team === 'object') {
            return team.name;
        }
        return null;
    }

    getPhone(): string | null {
        const emp = this.employee as any;
        return emp?.Phone_Emp || emp?.phone || null;
    }

    getEmail(): string | null {
        const emp = this.employee as any;
        return emp?.Email_Emp || emp?.email || null;
    }

    getDepartureDate(): string | null {
        const emp = this.employee as any;
        return emp?.DateDepart_Emp || emp?.departure_date || null;
    }

    getCurrentQualification(): string | null {
        const emp = this.employee as any;
        return emp?.current_qualification || null;
    }

    getCurrentQualificationLevel(): string | null {
        const emp = this.employee as any;
        return emp?.current_qualification_level || null;
    }

    getLastQualificationDate(): string | null {
        const emp = this.employee as any;
        return emp?.last_qualification_date || null;
    }

    getGenderLabel(): string {
        const gender = this.employee?.Genre_Emp || (this.employee as any)?.gender;
        if (gender === 'M') return 'Homme';
        if (gender === 'F') return 'Femme';
        return '-';
    }

    getStatusLabel(): string {
        const status = this.employee?.EmpStatus || (this.employee as any)?.status || 'active';
        const map: Record<string, string> = {
            'active': 'Actif',
            'Active': 'Actif',
            'inactive': 'Inactif',
            'Inactive': 'Inactif',
            'on_leave': 'En congé',
            'On Leave': 'En congé',
            'terminated': 'Terminé',
            'Terminated': 'Terminé',
            'training': 'Formation',
            'Training': 'Formation'
        };
        return map[status] || status;
    }

    getStatusSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const status = this.employee?.EmpStatus || (this.employee as any)?.status || 'active';
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            'active': 'success',
            'Active': 'success',
            'inactive': 'danger',
            'Inactive': 'danger',
            'on_leave': 'warn',
            'On Leave': 'warn',
            'terminated': 'danger',
            'Terminated': 'danger',
            'training': 'info',
            'Training': 'info'
        };
        return map[status] || 'success';
    }

    getCategorySeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const emp = this.employee as any;
        const category = emp?.Categorie_Emp || emp?.category || '';
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            'operator': 'info',
            'Operator': 'info',
            'team_leader': 'success',
            'Team Leader': 'success',
            'supervisor': 'warn',
            'Supervisor': 'warn',
            'manager': 'danger',
            'Manager': 'danger',
            'technician': 'secondary',
            'Technician': 'secondary'
        };
        return map[category] || 'info';
    }

    formatDate(date: string | Date | null | undefined): string {
        if (!date) return '-';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    onClose(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.close.emit();
    }

    onEdit(): void {
        if (this.employee) {
            this.edit.emit(this.employee);
            this.onClose();
        }
    }
}
