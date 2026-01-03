/**
 * Affectations Component
 * Domain: DMS-RH
 *
 * Manages employee-workstation assignments
 */
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';

import { HRService } from '@core/services/hr.service';
import { AssignmentStateService } from '@core/state/assignment-state.service';
import { EmployeeWorkstationAssignment, AssignmentCreateRequest } from '../../models/assignment.model';
import { Employee, HRWorkstation } from '@core/models/employee.model';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-affectations',
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
        ToastModule,
        ConfirmDialogModule,
        ToolbarModule,
        CardModule,
        AvatarModule,
        CheckboxModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="affectations-container">
            <p-card>
                <ng-template pTemplate="header">
                    <p-toolbar styleClass="border-none p-0">
                        <ng-template #start>
                            <h2 class="m-0 text-xl font-semibold">Workstation Assignments</h2>
                        </ng-template>
                        <ng-template #end>
                            <button pButton icon="pi pi-plus" label="New Assignment"
                                    (click)="openNewAssignmentDialog()"></button>
                        </ng-template>
                    </p-toolbar>
                </ng-template>

                <p-table [value]="assignments()" [loading]="loading" [paginator]="true" [rows]="10"
                         [rowHover]="true" dataKey="id">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Employee</th>
                            <th pSortableColumn="workstation_name">Workstation <p-sortIcon field="workstation_name"></p-sortIcon></th>
                            <th>Process</th>
                            <th>Primary</th>
                            <th pSortableColumn="assigned_date">Assigned Date <p-sortIcon field="assigned_date"></p-sortIcon></th>
                            <th>Status</th>
                            <th style="width: 120px">Actions</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-assignment>
                        <tr>
                            <td>
                                <div class="flex align-items-center gap-2">
                                    <p-avatar [image]="getEmployeePicture(assignment.employee_picture)"
                                              [label]="!assignment.employee_picture ? getInitials(assignment.employee_name) : undefined"
                                              shape="circle" size="normal"></p-avatar>
                                    <span class="font-medium">{{ assignment.employee_name }}</span>
                                </div>
                            </td>
                            <td><strong>{{ assignment.workstation_name }}</strong></td>
                            <td>{{ assignment.process_name || '-' }}</td>
                            <td>
                                <i [class]="assignment.is_primary ? 'pi pi-star-fill text-yellow-500' : 'pi pi-star text-gray-300'"></i>
                            </td>
                            <td>{{ assignment.assigned_date | date:'dd/MM/yyyy' }}</td>
                            <td>
                                <p-tag [value]="assignment.is_active ? 'Active' : 'Inactive'"
                                       [severity]="assignment.is_active ? 'success' : 'secondary'"></p-tag>
                            </td>
                            <td>
                                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm"
                                        (click)="editAssignment(assignment)" pTooltip="Edit"></button>
                                <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
                                        (click)="confirmDeleteAssignment(assignment)" pTooltip="Delete"></button>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="7" class="text-center p-4">
                                <i class="pi pi-link text-4xl text-gray-300 mb-2"></i>
                                <p class="text-gray-500">No assignments found</p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>
        </div>

        <!-- Assignment Dialog -->
        <p-dialog [(visible)]="showAssignmentDialog" [header]="editingAssignment ? 'Edit Assignment' : 'New Assignment'"
                  [modal]="true" [style]="{width: '500px'}">
            <form [formGroup]="assignmentForm" class="grid p-fluid">
                <div class="col-12">
                    <label>Employee *</label>
                    <p-select formControlName="employee" [options]="employees"
                              optionLabel="fullName" optionValue="Id_Emp" [filter]="true"
                              placeholder="Select employee"></p-select>
                </div>
                <div class="col-12">
                    <label>Workstation *</label>
                    <p-select formControlName="workstation" [options]="workstations"
                              optionLabel="name" optionValue="id" [filter]="true"
                              placeholder="Select workstation"></p-select>
                </div>
                <div class="col-12">
                    <p-checkbox formControlName="is_primary" [binary]="true" label="Primary workstation"></p-checkbox>
                </div>
            </form>
            <ng-template pTemplate="footer">
                <button pButton label="Cancel" icon="pi pi-times" class="p-button-text"
                        (click)="showAssignmentDialog = false"></button>
                <button pButton label="Save" icon="pi pi-check"
                        (click)="saveAssignment()" [disabled]="assignmentForm.invalid"></button>
            </ng-template>
        </p-dialog>

        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>
    `,
    styles: [`
        .affectations-container { padding: 1rem; }
    `]
})
export class AffectationsComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private assignmentState = inject(AssignmentStateService);

    // Use signal from state service
    assignments = this.assignmentState.assignments;

    employees: any[] = [];
    workstations: HRWorkstation[] = [];
    loading = false;

    showAssignmentDialog = false;
    editingAssignment: EmployeeWorkstationAssignment | null = null;
    assignmentForm!: FormGroup;

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
        this.assignmentForm = this.fb.group({
            employee: [null, Validators.required],
            workstation: [null, Validators.required],
            is_primary: [false]
        });
    }

    loadData(): void {
        this.loading = true;
        forkJoin({
            assignments: this.hrService.getWorkstationAssignments().pipe(catchError(() => of([]))),
            employees: this.hrService.getEmployees().pipe(catchError(() => of([]))),
            workstations: this.hrService.getWorkstations().pipe(catchError(() => of([])))
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (data) => {
                this.employees = data.employees.map((e: Employee) => ({
                    ...e,
                    fullName: `${e.Prenom_Emp} ${e.Nom_Emp}`
                }));
                this.workstations = data.workstations;
                this.loading = false;
            }
        });
    }

    getEmployeePicture(picture: string | null | undefined): string | undefined {
        if (!picture) return undefined;
        if (picture.startsWith('http') || picture.startsWith('assets/')) return picture;
        return `${environment.mediaUrl}${picture}`;
    }

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    openNewAssignmentDialog(): void {
        this.editingAssignment = null;
        this.assignmentForm.reset({ is_primary: false });
        this.showAssignmentDialog = true;
    }

    editAssignment(assignment: EmployeeWorkstationAssignment): void {
        this.editingAssignment = assignment;
        this.assignmentForm.patchValue({
            employee: assignment.employee,
            workstation: assignment.workstation,
            is_primary: assignment.is_primary
        });
        this.showAssignmentDialog = true;
    }

    saveAssignment(): void {
        if (this.assignmentForm.invalid) return;

        const formValue = this.assignmentForm.value as AssignmentCreateRequest;

        if (this.editingAssignment) {
            this.hrService.updateWorkstationAssignment(this.editingAssignment.id, formValue).subscribe({
                next: () => {
                    this.loadData();
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Assignment updated' });
                    this.showAssignmentDialog = false;
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update' })
            });
        } else {
            this.hrService.createWorkstationAssignment(formValue).subscribe({
                next: () => {
                    this.loadData();
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Assignment created' });
                    this.showAssignmentDialog = false;
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create' })
            });
        }
    }

    confirmDeleteAssignment(assignment: EmployeeWorkstationAssignment): void {
        this.confirmationService.confirm({
            message: `Remove ${assignment.employee_name} from ${assignment.workstation_name}?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteWorkstationAssignment(assignment.id).subscribe({
                    next: () => {
                        this.loadData();
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Assignment removed' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete' })
                });
            }
        });
    }
}
