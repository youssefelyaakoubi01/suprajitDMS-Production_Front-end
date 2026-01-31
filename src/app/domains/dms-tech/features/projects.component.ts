import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { FileUploadModule } from 'primeng/fileupload';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuModule } from 'primeng/menu';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';
import { ExportService } from '../../../core/services/export.service';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

interface Project {
    id?: number;
    name: string;
    image?: string;
    description?: string;
    zone?: number;
    zone_name?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

interface Zone {
    id: number;
    name: string;
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
        SelectModule,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        ToggleSwitchModule,
        CardModule,
        ToolbarModule,
        TooltipModule,
        FileUploadModule,
        IconFieldModule,
        InputIconModule,
        MenuModule
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
                <ng-template pTemplate="center">
                    <div class="flex align-items-center gap-2">
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input
                                pInputText
                                type="text"
                                [(ngModel)]="searchTerm"
                                (ngModelChange)="onSearchChange($event)"
                                placeholder="Search projects..."
                                class="w-20rem" />
                        </p-iconfield>
                        <p-button *ngIf="searchTerm"
                            icon="pi pi-times"
                            styleClass="p-button-text"
                            (onClick)="clearFilters()">
                        </p-button>
                    </div>
                </ng-template>
                <ng-template pTemplate="right">
                    <p-menu #exportMenu [model]="exportMenuItems" [popup]="true"></p-menu>
                    <p-button
                        icon="pi pi-download"
                        label="Export"
                        styleClass="p-button-outlined mr-2"
                        (onClick)="exportMenu.toggle($event)">
                    </p-button>
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
                #dt
                [value]="filteredProjects"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                [globalFilterFields]="['name', 'description']"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} projects"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 80px">ID</th>
                        <th style="width: 80px">Image</th>
                        <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
                        <th>Zone</th>
                        <th>Description</th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-project>
                    <tr>
                        <td>{{ project.id }}</td>
                        <td>
                            <img *ngIf="project.image"
                                 [src]="project.image"
                                 alt="Project"
                                 class="project-image" />
                            <i *ngIf="!project.image"
                               class="pi pi-image text-gray-400 text-2xl"></i>
                        </td>
                        <td><strong>{{ project.name }}</strong></td>
                        <td>
                            <p-tag *ngIf="project.zone_name" [value]="project.zone_name" severity="info"></p-tag>
                            <span *ngIf="!project.zone_name" class="text-gray-400">-</span>
                        </td>
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
                        <td colspan="7" class="text-center p-4">
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
            [style]="{width: '550px'}"
            [header]="editMode ? 'Edit Project' : 'New Project'"
            [modal]="true"
            styleClass="p-fluid form-dialog">

            <ng-template pTemplate="content">
                <!-- Image Upload Section -->
                <div class="form-field image-upload-section">
                    <label>Project Image</label>
                    <div class="image-preview-container">
                        <img *ngIf="imagePreview || project.image"
                             [src]="imagePreview || project.image"
                             alt="Preview"
                             class="image-preview" />
                        <div *ngIf="!imagePreview && !project.image" class="image-placeholder">
                            <i class="pi pi-image text-4xl text-gray-400"></i>
                            <span class="text-gray-500">No image</span>
                        </div>
                    </div>
                    <div class="image-actions">
                        <p-fileUpload
                            mode="basic"
                            name="image"
                            accept="image/*"
                            [maxFileSize]="5000000"
                            chooseLabel="Choose Image"
                            chooseIcon="pi pi-upload"
                            styleClass="p-button-outlined p-button-sm"
                            (onSelect)="onImageSelect($event)">
                        </p-fileUpload>
                        <p-button
                            *ngIf="imagePreview || project.image"
                            icon="pi pi-trash"
                            styleClass="p-button-danger p-button-outlined p-button-sm"
                            (onClick)="removeImage()">
                        </p-button>
                    </div>
                </div>

                <div class="form-field">
                    <label for="name">Name <span class="required">*</span></label>
                    <input
                        type="text"
                        pInputText
                        id="name"
                        [(ngModel)]="project.name"
                        required
                        autofocus
                        placeholder="Project Name"
                        [ngClass]="{'ng-invalid ng-dirty': submitted && !project.name}" />
                    <small class="error-message" *ngIf="submitted && !project.name">Name is required.</small>
                </div>

                <div class="form-field">
                    <label for="zone">Zone</label>
                    <p-select
                        id="zone"
                        [(ngModel)]="project.zone"
                        [options]="zones"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select Zone"
                        [showClear]="true">
                    </p-select>
                    <small class="help-text">Associate this project with a zone</small>
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

