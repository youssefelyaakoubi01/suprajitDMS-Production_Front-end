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

interface Part {
    id?: number;
    part_number: string;
    name: string;
    project: number;
    project_name?: string;
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
                [value]="parts"
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
                        <th>Project</th>
                        <th style="width: 120px">Shift Target</th>
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
                            <p-tag [value]="part.project_name || getProjectName(part.project)" severity="info"></p-tag>
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
                        <td colspan="8" class="text-center p-4">
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
            [style]="{width: '600px'}"
            [header]="editMode ? 'Edit Part' : 'New Part'"
            [modal]="true"
            styleClass="p-fluid form-dialog">

            <ng-template pTemplate="content">
                <div class="form-grid">
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
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !part.project}">
                        </p-select>
                        <small class="error-message" *ngIf="submitted && !part.project">Project is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="shiftTarget">Shift Target <span class="required">*</span></label>
                        <p-inputNumber
                            id="shiftTarget"
                            [(ngModel)]="part.shift_target"
                            [min]="0"
                            placeholder="Target per shift"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !part.shift_target}">
                        </p-inputNumber>
                        <small class="error-message" *ngIf="submitted && !part.shift_target">Shift target is required.</small>
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
    `]
})
export class PartsComponent implements OnInit {
    parts: Part[] = [];
    projects: Project[] = [];
    part: Partial<Part> = {};

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

        this.productionService.getProjects().subscribe({
            next: (data: any) => {
                this.projects = (data.results || data).map((p: any) => ({
                    id: p.id,
                    name: p.name
                }));
            }
        });

        this.productionService.getParts().subscribe({
            next: (data: any) => {
                this.parts = data.results || data;
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load parts' });
                this.loading = false;
            }
        });
    }

    getProjectName(projectId: number): string {
        return this.projects.find(p => p.id === projectId)?.name || 'Unknown';
    }

    openNew(): void {
        this.part = {
            part_number: '',
            name: '',
            project: undefined,
            shift_target: 0,
            scrap_target: 0,
            price: 0,
            efficiency: 85,
            is_active: true
        };
        this.editMode = false;
        this.submitted = false;
        this.partDialog = true;
    }

    editPart(part: Part): void {
        this.part = { ...part };
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

        if (!this.part.part_number || !this.part.name || !this.part.project || !this.part.shift_target) {
            this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields' });
            return;
        }

        if (this.editMode && this.part.id) {
            this.productionService.updatePart(this.part.id, this.part as any).subscribe({
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
            this.productionService.createPart(this.part as any).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Part created successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to create part' });
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
