/**
 * Processes List Component
 * Domain: DMS-RH
 *
 * Displays and manages manufacturing processes with grid cards layout
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
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';

// Domain imports
import { DmsFormationService } from '../../services/formation.service';
import { Process } from '../../models';
import { ProcessFormDialogComponent } from './process-form-dialog.component';

@Component({
    selector: 'app-processes-list',
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
        TagModule,
        ProcessFormDialogComponent
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="processes-list">
            <!-- Page Header -->
            <div class="hr-page-header">
                <div class="header-title">
                    <div class="header-icon">
                        <i class="pi pi-cog"></i>
                    </div>
                    <div class="title-text">
                        <h1>Processus</h1>
                        <span class="subtitle">Gérez les processus de fabrication</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button pButton pRipple
                            icon="pi pi-plus"
                            label="Nouveau Processus"
                            class="p-button-primary"
                            (click)="onAddProcess()">
                    </button>
                </div>
            </div>

            <!-- Stats Row -->
            <div class="stats-row">
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: var(--hr-primary);">
                        <i class="pi pi-cog"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ processes.length }}</div>
                        <div class="stat-label">Total Processus</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10B981;">
                        <i class="pi pi-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ getActiveCount() }}</div>
                        <div class="stat-label">Actifs</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1); color: #EF4444;">
                        <i class="pi pi-times-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ getInactiveCount() }}</div>
                        <div class="stat-label">Inactifs</div>
                    </div>
                </div>
            </div>

            <!-- Processes Section -->
            <div class="hr-section-card">
                <div class="section-header">
                    <span class="section-title">
                        <i class="pi pi-list"></i>
                        Liste des Processus
                    </span>
                </div>
                <div class="section-body">
                    <!-- Loading State -->
                    <div class="processes-grid" *ngIf="loading">
                        <div class="process-card-skeleton" *ngFor="let i of [1,2,3,4,5,6]">
                            <div class="skeleton-header">
                                <p-skeleton height="24px" width="60%"></p-skeleton>
                            </div>
                            <p-skeleton height="16px" width="40%" styleClass="mb-2"></p-skeleton>
                            <p-skeleton height="16px" width="80%"></p-skeleton>
                        </div>
                    </div>

                    <!-- Processes Grid -->
                    <div class="processes-grid" *ngIf="!loading && processes.length > 0">
                        <div class="hr-data-card process-card"
                             *ngFor="let process of processes"
                             pRipple>
                            <div class="card-header">
                                <div class="header-content">
                                    <div class="process-avatar">
                                        <span>{{ getProcessInitials(process) }}</span>
                                    </div>
                                    <div class="process-info">
                                        <h3 class="card-title">{{ process.name }}</h3>
                                    </div>
                                </div>
                                <p-tag [value]="process.is_active ? 'Actif' : 'Inactif'"
                                       [severity]="process.is_active ? 'success' : 'danger'">
                                </p-tag>
                            </div>
                            <div class="card-body">
                                <p class="process-description" *ngIf="process.description">
                                    {{ process.description }}
                                </p>
                                <p class="process-description no-desc" *ngIf="!process.description">
                                    Aucune description disponible
                                </p>
                            </div>
                            <div class="card-footer">
                                <div class="hr-action-buttons">
                                    <button pButton pRipple
                                            icon="pi pi-pencil"
                                            class="p-button-text p-button-rounded p-button-sm"
                                            (click)="onEditProcess(process)"
                                            pTooltip="Modifier">
                                    </button>
                                    <button pButton pRipple
                                            icon="pi pi-trash"
                                            class="p-button-text p-button-rounded p-button-sm p-button-danger"
                                            (click)="onDeleteProcess(process)"
                                            pTooltip="Supprimer">
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div class="hr-empty-state" *ngIf="!loading && processes.length === 0">
                        <i class="empty-icon pi pi-cog"></i>
                        <h3>Aucun processus trouvé</h3>
                        <p>Commencez par créer votre premier processus de fabrication</p>
                        <button pButton pRipple
                                label="Créer un Processus"
                                icon="pi pi-plus"
                                (click)="onAddProcess()">
                        </button>
                    </div>
                </div>
            </div>

            <!-- Form Dialog -->
            <app-process-form-dialog
                [(visible)]="showFormDialog"
                [process]="selectedProcess"
                (save)="onSaveProcess($event)"
                (cancel)="onCancelForm()">
            </app-process-form-dialog>

            <p-toast></p-toast>
            <p-confirmDialog></p-confirmDialog>
        </div>
    `,
    styles: [`
        .processes-list {
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

        /* Processes Grid */
        .processes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.25rem;
        }

        /* Process Card Skeleton */
        .process-card-skeleton {
            background: var(--surface-card);
            border-radius: 16px;
            padding: 1.25rem;
            border: 1px solid var(--surface-border);

            .skeleton-header {
                margin-bottom: 1rem;
            }
        }

        /* Process Card */
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

        .process-card {
            cursor: pointer;

            .card-header {
                padding: 1.25rem;
                background: transparent;
                border-bottom: none;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
            }

            .process-avatar {
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

            .process-info {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;

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

            .process-description {
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

            .processes-grid {
                grid-template-columns: 1fr;
            }
        }
    `]
})
export class ProcessesListComponent implements OnInit, OnDestroy {
    @ViewChild(ProcessFormDialogComponent) formDialog!: ProcessFormDialogComponent;

    processes: Process[] = [];
    loading = false;
    showFormDialog = false;
    selectedProcess: Process | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private formationService: DmsFormationService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadProcesses();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadProcesses(): void {
        this.loading = true;
        this.formationService.getProcesses()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (processes) => {
                    this.processes = processes;
                    this.loading = false;
                },
                error: (err) => {
                    this.loading = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Impossible de charger les processus'
                    });
                }
            });
    }

    getActiveCount(): number {
        return this.processes.filter(p => p.is_active).length;
    }

    getInactiveCount(): number {
        return this.processes.filter(p => !p.is_active).length;
    }

    getProcessInitials(process: Process): string {
        if (!process.name) return '?';
        const words = process.name.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return process.name.substring(0, 2).toUpperCase();
    }

    onAddProcess(): void {
        this.selectedProcess = null;
        this.showFormDialog = true;
    }

    onEditProcess(process: Process): void {
        this.selectedProcess = process;
        this.showFormDialog = true;
    }

    onDeleteProcess(process: Process): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer le processus "${process.name}" ?`,
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteProcess(process);
            }
        });
    }

    private deleteProcess(process: Process): void {
        if (!process.id) return;

        this.formationService.deleteProcess(process.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.processes = this.processes.filter(p => p.id !== process.id);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: `Processus "${process.name}" supprimé`
                    });
                },
                error: (err) => {
                    const detail = err?.error?.detail || 'Impossible de supprimer ce processus. Il est peut-être utilisé par des formations.';
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: detail
                    });
                }
            });
    }

    onSaveProcess(processData: Partial<Process>): void {
        if (this.selectedProcess) {
            // Update existing
            if (!this.selectedProcess.id) return;

            this.formationService.updateProcess(this.selectedProcess.id, processData)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (updated) => {
                        const index = this.processes.findIndex(p => p.id === this.selectedProcess?.id);
                        if (index !== -1) {
                            this.processes[index] = updated;
                            this.processes = [...this.processes];
                        }
                        this.showFormDialog = false;
                        this.formDialog?.setSaving(false);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: `Processus "${updated.name}" mis à jour`
                        });
                    },
                    error: (err) => {
                        this.formDialog?.setSaving(false);
                        const detail = err?.error?.code?.[0] || 'Impossible de mettre à jour le processus';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: detail
                        });
                    }
                });
        } else {
            // Create new
            this.formationService.createProcess(processData)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (created) => {
                        this.processes = [...this.processes, created];
                        this.showFormDialog = false;
                        this.formDialog?.setSaving(false);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: `Processus "${created.name}" créé`
                        });
                    },
                    error: (err) => {
                        this.formDialog?.setSaving(false);
                        const detail = err?.error?.code?.[0] || 'Impossible de créer le processus';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: detail
                        });
                    }
                });
        }
    }

    onCancelForm(): void {
        this.showFormDialog = false;
        this.selectedProcess = null;
    }
}
