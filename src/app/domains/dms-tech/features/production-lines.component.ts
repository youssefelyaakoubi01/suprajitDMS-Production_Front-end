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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuModule } from 'primeng/menu';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';
import { ExportService } from '../../../core/services/export.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

interface ProductionLine {
    id?: number;
    name: string;
    project: number;
    project_name?: string;
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
        TextareaModule,
        SelectModule,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        ToggleSwitchModule,
        CardModule,
        ToolbarModule,
        TooltipModule,
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
                        <i class="pi pi-sitemap mr-2"></i>Production Lines Management
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
                                placeholder="Search..."
                                class="w-12rem" />
                        </p-iconfield>
                        <p-select
                            [(ngModel)]="selectedProjectFilter"
                            [options]="projectFilterOptions"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="All Projects"
                            [showClear]="true"
                            (onChange)="onFilterChange()"
                            styleClass="w-12rem">
                        </p-select>
                        <p-button *ngIf="searchTerm || selectedProjectFilter"
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
                [value]="filteredProductionLines"
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
                        <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
                        <th>Project</th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-line>
                    <tr>
                        <td>{{ line.id }}</td>
                        <td>{{ line.name }}</td>
                        <td>
                            <p-tag [value]="line.project_name || getProjectName(line.project)" severity="info"></p-tag>
                        </td>
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
                        <td colspan="5" class="text-center p-4">
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
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductionLinesComponent implements OnInit, OnDestroy {
    productionLines: ProductionLine[] = [];
    filteredProductionLines: ProductionLine[] = [];
    projects: Project[] = [];
    projectFilterOptions: { id: number; name: string }[] = [];
    line: Partial<ProductionLine> = {};
    exportMenuItems: MenuItem[] = [];

    lineDialog = false;
    editMode = false;
    submitted = false;
    loading = false;

    // Filter properties
    searchTerm = '';
    selectedProjectFilter: number | null = null;
    private searchSubject = new Subject<string>();
    private filterSubject = new Subject<void>();
    private destroy$ = new Subject<void>();

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private cdr: ChangeDetectorRef,
        private exportService: ExportService
    ) {}

    ngOnInit(): void {
        this.setupSearch();
        this.loadData();
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
        const data = this.filteredProductionLines.map(l => ({
            ID: l.id,
            Name: l.name,
            Project: l.project_name || this.getProjectName(l.project),
            Status: l.is_active ? 'Active' : 'Inactive'
        }));
        const timestamp = new Date().toISOString().split('T')[0];
        this.exportService.exportToExcel(data, `production-lines-export-${timestamp}`, 'ProductionLines');
        this.messageService.add({
            severity: 'success',
            summary: 'Export',
            detail: `${data.length} enregistrements exportés`
        });
    }

    exportToCsv(): void {
        const data = this.filteredProductionLines.map(l => ({
            ID: l.id,
            Name: l.name,
            Project: l.project_name || this.getProjectName(l.project),
            Status: l.is_active ? 'Active' : 'Inactive'
        }));
        const timestamp = new Date().toISOString().split('T')[0];
        this.exportService.exportToCsv(data, `production-lines-export-${timestamp}`);
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

        // Debounced dropdown filter changes
        this.filterSubject.pipe(
            debounceTime(100),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.applyFilters();
        });
    }

    onSearchChange(value: string): void {
        this.searchSubject.next(value);
    }

    onFilterChange(): void {
        this.filterSubject.next();
    }

    applyFilters(): void {
        let result = [...this.productionLines];

        if (this.searchTerm) {
            const search = this.searchTerm.toLowerCase();
            result = result.filter(item =>
                item.name?.toLowerCase().includes(search) ||
                item.project_name?.toLowerCase().includes(search)
            );
        }

        if (this.selectedProjectFilter) {
            result = result.filter(item => item.project === this.selectedProjectFilter);
        }

        this.filteredProductionLines = result;
        this.cdr.markForCheck();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.selectedProjectFilter = null;
        this.applyFilters();
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
                this.projectFilterOptions = this.projects.map(p => ({ id: p.id, name: p.name }));
            },
            error: (err) => console.error('Error loading projects:', err)
        });

        // Load production lines
        this.productionService.getProductionLines().subscribe({
            next: (data: any) => {
                this.productionLines = data.results || data;
                this.applyFilters();
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load production lines'
                });
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    getProjectName(projectId: number): string {
        const project = this.projects.find(p => p.id === projectId);
        return project?.name || 'Unknown';
    }

    openNew(): void {
        this.line = {
            name: '',
            project: undefined,
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

        if (!this.line.name || !this.line.project) {
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
