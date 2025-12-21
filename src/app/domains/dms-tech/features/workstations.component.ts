import { Component, OnInit } from '@angular/core';
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
import { BadgeModule } from 'primeng/badge';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';

interface Workstation {
    id?: number;
    name: string;
    code: string;
    production_line: number;
    production_line_name?: string;
    description?: string;
    machines_count?: number;
    is_active: boolean;
}

@Component({
    selector: 'app-workstations',
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
        BadgeModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="left">
                    <h2 class="m-0">
                        <i class="pi pi-desktop mr-2"></i>Workstations Management
                    </h2>
                </ng-template>
                <ng-template pTemplate="right">
                    <p-button
                        label="New Workstation"
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
                [value]="workstations"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} workstations"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 80px">ID</th>
                        <th pSortableColumn="code">Code <p-sortIcon field="code"></p-sortIcon></th>
                        <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
                        <th>Production Line</th>
                        <th style="width: 120px">Machines</th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-ws>
                    <tr>
                        <td>{{ ws.id }}</td>
                        <td><strong class="text-primary">{{ ws.code }}</strong></td>
                        <td>{{ ws.name }}</td>
                        <td>
                            <p-tag [value]="ws.production_line_name || getLineName(ws.production_line)" severity="info"></p-tag>
                        </td>
                        <td class="text-center">
                            <p-badge [value]="ws.machines_count || 0" severity="secondary"></p-badge>
                        </td>
                        <td>
                            <p-tag
                                [value]="ws.is_active ? 'Active' : 'Inactive'"
                                [severity]="ws.is_active ? 'success' : 'danger'">
                            </p-tag>
                        </td>
                        <td>
                            <p-button
                                icon="pi pi-pencil"
                                styleClass="p-button-rounded p-button-warning p-button-text mr-1"
                                pTooltip="Edit"
                                (onClick)="editWorkstation(ws)">
                            </p-button>
                            <p-button
                                icon="pi pi-trash"
                                styleClass="p-button-rounded p-button-danger p-button-text"
                                pTooltip="Delete"
                                (onClick)="confirmDelete(ws)">
                            </p-button>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="7" class="text-center p-4">
                            <i class="pi pi-inbox text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No workstations found.</span>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Create/Edit Dialog -->
        <p-dialog
            [(visible)]="wsDialog"
            [style]="{width: '550px'}"
            [header]="editMode ? 'Edit Workstation' : 'New Workstation'"
            [modal]="true"
            styleClass="p-fluid form-dialog">

            <ng-template pTemplate="content">
                <div class="form-grid">
                    <div class="form-field">
                        <label for="productionLine">Production Line <span class="required">*</span></label>
                        <p-select
                            id="productionLine"
                            [(ngModel)]="workstation.production_line"
                            [options]="productionLines"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Production Line"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !workstation.production_line}">
                        </p-select>
                        <small class="error-message" *ngIf="submitted && !workstation.production_line">Production line is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="code">Code <span class="required">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="code"
                            [(ngModel)]="workstation.code"
                            required
                            placeholder="e.g., WS001"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !workstation.code}" />
                        <small class="error-message" *ngIf="submitted && !workstation.code">Code is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="name">Name <span class="required">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="name"
                            [(ngModel)]="workstation.name"
                            required
                            placeholder="Workstation Name"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !workstation.name}" />
                        <small class="error-message" *ngIf="submitted && !workstation.name">Name is required.</small>
                    </div>

                    <div class="form-field toggle-field">
                        <label for="isActive">Active</label>
                        <p-toggleSwitch [(ngModel)]="workstation.is_active" inputId="isActive"></p-toggleSwitch>
                    </div>
                </div>

                <div class="form-field" style="margin-top: 1rem;">
                    <label for="description">Description</label>
                    <textarea
                        pInputTextarea
                        id="description"
                        [(ngModel)]="workstation.description"
                        rows="3"
                        placeholder="Description (optional)">
                    </textarea>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="saveWorkstation()"></p-button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--surface-50);
        }
    `]
})
export class WorkstationsComponent implements OnInit {
    workstations: Workstation[] = [];
    productionLines: any[] = [];
    workstation: Partial<Workstation> = {};

    wsDialog = false;
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

        this.productionService.getProductionLines().subscribe({
            next: (data: any) => {
                this.productionLines = (data.results || data).map((l: any) => ({
                    id: l.id,
                    name: l.name
                }));
            }
        });

        this.productionService.getWorkstations().subscribe({
            next: (data: any) => {
                this.workstations = data.results || data;
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load workstations' });
                this.loading = false;
            }
        });
    }

    getLineName(lineId: number): string {
        return this.productionLines.find(l => l.id === lineId)?.name || 'Unknown';
    }

    openNew(): void {
        this.workstation = {
            code: '',
            name: '',
            production_line: undefined,
            description: '',
            is_active: true
        };
        this.editMode = false;
        this.submitted = false;
        this.wsDialog = true;
    }

    editWorkstation(ws: Workstation): void {
        this.workstation = { ...ws };
        this.editMode = true;
        this.submitted = false;
        this.wsDialog = true;
    }

    hideDialog(): void {
        this.wsDialog = false;
        this.submitted = false;
    }

    saveWorkstation(): void {
        this.submitted = true;

        if (!this.workstation.code || !this.workstation.name || !this.workstation.production_line) {
            this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields' });
            return;
        }

        if (this.editMode && this.workstation.id) {
            this.productionService.updateWorkstation(this.workstation.id, this.workstation).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Workstation updated successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to update' });
                }
            });
        } else {
            this.productionService.createWorkstation(this.workstation).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Workstation created successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to create' });
                }
            });
        }
    }

    confirmDelete(ws: Workstation): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${ws.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteWorkstation(ws)
        });
    }

    deleteWorkstation(ws: Workstation): void {
        if (!ws.id) return;
        this.productionService.deleteWorkstation(ws.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Workstation deleted successfully' });
                this.loadData();
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to delete' });
            }
        });
    }
}
