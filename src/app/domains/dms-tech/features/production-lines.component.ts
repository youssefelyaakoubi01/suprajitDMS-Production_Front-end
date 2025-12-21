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

interface ProductionLine {
    id?: number;
    name: string;
    code: string;
    project: number;
    project_name?: string;
    capacity?: number;
    description?: string;
    is_active: boolean;
}

interface Project {
    id: number;
    name: string;
    code: string;
}

@Component({
    selector: 'app-production-lines',
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
                        <i class="pi pi-sitemap mr-2"></i>Production Lines Management
                    </h2>
                </ng-template>
                <ng-template pTemplate="right">
                    <p-button
                        label="New Production Line"
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

            <p-table
                [value]="productionLines"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} production lines"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 80px">ID</th>
                        <th pSortableColumn="code">Code <p-sortIcon field="code"></p-sortIcon></th>
                        <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
                        <th>Project</th>
                        <th style="width: 120px">Capacity</th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-line>
                    <tr>
                        <td>{{ line.id }}</td>
                        <td><strong class="text-primary">{{ line.code }}</strong></td>
                        <td>{{ line.name }}</td>
                        <td>
                            <p-tag [value]="line.project_name || getProjectName(line.project)" severity="info"></p-tag>
                        </td>
                        <td class="text-center">{{ line.capacity || '-' }}</td>
                        <td>
                            <p-tag
                                [value]="line.is_active ? 'Active' : 'Inactive'"
                                [severity]="line.is_active ? 'success' : 'danger'">
                            </p-tag>
                        </td>
                        <td>
                            <p-button
                                icon="pi pi-pencil"
                                styleClass="p-button-rounded p-button-warning p-button-text mr-1"
                                pTooltip="Edit"
                                (onClick)="editLine(line)">
                            </p-button>
                            <p-button
                                icon="pi pi-trash"
                                styleClass="p-button-rounded p-button-danger p-button-text"
                                pTooltip="Delete"
                                (onClick)="confirmDelete(line)">
                            </p-button>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="7" class="text-center p-4">
                            <i class="pi pi-inbox text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No production lines found.</span>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Create/Edit Dialog -->
        <p-dialog
            [(visible)]="lineDialog"
            [style]="{width: '550px'}"
            [header]="editMode ? 'Edit Production Line' : 'New Production Line'"
            [modal]="true"
            styleClass="p-fluid form-dialog">

            <ng-template pTemplate="content">
                <div class="form-grid">
                    <div class="form-field">
                        <label for="project">Project <span class="required">*</span></label>
                        <p-select
                            id="project"
                            [(ngModel)]="line.project"
                            [options]="projects"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Project"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !line.project}">
                        </p-select>
                        <small class="error-message" *ngIf="submitted && !line.project">Project is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="code">Code <span class="required">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="code"
                            [(ngModel)]="line.code"
                            required
                            placeholder="e.g., LINE01"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !line.code}" />
                        <small class="error-message" *ngIf="submitted && !line.code">Code is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="name">Name <span class="required">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="name"
                            [(ngModel)]="line.name"
                            required
                            placeholder="Production Line Name"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !line.name}" />
                        <small class="error-message" *ngIf="submitted && !line.name">Name is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="capacity">Capacity (units/hour)</label>
                        <p-inputNumber
                            id="capacity"
                            [(ngModel)]="line.capacity"
                            [min]="0"
                            placeholder="Maximum capacity per hour">
                        </p-inputNumber>
                    </div>
                </div>

                <div class="form-field" style="margin-top: 1rem;">
                    <label for="description">Description</label>
                    <textarea
                        pInputTextarea
                        id="description"
                        [(ngModel)]="line.description"
                        rows="3"
                        placeholder="Description (optional)">
                    </textarea>
                </div>

                <div class="form-field toggle-field">
                    <label for="isActive">Active</label>
                    <p-toggleSwitch [(ngModel)]="line.is_active" inputId="isActive"></p-toggleSwitch>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="saveLine()"></p-button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--surface-50);
        }
    `]
})
export class ProductionLinesComponent implements OnInit {
    productionLines: ProductionLine[] = [];
    projects: Project[] = [];
    line: Partial<ProductionLine> = {};

    lineDialog = false;
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

        // Load projects first
        this.productionService.getProjects().subscribe({
            next: (data: any) => {
                this.projects = (data.results || data).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    code: p.code
                }));
            },
            error: (err) => console.error('Error loading projects:', err)
        });

        // Load production lines
        this.productionService.getProductionLines().subscribe({
            next: (data: any) => {
                this.productionLines = data.results || data;
                this.loading = false;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load production lines'
                });
                this.loading = false;
            }
        });
    }

    getProjectName(projectId: number): string {
        const project = this.projects.find(p => p.id === projectId);
        return project?.name || 'Unknown';
    }

    openNew(): void {
        this.line = {
            code: '',
            name: '',
            project: undefined,
            capacity: 0,
            description: '',
            is_active: true
        };
        this.editMode = false;
        this.submitted = false;
        this.lineDialog = true;
    }

    editLine(line: ProductionLine): void {
        this.line = { ...line };
        this.editMode = true;
        this.submitted = false;
        this.lineDialog = true;
    }

    hideDialog(): void {
        this.lineDialog = false;
        this.submitted = false;
    }

    saveLine(): void {
        this.submitted = true;

        if (!this.line.code || !this.line.name || !this.line.project) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill all required fields'
            });
            return;
        }

        if (this.editMode && this.line.id) {
            this.productionService.updateProductionLine(this.line.id, this.line as any).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Production line updated successfully'
                    });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.error?.detail || 'Failed to update production line'
                    });
                }
            });
        } else {
            this.productionService.createProductionLine(this.line as any).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Production line created successfully'
                    });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.error?.detail || 'Failed to create production line'
                    });
                }
            });
        }
    }

    confirmDelete(line: ProductionLine): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${line.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteLine(line);
            }
        });
    }

    deleteLine(line: ProductionLine): void {
        if (!line.id) return;

        this.productionService.deleteProductionLine(line.id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Production line deleted successfully'
                });
                this.loadData();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.detail || 'Failed to delete. It may be in use.'
                });
            }
        });
    }
}
