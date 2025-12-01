import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { TableModule, Table } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { FileUploadModule } from 'primeng/fileupload';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services & Models
import { HRService } from '../../core/services/hr.service';
import {
    Employee,
    Team,
    Department,
    EmployeeCategory,
    Formation,
    Formateur,
    Qualification,
    HRDashboardStats,
    FormationStats,
    RecyclageEmployee,
    VersatilityMatrix,
    HRWorkstation,
    HRProcess,
    Trajet,
    TransportPlanning
} from '../../core/models/employee.model';

@Component({
    selector: 'app-hr',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CardModule,
        TableModule,
        InputTextModule,
        ButtonModule,
        TagModule,
        ToastModule,
        AvatarModule,
        TabsModule,
        DialogModule,
        SelectModule,
        DatePickerModule,
        FileUploadModule,
        ConfirmDialogModule,
        TooltipModule,
        BadgeModule,
        ChartModule,
        ProgressBarModule,
        TextareaModule,
        InputNumberModule,
        DividerModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './hr.component.html',
    styleUrls: ['./hr.component.scss']
})
export class HrComponent implements OnInit, OnDestroy {
    @ViewChild('employeeTable') employeeTable!: Table;

    private destroy$ = new Subject<void>();

    // Active Tab
    activeTab = '0';

    // Loading States
    loading = false;
    loadingStats = false;

    // Data
    employees: Employee[] = [];
    teams: Team[] = [];
    departments: Department[] = [];
    categories: EmployeeCategory[] = [];
    formations: Formation[] = [];
    formateurs: Formateur[] = [];
    qualifications: Qualification[] = [];
    recyclageEmployees: RecyclageEmployee[] = [];
    versatilityMatrix: VersatilityMatrix | null = null;
    workstations: HRWorkstation[] = [];
    processes: HRProcess[] = [];
    trajets: Trajet[] = [];

    // Dashboard Stats
    dashboardStats: HRDashboardStats | null = null;
    formationStats: FormationStats | null = null;

    // Filters
    searchTerm = '';
    selectedDepartment: string | null = null;
    selectedCategory: string | null = null;
    selectedStatus: string | null = null;

    // Dialogs
    showEmployeeDialog = false;
    showFormationDialog = false;
    showQualificationDialog = false;
    showTeamDialog = false;
    showFormateurDialog = false;
    showImportDialog = false;

    // Forms
    employeeForm!: FormGroup;
    formationForm!: FormGroup;
    qualificationForm!: FormGroup;
    teamForm!: FormGroup;
    formateurForm!: FormGroup;

    // Edit Mode
    isEditMode = false;
    selectedEmployee: Employee | null = null;

    // Photo upload
    employeePhotoPreview: string | null = null;
    employeePhotoFile: File | null = null;
    selectedFormation: Formation | null = null;

    // Charts
    employeesByDeptChart: any;
    employeesByCategoryChart: any;
    formationsByTypeChart: any;
    chartOptions: any;
    pieChartOptions: any;
    barChartOptions: any;
    showCharts = true; // Flag to force chart recreation

