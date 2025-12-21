import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';

interface Project {
    id?: number;
    name: string;
    code: string;
    description?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

@Component({
    selector: 'app-projects',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
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
                        <i class="pi pi-briefcase mr-2"></i>Projects Management
                    </h2>
                </ng-template>
                <ng-template pTemplate="right">
                    <p-button
                        label="New Project"
                        icon="pi pi-plus"
                        styleClass="p-button-success mr-2"
                        (onClick)="openNew()">
                    </p-button>
                    <p-button
                        label="Refresh"
                        icon="pi pi-refresh"
                        styleClass="p-button-outlined"
                        (onClick)="loadProjects()">
                    </p-button>
                </ng-template>
            </p-toolbar>

            <p-table
                [value]="projects"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                [globalFilterFields]="['name', 'code', 'description']"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} projects"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 80px">ID</th>
                        <th pSortableColumn="code">Code <p-sortIcon field="code"></p-sortIcon></th>
                        <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
                        <th>Description</th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-project>
                    <tr>
                        <td>{{ project.id }}</td>
                        <td><strong class="text-primary">{{ project.code }}</strong></td>
                        <td>{{ project.name }}</td>
                        <td>{{ project.description || '-' }}</td>
                        <td>
                            <p-tag
                                [value]="project.is_active ? 'Active' : 'Inactive'"
                                [severity]="project.is_active ? 'success' : 'danger'">
                            </p-tag>
                        </td>
                        <td>
                            <p-button
                                icon="pi pi-pencil"
                                styleClass="p-button-rounded p-button-warning p-button-text mr-1"
                                pTooltip="Edit"
                                (onClick)="editProject(project)">
                            </p-button>
                            <p-button
                                icon="pi pi-trash"
                                styleClass="p-button-rounded p-button-danger p-button-text"
                                pTooltip="Delete"
                                (onClick)="confirmDelete(project)">
                            </p-button>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="6" class="text-center p-4">
                            <i class="pi pi-inbox text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No projects found. Click "New Project" to create one.</span>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Create/Edit Dialog -->
        <p-dialog
            [(visible)]="projectDialog"
            [style]="{width: '500px'}"
            [header]="editMode ? 'Edit Project' : 'New Project'"
            [modal]="true"
            styleClass="p-fluid form-dialog">

            <ng-template pTemplate="content">
                <div class="form-field">
                    <label for="code">Code <span class="required">*</span></label>
                    <input
                        type="text"
                        pInputText
                        id="code"
                        [(ngModel)]="project.code"
                        required
                        autofocus
                        placeholder="e.g., PRJ001"
                        [ngClass]="{'ng-invalid ng-dirty': submitted && !project.code}" />
                    <small class="error-message" *ngIf="submitted && !project.code">Code is required.</small>
                </div>

                <div class="form-field">
                    <label for="name">Name <span class="required">*</span></label>
                    <input
                        type="text"
                        pInputText
                        id="name"
                        [(ngModel)]="project.name"
                        required
                        placeholder="Project Name"
                        [ngClass]="{'ng-invalid ng-dirty': submitted && !project.name}" />
                    <small class="error-message" *ngIf="submitted && !project.name">Name is required.</small>
                </div>

                <div class="form-field">
                    <label for="description">Description</label>
                    <textarea
                        pInputTextarea
                        id="description"
                        [(ngModel)]="project.description"
                        rows="3"
                        placeholder="Project description (optional)">
                    </textarea>
                </div>

                <div class="form-field toggle-field">
                    <label for="isActive">Active</label>
                    <p-toggleSwitch [(ngModel)]="project.is_active" inputId="isActive"></p-toggleSwitch>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="saveProject()"></p-button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--surface-50);
        }

        /* Form Dialog Styles */
        .form-field {
            margin-bottom: 1.5rem;
        }

        .form-field label {
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--text-color);
        }

        .form-field .required {
            color: var(--red-500);
        }

        .form-field input,
        .form-field textarea {
            width: 100%;
        }

        .form-field .error-message {
            display: block;
            margin-top: 0.25rem;
            color: var(--red-500);
            font-size: 0.875rem;
        }

        .form-field.toggle-field {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .form-field.toggle-field label {
            margin-bottom: 0;
        }

        :host ::ng-deep .form-dialog .p-dialog-content {
            padding: 1.5rem;
        }

        :host ::ng-deep .form-dialog .p-dialog-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--surface-border);
        }
    `]
})
export class ProjectsComponent implements OnInit {
    projects: Project[] = [];
    project: Partial<Project> = {};

    projectDialog = false;
    editMode = false;
    submitted = false;
    loading = false;

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadProjects();
    }

    loadProjects(): void {
        this.loading = true;
        this.productionService.getProjects().subscribe({
            next: (data: any) => {
                this.projects = data.results || data;
                this.loading = false;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load projects'
                });
                this.loading = false;
                console.error('Error loading projects:', error);
            }
        });
    }

    openNew(): void {
        this.project = {
            code: '',
            name: '',
            description: '',
            is_active: true
        };
        this.editMode = false;
        this.submitted = false;
        this.projectDialog = true;
    }

    editProject(project: Project): void {
        this.project = { ...project };
        this.editMode = true;
        this.submitted = false;
        this.projectDialog = true;
    }

    hideDialog(): void {
        this.projectDialog = false;
        this.submitted = false;
    }

    saveProject(): void {
        this.submitted = true;

        if (!this.project.code || !this.project.name) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill all required fields'
            });
            return;
        }

        if (this.editMode && this.project.id) {
            this.productionService.updateProject(this.project.id, this.project as any).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Project updated successfully'
                    });
                    this.loadProjects();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.error?.detail || 'Failed to update project'
                    });
                }
            });
        } else {
            this.productionService.createProject(this.project as any).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Project created successfully'
                    });
                    this.loadProjects();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.error?.detail || error.error?.code?.[0] || 'Failed to create project'
                    });
                }
            });
        }
    }

    confirmDelete(project: Project): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the project "${project.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteProject(project);
            }
        });
    }

    deleteProject(project: Project): void {
        if (!project.id) return;

        this.productionService.deleteProject(project.id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Project deleted successfully'
                });
                this.loadProjects();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.detail || 'Failed to delete project. It may be in use.'
                });
            }
        });
    }
}
