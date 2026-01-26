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
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';
import { forkJoin } from 'rxjs';

interface Process {
    id?: number;
    name: string;
    code: string;
    description?: string;
    project: number;
    project_name?: string;
    sequence_order?: number;
    cycle_time_seconds?: number;
    is_active: boolean;
    parts_count?: number;
}

interface Project {
    id: number;
    name: string;
    code: string;
}

@Component({
    selector: 'app-processes',
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
        ToggleSwitchModule,
        CardModule,
        ToolbarModule,
        TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="left">
                    <h2 class="m-0">
                        <i class="pi pi-sitemap mr-2"></i>Processes Management
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
                                (onChange)="filterProcesses()">
                            </p-select>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="right">
                    <p-button
                        label="New Process"
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
                    Manufacturing processes for semi-finished products. Hierarchy: Zone → Project → Process → Part Number
                </p>
            </div>

            <p-table
                [value]="filteredProcesses"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} processes"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 80px">ID</th>
                        <th pSortableColumn="code">Code <p-sortIcon field="code"></p-sortIcon></th>
                        <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
                        <th>Project</th>
                        <th pSortableColumn="sequence_order" style="width: 120px">Sequence <p-sortIcon field="sequence_order"></p-sortIcon></th>
                        <th style="width: 120px">Cycle Time</th>
                        <th style="width: 100px">Parts</th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-process>
                    <tr>
                        <td>{{ process.id }}</td>
                        <td><strong class="text-primary">{{ process.code }}</strong></td>
                        <td>{{ process.name }}</td>
                        <td>
                            <p-tag [value]="process.project_name" severity="info"></p-tag>
                        </td>
                        <td class="text-center">
                            <span class="font-bold">{{ process.sequence_order }}</span>
                        </td>
                        <td class="text-center">
                            <span *ngIf="process.cycle_time_seconds">{{ process.cycle_time_seconds }}s</span>
                            <span *ngIf="!process.cycle_time_seconds" class="text-gray-400">-</span>
                        </td>
                        <td class="text-center">
                            <p-tag
                                [value]="process.parts_count?.toString() || '0'"
                                [severity]="process.parts_count > 0 ? 'success' : 'secondary'">
                            </p-tag>
                        </td>
                        <td>
                            <p-tag
                                [value]="process.is_active ? 'Active' : 'Inactive'"
                                [severity]="process.is_active ? 'success' : 'danger'">
                            </p-tag>
                        </td>
                        <td>
                            <p-button
                                icon="pi pi-pencil"
                                styleClass="p-button-rounded p-button-warning p-button-text mr-1"
                                pTooltip="Edit"
                                (onClick)="editProcess(process)">
                            </p-button>
                            <p-button
                                icon="pi pi-trash"
                                styleClass="p-button-rounded p-button-danger p-button-text"
                                pTooltip="Delete"
                                (onClick)="confirmDelete(process)">
                            </p-button>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="9" class="text-center p-4">
                            <i class="pi pi-sitemap text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No processes found. Click "New Process" to create one.</span>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Create/Edit Dialog -->
        <p-dialog
            [(visible)]="processDialog"
            [style]="{width: '550px'}"
            [header]="editMode ? 'Edit Process' : 'New Process'"
            [modal]="true"
            styleClass="p-fluid form-dialog">

            <ng-template pTemplate="content">
                <div class="form-grid">
                    <div class="form-field">
                        <label for="code">Code <span class="required">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="code"
                            [(ngModel)]="process.code"
                            required
                            autofocus
                            placeholder="e.g., PROC-001"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !process.code}" />
                        <small class="error-message" *ngIf="submitted && !process.code">Code is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="name">Name <span class="required">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="name"
                            [(ngModel)]="process.name"
                            required
                            placeholder="Process Name"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !process.name}" />
                        <small class="error-message" *ngIf="submitted && !process.name">Name is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="project">Project <span class="required">*</span></label>
                        <p-select
                            id="project"
                            [(ngModel)]="process.project"
                            [options]="projects"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Project"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !process.project}">
                        </p-select>
                        <small class="error-message" *ngIf="submitted && !process.project">Project is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="sequenceOrder">Sequence Order</label>
                        <p-inputNumber
                            id="sequenceOrder"
                            [(ngModel)]="process.sequence_order"
                            [min]="0"
                            placeholder="Order in manufacturing sequence">
                        </p-inputNumber>
                        <small class="help-text">Order of this process in the manufacturing sequence</small>
                    </div>

                    <div class="form-field">
                        <label for="cycleTime">Cycle Time (seconds)</label>
                        <p-inputNumber
                            id="cycleTime"
                            [(ngModel)]="process.cycle_time_seconds"
                            [min]="0"
                            placeholder="Default cycle time">
                        </p-inputNumber>
                    </div>

                    <div class="form-field toggle-field">
                        <label for="isActive">Active</label>
                        <p-toggleSwitch [(ngModel)]="process.is_active" inputId="isActive"></p-toggleSwitch>
                    </div>

                    <div class="form-field" style="grid-column: 1 / -1;">
                        <label for="description">Description</label>
                        <textarea
                            pInputTextarea
                            id="description"
                            [(ngModel)]="process.description"
                            rows="2"
                            placeholder="Process description (optional)">
                        </textarea>
                    </div>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="saveProcess()"></p-button>
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
    `]
})
export class ProcessesComponent implements OnInit {
    processes: Process[] = [];
    filteredProcesses: Process[] = [];
    projects: Project[] = [];
    process: Partial<Process> = {};

    selectedProjectId: number | null = null;

    processDialog = false;
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
            processes: this.productionService.getProcesses(),
            projects: this.productionService.getProjects()
        }).subscribe({
            next: (data: any) => {
                this.processes = data.processes.results || data.processes;
                this.projects = (data.projects.results || data.projects).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    code: p.code
                }));
                this.filterProcesses();
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data' });
                this.loading = false;
            }
        });
    }

    filterProcesses(): void {
        if (this.selectedProjectId) {
            this.filteredProcesses = this.processes.filter(p => p.project === this.selectedProjectId);
        } else {
            this.filteredProcesses = [...this.processes];
        }
    }

    openNew(): void {
        this.process = {
            code: '',
            name: '',
            description: '',
            project: this.selectedProjectId || undefined,
            sequence_order: 0,
            cycle_time_seconds: 0,
            is_active: true
        };
        this.editMode = false;
        this.submitted = false;
        this.processDialog = true;
    }

    editProcess(process: Process): void {
        this.process = { ...process };
        this.editMode = true;
        this.submitted = false;
        this.processDialog = true;
    }

    hideDialog(): void {
        this.processDialog = false;
        this.submitted = false;
    }

    saveProcess(): void {
        this.submitted = true;

        if (!this.process.code || !this.process.name || !this.process.project) {
            this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields' });
            return;
        }

        if (this.editMode && this.process.id) {
            this.productionService.updateProcess(this.process.id, this.process).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Process updated successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to update process' });
                }
            });
        } else {
            this.productionService.createProcess(this.process).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Process created successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    let errorMsg = 'Failed to create process';
                    if (error.error) {
                        if (typeof error.error === 'object') {
                            const messages = Object.entries(error.error)
                                .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                                .join('; ');
                            errorMsg = messages || errorMsg;
                        } else if (error.error.detail) {
                            errorMsg = error.error.detail;
                        }
                    }
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                }
            });
        }
    }

    confirmDelete(process: Process): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the process "${process.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteProcess(process)
        });
    }

    deleteProcess(process: Process): void {
        if (!process.id) return;
        this.productionService.deleteProcess(process.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Process deleted successfully' });
                this.loadData();
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to delete' });
            }
        });
    }
}
