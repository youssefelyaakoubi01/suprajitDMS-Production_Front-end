/**
 * Non-Qualified Assignments Component
 * Domain: DMS-RH
 *
 * Displays and manages assignments where employees were assigned to workstations
 * without valid qualifications for traceability and compliance purposes.
 */
import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

// PrimeNG
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Services
import { HRService } from '@core/services/hr.service';
import { NonQualifiedAssignment, NonQualifiedAssignmentStats } from '../../models/non-qualified-assignment.model';

@Component({
    selector: 'app-non-qualified-assignments',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        CardModule,
        ButtonModule,
        TagModule,
        AvatarModule,
        TooltipModule,
        SkeletonModule,
        BadgeModule,
        RippleModule,
        MessageModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        SelectModule,
        DialogModule,
        TextareaModule,
        ToastModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="non-qualified-assignments-list">
            <!-- Page Header -->
            <div class="hr-page-header">
                <div class="header-title">
                    <div class="header-icon" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);">
                        <i class="pi pi-exclamation-triangle"></i>
                    </div>
                    <div class="title-text">
                        <h1>Affectations Non Qualifiées</h1>
                        <span class="subtitle">Suivi des employés affectés sans qualification valide</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button pButton pRipple
                            icon="pi pi-refresh"
                            label="Actualiser"
                            class="p-button-outlined"
                            (click)="loadData()"
                            [loading]="loading">
                    </button>
                </div>
            </div>

            <!-- Alert Banner -->
            <div class="alert-banner" *ngIf="activeCount() > 0">
                <div class="alert-content">
                    <div class="alert-icon">
                        <i class="pi pi-exclamation-triangle"></i>
                    </div>
                    <div class="alert-text">
                        <strong>{{ activeCount() }} affectation{{ activeCount() > 1 ? 's' : '' }}</strong>
                        {{ activeCount() > 1 ? 'nécessitent' : 'nécessite' }} une action.
                        Veuillez planifier les formations ou acquitter les affectations.
                    </div>
                    <button pButton pRipple
                            label="Voir Actives"
                            class="p-button-danger p-button-sm"
                            (click)="filterByStatus('active')">
                    </button>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="stats-grid">
                <div class="stat-card active" (click)="filterByStatus('active')" pRipple>
                    <div class="stat-visual">
                        <svg viewBox="0 0 100 100" class="stat-ring">
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="rgba(239, 68, 68, 0.2)" stroke-width="8"/>
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="#EF4444" stroke-width="8"
                                    [attr.stroke-dasharray]="getActiveDashArray()"
                                    stroke-linecap="round"
                                    transform="rotate(-90 50 50)"/>
                        </svg>
                        <div class="stat-value-center">
                            <span class="value">{{ activeCount() }}</span>
                        </div>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Actives</span>
                        <span class="stat-sublabel">Action requise</span>
                    </div>
                </div>

                <div class="stat-card acknowledged" (click)="filterByStatus('acknowledged')" pRipple>
                    <div class="stat-visual">
                        <svg viewBox="0 0 100 100" class="stat-ring">
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="rgba(245, 158, 11, 0.2)" stroke-width="8"/>
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="#F59E0B" stroke-width="8"
                                    [attr.stroke-dasharray]="getAcknowledgedDashArray()"
                                    stroke-linecap="round"
                                    transform="rotate(-90 50 50)"/>
                        </svg>
                        <div class="stat-value-center">
                            <span class="value">{{ acknowledgedCount() }}</span>
                        </div>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Acquittées</span>
                        <span class="stat-sublabel">En attente formation</span>
                    </div>
                </div>

                <div class="stat-card resolved" (click)="filterByStatus('resolved')" pRipple>
                    <div class="stat-visual">
                        <svg viewBox="0 0 100 100" class="stat-ring">
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="rgba(16, 185, 129, 0.2)" stroke-width="8"/>
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="#10B981" stroke-width="8"
                                    [attr.stroke-dasharray]="getResolvedDashArray()"
                                    stroke-linecap="round"
                                    transform="rotate(-90 50 50)"/>
                        </svg>
                        <div class="stat-value-center">
                            <span class="value">{{ resolvedCount() }}</span>
                        </div>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Résolues</span>
                        <span class="stat-sublabel">Qualification obtenue</span>
                    </div>
                </div>

                <div class="stat-card total" (click)="clearFilter()" pRipple>
                    <div class="stat-visual">
                        <svg viewBox="0 0 100 100" class="stat-ring">
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="rgba(139, 92, 246, 0.2)" stroke-width="8"/>
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="#8B5CF6" stroke-width="8"
                                    stroke-dasharray="251.2, 251.2"
                                    stroke-linecap="round"
                                    transform="rotate(-90 50 50)"/>
                        </svg>
                        <div class="stat-value-center">
                            <span class="value">{{ assignments().length }}</span>
                        </div>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Total</span>
                        <span class="stat-sublabel">Toutes les affectations</span>
                    </div>
                </div>
            </div>

            <!-- Assignments Table -->
            <div class="hr-section-card">
                <div class="section-header">
                    <span class="section-title">
                        <i class="pi pi-users"></i>
                        Affectations Non Qualifiées
                        <p-badge *ngIf="activeFilter" [value]="activeFilter" severity="info" styleClass="ml-2"></p-badge>
                    </span>
                    <div class="section-actions">
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input pInputText type="text"
                                   [(ngModel)]="searchTerm"
                                   (input)="onSearch()"
                                   placeholder="Rechercher..."
                                   class="search-input" />
                        </p-iconfield>
                        <p-select
                            [options]="statusOptions"
                            [(ngModel)]="selectedStatus"
                            (onChange)="onStatusFilterChange()"
                            placeholder="Statut"
                            [showClear]="true"
                            styleClass="status-filter">
                        </p-select>
                        <button pButton pRipple
                                icon="pi pi-filter-slash"
                                label="Effacer"
                                class="p-button-text p-button-sm"
                                *ngIf="activeFilter || selectedStatus"
                                (click)="clearFilter()">
                        </button>
                    </div>
                </div>
                <div class="section-body p-0">
                    <p-table [value]="filteredAssignments()"
                             [loading]="loading"
                             [paginator]="true"
                             [rows]="10"
                             [rowsPerPageOptions]="[10, 25, 50]"
                             [showCurrentPageReport]="true"
                             currentPageReportTemplate="Affichage {first} à {last} sur {totalRecords} affectations"
                             [rowHover]="true"
                             [sortField]="'assignment_date'"
                             [sortOrder]="-1"
                             styleClass="p-datatable-sm hr-table">

                        <ng-template pTemplate="header">
                            <tr>
                                <th style="width: 60px"></th>
                                <th pSortableColumn="employee_name">
                                    Opérateur <p-sortIcon field="employee_name"></p-sortIcon>
                                </th>
                                <th pSortableColumn="workstation_name">
                                    Poste <p-sortIcon field="workstation_name"></p-sortIcon>
                                </th>
                                <th pSortableColumn="production_line_name">
                                    Ligne <p-sortIcon field="production_line_name"></p-sortIcon>
                                </th>
                                <th pSortableColumn="assignment_date" style="width: 140px">
                                    Date <p-sortIcon field="assignment_date"></p-sortIcon>
                                </th>
                                <th pSortableColumn="assigned_by_name" style="width: 150px">
                                    Assigné par <p-sortIcon field="assigned_by_name"></p-sortIcon>
                                </th>
                                <th style="width: 120px">Statut</th>
                                <th style="width: 140px; text-align: center">Actions</th>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="body" let-assignment>
                            <tr>
                                <td>
                                    <div class="hr-avatar-badge">
                                        <p-avatar
                                            *ngIf="assignment.employee_picture"
                                            [image]="assignment.employee_picture"
                                            shape="circle"
                                            size="large">
                                        </p-avatar>
                                        <p-avatar
                                            *ngIf="!assignment.employee_picture"
                                            [label]="getInitials(assignment.employee_name)"
                                            shape="circle"
                                            size="large"
                                            [style]="{'background': 'var(--hr-gradient)', 'color': 'white'}">
                                        </p-avatar>
                                    </div>
                                </td>
                                <td>
                                    <div class="hr-employee-info">
                                        <div class="employee-details">
                                            <span class="employee-name">{{ assignment.employee_name }}</span>
                                            <span class="employee-meta" *ngIf="assignment.employee_badge">
                                                Badge: {{ assignment.employee_badge }}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="workstation-info">
                                        <i class="pi pi-cog"></i>
                                        <div>
                                            <span class="workstation-name">{{ assignment.workstation_name }}</span>
                                            <span class="workstation-code" *ngIf="assignment.workstation_code">{{ assignment.workstation_code }}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="line-name">{{ assignment.production_line_name }}</span>
                                </td>
                                <td>
                                    <div class="hr-info-row">
                                        <i class="pi pi-calendar"></i>
                                        <span>{{ assignment.assignment_date | date:'dd/MM/yyyy HH:mm' }}</span>
                                    </div>
                                </td>
                                <td>
                                    <span class="assigned-by">{{ assignment.assigned_by_name || 'Système' }}</span>
                                </td>
                                <td>
                                    <p-tag [value]="getStatusLabel(assignment.status)"
                                           [severity]="getStatusSeverity(assignment.status)"
                                           [rounded]="true">
                                    </p-tag>
                                </td>
                                <td>
                                    <div class="hr-action-buttons">
                                        <button pButton pRipple
                                                icon="pi pi-check"
                                                class="p-button-text p-button-rounded p-button-sm p-button-success"
                                                *ngIf="assignment.status === 'active'"
                                                (click)="openAcknowledgeDialog(assignment)"
                                                pTooltip="Acquitter">
                                        </button>
                                        <button pButton pRipple
                                                icon="pi pi-calendar-plus"
                                                class="p-button-text p-button-rounded p-button-sm"
                                                *ngIf="assignment.status !== 'resolved'"
                                                (click)="planTraining(assignment)"
                                                pTooltip="Planifier formation">
                                        </button>
                                        <button pButton pRipple
                                                icon="pi pi-check-circle"
                                                class="p-button-text p-button-rounded p-button-sm p-button-info"
                                                *ngIf="assignment.status === 'acknowledged'"
                                                (click)="openResolveDialog(assignment)"
                                                pTooltip="Résoudre">
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="8">
                                    <div class="hr-empty-state success-state">
                                        <i class="empty-icon pi pi-check-circle" style="color: var(--hr-success);"></i>
                                        <h3>Aucune affectation non qualifiée</h3>
                                        <p>Toutes les affectations respectent les qualifications requises</p>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="loadingbody">
                            <tr *ngFor="let i of [1,2,3,4,5]">
                                <td><p-skeleton shape="circle" size="48px"></p-skeleton></td>
                                <td><p-skeleton width="150px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="120px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="100px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="100px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="100px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="80px" height="24px" borderRadius="12px"></p-skeleton></td>
                                <td><p-skeleton width="100px" height="32px"></p-skeleton></td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>

        <!-- Acknowledge Dialog -->
        <p-dialog [(visible)]="showAcknowledgeDialog"
                  header="Acquitter l'affectation"
                  [modal]="true"
                  [style]="{width: '450px'}"
                  [closable]="true">
            <div class="dialog-content" *ngIf="selectedAssignment">
                <p class="mb-3">
                    Vous êtes sur le point d'acquitter l'affectation de
                    <strong>{{ selectedAssignment.employee_name }}</strong> au poste
                    <strong>{{ selectedAssignment.workstation_name }}</strong>.
                </p>
                <div class="field">
                    <label for="acknowledgeNotes">Notes (optionnel)</label>
                    <textarea pInputTextarea
                              id="acknowledgeNotes"
                              [(ngModel)]="actionNotes"
                              rows="3"
                              placeholder="Ajouter des notes..."
                              class="w-full">
                    </textarea>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <button pButton label="Annuler" icon="pi pi-times" class="p-button-text" (click)="showAcknowledgeDialog = false"></button>
                <button pButton label="Acquitter" icon="pi pi-check" class="p-button-warning" (click)="acknowledgeAssignment()"></button>
            </ng-template>
        </p-dialog>

        <!-- Resolve Dialog -->
        <p-dialog [(visible)]="showResolveDialog"
                  header="Résoudre l'affectation"
                  [modal]="true"
                  [style]="{width: '450px'}"
                  [closable]="true">
            <div class="dialog-content" *ngIf="selectedAssignment">
                <p class="mb-3">
                    Confirmez que <strong>{{ selectedAssignment.employee_name }}</strong> est maintenant
                    qualifié(e) pour le poste <strong>{{ selectedAssignment.workstation_name }}</strong>.
                </p>
                <div class="field">
                    <label for="resolveNotes">Notes (optionnel)</label>
                    <textarea pInputTextarea
                              id="resolveNotes"
                              [(ngModel)]="actionNotes"
                              rows="3"
                              placeholder="Ajouter des notes sur la qualification obtenue..."
                              class="w-full">
                    </textarea>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <button pButton label="Annuler" icon="pi pi-times" class="p-button-text" (click)="showResolveDialog = false"></button>
                <button pButton label="Résoudre" icon="pi pi-check-circle" class="p-button-success" (click)="resolveAssignment()"></button>
            </ng-template>
        </p-dialog>

        <p-toast position="top-right"></p-toast>
        <p-confirmDialog></p-confirmDialog>
    `,
    styles: [`
        .non-qualified-assignments-list {
            padding: 1.5rem;
        }

        /* Page Header */
        .hr-page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
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
            display: flex;
            align-items: center;
            justify-content: center;

            i {
                font-size: 1.5rem;
                color: white;
            }
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

        /* Alert Banner */
        .alert-banner {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 1rem 1.5rem;
            margin-bottom: 1.5rem;

            .alert-content {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .alert-icon {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                background: rgba(239, 68, 68, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;

                i {
                    font-size: 1.25rem;
                    color: #EF4444;
                }
            }

            .alert-text {
                flex: 1;
                font-size: 0.9375rem;
                color: var(--text-color);
            }
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .stat-card {
            background: var(--surface-card);
            border-radius: 16px;
            padding: 1.5rem;
            border: 1px solid var(--surface-border);
            display: flex;
            align-items: center;
            gap: 1rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            &:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
            }

            &.active:hover {
                border-color: rgba(239, 68, 68, 0.5);
            }

            &.acknowledged:hover {
                border-color: rgba(245, 158, 11, 0.5);
            }

            &.resolved:hover {
                border-color: rgba(16, 185, 129, 0.5);
            }

            &.total:hover {
                border-color: rgba(139, 92, 246, 0.5);
            }

            .stat-visual {
                position: relative;
                width: 80px;
                height: 80px;
                flex-shrink: 0;
            }

            .stat-ring {
                width: 100%;
                height: 100%;
            }

            .stat-value-center {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;

                .value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--text-color);
                }
            }

            .stat-info {
                display: flex;
                flex-direction: column;

                .stat-label {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-color);
                }

                .stat-sublabel {
                    font-size: 0.8125rem;
                    color: var(--text-color-secondary);
                }
            }

            &.active .stat-value-center .value { color: #EF4444; }
            &.acknowledged .stat-value-center .value { color: #F59E0B; }
            &.resolved .stat-value-center .value { color: #10B981; }
            &.total .stat-value-center .value { color: #8B5CF6; }
        }

        /* Section Card */
        .hr-section-card {
            background: var(--surface-card);
            border-radius: 12px;
            border: 1px solid var(--surface-border);
            overflow: hidden;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--surface-border);
            background: var(--surface-50);

            .section-title {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1rem;
                font-weight: 600;
                color: var(--text-color);

                i {
                    color: var(--primary-color);
                }
            }
        }

        .section-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .search-input {
                min-width: 200px;
            }

            .status-filter {
                min-width: 150px;
            }
        }

        .section-body {
            padding: 0;
        }

        /* Employee Info */
        .hr-employee-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .employee-details {
            display: flex;
            flex-direction: column;

            .employee-name {
                font-weight: 500;
                color: var(--text-color);
            }

            .employee-meta {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
            }
        }

        /* Workstation Info */
        .workstation-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;

            i {
                color: var(--primary-color);
                font-size: 0.875rem;
            }

            > div {
                display: flex;
                flex-direction: column;

                .workstation-name {
                    font-weight: 500;
                    color: var(--text-color);
                }

                .workstation-code {
                    font-size: 0.75rem;
                    color: var(--text-color-secondary);
                }
            }
        }

        .line-name {
            color: var(--text-color-secondary);
            font-size: 0.875rem;
        }

        .assigned-by {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
        }

        /* Info Row */
        .hr-info-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-color);

            i {
                color: var(--text-color-secondary);
                font-size: 0.875rem;
            }
        }

        /* Action Buttons */
        .hr-action-buttons {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
        }

        /* Empty State */
        .hr-empty-state {
            padding: 3rem;
            text-align: center;

            .empty-icon {
                font-size: 3rem;
                color: var(--text-color-secondary);
                opacity: 0.5;
                margin-bottom: 1rem;
            }

            h3 {
                margin: 0 0 0.5rem 0;
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--text-color);
            }

            p {
                margin: 0;
                color: var(--text-color-secondary);
            }

            &.success-state {
                .empty-icon {
                    color: #10B981 !important;
                    opacity: 1 !important;
                }
            }
        }

        /* Dialog Content */
        .dialog-content {
            .field {
                margin-bottom: 1rem;

                label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: var(--text-color);
                }
            }
        }

        /* Avatar Badge */
        .hr-avatar-badge {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Table Customization */
        :host ::ng-deep {
            .p-datatable .p-datatable-thead > tr > th {
                background: var(--surface-50);
                padding: 1rem;
            }

            .p-datatable .p-datatable-tbody > tr > td {
                padding: 0.75rem 1rem;
            }
        }
    `]
})
export class NonQualifiedAssignmentsComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    loading = false;

    // Signals for reactive data
    assignments = signal<NonQualifiedAssignment[]>([]);
    stats = signal<NonQualifiedAssignmentStats | null>(null);

    // Filter state
    searchTerm = '';
    activeFilter: string | null = null;
    selectedStatus: string | null = null;

    // Status options for filter dropdown
    statusOptions = [
        { label: 'Actives', value: 'active' },
        { label: 'Acquittées', value: 'acknowledged' },
        { label: 'Résolues', value: 'resolved' }
    ];

    // Dialog state
    showAcknowledgeDialog = false;
    showResolveDialog = false;
    selectedAssignment: NonQualifiedAssignment | null = null;
    actionNotes = '';

    // Computed counts
    activeCount = computed(() => this.assignments().filter(a => a.status === 'active').length);
    acknowledgedCount = computed(() => this.assignments().filter(a => a.status === 'acknowledged').length);
    resolvedCount = computed(() => this.assignments().filter(a => a.status === 'resolved').length);

    // Filtered assignments
    filteredAssignments = computed(() => {
        let result = this.assignments();

        // Apply search filter
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(a =>
                a.employee_name?.toLowerCase().includes(term) ||
                a.employee_badge?.toLowerCase().includes(term) ||
                a.workstation_name?.toLowerCase().includes(term) ||
                a.production_line_name?.toLowerCase().includes(term)
            );
        }

        // Apply status filter
        if (this.selectedStatus) {
            result = result.filter(a => a.status === this.selectedStatus);
        } else if (this.activeFilter) {
            const statusMap: Record<string, string> = {
                'Actives': 'active',
                'Acquittées': 'acknowledged',
                'Résolues': 'resolved'
            };
            const status = statusMap[this.activeFilter];
            if (status) {
                result = result.filter(a => a.status === status);
            }
        }

        return result;
    });

    constructor(
        private hrService: HRService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadData(): void {
        this.loading = true;
        this.hrService.getNonQualifiedAssignments().pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading = false)
        ).subscribe({
            next: (data) => {
                this.assignments.set(data);
            },
            error: (err) => {
                console.error('Error loading non-qualified assignments:', err);
                this.assignments.set([]);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les affectations non qualifiées'
                });
            }
        });
    }

    onSearch(): void {
        this.assignments.update(a => [...a]);
    }

    onStatusFilterChange(): void {
        this.activeFilter = null;
        this.assignments.update(a => [...a]);
    }

    filterByStatus(status: string): void {
        const statusLabels: Record<string, string> = {
            'active': 'Actives',
            'acknowledged': 'Acquittées',
            'resolved': 'Résolues'
        };
        this.activeFilter = statusLabels[status] || null;
        this.selectedStatus = null;
        this.assignments.update(a => [...a]);
    }

    clearFilter(): void {
        this.activeFilter = null;
        this.selectedStatus = null;
        this.searchTerm = '';
        this.assignments.update(a => [...a]);
    }

    // Dashboard array helpers
    getActiveDashArray(): string {
        const total = this.assignments().length || 1;
        const circumference = 2 * Math.PI * 40;
        const progress = (this.activeCount() / total) * circumference;
        return `${progress}, ${circumference}`;
    }

    getAcknowledgedDashArray(): string {
        const total = this.assignments().length || 1;
        const circumference = 2 * Math.PI * 40;
        const progress = (this.acknowledgedCount() / total) * circumference;
        return `${progress}, ${circumference}`;
    }

    getResolvedDashArray(): string {
        const total = this.assignments().length || 1;
        const circumference = 2 * Math.PI * 40;
        const progress = (this.resolvedCount() / total) * circumference;
        return `${progress}, ${circumference}`;
    }

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'active': 'Active',
            'acknowledged': 'Acquittée',
            'resolved': 'Résolue'
        };
        return labels[status] || status;
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            'active': 'danger',
            'acknowledged': 'warn',
            'resolved': 'success'
        };
        return severities[status] || 'secondary';
    }

    // Action dialogs
    openAcknowledgeDialog(assignment: NonQualifiedAssignment): void {
        this.selectedAssignment = assignment;
        this.actionNotes = '';
        this.showAcknowledgeDialog = true;
    }

    openResolveDialog(assignment: NonQualifiedAssignment): void {
        this.selectedAssignment = assignment;
        this.actionNotes = '';
        this.showResolveDialog = true;
    }

    acknowledgeAssignment(): void {
        if (!this.selectedAssignment) return;

        this.hrService.acknowledgeNonQualifiedAssignment(
            this.selectedAssignment.id,
            this.actionNotes || undefined
        ).subscribe({
            next: (updated) => {
                // Update local state
                this.assignments.update(assignments =>
                    assignments.map(a => a.id === updated.id ? updated : a)
                );
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Affectation acquittée'
                });
                this.showAcknowledgeDialog = false;
                this.selectedAssignment = null;
                this.actionNotes = '';
            },
            error: (err) => {
                console.error('Error acknowledging assignment:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible d\'acquitter l\'affectation'
                });
            }
        });
    }

    resolveAssignment(): void {
        if (!this.selectedAssignment) return;

        this.hrService.resolveNonQualifiedAssignment(
            this.selectedAssignment.id,
            this.actionNotes || undefined
        ).subscribe({
            next: (updated) => {
                // Update local state
                this.assignments.update(assignments =>
                    assignments.map(a => a.id === updated.id ? updated : a)
                );
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Affectation résolue - Employé maintenant qualifié'
                });
                this.showResolveDialog = false;
                this.selectedAssignment = null;
                this.actionNotes = '';
            },
            error: (err) => {
                console.error('Error resolving assignment:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de résoudre l\'affectation'
                });
            }
        });
    }

    planTraining(assignment: NonQualifiedAssignment): void {
        // Navigate to formation planning with pre-filled data
        this.messageService.add({
            severity: 'info',
            summary: 'Information',
            detail: `Planification de formation pour ${assignment.employee_name} - Fonctionnalité à implémenter`
        });
        // TODO: Navigate to formation planning module with employee pre-selected
    }
}
