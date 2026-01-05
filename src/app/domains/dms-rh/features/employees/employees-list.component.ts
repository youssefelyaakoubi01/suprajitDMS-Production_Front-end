/**
 * Employees List Component
 * Domain: DMS-RH
 *
 * Displays and manages the employee directory with modern Sakai template styling
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// PrimeNG
import { TableModule, Table } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, MenuItem } from 'primeng/api';
import * as XLSX from 'xlsx';

// Domain imports
import { DmsEmployeeService, DmsExportService, DmsTeamService, Employee, Department, EmployeeCategory, Team } from '@domains/dms-rh';
import { environment } from '../../../../../environments/environment';
import { EmployeeFormDialogComponent } from './employee-form-dialog.component';
import { EmployeeDetailDialogComponent } from './employee-detail-dialog.component';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
    selector: 'app-employees-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        InputTextModule,
        ButtonModule,
        TagModule,
        AvatarModule,
        SelectModule,
        ToolbarModule,
        IconFieldModule,
        InputIconModule,
        TooltipModule,
        SkeletonModule,
        SelectButtonModule,
        ToastModule,
        MenuModule,
        RippleModule,
        BadgeModule,
        DialogModule,
        FileUploadModule,
        ProgressSpinnerModule,
        EmployeeFormDialogComponent,
        EmployeeDetailDialogComponent,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="employees-list">
            <!-- Page Header -->
            <div class="hr-page-header">
                <div class="header-title">
                    <div class="header-icon">
                        <i class="pi pi-id-card"></i>
                    </div>
                    <div class="title-text">
                        <h1>Annuaire des Employés</h1>
                        <span class="subtitle">Gérez votre personnel</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button pButton pRipple
                            icon="pi pi-upload"
                            label="Import"
                            class="p-button-outlined p-button-secondary"
                            (click)="openImportDialog()">
                    </button>
                    <button pButton pRipple
                            icon="pi pi-plus"
                            label="Nouvel Employé"
                            class="p-button-primary"
                            (click)="onAddEmployee()">
                    </button>
                </div>
            </div>

            <!-- Stats Row -->
            <div class="stats-row">
                <div class="hr-stat-card">
                    <div class="stat-icon success">
                        <i class="pi pi-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ employees.length }}</div>
                        <div class="stat-label">Total Employés</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--hr-success);">
                        <i class="pi pi-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-success">{{ activeCount }}</div>
                        <div class="stat-label">Actifs</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--hr-warning);">
                        <i class="pi pi-clock"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-warning">{{ onLeaveCount }}</div>
                        <div class="stat-label">En Congé</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--hr-info);">
                        <i class="pi pi-graduation-cap"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-info">{{ trainingCount }}</div>
                        <div class="stat-label">En Formation</div>
                    </div>
                </div>
            </div>

            <!-- Filter Toolbar -->
            <div class="hr-section-card">
                <div class="section-header">
                    <div class="toolbar-left">
                        <p-iconfield iconPosition="left">
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input pInputText
                                   [(ngModel)]="searchTerm"
                                   (ngModelChange)="onSearchChange($event)"
                                   placeholder="Rechercher par nom, badge..."
                                   class="search-input" />
                        </p-iconfield>
                    </div>
                    <div class="toolbar-center">
                        <p-selectbutton [options]="quickFilterOptions"
                                        [(ngModel)]="selectedQuickFilter"
                                        (onChange)="onQuickFilterChange($event)"
                                        optionLabel="label"
                                        optionValue="value"
                                        styleClass="filter-buttons">
                        </p-selectbutton>
                    </div>
                    <div class="toolbar-right">
                        <p-select [options]="departments"
                                  [(ngModel)]="selectedDepartment"
                                  (onChange)="onFilterChange()"
                                  placeholder="Département"
                                  optionLabel="department"
                                  optionValue="department"
                                  [showClear]="true"
                                  styleClass="filter-select">
                        </p-select>
                        <p-select [options]="categories"
                                  [(ngModel)]="selectedCategory"
                                  (onChange)="onFilterChange()"
                                  placeholder="Catégorie"
                                  optionLabel="name"
                                  optionValue="name"
                                  [showClear]="true"
                                  styleClass="filter-select">
                        </p-select>
                        <p-menu #exportMenu [model]="exportMenuItems" [popup]="true"></p-menu>
                        <button pButton pRipple
                                icon="pi pi-download"
                                class="p-button-outlined p-button-success"
                                (click)="exportMenu.toggle($event)"
                                pTooltip="Export data">
                        </button>
                    </div>
                </div>

                <!-- Employee Table -->
                <div class="section-body p-0">
                    <p-table #employeeTable
                             [value]="filteredEmployees"
                             [loading]="loading"
                             [paginator]="true"
                             [rows]="10"
                             [rowsPerPageOptions]="[10, 25, 50]"
                             [globalFilterFields]="['Nom_Emp', 'Prenom_Emp', 'Departement_Emp', 'Categorie_Emp']"
                             [rowHover]="true"
                             dataKey="Id_Emp"
                             [exportFilename]="'employees_export'"
                             styleClass="hr-table">

                        <ng-template pTemplate="header">
                            <tr>
                                <th style="width: 70px"></th>
                                <th pSortableColumn="Nom_Emp">
                                    <div class="flex align-items-center gap-2">
                                        Employé
                                        <p-sortIcon field="Nom_Emp"></p-sortIcon>
                                    </div>
                                </th>
                                <th pSortableColumn="BadgeNumber" style="width: 110px">
                                    <div class="flex align-items-center gap-2">
                                        Badge
                                        <p-sortIcon field="BadgeNumber"></p-sortIcon>
                                    </div>
                                </th>
                                <th pSortableColumn="CIN_Emp" style="width: 120px">
                                    <div class="flex align-items-center gap-2">
                                        CIN
                                        <p-sortIcon field="CIN_Emp"></p-sortIcon>
                                    </div>
                                </th>
                                <th pSortableColumn="Departement_Emp">
                                    <div class="flex align-items-center gap-2">
                                        Département
                                        <p-sortIcon field="Departement_Emp"></p-sortIcon>
                                    </div>
                                </th>
                                <th pSortableColumn="Categorie_Emp">
                                    <div class="flex align-items-center gap-2">
                                        Catégorie
                                        <p-sortIcon field="Categorie_Emp"></p-sortIcon>
                                    </div>
                                </th>
                                <th pSortableColumn="DateEmbauche_Emp" style="width: 120px">
                                    <div class="flex align-items-center gap-2">
                                        Embauche
                                        <p-sortIcon field="DateEmbauche_Emp"></p-sortIcon>
                                    </div>
                                </th>
                                <th style="width: 140px">Contact</th>
                                <th style="width: 100px">Statut</th>
                                <th style="width: 120px; text-align: center">Actions</th>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="body" let-employee>
                            <tr class="employee-row">
                                <td>
                                    <div class="hr-avatar-badge">
                                        <p-avatar [image]="getPhotoUrl(employee)"
                                                  [label]="!employee.Picture ? getInitials(employee) : undefined"
                                                  shape="circle"
                                                  size="large"
                                                  [style]="!employee.Picture ? {'background': 'var(--hr-gradient)', 'color': 'white'} : {}">
                                        </p-avatar>
                                        <span class="badge" [ngClass]="getStatusBadgeClass(employee.EmpStatus)"></span>
                                    </div>
                                </td>
                                <td>
                                    <div class="hr-employee-info">
                                        <div class="employee-details">
                                            <span class="employee-name">{{ employee.Prenom_Emp }} {{ employee.Nom_Emp }}</span>
                                            <span class="employee-meta">
                                                <span *ngIf="employee.Genre_Emp" class="gender-badge">{{ employee.Genre_Emp === 'M' ? 'Homme' : 'Femme' }}</span>
                                                <span *ngIf="employee.team_detail?.name"> · {{ employee.team_detail.name }}</span>
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="employee-id-badge" *ngIf="employee.BadgeNumber || employee.employee_id">
                                        <i class="pi pi-id-card"></i>
                                        {{ employee.BadgeNumber || employee.employee_id }}
                                    </span>
                                    <span class="text-muted" *ngIf="!employee.BadgeNumber && !employee.employee_id">-</span>
                                </td>
                                <td>
                                    <span class="cin-badge" *ngIf="employee.CIN_Emp || employee.cin">
                                        {{ employee.CIN_Emp || employee.cin }}
                                    </span>
                                    <span class="text-muted" *ngIf="!employee.CIN_Emp && !employee.cin">-</span>
                                </td>
                                <td>
                                    <div class="hr-info-row">
                                        <i class="pi pi-building"></i>
                                        <span>{{ employee.Departement_Emp || employee.department || '-' }}</span>
                                    </div>
                                </td>
                                <td>
                                    <p-tag [value]="employee.Categorie_Emp || employee.category || '-'"
                                           [severity]="getCategorySeverity(employee.Categorie_Emp || employee.category)"
                                           [rounded]="true">
                                    </p-tag>
                                </td>
                                <td>
                                    <div class="hr-info-row">
                                        <i class="pi pi-calendar"></i>
                                        <span>{{ (employee.DateEmbauche_Emp || employee.hire_date) | date:'dd/MM/yyyy' }}</span>
                                    </div>
                                </td>
                                <td>
                                    <div class="contact-info">
                                        <div class="contact-row" *ngIf="employee.Phone_Emp || employee.phone">
                                            <i class="pi pi-phone"></i>
                                            <span>{{ employee.Phone_Emp || employee.phone }}</span>
                                        </div>
                                        <div class="contact-row" *ngIf="employee.Email_Emp || employee.email">
                                            <i class="pi pi-envelope"></i>
                                            <span class="email-text" [pTooltip]="employee.Email_Emp || employee.email">
                                                {{ (employee.Email_Emp || employee.email) | slice:0:15 }}{{ (employee.Email_Emp || employee.email)?.length > 15 ? '...' : '' }}
                                            </span>
                                        </div>
                                        <span class="text-muted" *ngIf="!employee.Phone_Emp && !employee.phone && !employee.Email_Emp && !employee.email">-</span>
                                    </div>
                                </td>
                                <td>
                                    <p-tag [value]="getStatusLabel(employee.EmpStatus || employee.status)"
                                           [severity]="getStatusSeverity(employee.EmpStatus || employee.status)"
                                           [rounded]="true">
                                    </p-tag>
                                </td>
                                <td>
                                    <div class="hr-action-buttons">
                                        <button pButton pRipple
                                                icon="pi pi-eye"
                                                class="p-button-text p-button-rounded p-button-sm"
                                                (click)="onViewEmployee(employee)"
                                                pTooltip="Voir détails">
                                        </button>
                                        <button pButton pRipple
                                                icon="pi pi-pencil"
                                                class="p-button-text p-button-rounded p-button-sm"
                                                (click)="onEditEmployee(employee)"
                                                pTooltip="Modifier">
                                        </button>
                                        <button pButton pRipple
                                                icon="pi pi-trash"
                                                class="p-button-text p-button-rounded p-button-sm p-button-danger"
                                                (click)="onDeleteEmployee(employee)"
                                                pTooltip="Supprimer">
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="10">
                                    <div class="hr-empty-state">
                                        <i class="empty-icon pi pi-search"></i>
                                        <h3>Aucun employé trouvé</h3>
                                        <p>Aucun employé ne correspond à vos critères de recherche</p>
                                        <button pButton pRipple
                                                label="Réinitialiser les filtres"
                                                icon="pi pi-filter-slash"
                                                class="p-button-outlined"
                                                (click)="clearFilters()">
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="loadingbody">
                            <tr *ngFor="let i of [1,2,3,4,5]">
                                <td><p-skeleton shape="circle" size="48px"></p-skeleton></td>
                                <td><p-skeleton width="150px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="80px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="90px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="100px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="70px" height="24px" borderRadius="12px"></p-skeleton></td>
                                <td><p-skeleton width="80px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="100px" height="30px"></p-skeleton></td>
                                <td><p-skeleton width="60px" height="24px" borderRadius="12px"></p-skeleton></td>
                                <td><p-skeleton width="90px" height="32px"></p-skeleton></td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>

            <!-- Employee Detail Dialog -->
            <app-employee-detail-dialog
                [(visible)]="showDetailDialog"
                [employee]="detailEmployee"
                (close)="onCloseDetailDialog()"
                (edit)="onEditFromDetail($event)">
            </app-employee-detail-dialog>

            <!-- Employee Form Dialog -->
            <app-employee-form-dialog
                [(visible)]="showFormDialog"
                [employee]="selectedEmployee"
                [departments]="departments"
                [categories]="categories"
                [teams]="teams"
                (save)="onSaveEmployee($event)"
                (cancel)="onCancelDialog()">
            </app-employee-form-dialog>

            <!-- Confirm Dialog -->
            <p-confirmDialog header="Confirmation"
                             icon="pi pi-exclamation-triangle"
                             acceptLabel="Oui"
                             rejectLabel="Non">
            </p-confirmDialog>

            <p-toast></p-toast>

            <!-- Import Dialog -->
            <p-dialog [(visible)]="showImportDialog"
                      header="Importer des Employés"
                      [modal]="true"
                      [closable]="!importing"
                      [style]="{width: '550px'}">
                <div class="import-container">
                    <div class="import-info">
                        <i class="pi pi-info-circle"></i>
                        <div>
                            <p>Téléchargez un fichier Excel (.xlsx ou .xls) avec les données des employés.</p>
                            <small>Formats acceptés: colonnes en français (Id_Emp, Nom_Emp...) ou anglais (Badge ID, First Name...)</small>
                        </div>
                    </div>

                    <p-fileUpload
                        mode="basic"
                        accept=".xlsx,.xls"
                        [maxFileSize]="10000000"
                        chooseLabel="Choisir un fichier"
                        (onSelect)="onImportFileSelect($event)"
                        [disabled]="importing"
                        styleClass="w-full">
                    </p-fileUpload>

                    <div *ngIf="selectedImportFile && !importing" class="selected-file">
                        <i class="pi pi-file-excel"></i>
                        <span>{{ selectedImportFile.name }}</span>
                        <span class="file-size">({{ (selectedImportFile.size / 1024).toFixed(1) }} KB)</span>
                    </div>

                    <div *ngIf="importing" class="import-progress">
                        <p-progressSpinner [style]="{width: '40px', height: '40px'}" strokeWidth="4"></p-progressSpinner>
                        <span>Import en cours...</span>
                    </div>

                    <div *ngIf="importResult && !importing" class="import-results">
                        <div class="results-summary">
                            <p-tag *ngIf="importResult.imported > 0" severity="success" [value]="importResult.imported + ' créés'"></p-tag>
                            <p-tag *ngIf="importResult.updated > 0" severity="info" [value]="importResult.updated + ' mis à jour'"></p-tag>
                            <p-tag *ngIf="importResult.errors && importResult.errors.length > 0" severity="warn" [value]="importResult.errors.length + ' erreurs'"></p-tag>
                        </div>
                        <div *ngIf="importResult.errors && importResult.errors.length > 0" class="errors-list">
                            <p class="errors-title"><i class="pi pi-exclamation-triangle"></i> Erreurs:</p>
                            <ul>
                                <li *ngFor="let err of importResult.errors">{{ err }}</li>
                            </ul>
                        </div>
                    </div>

                    <div class="template-section">
                        <button pButton pRipple
                                label="Télécharger le Template"
                                icon="pi pi-download"
                                class="p-button-text"
                                (click)="downloadTemplate()">
                        </button>
                    </div>
                </div>

                <ng-template pTemplate="footer">
                    <div class="dialog-footer">
                        <button pButton pRipple
                                label="Fermer"
                                icon="pi pi-times"
                                class="p-button-text"
                                [disabled]="importing"
                                (click)="closeImportDialog()">
                        </button>
                        <button pButton pRipple
                                label="Importer"
                                icon="pi pi-upload"
                                [loading]="importing"
                                [disabled]="!selectedImportFile || importing"
                                (click)="importEmployees()">
                        </button>
                    </div>
                </ng-template>
            </p-dialog>
        </div>
    `,
    styles: [`
        .employees-list {
            padding: 1.5rem;
        }

        /* Stats Row */
        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        /* Toolbar Layout */
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--surface-border);
        }

        .toolbar-left {
            flex: 0 0 auto;
        }

        .toolbar-center {
            flex: 1 1 auto;
            display: flex;
            justify-content: center;
        }

        .toolbar-right {
            flex: 0 0 auto;
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }

        .search-input {
            width: 280px;
            border-radius: 8px;

            &:focus {
                border-color: var(--hr-primary);
                box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
            }
        }

        .filter-select {
            min-width: 140px;
        }

        /* Employee ID Badge */
        .employee-id-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 0.75rem;
            background: var(--primary-100, #E0E7FF);
            padding: 0.375rem 0.625rem;
            border-radius: 6px;
            color: var(--primary-700, #4338CA);
            font-weight: 500;

            i {
                font-size: 0.875rem;
            }
        }

        /* CIN Badge */
        .cin-badge {
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 0.75rem;
            background: var(--surface-100);
            padding: 0.375rem 0.625rem;
            border-radius: 6px;
            color: var(--text-color);
            font-weight: 500;
        }

        /* Contact Info */
        .contact-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .contact-row {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.75rem;
            color: var(--text-color-secondary);

            i {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
            }
        }

        .email-text {
            max-width: 100px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* Gender Badge */
        .gender-badge {
            font-size: 0.7rem;
            color: var(--text-color-secondary);
        }

        .text-muted {
            color: var(--text-color-secondary);
            font-style: italic;
        }

        /* Employee Row */
        .employee-row {
            transition: background-color 0.2s ease;

            &:hover {
                background: var(--surface-hover);
            }
        }

        /* Table customization */
        :host ::ng-deep {
            .p-datatable .p-datatable-thead > tr > th {
                background: var(--surface-50);
                padding: 1rem;
            }

            .p-datatable .p-datatable-tbody > tr > td {
                padding: 0.75rem 1rem;
            }

            .p-paginator {
                padding: 1rem;
                border-top: 1px solid var(--surface-border);
            }
        }

        /* Responsive */
        @media (max-width: 992px) {
            .section-header {
                flex-direction: column;
                align-items: stretch;
            }

            .toolbar-left,
            .toolbar-center,
            .toolbar-right {
                width: 100%;
                justify-content: flex-start;
            }

            .search-input {
                width: 100%;
            }
        }

        /* Import Dialog Styles */
        .import-container {
            .import-info {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                padding: 1rem;
                background: var(--blue-50);
                border-radius: 10px;
                margin-bottom: 1.5rem;
                text-align: left;

                > i {
                    color: var(--blue-500);
                    font-size: 1.25rem;
                    flex-shrink: 0;
                }

                p {
                    margin: 0 0 0.25rem 0;
                    color: var(--blue-700);
                    font-size: 0.9rem;
                }

                small {
                    color: var(--blue-600);
                    font-size: 0.8rem;
                }
            }

            .selected-file {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                background: var(--green-50);
                border: 1px solid var(--green-200);
                border-radius: 8px;
                margin-top: 1rem;
                color: var(--green-700);

                i { color: var(--green-600); font-size: 1.25rem; }
                .file-size { color: var(--green-500); font-size: 0.85rem; }
            }

            .import-progress {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                padding: 2rem;
                color: var(--text-color-secondary);
            }

            .import-results {
                margin-top: 1.5rem;
                padding: 1rem;
                background: var(--surface-50);
                border-radius: 10px;

                .results-summary {
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .errors-list {
                    margin-top: 1rem;
                    text-align: left;
                    background: var(--red-50);
                    border-radius: 8px;
                    padding: 1rem;

                    .errors-title {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        margin: 0 0 0.75rem 0;
                        font-weight: 600;
                        color: var(--red-600);
                        font-size: 0.9rem;
                    }

                    ul {
                        margin: 0;
                        padding-left: 1.25rem;
                        li {
                            color: var(--red-700);
                            font-size: 0.85rem;
                            margin-bottom: 0.35rem;
                        }
                    }
                }
            }

            .template-section {
                margin-top: 1.5rem;
                padding-top: 1rem;
                border-top: 1px solid var(--surface-border);
                text-align: center;
            }
        }

        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
        }

        .header-actions {
            display: flex;
            gap: 0.5rem;
        }
    `]
})
export class EmployeesListComponent implements OnInit, OnDestroy {
    @ViewChild('employeeTable') employeeTable!: Table;

    @Input() employees: Employee[] = [];
    @Input() departments: Department[] = [];
    @Input() categories: EmployeeCategory[] = [];
    @Input() loading = false;

    @Output() viewEmployee = new EventEmitter<Employee>();
    @Output() editEmployee = new EventEmitter<Employee>();
    @Output() deleteEmployee = new EventEmitter<Employee>();
    @Output() addEmployee = new EventEmitter<void>();
    @Output() filterChanged = new EventEmitter<any>();

    private destroy$ = new Subject<void>();
    private searchSubject = new Subject<string>();

    filteredEmployees: Employee[] = [];
    searchTerm = '';
    selectedDepartment: string | null = null;
    selectedCategory: string | null = null;
    selectedQuickFilter = 'all';

    quickFilterOptions = [
        { label: 'Tous', value: 'all' },
        { label: 'Actifs', value: 'active' },
        { label: 'En Congé', value: 'leave' },
        { label: 'Formation', value: 'training' }
    ];

    private mediaUrl = environment.mediaUrl;

    // Dialog properties
    showFormDialog = false;
    showDetailDialog = false;
    showImportDialog = false;
    selectedEmployee: Employee | null = null;
    detailEmployee: Employee | null = null;
    teams: Team[] = [];

    // Import properties
    importing = false;
    selectedImportFile: File | null = null;
    importResult: { imported: number; updated: number; errors: string[]; success: boolean } | null = null;

    exportMenuItems: MenuItem[] = [
        {
            label: 'Export to Excel',
            icon: 'pi pi-file-excel',
            command: () => this.exportToExcel()
        },
        {
            label: 'Export to CSV',
            icon: 'pi pi-file',
            command: () => this.exportToCsv()
        }
    ];

    get activeCount(): number {
        return this.employees.filter(e => !e.EmpStatus || e.EmpStatus?.toLowerCase() === 'active').length;
    }

    get onLeaveCount(): number {
        return this.employees.filter(e => e.EmpStatus?.toLowerCase() === 'leave' || e.EmpStatus?.toLowerCase() === 'on leave').length;
    }

    get trainingCount(): number {
        return this.employees.filter(e => e.EmpStatus?.toLowerCase() === 'training').length;
    }

    constructor(
        private employeeService: DmsEmployeeService,
        private teamService: DmsTeamService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private exportService: DmsExportService
    ) {}

    ngOnInit(): void {
        this.filteredEmployees = [...this.employees];

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.applyFilters();
        });

        if (this.employees.length === 0) {
            this.loadEmployees();
        }

        if (this.departments.length === 0) {
            this.loadDepartments();
        }

        if (this.categories.length === 0) {
            this.loadCategories();
        }

        this.loadTeams();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadEmployees(): void {
        this.loading = true;
        this.employeeService.getEmployees()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (employees) => {
                    this.employees = employees;
                    this.filteredEmployees = [...employees];
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    loadDepartments(): void {
        this.employeeService.getDepartments()
            .pipe(takeUntil(this.destroy$))
            .subscribe(departments => {
                this.departments = departments;
            });
    }

    loadCategories(): void {
        this.employeeService.getEmployeeCategories()
            .pipe(takeUntil(this.destroy$))
            .subscribe(categories => {
                this.categories = categories;
            });
    }

    loadTeams(): void {
        this.teamService.getTeams()
            .pipe(takeUntil(this.destroy$))
            .subscribe(teams => {
                this.teams = teams;
            });
    }

    onSearchChange(value: string): void {
        this.searchSubject.next(value);
    }

    onQuickFilterChange(event: any): void {
        this.applyFilters();
    }

    onFilterChange(): void {
        this.applyFilters();
        this.filterChanged.emit({
            search: this.searchTerm,
            department: this.selectedDepartment,
            category: this.selectedCategory,
            quickFilter: this.selectedQuickFilter
        });
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.selectedDepartment = null;
        this.selectedCategory = null;
        this.selectedQuickFilter = 'all';
        this.applyFilters();
    }

    private applyFilters(): void {
        let filtered = [...this.employees];

        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                e.Nom_Emp?.toLowerCase().includes(term) ||
                e.Prenom_Emp?.toLowerCase().includes(term) ||
                e.Id_Emp?.toString().includes(term)
            );
        }

        if (this.selectedDepartment) {
            filtered = filtered.filter(e => e.Departement_Emp === this.selectedDepartment);
        }

        if (this.selectedCategory) {
            filtered = filtered.filter(e => e.Categorie_Emp === this.selectedCategory);
        }

        if (this.selectedQuickFilter !== 'all') {
            filtered = filtered.filter(e => {
                const status = e.EmpStatus?.toLowerCase() || 'active';
                return status === this.selectedQuickFilter;
            });
        }

        this.filteredEmployees = filtered;
    }

    getPhotoUrl(employee: Employee): string {
        if (employee.Picture) {
            if (employee.Picture.startsWith('http')) {
                return employee.Picture;
            }
            // Ensure the path starts with /
            const picturePath = employee.Picture.startsWith('/') ? employee.Picture : `/${employee.Picture}`;
            return `${this.mediaUrl}${picturePath}`;
        }
        return '';
    }

    getInitials(employee: Employee): string {
        const first = employee.Prenom_Emp?.charAt(0) || '';
        const last = employee.Nom_Emp?.charAt(0) || '';
        return (first + last).toUpperCase();
    }

    getCategorySeverity(category: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            'CDI': 'success',
            'CDD': 'info',
            'Interim': 'warn',
            'Stage': 'secondary'
        };
        return map[category] || 'info';
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            'Active': 'success',
            'active': 'success',
            'On Leave': 'warn',
            'on_leave': 'warn',
            'leave': 'warn',
            'Training': 'info',
            'training': 'info',
            'Inactive': 'danger',
            'inactive': 'danger',
            'Terminated': 'danger',
            'terminated': 'danger'
        };
        return map[status] || 'success';
    }

    getStatusLabel(status: string): string {
        const map: Record<string, string> = {
            'active': 'Actif',
            'Active': 'Actif',
            'inactive': 'Inactif',
            'Inactive': 'Inactif',
            'on_leave': 'En congé',
            'On Leave': 'En congé',
            'leave': 'En congé',
            'terminated': 'Terminé',
            'Terminated': 'Terminé',
            'training': 'Formation',
            'Training': 'Formation'
        };
        return map[status] || status || 'Actif';
    }

    getStatusBadgeClass(status: string): string {
        const statusLower = status?.toLowerCase() || 'active';
        if (statusLower === 'active') return 'badge-active';
        if (statusLower === 'leave' || statusLower === 'on leave') return 'badge-inactive';
        if (statusLower === 'training') return 'badge-training';
        return 'badge-active';
    }

    onAddEmployee(): void {
        this.selectedEmployee = null;
        this.showFormDialog = true;
    }

    onViewEmployee(employee: Employee): void {
        this.detailEmployee = employee;
        this.showDetailDialog = true;
    }

    onCloseDetailDialog(): void {
        this.showDetailDialog = false;
        this.detailEmployee = null;
    }

    onEditFromDetail(employee: Employee): void {
        this.showDetailDialog = false;
        this.detailEmployee = null;
        this.onEditEmployee(employee);
    }

    onEditEmployee(employee: Employee): void {
        this.selectedEmployee = employee;
        this.showFormDialog = true;
    }

    onDeleteEmployee(employee: Employee): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer l'employé ${employee.Prenom_Emp} ${employee.Nom_Emp} ?`,
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.employeeService.deleteEmployee(employee.Id_Emp)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            this.employees = this.employees.filter(e => e.Id_Emp !== employee.Id_Emp);
                            this.applyFilters();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Succès',
                                detail: 'Employé supprimé avec succès'
                            });
                        },
                        error: () => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erreur',
                                detail: 'Erreur lors de la suppression'
                            });
                        }
                    });
            }
        });
    }

    onSaveEmployee(saveData: { employee: Partial<Employee>; photo: File | null }): void {
        const { employee: employeeData, photo } = saveData;

        if (this.selectedEmployee) {
            // Update existing employee (with or without photo)
            const updateObservable = photo
                ? this.employeeService.updateEmployeeWithPhoto(this.selectedEmployee.Id_Emp, employeeData, photo)
                : this.employeeService.updateEmployee(this.selectedEmployee.Id_Emp, employeeData);

            updateObservable
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (updatedEmployee) => {
                        const index = this.employees.findIndex(e => e.Id_Emp === this.selectedEmployee!.Id_Emp);
                        if (index !== -1) {
                            this.employees[index] = { ...this.employees[index], ...updatedEmployee };
                        }
                        this.applyFilters();
                        this.showFormDialog = false;
                        this.selectedEmployee = null;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: 'Employé mis à jour avec succès'
                        });
                    },
                    error: (err) => {
                        console.error('Update employee error:', err);
                        const errorMessage = this.extractErrorMessage(err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: errorMessage || 'Erreur lors de la mise à jour'
                        });
                        // Reset the form dialog saving state
                        this.resetFormDialogSaving();
                    }
                });
        } else {
            // Create new employee (with or without photo)
            const createObservable = photo
                ? this.employeeService.createEmployeeWithPhoto(employeeData, photo)
                : this.employeeService.createEmployee(employeeData);

            createObservable
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (newEmployee) => {
                        this.employees.unshift(newEmployee);
                        this.applyFilters();
                        this.showFormDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: 'Employé créé avec succès'
                        });
                    },
                    error: (err) => {
                        console.error('Create employee error:', err);
                        const errorMessage = this.extractErrorMessage(err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: errorMessage || 'Erreur lors de la création'
                        });
                        // Reset the form dialog saving state
                        this.resetFormDialogSaving();
                    }
                });
        }
    }

    @ViewChild(EmployeeFormDialogComponent) formDialog!: EmployeeFormDialogComponent;

    private resetFormDialogSaving(): void {
        if (this.formDialog) {
            this.formDialog.setSaving(false);
        }
    }

    private extractErrorMessage(err: any): string {
        if (err?.error) {
            // Handle Django REST Framework error responses
            if (typeof err.error === 'object') {
                const errors: string[] = [];
                for (const key in err.error) {
                    if (Array.isArray(err.error[key])) {
                        errors.push(`${key}: ${err.error[key].join(', ')}`);
                    } else if (typeof err.error[key] === 'string') {
                        errors.push(`${key}: ${err.error[key]}`);
                    }
                }
                return errors.join('; ') || 'Erreur de validation';
            }
            if (typeof err.error === 'string') {
                return err.error;
            }
        }
        if (err?.message) {
            return err.message;
        }
        return '';
    }

    onCancelDialog(): void {
        this.showFormDialog = false;
        this.selectedEmployee = null;
    }

    exportToExcel(): void {
        if (this.filteredEmployees.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Data',
                detail: 'No employees to export'
            });
            return;
        }

        this.exportService.exportEmployees(this.filteredEmployees);
        this.messageService.add({
            severity: 'success',
            summary: 'Export Complete',
            detail: `${this.filteredEmployees.length} employees exported to Excel`
        });
    }

    exportToCsv(): void {
        if (this.filteredEmployees.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Data',
                detail: 'No employees to export'
            });
            return;
        }

        this.exportService.exportEmployeesToCsv(this.filteredEmployees);
        this.messageService.add({
            severity: 'success',
            summary: 'Export Complete',
            detail: `${this.filteredEmployees.length} employees exported to CSV`
        });
    }

    // ==================== IMPORT METHODS ====================
    openImportDialog(): void {
        this.showImportDialog = true;
        this.selectedImportFile = null;
        this.importResult = null;
        this.importing = false;
    }

    closeImportDialog(): void {
        this.showImportDialog = false;
        this.selectedImportFile = null;
        this.importResult = null;
        this.importing = false;
    }

    onImportFileSelect(event: any): void {
        if (event.files && event.files.length > 0) {
            this.selectedImportFile = event.files[0];
            this.importResult = null;
        }
    }

    importEmployees(): void {
        if (!this.selectedImportFile) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Attention',
                detail: 'Veuillez sélectionner un fichier'
            });
            return;
        }

        this.importing = true;
        this.importResult = null;

        this.employeeService.importEmployees(this.selectedImportFile).subscribe({
            next: (result) => {
                this.importing = false;
                this.importResult = result;

                if (result.success) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Import réussi',
                        detail: `${result.imported || 0} créés, ${result.updated || 0} mis à jour`,
                        life: 5000
                    });
                    this.loadEmployees();
                }

                if (result.errors && result.errors.length > 0) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Avertissements',
                        detail: `${result.errors.length} erreur(s) détectée(s)`,
                        life: 5000
                    });
                }
            },
            error: (err) => {
                this.importing = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.error || 'Échec de l\'import',
                    life: 5000
                });
            }
        });
    }

    downloadTemplate(): void {
        const headers = ['Badge ID', 'First Name', 'Last Name', 'Gender', 'Date of Birth', 'Category', 'Department', 'Hire Date', 'Status'];
        const sampleData = ['EMP001', 'John', 'Doe', 'M', '1990-01-15', 'Operator', 'Production', '2024-01-01', 'Active'];
        const instructions = [
            '',
            'Instructions:',
            '- Gender: M or F',
            '- Category: Operator, Team Leader, Supervisor, Manager, Technician, Engineer',
            '- Status: Active, Inactive, On Leave, Terminated',
            '- Dates: YYYY-MM-DD format',
            '',
            'French columns also accepted: Id_Emp, Nom_Emp, Prenom_Emp, etc.'
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, sampleData, [], ...instructions.map(i => [i])]);
        ws['!cols'] = [
            { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 8 },
            { wch: 14 }, { wch: 15 }, { wch: 20 }, { wch: 14 }, { wch: 12 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Employees');
        XLSX.writeFile(wb, 'employee_import_template.xlsx');

        this.messageService.add({
            severity: 'info',
            summary: 'Template',
            detail: 'Template téléchargé avec succès'
        });
    }
}
