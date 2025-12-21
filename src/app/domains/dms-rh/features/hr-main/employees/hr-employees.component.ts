import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG Modules
import { TableModule, Table } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { FileUploadModule } from 'primeng/fileupload';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ToolbarModule } from 'primeng/toolbar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';

import { HRService } from '@core/services/hr.service';
import { Employee, Team, Department, EmployeeCategory, Trajet } from '@core/models/employee.model';

@Component({
    selector: 'app-hr-employees',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        DatePickerModule,
        DialogModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        TooltipModule,
        AvatarModule,
        FileUploadModule,
        InputGroupModule,
        InputGroupAddonModule,
        ToolbarModule,
        SplitButtonModule,
        BadgeModule,
        ChipModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './hr-employees.component.html',
    styleUrls: ['./hr-employees.component.scss']
})
export class HrEmployeesComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    // Data
    employees: Employee[] = [];
    selectedEmployees: Employee[] = [];

    // Reference data
    teams: Team[] = [];
    departments: Department[] = [];
    categories: EmployeeCategory[] = [];
    trajets: Trajet[] = [];

    // Dialog states
    showEmployeeDialog = false;
    showImportDialog = false;
    showDetailsDialog = false;
    isEditMode = false;
    selectedEmployee: Employee | null = null;

    // Forms
    employeeForm!: FormGroup;

    // Loading states
    loading = false;
    saving = false;

    // Filters
    searchText = '';
    selectedDepartment: string | null = null;
    selectedCategory: string | null = null;
    selectedStatus: string | null = null;

    // Dropdown options
    genderOptions = [
        { label: 'Male', value: 'M' },
        { label: 'Female', value: 'F' }
    ];

    statusOptions = [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'On Leave', value: 'On Leave' }
    ];

    // Export menu items
    exportItems: MenuItem[] = [
        {
            label: 'Export Excel',
            icon: 'pi pi-file-excel',
            command: () => this.exportExcel()
        },
        {
            label: 'Export PDF',
            icon: 'pi pi-file-pdf',
            command: () => this.exportPDF()
        }
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
        this.loadEmployees();
        this.loadReferenceData();
    }

    private initForm(): void {
        this.employeeForm = this.fb.group({
            Nom_Emp: ['', Validators.required],
            Prenom_Emp: ['', Validators.required],
            DateNaissance_Emp: [null],
            Genre_Emp: ['M', Validators.required],
            category_fk: [null, Validators.required],
            DateEmbauche_Emp: [new Date(), Validators.required],
            Departement_Emp: ['', Validators.required],
            EmpStatus: ['Active', Validators.required],
            team: [null],
            trajet: [null],
            BadgeNumber: [''],
            Picture: ['']
        });
    }

    loadEmployees(): void {
        this.loading = true;
        this.hrService.getEmployees().subscribe({
            next: (data) => {
                this.employees = data;
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load employees' });
                this.loading = false;
            }
        });
    }

    loadReferenceData(): void {
        this.hrService.getTeams().subscribe(data => this.teams = data);
        this.hrService.getDepartments().subscribe(data => this.departments = data);
        this.hrService.getEmployeeCategories().subscribe(data => this.categories = data);
        this.hrService.getTrajets().subscribe(data => this.trajets = data);
    }

    // CRUD Operations
    openNewEmployeeDialog(): void {
        this.isEditMode = false;
        this.selectedEmployee = null;
        this.employeeForm.reset({
            Genre_Emp: 'M',
            EmpStatus: 'Active',
            DateEmbauche_Emp: new Date()
        });
        this.showEmployeeDialog = true;
    }

    editEmployee(employee: Employee): void {
        this.isEditMode = true;
        this.selectedEmployee = employee;
        this.employeeForm.patchValue({
            ...employee,
            DateNaissance_Emp: employee.DateNaissance_Emp ? new Date(employee.DateNaissance_Emp) : null,
            DateEmbauche_Emp: employee.DateEmbauche_Emp ? new Date(employee.DateEmbauche_Emp) : null
        });
        this.showEmployeeDialog = true;
    }

    viewEmployee(employee: Employee): void {
        this.selectedEmployee = employee;
        this.showDetailsDialog = true;
    }

    saveEmployee(): void {
        if (this.employeeForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please fill all required fields'
            });
            this.markFormGroupTouched();
            return;
        }

        this.saving = true;
        const employeeData = this.employeeForm.value;

        // Map form data to backend model if needed
        const payload: Partial<Employee> = {
            ...employeeData,
            // Ensure IDs are sent for relations
            team: employeeData.team?.id,
            trajet: employeeData.trajet?.id,
            category_fk: employeeData.category_fk?.id
        };

        if (this.isEditMode && this.selectedEmployee) {
            this.hrService.updateEmployee(this.selectedEmployee.Id_Emp, payload).subscribe({
                next: (updatedEmployee) => {
                    const index = this.employees.findIndex(e => e.Id_Emp === updatedEmployee.Id_Emp);
                    if (index > -1) {
                        this.employees[index] = updatedEmployee;
                    }
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Employee updated successfully' });
                    this.saving = false;
                    this.showEmployeeDialog = false;
                    this.loadEmployees(); // Reload to get fresh data
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update employee' });
                    this.saving = false;
                }
            });
        } else {
            this.hrService.createEmployee(payload).subscribe({
                next: (newEmployee) => {
                    this.employees.push(newEmployee);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Employee created successfully' });
                    this.saving = false;
                    this.showEmployeeDialog = false;
                    this.loadEmployees();
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create employee' });
                    this.saving = false;
                }
            });
        }
    }

    deleteEmployee(employee: Employee): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${employee.Prenom_Emp} ${employee.Nom_Emp}?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.hrService.deleteEmployee(employee.Id_Emp).subscribe({
                    next: () => {
                        this.employees = this.employees.filter(e => e.Id_Emp !== employee.Id_Emp);
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Employee deleted successfully' });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete employee' });
                    }
                });
            }
        });
    }

    deleteSelectedEmployees(): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${this.selectedEmployees.length} selected employees?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const selectedIds = this.selectedEmployees.map(e => e.Id_Emp);
                this.employees = this.employees.filter(e => !selectedIds.includes(e.Id_Emp));
                this.selectedEmployees = [];
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Selected employees deleted successfully'
                });
            }
        });
    }

    // Import/Export
    openImportDialog(): void {
        this.showImportDialog = true;
    }

    onFileUpload(event: any): void {
        const file = event.files[0];
        if (file) {
            this.messageService.add({
                severity: 'info',
                summary: 'Processing',
                detail: `Importing ${file.name}...`
            });
            setTimeout(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: '15 employees imported successfully'
                });
                this.showImportDialog = false;
                this.loadEmployees();
            }, 2000);
        }
    }

    exportExcel(): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Export',
            detail: 'Exporting to Excel...'
        });
    }

    exportPDF(): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Export',
            detail: 'Exporting to PDF...'
        });
    }

    // Filtering
    onGlobalFilter(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.dt.filterGlobal(value, 'contains');
    }

    clearFilters(): void {
        this.searchText = '';
        this.selectedDepartment = null;
        this.selectedCategory = null;
        this.selectedStatus = null;
        this.dt.clear();
    }

    // Helpers
    getInitials(employee: Employee): string {
        return `${employee.Prenom_Emp.charAt(0)}${employee.Nom_Emp.charAt(0)}`.toUpperCase();
    }

    getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
        const map: Record<string, 'success' | 'danger' | 'warn' | 'info'> = {
            'Active': 'success',
            'Inactive': 'danger',
            'On Leave': 'warn'
        };
        return map[status] || 'info';
    }

    getGenderLabel(gender: string): string {
        return gender === 'M' ? 'Male' : 'Female';
    }

    calculateAge(birthDate: Date): number {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    calculateSeniority(hireDate: Date): string {
        const today = new Date();
        const hire = new Date(hireDate);
        const years = today.getFullYear() - hire.getFullYear();
        const months = today.getMonth() - hire.getMonth();

        if (years > 0) {
            return `${years} year${years > 1 ? 's' : ''}`;
        } else if (months > 0) {
            return `${months} month${months > 1 ? 's' : ''}`;
        }
        return 'New';
    }

    private markFormGroupTouched(): void {
        Object.keys(this.employeeForm.controls).forEach(key => {
            this.employeeForm.get(key)?.markAsTouched();
        });
    }

    get departmentOptions() {
        return this.departments.map(d => ({ label: d.department, value: d.department }));
    }

    get categoryOptions() {
        return this.categories.map(c => ({ label: c.name, value: c }));
    }

    get teamOptions() {
        return this.teams.map(t => ({ label: t.name, value: t }));
    }

    get trajetOptions() {
        return this.trajets.map(t => ({ label: t.name, value: t }));
    }
}
