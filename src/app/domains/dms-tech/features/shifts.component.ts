import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';
import { Shift } from '../../../core/models/production.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-shifts',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        ToggleSwitchModule,
        CardModule,
        ToolbarModule,
        TooltipModule,
        IconFieldModule,
        InputIconModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="left">
                    <h2 class="m-0">Shift Management</h2>
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
                                placeholder="Search shifts..."
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
                    <p-button
                        label="New Shift"
                        icon="pi pi-plus"
                        styleClass="p-button-success mr-2"
                        (onClick)="openNew()">
                    </p-button>
                    <p-button
                        label="Refresh"
                        icon="pi pi-refresh"
                        styleClass="p-button-outlined"
                        (onClick)="loadShifts()">
                    </p-button>
                </ng-template>
            </p-toolbar>

            <p-table
                [value]="filteredShifts"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} shifts"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 80px">ID</th>
                        <th>Name</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-shift>
                    <tr>
                        <td>{{ shift.id }}</td>
                        <td><strong>{{ shift.name }}</strong></td>
                        <td>{{ shift.start_time }}</td>
                        <td>{{ shift.end_time }}</td>
                        <td>
                            <p-tag
                                [value]="shift.is_active ? 'Active' : 'Inactive'"
                                [severity]="shift.is_active ? 'success' : 'danger'">
                            </p-tag>
                        </td>
                        <td>
                            <p-button
                                icon="pi pi-eye"
                                styleClass="p-button-rounded p-button-info p-button-text mr-1"
                                pTooltip="View Details"
                                (onClick)="viewShift(shift)">
                            </p-button>
                            <p-button
                                icon="pi pi-pencil"
                                styleClass="p-button-rounded p-button-warning p-button-text mr-1"
                                pTooltip="Edit"
                                (onClick)="editShift(shift)">
                            </p-button>
                            <p-button
                                icon="pi pi-trash"
                                styleClass="p-button-rounded p-button-danger p-button-text"
                                pTooltip="Delete"
                                (onClick)="confirmDelete(shift)">
                            </p-button>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="6" class="text-center p-4">
                            <i class="pi pi-inbox text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No shifts found. Click "New Shift" to create one.</span>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- View/Details Dialog -->
        <p-dialog
            [(visible)]="viewDialog"
            [style]="{width: '450px'}"
            header="Shift Details"
            [modal]="true">
            <div class="p-fluid" *ngIf="selectedShift">
                <div class="field mb-4">
                    <label class="font-bold text-gray-600">ID</label>
                    <div class="text-lg">{{ selectedShift.id }}</div>
                </div>
                <div class="field mb-4">
                    <label class="font-bold text-gray-600">Name</label>
                    <div class="text-lg">{{ selectedShift.name }}</div>
                </div>
                <div class="field mb-4">
                    <label class="font-bold text-gray-600">Start Time</label>
                    <div class="text-lg">{{ selectedShift.start_time }}</div>
                </div>
                <div class="field mb-4">
                    <label class="font-bold text-gray-600">End Time</label>
                    <div class="text-lg">{{ selectedShift.end_time }}</div>
                </div>
                <div class="field mb-4">
                    <label class="font-bold text-gray-600">Status</label>
                    <div>
                        <p-tag
                            [value]="selectedShift.is_active ? 'Active' : 'Inactive'"
                            [severity]="selectedShift.is_active ? 'success' : 'danger'">
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
            [(visible)]="shiftDialog"
            [style]="{width: '500px'}"
            [header]="editMode ? 'Edit Shift' : 'New Shift'"
            [modal]="true"
            styleClass="p-fluid">

            <ng-template pTemplate="content">
                <div class="field mb-4">
                    <label for="name" class="font-bold">Name *</label>
                    <input
                        type="text"
                        pInputText
                        id="name"
                        [(ngModel)]="shift.name"
                        required
                        placeholder="e.g., Morning Shift, Night Shift"
                        [ngClass]="{'ng-invalid ng-dirty': submitted && !shift.name}" />
                    <small class="p-error" *ngIf="submitted && !shift.name">Name is required.</small>
                </div>

                <div class="grid">
                    <div class="col-6">
                        <div class="field mb-4">
                            <label for="startTime" class="font-bold">Start Time *</label>
                            <input
                                type="time"
                                pInputText
                                id="startTime"
                                [(ngModel)]="shift.start_time"
                                required
                                [ngClass]="{'ng-invalid ng-dirty': submitted && !shift.start_time}" />
                            <small class="p-error" *ngIf="submitted && !shift.start_time">Start time is required.</small>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="field mb-4">
                            <label for="endTime" class="font-bold">End Time *</label>
                            <input
                                type="time"
                                pInputText
                                id="endTime"
                                [(ngModel)]="shift.end_time"
                                required
                                [ngClass]="{'ng-invalid ng-dirty': submitted && !shift.end_time}" />
                            <small class="p-error" *ngIf="submitted && !shift.end_time">End time is required.</small>
                        </div>
                    </div>
                </div>

                <div class="field mb-4">
                    <label for="isActive" class="font-bold mr-3">Active</label>
                    <p-toggleswitch [(ngModel)]="shift.is_active" inputId="isActive"></p-toggleswitch>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="saveShift()"></p-button>
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
export class ShiftsComponent implements OnInit, OnDestroy {
    shifts: Shift[] = [];
    filteredShifts: Shift[] = [];
    shift: Partial<Shift> = {};
    selectedShift: Shift | null = null;