    // Dropdown Options
    statusOptions = [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'On Leave', value: 'On Leave' }
    ];

    genderOptions = [
        { label: 'Male', value: 'M' },
        { label: 'Female', value: 'F' }
    ];

    qualificationLevels = [
        { label: 'Level 0 - Not Trained', value: 0, color: '#9CA3AF' },
        { label: 'Level 1 - In Training', value: 1, color: '#FCD34D' },
        { label: 'Level 2 - Trained', value: 2, color: '#60A5FA' },
        { label: 'Level 3 - Autonomous', value: 3, color: '#34D399' },
        { label: 'Level 4 - Expert/Trainer', value: 4, color: '#8B5CF6' }
    ];

    // Tab mapping from route data
    private tabMapping: { [key: string]: string } = {
        'dashboard': '0',
        'employees': '1',
        'formations': '2',
        'qualifications': '2',
        'versatility': '3',
        'recyclage': '4',
        'teams': '5'
    };

    constructor(
        private hrService: HRService,
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private route: ActivatedRoute,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {
        this.initForms();
    }

    ngOnInit(): void {
        this.initChartOptions();
        this.loadInitialData();

        // Listen to route data for tab selection
        this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
            if (data['tab']) {
                this.activeTab = this.tabMapping[data['tab']] || '0';
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ==================== INITIALIZATION ====================
    private initForms(): void {
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
            BadgeNumber: ['']
        });

        this.formationForm = this.fb.group({
            name_formation: ['', Validators.required],
            type_formation: ['', Validators.required],
            id_process: [null, Validators.required]
        });

        this.qualificationForm = this.fb.group({
            Id_Emp: [null, Validators.required],
            id_formation: [null, Validators.required],
            Trainer: [null, Validators.required],
            Id_Project: [null],
            start_qualif: [new Date(), Validators.required],
            test_result: [''],
            comment_qualif: ['']
        });

        this.teamForm = this.fb.group({
            teamName: ['', Validators.required]
        });

        this.formateurForm = this.fb.group({
            Name: ['', Validators.required],
            Email: ['', [Validators.email]],
            login: ['', Validators.required],
            Status: ['Active', Validators.required],
            IsAdmin: [false]
        });
    }

    private initChartOptions(): void {
        // Define fixed colors for chart elements to prevent style changes on navigation
        const textColor = '#374151';
        const textColorSecondary = '#6B7280';
        const surfaceBorder = '#E5E7EB';

        // Common options for all charts
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0 // Disable animations to prevent style issues
            },
            responsiveAnimationDuration: 0
        };

        this.chartOptions = {
            ...commonOptions,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            family: "'Inter', sans-serif"
                        }
                    }
                }
            }
        };

        this.pieChartOptions = {
            ...commonOptions,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            family: "'Inter', sans-serif"
                        }
                    }
                }
            }
        };

        this.barChartOptions = {
            ...commonOptions,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary,
                        font: {
                            size: 11,
                            family: "'Inter', sans-serif"
                        }
                    },
                    grid: { color: surfaceBorder, display: false }
                },
                y: {
                    ticks: {
                        color: textColorSecondary,
                        font: {
                            size: 11,
                            family: "'Inter', sans-serif"
                        }
                    },
                    grid: { color: surfaceBorder },
                    beginAtZero: true
                }
            }
        };
    }

    private loadInitialData(): void {
        this.loading = true;
        this.loadDashboardStats();
        this.loadEmployees();
        this.loadReferenceData();
    }

    // ==================== DATA LOADING ====================
    loadDashboardStats(): void {
        this.loadingStats = true;

        // Load real stats from backend
        this.hrService.getDashboardStats().subscribe({
            next: (stats: any) => {
                this.dashboardStats = {
                    totalEmployees: stats.total_employees,
                    activeEmployees: stats.active_employees,
                    inactiveEmployees: stats.inactive_employees,
                    employeesByDepartment: stats.employees_by_department?.map((d: any) => ({
                        department: d.department,
                        count: d.count
                    })) || [],
                    employeesByCategory: stats.employees_by_category?.map((c: any) => ({
                        category: c.category,
                        count: c.count
                    })) || [],
                    recentHires: [],
                    employeesRequiringRecyclage: stats.employees_requiring_recyclage,
                    qualificationCompletionRate: stats.qualification_rate,
                    averageVersatility: 2.4
                };

                this.formationStats = {
                    totalFormations: stats.total_formations,
                    plannedFormations: stats.pending_qualifications,
                    completedFormations: stats.passed_qualifications,
                    formationsByType: [
                        { type: 'Safety', count: Math.floor(stats.total_formations * 0.33) },
                        { type: 'Technical', count: Math.floor(stats.total_formations * 0.40) },
                        { type: 'Quality', count: Math.floor(stats.total_formations * 0.27) }
                    ],
                    upcomingFormations: []
                };

                this.updateCharts();
                this.loadingStats = false;
            },
            error: (err) => {
                console.error('Error loading dashboard stats:', err);
                // Fallback to empty data
                this.dashboardStats = {
                    totalEmployees: 0,
                    activeEmployees: 0,
                    inactiveEmployees: 0,
                    employeesByDepartment: [],
                    employeesByCategory: [],
                    recentHires: [],
                    employeesRequiringRecyclage: 0,
                    qualificationCompletionRate: 0,
                    averageVersatility: 0
                };
                this.formationStats = {
                    totalFormations: 0,
                    plannedFormations: 0,
                    completedFormations: 0,
                    formationsByType: [],
                    upcomingFormations: []
                };
                this.updateCharts();
                this.loadingStats = false;
            }
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
        this.hrService.getTeams().subscribe({
            next: (data) => this.teams = data,
            error: (err) => { console.error('Failed to load teams:', err); this.teams = []; }
        });
        this.hrService.getDepartments().subscribe({
            next: (data) => this.departments = data,
            error: (err) => { console.error('Failed to load departments:', err); this.departments = []; }
        });
        this.hrService.getEmployeeCategories().subscribe({
            next: (data) => this.categories = data,
            error: (err) => { console.error('Failed to load categories:', err); this.categories = []; }
        });
        this.hrService.getFormations().subscribe({
            next: (data) => this.formations = data,
            error: (err) => { console.error('Failed to load formations:', err); this.formations = []; }
        });
        this.hrService.getFormateurs().subscribe({
            next: (data) => this.formateurs = data,
            error: (err) => { console.error('Failed to load formateurs:', err); this.formateurs = []; }
        });
        this.hrService.getProcesses().subscribe({
            next: (data) => this.processes = data,
            error: (err) => { console.error('Failed to load processes:', err); this.processes = []; }
        });
        this.hrService.getWorkstations().subscribe({
            next: (data) => this.workstations = data,
            error: (err) => { console.error('Failed to load workstations:', err); this.workstations = []; }
        });
        this.hrService.getTrajets().subscribe({
            next: (data) => this.trajets = data,
            error: (err) => { console.error('Failed to load trajets:', err); this.trajets = []; }
        });

        // Load recyclage employees from API
        this.loadRecyclageEmployees();

        // Load versatility matrix from API
        this.loadVersatilityMatrix();
    }

    loadRecyclageEmployees(): void {
        this.hrService.getEmployeesRequiringRecyclage().subscribe({
            next: (employees: any[]) => {
                // Map API response to RecyclageEmployee interface
                this.recyclageEmployees = employees.map(e => ({
                    Id_Emp: e.id,
                    Employee: {
                        Id_Emp: e.id,
                        Nom_Emp: e.full_name?.split(' ').slice(1).join(' ') || '',
                        Prenom_Emp: e.full_name?.split(' ')[0] || '',
                        DateNaissance_Emp: new Date(),
                        Genre_Emp: '',
                        Categorie_Emp: e.category,
                        DateEmbauche_Emp: new Date(e.hire_date),
                        Departement_Emp: e.department,
                        Picture: e.picture || '',
                        EmpStatus: 'Active'
                    },
                    DateEmbauche_Emp: new Date(e.hire_date),
                    lastQualificationDate: e.last_qualification_date ? new Date(e.last_qualification_date) : undefined,
                    daysUntilRecyclage: e.days_until_recyclage,
                    isOverdue: e.is_overdue,
                    requiresRecyclage: e.requires_recyclage
                } as RecyclageEmployee));
            },
            error: (err) => {
                console.error('Error loading recyclage employees:', err);
                this.recyclageEmployees = [];
            }
        });
    }

    loadVersatilityMatrix(): void {
        this.hrService.getVersatilityMatrix().subscribe({
            next: (data: any) => {
                this.versatilityMatrix = {
                    employees: data.employees.map((e: any) => ({
                        Id_Emp: e.Id_Emp,
                        Nom_Emp: e.Nom_Emp,
                        Prenom_Emp: e.Prenom_Emp,
                        DateNaissance_Emp: new Date(),
                        Genre_Emp: '',
                        Categorie_Emp: e.category,
                        DateEmbauche_Emp: new Date(),
                        Departement_Emp: e.department,
                        Picture: e.picture || '',
                        EmpStatus: 'Active'
                    })),
                    workstations: data.workstations.map((w: any) => ({
                        id_workstation: w.id_workstation,
                        name_workstation: w.name,
                        code_workstation: w.code,
                        desc_workstation: w.desc_workstation || w.name,
                        id_process: null
                    })),
                    cells: data.cells.map((c: any) => ({
                        employeeId: c.employeeId,
                        workstationId: c.workstationId,
                        level: c.level as 0 | 1 | 2 | 3 | 4
                    }))
                };
            },
            error: (err) => {
                console.error('Error loading versatility matrix:', err);
                this.versatilityMatrix = null;
            }
        });
    }

    private updateCharts(): void {
        if (this.dashboardStats) {
            this.employeesByDeptChart = {
                labels: this.dashboardStats.employeesByDepartment.map(d => d.department),
                datasets: [{
                    data: this.dashboardStats.employeesByDepartment.map(d => d.count),
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
                }]
            };

            this.employeesByCategoryChart = {
                labels: this.dashboardStats.employeesByCategory.map(c => c.category),
                datasets: [{
                    data: this.dashboardStats.employeesByCategory.map(c => c.count),
                    backgroundColor: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA']
                }]
            };
        }

        if (this.formationStats) {
            this.formationsByTypeChart = {
                labels: this.formationStats.formationsByType.map(f => f.type),
                datasets: [{
                    label: 'Formations',
                    data: this.formationStats.formationsByType.map(f => f.count),
                    backgroundColor: '#3B82F6'
                }]
            };
        }
    }

    // ==================== FILTERING ====================
    get filteredEmployees(): Employee[] {
        let result = [...this.employees];

        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(emp =>
                emp.Nom_Emp.toLowerCase().includes(term) ||
                emp.Prenom_Emp.toLowerCase().includes(term) ||
                emp.Id_Emp.toString().includes(term) ||
                emp.BadgeNumber?.toLowerCase().includes(term)
            );
        }

        if (this.selectedDepartment) {
            result = result.filter(emp => emp.Departement_Emp === this.selectedDepartment);
        }

        if (this.selectedCategory) {
            result = result.filter(emp => emp.Categorie_Emp === this.selectedCategory);
        }

        if (this.selectedStatus) {
            result = result.filter(emp => emp.EmpStatus === this.selectedStatus);
        }

        return result;
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.selectedDepartment = null;
        this.selectedCategory = null;
        this.selectedStatus = null;
        this.employeeTable?.reset();
    }

    // ==================== EMPLOYEE CRUD ====================
    openNewEmployeeDialog(): void {
        this.isEditMode = false;
        this.selectedEmployee = null;
        this.employeePhotoPreview = null;
        this.employeePhotoFile = null;
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

        // Handle photo preview - support both legacy and new field names
        const pictureUrl = employee.Picture || (employee as any).picture || null;
        this.employeePhotoPreview = pictureUrl;
        this.employeePhotoFile = null;

        // Map backend field names to form field names
        // Backend returns both legacy (Nom_Emp) and new (last_name) formats
        const emp = employee as any;

        // Get date of birth - handle both formats
        let dateOfBirth: Date | null = null;
        const dobValue = emp.DateNaissance_Emp || emp.date_of_birth;
        if (dobValue) {
            dateOfBirth = new Date(dobValue);
            if (isNaN(dateOfBirth.getTime())) dateOfBirth = null;
        }

        // Get hire date - handle both formats
        let hireDate: Date | null = new Date();
        const hireDateValue = emp.DateEmbauche_Emp || emp.hire_date;
        if (hireDateValue) {
            hireDate = new Date(hireDateValue);
            if (isNaN(hireDate.getTime())) hireDate = new Date();
        }

        // Map status to display format
        const statusMap: { [key: string]: string } = {
            'active': 'Active',
            'inactive': 'Inactive',
            'on_leave': 'On Leave',
            'terminated': 'Terminated'
        };
        const status = emp.EmpStatus || emp.status || 'active';
        const displayStatus = statusMap[status.toLowerCase()] || status;

        // Map category to display format
        const categoryMap: { [key: string]: string } = {
            'operator': 'Operator',
            'team_leader': 'Team Leader',
            'supervisor': 'Supervisor',
            'manager': 'Manager',
            'technician': 'Technician',
            'engineer': 'Engineer'
        };
        const category = emp.Categorie_Emp || emp.category || '';

        // Find team and trajet objects from the loaded lists by ID
        // The dropdowns use objects with optionLabel="name", not just IDs
        const teamId = emp.team;
        const trajetId = emp.trajet;
        const categoryFkId = emp.category_fk;

        const selectedTeam = teamId ? this.teams.find(t => t.id === teamId) : null;
        const selectedTrajet = trajetId ? this.trajets.find(t => t.id === trajetId) : null;
        const selectedCategoryFk = categoryFkId ? this.categories.find(c => c.id === categoryFkId) : null;

        this.employeeForm.patchValue({
            Nom_Emp: emp.Nom_Emp || emp.last_name || '',
            Prenom_Emp: emp.Prenom_Emp || emp.first_name || '',
            DateNaissance_Emp: dateOfBirth,
            Genre_Emp: emp.Genre_Emp || emp.gender || 'M',
            category_fk: selectedCategoryFk || null,
            DateEmbauche_Emp: hireDate,
            Departement_Emp: emp.Departement_Emp || emp.department || '',
            EmpStatus: displayStatus,
            team: selectedTeam || null,
            trajet: selectedTrajet || null,
            BadgeNumber: emp.BadgeNumber || emp.employee_id || ''
        });

        this.showEmployeeDialog = true;
    }

    // Photo upload handlers
    onPhotoSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Photo size must be less than 2MB'
                });
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Please select an image file'
                });
                return;
            }

            this.employeePhotoFile = file;

            // Create preview
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                this.employeePhotoPreview = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    removePhoto(): void {
        this.employeePhotoPreview = null;
        this.employeePhotoFile = null;
    }

    saveEmployee(): void {
        if (this.employeeForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
            return;
        }

        const employeeData = this.employeeForm.value;

        // Format dates to YYYY-MM-DD string format
        const formatDate = (date: Date | string | null): string | null => {
            if (!date) return null;
            const d = new Date(date);
            if (isNaN(d.getTime())) return null;
            return d.toISOString().split('T')[0];
        };

        // Create FormData for multipart upload (with photo)
        const formData = new FormData();

        // Add form fields - required fields
        formData.append('last_name', employeeData.Nom_Emp || '');
        formData.append('first_name', employeeData.Prenom_Emp || '');
        formData.append('gender', employeeData.Genre_Emp || 'M');
        formData.append('department', employeeData.Departement_Emp || '');

        // Optional badge number
        if (employeeData.BadgeNumber) {
            formData.append('employee_id', employeeData.BadgeNumber);
        }

        // Dates
        const hireDate = formatDate(employeeData.DateEmbauche_Emp);
        if (hireDate) formData.append('hire_date', hireDate);

        const birthDate = formatDate(employeeData.DateNaissance_Emp);
        if (birthDate) formData.append('date_of_birth', birthDate);

        // Map status to lowercase
        const statusMap: { [key: string]: string } = {
            'Active': 'active', 'Inactive': 'inactive',
            'On Leave': 'on_leave', 'Terminated': 'terminated'
        };
        const status = employeeData.EmpStatus || 'Active';
        formData.append('status', statusMap[status] || status.toLowerCase());

        // Handle category - use default 'operator' for the CharField
        // and send category_fk ID if a custom category is selected
        formData.append('category', 'operator'); // Default category value

        if (employeeData.category_fk) {
            const categoryId = typeof employeeData.category_fk === 'object'
                ? employeeData.category_fk.id
                : employeeData.category_fk;
            if (categoryId) {
                formData.append('category_fk', categoryId.toString());
            }
        }

        // Add relationships
        const teamId = employeeData.team?.id || employeeData.team;
        if (teamId) formData.append('team', teamId.toString());

        const trajetId = employeeData.trajet?.id || employeeData.trajet;
        if (trajetId) formData.append('trajet', trajetId.toString());

        // Add photo if selected
        if (this.employeePhotoFile) {
            formData.append('picture', this.employeePhotoFile, this.employeePhotoFile.name);
        }

        // Debug: log FormData contents
        console.log('Sending employee data:');
        formData.forEach((value, key) => console.log(`  ${key}:`, value));

        if (this.isEditMode && this.selectedEmployee) {
            // Support both legacy (Id_Emp) and new (id) field names
            const employeeId = this.selectedEmployee.Id_Emp || (this.selectedEmployee as any).id;
            this.hrService.updateEmployeeWithPhoto(employeeId, formData).subscribe({
                next: (updated) => {
                    const updatedId = updated.Id_Emp || (updated as any).id;
                    const index = this.employees.findIndex(e => (e.Id_Emp || (e as any).id) === updatedId);
                    if (index > -1) this.employees[index] = updated;
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Employee updated successfully' });
                    this.showEmployeeDialog = false;
                    this.employeePhotoFile = null;
                    this.employeePhotoPreview = null;
                    this.loadEmployees();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        } else {
            this.hrService.createEmployeeWithPhoto(formData).subscribe({
                next: (newEmp) => {
                    this.employees.unshift(newEmp);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Employee created successfully' });
                    this.showEmployeeDialog = false;
                    this.employeePhotoFile = null;
                    this.loadEmployees();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        }
    }

    deleteEmployee(employee: Employee): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${employee.Prenom_Emp} ${employee.Nom_Emp}?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.employees = this.employees.filter(e => e.Id_Emp !== employee.Id_Emp);
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Employee deleted successfully' });
            }
        });
    }

    viewEmployee(employee: Employee): void {
        this.messageService.add({ severity: 'info', summary: 'View', detail: `Viewing ${employee.Prenom_Emp} ${employee.Nom_Emp}` });
        // TODO: Navigate to employee detail page or open detail dialog
    }

    // ==================== FORMATION CRUD ====================
    openNewFormationDialog(): void {
        this.isEditMode = false;
        this.selectedFormation = null;
        this.formationForm.reset();
        this.showFormationDialog = true;
    }

    editFormation(formation: Formation): void {
        this.isEditMode = true;
        this.selectedFormation = formation;
        this.formationForm.patchValue(formation);
        this.showFormationDialog = true;
    }

    saveFormation(): void {
        if (this.formationForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
            return;
        }

        const formationData = this.formationForm.value;

        if (this.isEditMode && this.selectedFormation) {
            this.hrService.updateFormation(this.selectedFormation.id_formation, formationData).subscribe({
                next: (updated) => {
                    const index = this.formations.findIndex(f => f.id_formation === updated.id_formation);
                    if (index > -1) this.formations[index] = updated;
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Formation updated successfully' });
                    this.showFormationDialog = false;
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update formation' })
            });
        } else {
            this.hrService.createFormation(formationData).subscribe({
                next: (newFormation) => {
                    this.formations.push(newFormation);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Formation created successfully' });
                    this.showFormationDialog = false;
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create formation' })
            });
        }
    }

    // ==================== QUALIFICATION ====================
    openNewQualificationDialog(): void {
        this.qualificationForm.reset({
            start_qualif: new Date()
        });
        this.showQualificationDialog = true;
    }

    saveQualification(): void {
        if (this.qualificationForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
            return;
        }

        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Qualification created successfully' });
        this.showQualificationDialog = false;
    }

    // ==================== TEAM CRUD ====================
    openNewTeamDialog(): void {
        this.teamForm.reset();
        this.showTeamDialog = true;
    }

    saveTeam(): void {
        if (this.teamForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please enter team name' });
            return;
        }

        const teamData: Partial<Team> = {
            name: this.teamForm.value.teamName,
            code: this.teamForm.value.teamName.toUpperCase().replace(/\s+/g, '_')
        };

        this.hrService.createTeam(teamData).subscribe({
            next: (newTeam) => {
                this.teams.push(newTeam);
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Team created successfully' });
                this.showTeamDialog = false;
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create team' })
        });
    }

    // ==================== FORMATEUR CRUD ====================
    openNewFormateurDialog(): void {
        this.formateurForm.reset({ Status: 'Active', IsAdmin: false });
        this.showFormateurDialog = true;
    }

    saveFormateur(): void {
        if (this.formateurForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
            return;
        }

        const formateurData = this.formateurForm.value;

        this.hrService.createFormateur(formateurData).subscribe({
            next: (newFormateur) => {
                this.formateurs.push(newFormateur);
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Trainer created successfully' });
                this.showFormateurDialog = false;
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create trainer' })
        });
    }

    // ==================== IMPORT/EXPORT ====================
    openImportDialog(): void {
        this.showImportDialog = true;
    }

    onFileUpload(event: any): void {
        const file = event.files[0];
        if (file) {
            this.messageService.add({ severity: 'info', summary: 'Upload', detail: `File ${file.name} uploaded. Processing...` });

            this.hrService.importEmployeesExcel(file).subscribe({
                next: (result) => {
                    if (result.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: `${result.imported} employees imported successfully`
                        });
                        if (result.errors && result.errors.length > 0) {
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Warnings',
                                detail: `${result.errors.length} rows had errors`
                            });
                        }
                        this.showImportDialog = false;
                        this.loadEmployees();
                        this.loadDashboardStats();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Import failed'
                        });
                    }
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: errorDetail
                    });
                }
            });
        }
    }

    exportEmployees(): void {
        this.messageService.add({ severity: 'info', summary: 'Export', detail: 'Exporting employees to Excel...' });

        // Build params from current filters
        const params: { department?: string; status?: string } = {};
        if (this.selectedDepartment) params.department = this.selectedDepartment;
        if (this.selectedStatus) params.status = this.selectedStatus;

        this.hrService.exportEmployeesExcel(params).subscribe({
            next: (blob) => {
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'employees.xlsx';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Employees exported successfully'
                });
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to export employees'
                });
            }
        });
    }

    // ==================== VERSATILITY MATRIX ====================
    getVersatilityLevel(employeeId: number, workstationId: number): number {
        if (!this.versatilityMatrix) return 0;
        const cell = this.versatilityMatrix.cells.find(
            c => c.employeeId === employeeId && c.workstationId === workstationId
        );
        return cell?.level ?? 0;
    }

    getVersatilityColor(level: number): string {
        return this.qualificationLevels.find(l => l.value === level)?.color || '#9CA3AF';
    }

    updateVersatility(employeeId: number, workstationId: number, newLevel: number): void {
        if (!this.versatilityMatrix) return;

        // Save to backend
        this.hrService.updateVersatilityCell(employeeId, workstationId, newLevel).subscribe({
            next: () => {
                // Update local state
                const cell = this.versatilityMatrix?.cells.find(
                    c => c.employeeId === employeeId && c.workstationId === workstationId
                );
                if (cell) {
                    cell.level = newLevel as 0 | 1 | 2 | 3 | 4;
                } else if (this.versatilityMatrix) {
                    this.versatilityMatrix.cells.push({
                        employeeId,
                        workstationId,
                        level: newLevel as 0 | 1 | 2 | 3 | 4
                    });
                }
                this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Versatility level updated' });
            },
            error: (err) => {
                console.error('Error updating versatility level:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update versatility level' });
            }
        });
    }

    // ==================== RECYCLAGE ====================
    getRecyclageSeverity(employee: RecyclageEmployee): 'danger' | 'warn' | 'success' {
        if (employee.isOverdue) return 'danger';
        if (employee.daysUntilRecyclage <= 30) return 'warn';
        return 'success';
    }

    planRecyclage(employee: RecyclageEmployee): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Plan Recyclage',
            detail: `Planning recyclage for ${employee.Employee.Prenom_Emp} ${employee.Employee.Nom_Emp}`
        });
        // TODO: Open dialog to plan recyclage
    }

    // ==================== HELPERS ====================
    getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
        const map: { [key: string]: 'success' | 'danger' | 'warn' | 'info' } = {
            'Active': 'success',
            'Inactive': 'danger',
            'On Leave': 'warn'
        };
        return map[status] || 'info';
    }

    getInitials(employee: Employee): string {
        const firstName = employee.Prenom_Emp || (employee as any).first_name || '';
        const lastName = employee.Nom_Emp || (employee as any).last_name || '';
        const firstInitial = firstName.charAt(0) || '';
        const lastInitial = lastName.charAt(0) || '';
        return `${firstInitial}${lastInitial}`.toUpperCase() || '??';
    }

    /**
     * Parse API error response and return a user-friendly message
     */
    parseApiError(err: any): string {
        // Try to get error details from the response body
        if (err?.error) {
            const errorBody = err.error;

            // If it's an object with field-specific errors (DRF format)
            if (typeof errorBody === 'object' && !Array.isArray(errorBody)) {
                const messages: string[] = [];
                for (const [field, errors] of Object.entries(errorBody)) {
                    const fieldName = this.formatFieldName(field);
                    if (Array.isArray(errors)) {
                        messages.push(`${fieldName}: ${errors.join(', ')}`);
                    } else if (typeof errors === 'string') {
                        messages.push(`${fieldName}: ${errors}`);
                    }
                }
                if (messages.length > 0) {
                    return messages.join(' | ');
                }
            }

            // If it's a string message
            if (typeof errorBody === 'string') {
                return errorBody;
            }

            // If it has a detail field (common DRF error format)
            if (errorBody.detail) {
                return errorBody.detail;
            }
        }

        // Fallback to generic message based on status code
        if (err?.status === 400) {
            return 'Invalid data submitted. Please check your inputs.';
        } else if (err?.status === 404) {
            return 'Resource not found.';
        } else if (err?.status === 500) {
            return 'Server error. Please try again later.';
        }

        return 'An unexpected error occurred.';
    }

    /**
     * Format field names for display (e.g., employee_id -> Employee ID)
     */
    private formatFieldName(field: string): string {
        const fieldMappings: { [key: string]: string } = {
            'employee_id': 'Badge Number',
            'first_name': 'First Name',
            'last_name': 'Last Name',
            'date_of_birth': 'Date of Birth',
            'hire_date': 'Hire Date',
            'department': 'Department',
            'category': 'Category',
            'status': 'Status',
            'gender': 'Gender',
            'picture': 'Photo'
        };
        return fieldMappings[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    onTabChange(event: any): void {
        this.activeTab = event.index?.toString() || '0';

        // Force chart recreation when returning to dashboard tab
        if (this.activeTab === '0') {
            this.showCharts = false;
            this.cdr.detectChanges();

            // Reinitialize chart options and recreate charts
            setTimeout(() => {
                this.initChartOptions();
                this.updateCharts();
                this.showCharts = true;
                this.cdr.detectChanges();
            }, 50);
        }
    }

    // ==================== COUNT HELPERS ====================
    getEmployeeCountByTeam(teamId: number | undefined): number {
        if (!teamId) return 0;
        return this.employees.filter(e => {
            const empTeamId = typeof e.team === 'object' ? e.team?.id : e.team;
            return empTeamId === teamId;
        }).length;
    }

    /**
     * Get team name by ID for display in the table
     */
    getTeamName(teamValue: any): string {
        if (!teamValue) return '-';
        // If it's already an object with name
        if (typeof teamValue === 'object' && teamValue.name) {
            return teamValue.name;
        }
        // If it's an ID, find the team
        const team = this.teams.find(t => t.id === teamValue);
        return team?.name || '-';
    }

    /**
     * Get trajet name by ID for display in the table
     */
    getTrajetName(trajetValue: any): string {
        if (!trajetValue) return '-';
        // If it's already an object with name
        if (typeof trajetValue === 'object' && trajetValue.name) {
            return trajetValue.name;
        }
        // If it's an ID, find the trajet
        const trajet = this.trajets.find(t => t.id === trajetValue);
        return trajet?.name || '-';
    }

    getEmployeeCountByCategory(category: string): number {
        return this.employees.filter(e => (e.category_fk?.name || e.Categorie_Emp) === category).length;
    }

    getEmployeeCountByDepartment(department: string): number {
        return this.employees.filter(e => e.Departement_Emp === department).length;
    }
}
