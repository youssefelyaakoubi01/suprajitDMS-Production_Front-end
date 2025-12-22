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
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';
import { DowntimeProblem } from '../../../core/models/production.model';

type ProblemCategory = 'mechanical' | 'electrical' | 'quality' | 'material' | 'manpower' | 'other';

@Component({
    selector: 'app-problem-types',
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
                        <i class="pi pi-exclamation-triangle mr-2"></i>Problem Types Management
                    </h2>
                </ng-template>
                <ng-template pTemplate="right">
                    <p-button
                        label="New Problem Type"
                        icon="pi pi-plus"
                        styleClass="p-button-success mr-2"
                        (onClick)="openNew()">
                    </p-button>
                    <p-button
                        label="Refresh"
                        icon="pi pi-refresh"
                        styleClass="p-button-outlined"
                        (onClick)="loadProblemTypes()">
                    </p-button>
                </ng-template>
            </p-toolbar>

            <p-table
                [value]="problemTypes"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} problem types"
                [globalFilterFields]="['name', 'code', 'category']"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 80px">ID</th>
                        <th pSortableColumn="code">Code <p-sortIcon field="code"></p-sortIcon></th>
                        <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
                        <th pSortableColumn="category">Category <p-sortIcon field="category"></p-sortIcon></th>
                        <th>Description</th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-problem>
                    <tr>
                        <td>{{ problem.id }}</td>
                        <td><strong class="text-primary">{{ problem.code }}</strong></td>
                        <td>{{ problem.name }}</td>
                        <td>
                            <p-tag
                                [value]="getCategoryLabel(problem.category)"
                                [severity]="getCategorySeverity(problem.category)">
                            </p-tag>
                        </td>
                        <td>{{ problem.description || '-' }}</td>
                        <td>
                            <p-tag
                                [value]="problem.is_active ? 'Active' : 'Inactive'"
                                [severity]="problem.is_active ? 'success' : 'danger'">
                            </p-tag>
                        </td>
                        <td>
                            <p-button
                                icon="pi pi-pencil"
                                styleClass="p-button-rounded p-button-warning p-button-text mr-1"
                                pTooltip="Edit"
                                (onClick)="editProblemType(problem)">
                            </p-button>
                            <p-button
                                icon="pi pi-trash"
                                styleClass="p-button-rounded p-button-danger p-button-text"
                                pTooltip="Delete"
                                (onClick)="confirmDelete(problem)">
                            </p-button>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="7" class="text-center p-4">
                            <i class="pi pi-inbox text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No problem types found. Click "New Problem Type" to create one.</span>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Create/Edit Dialog -->
        <p-dialog
            [(visible)]="problemDialog"
            [style]="{width: '500px'}"
            [header]="editMode ? 'Edit Problem Type' : 'New Problem Type'"
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
                            [(ngModel)]="problemType.code"
                            required
                            autofocus
                            placeholder="e.g., MECH-001"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !problemType.code}" />
                        <small class="error-message" *ngIf="submitted && !problemType.code">Code is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="name">Name <span class="required">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="name"
                            [(ngModel)]="problemType.name"
                            required
                            placeholder="Problem Type Name"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !problemType.name}" />
                        <small class="error-message" *ngIf="submitted && !problemType.name">Name is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="category">Category <span class="required">*</span></label>
                        <p-select
                            id="category"
                            [(ngModel)]="problemType.category"
                            [options]="categories"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select Category"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !problemType.category}">
                        </p-select>
                        <small class="error-message" *ngIf="submitted && !problemType.category">Category is required.</small>
                    </div>

                    <div class="form-field" style="grid-column: 1 / -1;">
                        <label for="description">Description</label>
                        <textarea
                            pInputTextarea
                            id="description"
                            [(ngModel)]="problemType.description"
                            rows="2"
                            placeholder="Problem type description (optional)">
                        </textarea>
                    </div>

                    <div class="form-field toggle-field">
                        <label for="isActive">Active</label>
                        <p-toggleSwitch [(ngModel)]="problemType.is_active" inputId="isActive"></p-toggleSwitch>
                    </div>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="saveProblemType()"></p-button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--surface-50);
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        .form-field {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-field label {
            font-weight: 500;
            color: var(--text-color);
        }

        .required {
            color: var(--red-500);
        }

        .error-message {
            color: var(--red-500);
            font-size: 0.75rem;
        }

        .toggle-field {
            flex-direction: row;
            align-items: center;
            gap: 1rem;
        }
    `]
})
export class ProblemTypesComponent implements OnInit {
    problemTypes: DowntimeProblem[] = [];
    problemType: Partial<DowntimeProblem> = {};

    categories = [
        { label: 'Mechanical', value: 'mechanical' },
        { label: 'Electrical', value: 'electrical' },
        { label: 'Quality', value: 'quality' },
        { label: 'Material', value: 'material' },
        { label: 'Manpower', value: 'manpower' },
        { label: 'Other', value: 'other' }
    ];

    problemDialog = false;
    editMode = false;
    submitted = false;
    loading = false;

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadProblemTypes();
    }

    loadProblemTypes(): void {
        this.loading = true;
        this.productionService.getDowntimeProblems().subscribe({
            next: (data: any) => {
                this.problemTypes = Array.isArray(data) ? data : data.results || [];
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load problem types' });
                this.loading = false;
            }
        });
    }

    getCategoryLabel(category: ProblemCategory): string {
        const found = this.categories.find(c => c.value === category);
        return found ? found.label : category;
    }

    getCategorySeverity(category: ProblemCategory): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
            'mechanical': 'danger',
            'electrical': 'warn',
            'quality': 'info',
            'material': 'secondary',
            'manpower': 'contrast',
            'other': 'secondary'
        };
        return map[category] || 'info';
    }

    openNew(): void {
        this.problemType = {
            code: '',
            name: '',
            description: '',
            category: 'other',
            is_active: true
        };
        this.editMode = false;
        this.submitted = false;
        this.problemDialog = true;
    }

    editProblemType(problem: DowntimeProblem): void {
        this.problemType = { ...problem };
        this.editMode = true;
        this.submitted = false;
        this.problemDialog = true;
    }

    hideDialog(): void {
        this.problemDialog = false;
        this.submitted = false;
    }

    saveProblemType(): void {
        this.submitted = true;

        if (!this.problemType.code || !this.problemType.name || !this.problemType.category) {
            this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields' });
            return;
        }

        if (this.editMode && this.problemType.id) {
            this.productionService.updateDowntimeProblem(this.problemType.id, this.problemType).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Problem type updated successfully' });
                    this.loadProblemTypes();
                    this.hideDialog();
                },
                error: (error) => {
                    const errorMsg = this.extractErrorMessage(error);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                }
            });
        } else {
            this.productionService.createDowntimeProblem(this.problemType).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Problem type created successfully' });
                    this.loadProblemTypes();
                    this.hideDialog();
                },
                error: (error) => {
                    const errorMsg = this.extractErrorMessage(error);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                }
            });
        }
    }

    confirmDelete(problem: DowntimeProblem): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the problem type "${problem.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteProblemType(problem)
        });
    }

    deleteProblemType(problem: DowntimeProblem): void {
        if (!problem.id) return;
        this.productionService.deleteDowntimeProblem(problem.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Problem type deleted successfully' });
                this.loadProblemTypes();
            },
            error: (error) => {
                const errorMsg = this.extractErrorMessage(error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
            }
        });
    }

    private extractErrorMessage(error: any): string {
        if (error.error) {
            if (typeof error.error === 'string') {
                return error.error;
            } else if (error.error.detail) {
                return error.error.detail;
            } else if (error.error.error) {
                return error.error.error;
            } else {
                const fieldErrors = Object.entries(error.error)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('; ');
                if (fieldErrors) return fieldErrors;
            }
        }
        return 'An error occurred';
    }
}