    shiftDialog = false;
    viewDialog = false;
    editMode = false;
    submitted = false;
    loading = false;

    // Filter properties
    searchTerm = '';
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.setupSearch();
        this.loadShifts();
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
        let result = [...this.shifts];

        if (this.searchTerm) {
            const search = this.searchTerm.toLowerCase();
            result = result.filter(item =>
                item.name?.toLowerCase().includes(search)
            );
        }

        this.filteredShifts = result;
        this.cdr.markForCheck();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.applyFilters();
    }

    loadShifts(): void {
        this.loading = true;
        this.productionService.getShifts().subscribe({
            next: (data: any) => {
                // Handle paginated response or direct array
                this.shifts = data.results || data;
                this.applyFilters();
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load shifts'
                });
                this.loading = false;
                this.cdr.markForCheck();
                console.error('Error loading shifts:', error);
            }
        });
    }

    openNew(): void {
        this.shift = {
            name: '',
            start_time: '06:00',
            end_time: '14:00',
            is_active: true
        };
        this.editMode = false;
        this.submitted = false;
        this.shiftDialog = true;
    }

    viewShift(shift: Shift): void {
        this.selectedShift = { ...shift };
        this.viewDialog = true;
    }

    editFromView(): void {
        if (this.selectedShift) {
            this.editShift(this.selectedShift);
            this.viewDialog = false;
        }
    }

    editShift(shift: Shift): void {
        this.shift = { ...shift };
        // Convert time format if needed (remove seconds for input[type=time])
        if (this.shift.start_time && this.shift.start_time.length > 5) {
            this.shift.start_time = this.shift.start_time.substring(0, 5);
        }
        if (this.shift.end_time && this.shift.end_time.length > 5) {
            this.shift.end_time = this.shift.end_time.substring(0, 5);
        }
        this.editMode = true;
        this.submitted = false;
        this.shiftDialog = true;
    }

    hideDialog(): void {
        this.shiftDialog = false;
        this.submitted = false;
    }

    saveShift(): void {
        this.submitted = true;

        if (!this.shift.name || !this.shift.start_time || !this.shift.end_time) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill all required fields'
            });
            return;
        }

        // Ensure time format includes seconds for backend
        const shiftData = {
            ...this.shift,
            start_time: this.shift.start_time!.length === 5 ? `${this.shift.start_time}:00` : this.shift.start_time,
            end_time: this.shift.end_time!.length === 5 ? `${this.shift.end_time}:00` : this.shift.end_time
        };

        if (this.editMode && this.shift.id) {
            // Update existing shift
            this.productionService.updateShift(this.shift.id, shiftData).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Shift updated successfully'
                    });
                    this.loadShifts();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.error?.detail || 'Failed to update shift'
                    });
                    console.error('Error updating shift:', error);
                }
            });
        } else {
            // Create new shift
            this.productionService.createShift(shiftData).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Shift created successfully'
                    });
                    this.loadShifts();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.error?.detail || error.error?.code?.[0] || 'Failed to create shift'
                    });
                    console.error('Error creating shift:', error);
                }
            });
        }
    }

    confirmDelete(shift: Shift): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the shift "${shift.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteShift(shift);
            }
        });
    }

    deleteShift(shift: Shift): void {
        this.productionService.deleteShift(shift.id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Shift deleted successfully'
                });

                // Clear production session from localStorage if it uses this shift
                this.clearProductionSessionIfUsingShift(shift.id);

                this.loadShifts();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.detail || 'Failed to delete shift. It may be in use.'
                });
                console.error('Error deleting shift:', error);
            }
        });
    }

    private clearProductionSessionIfUsingShift(shiftId: number): void {
        const SESSION_STORAGE_KEY = 'dms_production_session';
        try {
            const savedData = localStorage.getItem(SESSION_STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                // Check if the saved session uses this shift
                if (parsed?.session?.shift?.id === shiftId) {
                    localStorage.removeItem(SESSION_STORAGE_KEY);
                    console.log('Cleared production session because shift was deleted');
                }
            }
        } catch (error) {
            console.error('Error checking production session:', error);
        }
    }
}
