/**
 * Affectations Component
 * Domain: DMS-RH
 *
 * Manages employee-workstation assignments with full CRUD operations
 * Following Sakai template design patterns and PrimeNG v19
 */
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';

// PrimeNG
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { RippleModule } from 'primeng/ripple';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';

import { HRService } from '@core/services/hr.service';
import { ApiService } from '@core/services/api.service';
import { AssignmentStateService } from '@core/state/assignment-state.service';
import { EmployeeWorkstationAssignment, AssignmentCreateRequest } from '../../models/assignment.model';
import { Employee, HRWorkstation } from '@core/models/employee.model';
import { environment } from '../../../../../environments/environment';
import { EmployeeAutocompleteComponent } from '@shared/components/employee-autocomplete/employee-autocomplete.component';
import { EmployeeSearchResult } from '@core/services/employee-search.service';

interface Machine {
    id: number;
    name: string;
    code: string;
    workstation: number;
}

interface ProductionLine {
    id: number;
    name: string;
    code: string;
}

@Component({
    selector: 'app-affectations',
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
        ToastModule,
        ConfirmDialogModule,
        ToolbarModule,
        CardModule,
        AvatarModule,
        CheckboxModule,
        TextareaModule,
        BadgeModule,
        SkeletonModule,
        RippleModule,
        IconFieldModule,
        InputIconModule,
        EmployeeAutocompleteComponent
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="affectations-container">
            <!-- Page Header -->
            <div class="hr-page-header">
                <div class="header-title">
                    <div class="header-icon">
                        <i class="pi pi-link"></i>
                    </div>
                    <div class="title-text">
                        <h1>Workstation Assignments</h1>
                        <span class="subtitle">Manage employee workstation and machine assignments</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button pButton pRipple
                            icon="pi pi-refresh"
                            class="p-button-outlined p-button-secondary"
                            (click)="loadData()"
                            [loading]="loading"
                            pTooltip="Refresh data">
                    </button>
                </div>
            </div>

            <!-- Stats Row -->
            <div class="stats-row">
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: var(--hr-primary);">
                        <i class="pi pi-link"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats().total_assignments }}</div>
                        <div class="stat-label">Total Assignments</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--hr-success);">
                        <i class="pi pi-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-success">{{ stats().employees_with_assignments }}</div>
                        <div class="stat-label">Employees Assigned</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--hr-warning);">
                        <i class="pi pi-star-fill"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-warning">{{ stats().employees_with_primary }}</div>
                        <div class="stat-label">With Primary WS</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--hr-info);">
                        <i class="pi pi-desktop"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-info">{{ workstations.length }}</div>
                        <div class="stat-label">Workstations</div>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="hr-section-card">
                <div class="section-header">
                    <span class="section-title">
                        <i class="pi pi-list"></i>
                        Assignment Directory
                    </span>
                    <div class="section-actions">
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input pInputText type="text"
                                   [(ngModel)]="searchTerm"
                                   (input)="onSearch()"
                                   placeholder="Search assignments..."
                                   class="search-input" />
                        </p-iconfield>
                        <p-select [options]="productionLines"
                                  [(ngModel)]="selectedProductionLine"
                                  (onChange)="onFilterChange()"
                                  optionLabel="name"
                                  optionValue="id"
                                  placeholder="Filter by Line"
                                  [showClear]="true"
                                  styleClass="filter-select">
                        </p-select>
                        <button pButton pRipple
                                icon="pi pi-plus"
                                label="New Assignment"
                                class="p-button-primary"
                                (click)="openNewAssignmentDialog()">
                        </button>
                    </div>
                </div>

                <div class="section-body">
                    <!-- Loading State -->
                    <div *ngIf="loading" class="loading-skeleton">
                        <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]">
                            <p-skeleton shape="circle" size="40px"></p-skeleton>
                            <p-skeleton width="150px" height="16px"></p-skeleton>
                            <p-skeleton width="120px" height="16px"></p-skeleton>
                            <p-skeleton width="100px" height="16px"></p-skeleton>
                            <p-skeleton width="80px" height="24px" borderRadius="12px"></p-skeleton>
                            <p-skeleton width="60px" height="16px"></p-skeleton>
                        </div>
                    </div>

                    <!-- Data Table -->
                    <p-table *ngIf="!loading"
                             [value]="filteredAssignments()"
                             [paginator]="true"
                             [rows]="10"
                             [rowsPerPageOptions]="[5, 10, 25, 50]"
                             [showCurrentPageReport]="true"
                             currentPageReportTemplate="Showing {first} to {last} of {totalRecords} assignments"
                             [rowHover]="true"
                             dataKey="id"
                             styleClass="p-datatable-sm hr-table"
                             [globalFilterFields]="['employee_name', 'employee_badge', 'workstation_name', 'production_line_name']">

                        <ng-template pTemplate="header">
                            <tr>
                                <th style="width: 250px">Employee</th>
                                <th pSortableColumn="workstation_name">Workstation <p-sortIcon field="workstation_name"></p-sortIcon></th>
                                <th>Machine</th>
                                <th pSortableColumn="production_line_name">Production Line <p-sortIcon field="production_line_name"></p-sortIcon></th>
                                <th style="width: 100px; text-align: center">Primary</th>
                                <th pSortableColumn="created_at">Created <p-sortIcon field="created_at"></p-sortIcon></th>
                                <th style="width: 120px; text-align: center">Actions</th>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="body" let-assignment>
                            <tr>
                                <!-- Employee Column -->
                                <td>
                                    <div class="hr-employee-info">
                                        <div class="hr-avatar-badge">
                                            <p-avatar [image]="getEmployeePicture(assignment.employee_picture)"
                                                      [label]="!assignment.employee_picture ? getInitials(assignment.employee_name) : undefined"
                                                      shape="circle"
                                                      size="large"
                                                      [style]="{'background': 'var(--hr-gradient)', 'color': 'white'}">
                                            </p-avatar>
                                        </div>
                                        <div class="employee-details">
                                            <span class="employee-name">{{ assignment.employee_name }}</span>
                                            <div class="employee-meta">
                                                <span class="badge-id">
                                                    <i class="pi pi-id-card"></i>
                                                    {{ assignment.employee_badge || 'N/A' }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                <!-- Workstation Column -->
                                <td>
                                    <div class="workstation-info">
                                        <span class="ws-name">{{ assignment.workstation_name }}</span>
                                        <span class="ws-code">
                                            <p-tag [value]="assignment.workstation_code" severity="info" [rounded]="true"></p-tag>
                                        </span>
                                    </div>
                                </td>

                                <!-- Machine Column -->
                                <td>
                                    <span *ngIf="assignment.machine_name" class="machine-name">
                                        <i class="pi pi-cog"></i>
                                        {{ assignment.machine_name }}
                                    </span>
                                    <span *ngIf="!assignment.machine_name" class="no-machine">-</span>
                                </td>

                                <!-- Production Line Column -->
                                <td>
                                    <span class="production-line">{{ assignment.production_line_name || '-' }}</span>
                                </td>

                                <!-- Primary Column -->
                                <td class="text-center">
                                    <div class="primary-indicator" [class.is-primary]="assignment.is_primary"
                                         (click)="togglePrimary(assignment)"
                                         [pTooltip]="assignment.is_primary ? 'Primary workstation' : 'Click to set as primary'">
                                        <i [class]="assignment.is_primary ? 'pi pi-star-fill' : 'pi pi-star'"></i>
                                    </div>
                                </td>

                                <!-- Created Date Column -->
                                <td>
                                    <div class="date-info">
                                        <span class="date">{{ assignment.created_at | date:'dd/MM/yyyy' }}</span>
                                        <span class="created-by" *ngIf="assignment.created_by">
                                            by {{ assignment.created_by }}
                                        </span>
                                    </div>
                                </td>

                                <!-- Actions Column -->
                                <td class="text-center">
                                    <div class="hr-action-buttons">
                                        <button pButton pRipple
                                                icon="pi pi-pencil"
                                                class="p-button-text p-button-rounded p-button-sm"
                                                (click)="editAssignment(assignment)"
                                                pTooltip="Edit">
                                        </button>
                                        <button pButton pRipple
                                                icon="pi pi-eye"
                                                class="p-button-text p-button-rounded p-button-info p-button-sm"
                                                (click)="viewAssignmentDetails(assignment)"
                                                pTooltip="View Details">
                                        </button>
                                        <button pButton pRipple
                                                icon="pi pi-trash"
                                                class="p-button-text p-button-rounded p-button-danger p-button-sm"
                                                (click)="confirmDeleteAssignment(assignment)"
                                                pTooltip="Delete">
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="7">
                                    <div class="hr-empty-state">
                                        <i class="pi pi-link empty-icon"></i>
                                        <h3>No Assignments Found</h3>
                                        <p>Start by assigning employees to workstations</p>
                                        <button pButton pRipple
                                                icon="pi pi-plus"
                                                label="Create First Assignment"
                                                class="p-button-primary"
                                                (click)="openNewAssignmentDialog()">
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>

        <!-- Assignment Dialog -->
        <p-dialog [(visible)]="showAssignmentDialog"
                  [header]="editingAssignment ? 'Edit Assignment' : 'New Assignment'"
                  [modal]="true"
                  [style]="{width: '550px'}"
                  [draggable]="false"
                  [resizable]="false"
                  styleClass="hr-dialog">
            <form [formGroup]="assignmentForm" class="assignment-form">
                <!-- Employee Selection -->
                <div class="form-field">
                    <label for="employee">
                        <i class="pi pi-user"></i>
                        Employee <span class="required">*</span>
                    </label>
                    <app-employee-autocomplete
                        formControlName="employee"
                        placeholder="Search employee by name or badge..."
                        [appendTo]="'body'"
                        inputId="employee"
                        (employeeSelected)="onEmployeeSelected($event)">
                    </app-employee-autocomplete>
                    <small class="help-text">Search by badge number or employee name</small>
                    <small class="p-error" *ngIf="assignmentForm.get('employee')?.invalid && assignmentForm.get('employee')?.touched">
                        Employee is required
                    </small>
                </div>

                <!-- Production Line Selection -->
                <div class="form-field">
                    <label for="productionLine">
                        <i class="pi pi-sitemap"></i>
                        Ligne de Production
                        <span class="count-badge" *ngIf="productionLines.length > 0">
                            ({{ productionLines.length }})
                        </span>
                    </label>
                    <p-select id="productionLine"
                              [(ngModel)]="selectedFormProductionLine"
                              [ngModelOptions]="{standalone: true}"
                              [options]="productionLines"
                              optionLabel="name"
                              optionValue="id"
                              [filter]="true"
                              [virtualScroll]="true"
                              [virtualScrollItemSize]="45"
                              filterPlaceholder="Rechercher ligne..."
                              placeholder="Filtrer par ligne de production"
                              [showClear]="true"
                              (onChange)="onFormProductionLineChange()"
                              [panelStyle]="{'max-height': '300px'}"
                              appendTo="body"
                              styleClass="w-full production-line-dropdown">
                        <ng-template let-line pTemplate="item">
                            <div class="line-option-item">
                                <i class="pi pi-sitemap line-icon"></i>
                                <span class="line-option-name">{{ line.name }}</span>
                                <p-tag *ngIf="line.code" [value]="line.code" severity="secondary" [rounded]="true" styleClass="line-code-tag"></p-tag>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="selectedItem" let-line>
                            <div class="line-selected" *ngIf="line">
                                <i class="pi pi-sitemap"></i>
                                <span>{{ line.name }}</span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="empty">
                            <div class="dropdown-empty">
                                <i class="pi pi-inbox"></i>
                                <span>Aucune ligne trouvée</span>
                            </div>
                        </ng-template>
                    </p-select>
                </div>

                <!-- Workstation Selection -->
                <div class="form-field">
                    <label for="workstation">
                        <i class="pi pi-desktop"></i>
                        Workstation <span class="required">*</span>
                        <span class="count-badge" *ngIf="filteredFormWorkstations.length > 0">
                            ({{ filteredFormWorkstations.length }})
                        </span>
                    </label>
                    <p-select id="workstation"
                              formControlName="workstation"
                              [options]="filteredFormWorkstations"
                              optionLabel="name"
                              optionValue="id"
                              [filter]="true"
                              [virtualScroll]="true"
                              [virtualScrollItemSize]="50"
                              filterPlaceholder="Rechercher workstation..."
                              placeholder="Sélectionner une workstation"
                              (onChange)="onWorkstationChange()"
                              [panelStyle]="{'max-height': '350px'}"
                              appendTo="body"
                              styleClass="w-full workstation-dropdown">
                        <ng-template let-ws pTemplate="item">
                            <div class="workstation-option-item">
                                <div class="ws-option-main">
                                    <i class="pi pi-desktop ws-icon"></i>
                                    <span class="ws-option-name">{{ ws.name }}</span>
                                </div>
                                <div class="ws-option-meta">
                                    <p-tag [value]="ws.code" severity="info" [rounded]="true" styleClass="ws-code-tag"></p-tag>
                                    <span class="ws-line" *ngIf="ws.production_line_name">{{ ws.production_line_name }}</span>
                                </div>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="selectedItem" let-ws>
                            <div class="workstation-selected" *ngIf="ws">
                                <i class="pi pi-desktop"></i>
                                <span>{{ ws.name }}</span>
                                <p-tag [value]="ws.code" severity="info" [rounded]="true" styleClass="ws-selected-tag"></p-tag>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="empty">
                            <div class="dropdown-empty">
                                <i class="pi pi-inbox"></i>
                                <span>Aucune workstation trouvée</span>
                            </div>
                        </ng-template>
                    </p-select>
                    <small class="help-text" *ngIf="!selectedFormProductionLine">
                        Sélectionnez une ligne de production pour filtrer les workstations
                    </small>
                    <small class="p-error" *ngIf="assignmentForm.get('workstation')?.invalid && assignmentForm.get('workstation')?.touched">
                        Workstation is required
                    </small>
                </div>

                <!-- Machine Selection -->
                <div class="form-field">
                    <label for="machine">
                        <i class="pi pi-cog"></i>
                        Machine (Optionnel)
                        <span class="count-badge" *ngIf="filteredMachines.length > 0">
                            ({{ filteredMachines.length }})
                        </span>
                    </label>
                    <p-select id="machine"
                              formControlName="machine"
                              [options]="filteredMachines"
                              optionLabel="name"
                              optionValue="id"
                              [filter]="true"
                              [virtualScroll]="true"
                              [virtualScrollItemSize]="45"
                              filterPlaceholder="Rechercher machine..."
                              placeholder="Sélectionner une machine"
                              [showClear]="true"
                              [panelStyle]="{'max-height': '300px'}"
                              appendTo="body"
                              styleClass="w-full machine-dropdown">
                        <ng-template let-machine pTemplate="item">
                            <div class="machine-option-item">
                                <i class="pi pi-cog machine-icon"></i>
                                <span class="machine-option-name">{{ machine.name }}</span>
                                <p-tag *ngIf="machine.code" [value]="machine.code" severity="warn" [rounded]="true" styleClass="machine-code-tag"></p-tag>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="selectedItem" let-machine>
                            <div class="machine-selected" *ngIf="machine">
                                <i class="pi pi-cog"></i>
                                <span>{{ machine.name }}</span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="empty">
                            <div class="dropdown-empty">
                                <i class="pi pi-inbox"></i>
                                <span>{{ assignmentForm.get('workstation')?.value ? 'Aucune machine pour cette workstation' : 'Sélectionnez d\'abord une workstation' }}</span>
                            </div>
                        </ng-template>
                    </p-select>
                    <small class="help-text" *ngIf="!assignmentForm.get('workstation')?.value">
                        Sélectionnez une workstation pour voir les machines disponibles
                    </small>
                </div>

                <!-- Primary Checkbox -->
                <div class="form-field checkbox-field">
                    <p-checkbox formControlName="is_primary"
                                [binary]="true"
                                inputId="isPrimary">
                    </p-checkbox>
                    <label for="isPrimary" class="checkbox-label">
                        <i class="pi pi-star-fill text-warning"></i>
                        Set as primary workstation
                    </label>
                    <small class="help-text">Primary workstation is used for auto-fill when scanning badge</small>
                </div>

                <!-- Notes -->
                <div class="form-field">
                    <label for="notes">
                        <i class="pi pi-file-edit"></i>
                        Notes
                    </label>
                    <textarea pTextarea
                              id="notes"
                              formControlName="notes"
                              [rows]="3"
                              placeholder="Add any notes about this assignment..."
                              class="w-full">
                    </textarea>
                </div>
            </form>

            <ng-template pTemplate="footer">
                <div class="dialog-footer">
                    <button pButton pRipple
                            label="Cancel"
                            icon="pi pi-times"
                            class="p-button-text"
                            (click)="showAssignmentDialog = false">
                    </button>
                    <button pButton pRipple
                            [label]="editingAssignment ? 'Update' : 'Create'"
                            icon="pi pi-check"
                            class="p-button-primary"
                            (click)="saveAssignment()"
                            [disabled]="assignmentForm.invalid"
                            [loading]="saving">
                    </button>
                </div>
            </ng-template>
        </p-dialog>

        <!-- Detail Dialog -->
        <p-dialog [(visible)]="showDetailDialog"
                  header="Assignment Details"
                  [modal]="true"
                  [style]="{width: '500px'}"
                  [draggable]="false"
                  styleClass="hr-dialog">
            <div class="detail-content" *ngIf="selectedAssignment">
                <div class="detail-header">
                    <p-avatar [image]="getEmployeePicture(selectedAssignment.employee_picture)"
                              [label]="!selectedAssignment.employee_picture ? getInitials(selectedAssignment.employee_name) : undefined"
                              shape="circle"
                              size="xlarge"
                              [style]="{'background': 'var(--hr-gradient)', 'color': 'white'}">
                    </p-avatar>
                    <div class="detail-title">
                        <h3>{{ selectedAssignment.employee_name }}</h3>
                        <p-tag [value]="selectedAssignment.employee_badge || 'N/A'" severity="secondary"></p-tag>
                    </div>
                </div>

                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Workstation</label>
                        <span>{{ selectedAssignment.workstation_name }}</span>
                    </div>
                    <div class="detail-item">
                        <label>Code</label>
                        <p-tag [value]="selectedAssignment.workstation_code" severity="info"></p-tag>
                    </div>
                    <div class="detail-item">
                        <label>Production Line</label>
                        <span>{{ selectedAssignment.production_line_name || '-' }}</span>
                    </div>
                    <div class="detail-item">
                        <label>Machine</label>
                        <span>{{ selectedAssignment.machine_name || 'No machine assigned' }}</span>
                    </div>
                    <div class="detail-item">
                        <label>Primary</label>
                        <p-tag [value]="selectedAssignment.is_primary ? 'Yes' : 'No'"
                               [severity]="selectedAssignment.is_primary ? 'success' : 'secondary'">
                        </p-tag>
                    </div>
                    <div class="detail-item">
                        <label>Created</label>
                        <span>{{ selectedAssignment.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    <div class="detail-item full-width" *ngIf="selectedAssignment.notes">
                        <label>Notes</label>
                        <span>{{ selectedAssignment.notes }}</span>
                    </div>
                    <div class="detail-item" *ngIf="selectedAssignment.created_by">
                        <label>Created By</label>
                        <span>{{ selectedAssignment.created_by }}</span>
                    </div>
                    <div class="detail-item" *ngIf="selectedAssignment.updated_at">
                        <label>Last Updated</label>
                        <span>{{ selectedAssignment.updated_at | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <button pButton pRipple
                        label="Close"
                        class="p-button-text"
                        (click)="showDetailDialog = false">
                </button>
                <button pButton pRipple
                        label="Edit"
                        icon="pi pi-pencil"
                        class="p-button-primary"
                        (click)="showDetailDialog = false; editAssignment(selectedAssignment!)">
                </button>
            </ng-template>
        </p-dialog>

        <p-toast position="top-right"></p-toast>
        <p-confirmDialog></p-confirmDialog>
    `,
    styles: [`
        .affectations-container {
            padding: 1.5rem;
        }

        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .section-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .search-input {
                min-width: 250px;
            }

            .filter-select {
                min-width: 180px;
            }
        }

        .loading-skeleton {
            .skeleton-row {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                border-bottom: 1px solid var(--surface-border);
            }
        }

        /* Employee Info */
        .hr-employee-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .employee-details {
                .employee-name {
                    font-weight: 600;
                    color: var(--text-color);
                    display: block;
                }

                .employee-meta {
                    font-size: 0.8125rem;
                    color: var(--text-color-secondary);
                    margin-top: 0.25rem;

                    .badge-id {
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;

                        i {
                            font-size: 0.75rem;
                        }
                    }
                }
            }
        }

        /* Workstation Info */
        .workstation-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            .ws-name {
                font-weight: 500;
                color: var(--text-color);
            }
        }

        /* Machine & Production Line */
        .machine-name {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-color);

            i {
                color: var(--hr-primary);
            }
        }

        .no-machine {
            color: var(--text-color-secondary);
        }

        .production-line {
            color: var(--text-color);
        }

        /* Primary Indicator */
        .primary-indicator {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
            background: var(--surface-100);

            i {
                font-size: 1.25rem;
                color: var(--surface-400);
                transition: all 0.2s ease;
            }

            &:hover {
                background: rgba(245, 158, 11, 0.1);
                i {
                    color: var(--hr-warning);
                }
            }

            &.is-primary {
                background: rgba(245, 158, 11, 0.15);
                i {
                    color: var(--hr-warning);
                }
            }
        }

        /* Date Info */
        .date-info {
            display: flex;
            flex-direction: column;

            .date {
                color: var(--text-color);
                font-size: 0.875rem;
            }

            .created-by {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
            }
        }

        /* Form Styles */
        .assignment-form {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;

            .form-field {
                label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    color: var(--text-color);

                    i {
                        color: var(--hr-primary);
                    }

                    .required {
                        color: var(--hr-danger);
                    }
                }

                .help-text {
                    display: block;
                    margin-top: 0.25rem;
                    font-size: 0.75rem;
                    color: var(--text-color-secondary);
                }

                &.checkbox-field {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    flex-wrap: wrap;

                    .checkbox-label {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        margin-bottom: 0;
                        cursor: pointer;
                    }

                    .help-text {
                        width: 100%;
                        margin-left: 1.75rem;
                    }
                }
            }

            .employee-option,
            .workstation-option {
                display: flex;
                align-items: center;
                gap: 0.75rem;

                .option-details {
                    display: flex;
                    flex-direction: column;

                    .option-name {
                        font-weight: 500;
                    }

                    .option-badge {
                        font-size: 0.75rem;
                        color: var(--text-color-secondary);
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;

                        i {
                            font-size: 0.7rem;
                        }
                    }
                }
            }

            .employee-selected {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                .badge-hint {
                    font-size: 0.8rem;
                    color: var(--text-color-secondary);
                }
            }

            /* Count Badge */
            .count-badge {
                font-size: 0.75rem;
                font-weight: 400;
                color: var(--text-color-secondary);
            }

            /* Workstation Dropdown Styles */
            .workstation-option-item {
                display: flex;
                flex-direction: column;
                gap: 0.375rem;
                padding: 0.5rem 0;
                width: 100%;
            }

            .ws-option-main {
                display: flex;
                align-items: center;
                gap: 0.625rem;

                .ws-icon {
                    color: var(--hr-primary);
                    font-size: 1rem;
                }

                .ws-option-name {
                    font-weight: 500;
                    color: var(--text-color);
                    font-size: 0.9375rem;
                }
            }

            .ws-option-meta {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-left: 1.625rem;

                .ws-line {
                    font-size: 0.75rem;
                    color: var(--text-color-secondary);
                }
            }

            .workstation-selected {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                i {
                    color: var(--hr-primary);
                }

                span {
                    font-weight: 500;
                }
            }

            .dropdown-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 1.5rem;
                color: var(--text-color-secondary);

                i {
                    font-size: 2rem;
                    opacity: 0.5;
                }
            }

            /* Production Line Dropdown Styles */
            .line-option-item {
                display: flex;
                align-items: center;
                gap: 0.625rem;
                padding: 0.375rem 0;

                .line-icon {
                    color: var(--teal-500);
                    font-size: 1rem;
                }

                .line-option-name {
                    font-weight: 500;
                    color: var(--text-color);
                    flex: 1;
                }
            }

            .line-selected {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                i {
                    color: var(--teal-500);
                }

                span {
                    font-weight: 500;
                }
            }

            /* Machine Dropdown Styles */
            .machine-option-item {
                display: flex;
                align-items: center;
                gap: 0.625rem;
                padding: 0.375rem 0;

                .machine-icon {
                    color: var(--orange-500);
                    font-size: 1rem;
                }

                .machine-option-name {
                    font-weight: 500;
                    color: var(--text-color);
                    flex: 1;
                }
            }

            .machine-selected {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                i {
                    color: var(--orange-500);
                }

                span {
                    font-weight: 500;
                }
            }
        }

        /* Global dropdown panel styles */
        :host ::ng-deep {
            .workstation-dropdown {
                .p-select-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
            }

            .p-select-panel {
                .p-select-items {
                    padding: 0.25rem;
                }

                .p-select-item {
                    padding: 0.5rem 0.75rem;
                    border-radius: 6px;
                    margin: 2px 0;

                    &:hover {
                        background: var(--surface-hover);
                    }

                    &.p-highlight {
                        background: rgba(139, 92, 246, 0.1);
                    }
                }

                .ws-code-tag,
                .line-code-tag,
                .machine-code-tag {
                    font-size: 0.6875rem;
                    padding: 0.125rem 0.375rem;
                }
            }

            .ws-selected-tag,
            .line-code-tag,
            .machine-code-tag {
                font-size: 0.6875rem;
                padding: 0.125rem 0.375rem;
            }

            /* Production Line Dropdown Panel */
            .production-line-dropdown,
            .machine-dropdown {
                .p-select-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
            }
        }

        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
        }

        /* Detail Dialog */
        .detail-content {
            .detail-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding-bottom: 1.5rem;
                border-bottom: 1px solid var(--surface-border);
                margin-bottom: 1.5rem;

                .detail-title {
                    h3 {
                        margin: 0 0 0.5rem 0;
                        font-size: 1.25rem;
                        font-weight: 600;
                    }
                }
            }

            .detail-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1.25rem;

                .detail-item {
                    label {
                        display: block;
                        font-size: 0.75rem;
                        font-weight: 600;
                        color: var(--text-color-secondary);
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 0.25rem;
                    }

                    span {
                        color: var(--text-color);
                    }

                    &.full-width {
                        grid-column: span 2;
                    }
                }
            }
        }

        /* Empty State */
        .hr-empty-state {
            text-align: center;
            padding: 4rem 2rem;

            .empty-icon {
                font-size: 4rem;
                color: var(--surface-300);
                margin-bottom: 1.5rem;
            }

            h3 {
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--text-color);
                margin: 0 0 0.5rem 0;
            }

            p {
                color: var(--text-color-secondary);
                margin: 0 0 1.5rem 0;
            }
        }

        /* Text colors */
        .text-warning {
            color: var(--hr-warning) !important;
        }

        .text-success {
            color: var(--hr-success) !important;
        }

        .text-info {
            color: var(--hr-info) !important;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .section-actions {
                flex-wrap: wrap;

                .search-input,
                .filter-select {
                    min-width: 100%;
                }
            }

            .detail-grid {
                grid-template-columns: 1fr !important;
            }
        }
    `]
})
export class AffectationsComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private assignmentState = inject(AssignmentStateService);

    // Data
    employees: any[] = [];
    workstations: HRWorkstation[] = [];
    machines: Machine[] = [];
    productionLines: ProductionLine[] = [];

    // State
    loading = false;
    saving = false;
    searchTerm = '';
    selectedProductionLine: number | null = null;

    // Dialog state
    showAssignmentDialog = false;
    showDetailDialog = false;
    editingAssignment: EmployeeWorkstationAssignment | null = null;
    selectedAssignment: EmployeeWorkstationAssignment | null = null;
    assignmentForm!: FormGroup;

    // Form helpers
    selectedFormProductionLine: number | null = null;
    filteredFormWorkstations: HRWorkstation[] = [];
    filteredMachines: Machine[] = [];

    // Computed from state
    stats = this.assignmentState.stats;
    filteredAssignments = this.assignmentState.filteredAssignments;

    constructor(
        private hrService: HRService,
        private api: ApiService,
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
        this.assignmentForm = this.fb.group({
            employee: [null, Validators.required],
            workstation: [null, Validators.required],
            machine: [null],
            is_primary: [false],
            notes: ['']
        });
    }

    loadData(): void {
        this.loading = true;
        // Note: Employees are now loaded on-demand via EmployeeAutocompleteComponent
        // This reduces initial load time and memory usage for 3000+ employees
        forkJoin({
            assignments: this.hrService.getWorkstationAssignments().pipe(catchError(() => of([]))),
            workstations: this.hrService.getWorkstations().pipe(catchError(() => of([]))),
            machines: this.api.get<Machine[]>('production/machines').pipe(catchError(() => of([]))),
            productionLines: this.api.get<any>('production/lines').pipe(catchError(() => of([])))
        }).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading = false)
        ).subscribe({
            next: (data) => {
                this.workstations = data.workstations;
                this.filteredFormWorkstations = [...this.workstations];

                const machinesData = (data.machines as any);
                this.machines = machinesData.results || machinesData || [];

                const linesData = (data.productionLines as any);
                this.productionLines = (linesData.results || linesData || []).map((l: any) => ({
                    id: l.id,
                    name: l.name,
                    code: l.code
                }));
            }
        });
    }

    onSearch(): void {
        this.assignmentState.setSearchTerm(this.searchTerm);
    }

    onFilterChange(): void {
        this.assignmentState.setProductionLineFilter(this.selectedProductionLine);
    }

    getEmployeePicture(picture: string | null | undefined): string | undefined {
        if (!picture) return undefined;
        if (picture.startsWith('http') || picture.startsWith('assets/')) return picture;
        return `${environment.mediaUrl}${picture}`;
    }

    getInitials(name: string | undefined): string {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    /**
     * Handle employee selection from autocomplete
     */
    onEmployeeSelected(employee: EmployeeSearchResult): void {
        // The form control is already updated via formControlName
        // This handler can be used for additional logic if needed
        console.log('Employee selected:', employee.fullName);
    }

    // Dialog handlers
    openNewAssignmentDialog(): void {
        this.editingAssignment = null;
        this.assignmentForm.reset({ is_primary: false, notes: '' });
        this.selectedFormProductionLine = null;
        this.filteredFormWorkstations = [...this.workstations];
        this.filteredMachines = [];
        this.showAssignmentDialog = true;
    }

    editAssignment(assignment: EmployeeWorkstationAssignment): void {
        this.editingAssignment = assignment;
        this.assignmentForm.patchValue({
            employee: assignment.employee,
            workstation: assignment.workstation,
            machine: assignment.machine,
            is_primary: assignment.is_primary,
            notes: assignment.notes || ''
        });
        this.selectedFormProductionLine = assignment.production_line_id || null;
        this.onFormProductionLineChange();
        this.onWorkstationChange();
        this.showAssignmentDialog = true;
    }

    viewAssignmentDetails(assignment: EmployeeWorkstationAssignment): void {
        this.selectedAssignment = assignment;
        this.showDetailDialog = true;
    }

    onFormProductionLineChange(): void {
        if (this.selectedFormProductionLine) {
            this.filteredFormWorkstations = this.workstations.filter(
                ws => ws.production_line === this.selectedFormProductionLine
            );
        } else {
            this.filteredFormWorkstations = [...this.workstations];
        }
    }

    onWorkstationChange(): void {
        const workstationId = this.assignmentForm.get('workstation')?.value;
        if (workstationId) {
            this.filteredMachines = this.machines.filter(m => m.workstation === workstationId);
        } else {
            this.filteredMachines = [];
        }
        // Reset machine if workstation changed
        if (!this.editingAssignment) {
            this.assignmentForm.patchValue({ machine: null });
        }
    }

    saveAssignment(): void {
        if (this.assignmentForm.invalid) return;

        this.saving = true;
        const formValue = this.assignmentForm.value as AssignmentCreateRequest;

        const request$ = this.editingAssignment
            ? this.hrService.updateWorkstationAssignment(this.editingAssignment.id, formValue)
            : this.hrService.createWorkstationAssignment(formValue);

        request$.pipe(
            takeUntil(this.destroy$),
            finalize(() => this.saving = false)
        ).subscribe({
            next: () => {
                this.loadData();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: this.editingAssignment ? 'Assignment updated successfully' : 'Assignment created successfully'
                });
                this.showAssignmentDialog = false;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.detail || 'Failed to save assignment'
                });
            }
        });
    }

    togglePrimary(assignment: EmployeeWorkstationAssignment): void {
        if (assignment.is_primary) return; // Already primary

        this.hrService.setPrimaryAssignment(assignment.id).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: () => {
                this.loadData();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Primary workstation updated'
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update primary workstation'
                });
            }
        });
    }

    confirmDeleteAssignment(assignment: EmployeeWorkstationAssignment): void {
        this.confirmationService.confirm({
            message: `Remove ${assignment.employee_name} from ${assignment.workstation_name}?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.hrService.deleteWorkstationAssignment(assignment.id).pipe(
                    takeUntil(this.destroy$)
                ).subscribe({
                    next: () => {
                        this.loadData();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Assignment removed successfully'
                        });
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete assignment'
                        });
                    }
                });
            }
        });
    }
}