        /* Project image in table */
        .project-image {
            width: 40px;
            height: 40px;
            border-radius: 4px;
            object-fit: cover;
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

        /* Image upload styles */
        .image-upload-section {
            margin-bottom: 1.5rem;
        }

        .image-preview-container {
            width: 150px;
            height: 150px;
            border: 2px dashed var(--surface-border);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.75rem;
            overflow: hidden;
            background: var(--surface-50);
        }

        .image-preview {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .image-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
        }

        .image-actions {
            display: flex;
            gap: 0.5rem;
        }

        .help-text {
            display: block;
            margin-top: 0.25rem;
            color: var(--text-color-secondary);
            font-size: 0.75rem;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectsComponent implements OnInit, OnDestroy {
    projects: Project[] = [];
    filteredProjects: Project[] = [];
    zones: Zone[] = [];
    project: Partial<Project> = {};
    exportMenuItems: MenuItem[] = [];

    projectDialog = false;
    editMode = false;
    submitted = false;
    loading = false;

    // Filter properties
    searchTerm = '';
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    // Image upload properties
    imageFile: File | null = null;
    imagePreview: string | null = null;
    imageRemoved: boolean = false;

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private cdr: ChangeDetectorRef,
        private exportService: ExportService
    ) {}

    ngOnInit(): void {
        this.setupSearch();
        this.loadProjects();
        this.initExportMenu();
    }

    private initExportMenu(): void {
        this.exportMenuItems = [
            {
                label: 'Export Excel',
                icon: 'pi pi-file-excel',
                command: () => this.exportToExcel()
            },
            {
                label: 'Export CSV',
                icon: 'pi pi-file',
                command: () => this.exportToCsv()
            }
        ];
    }

    exportToExcel(): void {
        const data = this.filteredProjects.map(p => ({
            ID: p.id,
            Name: p.name,
            Zone: p.zone_name || '',
            Description: p.description || '',
            Status: p.is_active ? 'Active' : 'Inactive'
        }));
        const timestamp = new Date().toISOString().split('T')[0];
        this.exportService.exportToExcel(data, `projects-export-${timestamp}`, 'Projects');
        this.messageService.add({
            severity: 'success',
            summary: 'Export',
            detail: `${data.length} enregistrements exportés`
        });
    }

    exportToCsv(): void {
        const data = this.filteredProjects.map(p => ({
            ID: p.id,
            Name: p.name,
            Zone: p.zone_name || '',
            Description: p.description || '',
            Status: p.is_active ? 'Active' : 'Inactive'
        }));
        const timestamp = new Date().toISOString().split('T')[0];
        this.exportService.exportToCsv(data, `projects-export-${timestamp}`);
        this.messageService.add({
            severity: 'success',
            summary: 'Export',
            detail: `${data.length} enregistrements exportés`
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setupSearch(): void {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.applyFilters();
        });
    }

    onSearchChange(value: string): void {
        this.searchSubject.next(value);
    }

    applyFilters(): void {
        let result = [...this.projects];

        if (this.searchTerm) {
            const search = this.searchTerm.toLowerCase();
            result = result.filter(item =>
                item.name?.toLowerCase().includes(search) ||
                item.description?.toLowerCase().includes(search) ||
                item.zone_name?.toLowerCase().includes(search)
            );
        }

        this.filteredProjects = result;
        this.cdr.markForCheck();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.applyFilters();
    }

    loadProjects(): void {
        this.loading = true;
        forkJoin({
            projects: this.productionService.getProjects(),
            zones: this.productionService.getZones()
        }).subscribe({
            next: (data: any) => {
                this.projects = data.projects.results || data.projects;
                this.zones = (data.zones.results || data.zones).map((z: any) => ({
                    id: z.id,
                    name: z.name
                }));
                this.applyFilters();
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load data'
                });
                this.loading = false;
                this.cdr.markForCheck();
                console.error('Error loading data:', error);
            }
        });
    }

    openNew(): void {
        this.project = {
            name: '',
            description: '',
            zone: undefined,
            is_active: true
        };
        this.imageFile = null;
        this.imagePreview = null;
        this.imageRemoved = false;
        this.editMode = false;
        this.submitted = false;
        this.projectDialog = true;
    }

    editProject(project: Project): void {
        this.project = { ...project };
        this.imageFile = null;
        this.imagePreview = project.image || null;
        this.imageRemoved = false;
        this.editMode = true;
        this.submitted = false;
        this.projectDialog = true;
    }

    hideDialog(): void {
        this.projectDialog = false;
        this.submitted = false;
        this.imageFile = null;
        this.imagePreview = null;
        this.imageRemoved = false;
    }

    onImageSelect(event: any): void {
        const file = event.files?.[0];
        if (file) {
            this.imageFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.imagePreview = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage(): void {
        this.imagePreview = null;
        this.imageFile = null;
        if (this.project) {
            this.project.image = undefined;
        }
        this.imageRemoved = true;
    }

    saveProject(): void {
        this.submitted = true;

        if (!this.project.name) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill the project name'
            });
            return;
        }

        if (this.editMode && this.project.id) {
            // Only send writable fields to avoid 400 error from read-only fields
            const updatePayload: any = {
                name: this.project.name,
                description: this.project.description,
                zone: this.project.zone,
                is_active: this.project.is_active
            };
            // If image was explicitly removed and no new image uploaded, send null to delete
            if (this.imageRemoved && !this.imageFile) {
                updatePayload.image = null;
            }
            this.productionService.updateProject(this.project.id, updatePayload).subscribe({
                next: (updatedProject) => {
                    if (this.imageFile) {
                        this.uploadProjectImage(updatedProject.id!);
                    } else {
                        this.onSaveSuccess('Project updated successfully');
                    }
                },
                error: (error) => this.onSaveError(error, 'update')
            });
        } else {
            this.productionService.createProject(this.project as any).subscribe({
                next: (createdProject) => {
                    if (this.imageFile) {
                        this.uploadProjectImage(createdProject.id!);
                    } else {
                        this.onSaveSuccess('Project created successfully');
                    }
                },
                error: (error) => this.onSaveError(error, 'create')
            });
        }
    }

    private uploadProjectImage(projectId: number): void {
        this.productionService.uploadProjectImage(projectId, this.imageFile!).subscribe({
            next: () => {
                this.onSaveSuccess(this.editMode ? 'Project updated successfully' : 'Project created successfully');
            },
            error: (error) => {
                console.error('Image upload failed:', error);
                this.onSaveSuccess(this.editMode ? 'Project updated (image upload failed)' : 'Project created (image upload failed)');
            }
        });
    }

    private onSaveSuccess(message: string): void {
        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: message
        });
        this.loadProjects();
        this.hideDialog();
    }

    private onSaveError(error: any, action: string): void {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.detail || `Failed to ${action} project`
        });
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
