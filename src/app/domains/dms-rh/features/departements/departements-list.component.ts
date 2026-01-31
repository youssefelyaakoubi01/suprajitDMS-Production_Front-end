/**
 * Departements List Component
 * Domain: DMS-RH
 *
 * Displays and manages departements with grid cards layout
 */
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { RippleModule } from 'primeng/ripple';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Domain imports
import { DmsEmployeeService, Departement } from '@domains/dms-rh';
import { DepartementFormDialogComponent } from './departement-form-dialog.component';

@Component({
    selector: 'app-departements-list',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        TooltipModule,
        ToastModule,
        SkeletonModule,
        RippleModule,
        ConfirmDialogModule,
        DepartementFormDialogComponent
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="departements-list">
            <!-- Page Header -->
            <div class="hr-page-header">
                <div class="header-title">
                    <div class="header-icon">
                        <i class="pi pi-building"></i>
                    </div>
                    <div class="title-text">
                        <h1>Départements</h1>
                        <span class="subtitle">Gérez les départements de l'entreprise</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button pButton pRipple
                            icon="pi pi-plus"
                            label="Nouveau Département"
                            class="p-button-primary"
                            (click)="onAddDepartement()">
                    </button>
                </div>
            </div>

            <!-- Stats Row -->
            <div class="stats-row">
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: var(--hr-primary);">
                        <i class="pi pi-building"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ departements.length }}</div>
                        <div class="stat-label">Total Départements</div>
                    </div>
                </div>
            </div>

            <!-- Departements Section -->
            <div class="hr-section-card">
                <div class="section-header">
                    <span class="section-title">
                        <i class="pi pi-list"></i>
                        Liste des Départements
                    </span>
                </div>
                <div class="section-body">
                    <!-- Loading State -->
                    <div class="departements-grid" *ngIf="loading">
                        <div class="departement-card-skeleton" *ngFor="let i of [1,2,3,4,5,6]">
                            <div class="skeleton-header">
                                <p-skeleton height="24px" width="60%"></p-skeleton>
                            </div>
                            <p-skeleton height="16px" width="80%" styleClass="mb-2"></p-skeleton>
                            <p-skeleton height="16px" width="50%"></p-skeleton>
                        </div>
                    </div>

                    <!-- Departements Grid -->
                    <div class="departements-grid" *ngIf="!loading && departements.length > 0">
                        <div class="hr-data-card departement-card"
                             *ngFor="let departement of departements"
                             pRipple>
                            <div class="card-header">
                                <div class="header-content">
                                    <div class="departement-avatar">
                                        <span>{{ getDepartementInitials(departement) }}</span>
                                    </div>
                                    <div class="departement-info">
                                        <h3 class="card-title">{{ departement.name }}</h3>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body">
                                <p class="departement-description" *ngIf="departement.description">
                                    {{ departement.description }}
                                </p>
                                <p class="departement-description no-desc" *ngIf="!departement.description">
                                    Aucune description disponible
                                </p>
                            </div>
                            <div class="card-footer">
                                <div class="hr-action-buttons">
                                    <button pButton pRipple
                                            icon="pi pi-pencil"
                                            class="p-button-text p-button-rounded p-button-sm"
                                            (click)="onEditDepartement(departement)"
                                            pTooltip="Modifier">
                                    </button>
                                    <button pButton pRipple
                                            icon="pi pi-trash"
                                            class="p-button-text p-button-rounded p-button-sm p-button-danger"
                                            (click)="onDeleteDepartement(departement)"
                                            pTooltip="Supprimer">
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div class="hr-empty-state" *ngIf="!loading && departements.length === 0">
                        <i class="empty-icon pi pi-building"></i>
                        <h3>Aucun département trouvé</h3>
                        <p>Commencez par créer votre premier département</p>
                        <button pButton pRipple
                                label="Créer un Département"
                                icon="pi pi-plus"
                                (click)="onAddDepartement()">
                        </button>
                    </div>
                </div>
            </div>

            <!-- Form Dialog -->
            <app-departement-form-dialog
                [(visible)]="showFormDialog"
                [departement]="selectedDepartement"
                (save)="onSaveDepartement($event)"
                (cancel)="onCancelForm()">
            </app-departement-form-dialog>

            <p-toast></p-toast>
            <p-confirmDialog></p-confirmDialog>
        </div>
    `,
    styles: [`
        .departements-list {
            padding: 1.5rem;
        }

        /* Page Header */
        .hr-page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .header-title {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .header-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: var(--hr-gradient, linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%));
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }

        .title-text {
            h1 {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 600;
                color: var(--text-color);
            }

            .subtitle {
                font-size: 0.875rem;
                color: var(--text-color-secondary);
            }
        }

        /* Stats Row */
        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .hr-stat-card {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1.25rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            border: 1px solid var(--surface-border);
        }

        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
        }

        .stat-value {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--text-color);
        }

        .stat-label {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
        }

        /* Section Card */
        .hr-section-card {
            background: var(--surface-card);
            border-radius: 16px;
            border: 1px solid var(--surface-border);
            overflow: hidden;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 1.5rem;
            background: var(--surface-50);
            border-bottom: 1px solid var(--surface-border);
        }

        .section-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 600;
            font-size: 1rem;
            color: var(--text-color);

            i {
                color: var(--hr-primary, #8B5CF6);
            }
        }

        .section-body {
            padding: 1.5rem;
        }

        /* Departements Grid */
        .departements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.25rem;
        }

        /* Departement Card Skeleton */
        .departement-card-skeleton {
            background: var(--surface-card);
            border-radius: 16px;
            padding: 1.25rem;
            border: 1px solid var(--surface-border);

            .skeleton-header {
                margin-bottom: 1rem;
            }
        }

        /* Departement Card */
        .hr-data-card {
            background: var(--surface-card);
            border-radius: 16px;
            border: 1px solid var(--surface-border);
            transition: all 0.2s ease;

            &:hover {
                border-color: var(--hr-primary, #8B5CF6);
                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
            }
        }

        .departement-card {
            cursor: pointer;

            .card-header {
                padding: 1.25rem;
                background: transparent;
                border-bottom: none;

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
            }

            .departement-avatar {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                background: var(--hr-gradient, linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%));
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 1.125rem;
            }

            .departement-info {
                display: flex;
                flex-direction: column;
                gap: 0.375rem;

                .card-title {
                    margin: 0;
                    font-size: 1.0625rem;
                    font-weight: 600;
                    color: var(--text-color);
                }
            }

            .card-body {
                padding: 0 1.25rem 1.25rem;
            }

            .departement-description {
                font-size: 0.875rem;
                color: var(--text-color-secondary);
                margin: 0;
                line-height: 1.5;

                &.no-desc {
                    font-style: italic;
                    opacity: 0.7;
                }
            }

            .card-footer {
                padding: 0.75rem 1.25rem;
                border-top: 1px solid var(--surface-border);
                display: flex;
                justify-content: flex-end;
            }
        }

        .hr-action-buttons {
            display: flex;
            gap: 0.25rem;
        }

        /* Empty State */
        .hr-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            text-align: center;

            .empty-icon {
                font-size: 4rem;
                color: var(--surface-300);
                margin-bottom: 1.5rem;
            }

            h3 {
                margin: 0 0 0.5rem;
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--text-color);
            }

            p {
                margin: 0 0 1.5rem;
                color: var(--text-color-secondary);
            }
        }

        @media (max-width: 768px) {
            .hr-page-header {
                flex-direction: column;
                align-items: flex-start;
            }

            .departements-grid {
                grid-template-columns: 1fr;
            }
        }
    `]
})
export class DepartementsListComponent implements OnInit, OnDestroy {
    @ViewChild(DepartementFormDialogComponent) formDialog!: DepartementFormDialogComponent;

    departements: Departement[] = [];
    loading = false;
    showFormDialog = false;
    selectedDepartement: Departement | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private employeeService: DmsEmployeeService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadDepartements();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadDepartements(): void {
        this.loading = true;
        this.employeeService.getDepartements()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (departements) => {
                    this.departements = departements;
                    this.loading = false;
                },
                error: (err) => {
                    this.loading = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Impossible de charger les départements'
                    });
                }
            });
    }

    getDepartementInitials(departement: Departement): string {
        if (!departement.name) return '?';
        const words = departement.name.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return departement.name.substring(0, 2).toUpperCase();
    }

    onAddDepartement(): void {
        this.selectedDepartement = null;
        this.showFormDialog = true;
    }

    onEditDepartement(departement: Departement): void {
        this.selectedDepartement = departement;
        this.showFormDialog = true;
    }

    onDeleteDepartement(departement: Departement): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer le département "${departement.name}" ?`,
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteDepartement(departement);
            }
        });
    }

    private deleteDepartement(departement: Departement): void {
        if (!departement.id) return;

        this.employeeService.deleteDepartement(departement.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.departements = this.departements.filter(d => d.id !== departement.id);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: `Département "${departement.name}" supprimé`
                    });
                },
                error: (err) => {
                    const detail = err?.error?.detail || 'Impossible de supprimer ce département. Il est peut-être utilisé par des employés.';
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: detail
                    });
                }
            });
    }

    onSaveDepartement(departementData: Partial<Departement>): void {
        if (this.selectedDepartement) {
            // Update existing
            const id = this.selectedDepartement.id;
            if (!id) return;

            this.employeeService.updateDepartement(id, departementData)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (updated) => {
                        const index = this.departements.findIndex(d => d.id === id);
                        if (index !== -1) {
                            this.departements[index] = updated;
                            this.departements = [...this.departements];
                        }
                        this.showFormDialog = false;
                        this.formDialog?.setSaving(false);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: `Département "${updated.name}" mis à jour`
                        });
                    },
                    error: (err) => {
                        this.formDialog?.setSaving(false);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: 'Impossible de mettre à jour le département'
                        });
                    }
                });
        } else {
            // Create new
            this.employeeService.createDepartement(departementData)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (created) => {
                        this.departements = [...this.departements, created];
                        this.showFormDialog = false;
                        this.formDialog?.setSaving(false);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: `Département "${created.name}" créé`
                        });
                    },
                    error: (err) => {
                        this.formDialog?.setSaving(false);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: 'Impossible de créer le département'
                        });
                    }
                });
        }
    }

    onCancelForm(): void {
        this.showFormDialog = false;
        this.selectedDepartement = null;
    }
}
