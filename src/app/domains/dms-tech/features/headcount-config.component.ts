import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';
import { HeadcountRequirement } from '../../../core/models/production.model';
import { forkJoin } from 'rxjs';

interface ProductionLine {
    id: number;
    name: string;
    code: string;
    project: number;
    project_name?: string;
}

interface Part {
    id: number;
    part_number: string;
    name: string;
    project: number;
}

interface ShiftType {
    id: number;
    name: string;
    code: string;
    target_percentage: number;
}

interface Project {
    id: number;
    name: string;
}

@Component({
    selector: 'app-headcount-config',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        SelectModule,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        CardModule,
        ToolbarModule,
        TooltipModule,
        DividerModule,
        CheckboxModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="left">
                    <h2 class="m-0">
                        <i class="pi pi-users mr-2"></i>Headcount Configuration
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
                        label="New Requirement"
                        icon="pi pi-plus"
                        styleClass="p-button-success mr-2"
                        (onClick)="openNew()">
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
                    Define headcount requirements per production line, optionally per part and/or shift type.
                    Line-level requirements apply when no specific part/shift type requirement exists.
                </p>
            </div>

            <p-table
                [value]="requirements"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="15"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} requirements"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th pSortableColumn="line_name">Production Line <p-sortIcon field="line_name"></p-sortIcon></th>
                        <th>Project</th>
                        <th>Part (Optional)</th>
                        <th>Shift Type (Optional)</th>
                        <th class="text-center" style="width: 100px">Operators</th>
                        <th class="text-center" style="width: 100px">Technicians</th>
                        <th class="text-center" style="width: 100px">Quality</th>
                        <th class="text-center" style="width: 80px">Total</th>
                        <th class="text-center" style="width: 80px">Active</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-req>
                    <tr>
                        <td>
                            <strong class="text-primary">{{ req.line_name }}</strong>
                            <span class="text-gray-500 text-sm ml-1">({{ req.line_code }})</span>
                        </td>
                        <td>
                            <p-tag [value]="req.project_name" severity="info"></p-tag>
                        </td>
                        <td>
                            <span *ngIf="req.part_number" class="font-medium">{{ req.part_number }}</span>
                            <span *ngIf="!req.part_number" class="text-gray-400 italic">All Parts</span>
                        </td>
                        <td>
                            <span *ngIf="req.shift_type_name">
                                <p-tag [value]="req.shift_type_name" severity="secondary"></p-tag>
                            </span>
                            <span *ngIf="!req.shift_type_name" class="text-gray-400 italic">All Shift Types</span>
                        </td>
                        <td class="text-center">
                            <span class="headcount-badge operators">{{ req.operators_required }}</span>
                        </td>
                        <td class="text-center">
                            <span class="headcount-badge technicians">{{ req.technicians_required }}</span>
                        </td>
                        <td class="text-center">
                            <span class="headcount-badge quality">{{ req.quality_agents_required }}</span>
                        </td>
                        <td class="text-center">
                            <span class="font-bold text-lg text-primary">{{ req.total_required }}</span>
                        </td>
                        <td class="text-center">
                            <p-tag
                                [value]="req.is_active ? 'Yes' : 'No'"
                                [severity]="req.is_active ? 'success' : 'danger'"
                                [style]="{'font-size': '0.75rem'}">
                            </p-tag>
                        </td>
                        <td>
                            <p-button
                                icon="pi pi-pencil"
                                styleClass="p-button-rounded p-button-warning p-button-text mr-1"
                                pTooltip="Edit"
                                (onClick)="editRequirement(req)">
                            </p-button>
                            <p-button
                                icon="pi pi-trash"
                                styleClass="p-button-rounded p-button-danger p-button-text"
                                pTooltip="Delete"
                                (onClick)="confirmDelete(req)">
                            </p-button>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="10" class="text-center p-4">
                            <i class="pi pi-users text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No headcount requirements configured.</span>
                            <br>
                            <small class="text-gray-400">Create requirements to define staffing levels per line.</small>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Create/Edit Requirement Dialog -->
        <p-dialog
            [(visible)]="requirementDialog"
            [style]="{width: '600px'}"
            [header]="editMode ? 'Edit Headcount Requirement' : 'New Headcount Requirement'"
            [modal]="true"
            styleClass="p-fluid form-dialog">

            <div class="form-grid">
                    <div class="form-field">
                        <label for="productionLine">Production Line <span class="required">*</span></label>
                        <p-select
                            id="productionLine"
                            [(ngModel)]="requirement.production_line"
                            [options]="filteredLines"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Production Line"
                            [filter]="true"
                            filterPlaceholder="Search lines..."
                            [disabled]="editMode"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !requirement.production_line}">
                            <ng-template let-line pTemplate="item">
                                <div class="flex align-items-center gap-2">
                                    <strong>{{ line.code }}</strong>
                                    <span class="text-gray-500">- {{ line.name }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                        <small class="error-message" *ngIf="submitted && !requirement.production_line">Production Line is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="part">Part (Optional)</label>
                        <p-select
                            id="part"
                            [(ngModel)]="requirement.part"
                            [options]="filteredParts"
                            optionLabel="part_number"
                            optionValue="id"
                            placeholder="All Parts (Line-level)"
                            [filter]="true"
                            filterPlaceholder="Search parts..."
                            [showClear]="true"
                            [disabled]="editMode">
                            <ng-template let-part pTemplate="item">
                                <div class="flex align-items-center gap-2">
                                    <strong>{{ part.part_number }}</strong>
                                    <span class="text-gray-500 text-sm">- {{ part.name }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                        <small class="help-text">Leave empty for line-level default requirement</small>
                    </div>

                    <div class="form-field">
                        <label for="shiftType">Shift Type (Optional)</label>
                        <p-select
                            id="shiftType"
                            [(ngModel)]="requirement.shift_type"
                            [options]="shiftTypes"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="All Shift Types"
                            [showClear]="true"
                            [disabled]="editMode">
                            <ng-template let-st pTemplate="item">
                                <div class="flex align-items-center gap-2">
                                    <strong>{{ st.name }}</strong>
                                    <span class="text-gray-500 text-sm">({{ st.target_percentage }}%)</span>
                                </div>
                            </ng-template>
                        </p-select>
                        <small class="help-text">Leave empty if headcount doesn't vary by shift type</small>
                    </div>

                    <p-divider></p-divider>

                    <div class="headcount-inputs">
                        <div class="form-field">
                            <label for="operators">
                                <i class="pi pi-users mr-1"></i>Operators
                            </label>
                            <p-inputNumber
                                id="operators"
                                [(ngModel)]="requirement.operators_required"
                                [min]="0"
                                [showButtons]="true">
                            </p-inputNumber>
                        </div>

                        <div class="form-field">
                            <label for="technicians">
                                <i class="pi pi-wrench mr-1"></i>Technicians
                            </label>
                            <p-inputNumber
                                id="technicians"
                                [(ngModel)]="requirement.technicians_required"
                                [min]="0"
                                [showButtons]="true">
                            </p-inputNumber>
                        </div>

                        <div class="form-field">
                            <label for="quality">
                                <i class="pi pi-check-circle mr-1"></i>Quality Agents
                            </label>
                            <p-inputNumber
                                id="quality"
                                [(ngModel)]="requirement.quality_agents_required"
                                [min]="0"
                                [showButtons]="true">
                            </p-inputNumber>
                        </div>
                    </div>

                    <div class="total-display" *ngIf="requirement.operators_required !== undefined">
                        <span class="label">Total Headcount:</span>
                        <span class="value">{{ (requirement.operators_required || 0) + (requirement.technicians_required || 0) + (requirement.quality_agents_required || 0) }}</span>
                    </div>

                    <div class="form-field">
                        <label for="notes">Notes</label>
                        <textarea
                            pInputTextarea
                            id="notes"
                            [(ngModel)]="requirement.notes"
                            rows="2"
                            placeholder="Additional notes (optional)">
                        </textarea>
                    </div>

                    <div class="form-field flex align-items-center gap-3">
                        <p-checkbox [(ngModel)]="requirement.is_active" [binary]="true" inputId="isActive"></p-checkbox>
                        <label for="isActive" class="mb-0">Active requirement</label>
                    </div>
                </div>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="saveRequirement()"></p-button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--surface-50);
        }

        .headcount-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            font-weight: 600;
            font-size: 0.875rem;
        }

        .headcount-badge.operators {
            background-color: var(--blue-100);
            color: var(--blue-700);
        }

        .headcount-badge.technicians {
            background-color: var(--orange-100);
            color: var(--orange-700);
        }

        .headcount-badge.quality {
            background-color: var(--green-100);
            color: var(--green-700);
        }

        .help-text {
            display: block;
            margin-top: 0.25rem;
            color: var(--text-color-secondary);
            font-size: 0.75rem;
        }

        .headcount-inputs {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
        }

        .total-display {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 1rem;
            background-color: var(--surface-100);
            border-radius: 8px;
            margin: 1rem 0;
        }

        .total-display .label {
            color: var(--text-color-secondary);
            font-size: 0.875rem;
        }

        .total-display .value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary-color);
        }
    `]
})
export class HeadcountConfigComponent implements OnInit {
    requirements: HeadcountRequirement[] = [];
    lines: ProductionLine[] = [];
    parts: Part[] = [];
    shiftTypes: ShiftType[] = [];
    projects: Project[] = [];

    filteredLines: ProductionLine[] = [];
    filteredParts: Part[] = [];

    selectedProjectId: number | null = null;
    requirement: Partial<HeadcountRequirement> = {};

    requirementDialog = false;
    editMode = false;
    submitted = false;
    loading = false;

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
            requirements: this.productionService.getHeadcountRequirements(),
            lines: this.productionService.getProductionLines(),
            parts: this.productionService.getParts(),
            shiftTypes: this.productionService.getShiftTypes(),
            projects: this.productionService.getProjects()
        }).subscribe({
            next: (data: any) => {
                this.requirements = data.requirements.results || data.requirements;
                this.lines = (data.lines.results || data.lines).map((l: any) => ({
                    id: l.id,
                    name: l.name,
                    code: l.code,
                    project: l.project,
                    project_name: l.project_name
                }));
                this.parts = (data.parts.results || data.parts).map((p: any) => ({
                    id: p.id,
                    part_number: p.part_number,
                    name: p.name,
                    project: p.project
                }));
                this.shiftTypes = (data.shiftTypes.results || data.shiftTypes).map((st: any) => ({
                    id: st.id,
                    name: st.name,
                    code: st.code,
                    target_percentage: st.target_percentage
                }));
                this.projects = (data.projects.results || data.projects).map((p: any) => ({
                    id: p.id,
                    name: p.name
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
            this.filteredLines = this.lines.filter(l => l.project === this.selectedProjectId);
            this.filteredParts = this.parts.filter(p => p.project === this.selectedProjectId);
        } else {
            this.filteredLines = [...this.lines];
            this.filteredParts = [...this.parts];
        }
    }

    openNew(): void {
        this.requirement = {
            production_line: undefined,
            part: undefined,
            shift_type: undefined,
            operators_required: 0,
            technicians_required: 0,
            quality_agents_required: 0,
            notes: '',
            is_active: true
        };
        this.editMode = false;
        this.submitted = false;
        this.requirementDialog = true;
    }

    editRequirement(req: HeadcountRequirement): void {
        this.requirement = { ...req };
        this.editMode = true;
        this.submitted = false;
        this.requirementDialog = true;
    }

    hideDialog(): void {
        this.requirementDialog = false;
        this.submitted = false;
    }

    saveRequirement(): void {
        this.submitted = true;

        if (!this.requirement.production_line) {
            this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please select a production line' });
            return;
        }

        const saveMethod = this.editMode && this.requirement.id
            ? this.productionService.updateHeadcountRequirement(this.requirement.id, this.requirement)
            : this.productionService.saveOrUpdateHeadcountRequirement(this.requirement);

        saveMethod.subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: this.editMode ? 'Requirement updated successfully' : 'Requirement created successfully'
                });
                this.loadData();
                this.hideDialog();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.detail || 'Failed to save requirement'
                });
            }
        });
    }

    confirmDelete(req: HeadcountRequirement): void {
        this.confirmationService.confirm({
            message: `Delete headcount requirement for "${req.line_name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteRequirement(req)
        });
    }

    deleteRequirement(req: HeadcountRequirement): void {
        if (!req.id) return;
        this.productionService.deleteHeadcountRequirement(req.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Requirement deleted successfully' });
                this.loadData();
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to delete' });
            }
        });
    }
}
