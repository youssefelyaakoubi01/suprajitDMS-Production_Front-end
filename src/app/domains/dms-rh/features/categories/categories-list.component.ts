/**
 * Categories List Component
 * Domain: DMS-RH
 *
 * Displays and manages employee categories with grid cards layout
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
import { DmsEmployeeService, EmployeeCategory } from '@domains/dms-rh';
import { CategoryFormDialogComponent } from './category-form-dialog.component';

@Component({
    selector: 'app-categories-list',
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
        CategoryFormDialogComponent
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="categories-list">
            <!-- Page Header -->
            <div class="hr-page-header">
                <div class="header-title">
                    <div class="header-icon">
                        <i class="pi pi-tag"></i>
                    </div>
                    <div class="title-text">
                        <h1>Catégories d'Employés</h1>
                        <span class="subtitle">Gérez les types de contrats et catégories</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button pButton pRipple
                            icon="pi pi-plus"
                            label="Nouvelle Catégorie"
                            class="p-button-primary"
                            (click)="onAddCategory()">
                    </button>
                </div>
            </div>

            <!-- Stats Row -->
            <div class="stats-row">
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: var(--hr-primary);">
                        <i class="pi pi-tag"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ categories.length }}</div>
                        <div class="stat-label">Total Catégories</div>
                    </div>
                </div>
            </div>

            <!-- Categories Section -->
            <div class="hr-section-card">
                <div class="section-header">
                    <span class="section-title">
                        <i class="pi pi-list"></i>
                        Liste des Catégories
                    </span>
                </div>
                <div class="section-body">
                    <!-- Loading State -->
                    <div class="categories-grid" *ngIf="loading">
                        <div class="category-card-skeleton" *ngFor="let i of [1,2,3,4,5,6]">
                            <div class="skeleton-header">
                                <p-skeleton height="24px" width="60%"></p-skeleton>
                            </div>
                            <p-skeleton height="16px" width="80%" styleClass="mb-2"></p-skeleton>
                            <p-skeleton height="16px" width="50%"></p-skeleton>
                        </div>
                    </div>

                    <!-- Categories Grid -->
                    <div class="categories-grid" *ngIf="!loading && categories.length > 0">
                        <div class="hr-data-card category-card"
                             *ngFor="let category of categories"
                             pRipple>
                            <div class="card-header">
                                <div class="header-content">
                                    <div class="category-avatar">
                                        <span>{{ getCategoryInitials(category) }}</span>
                                    </div>
                                    <div class="category-info">
                                        <h3 class="card-title">{{ category.name }}</h3>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body">
                                <p class="category-description" *ngIf="category.description">
                                    {{ category.description }}
                                </p>
                                <p class="category-description no-desc" *ngIf="!category.description">
                                    Aucune description disponible
                                </p>
                            </div>
                            <div class="card-footer">
                                <div class="hr-action-buttons">
                                    <button pButton pRipple
                                            icon="pi pi-pencil"
                                            class="p-button-text p-button-rounded p-button-sm"
                                            (click)="onEditCategory(category)"
                                            pTooltip="Modifier">
                                    </button>
                                    <button pButton pRipple
                                            icon="pi pi-trash"
                                            class="p-button-text p-button-rounded p-button-sm p-button-danger"
                                            (click)="onDeleteCategory(category)"
                                            pTooltip="Supprimer">
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div class="hr-empty-state" *ngIf="!loading && categories.length === 0">
                        <i class="empty-icon pi pi-tag"></i>
                        <h3>Aucune catégorie trouvée</h3>
                        <p>Commencez par créer votre première catégorie d'employé</p>
                        <button pButton pRipple
                                label="Créer une Catégorie"
                                icon="pi pi-plus"
                                (click)="onAddCategory()">
                        </button>
                    </div>
                </div>
            </div>

            <!-- Form Dialog -->
            <app-category-form-dialog
                [(visible)]="showFormDialog"
                [category]="selectedCategory"
                (save)="onSaveCategory($event)"
                (cancel)="onCancelForm()">
            </app-category-form-dialog>

            <p-toast></p-toast>
            <p-confirmDialog></p-confirmDialog>
        </div>
    `,
    styles: [`
        .categories-list {
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

        /* Categories Grid */
        .categories-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.25rem;
        }

        /* Category Card Skeleton */
        .category-card-skeleton {
            background: var(--surface-card);
            border-radius: 16px;
            padding: 1.25rem;
            border: 1px solid var(--surface-border);

            .skeleton-header {
                margin-bottom: 1rem;
            }
        }

        /* Category Card */
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

        .category-card {
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

            .category-avatar {
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

            .category-info {
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

            .category-description {
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

            .categories-grid {
                grid-template-columns: 1fr;
            }
        }
    `]
})
export class CategoriesListComponent implements OnInit, OnDestroy {
    @ViewChild(CategoryFormDialogComponent) formDialog!: CategoryFormDialogComponent;

    categories: EmployeeCategory[] = [];
    loading = false;
    showFormDialog = false;
    selectedCategory: EmployeeCategory | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private employeeService: DmsEmployeeService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadCategories();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadCategories(): void {
        this.loading = true;
        this.employeeService.getEmployeeCategories()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (categories) => {
                    this.categories = categories;
                    this.loading = false;
                },
                error: (err) => {
                    this.loading = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Impossible de charger les catégories'
                    });
                }
            });
    }

    getCategoryInitials(category: EmployeeCategory): string {
        if (!category.name) return '?';
        const words = category.name.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return category.name.substring(0, 2).toUpperCase();
    }

    onAddCategory(): void {
        this.selectedCategory = null;
        this.showFormDialog = true;
    }

    onEditCategory(category: EmployeeCategory): void {
        this.selectedCategory = category;
        this.showFormDialog = true;
    }

    onDeleteCategory(category: EmployeeCategory): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`,
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteCategory(category);
            }
        });
    }

    private deleteCategory(category: EmployeeCategory): void {
        const id = category.id || category.IDEmployeeCategory;
        if (!id) return;

        this.employeeService.deleteEmployeeCategory(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.categories = this.categories.filter(c =>
                        (c.id || c.IDEmployeeCategory) !== id
                    );
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: `Catégorie "${category.name}" supprimée`
                    });
                },
                error: (err) => {
                    const detail = err?.error?.detail || 'Impossible de supprimer cette catégorie. Elle est peut-être utilisée par des employés.';
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: detail
                    });
                }
            });
    }

    onSaveCategory(categoryData: Partial<EmployeeCategory>): void {
        if (this.selectedCategory) {
            // Update existing
            const id = this.selectedCategory.id || this.selectedCategory.IDEmployeeCategory;
            if (!id) return;

            this.employeeService.updateEmployeeCategory(id, categoryData)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (updated) => {
                        const index = this.categories.findIndex(c =>
                            (c.id || c.IDEmployeeCategory) === id
                        );
                        if (index !== -1) {
                            this.categories[index] = updated;
                            this.categories = [...this.categories];
                        }
                        this.showFormDialog = false;
                        this.formDialog?.setSaving(false);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: `Catégorie "${updated.name}" mise à jour`
                        });
                    },
                    error: (err) => {
                        this.formDialog?.setSaving(false);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: 'Impossible de mettre à jour la catégorie'
                        });
                    }
                });
        } else {
            // Create new
            this.employeeService.createEmployeeCategory(categoryData)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (created) => {
                        this.categories = [...this.categories, created];
                        this.showFormDialog = false;
                        this.formDialog?.setSaving(false);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: `Catégorie "${created.name}" créée`
                        });
                    },
                    error: (err) => {
                        this.formDialog?.setSaving(false);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: 'Impossible de créer la catégorie'
                        });
                    }
                });
        }
    }

    onCancelForm(): void {
        this.showFormDialog = false;
        this.selectedCategory = null;
    }
}
