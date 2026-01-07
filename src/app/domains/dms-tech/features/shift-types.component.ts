import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { SliderModule } from 'primeng/slider';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';
import { ShiftType } from '../../../core/models/production.model';

@Component({
    selector: 'app-shift-types',
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
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        ToggleSwitchModule,
        CardModule,
        ToolbarModule,
        TooltipModule,
        SliderModule,
        ProgressBarModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="left">
                    <h2 class="m-0">Shift Type Management</h2>
                </ng-template>
                <ng-template pTemplate="right">
                    <p-button
                        label="New Shift Type"
                        icon="pi pi-plus"
                        styleClass="p-button-success mr-2"
                        (onClick)="openNew()">
                    </p-button>
                    <p-button
                        label="Refresh"
                        icon="pi pi-refresh"
                        styleClass="p-button-outlined"
                        (onClick)="loadShiftTypes()">
                    </p-button>
                </ng-template>
            </p-toolbar>

            <p-table
                [value]="shiftTypes"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} shift types"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 80px">ID</th>
                        <th>Code</th>
                        <th>Name</th>
                        <th style="width: 200px">Target %</th>
                        <th>Description</th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-shiftType>
                    <tr>
                        <td>{{ shiftType.id }}</td>
                        <td><strong>{{ shiftType.code }}</strong></td>
                        <td>{{ shiftType.name }}</td>
                        <td>
                            <div class="flex align-items-center gap-2">
                                <p-progressBar
                                    [value]="shiftType.target_percentage"
                                    [showValue]="false"
                                    styleClass="h-1rem flex-grow-1"
                                    [style]="{'background-color': getProgressBgColor(shiftType.target_percentage)}">
                                </p-progressBar>
                                <span class="font-bold" style="min-width: 45px">{{ shiftType.target_percentage }}%</span>
                            </div>
                        </td>
                        <td>{{ shiftType.description || '-' }}</td>
                        <td>
                            <p-tag
                                [value]="shiftType.is_active ? 'Active' : 'Inactive'"
                                [severity]="shiftType.is_active ? 'success' : 'danger'">
                            </p-tag>
                        </td>
                        <td>
                            <p-button
                                icon="pi pi-eye"
                                styleClass="p-button-rounded p-button-info p-button-text mr-1"
                                pTooltip="View Details"
                                (onClick)="viewShiftType(shiftType)">
                            </p-button>
                            <p-button
                                icon="pi pi-pencil"
                                styleClass="p-button-rounded p-button-warning p-button-text mr-1"
                                pTooltip="Edit"
                                (onClick)="editShiftType(shiftType)">
                            </p-button>
                            <p-button
                                icon="pi pi-trash"
                                styleClass="p-button-rounded p-button-danger p-button-text"
                                pTooltip="Delete"
                                (onClick)="confirmDelete(shiftType)">
                            </p-button>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="7" class="text-center p-4">
                            <i class="pi pi-inbox text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No shift types found. Click "New Shift Type" to create one.</span>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- View/Details Dialog -->
        <p-dialog
            [(visible)]="viewDialog"
            [style]="{width: '500px'}"
            header="Shift Type Details"
            [modal]="true">
            <div class="p-fluid" *ngIf="selectedShiftType">
                <div class="field mb-4">
                    <label class="font-bold text-gray-600">ID</label>
                    <div class="text-lg">{{ selectedShiftType.id }}</div>
                </div>
                <div class="field mb-4">
                    <label class="font-bold text-gray-600">Code</label>
                    <div class="text-lg">{{ selectedShiftType.code }}</div>
                </div>
                <div class="field mb-4">
                    <label class="font-bold text-gray-600">Name</label>
                    <div class="text-lg">{{ selectedShiftType.name }}</div>
                </div>
                <div class="field mb-4">
                    <label class="font-bold text-gray-600">Target Percentage</label>
                    <div class="flex align-items-center gap-2 mt-2">
                        <p-progressBar
                            [value]="selectedShiftType.target_percentage"
                            styleClass="h-1rem flex-grow-1">
                        </p-progressBar>
                        <span class="text-lg font-bold">{{ selectedShiftType.target_percentage }}%</span>
                    </div>
                    <small class="text-gray-500 mt-2 block">
                        Target will be adjusted to {{ selectedShiftType.target_percentage }}% of the base hourly target
                    </small>
                </div>
                <div class="field mb-4">
                    <label class="font-bold text-gray-600">Description</label>
                    <div class="text-lg">{{ selectedShiftType.description || 'No description' }}</div>
                </div>
                <div class="field mb-4">
                    <label class="font-bold text-gray-600">Status</label>
                    <div>
                        <p-tag
                            [value]="selectedShiftType.is_active ? 'Active' : 'Inactive'"
                            [severity]="selectedShiftType.is_active ? 'success' : 'danger'">
                        </p-tag>
                    </div>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-button label="Close" icon="pi pi-times" styleClass="p-button-text" (onClick)="viewDialog = false"></p-button>
                <p-button label="Edit" icon="pi pi-pencil" (onClick)="editFromView()"></p-button>
            </ng-template>
        </p-dialog>

        <!-- Create/Edit Dialog -->
        <p-dialog
            [(visible)]="shiftTypeDialog"
            [style]="{width: '550px'}"
            [header]="editMode ? 'Edit Shift Type' : 'New Shift Type'"
            [modal]="true"
            styleClass="p-fluid">

            <ng-template pTemplate="content">
                <div class="field mb-4">
                    <label for="code" class="font-bold">Code *</label>
                    <input
                        type="text"
                        pInputText
                        id="code"
                        [(ngModel)]="shiftType.code"
                        required
                        autofocus
                        placeholder="e.g., normal, setup, break"
                        [ngClass]="{'ng-invalid ng-dirty': submitted && !shiftType.code}" />
                    <small class="p-error" *ngIf="submitted && !shiftType.code">Code is required.</small>
                    <small class="text-gray-500">Unique identifier (lowercase, no spaces recommended)</small>
                </div>

                <div class="field mb-4">
                    <label for="name" class="font-bold">Name *</label>
                    <input
                        type="text"
                        pInputText
                        id="name"
                        [(ngModel)]="shiftType.name"
                        required
                        placeholder="e.g., Normal, Setup, Break"
                        [ngClass]="{'ng-invalid ng-dirty': submitted && !shiftType.name}" />
                    <small class="p-error" *ngIf="submitted && !shiftType.name">Name is required.</small>
                </div>

                <div class="field mb-4">
                    <label for="targetPercentage" class="font-bold">Target Percentage *</label>
                    <div class="flex align-items-center gap-3 mt-2">
                        <p-slider
                            [(ngModel)]="shiftType.target_percentage"
                            [min]="0"
                            [max]="100"
                            styleClass="flex-grow-1">
                        </p-slider>
                        <p-inputNumber
                            [(ngModel)]="shiftType.target_percentage"
                            [min]="0"
                            [max]="100"
                            suffix="%"
                            [style]="{width: '100px'}">
                        </p-inputNumber>
                    </div>
                    <small class="text-gray-500 mt-2 block">
                        Percentage of base target to apply. 100% = full target, 50% = half target, 0% = no production expected
                    </small>
                    <div class="mt-2 p-3 surface-100 border-round">
                        <strong>Example:</strong> If hourly target is 100 units and percentage is {{ shiftType.target_percentage }}%,
                        the adjusted target will be <strong>{{ shiftType.target_percentage }}</strong> units.
                    </div>
                </div>

                <div class="field mb-4">
                    <label for="description" class="font-bold">Description</label>
                    <textarea
                        pInputTextarea
                        id="description"
                        [(ngModel)]="shiftType.description"
                        rows="3"
                        placeholder="Optional description of when this shift type is used">
                    </textarea>
                </div>

                <div class="field mb-4">
                    <label for="isActive" class="font-bold mr-3">Active</label>
                    <p-toggleSwitch [(ngModel)]="shiftType.is_active" inputId="isActive"></p-toggleSwitch>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="saveShiftType()"></p-button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--surface-50);
        }
        :host ::ng-deep .p-progressbar {
            height: 0.75rem;
        }
        :host ::ng-deep .p-slider {
            width: 100%;
        }
    `]
})
export class ShiftTypesComponent implements OnInit {
    shiftTypes: ShiftType[] = [];
    shiftType: Partial<ShiftType> = {};
    selectedShiftType: ShiftType | null = null;

    shiftTypeDialog = false;
    viewDialog = false;
    editMode = false;
    submitted = false;
    loading = false;

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadShiftTypes();
    }

    loadShiftTypes(): void {
        this.loading = true;
        this.productionService.getShiftTypes().subscribe({
            next: (data: any) => {
                this.shiftTypes = data.results || data;
                this.loading = false;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load shift types'
                });
                this.loading = false;
                console.error('Error loading shift types:', error);
            }
        });
    }

    openNew(): void {
        this.shiftType = {
            code: '',
            name: '',
            target_percentage: 100,
            description: '',
            is_active: true
        };
        this.editMode = false;
        this.submitted = false;
        this.shiftTypeDialog = true;
    }

    viewShiftType(shiftType: ShiftType): void {
        this.selectedShiftType = { ...shiftType };
        this.viewDialog = true;
    }

    editFromView(): void {
        if (this.selectedShiftType) {
            this.editShiftType(this.selectedShiftType);
            this.viewDialog = false;
        }
    }

    editShiftType(shiftType: ShiftType): void {
        this.shiftType = { ...shiftType };
        this.editMode = true;
        this.submitted = false;
        this.shiftTypeDialog = true;
    }

    hideDialog(): void {
        this.shiftTypeDialog = false;
        this.submitted = false;
    }

    saveShiftType(): void {
        this.submitted = true;

        if (!this.shiftType.code || !this.shiftType.name || this.shiftType.target_percentage === undefined) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill all required fields'
            });
            return;
        }

        if (this.editMode && this.shiftType.id) {
            this.productionService.updateShiftType(this.shiftType.id, this.shiftType).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Shift type updated successfully'
                    });
                    this.loadShiftTypes();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.error?.detail || 'Failed to update shift type'
                    });
                }
            });
        } else {
            this.productionService.createShiftType(this.shiftType).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Shift type created successfully'
                    });
                    this.loadShiftTypes();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.error?.detail || error.error?.code?.[0] || 'Failed to create shift type'
                    });
                }
            });
        }
    }

    confirmDelete(shiftType: ShiftType): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the shift type "${shiftType.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteShiftType(shiftType);
            }
        });
    }

    deleteShiftType(shiftType: ShiftType): void {
        this.productionService.deleteShiftType(shiftType.id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Shift type deleted successfully'
                });
                this.loadShiftTypes();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.detail || 'Failed to delete shift type. It may be in use.'
                });
            }
        });
    }

    getProgressBgColor(percentage: number): string {
        if (percentage === 0) return '#e5e7eb';
        if (percentage <= 50) return '#fef3c7';
        return '#d1fae5';
    }
}
