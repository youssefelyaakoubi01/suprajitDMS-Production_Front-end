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

type ProductType = 'semi_finished' | 'finished_good';

interface Part {
    id?: number;
    part_number: string;
    name: string;
    project: number;
    project_name?: string;
    product_type: ProductType;
    product_type_display?: string;
    zone?: number;
    zone_name?: string;
    process?: number;
    process_name?: string;
    shift_target: number;
    scrap_target?: number;
    price?: number;
    efficiency?: number;
    description?: string;
    material_status?: string;
    is_active: boolean;
}

interface Project {
    id: number;
    name: string;
}

interface Zone {
    id: number;
    name: string;
    code: string;
    project?: number;
}

interface Process {
    id: number;
    name: string;
    code: string;
    project: number;
}

@Component({
    selector: 'app-parts',
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
                        <i class="pi pi-box mr-2"></i>Parts Management
                    </h2>
                </ng-template>
                <ng-template pTemplate="center">
                    <div class="flex align-items-center gap-3">
                        <div class="flex align-items-center gap-2">
                            <label for="typeFilter" class="font-medium">Type:</label>
                            <p-select
                                id="typeFilter"
                                [(ngModel)]="selectedProductType"
                                [options]="productTypeFilterOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="All Types"
                                [showClear]="true"
                                styleClass="w-12rem"
                                (onChange)="filterParts()">
                            </p-select>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="right">
                    <p-button
                        label="New Part"
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
                [value]="filteredParts"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} parts"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 80px">ID</th>
                        <th pSortableColumn="part_number">Part Number <p-sortIcon field="part_number"></p-sortIcon></th>
                        <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
                        <th>Type</th>
                        <th>Project</th>
                        <th>Zone</th>
                        <th>Process</th>
                        <th style="width: 120px">Hourly Target</th>
                        <th style="width: 100px">Price</th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-part>
                    <tr>
                        <td>{{ part.id }}</td>
                        <td><strong class="text-primary">{{ part.part_number }}</strong></td>
                        <td>{{ part.name }}</td>
                        <td>
                            <p-tag
                                [value]="part.product_type_display || getProductTypeLabel(part.product_type)"
                                [severity]="part.product_type === 'semi_finished' ? 'warn' : 'success'">
                            </p-tag>
                        </td>
                        <td>
                            <p-tag [value]="part.project_name || getProjectName(part.project)" severity="info"></p-tag>
                        </td>
                        <td>
                            <span *ngIf="part.zone_name">{{ part.zone_name }}</span>
                            <span *ngIf="!part.zone_name" class="text-gray-400">-</span>
                        </td>
                        <td>
                            <span *ngIf="part.process_name">{{ part.process_name }}</span>
                            <span *ngIf="!part.process_name" class="text-gray-400">-</span>
                        </td>
                        <td class="text-center font-bold">{{ part.shift_target }}</td>
                        <td class="text-right">{{ part.price | currency:'INR':'symbol':'1.2-2' }}</td>
                        <td>
                            <p-tag
                                [value]="part.is_active ? 'Active' : 'Inactive'"
                                [severity]="part.is_active ? 'success' : 'danger'">
                            </p-tag>
                        </td>
                        <td>
                            <p-button
                                icon="pi pi-pencil"
                                styleClass="p-button-rounded p-button-warning p-button-text mr-1"
                                pTooltip="Edit"
                                (onClick)="editPart(part)">
                            </p-button>
                            <p-button
                                icon="pi pi-trash"
                                styleClass="p-button-rounded p-button-danger p-button-text"
                                pTooltip="Delete"
                                (onClick)="confirmDelete(part)">
                            </p-button>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="11" class="text-center p-4">
                            <i class="pi pi-inbox text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No parts found.</span>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Create/Edit Dialog -->
        <p-dialog
            [(visible)]="partDialog"
            [style]="{width: '650px'}"
            [header]="editMode ? 'Edit Part' : 'New Part'"
            [modal]="true"
            styleClass="p-fluid form-dialog">

            <ng-template pTemplate="content">
                <div class="form-grid">
                    <!-- Product Type - First field -->
                    <div class="form-field">
                        <label for="productType">Product Type <span class="required">*</span></label>
                        <p-select
                            id="productType"
                            [(ngModel)]="part.product_type"
                            [options]="productTypeOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select Type"
                            (onChange)="onProductTypeChange()"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !part.product_type}">
                        </p-select>
                        <small class="help-text">
                            <span *ngIf="part.product_type === 'semi_finished'">Semi-finished: Zone → Project → Process → Part Number</span>
                            <span *ngIf="part.product_type === 'finished_good'">Finished Good: Zone → Project → Production Line → Part Number</span>
                        </small>
                    </div>

                    <div class="form-field">
                        <label for="partNumber">Part Number <span class="required">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="partNumber"
                            [(ngModel)]="part.part_number"
                            required
                            placeholder="e.g., PN-12345"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !part.part_number}" />
                        <small class="error-message" *ngIf="submitted && !part.part_number">Part number is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="name">Name <span class="required">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="name"
                            [(ngModel)]="part.name"
                            required
                            placeholder="Part Name"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !part.name}" />
                        <small class="error-message" *ngIf="submitted && !part.name">Name is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="project">Project <span class="required">*</span></label>
                        <p-select
                            id="project"
                            [(ngModel)]="part.project"
                            [options]="projects"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Project"
                            (onChange)="onProjectChange()"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !part.project}">
                        </p-select>
                        <small class="error-message" *ngIf="submitted && !part.project">Project is required.</small>
                    </div>

                    <!-- Zone - Required for semi-finished, optional for finished goods -->
                    <div class="form-field">
                        <label for="zone">
                            Zone
                            <span class="required" *ngIf="part.product_type === 'semi_finished'">*</span>
                        </label>
                        <p-select
                            id="zone"
                            [(ngModel)]="part.zone"
                            [options]="filteredZones"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Zone"
                            [showClear]="part.product_type !== 'semi_finished'"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && part.product_type === 'semi_finished' && !part.zone}">
                            <ng-template let-zone pTemplate="item">
                                <div class="flex align-items-center gap-2">
                                    <strong>{{ zone.code }}</strong>
                                    <span class="text-gray-500">- {{ zone.name }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                        <small class="error-message" *ngIf="submitted && part.product_type === 'semi_finished' && !part.zone">
                            Zone is required for semi-finished products.
                        </small>
                    </div>

                    <!-- Process - Only for semi-finished products -->
                    <div class="form-field" *ngIf="part.product_type === 'semi_finished'">
                        <label for="process">Process <span class="required">*</span></label>
                        <p-select
                            id="process"
                            [(ngModel)]="part.process"
                            [options]="filteredProcesses"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Process"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && part.product_type === 'semi_finished' && !part.process}">
                            <ng-template let-process pTemplate="item">
                                <div class="flex align-items-center gap-2">
                                    <strong>{{ process.code }}</strong>
                                    <span class="text-gray-500">- {{ process.name }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                        <small class="error-message" *ngIf="submitted && part.product_type === 'semi_finished' && !part.process">
                            Process is required for semi-finished products.
                        </small>
                    </div>

                    <div class="form-field">
                        <label for="shiftTarget">Hourly Target <span class="required">*</span></label>
                        <p-inputNumber
                            id="shiftTarget"
                            [(ngModel)]="part.shift_target"
                            [min]="0"
                            placeholder="Target per hour"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !part.shift_target}">
                        </p-inputNumber>
                        <small class="error-message" *ngIf="submitted && !part.shift_target">Hourly target is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="scrapTarget">Scrap Target (%)</label>
                        <p-inputNumber
                            id="scrapTarget"
                            [(ngModel)]="part.scrap_target"
                            [min]="0"
                            [max]="100"
                            suffix="%"
                            placeholder="Max scrap percentage">
                        </p-inputNumber>
                    </div>

                    <div class="form-field">
                        <label for="price">Price (INR)</label>
                        <p-inputNumber
                            id="price"
                            [(ngModel)]="part.price"
                            [min]="0"
                            mode="currency"
                            currency="INR"
                            locale="en-IN"
                            placeholder="Unit price">
                        </p-inputNumber>
                    </div>

                    <div class="form-field">
                        <label for="efficiency">Efficiency Target (%)</label>
                        <p-inputNumber
                            id="efficiency"
                            [(ngModel)]="part.efficiency"
                            [min]="0"
                            [max]="100"
                            suffix="%"
                            placeholder="Target efficiency">
                        </p-inputNumber>
                    </div>

                    <div class="form-field toggle-field">
                        <label for="isActive">Active</label>
                        <p-toggleSwitch [(ngModel)]="part.is_active" inputId="isActive"></p-toggleSwitch>
                    </div>
                </div>

                <div class="form-field" style="margin-top: 1rem;">
                    <label for="description">Description</label>
                    <textarea
                        pInputTextarea
                        id="description"
                        [(ngModel)]="part.description"
                        rows="2"
                        placeholder="Part description (optional)">
                    </textarea>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="savePart()"></p-button>
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
export class PartsComponent implements OnInit {
    parts: Part[] = [];
    filteredParts: Part[] = [];
    projects: Project[] = [];
    zones: Zone[] = [];
    processes: Process[] = [];
    filteredZones: Zone[] = [];
    filteredProcesses: Process[] = [];
    part: Partial<Part> = {};

    productTypeOptions = [
        { label: 'Semi-Finished', value: 'semi_finished' },
        { label: 'Finished Good', value: 'finished_good' }
    ];

    productTypeFilterOptions = [
        { label: 'Semi-Finished', value: 'semi_finished' },
        { label: 'Finished Good', value: 'finished_good' }
    ];

    selectedProductType: string | null = null;

    partDialog = false;
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
            parts: this.productionService.getParts(),
            projects: this.productionService.getProjects(),
            zones: this.productionService.getZones(),
            processes: this.productionService.getProcesses()
        }).subscribe({
            next: (data: any) => {
                this.parts = (data.parts.results || data.parts).map((p: any) => ({
                    ...p,
                    name: p.name || p.description,
                    is_active: p.material_status === 'active'
                }));
                this.projects = (data.projects.results || data.projects).map((p: any) => ({
                    id: p.id,
                    name: p.name
                }));
                this.zones = (data.zones.results || data.zones).map((z: any) => ({
                    id: z.id,
                    name: z.name,
                    code: z.code,
                    project: z.project
                }));
                this.processes = (data.processes.results || data.processes).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    code: p.code,
                    project: p.project
                }));
                this.filterParts();
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load parts' });
                this.loading = false;
            }
        });
    }

    filterParts(): void {
        if (this.selectedProductType) {
            this.filteredParts = this.parts.filter(p => p.product_type === this.selectedProductType);
        } else {
            this.filteredParts = [...this.parts];
        }
    }

    getProjectName(projectId: number): string {
        return this.projects.find(p => p.id === projectId)?.name || 'Unknown';
    }

    getProductTypeLabel(type: string): string {
        return type === 'semi_finished' ? 'Semi-Finished' : 'Finished Good';
    }

    onProductTypeChange(): void {
        // Clear zone and process when switching product type
        if (this.part.product_type === 'finished_good') {
            this.part.process = undefined;
        }
        this.updateFilteredOptions();
    }

    onProjectChange(): void {
        this.updateFilteredOptions();
        // Reset zone and process when project changes
        this.part.zone = undefined;
        this.part.process = undefined;
    }

    updateFilteredOptions(): void {
        if (this.part.project) {
            // Filter zones by project (or show all if project not set on zone)
            this.filteredZones = this.zones.filter(z => !z.project || z.project === this.part.project);
            // Filter processes by project
            this.filteredProcesses = this.processes.filter(p => p.project === this.part.project);
        } else {
            this.filteredZones = [...this.zones];
            this.filteredProcesses = [...this.processes];
        }
    }

    openNew(): void {
        this.part = {
            part_number: '',
            name: '',
            project: undefined,
            product_type: 'finished_good',
            zone: undefined,
            process: undefined,
            shift_target: 0,
            scrap_target: 0,
            price: 0,
            efficiency: 85,
            is_active: true
        };
        this.filteredZones = [...this.zones];
        this.filteredProcesses = [...this.processes];
        this.editMode = false;
        this.submitted = false;
        this.partDialog = true;
    }

    editPart(part: Part): void {
        this.part = { ...part };
        this.updateFilteredOptions();
        this.editMode = true;
        this.submitted = false;
        this.partDialog = true;
    }

    hideDialog(): void {
        this.partDialog = false;
        this.submitted = false;
    }

    savePart(): void {
        this.submitted = true;

        // Basic validation
        if (!this.part.part_number || !this.part.name || !this.part.project || !this.part.shift_target) {
            this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields' });
            return;
        }

        // Validate semi-finished product requirements
        if (this.part.product_type === 'semi_finished') {
            if (!this.part.zone) {
                this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Zone is required for semi-finished products' });
                return;
            }
            if (!this.part.process) {
                this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Process is required for semi-finished products' });
                return;
            }
        }

        // Prepare data for API - map name to description for backend
        const partData: any = {
            ...this.part,
            description: this.part.name,
            material_status: this.part.is_active ? 'active' : 'inactive'
        };

        // Clear process for finished goods
        if (this.part.product_type === 'finished_good') {
            partData.process = null;
        }

        if (this.editMode && this.part.id) {
            this.productionService.updatePart(this.part.id, partData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Part updated successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to update part' });
                }
            });
        } else {
            this.productionService.createPart(partData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Part created successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    let errorMsg = 'Failed to create part';
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

    confirmDelete(part: Part): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${part.part_number}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deletePart(part)
        });
    }

    deletePart(part: Part): void {
        if (!part.id) return;
        this.productionService.deletePart(part.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Part deleted successfully' });
                this.loadData();
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to delete' });
            }
        });
    }
}
