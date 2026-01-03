/**
 * Licenses Manager Component
 * Domain: DMS-RH
 *
 * Manages employee licenses and certifications
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

// PrimeNG
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { MessageService, ConfirmationService } from 'primeng/api';

import { HRService } from '@core/services/hr.service';
import { License, LicenseType, LicenseCreate, LicenseStats, Employee } from '@core/models/employee.model';

@Component({
    selector: 'app-licenses-manager',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        InputTextModule,
        ButtonModule,
        TagModule,
        TooltipModule,
        DialogModule,
        SelectModule,
        DatePickerModule,
        ToastModule,
        ConfirmDialogModule,
        ToolbarModule,
        CardModule,
        ChartModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="licenses-container">
            <!-- Stats Cards -->
            <div class="grid mb-4" *ngIf="stats">
                <div class="col-12 md:col-3">
                    <p-card styleClass="h-full">
                        <div class="flex justify-content-between align-items-center">
                            <div>
                                <p class="text-gray-500 m-0 text-sm">Total Licenses</p>
                                <p class="text-2xl font-bold m-0">{{ stats.total }}</p>
                            </div>
                            <div class="bg-blue-100 p-3 border-circle">
                                <i class="pi pi-id-card text-blue-500 text-xl"></i>
                            </div>
                        </div>
                    </p-card>
                </div>
                <div class="col-12 md:col-3">
                    <p-card styleClass="h-full">
                        <div class="flex justify-content-between align-items-center">
                            <div>
                                <p class="text-gray-500 m-0 text-sm">Active</p>
                                <p class="text-2xl font-bold text-green-500 m-0">{{ stats.active }}</p>
                            </div>
                            <div class="bg-green-100 p-3 border-circle">
                                <i class="pi pi-check-circle text-green-500 text-xl"></i>
                            </div>
                        </div>
                    </p-card>
                </div>
                <div class="col-12 md:col-3">
                    <p-card styleClass="h-full">
                        <div class="flex justify-content-between align-items-center">
                            <div>
                                <p class="text-gray-500 m-0 text-sm">Expiring Soon</p>
                                <p class="text-2xl font-bold text-orange-500 m-0">{{ stats.expiring_soon }}</p>
                            </div>
                            <div class="bg-orange-100 p-3 border-circle">
                                <i class="pi pi-clock text-orange-500 text-xl"></i>
                            </div>
                        </div>
                    </p-card>
                </div>
                <div class="col-12 md:col-3">
                    <p-card styleClass="h-full">
                        <div class="flex justify-content-between align-items-center">
                            <div>
                                <p class="text-gray-500 m-0 text-sm">Expired</p>
                                <p class="text-2xl font-bold text-red-500 m-0">{{ stats.expired }}</p>
                            </div>
                            <div class="bg-red-100 p-3 border-circle">
                                <i class="pi pi-exclamation-triangle text-red-500 text-xl"></i>
                            </div>
                        </div>
                    </p-card>
                </div>
            </div>

            <!-- Licenses Table -->
            <p-card>
                <ng-template pTemplate="header">
                    <p-toolbar styleClass="border-none p-0">
                        <ng-template #start>
                            <h2 class="m-0 text-xl font-semibold">Licenses Manager</h2>
                        </ng-template>
                        <ng-template #end>
                            <button pButton icon="pi pi-plus" label="Add License"
                                    (click)="openNewLicenseDialog()"></button>
                        </ng-template>
                    </p-toolbar>
                </ng-template>

                <p-table [value]="licenses" [loading]="loading" [paginator]="true" [rows]="10"
                         [rowHover]="true" dataKey="id">
                    <ng-template pTemplate="header">
                        <tr>
                            <th pSortableColumn="employee_name">Employee <p-sortIcon field="employee_name"></p-sortIcon></th>
                            <th pSortableColumn="license_type_name">License Type <p-sortIcon field="license_type_name"></p-sortIcon></th>
                            <th>License Number</th>
                            <th pSortableColumn="issue_date">Issue Date <p-sortIcon field="issue_date"></p-sortIcon></th>
                            <th pSortableColumn="expiry_date">Expiry Date <p-sortIcon field="expiry_date"></p-sortIcon></th>
                            <th>Status</th>
                            <th style="width: 120px">Actions</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-license>
                        <tr>
                            <td><strong>{{ license.employee_name }}</strong></td>
                            <td>{{ license.license_type_name }}</td>
                            <td>{{ license.license_number || '-' }}</td>
                            <td>{{ license.issue_date | date:'dd/MM/yyyy' }}</td>
                            <td>{{ license.expiry_date | date:'dd/MM/yyyy' }}</td>
                            <td>
                                <p-tag [value]="getLicenseStatus(license).label"
                                       [severity]="getLicenseStatus(license).severity"></p-tag>
                            </td>
                            <td>
                                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm"
                                        (click)="editLicense(license)" pTooltip="Edit"></button>
                                <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
                                        (click)="confirmDeleteLicense(license)" pTooltip="Delete"></button>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="7" class="text-center p-4">
                                <i class="pi pi-id-card text-4xl text-gray-300 mb-2"></i>
                                <p class="text-gray-500">No licenses found</p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>
        </div>

        <!-- License Dialog -->
        <p-dialog [(visible)]="showLicenseDialog" [header]="editingLicense ? 'Edit License' : 'New License'"
                  [modal]="true" [style]="{width: '500px'}">
            <form [formGroup]="licenseForm" class="grid p-fluid">
                <div class="col-12">
                    <label>Employee *</label>
                    <p-select formControlName="employee" [options]="employees"
                              optionLabel="fullName" optionValue="Id_Emp" [filter]="true"
                              placeholder="Select employee"></p-select>
                </div>
                <div class="col-12">
                    <label>License Type *</label>
                    <p-select formControlName="license_type" [options]="licenseTypes"
                              optionLabel="name" optionValue="id" placeholder="Select type"></p-select>
                </div>
                <div class="col-12">
                    <label>License Number</label>
                    <input pInputText formControlName="license_number" />
                </div>
                <div class="col-6">
                    <label>Issue Date *</label>
                    <p-datepicker formControlName="issue_date" [showIcon]="true" dateFormat="dd/mm/yy"></p-datepicker>
                </div>
                <div class="col-6">
                    <label>Expiry Date *</label>
                    <p-datepicker formControlName="expiry_date" [showIcon]="true" dateFormat="dd/mm/yy"></p-datepicker>
                </div>
            </form>
            <ng-template pTemplate="footer">
                <button pButton label="Cancel" icon="pi pi-times" class="p-button-text"
                        (click)="showLicenseDialog = false"></button>
                <button pButton label="Save" icon="pi pi-check"
                        (click)="saveLicense()" [disabled]="licenseForm.invalid"></button>
            </ng-template>
        </p-dialog>

        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>
    `,
    styles: [`
        .licenses-container { padding: 1rem; }
    `]
})
export class LicensesManagerComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    licenses: License[] = [];
    licenseTypes: LicenseType[] = [];
    employees: any[] = [];
    stats: LicenseStats | null = null;
    loading = false;

    showLicenseDialog = false;
    editingLicense: License | null = null;
    licenseForm!: FormGroup;

    constructor(
        private hrService: HRService,
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initForm(): void {
        this.licenseForm = this.fb.group({
            employee: [null, Validators.required],
            license_type: [null, Validators.required],
            license_number: [''],
            issue_date: [null, Validators.required],
            expiry_date: [null, Validators.required]
        });
    }

    loadData(): void {
        this.loading = true;
        forkJoin({
            licenses: this.hrService.getLicenses().pipe(catchError(() => of([]))),
            licenseTypes: this.hrService.getLicenseTypes().pipe(catchError(() => of([]))),
            stats: this.hrService.getLicenseStats().pipe(catchError(() => of(null))),
            employees: this.hrService.getEmployees().pipe(catchError(() => of([])))
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (data) => {
                this.licenses = data.licenses;
                this.licenseTypes = data.licenseTypes;
                this.stats = data.stats;
                this.employees = data.employees.map((e: Employee) => ({
                    ...e,
                    fullName: `${e.Prenom_Emp} ${e.Nom_Emp}`
                }));
                this.loading = false;
            }
        });
    }

    getLicenseStatus(license: License): { label: string; severity: 'success' | 'warn' | 'danger' } {
        if (!license.expiry_date) return { label: 'No Expiry', severity: 'success' };

        const expiry = new Date(license.expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) return { label: 'Expired', severity: 'danger' };
        if (daysUntilExpiry <= 30) return { label: 'Expiring Soon', severity: 'warn' };
        return { label: 'Valid', severity: 'success' };
    }

    openNewLicenseDialog(): void {
        this.editingLicense = null;
        this.licenseForm.reset();
        this.showLicenseDialog = true;
    }

    editLicense(license: License): void {
        this.editingLicense = license;
        this.licenseForm.patchValue({
            employee: license.employee,
            license_type: license.license_type,
            license_number: license.license_number,
            issue_date: license.issue_date ? new Date(license.issue_date) : null,
            expiry_date: license.expiry_date ? new Date(license.expiry_date) : null
        });
        this.showLicenseDialog = true;
    }

    saveLicense(): void {
        if (this.licenseForm.invalid) return;

        const formValue = this.licenseForm.value;

        if (this.editingLicense) {
            this.hrService.updateLicense(this.editingLicense.id, formValue).subscribe({
                next: () => {
                    this.loadData();
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'License updated' });
                    this.showLicenseDialog = false;
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update license' })
            });
        } else {
            this.hrService.createLicense(formValue as LicenseCreate).subscribe({
                next: () => {
                    this.loadData();
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'License created' });
                    this.showLicenseDialog = false;
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create license' })
            });
        }
    }

    confirmDeleteLicense(license: License): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete this license?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteLicense(license.id).subscribe({
                    next: () => {
                        this.loadData();
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'License deleted' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete license' })
                });
            }
        });
    }
}
