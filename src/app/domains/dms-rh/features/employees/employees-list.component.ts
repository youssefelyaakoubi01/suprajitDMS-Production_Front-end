/**
 * Employees List Component
 * Domain: DMS-RH
 *
 * Displays and manages the employee directory
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// PrimeNG
import { TableModule, Table } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';
import { MessageService, MenuItem } from 'primeng/api';

// Domain imports
import { DmsEmployeeService, DmsExportService, Employee, Department, EmployeeCategory } from '@domains/dms-rh';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-employees-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        InputTextModule,
        ButtonModule,
        TagModule,
        AvatarModule,
        SelectModule,
        ToolbarModule,
        IconFieldModule,
        InputIconModule,
        TooltipModule,
        SkeletonModule,
        SelectButtonModule,
        ToastModule,
        MenuModule
    ],
    providers: [MessageService],
    template: `
        <div class="employees-list">
            <!-- Filter Toolbar -->
            <p-toolbar styleClass="mb-3 surface-ground border-round">
                <ng-template #start>
                    <p-iconfield iconPosition="left" class="toolbar-search">
                        <p-inputicon styleClass="pi pi-search"></p-inputicon>
                        <input pInputText [(ngModel)]="searchTerm"
                               (ngModelChange)="onSearchChange($event)"
                               placeholder="Search employees..."
                               style="width: 280px" />
                    </p-iconfield>
                </ng-template>

                <ng-template #center>
                    <p-selectbutton [options]="quickFilterOptions"
                                    [(ngModel)]="selectedQuickFilter"
                                    (onChange)="onQuickFilterChange($event)"
                                    optionLabel="label"
                                    optionValue="value">
                    </p-selectbutton>
                </ng-template>

                <ng-template #end>
                    <p-select [options]="departments"
                              [(ngModel)]="selectedDepartment"
                              (onChange)="onFilterChange()"
                              placeholder="Department"
                              optionLabel="department"
                              optionValue="department"
                              [showClear]="true"
                              styleClass="mr-2">
                    </p-select>
                    <p-select [options]="categories"
                              [(ngModel)]="selectedCategory"
                              (onChange)="onFilterChange()"
                              placeholder="Category"
                              optionLabel="name"
                              optionValue="name"
                              [showClear]="true"
                              styleClass="mr-2">
                    </p-select>
                    <p-menu #exportMenu [model]="exportMenuItems" [popup]="true"></p-menu>
                    <p-button icon="pi pi-download"
                              label="Export"
                              severity="success"
                              [outlined]="true"
                              (onClick)="exportMenu.toggle($event)"
                              pTooltip="Export data">
                    </p-button>
                </ng-template>
            </p-toolbar>

            <!-- Employee Table -->
            <p-table #employeeTable
                     [value]="filteredEmployees"
                     [loading]="loading"
                     [paginator]="true"
                     [rows]="10"
                     [rowsPerPageOptions]="[10, 25, 50]"
                     [globalFilterFields]="['Nom_Emp', 'Prenom_Emp', 'Departement_Emp', 'Categorie_Emp']"
                     [rowHover]="true"
                     dataKey="Id_Emp"
                     [exportFilename]="'employees_export'"
                     styleClass="p-datatable-sm p-datatable-gridlines">

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 60px"></th>
                        <th pSortableColumn="Nom_Emp">Name <p-sortIcon field="Nom_Emp"></p-sortIcon></th>
                        <th pSortableColumn="Id_Emp">ID <p-sortIcon field="Id_Emp"></p-sortIcon></th>
                        <th pSortableColumn="Departement_Emp">Department <p-sortIcon field="Departement_Emp"></p-sortIcon></th>
                        <th pSortableColumn="Categorie_Emp">Category <p-sortIcon field="Categorie_Emp"></p-sortIcon></th>
                        <th pSortableColumn="DateEmbauche_Emp">Hire Date <p-sortIcon field="DateEmbauche_Emp"></p-sortIcon></th>
                        <th>Status</th>
                        <th style="width: 120px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-employee>
                    <tr>
                        <td>
                            <p-avatar [image]="getPhotoUrl(employee)"
                                      [label]="!employee.Picture ? getInitials(employee) : ''"
                                      shape="circle"
                                      size="large">
                            </p-avatar>
                        </td>
                        <td>
                            <div class="employee-name">
                                <span class="name-primary">{{ employee.Nom_Emp }} {{ employee.Prenom_Emp }}</span>
                                <span class="name-secondary" *ngIf="employee.team">{{ employee.team.name }}</span>
                            </div>
                        </td>
                        <td>
                            <span class="employee-id">{{ employee.Id_Emp }}</span>
                        </td>
                        <td>{{ employee.Departement_Emp }}</td>
                        <td>
                            <p-tag [value]="employee.Categorie_Emp"
                                   [severity]="getCategorySeverity(employee.Categorie_Emp)">
                            </p-tag>
                        </td>
                        <td>{{ employee.DateEmbauche_Emp | date:'dd/MM/yyyy' }}</td>
                        <td>
                            <p-tag [value]="employee.EmpStatus || 'Active'"
                                   [severity]="getStatusSeverity(employee.EmpStatus)">
                            </p-tag>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button pButton icon="pi pi-eye"
                                        class="p-button-text p-button-rounded p-button-sm"
                                        (click)="onViewEmployee(employee)"
                                        pTooltip="View Details">
                                </button>
                                <button pButton icon="pi pi-pencil"
                                        class="p-button-text p-button-rounded p-button-sm"
                                        (click)="onEditEmployee(employee)"
                                        pTooltip="Edit">
                                </button>
                                <button pButton icon="pi pi-trash"
                                        class="p-button-text p-button-rounded p-button-sm p-button-danger"
                                        (click)="onDeleteEmployee(employee)"
                                        pTooltip="Delete">
                                </button>
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="8" class="text-center p-4">
                            <i class="pi pi-search text-4xl text-color-secondary mb-3"></i>
                            <p class="text-color-secondary">No employees found matching your criteria</p>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="loadingbody">
                    <tr *ngFor="let i of [1,2,3,4,5]">
                        <td><p-skeleton shape="circle" size="40px"></p-skeleton></td>
                        <td><p-skeleton width="150px"></p-skeleton></td>
                        <td><p-skeleton width="60px"></p-skeleton></td>
                        <td><p-skeleton width="100px"></p-skeleton></td>
                        <td><p-skeleton width="80px"></p-skeleton></td>
                        <td><p-skeleton width="90px"></p-skeleton></td>
                        <td><p-skeleton width="60px"></p-skeleton></td>
                        <td><p-skeleton width="100px"></p-skeleton></td>
                    </tr>
                </ng-template>
            </p-table>
            <p-toast></p-toast>
        </div>
    `,
    styles: [`
        .employees-list {
            padding: 1rem;
        }

        .employee-name {
            display: flex;
            flex-direction: column;

            .name-primary {
                font-weight: 600;
                color: var(--text-color);
            }

            .name-secondary {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
            }
        }

        .employee-id {
            font-family: monospace;
            background: var(--surface-ground);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
        }

        .action-buttons {
            display: flex;
            gap: 0.25rem;
        }

        .toolbar-search {
            width: 280px;
        }

        :host ::ng-deep {
            .p-datatable .p-datatable-tbody > tr:hover {
                background: var(--surface-hover);
            }
        }
    `]
})
export class EmployeesListComponent implements OnInit, OnDestroy {
    @ViewChild('employeeTable') employeeTable!: Table;

    @Input() employees: Employee[] = [];
    @Input() departments: Department[] = [];
    @Input() categories: EmployeeCategory[] = [];
    @Input() loading = false;

    @Output() viewEmployee = new EventEmitter<Employee>();
    @Output() editEmployee = new EventEmitter<Employee>();
    @Output() deleteEmployee = new EventEmitter<Employee>();
    @Output() filterChanged = new EventEmitter<any>();

    private destroy$ = new Subject<void>();
    private searchSubject = new Subject<string>();

    filteredEmployees: Employee[] = [];
    searchTerm = '';
    selectedDepartment: string | null = null;
    selectedCategory: string | null = null;
    selectedQuickFilter = 'all';

    quickFilterOptions = [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'On Leave', value: 'leave' },
        { label: 'Training', value: 'training' }
    ];

    private apiUrl = environment.apiUrl;

    // Export menu items
    exportMenuItems: MenuItem[] = [
        {
            label: 'Export to Excel',
            icon: 'pi pi-file-excel',
            command: () => this.exportToExcel()
        },
        {
            label: 'Export to CSV',
            icon: 'pi pi-file',
            command: () => this.exportToCsv()
        }
    ];

    constructor(
        private employeeService: DmsEmployeeService,
        private messageService: MessageService,
        private exportService: DmsExportService
    ) {}

    ngOnInit(): void {
        this.filteredEmployees = [...this.employees];

        // Setup debounced search
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.applyFilters();
        });

        // Load data if not provided
        if (this.employees.length === 0) {
            this.loadEmployees();
        }

        if (this.departments.length === 0) {
            this.loadDepartments();
        }

        if (this.categories.length === 0) {
            this.loadCategories();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadEmployees(): void {
        this.loading = true;
        this.employeeService.getEmployees()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (employees) => {
                    this.employees = employees;
                    this.filteredEmployees = [...employees];
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    loadDepartments(): void {
        this.employeeService.getDepartments()
            .pipe(takeUntil(this.destroy$))
            .subscribe(departments => {
                this.departments = departments;
            });
    }

    loadCategories(): void {
        this.employeeService.getEmployeeCategories()
            .pipe(takeUntil(this.destroy$))
            .subscribe(categories => {
                this.categories = categories;
            });
    }

    onSearchChange(value: string): void {
        this.searchSubject.next(value);
    }

    onQuickFilterChange(event: any): void {
        this.applyFilters();
    }

    onFilterChange(): void {
        this.applyFilters();
        this.filterChanged.emit({
            search: this.searchTerm,
            department: this.selectedDepartment,
            category: this.selectedCategory,
            quickFilter: this.selectedQuickFilter
        });
    }

    private applyFilters(): void {
        let filtered = [...this.employees];

        // Search filter
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                e.Nom_Emp?.toLowerCase().includes(term) ||
                e.Prenom_Emp?.toLowerCase().includes(term) ||
                e.Id_Emp?.toString().includes(term)
            );
        }

        // Department filter
        if (this.selectedDepartment) {
            filtered = filtered.filter(e => e.Departement_Emp === this.selectedDepartment);
        }

        // Category filter
        if (this.selectedCategory) {
            filtered = filtered.filter(e => e.Categorie_Emp === this.selectedCategory);
        }

        // Quick filter
        if (this.selectedQuickFilter !== 'all') {
            filtered = filtered.filter(e => {
                const status = e.EmpStatus?.toLowerCase() || 'active';
                return status === this.selectedQuickFilter;
            });
        }

        this.filteredEmployees = filtered;
    }

    getPhotoUrl(employee: Employee): string {
        if (employee.Picture) {
            if (employee.Picture.startsWith('http')) {
                return employee.Picture;
            }
            return `${this.apiUrl}${employee.Picture}`;
        }
        return '';
    }

    getInitials(employee: Employee): string {
        const first = employee.Prenom_Emp?.charAt(0) || '';
        const last = employee.Nom_Emp?.charAt(0) || '';
        return (first + last).toUpperCase();
    }

    getCategorySeverity(category: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            'CDI': 'success',
            'CDD': 'info',
            'Interim': 'warn',
            'Stage': 'secondary'
        };
        return map[category] || 'info';
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            'Active': 'success',
            'active': 'success',
            'On Leave': 'warn',
            'leave': 'warn',
            'Training': 'info',
            'training': 'info',
            'Inactive': 'danger'
        };
        return map[status] || 'info';
    }

    onViewEmployee(employee: Employee): void {
        this.viewEmployee.emit(employee);
    }

    onEditEmployee(employee: Employee): void {
        this.editEmployee.emit(employee);
    }

    onDeleteEmployee(employee: Employee): void {
        this.deleteEmployee.emit(employee);
    }

    exportToExcel(): void {
        if (this.filteredEmployees.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Data',
                detail: 'No employees to export'
            });
            return;
        }

        this.exportService.exportEmployees(this.filteredEmployees);
        this.messageService.add({
            severity: 'success',
            summary: 'Export Complete',
            detail: `${this.filteredEmployees.length} employees exported to Excel`
        });
    }

    exportToCsv(): void {
        if (this.filteredEmployees.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Data',
                detail: 'No employees to export'
            });
            return;
        }

        this.exportService.exportEmployeesToCsv(this.filteredEmployees);
        this.messageService.add({
            severity: 'success',
            summary: 'Export Complete',
            detail: `${this.filteredEmployees.length} employees exported to CSV`
        });
    }
}
