/**
 * Users List Component
 * Domain: DMS-RH
 *
 * Manages DMS users and their access permissions
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
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CardModule } from 'primeng/card';
import { MessageService, ConfirmationService } from 'primeng/api';

import { HRService } from '@core/services/hr.service';
import { DMSUser, DMSUserCreate } from '@core/models/employee.model';

@Component({
    selector: 'app-users-list',
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
        CheckboxModule,
        ToastModule,
        ConfirmDialogModule,
        ToolbarModule,
        IconFieldModule,
        InputIconModule,
        CardModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="users-container">
            <p-card>
                <ng-template pTemplate="header">
                    <p-toolbar styleClass="border-none p-0">
                        <ng-template #start>
                            <h2 class="m-0 text-xl font-semibold">Users & Access Management</h2>
                        </ng-template>
                        <ng-template #end>
                            <p-iconfield iconPosition="left" class="mr-2">
                                <p-inputicon styleClass="pi pi-search"></p-inputicon>
                                <input pInputText [(ngModel)]="searchTerm" placeholder="Search users..." />
                            </p-iconfield>
                            <button pButton icon="pi pi-plus" label="Add User"
                                    (click)="openNewUserDialog()"></button>
                        </ng-template>
                    </p-toolbar>
                </ng-template>

                <p-table [value]="users" [loading]="loading" [paginator]="true" [rows]="10"
                         [globalFilterFields]="['login', 'name', 'employee_name']"
                         [rowHover]="true" dataKey="id">
                    <ng-template pTemplate="header">
                        <tr>
                            <th pSortableColumn="login">Login <p-sortIcon field="login"></p-sortIcon></th>
                            <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
                            <th>Employee</th>
                            <th>Position</th>
                            <th>Department</th>
                            <th>Modules Access</th>
                            <th pSortableColumn="status">Status <p-sortIcon field="status"></p-sortIcon></th>
                            <th style="width: 120px">Actions</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-user>
                        <tr>
                            <td><strong>{{ user.login }}</strong></td>
                            <td>{{ user.name }}</td>
                            <td>{{ user.employee_name || '-' }}</td>
                            <td>{{ getPositionLabel(user.position) }}</td>
                            <td>{{ user.department_name || '-' }}</td>
                            <td>
                                <div class="flex flex-wrap gap-1">
                                    <p-tag *ngIf="user.dms_production" value="Prod" severity="info" [rounded]="true"></p-tag>
                                    <p-tag *ngIf="user.dms_hr" value="HR" severity="success" [rounded]="true"></p-tag>
                                    <p-tag *ngIf="user.dms_maintenance" value="Maint" severity="warn" [rounded]="true"></p-tag>
                                    <p-tag *ngIf="user.dms_quality" value="Quality" severity="secondary" [rounded]="true"></p-tag>
                                </div>
                            </td>
                            <td>
                                <p-tag [value]="getStatusLabel(user.status)"
                                       [severity]="getStatusSeverity(user.status)"></p-tag>
                            </td>
                            <td>
                                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm"
                                        (click)="editUser(user)" pTooltip="Edit"></button>
                                <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
                                        (click)="confirmDeleteUser(user)" pTooltip="Delete"></button>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="8" class="text-center p-4">
                                <i class="pi pi-users text-4xl text-gray-300 mb-2"></i>
                                <p class="text-gray-500">No users found</p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>
        </div>

        <!-- User Dialog -->
        <p-dialog [(visible)]="showUserDialog" [header]="editingUser ? 'Edit User' : 'New User'"
                  [modal]="true" [style]="{width: '600px'}">
            <form [formGroup]="userForm" class="grid p-fluid">
                <div class="col-6">
                    <label>Name *</label>
                    <input pInputText formControlName="name" />
                </div>
                <div class="col-6">
                    <label>Login *</label>
                    <input pInputText formControlName="login" />
                </div>
                <div class="col-6">
                    <label>Position</label>
                    <p-select formControlName="position" [options]="positions"
                              optionLabel="label" optionValue="value" placeholder="Select position"></p-select>
                </div>
                <div class="col-6">
                    <label>Department</label>
                    <p-select formControlName="department" [options]="departments"
                              optionLabel="name" optionValue="id" placeholder="Select department"></p-select>
                </div>
                <div class="col-6">
                    <label>Status</label>
                    <p-select formControlName="status" [options]="statuses"
                              optionLabel="label" optionValue="value"></p-select>
                </div>
                <div class="col-6" *ngIf="!editingUser">
                    <label>Password *</label>
                    <input pInputText formControlName="password" type="password" />
                </div>
                <div class="col-12">
                    <label class="font-semibold mb-2 block">Module Access</label>
                    <div class="flex flex-wrap gap-3">
                        <p-checkbox formControlName="dms_production" [binary]="true" label="Production"></p-checkbox>
                        <p-checkbox formControlName="dms_hr" [binary]="true" label="HR"></p-checkbox>
                        <p-checkbox formControlName="dms_maintenance" [binary]="true" label="Maintenance"></p-checkbox>
                        <p-checkbox formControlName="dms_quality" [binary]="true" label="Quality"></p-checkbox>
                        <p-checkbox formControlName="dms_kpi" [binary]="true" label="KPI"></p-checkbox>
                        <p-checkbox formControlName="dms_ll" [binary]="true" label="Lessons Learned"></p-checkbox>
                    </div>
                </div>
            </form>
            <ng-template pTemplate="footer">
                <button pButton label="Cancel" icon="pi pi-times" class="p-button-text"
                        (click)="showUserDialog = false"></button>
                <button pButton label="Save" icon="pi pi-check"
                        (click)="saveUser()" [disabled]="userForm.invalid"></button>
            </ng-template>
        </p-dialog>

        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>
    `,
    styles: [`
        .users-container {
            padding: 1rem;
        }
    `]
})
export class UsersListComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    users: DMSUser[] = [];
    departments: any[] = [];
    loading = false;
    searchTerm = '';

    showUserDialog = false;
    editingUser: DMSUser | null = null;
    userForm!: FormGroup;

    positions = [
        { label: 'Administrator', value: 'admin' },
        { label: 'HR Manager', value: 'rh_manager' },
        { label: 'Supervisor', value: 'supervisor' },
        { label: 'Team Leader', value: 'team_leader' },
        { label: 'Operator', value: 'operator' },
        { label: 'Trainer', value: 'formateur' }
    ];

    statuses = [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Suspended', value: 'suspended' }
    ];

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
        this.userForm = this.fb.group({
            name: ['', Validators.required],
            login: ['', Validators.required],
            password: [''],
            position: ['operator'],
            department: [null],
            status: ['active'],
            dms_production: [false],
            dms_hr: [false],
            dms_maintenance: [false],
            dms_quality: [false],
            dms_kpi: [false],
            dms_ll: [false]
        });
    }

    loadData(): void {
        this.loading = true;
        forkJoin({
            users: this.hrService.getUsers().pipe(catchError(() => of([]))),
            departments: this.hrService.getDepartmentEntities().pipe(catchError(() => of([])))
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (data) => {
                this.users = data.users;
                this.departments = data.departments;
                this.loading = false;
            }
        });
    }

    getPositionLabel(position: string): string {
        const found = this.positions.find(p => p.value === position);
        return found ? found.label : position || '-';
    }

    getStatusLabel(status: string): string {
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }

    getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'secondary';
            case 'suspended': return 'danger';
            default: return 'secondary';
        }
    }

    openNewUserDialog(): void {
        this.editingUser = null;
        this.userForm.reset({
            position: 'operator',
            status: 'active',
            dms_production: false,
            dms_hr: false,
            dms_maintenance: false,
            dms_quality: false,
            dms_kpi: false,
            dms_ll: false
        });
        this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.userForm.get('password')?.updateValueAndValidity();
        this.showUserDialog = true;
    }

    editUser(user: DMSUser): void {
        this.editingUser = user;
        this.userForm.patchValue({
            name: user.name,
            login: user.login,
            position: user.position,
            department: user.department,
            status: user.status,
            dms_production: user.dms_production,
            dms_hr: user.dms_hr,
            dms_maintenance: user.dms_maintenance,
            dms_quality: user.dms_quality,
            dms_kpi: user.dms_kpi,
            dms_ll: user.dms_ll
        });
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();
        this.showUserDialog = true;
    }

    saveUser(): void {
        if (this.userForm.invalid) return;

        const formValue = this.userForm.value;

        if (this.editingUser) {
            this.hrService.updateUser(this.editingUser.id, formValue).subscribe({
                next: (updated) => {
                    const index = this.users.findIndex(u => u.id === updated.id);
                    if (index > -1) this.users[index] = updated;
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User updated' });
                    this.showUserDialog = false;
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update user' })
            });
        } else {
            this.hrService.createUser(formValue as DMSUserCreate).subscribe({
                next: (newUser) => {
                    this.users.push(newUser);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User created' });
                    this.showUserDialog = false;
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create user' })
            });
        }
    }

    confirmDeleteUser(user: DMSUser): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete user "${user.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteUser(user.id).subscribe({
                    next: () => {
                        this.users = this.users.filter(u => u.id !== user.id);
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User deleted' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete user' })
                });
            }
        });
    }
}
