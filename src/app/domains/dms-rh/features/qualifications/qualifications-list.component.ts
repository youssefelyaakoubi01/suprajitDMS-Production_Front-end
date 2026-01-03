/**
 * Qualifications List Component
 * Domain: DMS-RH
 *
 * Manages employee qualifications and certifications
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
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';

import { HRService } from '@core/services/hr.service';
import { QualificationStateService } from '@core/state/qualification-state.service';
import { Qualification, Employee, Formation, Formateur } from '@core/models/employee.model';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-qualifications-list',
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
        AvatarModule,
        IconFieldModule,
        InputIconModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="qualifications-container">
            <p-card>
                <ng-template pTemplate="header">
                    <p-toolbar styleClass="border-none p-0">
                        <ng-template #start>
                            <h2 class="m-0 text-xl font-semibold">Qualifications Management</h2>
                        </ng-template>
                        <ng-template #center>
                            <p-iconfield iconPosition="left">
                                <p-inputicon styleClass="pi pi-search"></p-inputicon>
                                <input pInputText [(ngModel)]="searchTerm" placeholder="Search..." style="width: 250px" />
                            </p-iconfield>
                        </ng-template>
                        <ng-template #end>
                            <button pButton icon="pi pi-plus" label="Add Qualification"
                                    (click)="openNewQualificationDialog()"></button>
                        </ng-template>
                    </p-toolbar>
                </ng-template>

                <p-table [value]="qualifications()" [loading]="loading" [paginator]="true" [rows]="10"
                         [globalFilterFields]="['employee_name', 'formation_name']"
                         [rowHover]="true" dataKey="id">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Employee</th>
                            <th pSortableColumn="formation_name">Formation <p-sortIcon field="formation_name"></p-sortIcon></th>
                            <th pSortableColumn="start_date">Start Date <p-sortIcon field="start_date"></p-sortIcon></th>
                            <th pSortableColumn="end_date">End Date <p-sortIcon field="end_date"></p-sortIcon></th>
                            <th>Trainer</th>
                            <th pSortableColumn="test_result">Result <p-sortIcon field="test_result"></p-sortIcon></th>
                            <th style="width: 120px">Actions</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-qual>
                        <tr>
                            <td>
                                <div class="flex align-items-center gap-2">
                                    <p-avatar [image]="getEmployeePicture(qual.Employee?.Picture)"
                                              [label]="!qual.Employee?.Picture ? getInitials(qual.employee_name) : undefined"
                                              shape="circle" size="normal"></p-avatar>
                                    <span class="font-medium">{{ qual.employee_name }}</span>
                                </div>
                            </td>
                            <td><strong>{{ qual.formation_name }}</strong></td>
                            <td>{{ qual.start_date | date:'dd/MM/yyyy' }}</td>
                            <td>{{ qual.end_date | date:'dd/MM/yyyy' }}</td>
                            <td>{{ qual.TrainerName || '-' }}</td>
                            <td>
                                <p-tag [value]="getResultLabel(qual.test_result)"
                                       [severity]="getResultSeverity(qual.test_result)"></p-tag>
                            </td>
                            <td>
                                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm"
                                        (click)="editQualification(qual)" pTooltip="Edit"></button>
                                <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
                                        (click)="confirmDeleteQualification(qual)" pTooltip="Delete"></button>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="7" class="text-center p-4">
                                <i class="pi pi-verified text-4xl text-gray-300 mb-2"></i>
                                <p class="text-gray-500">No qualifications found</p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>
        </div>

        <!-- Qualification Dialog -->
        <p-dialog [(visible)]="showQualificationDialog" [header]="editingQualification ? 'Edit Qualification' : 'New Qualification'"
                  [modal]="true" [style]="{width: '550px'}">
            <form [formGroup]="qualificationForm" class="grid p-fluid">
                <div class="col-12">
                    <label>Employee *</label>
                    <p-select formControlName="employee" [options]="employees"
                              optionLabel="fullName" optionValue="Id_Emp" [filter]="true"
                              placeholder="Select employee"></p-select>
                </div>
                <div class="col-12">
                    <label>Formation *</label>
                    <p-select formControlName="formation" [options]="formations"
                              optionLabel="name" optionValue="id" [filter]="true"
                              placeholder="Select formation"></p-select>
                </div>
                <div class="col-6">
                    <label>Start Date *</label>
                    <p-datepicker formControlName="start_date" [showIcon]="true" dateFormat="dd/mm/yy"></p-datepicker>
                </div>
                <div class="col-6">
                    <label>End Date *</label>
                    <p-datepicker formControlName="end_date" [showIcon]="true" dateFormat="dd/mm/yy"></p-datepicker>
                </div>
                <div class="col-12">
                    <label>Trainer</label>
                    <p-select formControlName="trainer" [options]="formateurs"
                              optionLabel="name" optionValue="id" [filter]="true"
                              placeholder="Select trainer"></p-select>
                </div>
                <div class="col-12">
                    <label>Result *</label>
                    <p-select formControlName="test_result" [options]="resultOptions"
                              optionLabel="label" optionValue="value" placeholder="Select result"></p-select>
                </div>
            </form>
            <ng-template pTemplate="footer">
                <button pButton label="Cancel" icon="pi pi-times" class="p-button-text"
                        (click)="showQualificationDialog = false"></button>
                <button pButton label="Save" icon="pi pi-check"
                        (click)="saveQualification()" [disabled]="qualificationForm.invalid"></button>
            </ng-template>
        </p-dialog>

        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>
    `,
    styles: [`
        .qualifications-container { padding: 1rem; }
    `]
})
export class QualificationsListComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private qualificationState = inject(QualificationStateService);

    // Use signal from state service
    qualifications = this.qualificationState.qualifications;

    employees: any[] = [];
    formations: Formation[] = [];
    formateurs: Formateur[] = [];
    loading = false;
    searchTerm = '';

    showQualificationDialog = false;
    editingQualification: Qualification | null = null;
    qualificationForm!: FormGroup;

    resultOptions = [
        { label: 'Passed', value: 'Passed' },
        { label: 'Failed', value: 'Failed' },
        { label: 'Pending', value: 'Pending' },
        { label: 'In Progress', value: 'In Progress' }
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
        this.qualificationForm = this.fb.group({
            employee: [null, Validators.required],
            formation: [null, Validators.required],
            start_date: [null, Validators.required],
            end_date: [null, Validators.required],
            trainer: [null],
            test_result: ['Pending', Validators.required]
        });
    }

    loadData(): void {
        this.loading = true;
        forkJoin({
            qualifications: this.hrService.getQualifications().pipe(catchError(() => of([]))),
            employees: this.hrService.getEmployees().pipe(catchError(() => of([]))),
            formations: this.hrService.getFormations().pipe(catchError(() => of([]))),
            formateurs: this.hrService.getFormateurs().pipe(catchError(() => of([])))
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (data) => {
                this.employees = data.employees.map((e: Employee) => ({
                    ...e,
                    fullName: `${e.Prenom_Emp} ${e.Nom_Emp}`
                }));
                this.formations = data.formations;
                this.formateurs = data.formateurs;
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

    getResultLabel(result: string): string {
        return result || 'Pending';
    }

    getResultSeverity(result: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
        switch (result?.toLowerCase()) {
            case 'passed': return 'success';
            case 'failed': return 'danger';
            case 'in progress': return 'info';
            default: return 'warn';
        }
    }

    openNewQualificationDialog(): void {
        this.editingQualification = null;
        this.qualificationForm.reset({ test_result: 'Pending' });
        this.showQualificationDialog = true;
    }

    editQualification(qual: Qualification): void {
        this.editingQualification = qual;
        this.qualificationForm.patchValue({
            employee: qual.employee,
            formation: qual.formation,
            start_date: qual.start_date ? new Date(qual.start_date as string) : null,
            end_date: qual.end_date ? new Date(qual.end_date as string) : null,
            trainer: qual.trainer,
            test_result: qual.test_result
        });
        this.showQualificationDialog = true;
    }

    saveQualification(): void {
        if (this.qualificationForm.invalid) return;

        const formValue = this.qualificationForm.value;

        if (this.editingQualification) {
            this.hrService.updateQualification(this.editingQualification.id, formValue).subscribe({
                next: () => {
                    this.loadData();
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Qualification updated' });
                    this.showQualificationDialog = false;
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update' })
            });
        } else {
            this.hrService.createQualification(formValue).subscribe({
                next: () => {
                    this.loadData();
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Qualification created' });
                    this.showQualificationDialog = false;
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create' })
            });
        }
    }

    confirmDeleteQualification(qual: Qualification): void {
        this.confirmationService.confirm({
            message: `Delete qualification for ${qual.employee_name || 'this employee'}?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteQualification(qual.id).subscribe({
                    next: () => {
                        this.loadData();
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Qualification deleted' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete' })
                });
            }
        });
    }
}
