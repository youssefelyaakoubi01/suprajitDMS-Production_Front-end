import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';
import { PartProcessAssignment } from '../../../core/models/production.model';
import { forkJoin } from 'rxjs';

interface Part {
    id: number;
    part_number: string;
    name: string;
    project: number;
    project_name?: string;
    shift_target: number;
    product_type: string;
}

interface Process {
    id: number;
    name: string;
    code: string;
    project: number;
    project_name?: string;
}

interface Project {
    id: number;
    name: string;
    code: string;
}

@Component({
    selector: 'app-part-process-assignments',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        SelectModule,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        CheckboxModule,
        CardModule,
        ToolbarModule,
        TooltipModule,
        BadgeModule,
        MultiSelectModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="left">
                    <h2 class="m-0">
                        <i class="pi pi-link mr-2"></i>Part-Process Assignments
                    </h2>
                </ng-template>
                <ng-template pTemplate="center">
                    <div class="flex align-items-center gap-3">
                        <div class="flex align-items-center gap-2">
                            <label for="projectFilter" class="font-medium">Project:</label>
                            <p-select
                                id="projectFilter"
                                [(ngModel)]="selectedProjectId"
                                [options]="projects"
                                optionLabel="name"
                                optionValue="id"
                                placeholder="All Projects"
                                [showClear]="true"
                                styleClass="w-15rem"
                                (onChange)="onProjectChange()">
                            </p-select>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="right">
                    <p-button
                        label="New Assignment"
                        icon="pi pi-plus"
                        styleClass="p-button-success mr-2"
                        (onClick)="openNew()">
                    </p-button>
                    <p-button
                        label="Bulk Assign"
                        icon="pi pi-copy"
                        styleClass="p-button-info mr-2"
                        (onClick)="openBulkAssign()">
                    </p-button>
                    <p-button
                        label="Refresh"
                        icon="pi pi-refresh"
                        styleClass="p-button-outlined"
                        (onClick)="loadData()">
                    </p-button>
                </ng-template>
            </p-toolbar>

            <div class="mb-3">
                <p class="text-gray-600 m-0">
                    <i class="pi pi-info-circle mr-2"></i>
                    Configure which semi-finished parts can be produced on which processes. Set specific targets per process if different from part defaults.
                </p>
            </div>

            <p-table
                [value]="assignments"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="15"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} assignments"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th pSortableColumn="part_number">Part Number <p-sortIcon field="part_number"></p-sortIcon></th>
                        <th>Part Name</th>
                        <th pSortableColumn="process_name">Process <p-sortIcon field="process_name"></p-sortIcon></th>
                        <th>Project</th>
                        <th class="text-center" style="width: 120px">Default Target</th>
                        <th class="text-center" style="width: 120px">Process Target</th>
                        <th class="text-center" style="width: 100px">Effective</th>
                        <th class="text-center" style="width: 80px">Primary</th>
                        <th class="text-center" style="width: 80px">Active</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-assignment>
                    <tr>
                        <td><strong class="text-primary">{{ assignment.part_number }}</strong></td>
                        <td>{{ assignment.part_name }}</td>
                        <td>
                            <span class="font-medium">{{ assignment.process_name }}</span>
                            <span class="text-gray-500 text-sm ml-1">({{ assignment.process_code }})</span>
                        </td>
                        <td>
                            <p-tag [value]="assignment.project_name" severity="info"></p-tag>
                        </td>
                        <td class="text-center text-gray-500">{{ assignment.part_default_target }}</td>
                        <td class="text-center">
                            <span *ngIf="assignment.specific_target" class="font-bold text-primary">
                                {{ assignment.specific_target }}
                            </span>
                            <span *ngIf="!assignment.specific_target" class="text-gray-400">-</span>
                        </td>
                        <td class="text-center">
                            <span class="font-bold text-lg">{{ assignment.effective_target }}</span>
                        </td>
                        <td class="text-center">
                            <i *ngIf="assignment.is_primary" class="pi pi-star-fill text-yellow-500" pTooltip="Primary Process"></i>
                            <i *ngIf="!assignment.is_primary" class="pi pi-star text-gray-300" pTooltip="Set as Primary" style="cursor: pointer" (click)="setPrimary(assignment)"></i>
                        </td>
                        <td class="text-center">
                            <p-tag
                                [value]="assignment.is_active ? 'Yes' : 'No'"
                                [severity]="assignment.is_active ? 'success' : 'danger'"
                                [style]="{'font-size': '0.75rem'}">
                            </p-tag>
                        </td>
                        <td>
                            <p-button
                                icon="pi pi-pencil"
                                styleClass="p-button-rounded p-button-warning p-button-text mr-1"
                                pTooltip="Edit"
                                (onClick)="editAssignment(assignment)">
                            </p-button>
                            <p-button
                                icon="pi pi-trash"
                                styleClass="p-button-rounded p-button-danger p-button-text"
                                pTooltip="Delete"
                                (onClick)="confirmDelete(assignment)">
                            </p-button>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="10" class="text-center p-4">
                            <i class="pi pi-link text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No part-process assignments found.</span>
                            <br>
                            <small class="text-gray-400">Create assignments to define which semi-finished parts can be produced on which processes.</small>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Create/Edit Assignment Dialog -->
        <p-dialog
            [(visible)]="assignmentDialog"
            [style]="{width: '550px'}"
            [header]="editMode ? 'Edit Assignment' : 'New Part-Process Assignment'"
            [modal]="true"
            styleClass="p-fluid form-dialog">

                <div class="form-grid">
                    <div class="form-field">
                        <label for="part">Part (Semi-Finished) <span class="required">*</span></label>
                        <p-select
                            id="part"
                            [(ngModel)]="assignment.part"
                            [options]="filteredParts"
                            optionLabel="part_number"
                            optionValue="id"
                            placeholder="Select Part"
                            [filter]="true"
                            filterPlaceholder="Search parts..."
                            [disabled]="editMode"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !assignment.part}">
                            <ng-template let-part pTemplate="item">
                                <div class="flex align-items-center gap-2">
                                    <strong>{{ part.part_number }}</strong>
                                    <span class="text-gray-500">- {{ part.name }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                        <small class="error-message" *ngIf="submitted && !assignment.part">Part is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="process">Process <span class="required">*</span></label>
                        <p-select
                            id="process"
                            [(ngModel)]="assignment.process"
                            [options]="filteredProcesses"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Process"
                            [filter]="true"
                            filterPlaceholder="Search processes..."
                            [disabled]="editMode"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !assignment.process}">
                            <ng-template let-process pTemplate="item">
                                <div class="flex align-items-center gap-2">
                                    <strong>{{ process.code }}</strong>
                                    <span class="text-gray-500">- {{ process.name }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                        <small class="error-message" *ngIf="submitted && !assignment.process">Process is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="specificTarget">Specific Target (optional)</label>
                        <p-inputNumber
                            id="specificTarget"
                            [(ngModel)]="assignment.specific_target"
                            [min]="0"
                            placeholder="Leave empty to use part default">
                        </p-inputNumber>
                        <small class="help-text">Override the part's default hourly target for this process</small>
                    </div>

                    <div class="form-field">
                        <label for="specificEfficiency">Specific Efficiency % (optional)</label>
                        <p-inputNumber
                            id="specificEfficiency"
                            [(ngModel)]="assignment.specific_efficiency"
                            [min]="0"
                            [max]="100"
                            suffix="%"
                            placeholder="Leave empty to use part default">
                        </p-inputNumber>
                    </div>

                    <div class="form-field">
                        <label for="cycleTime">Cycle Time (seconds)</label>
                        <p-inputNumber
                            id="cycleTime"
                            [(ngModel)]="assignment.specific_cycle_time"
                            [min]="0"
                            [maxFractionDigits]="2"
                            placeholder="Cycle time for this part on this process">
                        </p-inputNumber>
                    </div>

                    <div class="form-field flex align-items-center gap-3">
                        <p-checkbox
                            [(ngModel)]="assignment.is_primary"
                            [binary]="true"
                            inputId="isPrimary">
                        </p-checkbox>
                        <label for="isPrimary" class="mb-0">Primary process for this part</label>
                    </div>

                    <div class="form-field flex align-items-center gap-3">
                        <p-checkbox
                            [(ngModel)]="assignment.is_active"
                            [binary]="true"
                            inputId="isActive">
                        </p-checkbox>
                        <label for="isActive" class="mb-0">Active assignment</label>
                    </div>
                </div>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="saveAssignment()"></p-button>
            </ng-template>
        </p-dialog>

        <!-- Bulk Assign Dialog -->
        <p-dialog
            [(visible)]="bulkDialog"
            [style]="{width: '600px'}"
            header="Bulk Assign Parts to Process"
            [modal]="true"
            styleClass="p-fluid form-dialog">

                <div class="form-field">
                    <label for="bulkProcess">Process <span class="required">*</span></label>
                    <p-select
                        id="bulkProcess"
                        [(ngModel)]="bulkProcessId"
                        [options]="filteredProcesses"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select Process"
                        [filter]="true">
                        <ng-template let-process pTemplate="item">
                            <div class="flex align-items-center gap-2">
                                <strong>{{ process.code }}</strong>
                                <span class="text-gray-500">- {{ process.name }}</span>
                            </div>
                        </ng-template>
                    </p-select>
                </div>

                <div class="form-field">
                    <label for="bulkParts">Parts to Assign <span class="required">*</span></label>
                    <p-multiSelect
                        id="bulkParts"
                        [(ngModel)]="bulkPartIds"
                        [options]="filteredParts"
                        optionLabel="part_number"
                        optionValue="id"
                        placeholder="Select Parts"
                        [filter]="true"
                        filterPlaceholder="Search parts..."
                        display="chip"
                        [maxSelectedLabels]="5"
                        selectedItemsLabel="{0} parts selected">
                        <ng-template let-part pTemplate="item">
                            <div class="flex align-items-center gap-2">
                                <strong>{{ part.part_number }}</strong>
                                <span class="text-gray-500 text-sm">- {{ part.name }}</span>
                            </div>
                        </ng-template>
                    </p-multiSelect>
                </div>

                <div class="info-message mt-3" *ngIf="bulkPartIds.length > 0">
                    <i class="pi pi-info-circle mr-2"></i>
                    {{ bulkPartIds.length }} part(s) will be assigned to the selected process.
                </div>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="bulkDialog = false"></p-button>
                <p-button label="Assign All" icon="pi pi-check" (onClick)="executeBulkAssign()" [disabled]="!bulkProcessId || bulkPartIds.length === 0"></p-button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--surface-50);
        }

        .help-text {
            display: block;
            margin-top: 0.25rem;
            color: var(--text-color-secondary);
            font-size: 0.75rem;
        }

        .info-message {
            background-color: var(--blue-50);
            color: var(--blue-700);
            padding: 0.75rem 1rem;
            border-radius: 6px;
            font-size: 0.875rem;
        }
    `]
})
export class PartProcessAssignmentsComponent implements OnInit {
    assignments: PartProcessAssignment[] = [];
    parts: Part[] = [];
    processes: Process[] = [];
    projects: Project[] = [];

    filteredParts: Part[] = [];
    filteredProcesses: Process[] = [];

    selectedProjectId: number | null = null;
    assignment: Partial<PartProcessAssignment> = {};

    assignmentDialog = false;
    bulkDialog = false;
    editMode = false;
    submitted = false;
    loading = false;

    bulkProcessId: number | null = null;
    bulkPartIds: number[] = [];

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;

        forkJoin({
            assignments: this.productionService.getPartProcessAssignments(),
            parts: this.productionService.getSemiFinishedParts(),
            processes: this.productionService.getProcesses(),
            projects: this.productionService.getProjects()
        }).subscribe({
            next: (data: any) => {
                this.assignments = data.assignments.results || data.assignments;
                this.parts = (data.parts.results || data.parts).map((p: any) => ({
                    id: p.id,
                    part_number: p.part_number,
                    name: p.description || p.name,
                    project: p.project,
                    project_name: p.project_name,
                    shift_target: p.shift_target,
                    product_type: p.product_type
                }));
                this.processes = (data.processes.results || data.processes).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    code: p.code,
                    project: p.project,
                    project_name: p.project_name
                }));
                this.projects = (data.projects.results || data.projects).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    code: p.code
                }));

                this.applyFilters();
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data' });
                this.loading = false;
            }
        });
    }

    onProjectChange(): void {
        this.applyFilters();
    }

    applyFilters(): void {
        if (this.selectedProjectId) {
            this.filteredParts = this.parts.filter(p => p.project === this.selectedProjectId);
            this.filteredProcesses = this.processes.filter(p => p.project === this.selectedProjectId);
        } else {
            this.filteredParts = [...this.parts];
            this.filteredProcesses = [...this.processes];
        }
    }

    openNew(): void {
        this.assignment = {
            part: undefined,
            process: undefined,
            specific_target: undefined,
            specific_efficiency: undefined,
            specific_cycle_time: undefined,
            is_primary: false,
            is_active: true
        };
        this.editMode = false;
        this.submitted = false;
        this.assignmentDialog = true;
    }

    editAssignment(assignment: PartProcessAssignment): void {
        this.assignment = { ...assignment };
        this.editMode = true;
        this.submitted = false;
        this.assignmentDialog = true;
    }

    hideDialog(): void {
        this.assignmentDialog = false;
        this.submitted = false;
    }

    saveAssignment(): void {
        this.submitted = true;

        if (!this.assignment.part || !this.assignment.process) {
            this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please select both part and process' });
            return;
        }

        if (this.editMode && this.assignment.id) {
            this.productionService.updatePartProcessAssignment(this.assignment.id, this.assignment).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Assignment updated successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to update assignment' });
                }
            });
        } else {
            this.productionService.createPartProcessAssignment(this.assignment).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Assignment created successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    let errorMsg = 'Failed to create assignment';
                    if (error.error) {
                        if (error.error.detail) {
                            errorMsg = error.error.detail;
                        } else if (error.error.non_field_errors) {
                            errorMsg = error.error.non_field_errors.join(', ');
                        } else if (typeof error.error === 'object') {
                            const messages = Object.entries(error.error)
                                .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                                .join('; ');
                            errorMsg = messages || errorMsg;
                        }
                    }
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                }
            });
        }
    }

    confirmDelete(assignment: PartProcessAssignment): void {
        this.confirmationService.confirm({
            message: `Remove "${assignment.part_number}" from "${assignment.process_name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteAssignment(assignment)
        });
    }

    deleteAssignment(assignment: PartProcessAssignment): void {
        if (!assignment.id) return;
        this.productionService.deletePartProcessAssignment(assignment.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Assignment removed successfully' });
                this.loadData();
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to delete' });
            }
        });
    }

    setPrimary(assignment: PartProcessAssignment): void {
        if (!assignment.id) return;
        this.productionService.setPrimaryProcessForPart(assignment.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Primary process set successfully' });
                this.loadData();
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to set primary' });
            }
        });
    }

    openBulkAssign(): void {
        this.bulkProcessId = null;
        this.bulkPartIds = [];
        this.bulkDialog = true;
    }

    executeBulkAssign(): void {
        if (!this.bulkProcessId || this.bulkPartIds.length === 0) return;

        this.productionService.bulkAssignPartsToProcess(this.bulkProcessId, this.bulkPartIds).subscribe({
            next: (result) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `${result.length} part(s) assigned successfully`
                });
                this.bulkDialog = false;
                this.loadData();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.detail || 'Failed to bulk assign'
                });
            }
        });
    }
}
