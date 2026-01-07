/**
 * Qualifications List Component
 * Domain: DMS-RH
 *
 * Manages employee qualifications and certifications
 */
import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

// PrimeNG
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { RippleModule } from 'primeng/ripple';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';

import { HRService } from '@core/services/hr.service';
import { QualificationStateService } from '@core/state/qualification-state.service';
import { Qualification, Employee, Formation, Formateur } from '@core/models/employee.model';
import { environment } from '../../../../../environments/environment';
import { EmployeeAutocompleteComponent } from '@shared/components/employee-autocomplete/employee-autocomplete.component';

@Component({
    selector: 'app-qualifications-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        InputTextModule,
        ButtonModule,
        TagModule,
        TooltipModule,
        DialogModule,
        SelectModule,
        DatePickerModule,
        ToastModule,
        ConfirmDialogModule,
        ToolbarModule,
        CardModule,
        AvatarModule,
        IconFieldModule,
        InputIconModule,
        RippleModule,
        SkeletonModule,
        EmployeeAutocompleteComponent
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="hr-page qualifications-page">
            <!-- Page Header -->
            <div class="hr-page-header">
                <div class="header-content">
                    <div class="header-title-section">
                        <div class="header-icon">
                            <i class="pi pi-verified"></i>
                        </div>
                        <div class="header-text">
                            <h1>Qualifications</h1>
                            <p>Gérer les qualifications et certifications des employés</p>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button pButton pRipple icon="pi pi-refresh"
                                class="p-button-outlined"
                                (click)="loadData()"
                                pTooltip="Actualiser">
                        </button>
                        <button pButton pRipple icon="pi pi-plus" label="Nouvelle Qualification"
                                class="p-button-primary"
                                (click)="openNewQualificationDialog()">
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="hr-stats-row">
                <div class="hr-stat-card stat-primary">
                    <div class="stat-icon">
                        <i class="pi pi-verified"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ qualifications().length }}</span>
                        <span class="stat-label">Total Qualifications</span>
                    </div>
                </div>
                <div class="hr-stat-card stat-success">
                    <div class="stat-icon">
                        <i class="pi pi-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ getResultCount('passed') }}</span>
                        <span class="stat-label">Réussies</span>
                    </div>
                </div>
                <div class="hr-stat-card stat-info">
                    <div class="stat-icon">
                        <i class="pi pi-spinner"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ getResultCount('in_progress') }}</span>
                        <span class="stat-label">En Cours</span>
                    </div>
                </div>
                <div class="hr-stat-card stat-warning">
                    <div class="stat-icon">
                        <i class="pi pi-clock"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ getResultCount('pending') }}</span>
                        <span class="stat-label">En Attente</span>
                    </div>
                </div>
                <div class="hr-stat-card stat-danger">
                    <div class="stat-icon">
                        <i class="pi pi-times-circle"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ getResultCount('failed') }}</span>
                        <span class="stat-label">Échouées</span>
                    </div>
                </div>
            </div>

            <!-- Filter Section -->
            <div class="hr-filter-section">
                <div class="filter-group">
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search"></p-inputicon>
                        <input type="text" pInputText [ngModel]="searchTerm()"
                               (ngModelChange)="searchTerm.set($event)"
                               placeholder="Rechercher un employé ou une formation..."
                               class="search-input" />
                    </p-iconfield>
                </div>
                <div class="filter-group">
                    <p-select [options]="resultOptions"
                              [ngModel]="selectedResult()"
                              (ngModelChange)="selectedResult.set($event)"
                              placeholder="Filtrer par résultat"
                              [showClear]="true"
                              optionLabel="label"
                              optionValue="value"
                              appendTo="body"
                              styleClass="filter-select">
                    </p-select>
                </div>
                <div class="filter-chips">
                    <button *ngFor="let result of resultOptions"
                            pButton pRipple
                            [class]="'filter-chip ' + (selectedResult() === result.value ? 'active' : '')"
                            [label]="result.label"
                            (click)="onQuickFilter(result.value)">
                    </button>
                </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="loading" class="hr-loading-section">
                <div class="loading-table">
                    <p-skeleton height="50px" styleClass="mb-2"></p-skeleton>
                    <p-skeleton height="60px" styleClass="mb-2" *ngFor="let i of [1,2,3,4,5]"></p-skeleton>
                </div>
            </div>

            <!-- Qualifications Table -->
            <div *ngIf="!loading" class="hr-section-card">
                <div class="section-header">
                    <h2>
                        <i class="pi pi-list"></i>
                        Liste des Qualifications
                    </h2>
                    <span class="section-count">{{ filteredQualifications().length }} résultats</span>
                </div>

                <p-table [value]="filteredQualifications()"
                         [paginator]="true" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]"
                         [globalFilterFields]="['employee_name', 'formation_name']"
                         [rowHover]="true" dataKey="id"
                         styleClass="hr-table"
                         [showCurrentPageReport]="true"
                         currentPageReportTemplate="Affichage {first} à {last} sur {totalRecords} qualifications">

                    <ng-template pTemplate="header">
                        <tr>
                            <th style="width: 250px">Employé</th>
                            <th pSortableColumn="formation_name">
                                Formation
                                <p-sortIcon field="formation_name"></p-sortIcon>
                            </th>
                            <th pSortableColumn="start_date" style="width: 130px">
                                Début
                                <p-sortIcon field="start_date"></p-sortIcon>
                            </th>
                            <th pSortableColumn="end_date" style="width: 130px">
                                Fin
                                <p-sortIcon field="end_date"></p-sortIcon>
                            </th>
                            <th style="width: 150px">Formateur</th>
                            <th pSortableColumn="test_result" style="width: 130px">
                                Résultat
                                <p-sortIcon field="test_result"></p-sortIcon>
                            </th>
                            <th style="width: 100px" class="text-center">Actions</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-qual>
                        <tr class="qual-row" [ngClass]="getRowClass(qual.test_result)">
                            <td>
                                <div class="employee-cell">
                                    <p-avatar [image]="getEmployeePicture(qual.employee_picture)"
                                              [label]="!qual.employee_picture ? getInitials(qual.employee_name) : undefined"
                                              shape="circle" size="normal"
                                              [style]="{'background': getAvatarColor(qual.employee_name), 'color': 'white'}">
                                    </p-avatar>
                                    <div class="employee-info">
                                        <span class="employee-name">{{ qual.employee_name }}</span>
                                        <span class="employee-id" *ngIf="qual.employee_badge">
                                            <i class="pi pi-id-card"></i> {{ qual.employee_badge }}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="formation-cell">
                                    <i class="pi pi-book formation-icon"></i>
                                    <span class="formation-name">{{ qual.formation_name }}</span>
                                </div>
                            </td>
                            <td>
                                <span class="date-cell">
                                    <i class="pi pi-calendar"></i>
                                    {{ qual.start_date | date:'dd/MM/yyyy' }}
                                </span>
                            </td>
                            <td>
                                <span class="date-cell">
                                    <i class="pi pi-calendar-times"></i>
                                    {{ qual.end_date | date:'dd/MM/yyyy' }}
                                </span>
                            </td>
                            <td>
                                <span class="trainer-cell" *ngIf="qual.trainer_name; else noTrainer">
                                    <i class="pi pi-user"></i>
                                    {{ qual.trainer_name }}
                                </span>
                                <ng-template #noTrainer>
                                    <span class="no-data">-</span>
                                </ng-template>
                            </td>
                            <td>
                                <div class="result-badge" [ngClass]="'result-' + (qual.test_result || 'pending').toLowerCase().replace(' ', '-')">
                                    <i [class]="getResultIcon(qual.test_result)"></i>
                                    <span>{{ getResultLabel(qual.test_result) }}</span>
                                </div>
                            </td>
                            <td>
                                <div class="actions-cell">
                                    <button pButton pRipple icon="pi pi-pencil"
                                            class="p-button-rounded p-button-text p-button-sm action-btn"
                                            (click)="editQualification(qual)"
                                            pTooltip="Modifier">
                                    </button>
                                    <button pButton pRipple icon="pi pi-trash"
                                            class="p-button-rounded p-button-text p-button-danger p-button-sm action-btn"
                                            (click)="confirmDeleteQualification(qual)"
                                            pTooltip="Supprimer">
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="7">
                                <div class="hr-empty-state compact">
                                    <div class="empty-icon">
                                        <i class="pi pi-verified"></i>
                                    </div>
                                    <h3>Aucune qualification trouvée</h3>
                                    <p>{{ searchTerm() || selectedResult() ? 'Essayez de modifier vos filtres' : 'Commencez par ajouter une qualification' }}</p>
                                    <button pButton pRipple label="Nouvelle Qualification" icon="pi pi-plus"
                                            class="p-button-primary"
                                            (click)="openNewQualificationDialog()">
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>

        <!-- Qualification Dialog -->
        <p-dialog [(visible)]="showQualificationDialog"
                  [header]="editingQualification ? 'Modifier Qualification' : 'Nouvelle Qualification'"
                  [modal]="true" [style]="{width: '600px'}" styleClass="hr-dialog">
            <form [formGroup]="qualificationForm" class="dialog-form">
                <div class="form-row">
                    <div class="form-group full">
                        <label><i class="pi pi-user"></i> Employé *</label>
                        <app-employee-autocomplete
                            formControlName="employee"
                            placeholder="Rechercher un employé par nom ou badge..."
                            [showClear]="true"
                            appendTo="body">
                        </app-employee-autocomplete>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group full">
                        <label><i class="pi pi-book"></i> Formation *</label>
                        <p-select formControlName="formation" [options]="formations"
                                  optionLabel="name" optionValue="id" [filter]="true"
                                  placeholder="Sélectionner une formation"
                                  appendTo="body"
                                  styleClass="w-full"></p-select>
                    </div>
                </div>
                <div class="form-row two-cols">
                    <div class="form-group">
                        <label><i class="pi pi-calendar"></i> Date de début *</label>
                        <p-datepicker formControlName="start_date" [showIcon]="true"
                                      dateFormat="dd/mm/yy" appendTo="body" styleClass="w-full"></p-datepicker>
                    </div>
                    <div class="form-group">
                        <label><i class="pi pi-calendar-times"></i> Date de fin *</label>
                        <p-datepicker formControlName="end_date" [showIcon]="true"
                                      dateFormat="dd/mm/yy" appendTo="body" styleClass="w-full"></p-datepicker>
                    </div>
                </div>
                <div class="form-row two-cols">
                    <div class="form-group">
                        <label><i class="pi pi-user-edit"></i> Formateur</label>
                        <p-select formControlName="trainer" [options]="formateurs"
                                  optionLabel="name" optionValue="id" [filter]="true"
                                  placeholder="Sélectionner un formateur"
                                  [showClear]="true"
                                  appendTo="body"
                                  styleClass="w-full"></p-select>
                    </div>
                    <div class="form-group">
                        <label><i class="pi pi-check-square"></i> Résultat *</label>
                        <p-select formControlName="test_result" [options]="resultOptions"
                                  optionLabel="label" optionValue="value"
                                  placeholder="Sélectionner le résultat"
                                  appendTo="body"
                                  styleClass="w-full"></p-select>
                    </div>
                </div>
            </form>
            <ng-template pTemplate="footer">
                <div class="dialog-footer">
                    <button pButton pRipple label="Annuler" icon="pi pi-times"
                            class="p-button-outlined"
                            (click)="showQualificationDialog = false"></button>
                    <button pButton pRipple label="Enregistrer" icon="pi pi-check"
                            class="p-button-primary"
                            (click)="saveQualification()"
                            [disabled]="qualificationForm.invalid"></button>
                </div>
            </ng-template>
        </p-dialog>

        <p-toast position="bottom-right"></p-toast>
        <p-confirmDialog styleClass="hr-confirm-dialog"></p-confirmDialog>
    `,
    styles: [`
        .qualifications-page {
            padding: 1.5rem;
            background: var(--surface-ground);
            min-height: 100vh;
        }

        .hr-page-header {
            margin-bottom: 1.5rem;
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .header-title-section {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .header-icon {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            background: var(--hr-gradient, linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%));
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);

            i {
                font-size: 1.5rem;
                color: white;
            }
        }

        .header-text {
            h1 {
                margin: 0;
                font-size: 1.75rem;
                font-weight: 700;
                color: var(--text-color);
            }

            p {
                margin: 0.25rem 0 0;
                color: var(--text-color-secondary);
                font-size: 0.875rem;
            }
        }

        .header-actions {
            display: flex;
            gap: 0.75rem;
        }

        /* Stats Row */
        .hr-stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            border: 1px solid var(--surface-border);
            transition: all 0.2s ease;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            }

            .stat-icon {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;

                i {
                    font-size: 1.25rem;
                    color: white;
                }
            }

            &.stat-primary .stat-icon {
                background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
            }

            &.stat-success .stat-icon {
                background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
            }

            &.stat-info .stat-icon {
                background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
            }

            &.stat-warning .stat-icon {
                background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
            }

            &.stat-danger .stat-icon {
                background: linear-gradient(135deg, #EF4444 0%, #F87171 100%);
            }

            .stat-content {
                display: flex;
                flex-direction: column;
            }

            .stat-value {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .stat-label {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
        }

        /* Filter Section */
        .hr-filter-section {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1rem 1.25rem;
            margin-bottom: 1.5rem;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            border: 1px solid var(--surface-border);
        }

        .filter-group {
            flex-shrink: 0;
        }

        .search-input {
            width: 320px;
        }

        .filter-select {
            min-width: 200px;
        }

        .filter-chips {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            margin-left: auto;
        }

        .filter-chip {
            background: var(--surface-ground) !important;
            border: 1px solid var(--surface-border) !important;
            color: var(--text-color-secondary) !important;
            font-size: 0.75rem !important;
            padding: 0.375rem 0.75rem !important;
            border-radius: 20px !important;
            transition: all 0.2s ease !important;

            &:hover {
                background: var(--surface-hover) !important;
            }

            &.active {
                background: var(--hr-primary, #8B5CF6) !important;
                border-color: var(--hr-primary, #8B5CF6) !important;
                color: white !important;
            }
        }

        /* Loading Section */
        .hr-loading-section {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1.5rem;
        }

        /* Section Card */
        .hr-section-card {
            background: var(--surface-card);
            border-radius: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            border: 1px solid var(--surface-border);
            overflow: hidden;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--surface-border);
            background: var(--surface-50);

            h2 {
                margin: 0;
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--text-color);
                display: flex;
                align-items: center;
                gap: 0.75rem;

                i {
                    color: var(--hr-primary, #8B5CF6);
                }
            }

            .section-count {
                font-size: 0.875rem;
                color: var(--text-color-secondary);
                background: var(--surface-100);
                padding: 0.375rem 0.75rem;
                border-radius: 20px;
            }
        }

        /* Table Styles */
        :host ::ng-deep .hr-table {
            .p-datatable-header {
                background: transparent;
                border: none;
                padding: 0;
            }

            .p-datatable-thead > tr > th {
                background: var(--surface-50);
                color: var(--text-color-secondary);
                font-weight: 600;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-color: var(--surface-border);
                padding: 1rem;
            }

            .p-datatable-tbody > tr {
                transition: all 0.2s ease;

                &:hover {
                    background: var(--surface-hover);
                }

                > td {
                    padding: 1rem;
                    border-color: var(--surface-border);
                }
            }
        }

        .qual-row {
            &.row-passed {
                border-left: 3px solid #10B981;
            }

            &.row-failed {
                border-left: 3px solid #EF4444;
            }

            &.row-in_progress {
                border-left: 3px solid #3B82F6;
            }

            &.row-pending {
                border-left: 3px solid #F59E0B;
            }
        }

        .employee-cell {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .employee-info {
            display: flex;
            flex-direction: column;
        }

        .employee-name {
            font-weight: 600;
            color: var(--text-color);
        }

        .employee-id {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }

        .formation-cell {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .formation-icon {
            color: var(--hr-primary, #8B5CF6);
            font-size: 0.875rem;
        }

        .formation-name {
            font-weight: 500;
            color: var(--text-color);
        }

        .date-cell {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: var(--text-color-secondary);

            i {
                font-size: 0.75rem;
            }
        }

        .trainer-cell {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: var(--text-color);

            i {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
            }
        }

        .no-data {
            color: var(--text-color-secondary);
        }

        .result-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.375rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;

            i {
                font-size: 0.75rem;
            }

            &.result-passed {
                background: rgba(16, 185, 129, 0.1);
                color: #059669;
            }

            &.result-failed {
                background: rgba(239, 68, 68, 0.1);
                color: #DC2626;
            }

            &.result-in_progress {
                background: rgba(59, 130, 246, 0.1);
                color: #2563EB;
            }

            &.result-pending {
                background: rgba(245, 158, 11, 0.1);
                color: #D97706;
            }
        }

        .actions-cell {
            display: flex;
            justify-content: center;
            gap: 0.25rem;
        }

        .action-btn {
            width: 2rem;
            height: 2rem;
        }

        /* Empty State */
        .hr-empty-state {
            text-align: center;
            padding: 4rem 2rem;

            &.compact {
                padding: 3rem 2rem;
            }

            .empty-icon {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: var(--surface-100);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;

                i {
                    font-size: 2rem;
                    color: var(--text-color-secondary);
                }
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

        /* Dialog Styles */
        :host ::ng-deep .hr-dialog {
            .p-dialog-header {
                background: var(--surface-50);
                border-bottom: 1px solid var(--surface-border);
            }

            .p-dialog-content {
                padding: 1.5rem;
            }

            .p-dialog-footer {
                border-top: 1px solid var(--surface-border);
            }
        }

        .dialog-form {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
        }

        .form-row {
            display: flex;
            gap: 1rem;

            &.two-cols .form-group {
                flex: 1;
            }
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;

            &.full {
                width: 100%;
            }

            label {
                font-weight: 500;
                font-size: 0.875rem;
                color: var(--text-color);
                display: flex;
                align-items: center;
                gap: 0.5rem;

                i {
                    font-size: 0.875rem;
                    color: var(--hr-primary, #8B5CF6);
                }
            }
        }

        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
        }

        /* Employee Option in Select */
        .employee-option {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.25rem 0;

            &.selected {
                gap: 0.5rem;
            }
        }

        .employee-option-info {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
        }

        .employee-option-name {
            font-weight: 500;
            color: var(--text-color);
            font-size: 0.875rem;
        }

        .employee-option-badge {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.75rem;
            color: var(--text-color-secondary);

            i {
                font-size: 0.625rem;
            }
        }

        .employee-option-badge-inline {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .qualifications-page {
                padding: 1rem;
            }

            .header-content {
                flex-direction: column;
            }

            .header-actions {
                width: 100%;
                justify-content: flex-end;
            }

            .hr-filter-section {
                flex-direction: column;
                align-items: stretch;
            }

            .search-input {
                width: 100%;
            }

            .filter-chips {
                margin-left: 0;
                justify-content: flex-start;
            }

            .form-row.two-cols {
                flex-direction: column;
            }
        }
    `]
})
export class QualificationsListComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private qualificationState = inject(QualificationStateService);

    // Use signal from state service
    qualifications = this.qualificationState.qualifications;

    formations: Formation[] = [];
    formateurs: Formateur[] = [];
    loading = false;

    // Use signals for reactive filtering
    searchTerm = signal('');
    selectedResult = signal<string | null>(null);

    showQualificationDialog = false;
    editingQualification: Qualification | null = null;
    qualificationForm!: FormGroup;

    resultOptions = [
        { label: 'Réussi', value: 'passed' },
        { label: 'Échoué', value: 'failed' },
        { label: 'En attente', value: 'pending' },
        { label: 'En cours', value: 'in_progress' }
    ];

    // Computed filtered qualifications - reactively updates when signals change
    filteredQualifications = computed(() => {
        let result = this.qualifications();
        const term = this.searchTerm();
        const resultFilter = this.selectedResult();

        // Filter by search term
        if (term) {
            const termLower = term.toLowerCase();
            result = result.filter(q =>
                q.employee_name?.toLowerCase().includes(termLower) ||
                q.formation_name?.toLowerCase().includes(termLower)
            );
        }

        // Filter by result
        if (resultFilter) {
            result = result.filter(q =>
                q.test_result?.toLowerCase() === resultFilter.toLowerCase()
            );
        }

        return result;
    });

    constructor(
        private hrService: HRService,
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initForm(): void {
        this.qualificationForm = this.fb.group({
            employee: [null, Validators.required],
            formation: [null, Validators.required],
            start_date: [null, Validators.required],
            end_date: [null, Validators.required],
            trainer: [null],
            test_result: ['pending', Validators.required]
        });
    }

    loadData(): void {
        this.loading = true;
        forkJoin({
            qualifications: this.hrService.getQualifications().pipe(catchError(() => of([]))),
            formations: this.hrService.getFormations().pipe(catchError(() => of([]))),
            formateurs: this.hrService.getFormateurs().pipe(catchError(() => of([])))
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (data) => {
                this.formations = data.formations;
                this.formateurs = data.formateurs;
                this.loading = false;
            }
        });
    }

    getResultCount(result: string): number {
        return this.qualifications().filter(q =>
            q.test_result?.toLowerCase() === result.toLowerCase()
        ).length;
    }

    onQuickFilter(result: string): void {
        if (this.selectedResult() === result) {
            this.selectedResult.set(null);
        } else {
            this.selectedResult.set(result);
        }
    }

    getRowClass(result: string): string {
        const resultNorm = (result || 'pending').toLowerCase().replace(' ', '-');
        return `row-${resultNorm}`;
    }

    getAvatarColor(name: string): string {
        if (!name) return '#8B5CF6';
        const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }

    getEmployeePicture(picture: string | null | undefined): string | undefined {
        if (!picture) return undefined;
        if (picture.startsWith('http') || picture.startsWith('assets/')) return picture;
        // Ensure the path starts with /
        const picturePath = picture.startsWith('/') ? picture : `/${picture}`;
        return `${environment.mediaUrl}${picturePath}`;
    }

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    getResultLabel(result: string): string {
        const labels: Record<string, string> = {
            'passed': 'Réussi',
            'failed': 'Échoué',
            'pending': 'En attente',
            'in_progress': 'En cours'
        };
        return labels[result?.toLowerCase()] || result || 'En attente';
    }

    getResultIcon(result: string): string {
        const icons: Record<string, string> = {
            'passed': 'pi pi-check-circle',
            'failed': 'pi pi-times-circle',
            'pending': 'pi pi-clock',
            'in_progress': 'pi pi-spinner'
        };
        return icons[result?.toLowerCase()] || 'pi pi-question-circle';
    }

    getResultSeverity(result: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
        switch (result?.toLowerCase()) {
            case 'passed': return 'success';
            case 'failed': return 'danger';
            case 'in_progress': return 'info';
            default: return 'warn';
        }
    }

    openNewQualificationDialog(): void {
        this.editingQualification = null;
        this.qualificationForm.reset({ test_result: 'pending' });
        this.showQualificationDialog = true;
    }

    editQualification(qual: Qualification): void {
        this.editingQualification = qual;
        this.qualificationForm.patchValue({
            employee: qual.employee,
            formation: qual.formation,
            start_date: qual.start_date ? new Date(qual.start_date as string) : null,
            end_date: qual.end_date ? new Date(qual.end_date as string) : null,
            trainer: qual.trainer,
            test_result: qual.test_result
        });
        this.showQualificationDialog = true;
    }

    saveQualification(): void {
        if (this.qualificationForm.invalid) return;

        const formValue = this.qualificationForm.value;

        // Format dates to YYYY-MM-DD string format expected by backend
        const formatDate = (date: Date | null): string | null => {
            if (!date) return null;
            const d = new Date(date);
            return d.toISOString().split('T')[0];
        };

        // Prepare payload with correct field names and formats
        const payload: any = {
            employee: formValue.employee,
            formation: formValue.formation,
            start_date: formatDate(formValue.start_date),
            end_date: formatDate(formValue.end_date),
            test_result: formValue.test_result,
            trainer: formValue.trainer || null
        };

        if (this.editingQualification) {
            this.hrService.updateQualification(this.editingQualification.id, payload).subscribe({
                next: () => {
                    this.loadData();
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Qualification mise à jour' });
                    this.showQualificationDialog = false;
                },
                error: (err) => {
                    console.error('Update qualification error:', err.error);
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la mise à jour' });
                }
            });
        } else {
            this.hrService.createQualification(payload).subscribe({
                next: () => {
                    this.loadData();
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Qualification créée' });
                    this.showQualificationDialog = false;
                },
                error: (err) => {
                    console.error('Create qualification error:', err.error);
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la création' });
                }
            });
        }
    }

    confirmDeleteQualification(qual: Qualification): void {
        this.confirmationService.confirm({
            message: `Supprimer la qualification de ${qual.employee_name || 'cet employé'}?`,
            header: 'Confirmer la suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, supprimer',
            rejectLabel: 'Annuler',
            accept: () => {
                this.hrService.deleteQualification(qual.id).subscribe({
                    next: () => {
                        this.loadData();
                        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Qualification supprimée' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la suppression' })
                });
            }
        });
    }
}
