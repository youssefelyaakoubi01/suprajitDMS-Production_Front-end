import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin, Observable, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';

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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ChipModule } from 'primeng/chip';
import { SkeletonModule } from 'primeng/skeleton';
import { AccordionModule } from 'primeng/accordion';
import { SelectButtonModule } from 'primeng/selectbutton';
import { PaginatorModule } from 'primeng/paginator';
import { MenuModule } from 'primeng/menu';
import { TimelineModule } from 'primeng/timeline';
import { DrawerModule } from 'primeng/drawer';
import { KnobModule } from 'primeng/knob';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';

// Services & Models
import { HRService } from '@core/services/hr.service';
import { ProductionService } from '@core/services/production.service';
import { environment } from '../../../../../environments/environment';
import {
    Employee,
    Team,
    Department,
    EmployeeCategory,
    Formation,
    Formateur,
    TrainerSpecialization,
    Qualification,
    HRDashboardStats,
    FormationStats,
    RecyclageEmployee,
    VersatilityMatrix,
    HRWorkstation,
    HRProcess,
    Trajet,
    TransportPlanning,
    DMSUser,
    DMSUserCreate,
    License,
    LicenseType,
    LicenseCreate,
    LicenseStats
} from '@core/models/employee.model';
import { Machine } from '@core/models/production.model';
import {
    EmployeeWorkstationAssignment,
    AssignmentCreateRequest
} from '../../models/assignment.model';
import { QualificationStateService } from '@core/state/qualification-state.service';
import { AssignmentStateService } from '@core/state/assignment-state.service';

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
        ProgressSpinnerModule,
        TextareaModule,
        InputNumberModule,
        DividerModule,
        CheckboxModule,
        ToolbarModule,
        IconFieldModule,
        InputIconModule,
        ChipModule,
        SkeletonModule,
        AccordionModule,
        SelectButtonModule,
        PaginatorModule,
        MenuModule,
        TimelineModule,
        DrawerModule,
        KnobModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './hr.component.html',
    styleUrls: ['./hr.component.scss'],
    animations: [
        trigger('slideDown', [
            transition(':enter', [
                style({ height: 0, opacity: 0, overflow: 'hidden' }),
                animate('200ms ease-out', style({ height: '*', opacity: 1 }))
            ]),
            transition(':leave', [
                style({ overflow: 'hidden' }),
                animate('200ms ease-in', style({ height: 0, opacity: 0 }))
            ])
        ])
    ]
})
export class HrComponent implements OnInit, OnDestroy {
    @ViewChild('employeeTable') employeeTable!: Table;

    // Inject state services for reactive management
    private qualificationState = inject(QualificationStateService);
    private assignmentState = inject(AssignmentStateService);

    private destroy$ = new Subject<void>();

    // Active Tab
    activeTab = '0';  // Legacy - kept for compatibility
    activeTabIndex = 0;  // Numeric index for PrimeNG tabs

    // Loading States
    loading = false;
    loadingStats = false;

    // Data
    employees: Employee[] = [];
    operatorEmployees: Employee[] = []; // Only operators - for qualification/recyclage forms
    teams: Team[] = [];
    departments: Department[] = [];
    departmentEntities: any[] = [];
    categories: EmployeeCategory[] = [];
    formations: Formation[] = [];
    groupedFormations: Map<string, Formation[]> = new Map();
    formateurs: Formateur[] = [];
    qualifications: Qualification[] = [];
    recyclageEmployees: RecyclageEmployee[] = [];
    plannedRecyclages: any[] = [];
    versatilityMatrix: VersatilityMatrix | null = null;

    get uniqueVersatilityWorkstations(): HRWorkstation[] {
        if (!this.versatilityMatrix) return [];
        const seen = new Set<string>();
        return this.versatilityMatrix.workstations.filter(ws => {
            const wsName = ws.name?.toLowerCase().trim() || '';
            if (seen.has(wsName)) {
                return false;
            }
            seen.add(wsName);
            return true;
        });
    }

    workstations: HRWorkstation[] = [];
    processes: HRProcess[] = [];
    specializations: TrainerSpecialization[] = [];
    productionLines: any[] = [];
    trajets: Trajet[] = [];
    users: DMSUser[] = [];
    licenses: License[] = [];
    licenseTypes: LicenseType[] = [];
    licenseStats: LicenseStats | null = null;

    // Dashboard Stats
    dashboardStats: HRDashboardStats | null = null;
    formationStats: FormationStats | null = null;

    // Filters
    searchTerm = '';
    selectedDepartment: string | null = null;
    selectedCategory: string | null = null;
    selectedStatus: string | null = null;

    // UX Enhancements
    showAdvancedFilters = false;
    activeFilters: { key: string; label: string; value: any }[] = [];
    expandedRows: { [key: string]: boolean } = {};
    skeletonRows = Array(5).fill({});

    quickFilterOptions = [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'On Leave', value: 'leave' },
        { label: 'Training', value: 'training' }
    ];
    selectedQuickFilter = 'all';

    // KPI Data for modern cards
    kpiData: { label: string; value: number | string; icon: string; color: string; trend: number; trendLabel?: string; progress: number }[] = [];

    // Dialogs
    showEmployeeDialog = false;
    showFormationDialog = false;
    showQualificationDialog = false;
    showTeamDialog = false;
    showFormateurDialog = false;
    showImportDialog = false;
    showUserDialog = false;

    // Import states
    importing = false;
    selectedImportFile: File | null = null;
    importResult: { imported: number; updated: number; errors: string[]; success: boolean } | null = null;
    showDepartmentDialog = false;
    showLicenseDialog = false;
    showLicenseTypeDialog = false;
    showWorkstationDialog = false;
    showProcessDialog = false;
    showSpecializationDialog = false;
    showCategoryDialog = false;
    showStatusDialog = false;
    showRecyclageDialog = false;

    // Forms
    employeeForm!: FormGroup;
    formationForm!: FormGroup;
    qualificationForm!: FormGroup;
    teamForm!: FormGroup;
    formateurForm!: FormGroup;
    userForm!: FormGroup;
    departmentForm!: FormGroup;
    licenseForm!: FormGroup;
    licenseTypeForm!: FormGroup;
    workstationForm!: FormGroup;
    processForm!: FormGroup;
    specializationForm!: FormGroup;
    categoryForm!: FormGroup;
    statusForm!: FormGroup;
    recyclageForm!: FormGroup;

    // Edit Mode
    isEditMode = false;
    selectedEmployee: Employee | null = null;
    selectedUser: DMSUser | null = null;
    selectedDepartmentEntity: any | null = null;
    selectedLicense: License | null = null;
    selectedLicenseType: LicenseType | null = null;
    selectedWorkstation: HRWorkstation | null = null;
    selectedProcess: HRProcess | null = null;
    selectedFormateur: Formateur | null = null;
    isEditModeFormateur = false;
    selectedSpecialization: TrainerSpecialization | null = null;
    isEditModeSpecialization = false;
    selectedCategoryEntity: EmployeeCategory | null = null;
    isEditModeCategory = false;
    selectedStatusEntity: any | null = null;
    isEditModeStatus = false;
    statuses: any[] = [];
    selectedRecyclageEmployee: RecyclageEmployee | null = null;

    // ==================== QUALIFICATIONS TAB (TAB 10) ====================
    // Using signal-based state management via QualificationStateService
    // These getters provide template-compatible access to signals

    /** Get qualifications list from signal state */
    get qualificationsList(): any[] {
        return this.qualificationState.qualifications();
    }

    /** Get filtered qualifications from computed signal */
    get filteredQualifications(): any[] {
        return this.qualificationState.filteredQualifications();
    }

    /** Get loading state from signal */
    get qualificationsLoading(): boolean {
        return this.qualificationState.loading();
    }

    // Qualifications Filters (now delegated to state service)
    get qualificationSearchTerm(): string {
        return this.qualificationState.searchTerm();
    }
    set qualificationSearchTerm(value: string) {
        this.qualificationState.setSearchTerm(value);
    }

    qualificationStatusFilter: string | null = null;
    qualificationEmployeeFilter: number | null = null;
    qualificationFormationFilter: number | null = null;

    /** Get statistics from computed signal - automatically updated */
    get qualificationStats() {
        return this.qualificationState.stats();
    }

    // Timeline Dialog
    selectedEmployeeForTimeline: any | null = null;
    employeeQualificationHistory: any[] = [];
    showEmployeeTimelineDialog = false;

    // Qualification Save State
    qualificationSaving = false;

    // Qualification Status Options
    qualificationStatusOptions = [
        { label: 'Réussi', value: 'passed' },
        { label: 'Échoué', value: 'failed' },
        { label: 'En attente', value: 'pending' },
        { label: 'En cours', value: 'in_progress' }
    ];

    // Photo upload
    employeePhotoPreview: string | null = null;
    employeePhotoFile: File | null = null;
    selectedFormation: Formation | null = null;
    isEditModeFormation = false;

    // Charts
    employeesByDeptChart: any;
    employeesByCategoryChart: any;
    employeesByStatusChart: any;
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

    // User position options
    positionOptions = [
        { label: 'Administrator', value: 'admin' },
        { label: 'HR Manager', value: 'rh_manager' },
        { label: 'Team Leader', value: 'team_leader' },
        { label: 'Supervisor', value: 'supervisor' },
        { label: 'Operator', value: 'operator' },
        { label: 'Trainer', value: 'formateur' }
    ];

    // User status options
    userStatusOptions = [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Suspended', value: 'suspended' }
    ];

    // Trainer specialization options
    trainerSpecializationOptions = [
        { label: 'Assembly', value: 'Assembly' },
        { label: 'Quality Control', value: 'Quality Control' },
        { label: 'Safety & HSE', value: 'Safety & HSE' },
        { label: 'Machine Operation', value: 'Machine Operation' },
        { label: 'Maintenance', value: 'Maintenance' },
        { label: 'Process Improvement', value: 'Process Improvement' },
        { label: 'Welding', value: 'Welding' },
        { label: 'Electrical', value: 'Electrical' },
        { label: 'Packaging', value: 'Packaging' },
        { label: 'Logistics', value: 'Logistics' },
        { label: 'Other', value: 'Other' }
    ];

    // Tab mapping from route data
    private tabMapping: { [key: string]: string } = {
        'dashboard': '0',
        'employees': '1',
        'formations': '2',
        'qualifications': '2',
        'versatility': '3',
        'recyclage': '4',
        'teams': '5',
        'users': '6',
        'licenses': '7',
        'workstations': '8',
        'affectations': '9',
        'qualifications-list': '10'
    };

    // License status options
    licenseStatusOptions = [
        { label: 'Active', value: 'active' },
        { label: 'Expired', value: 'expired' },
        { label: 'Expiring Soon', value: 'expiring_soon' }
    ];

    // Recyclage list filtering
    filteredRecyclages: any[] = [];
    recyclageSearchTerm = '';
    recyclageStatusFilter: string | null = null;
    recyclageStatusOptions = [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Passed', value: 'passed' },
        { label: 'Failed', value: 'failed' }
    ];

    // Section 2: Recyclage Alerts filtering & stats
    filteredRecyclageEmployees: RecyclageEmployee[] = [];
    recyclageAlertSearchTerm = '';
    recyclageAlertStatusFilter: string | null = null;
    recyclageAlertStatusOptions = [
        { label: 'En retard', value: 'overdue' },
        { label: 'Imminent (≤30j)', value: 'due_soon' },
        { label: 'OK', value: 'ok' }
    ];
    recyclageLastUpdated: Date | null = null;

    // Recyclage KPI Stats
    recyclageStats = {
        total: 0,
        overdue: 0,
        dueSoon: 0,
        ok: 0,
        plannedPending: 0,
        plannedInProgress: 0
    };

    // Export menu items
    exportMenuItems: MenuItem[] = [
        {
            label: 'Export to Excel',
            icon: 'pi pi-file-excel',
            command: () => this.exportEmployees()
        },
        {
            label: 'Export to CSV',
            icon: 'pi pi-file',
            command: () => this.exportEmployeesCsv()
        }
    ];

    showRecyclageDetailsDialog = false;
    selectedRecyclageDetails: any = null;

    // Employee Playlist for Recyclage
    employeePlaylist: Employee[] = [];
    filteredEmployeePlaylist: Employee[] = [];
    selectedPlaylistEmployees: Employee[] = [];
    playlistSearchTerm = '';
    playlistDeptFilter: string | null = null;
    playlistCategoryFilter: string | null = null;
    playlistViewMode: 'grid' | 'list' = 'grid';
    showBatchRecyclageDialog = false;
    batchRecyclageForm!: FormGroup;
    selectAllChecked = false;

    // Workstation process mode options
    processModeOptions = [
        { label: 'Manual', value: 'manual' },
        { label: 'Semi-Automatic', value: 'semi_auto' },
        { label: 'Full Automatic', value: 'full_auto' }
    ];

    // Workstation Assignments (Affectations tab) - Getters delegate to state service
    /** Get all assignments from state service signal */
    get workstationAssignments(): EmployeeWorkstationAssignment[] {
        return this.assignmentState.assignments();
    }

    /** Get filtered assignments from computed signal */
    get filteredAssignments(): EmployeeWorkstationAssignment[] {
        return this.assignmentState.filteredAssignments();
    }

    /** Get loading state from signal */
    get assignmentsLoading(): boolean {
        return this.assignmentState.loading();
    }

    /** Search term getter/setter delegating to state service */
    get assignmentSearchTerm(): string {
        return this.assignmentState.searchTerm();
    }
    set assignmentSearchTerm(value: string) {
        this.assignmentState.setSearchTerm(value);
    }

    showAssignmentDialog = false;
    assignmentForm!: FormGroup;
    isEditModeAssignment = false;
    selectedAssignment: EmployeeWorkstationAssignment | null = null;
    machines: Machine[] = [];
    assignmentLoadingStates = {
        list: false,
        save: false,
        delete: false
    };

    constructor(
        private hrService: HRService,
        private productionService: ProductionService,
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
                this.activeTabIndex = parseInt(this.activeTab, 10);
                this.loadDataForActiveTab();
            }
        });
    }

    /**
     * Load data required for the currently active tab.
     * Lazy loading - only load what's needed for the current tab.
     */
    private loadDataForActiveTab(): void {
        switch (this.activeTab) {
            case '0': // Dashboard tab
                if (!this.dashboardStats?.totalEmployees) {
                    this.loadDashboardStats();
                }
                if (this.employees.length === 0) {
                    this.loadEmployees();
                }
                break;
            case '1': // Employees tab
                if (this.employees.length === 0) {
                    this.loadEmployees();
                }
                this.loadTrajetsIfNeeded();
                break;
            case '2': // Formations tab
                if (this.employees.length === 0) {
                    this.loadEmployees();
                }
                this.loadFormationsTabData();
                break;
            case '3': // Versatility tab
                if (this.employees.length === 0) {
                    this.loadEmployees();
                }
                this.loadVersatilityTabData();
                break;
            case '4': // Recyclage tab
                if (this.employees.length === 0) {
                    this.loadEmployees();
                }
                this.loadRecyclageTabData();
                break;
            case '5': // Teams tab
                this.loadTeamsTabData();
                break;
            case '6': // Users tab
                this.loadUsersTabData();
                break;
            case '7': // Licenses tab
                this.loadLicensesTabData();
                break;
            case '8': // Workstations tab
                this.loadWorkstationsTabData();
                break;
            case '9': // Affectations tab
                this.loadWorkstationAssignmentsWithState();
                this.loadWorkstationsTabData();
                break;
            case '10': // Qualifications list tab
                if (this.qualificationsList.length === 0) {
                    this.loadQualificationsList();
                }
                // Load reference data needed for edit form
                if (this.employees.length === 0) {
                    this.loadEmployees();
                }
                if (this.formations.length === 0 || this.formateurs.length === 0) {
                    this.loadFormationsTabData();
                }
                break;
        }
    }

    /**
     * Load workstation assignments from API.
     * The service automatically updates the signal-based state via tap(),
     * so we just need to call getWorkstationAssignments().
     */
    loadWorkstationAssignmentsWithState(): void {
        this.hrService.getWorkstationAssignments().subscribe({
            next: () => {
                // Signal-based state is automatically updated by the service
            },
            error: (error) => {
                console.error('Error loading workstation assignments:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les affectations'
                });
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Helper to build full image URL for employee pictures
    getEmployeePictureUrl(picture: string | null | undefined): string | undefined {
        if (!picture) {
            return undefined;
        }
        // If already a full URL or local asset, return as is
        if (picture.startsWith('http') || picture.startsWith('assets/')) {
            return picture;
        }
        // Otherwise, prepend the media URL
        return `${environment.mediaUrl}${picture}`;
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
            BadgeNumber: [''],
            email: ['', Validators.email],
            phone: ['']
        });

        this.formationForm = this.fb.group({
            name: ['', Validators.required],
            type: ['', Validators.required],
            process: [null, Validators.required],
            duration_hours: [0],
            description: ['']
        });

        this.qualificationForm = this.fb.group({
            Id_Emp: [null, Validators.required],
            id_formation: [null, Validators.required],
            Trainer: [null, Validators.required],
            Id_Project: [null],
            start_qualif: [new Date(), Validators.required],
            end_qualif: [null],
            test: [''],
            test_result: ['pending'],
            score: [null],
            prod_line: [''],
            comment_qualif: ['']
        });

        this.teamForm = this.fb.group({
            teamName: ['', Validators.required]
        });

        this.formateurForm = this.fb.group({
            Name: ['', Validators.required],
            Email: ['', [Validators.email]],
            login: ['', Validators.required],
            phone: [''],
            specialization: [''],
            Status: ['Active', Validators.required]
        });

        this.userForm = this.fb.group({
            name: ['', Validators.required],
            login: ['', Validators.required],
            password: ['', Validators.required],
            position: ['operator', Validators.required],
            employee: [null],
            department: [null],
            status: ['active', Validators.required],
            dms_ll: [false],
            dms_kpi: [false],
            dms_hr: [false],
            dms_production: [false],
            dms_quality: [false],
            dms_maintenance: [false]
        });

        this.departmentForm = this.fb.group({
            name: ['', Validators.required],
            description: ['']
        });

        this.licenseForm = this.fb.group({
            employee: [null, Validators.required],
            license_type: [null, Validators.required],
            license_number: ['', Validators.required],
            issue_date: [new Date(), Validators.required],
            expiry_date: [null, Validators.required],
            issuing_authority: ['', Validators.required],
            document_url: [''],
            notes: ['']
        });

        this.licenseTypeForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            validity_months: [12, [Validators.required, Validators.min(1)]],
            renewal_advance_days: [30],
            is_mandatory: [false]
        });

        this.workstationForm = this.fb.group({
            name: ['', Validators.required],
            code: ['', Validators.required],
            production_line: [null, Validators.required],
            process_order: [0],
            process_mode: ['manual'],
            typ_order: [''],
            cycle_time_seconds: [0],
            max_operators: [1],
            is_critical: [false],
            description: ['']
        });

        this.processForm = this.fb.group({
            name: ['', Validators.required],
            code: ['', Validators.required],
            description: [''],
            is_active: [true]
        });

        this.specializationForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            is_active: [true]
        });

        this.categoryForm = this.fb.group({
            name: ['', Validators.required],
            description: ['']
        });

        this.statusForm = this.fb.group({
            name: ['', Validators.required],
            code: ['', Validators.required],
            description: [''],
            color: ['info']
        });

        this.recyclageForm = this.fb.group({
            employee_id: [null, Validators.required],
            employee_name: [''],
            formation_id: [null, Validators.required],
            trainer_id: [null, Validators.required],
            planned_date: [new Date(), Validators.required],
            notes: ['']
        });

        this.batchRecyclageForm = this.fb.group({
            formation_id: [null, Validators.required],
            trainer_id: [null],
            planned_date: [new Date(), Validators.required],
            notes: ['']
        });

        this.assignmentForm = this.fb.group({
            employee: [null, Validators.required],
            workstation: [null, Validators.required],
            machine: [null],
            is_primary: [false],
            notes: ['']
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
        // Only load reference data (lightweight) - tab-specific data is loaded on demand
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
                    averageVersatility: stats.average_versatility || 0
                };

                // Map formation type codes to display labels
                const typeLabels: { [key: string]: string } = {
                    'initial': 'Initial Training',
                    'refresher': 'Refresher Training',
                    'certification': 'Certification',
                    'safety': 'Safety Training'
                };

                this.formationStats = {
                    totalFormations: stats.total_formations,
                    plannedFormations: stats.pending_qualifications,
                    completedFormations: stats.passed_qualifications,
                    formationsByType: (stats.formations_by_type || []).map((f: any) => ({
                        type: typeLabels[f.type] || f.type,
                        count: f.count
                    })),
                    upcomingFormations: []
                };

                // Store additional stats for KPIs
                (this.dashboardStats as any).recentHiresCount = stats.recent_hires;
                (this.dashboardStats as any).onLeaveEmployees = stats.on_leave_employees;
                (this.dashboardStats as any).employeesWithVersatility = stats.employees_with_versatility;
                (this.dashboardStats as any).employeesByStatus = stats.employees_by_status?.map((s: any) => ({
                    status: s.status,
                    count: s.count
                })) || [];

                this.updateCharts();
                this.updateKpiData();
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
                // Filter only operators for qualification/recyclage forms
                this.operatorEmployees = data.filter(e => {
                    const category = (e.Categorie_Emp || '').toLowerCase();
                    return category.includes('operator') || category.includes('opérateur');
                });
                this.loading = false;
                this.loadEmployeePlaylist(); // Update playlist when employees are loaded
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load employees' });
                this.loading = false;
            }
        });
    }

    loadReferenceData(): void {
        // Skip if already loaded
        if (this.departments.length > 0 && this.categories.length > 0 && this.statuses.length > 0) {
            return;
        }

        // Load all reference data in parallel with forkJoin for better performance
        forkJoin({
            departments: this.hrService.getDepartments().pipe(catchError(() => of([]))),
            categories: this.hrService.getEmployeeCategories().pipe(catchError(() => of([]))),
            statuses: this.hrService.getEmployeeStatuses().pipe(catchError(() => of([])))
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (data) => {
                this.departments = data.departments as Department[];
                this.categories = data.categories as EmployeeCategory[];
                this.statuses = data.statuses as string[];
            }
        });
    }

    /** Load data for Teams & Trainers tab */
    private loadTeamsTabData(): void {
        // Skip if all data already loaded
        if (this.teams.length > 0 && this.formateurs.length > 0 && this.specializations.length > 0) {
            return;
        }

        // Build requests object only for data that needs loading
        const requests: { [key: string]: Observable<any> } = {};
        if (this.teams.length === 0) {
            requests['teams'] = this.hrService.getTeams().pipe(catchError(() => of([])));
        }
        if (this.formateurs.length === 0) {
            requests['formateurs'] = this.hrService.getFormateurs().pipe(catchError(() => of([])));
        }
        if (this.specializations.length === 0) {
            requests['specializations'] = this.hrService.getSpecializations().pipe(catchError(() => of([])));
        }

        if (Object.keys(requests).length > 0) {
            forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
                next: (data: any) => {
                    if (data.teams) this.teams = data.teams;
                    if (data.formateurs) this.formateurs = data.formateurs;
                    if (data.specializations) this.specializations = data.specializations;
                }
            });
        }
    }

    /** Load data for Formations tab */
    private loadFormationsTabData(): void {
        // Skip if all data already loaded
        if (this.formations.length > 0 && this.processes.length > 0 && this.formateurs.length > 0) {
            return;
        }

        // Build requests object only for data that needs loading
        const requests: { [key: string]: Observable<any> } = {};
        if (this.formations.length === 0) {
            requests['formations'] = this.hrService.getFormations().pipe(catchError(() => of([])));
        }
        if (this.processes.length === 0) {
            requests['processes'] = this.hrService.getProcesses().pipe(catchError(() => of([])));
        }
        if (this.formateurs.length === 0) {
            requests['formateurs'] = this.hrService.getFormateurs().pipe(catchError(() => of([])));
        }

        if (Object.keys(requests).length > 0) {
            forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
                next: (data: any) => {
                    if (data.formations) {
                        this.formations = data.formations;
                        this.updateGroupedFormations();
                    }
                    if (data.processes) this.processes = data.processes;
                    if (data.formateurs) this.formateurs = data.formateurs;
                }
            });
        }
    }

    /** Load data for Recyclage tab */
    private loadRecyclageTabData(): void {
        this.loadRecyclageEmployees();
        this.loadPlannedRecyclages();
    }

    /** Load data for Versatility tab */
    private loadVersatilityTabData(): void {
        this.loadVersatilityMatrix();
    }

    /** Load data for Users tab */
    private loadUsersTabData(): void {
        // Skip if already loaded
        if (this.users.length > 0 && this.departmentEntities.length > 0) {
            return;
        }

        // Load all users data in parallel
        const requests: { [key: string]: Observable<any> } = {};
        if (this.users.length === 0) {
            requests['users'] = this.hrService.getUsers().pipe(catchError(() => of([])));
        }
        if (this.departmentEntities.length === 0) {
            requests['departmentEntities'] = this.hrService.getDepartmentEntities().pipe(catchError(() => of([])));
        }

        if (Object.keys(requests).length > 0) {
            forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
                next: (data: any) => {
                    if (data.users) this.users = data.users;
                    if (data.departmentEntities) this.departmentEntities = data.departmentEntities;
                }
            });
        }
    }

    /** Load data for Licenses tab */
    private loadLicensesTabData(): void {
        // Skip if already loaded
        if (this.licenses.length > 0 && this.licenseTypes.length > 0 && this.licenseStats) {
            return;
        }

        // Load all license data in parallel
        const requests: { [key: string]: Observable<any> } = {};
        if (this.licenses.length === 0) {
            requests['licenses'] = this.hrService.getLicenses().pipe(catchError(() => of([])));
        }
        if (this.licenseTypes.length === 0) {
            requests['licenseTypes'] = this.hrService.getLicenseTypes().pipe(catchError(() => of([])));
        }
        if (!this.licenseStats) {
            requests['licenseStats'] = this.hrService.getLicenseStats().pipe(catchError(() => of(null)));
        }

        if (Object.keys(requests).length > 0) {
            forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
                next: (data: any) => {
                    if (data.licenses) this.licenses = data.licenses;
                    if (data.licenseTypes) this.licenseTypes = data.licenseTypes;
                    if (data.licenseStats) this.licenseStats = data.licenseStats;
                }
            });
        }
    }

    /** Load data for Workstations tab */
    private loadWorkstationsTabData(): void {
        if (this.workstations.length === 0) {
            this.hrService.getWorkstations().subscribe({
                next: (data) => this.workstations = data,
                error: () => this.workstations = []
            });
        }
    }

    /** Load trajets for employee form */
    private loadTrajetsIfNeeded(): void {
        if (this.trajets.length === 0) {
            this.hrService.getTrajets().subscribe({
                next: (data) => this.trajets = data,
                error: () => this.trajets = []
            });
        }

        // Load production lines for workstation form
        this.loadProductionLines();
    }

    loadUsers(): void {
        this.hrService.getUsers().subscribe({
            next: (data) => this.users = data,
            error: (err) => { console.error('Failed to load users:', err); this.users = []; }
        });
    }

    loadDepartmentEntities(): void {
        this.hrService.getDepartmentEntities().subscribe({
            next: (data) => this.departmentEntities = data,
            error: (err) => { console.error('Failed to load department entities:', err); this.departmentEntities = []; }
        });
    }

    // ==================== LICENSE DATA LOADING ====================
    loadLicenses(): void {
        this.hrService.getLicenses().subscribe({
            next: (data) => this.licenses = data,
            error: (err) => { console.error('Failed to load licenses:', err); this.licenses = []; }
        });
    }

    loadLicenseTypes(): void {
        this.hrService.getLicenseTypes().subscribe({
            next: (data) => this.licenseTypes = data,
            error: (err) => { console.error('Failed to load license types:', err); this.licenseTypes = []; }
        });
    }

    loadLicenseStats(): void {
        this.hrService.getLicenseStats().subscribe({
            next: (data) => this.licenseStats = data,
            error: (err) => { console.error('Failed to load license stats:', err); this.licenseStats = null; }
        });
    }

    loadProductionLines(): void {
        this.hrService.getProductionLines().subscribe({
            next: (data) => this.productionLines = data,
            error: (err) => { console.error('Failed to load production lines:', err); this.productionLines = []; }
        });
    }

    loadRecyclageEmployees(): void {
        this.hrService.getEmployeesRequiringRecyclage().subscribe({
            next: (employees: any[]) => {
                // Filter only "Operator" category employees - only they are concerned by recyclage requirements
                const operatorEmployees = employees.filter(e => {
                    const category = (e.category || '').toLowerCase();
                    return category.includes('operator') || category.includes('opérateur');
                });

                // Map API response to RecyclageEmployee interface
                this.recyclageEmployees = operatorEmployees.map(e => ({
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

                // Update stats and apply filters
                this.updateRecyclageStats();
                this.filterRecyclageAlerts();
                this.recyclageLastUpdated = new Date();
            },
            error: (err) => {
                console.error('Error loading recyclage employees:', err);
                this.recyclageEmployees = [];
                this.filteredRecyclageEmployees = [];
                this.updateRecyclageStats();
            }
        });
    }

    // Update recyclage statistics
    updateRecyclageStats(): void {
        const overdue = this.recyclageEmployees.filter(e => e.isOverdue).length;
        const dueSoon = this.recyclageEmployees.filter(e => !e.isOverdue && e.daysUntilRecyclage <= 30).length;
        const ok = this.recyclageEmployees.filter(e => !e.isOverdue && e.daysUntilRecyclage > 30).length;

        this.recyclageStats = {
            total: this.recyclageEmployees.length,
            overdue,
            dueSoon,
            ok,
            plannedPending: this.getRecyclageCountByStatus('pending'),
            plannedInProgress: this.getRecyclageCountByStatus('in_progress')
        };
    }

    // Filter recyclage alerts (Section 2)
    filterRecyclageAlerts(): void {
        let filtered = [...this.recyclageEmployees];

        // Filter by search term
        if (this.recyclageAlertSearchTerm) {
            const term = this.recyclageAlertSearchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                e.Employee?.Nom_Emp?.toLowerCase().includes(term) ||
                e.Employee?.Prenom_Emp?.toLowerCase().includes(term) ||
                e.Employee?.Departement_Emp?.toLowerCase().includes(term)
            );
        }

        // Filter by status
        if (this.recyclageAlertStatusFilter) {
            switch (this.recyclageAlertStatusFilter) {
                case 'overdue':
                    filtered = filtered.filter(e => e.isOverdue);
                    break;
                case 'due_soon':
                    filtered = filtered.filter(e => !e.isOverdue && e.daysUntilRecyclage <= 30);
                    break;
                case 'ok':
                    filtered = filtered.filter(e => !e.isOverdue && e.daysUntilRecyclage > 30);
                    break;
            }
        }

        // Sort by urgency (overdue first, then by days remaining)
        filtered.sort((a, b) => {
            if (a.isOverdue && !b.isOverdue) return -1;
            if (!a.isOverdue && b.isOverdue) return 1;
            return a.daysUntilRecyclage - b.daysUntilRecyclage;
        });

        this.filteredRecyclageEmployees = filtered;
    }

    // Refresh recyclage data
    refreshRecyclageData(): void {
        this.loadRecyclageEmployees();
        this.loadPlannedRecyclages();
        this.messageService.add({
            severity: 'info',
            summary: 'Actualisé',
            detail: 'Données recyclage mises à jour',
            life: 2000
        });
    }

    // Export recyclage alerts to CSV
    exportRecyclageAlertsCsv(): void {
        const data = this.filteredRecyclageEmployees.map(e => ({
            'Nom': e.Employee?.Nom_Emp || '',
            'Prénom': e.Employee?.Prenom_Emp || '',
            'Département': e.Employee?.Departement_Emp || '',
            'Catégorie': e.Employee?.Categorie_Emp || '',
            'Date Embauche': e.DateEmbauche_Emp ? new Date(e.DateEmbauche_Emp).toLocaleDateString('fr-FR') : '',
            'Dernière Qualification': e.lastQualificationDate ? new Date(e.lastQualificationDate).toLocaleDateString('fr-FR') : '-',
            'Jours Restants': e.daysUntilRecyclage,
            'Statut': e.isOverdue ? 'EN RETARD' : (e.daysUntilRecyclage <= 30 ? 'IMMINENT' : 'OK')
        }));

        const headers = Object.keys(data[0] || {});
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => `"${(row as any)[h]}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `recyclage_alertes_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.messageService.add({
            severity: 'success',
            summary: 'Export réussi',
            detail: `${data.length} enregistrements exportés`,
            life: 3000
        });
    }

    // Get formatted days text in French
    getFormattedDaysText(employee: RecyclageEmployee): string {
        if (employee.isOverdue) {
            const days = Math.abs(employee.daysUntilRecyclage);
            return `${days} jour${days > 1 ? 's' : ''} de retard`;
        }
        if (employee.daysUntilRecyclage === 0) {
            return "Expire aujourd'hui";
        }
        if (employee.daysUntilRecyclage === 1) {
            return "1 jour restant";
        }
        return `${employee.daysUntilRecyclage} jours restants`;
    }

    loadPlannedRecyclages(): void {
        // Load qualifications with pending or in_progress status (these are planned recyclages)
        this.hrService.getQualifications({}).subscribe({
            next: (qualifications: any[]) => {
                // Filter to show only pending and in_progress
                this.plannedRecyclages = qualifications.filter(
                    q => q.test_result === 'pending' || q.test_result === 'in_progress'
                );
                this.filterRecyclages(); // Apply initial filtering
                this.updateRecyclageStats(); // Sync stats with planned recyclages
            },
            error: (err) => {
                console.error('Error loading planned recyclages:', err);
                this.plannedRecyclages = [];
                this.filteredRecyclages = [];
                this.updateRecyclageStats();
            }
        });
    }

    // Filter recyclages based on search and status
    filterRecyclages(): void {
        let filtered = [...this.plannedRecyclages];

        // Filter by search term
        if (this.recyclageSearchTerm) {
            const term = this.recyclageSearchTerm.toLowerCase();
            filtered = filtered.filter(q =>
                q.employee_name?.toLowerCase().includes(term) ||
                q.formation_name?.toLowerCase().includes(term)
            );
        }

        // Filter by status
        if (this.recyclageStatusFilter) {
            filtered = filtered.filter(q => q.test_result === this.recyclageStatusFilter);
        }

        this.filteredRecyclages = filtered;
    }

    // Get count of recyclages by status
    getRecyclageCountByStatus(status: string): number {
        return this.plannedRecyclages.filter(q => q.test_result === status).length;
    }

    // Calculate days until a date
    getDaysUntilDate(dateStr: string | Date): number {
        if (!dateStr) return 0;
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        const diffTime = date.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Get absolute value (for template)
    getAbsValue(num: number): number {
        return Math.abs(num);
    }

    // View recyclage details
    viewRecyclageDetails(qualification: any): void {
        this.selectedRecyclageDetails = qualification;
        this.showRecyclageDetailsDialog = true;
    }

    // ==================== EMPLOYEE PLAYLIST ====================
    loadEmployeePlaylist(): void {
        this.employeePlaylist = [...this.employees];
        this.filterEmployeePlaylist();
    }

    filterEmployeePlaylist(): void {
        let filtered = [...this.employees];

        // Filter by search term
        if (this.playlistSearchTerm) {
            const term = this.playlistSearchTerm.toLowerCase();
            filtered = filtered.filter(emp =>
                emp.Prenom_Emp?.toLowerCase().includes(term) ||
                emp.Nom_Emp?.toLowerCase().includes(term) ||
                emp.BadgeNumber?.toLowerCase().includes(term) ||
                emp.Id_Emp?.toString().includes(term)
            );
        }

        // Filter by department
        if (this.playlistDeptFilter) {
            filtered = filtered.filter(emp => emp.Departement_Emp === this.playlistDeptFilter);
        }

        // Filter by category
        if (this.playlistCategoryFilter) {
            filtered = filtered.filter(emp =>
                emp.Categorie_Emp === this.playlistCategoryFilter ||
                emp.category_fk?.name === this.playlistCategoryFilter
            );
        }

        this.filteredEmployeePlaylist = filtered;
    }

    toggleEmployeeSelection(employee: Employee): void {
        const index = this.selectedPlaylistEmployees.findIndex(e => e.Id_Emp === employee.Id_Emp);
        if (index > -1) {
            this.selectedPlaylistEmployees.splice(index, 1);
        } else {
            this.selectedPlaylistEmployees.push(employee);
        }
    }

    isEmployeeSelected(employee: Employee): boolean {
        return this.selectedPlaylistEmployees.some(e => e.Id_Emp === employee.Id_Emp);
    }

    selectAllFilteredEmployees(): void {
        this.selectedPlaylistEmployees = [...this.filteredEmployeePlaylist];
    }

    clearEmployeeSelection(): void {
        this.selectedPlaylistEmployees = [];
    }

    getEmployeeQualificationCount(empId: number): number {
        return this.qualifications.filter(q => q.employee === empId && q.test_result === 'passed').length;
    }

    openBatchRecyclageDialog(): void {
        if (this.selectedPlaylistEmployees.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please select at least one employee'
            });
            return;
        }
        this.batchRecyclageForm.reset({
            planned_date: new Date()
        });
        this.showBatchRecyclageDialog = true;
    }

    saveBatchRecyclage(): void {
        if (this.batchRecyclageForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please fill all required fields'
            });
            return;
        }

        const formValue = this.batchRecyclageForm.value;
        let completed = 0;
        let errors = 0;

        this.selectedPlaylistEmployees.forEach(emp => {
            const qualificationData = {
                employee: emp.Id_Emp,
                formation: formValue.formation_id,
                trainer: formValue.trainer_id || null,
                start_date: formValue.planned_date,
                test_result: 'pending',
                notes: formValue.notes || ''
            };

            this.hrService.createQualification(qualificationData as any).subscribe({
                next: () => {
                    completed++;
                    if (completed + errors === this.selectedPlaylistEmployees.length) {
                        this.finishBatchRecyclage(completed, errors);
                    }
                },
                error: () => {
                    errors++;
                    if (completed + errors === this.selectedPlaylistEmployees.length) {
                        this.finishBatchRecyclage(completed, errors);
                    }
                }
            });
        });
    }

    private finishBatchRecyclage(completed: number, errors: number): void {
        if (completed > 0) {
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Recyclage planned for ${completed} employee(s)`
            });
        }
        if (errors > 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Failed for ${errors} employee(s)`
            });
        }
        this.showBatchRecyclageDialog = false;
        this.selectedPlaylistEmployees = [];
        this.loadPlannedRecyclages();
    }

    openSingleRecyclageFromPlaylist(employee: Employee): void {
        // Create a RecyclageEmployee-like object for the existing planRecyclage method
        const recyclageEmployee: any = {
            Id_Emp: employee.Id_Emp,
            Employee: {
                Id_Emp: employee.Id_Emp,
                Prenom_Emp: employee.Prenom_Emp,
                Nom_Emp: employee.Nom_Emp,
                Picture: employee.Picture
            }
        };
        this.planRecyclage(recyclageEmployee);
    }

    updateRecyclageStatus(qualification: any, newStatus: string): void {
        const oldStatus = qualification.test_result;

        // If same status, do nothing
        if (oldStatus === newStatus) return;

        // Status labels for display
        const statusLabels: { [key: string]: string } = {
            'pending': 'En attente',
            'in_progress': 'En cours',
            'passed': 'Validé',
            'failed': 'Échoué'
        };

        this.confirmationService.confirm({
            message: `Voulez-vous vraiment changer le statut de "${statusLabels[oldStatus] || oldStatus}" vers "${statusLabels[newStatus] || newStatus}" ?`,
            header: 'Confirmer le changement',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, changer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-success',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.hrService.updateQualification(qualification.id, { test_result: newStatus }).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: `Statut mis à jour: ${statusLabels[newStatus] || newStatus}`
                        });
                        this.loadPlannedRecyclages();
                        this.loadRecyclageEmployees();
                        this.updateRecyclageStats();
                    },
                    error: (err) => {
                        console.error('Error updating status:', err);
                        // Revert the dropdown value
                        qualification.test_result = oldStatus;
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: 'Échec de la mise à jour du statut'
                        });
                    }
                });
            },
            reject: () => {
                // Revert the dropdown value
                qualification.test_result = oldStatus;
            }
        });
    }

    completeRecyclage(qualification: any): void {
        const endDate = new Date().toISOString().split('T')[0];
        this.hrService.updateQualification(qualification.id, {
            test_result: 'passed',
            end_qualif: new Date(endDate)
        } as any).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Recyclage completed successfully'
                });
                this.loadPlannedRecyclages();
                this.loadRecyclageEmployees();
            },
            error: (err) => {
                console.error('Error completing recyclage:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to complete recyclage'
                });
            }
        });
    }

    getQualificationStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        switch (status) {
            case 'passed': return 'success';
            case 'failed': return 'danger';
            case 'in_progress': return 'info';
            case 'pending': return 'warn';
            default: return 'secondary';
        }
    }

    deleteQualification(qualification: any): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this planned recyclage?',
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteQualification(qualification.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Planned recyclage deleted'
                        });
                        this.loadPlannedRecyclages();
                    },
                    error: (err) => {
                        console.error('Error deleting qualification:', err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete planned recyclage'
                        });
                    }
                });
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
                        id: w.id || w.id_workstation,
                        name: w.name || w.desc_workstation,
                        code: w.code || '',
                        production_line: w.production_line || 0
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
            const deptColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];
            const catColors = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#22D3EE', '#F472B6', '#2DD4BF'];

            if (this.dashboardStats.employeesByDepartment.length > 0) {
                this.employeesByDeptChart = {
                    labels: this.dashboardStats.employeesByDepartment.map(d => d.department || 'Unknown'),
                    datasets: [{
                        data: this.dashboardStats.employeesByDepartment.map(d => d.count),
                        backgroundColor: this.dashboardStats.employeesByDepartment.map((_, i) => deptColors[i % deptColors.length])
                    }]
                };
            } else {
                this.employeesByDeptChart = {
                    labels: ['No data'],
                    datasets: [{ data: [0], backgroundColor: ['#CBD5E1'] }]
                };
            }

            if (this.dashboardStats.employeesByCategory.length > 0) {
                this.employeesByCategoryChart = {
                    labels: this.dashboardStats.employeesByCategory.map(c => c.category || 'Unknown'),
                    datasets: [{
                        data: this.dashboardStats.employeesByCategory.map(c => c.count),
                        backgroundColor: this.dashboardStats.employeesByCategory.map((_, i) => catColors[i % catColors.length])
                    }]
                };
            } else {
                this.employeesByCategoryChart = {
                    labels: ['No data'],
                    datasets: [{ data: [0], backgroundColor: ['#CBD5E1'] }]
                };
            }

            // Employees by Status chart
            const statusLabels: { [key: string]: string } = {
                'active': 'Active',
                'inactive': 'Inactive',
                'on_leave': 'On Leave',
                'terminated': 'Terminated',
                'suspended': 'Suspended'
            };
            const statusColors: { [key: string]: string } = {
                'active': '#10B981',      // Green
                'inactive': '#6B7280',    // Gray
                'on_leave': '#F59E0B',    // Orange
                'terminated': '#EF4444',  // Red
                'suspended': '#8B5CF6'    // Purple
            };
            const employeesByStatus = (this.dashboardStats as any).employeesByStatus || [];

            if (employeesByStatus.length > 0) {
                this.employeesByStatusChart = {
                    labels: employeesByStatus.map((s: any) => statusLabels[s.status] || s.status),
                    datasets: [{
                        data: employeesByStatus.map((s: any) => s.count),
                        backgroundColor: employeesByStatus.map((s: any) => statusColors[s.status] || '#CBD5E1')
                    }]
                };
            } else {
                this.employeesByStatusChart = {
                    labels: ['No data'],
                    datasets: [{ data: [0], backgroundColor: ['#CBD5E1'] }]
                };
            }
        }

        if (this.formationStats && this.formationStats.formationsByType.length > 0) {
            const formationColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
            this.formationsByTypeChart = {
                labels: this.formationStats.formationsByType.map(f => f.type),
                datasets: [{
                    label: 'Formations',
                    data: this.formationStats.formationsByType.map(f => f.count),
                    backgroundColor: this.formationStats.formationsByType.map((_, i) => formationColors[i % formationColors.length])
                }]
            };
        } else {
            // Fallback if no data
            this.formationsByTypeChart = {
                labels: ['No data'],
                datasets: [{
                    label: 'Formations',
                    data: [0],
                    backgroundColor: '#CBD5E1'
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
            result = result.filter(emp => {
                const empCategory = (emp as any).category_fk_detail?.name || emp.Categorie_Emp;
                return empCategory?.toLowerCase() === this.selectedCategory?.toLowerCase();
            });
        }

        if (this.selectedStatus) {
            result = result.filter(emp => {
                const empStatus = (emp.EmpStatus || (emp as any).status || '').toLowerCase().replace(/[_\s]/g, '');
                const filterStatus = this.selectedStatus!.toLowerCase().replace(/[_\s]/g, '');
                return empStatus === filterStatus;
            });
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
        this.employeePhotoPreview = this.getEmployeePictureUrl(pictureUrl) || null;
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

        // Find team, trajet and category objects from the loaded lists
        // Extract IDs for dropdowns (using optionValue="id" in template)
        // Handle both _detail objects and direct ID values from backend
        const teamId = emp.team_detail?.id || (typeof emp.team === 'object' ? emp.team?.id : emp.team) || null;
        const trajetId = emp.trajet_detail?.id || (typeof emp.trajet === 'object' ? emp.trajet?.id : emp.trajet) || null;

        // Get category_fk ID - try multiple sources:
        // 1. From category_fk_detail (nested serializer)
        // 2. From category_fk directly (might be ID or object)
        // 3. Fallback: try to find category by name from the old 'category' field
        let categoryFkId = emp.category_fk_detail?.id || (typeof emp.category_fk === 'object' ? emp.category_fk?.id : emp.category_fk) || null;

        // If category_fk is null but we have an old category string, try to find matching category by name
        if (!categoryFkId && (emp.category || emp.Categorie_Emp)) {
            const oldCategoryValue = (emp.category || emp.Categorie_Emp || '').toLowerCase();
            const matchingCategory = this.categories.find(c =>
                c.name.toLowerCase() === oldCategoryValue ||
                c.name.toLowerCase().replace(/[_\s]/g, '') === oldCategoryValue.replace(/[_\s]/g, '')
            );
            if (matchingCategory) {
                categoryFkId = matchingCategory.id;
            }
        }

        this.employeeForm.patchValue({
            Nom_Emp: emp.Nom_Emp || emp.last_name || '',
            Prenom_Emp: emp.Prenom_Emp || emp.first_name || '',
            DateNaissance_Emp: dateOfBirth,
            Genre_Emp: emp.Genre_Emp || emp.gender || 'M',
            category_fk: categoryFkId,
            DateEmbauche_Emp: hireDate,
            Departement_Emp: emp.Departement_Emp || emp.department || '',
            EmpStatus: displayStatus,
            team: teamId,
            trajet: trajetId,
            BadgeNumber: emp.BadgeNumber || emp.employee_id || '',
            email: emp.email || '',
            phone: emp.phone || ''
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

        // Optional contact fields
        if (employeeData.email) {
            formData.append('email', employeeData.email);
        }
        if (employeeData.phone) {
            formData.append('phone', employeeData.phone);
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
                this.hrService.deleteEmployee(employee.Id_Emp).subscribe({
                    next: () => {
                        this.employees = this.employees.filter(e => e.Id_Emp !== employee.Id_Emp);
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Employee deleted successfully' });
                    },
                    error: (err) => {
                        console.error('Error deleting employee:', err);
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete employee' });
                    }
                });
            }
        });
    }

    viewEmployee(employee: Employee): void {
        this.messageService.add({ severity: 'info', summary: 'View', detail: `Viewing ${employee.Prenom_Emp} ${employee.Nom_Emp}` });
        // TODO: Navigate to employee detail page or open detail dialog
    }

    // ==================== FORMATION CRUD ====================
    openNewFormationDialog(): void {
        this.isEditModeFormation = false;
        this.selectedFormation = null;
        this.formationForm.reset();
        this.showFormationDialog = true;
    }

    editFormation(formation: Formation): void {
        if (!formation) {
            console.error('Formation is null or undefined');
            return;
        }
        this.isEditModeFormation = true;
        this.selectedFormation = formation;
        this.formationForm.patchValue({
            name: formation.name || '',
            type: formation.type || '',
            process: formation.process || null,
            duration_hours: formation.duration_hours || 0,
            description: formation.description || ''
        });
        this.showFormationDialog = true;
    }

    saveFormation(): void {
        if (this.formationForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
            return;
        }

        const formationData = this.formationForm.value;

        if (this.isEditModeFormation && this.selectedFormation) {
            this.hrService.updateFormation(this.selectedFormation.id, formationData).subscribe({
                next: (updated) => {
                    const index = this.formations.findIndex(f => f.id === updated.id);
                    if (index > -1) this.formations[index] = updated;
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Formation updated successfully' });
                    this.showFormationDialog = false;
                    this.loadFormations();
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update formation' })
            });
        } else {
            this.hrService.createFormation(formationData).subscribe({
                next: (newFormation) => {
                    this.formations.push(newFormation);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Formation created successfully' });
                    this.showFormationDialog = false;
                    this.loadFormations();
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create formation' })
            });
        }
    }

    loadFormations(): void {
        this.hrService.getFormations().subscribe({
            next: (data) => {
                this.formations = data;
                this.updateGroupedFormations();
            },
            error: (err) => {
                console.error('Failed to load formations:', err);
                this.formations = [];
                this.updateGroupedFormations();
            }
        });
    }

    // ==================== PROCESS ====================
    openNewProcessDialog(): void {
        this.isEditMode = false;
        this.selectedProcess = null;
        this.processForm.reset({
            is_active: true
        });
        this.showProcessDialog = true;
    }

    editProcess(process: HRProcess): void {
        this.isEditMode = true;
        this.selectedProcess = process;
        this.processForm.patchValue(process);
        this.showProcessDialog = true;
    }

    saveProcess(): void {
        if (this.processForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
            return;
        }

        const processData = this.processForm.value;

        if (this.isEditMode && this.selectedProcess) {
            this.hrService.updateProcess(this.selectedProcess.id, processData).subscribe({
                next: (updated) => {
                    const index = this.processes.findIndex(p => p.id === updated.id);
                    if (index > -1) this.processes[index] = updated;
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Process updated successfully' });
                    this.showProcessDialog = false;
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update process' })
            });
        } else {
            this.hrService.createProcess(processData).subscribe({
                next: (newProcess) => {
                    this.processes.push(newProcess);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Process created successfully' });
                    this.showProcessDialog = false;
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create process' })
            });
        }
    }

    deleteProcess(process: HRProcess): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the process "${process.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteProcess(process.id).subscribe({
                    next: () => {
                        this.processes = this.processes.filter(p => p.id !== process.id);
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Process deleted successfully' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete process. It may be in use.' })
                });
            }
        });
    }

    // ==================== SPECIALIZATION ====================
    openNewSpecializationDialog(): void {
        this.isEditModeSpecialization = false;
        this.selectedSpecialization = null;
        this.specializationForm.reset({
            is_active: true
        });
        this.showSpecializationDialog = true;
    }

    editSpecialization(specialization: TrainerSpecialization): void {
        this.isEditModeSpecialization = true;
        this.selectedSpecialization = specialization;
        this.specializationForm.patchValue({
            name: specialization.name,
            description: specialization.description || '',
            is_active: specialization.is_active !== false
        });
        this.showSpecializationDialog = true;
    }

    saveSpecialization(): void {
        if (this.specializationForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
            return;
        }

        const specializationData = this.specializationForm.value;

        if (this.isEditModeSpecialization && this.selectedSpecialization) {
            this.hrService.updateSpecialization(this.selectedSpecialization.id, specializationData).subscribe({
                next: (updated) => {
                    const index = this.specializations.findIndex(s => s.id === updated.id);
                    if (index > -1) this.specializations[index] = updated;
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Specialization updated successfully' });
                    this.showSpecializationDialog = false;
                    this.loadSpecializations();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        } else {
            this.hrService.createSpecialization(specializationData).subscribe({
                next: (newSpecialization) => {
                    this.specializations.push(newSpecialization);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Specialization created successfully' });
                    this.showSpecializationDialog = false;
                    this.loadSpecializations();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        }
    }

    deleteSpecialization(specialization: TrainerSpecialization): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the specialization "${specialization.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteSpecialization(specialization.id).subscribe({
                    next: () => {
                        this.specializations = this.specializations.filter(s => s.id !== specialization.id);
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Specialization deleted successfully' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete specialization. It may be in use.' })
                });
            }
        });
    }

    loadSpecializations(): void {
        this.hrService.getSpecializations().subscribe({
            next: (data) => this.specializations = data,
            error: (err) => { console.error('Failed to load specializations:', err); this.specializations = []; }
        });
    }

    // Helper to get specialization options for trainer dropdown
    get specializationOptions(): { label: string; value: string }[] {
        return this.specializations
            .filter(s => s.is_active !== false)
            .map(s => ({ label: s.name, value: s.name }));
    }

    // ==================== EMPLOYEE CATEGORIES ====================
    openNewCategoryDialog(): void {
        this.isEditModeCategory = false;
        this.selectedCategoryEntity = null;
        this.categoryForm.reset();
        this.showCategoryDialog = true;
    }

    editCategory(category: EmployeeCategory): void {
        this.isEditModeCategory = true;
        this.selectedCategoryEntity = category;
        this.categoryForm.patchValue({
            name: category.name,
            description: category.description || ''
        });
        this.showCategoryDialog = true;
    }

    saveCategory(): void {
        if (this.categoryForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
            return;
        }

        const categoryData = {
            name: this.categoryForm.value.name,
            description: this.categoryForm.value.description || ''  // Ensure description is never null
        };

        if (this.isEditModeCategory && this.selectedCategoryEntity) {
            this.hrService.updateCategory(this.selectedCategoryEntity.id!, categoryData).subscribe({
                next: (updated) => {
                    const index = this.categories.findIndex(c => c.id === updated.id);
                    if (index > -1) this.categories[index] = updated;
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Category updated successfully' });
                    this.showCategoryDialog = false;
                    this.loadCategories();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        } else {
            this.hrService.createCategory(categoryData).subscribe({
                next: (newCategory) => {
                    this.categories.push(newCategory);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Category created successfully' });
                    this.showCategoryDialog = false;
                    this.loadCategories();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        }
    }

    deleteCategory(category: EmployeeCategory): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the category "${category.name}"? Employees using this category will have their category set to null.`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteCategory(category.id!).subscribe({
                    next: () => {
                        this.categories = this.categories.filter(c => c.id !== category.id);
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Category deleted successfully' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete category. It may be in use.' })
                });
            }
        });
    }

    loadCategories(): void {
        this.hrService.getEmployeeCategories().subscribe({
            next: (data) => this.categories = data,
            error: (err) => { console.error('Failed to load categories:', err); this.categories = []; }
        });
    }

    // ==================== STATUS CRUD ====================
    openNewStatusDialog(): void {
        this.isEditModeStatus = false;
        this.selectedStatusEntity = null;
        this.statusForm.reset({ color: 'info' });
        this.showStatusDialog = true;
    }

    editStatus(status: any): void {
        this.isEditModeStatus = true;
        this.selectedStatusEntity = status;
        this.statusForm.patchValue({
            name: status.name,
            code: status.code,
            description: status.description || '',
            color: status.color || 'info'
        });
        this.showStatusDialog = true;
    }

    saveStatus(): void {
        if (this.statusForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
            return;
        }

        const statusData = {
            name: this.statusForm.value.name,
            code: this.statusForm.value.code,
            description: this.statusForm.value.description || '',
            color: this.statusForm.value.color || 'info'
        };

        if (this.isEditModeStatus && this.selectedStatusEntity) {
            this.hrService.updateStatus(this.selectedStatusEntity.id!, statusData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Status updated successfully' });
                    this.showStatusDialog = false;
                    this.loadStatuses();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        } else {
            this.hrService.createStatus(statusData).subscribe({
                next: (newStatus) => {
                    this.statuses.push(newStatus);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Status created successfully' });
                    this.showStatusDialog = false;
                    this.loadStatuses();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        }
    }

    deleteStatus(status: any): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the status "${status.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteStatus(status.id).subscribe({
                    next: () => {
                        this.statuses = this.statuses.filter(s => s.id !== status.id);
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Status deleted successfully' });
                    },
                    error: (err) => {
                        const errorDetail = this.parseApiError(err);
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                    }
                });
            }
        });
    }

    loadStatuses(): void {
        this.hrService.getEmployeeStatuses().subscribe({
            next: (data) => this.statuses = data,
            error: (err) => { console.error('Failed to load statuses:', err); this.statuses = []; }
        });
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
            this.qualificationForm.markAllAsTouched();
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please fill all required fields'
            });
            return;
        }

        this.qualificationSaving = true;
        const formValue = this.qualificationForm.value;

        // Format date to YYYY-MM-DD string
        const formatDateForApi = (date: Date | string | null): string | null => {
            if (!date) return null;
            const d = date instanceof Date ? date : new Date(date);
            return d.toISOString().split('T')[0];
        };

        // Map form fields to backend API format
        const qualificationData = {
            employee: formValue.Id_Emp,
            formation: formValue.id_formation,
            trainer: formValue.Trainer || null,
            start_date: formatDateForApi(formValue.start_qualif),
            end_date: formatDateForApi(formValue.end_qualif),
            test_result: formValue.test_result || 'pending',
            score: formValue.score || null,
            notes: formValue.comment_qualif || ''
        };

        console.log('Qualification data being sent:', qualificationData);

        // Check if in edit mode
        const qualificationId = (this.qualificationForm as any)._qualificationId;

        if (this.isEditMode && qualificationId) {
            // UPDATE MODE - Signal automatically updates UI via tap() in service
            this.hrService.updateQualification(qualificationId, qualificationData).subscribe({
                next: () => {
                    // Signal-based state is already updated in the service
                    // UI will refresh automatically - no need for manual array updates
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: 'Qualification mise à jour'
                    });
                    this.showQualificationDialog = false;
                    this.qualificationSaving = false;
                    this.isEditMode = false;
                },
                error: (error) => {
                    console.error('Error updating qualification:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: error.error?.detail || 'Échec de la mise à jour'
                    });
                    this.qualificationSaving = false;
                }
            });
        } else {
            // CREATE MODE - Signal automatically updates UI via tap() in service
            this.hrService.createQualification(qualificationData).subscribe({
                next: () => {
                    // Signal-based state is already updated in the service
                    // UI will refresh automatically - no need for manual array updates
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: 'Qualification créée avec succès'
                    });
                    this.showQualificationDialog = false;
                    this.qualificationSaving = false;
                },
                error: (error) => {
                    console.error('Error creating qualification:', error);
                    console.error('Error response body:', error.error);
                    let errorMessage = 'Échec de la création';
                    if (error.error) {
                        // Build detailed error message from API response
                        const errors = [];
                        for (const [field, messages] of Object.entries(error.error)) {
                            if (Array.isArray(messages)) {
                                errors.push(`${field}: ${messages.join(', ')}`);
                            } else if (typeof messages === 'string') {
                                errors.push(messages);
                            }
                        }
                        if (errors.length > 0) {
                            errorMessage = errors.join('; ');
                        }
                    }
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: errorMessage
                    });
                    this.qualificationSaving = false;
                }
            });
        }
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
        this.isEditModeFormateur = false;
        this.selectedFormateur = null;
        this.formateurForm.reset({ Status: 'Active' });
        this.showFormateurDialog = true;
    }

    editFormateur(formateur: Formateur): void {
        this.isEditModeFormateur = true;
        this.selectedFormateur = formateur;
        this.formateurForm.patchValue({
            Name: formateur.name || formateur.Name,
            Email: formateur.email,
            login: formateur.login,
            Status: formateur.is_active ? 'Active' : (formateur.Status || 'Active'),
            phone: formateur.phone,
            specialization: formateur.specialization
        });
        this.showFormateurDialog = true;
    }

    saveFormateur(): void {
        if (this.formateurForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
            return;
        }

        const formateurData = {
            ...this.formateurForm.value,
            name: this.formateurForm.value.Name,
            is_active: this.formateurForm.value.Status === 'Active'
        };

        if (this.isEditModeFormateur && this.selectedFormateur) {
            const id = this.selectedFormateur.id || this.selectedFormateur.TrainerID;
            if (id) {
                this.hrService.updateFormateur(id, formateurData).subscribe({
                    next: (updatedFormateur) => {
                        const index = this.formateurs.findIndex(f => (f.id || f.TrainerID) === id);
                        if (index !== -1) {
                            this.formateurs[index] = updatedFormateur;
                        }
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Trainer updated successfully' });
                        this.showFormateurDialog = false;
                        this.selectedFormateur = null;
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update trainer' })
                });
            }
        } else {
            this.hrService.createFormateur(formateurData).subscribe({
                next: (newFormateur) => {
                    this.formateurs.push(newFormateur);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Trainer created successfully' });
                    this.showFormateurDialog = false;
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create trainer' })
            });
        }
    }

    deleteFormateur(formateur: Formateur): void {
        const id = formateur.id || formateur.TrainerID;
        const name = formateur.name || formateur.Name || 'this trainer';

        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${name}?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                if (id) {
                    this.hrService.deleteFormateur(id).subscribe({
                        next: () => {
                            this.formateurs = this.formateurs.filter(f => (f.id || f.TrainerID) !== id);
                            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Trainer deleted successfully' });
                        },
                        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete trainer' })
                    });
                }
            }
        });
    }

    // ==================== IMPORT/EXPORT ====================
    openImportDialog(): void {
        this.showImportDialog = true;
        this.selectedImportFile = null;
        this.importResult = null;
        this.importing = false;
    }

    closeImportDialog(): void {
        this.showImportDialog = false;
        this.selectedImportFile = null;
        this.importResult = null;
        this.importing = false;
    }

    onImportFileSelect(event: any): void {
        if (event.files && event.files.length > 0) {
            this.selectedImportFile = event.files[0];
            this.importResult = null;
        }
    }

    onFileUpload(event: any): void {
        if (event.files && event.files.length > 0) {
            this.selectedImportFile = event.files[0];
            this.importEmployees();
        }
    }

    importEmployees(): void {
        if (!this.selectedImportFile) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Attention',
                detail: 'Veuillez sélectionner un fichier'
            });
            return;
        }

        this.importing = true;
        this.importResult = null;

        this.hrService.importEmployeesExcel(this.selectedImportFile).subscribe({
            next: (result) => {
                this.importing = false;
                this.importResult = result;

                if (result.success) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Import réussi',
                        detail: `${result.imported || 0} créés, ${result.updated || 0} mis à jour`,
                        life: 5000
                    });
                    this.loadEmployees();
                    this.loadDashboardStats();
                }

                if (result.errors && result.errors.length > 0) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Avertissements',
                        detail: `${result.errors.length} erreur(s) détectée(s)`,
                        life: 5000
                    });
                }
            },
            error: (err) => {
                this.importing = false;
                const errorDetail = this.parseApiError(err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: errorDetail,
                    life: 5000
                });
            }
        });
    }

    downloadImportTemplate(): void {
        const XLSX = (window as any).XLSX;
        if (!XLSX) {
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Bibliothèque XLSX non disponible'
            });
            return;
        }

        const headers = ['Badge ID', 'First Name', 'Last Name', 'Gender', 'Date of Birth', 'Category', 'Department', 'Hire Date', 'Status'];
        const sampleData = ['EMP001', 'John', 'Doe', 'M', '1990-01-15', 'Operator', 'Production', '2024-01-01', 'Active'];
        const instructions = [
            '',
            'Instructions:',
            '- Gender: M or F',
            '- Category: Operator, Team Leader, Supervisor, Manager, Technician, Engineer',
            '- Status: Active, Inactive, On Leave, Terminated',
            '- Dates: YYYY-MM-DD format',
            '',
            'French columns also accepted: Id_Emp, Nom_Emp, Prenom_Emp, etc.'
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, sampleData, [], ...instructions.map((i: string) => [i])]);
        ws['!cols'] = [
            { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 8 },
            { wch: 14 }, { wch: 15 }, { wch: 20 }, { wch: 14 }, { wch: 12 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Employees');
        XLSX.writeFile(wb, 'employee_import_template.xlsx');

        this.messageService.add({
            severity: 'info',
            summary: 'Template',
            detail: 'Template téléchargé avec succès'
        });
    }

    exportEmployees(): void {
        if (this.employees.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Data',
                detail: 'No employees to export'
            });
            return;
        }

        this.messageService.add({ severity: 'info', summary: 'Export', detail: 'Exporting employees to Excel...' });

        // Use dynamic import for xlsx
        import('xlsx').then(xlsx => {
            const data = this.employees.map(emp => ({
                'ID': emp.Id_Emp,
                'Badge Number': emp.BadgeNumber || '',
                'Last Name': emp.Nom_Emp,
                'First Name': emp.Prenom_Emp,
                'Gender': emp.Genre_Emp === 'M' ? 'Male' : emp.Genre_Emp === 'F' ? 'Female' : emp.Genre_Emp,
                'Category': emp.Categorie_Emp,
                'Department': emp.Departement_Emp,
                'Team': emp.team?.name || '',
                'Status': emp.EmpStatus,
                'Birth Date': emp.DateNaissance_Emp ? new Date(emp.DateNaissance_Emp).toLocaleDateString('en-US') : '',
                'Hire Date': emp.DateEmbauche_Emp ? new Date(emp.DateEmbauche_Emp).toLocaleDateString('en-US') : '',
                'Transport Route': emp.trajet?.name || '',
                'Team Leader ID': emp.TeamLeaderID || '',
                'Created By': emp.CreatedBy || emp.created_by || '',
                'Created Date': emp.CreatedDate ? new Date(emp.CreatedDate).toLocaleDateString('en-US') : '',
                'Changed By': emp.ChangedBy || emp.changed_by || '',
                'Changed Date': emp.ChangedDate ? new Date(emp.ChangedDate).toLocaleDateString('en-US') : ''
            }));

            const worksheet = xlsx.utils.json_to_sheet(data);
            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Employees');

            // Auto-size columns
            const colWidths = [8, 15, 20, 20, 10, 15, 20, 20, 12, 12, 12, 20, 15, 15, 12, 15, 12];
            worksheet['!cols'] = colWidths.map(w => ({ wch: w }));

            xlsx.writeFile(workbook, `employees_export_${new Date().toISOString().slice(0, 10)}.xlsx`);

            this.messageService.add({
                severity: 'success',
                summary: 'Export Complete',
                detail: `${this.employees.length} employees exported to Excel`
            });
        }).catch(err => {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to export employees to Excel'
            });
        });
    }

    exportEmployeesCsv(): void {
        if (this.employees.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Data',
                detail: 'No employees to export'
            });
            return;
        }

        this.messageService.add({ severity: 'info', summary: 'Export', detail: 'Exporting employees to CSV...' });

        // Prepare CSV data with all attributes
        const headers = [
            'ID', 'Badge Number', 'Last Name', 'First Name', 'Gender', 'Category',
            'Department', 'Team', 'Status', 'Birth Date', 'Hire Date',
            'Transport Route', 'Team Leader ID', 'Created By', 'Created Date',
            'Changed By', 'Changed Date'
        ];
        const rows = this.employees.map(emp => [
            emp.Id_Emp,
            emp.BadgeNumber || '',
            emp.Nom_Emp,
            emp.Prenom_Emp,
            emp.Genre_Emp === 'M' ? 'Male' : emp.Genre_Emp === 'F' ? 'Female' : emp.Genre_Emp,
            emp.Categorie_Emp,
            emp.Departement_Emp,
            emp.team?.name || '',
            emp.EmpStatus,
            emp.DateNaissance_Emp ? new Date(emp.DateNaissance_Emp).toLocaleDateString('en-US') : '',
            emp.DateEmbauche_Emp ? new Date(emp.DateEmbauche_Emp).toLocaleDateString('en-US') : '',
            emp.trajet?.name || '',
            emp.TeamLeaderID || '',
            emp.CreatedBy || emp.created_by || '',
            emp.CreatedDate ? new Date(emp.CreatedDate).toLocaleDateString('en-US') : '',
            emp.ChangedBy || emp.changed_by || '',
            emp.ChangedDate ? new Date(emp.ChangedDate).toLocaleDateString('en-US') : ''
        ]);

        // Build CSV content
        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.map(cell => {
                const value = String(cell ?? '');
                if (value.includes(';') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(';'))
        ].join('\n');

        // Create download
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `employees_export_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        this.messageService.add({
            severity: 'success',
            summary: 'Export Complete',
            detail: `${this.employees.length} employees exported to CSV`
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
        this.selectedRecyclageEmployee = employee;
        this.recyclageForm.reset();
        this.recyclageForm.patchValue({
            employee_id: employee.Id_Emp,
            employee_name: `${employee.Employee.Prenom_Emp} ${employee.Employee.Nom_Emp}`,
            planned_date: new Date()
        });
        this.showRecyclageDialog = true;
    }

    saveRecyclage(): void {
        if (this.recyclageForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please fill all required fields'
            });
            return;
        }

        const formData = this.recyclageForm.value;

        // Format date for API
        const plannedDate = formData.planned_date instanceof Date
            ? formData.planned_date.toISOString().split('T')[0]
            : formData.planned_date;

        // Create qualification record for recyclage
        const qualificationData = {
            employee: formData.employee_id,
            formation: formData.formation_id,
            trainer: formData.trainer_id,
            start_date: plannedDate,
            test_result: 'pending',
            notes: formData.notes || 'Recyclage training'
        };

        this.hrService.createQualification(qualificationData).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Recyclage planned successfully'
                });
                this.showRecyclageDialog = false;
                this.loadRecyclageEmployees();
                this.loadPlannedRecyclages();
            },
            error: (err) => {
                console.error('Error planning recyclage:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to plan recyclage'
                });
            }
        });
    }

    // ==================== USER MANAGEMENT ====================
    openNewUserDialog(): void {
        this.isEditMode = false;
        this.selectedUser = null;
        this.userForm.reset({
            position: 'operator',
            status: 'active',
            dms_ll: false,
            dms_kpi: false,
            dms_hr: false,
            dms_production: false,
            dms_quality: false,
            dms_maintenance: false
        });
        this.userForm.get('password')?.setValidators([Validators.required]);
        this.userForm.get('password')?.updateValueAndValidity();
        this.showUserDialog = true;
    }

    editUser(user: DMSUser): void {
        this.isEditMode = true;
        this.selectedUser = user;
        this.userForm.patchValue({
            name: user.name,
            login: user.login,
            password: '',
            position: user.position,
            employee: user.employee,
            department: user.department,
            status: user.status,
            dms_ll: user.dms_ll,
            dms_kpi: user.dms_kpi,
            dms_hr: user.dms_hr,
            dms_production: user.dms_production,
            dms_quality: user.dms_quality,
            dms_maintenance: user.dms_maintenance
        });
        // Password not required for edit
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();
        this.showUserDialog = true;
    }

    saveUser(): void {
        if (this.userForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
            return;
        }

        const userData = this.userForm.value;

        // Extract department ID if it's an object
        if (userData.department && typeof userData.department === 'object') {
            userData.department = userData.department.id;
        }

        // Extract employee ID if it's an object
        if (userData.employee && typeof userData.employee === 'object') {
            userData.employee = userData.employee.Id_Emp || userData.employee.id;
        }

        if (this.isEditMode && this.selectedUser) {
            // Remove password if empty on edit
            if (!userData.password) {
                delete userData.password;
            }
            this.hrService.updateUser(this.selectedUser.id, userData).subscribe({
                next: (updated) => {
                    const index = this.users.findIndex(u => u.id === updated.id);
                    if (index > -1) this.users[index] = updated;
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User updated successfully' });
                    this.showUserDialog = false;
                    this.loadUsers();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        } else {
            this.hrService.createUser(userData).subscribe({
                next: (newUser) => {
                    this.users.push(newUser);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User created successfully' });
                    this.showUserDialog = false;
                    this.loadUsers();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        }
    }

    deleteUser(user: DMSUser): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete user "${user.name}"?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteUser(user.id).subscribe({
                    next: () => {
                        this.users = this.users.filter(u => u.id !== user.id);
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User deleted successfully' });
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete user' });
                    }
                });
            }
        });
    }

    getUserStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
        const map: { [key: string]: 'success' | 'danger' | 'warn' | 'info' } = {
            'active': 'success',
            'inactive': 'danger',
            'suspended': 'warn'
        };
        return map[status] || 'info';
    }

    // ==================== DEPARTMENT MANAGEMENT ====================
    openNewDepartmentDialog(): void {
        this.isEditMode = false;
        this.selectedDepartmentEntity = null;
        this.departmentForm.reset();
        this.showDepartmentDialog = true;
    }

    editDepartmentEntity(dept: any): void {
        this.isEditMode = true;
        this.selectedDepartmentEntity = dept;
        this.departmentForm.patchValue({
            name: dept.name,
            description: dept.description || ''
        });
        this.showDepartmentDialog = true;
    }

    saveDepartment(): void {
        if (this.departmentForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please enter department name' });
            return;
        }

        const deptData = this.departmentForm.value;

        if (this.isEditMode && this.selectedDepartmentEntity) {
            this.hrService.updateDepartment(this.selectedDepartmentEntity.id, deptData).subscribe({
                next: (updated) => {
                    const index = this.departmentEntities.findIndex(d => d.id === updated.id);
                    if (index > -1) this.departmentEntities[index] = updated;
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Department updated successfully' });
                    this.showDepartmentDialog = false;
                    this.loadDepartmentEntities();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        } else {
            this.hrService.createDepartment(deptData).subscribe({
                next: (newDept) => {
                    this.departmentEntities.push(newDept);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Department created successfully' });
                    this.showDepartmentDialog = false;
                    this.loadDepartmentEntities();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        }
    }

    deleteDepartmentEntity(dept: any): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete department "${dept.name}"?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteDepartment(dept.id).subscribe({
                    next: () => {
                        this.departmentEntities = this.departmentEntities.filter(d => d.id !== dept.id);
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Department deleted successfully' });
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete department' });
                    }
                });
            }
        });
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

    onTabChange(newValue: string | number | undefined): void {
        const tabIndex = typeof newValue === 'number' ? newValue : parseInt(newValue?.toString() || '0', 10);
        const tabValue = tabIndex.toString();

        // Update both activeTab and activeTabIndex
        this.activeTabIndex = tabIndex;
        this.activeTab = tabValue;

        // Force chart recreation when returning to dashboard tab
        if (tabValue === '0') {
            this.showCharts = false;
            this.cdr.detectChanges();

            setTimeout(() => {
                this.initChartOptions();
                this.updateCharts();
                this.showCharts = true;
                this.cdr.detectChanges();
            }, 50);
        }

        // Load data for the active tab (lazy loading)
        this.loadDataForActiveTab();
    }

    /**
     * Navigate to Recyclage tab from dashboard
     */
    goToRecyclageTab(): void {
        console.log('goToRecyclageTab called, changing to tab 4');
        this.activeTabIndex = 4;
        this.activeTab = '4';
        this.cdr.detectChanges();
        this.loadDataForActiveTab();
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

    // ==================== LICENSE MANAGEMENT ====================
    openNewLicenseDialog(): void {
        this.isEditMode = false;
        this.selectedLicense = null;
        this.licenseForm.reset({
            issue_date: new Date()
        });
        this.showLicenseDialog = true;
    }

    editLicense(license: License): void {
        this.isEditMode = true;
        this.selectedLicense = license;
        this.licenseForm.patchValue({
            employee: license.employee,
            license_type: license.license_type,
            license_number: license.license_number,
            issue_date: new Date(license.issue_date),
            expiry_date: new Date(license.expiry_date),
            issuing_authority: license.issuing_authority,
            document_url: license.document_url || '',
            notes: license.notes || ''
        });
        this.showLicenseDialog = true;
    }

    saveLicense(): void {
        if (this.licenseForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
            return;
        }

        const formValue = this.licenseForm.value;

        // Format dates to YYYY-MM-DD
        const formatDate = (date: Date | string): string => {
            const d = new Date(date);
            return d.toISOString().split('T')[0];
        };

        const licenseData: LicenseCreate = {
            employee: typeof formValue.employee === 'object' ? formValue.employee.Id_Emp || formValue.employee.id : formValue.employee,
            license_type: typeof formValue.license_type === 'object' ? formValue.license_type.id : formValue.license_type,
            license_number: formValue.license_number,
            issue_date: formatDate(formValue.issue_date),
            expiry_date: formatDate(formValue.expiry_date),
            issuing_authority: formValue.issuing_authority,
            document_url: formValue.document_url || undefined,
            notes: formValue.notes || undefined
        };

        if (this.isEditMode && this.selectedLicense) {
            this.hrService.updateLicense(this.selectedLicense.id, licenseData).subscribe({
                next: (updated) => {
                    const index = this.licenses.findIndex(l => l.id === updated.id);
                    if (index > -1) this.licenses[index] = updated;
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'License updated successfully' });
                    this.showLicenseDialog = false;
                    this.loadLicenses();
                    this.loadLicenseStats();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        } else {
            this.hrService.createLicense(licenseData).subscribe({
                next: (newLicense) => {
                    this.licenses.push(newLicense);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'License created successfully' });
                    this.showLicenseDialog = false;
                    this.loadLicenses();
                    this.loadLicenseStats();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        }
    }

    deleteLicense(license: License): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete license "${license.license_number}"?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteLicense(license.id).subscribe({
                    next: () => {
                        this.licenses = this.licenses.filter(l => l.id !== license.id);
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'License deleted successfully' });
                        this.loadLicenseStats();
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete license' });
                    }
                });
            }
        });
    }

    getLicenseStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
        const map: { [key: string]: 'success' | 'danger' | 'warn' | 'info' } = {
            'active': 'success',
            'expired': 'danger',
            'expiring_soon': 'warn'
        };
        return map[status] || 'info';
    }

    // ==================== LICENSE TYPE MANAGEMENT ====================
    openNewLicenseTypeDialog(): void {
        this.isEditMode = false;
        this.selectedLicenseType = null;
        this.licenseTypeForm.reset({
            validity_months: 12,
            renewal_advance_days: 30,
            is_mandatory: false
        });
        this.showLicenseTypeDialog = true;
    }

    editLicenseType(licenseType: LicenseType): void {
        this.isEditMode = true;
        this.selectedLicenseType = licenseType;
        this.licenseTypeForm.patchValue({
            name: licenseType.name,
            description: licenseType.description || '',
            validity_months: licenseType.validity_months,
            renewal_advance_days: licenseType.renewal_advance_days || 30,
            is_mandatory: licenseType.is_mandatory
        });
        this.showLicenseTypeDialog = true;
    }

    saveLicenseType(): void {
        if (this.licenseTypeForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
            return;
        }

        const licenseTypeData = this.licenseTypeForm.value;

        if (this.isEditMode && this.selectedLicenseType) {
            this.hrService.updateLicenseType(this.selectedLicenseType.id, licenseTypeData).subscribe({
                next: (updated) => {
                    const index = this.licenseTypes.findIndex(lt => lt.id === updated.id);
                    if (index > -1) this.licenseTypes[index] = updated;
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'License type updated successfully' });
                    this.showLicenseTypeDialog = false;
                    this.loadLicenseTypes();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        } else {
            this.hrService.createLicenseType(licenseTypeData).subscribe({
                next: (newLicenseType) => {
                    this.licenseTypes.push(newLicenseType);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'License type created successfully' });
                    this.showLicenseTypeDialog = false;
                    this.loadLicenseTypes();
                },
                error: (err) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        }
    }

    deleteLicenseType(licenseType: LicenseType): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete license type "${licenseType.name}"?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteLicenseType(licenseType.id).subscribe({
                    next: () => {
                        this.licenseTypes = this.licenseTypes.filter(lt => lt.id !== licenseType.id);
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'License type deleted successfully' });
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete license type. It may be in use.' });
                    }
                });
            }
        });
    }

    // ==================== WORKSTATION MANAGEMENT ====================
    openNewWorkstationDialog(): void {
        this.isEditMode = false;
        this.selectedWorkstation = null;
        this.workstationForm.reset({
            process_order: 0,
            process_mode: 'manual',
            cycle_time_seconds: 0,
            max_operators: 1,
            is_critical: false
        });
        this.showWorkstationDialog = true;
    }

    editWorkstation(workstation: any): void {
        this.isEditMode = true;
        this.selectedWorkstation = workstation;
        this.workstationForm.patchValue({
            name: workstation.name,
            code: workstation.code,
            production_line: workstation.production_line,
            process_order: workstation.process_order || 0,
            process_mode: workstation.process_mode || 'manual',
            typ_order: workstation.typ_order || '',
            cycle_time_seconds: workstation.cycle_time_seconds || 0,
            max_operators: workstation.max_operators || 1,
            is_critical: workstation.is_critical || false,
            description: workstation.description || ''
        });
        this.showWorkstationDialog = true;
    }

    saveWorkstation(): void {
        if (this.workstationForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields' });
            return;
        }

        const workstationData = this.workstationForm.value;

        if (this.isEditMode && this.selectedWorkstation) {
            this.hrService.updateWorkstation((this.selectedWorkstation as any).id, workstationData).subscribe({
                next: (updated: any) => {
                    const index = this.workstations.findIndex((w: any) => w.id === updated.id);
                    if (index > -1) this.workstations[index] = updated;
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Workstation updated successfully' });
                    this.showWorkstationDialog = false;
                    this.loadWorkstations();
                },
                error: (err: any) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        } else {
            this.hrService.createWorkstation(workstationData).subscribe({
                next: (newWorkstation: any) => {
                    this.workstations.push(newWorkstation);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Workstation created successfully' });
                    this.showWorkstationDialog = false;
                    this.loadWorkstations();
                },
                error: (err: any) => {
                    const errorDetail = this.parseApiError(err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorDetail });
                }
            });
        }
    }

    deleteWorkstation(workstation: any): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete workstation "${workstation.name}"?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteWorkstation(workstation.id).subscribe({
                    next: () => {
                        this.workstations = this.workstations.filter((w: any) => w.id !== workstation.id);
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Workstation deleted successfully' });
                    },
                    error: (err: any) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete workstation' });
                    }
                });
            }
        });
    }

    loadWorkstations(): void {
        this.hrService.getWorkstations().subscribe({
            next: (data) => this.workstations = data,
            error: (err) => { console.error('Failed to load workstations:', err); this.workstations = []; }
        });
    }

    getProcessModeSeverity(mode: string): 'success' | 'warn' | 'info' {
        const map: { [key: string]: 'success' | 'warn' | 'info' } = {
            'manual': 'info',
            'semi_auto': 'warn',
            'full_auto': 'success'
        };
        return map[mode] || 'info';
    }

    getProcessName(processId: number): string {
        const process = this.processes.find(p => p.id === processId);
        return process?.name || '-';
    }

    // ==================== UX ENHANCEMENT METHODS ====================

    updateKpiData(): void {
        if (!this.dashboardStats) return;

        const stats = this.dashboardStats as any;
        const activeRate = this.dashboardStats.totalEmployees > 0
            ? Math.round((this.dashboardStats.activeEmployees / this.dashboardStats.totalEmployees) * 100)
            : 0;
        const recyclageRate = this.dashboardStats.totalEmployees > 0
            ? Math.round((this.dashboardStats.employeesRequiringRecyclage / this.dashboardStats.totalEmployees) * 100)
            : 0;
        const versatilityPercent = Math.round((this.dashboardStats.averageVersatility / 4) * 100);

        this.kpiData = [
            {
                label: 'Total Employees',
                value: this.dashboardStats.totalEmployees,
                icon: 'pi pi-users',
                color: 'blue',
                trend: stats.recentHiresCount || 0,
                trendLabel: 'new this month',
                progress: 100
            },
            {
                label: 'Active Employees',
                value: this.dashboardStats.activeEmployees,
                icon: 'pi pi-check-circle',
                color: 'green',
                trend: activeRate,
                trendLabel: 'active rate',
                progress: activeRate
            },
            {
                label: 'Recyclage Required',
                value: this.dashboardStats.employeesRequiringRecyclage,
                icon: 'pi pi-refresh',
                color: 'orange',
                trend: recyclageRate,
                trendLabel: 'of total',
                progress: recyclageRate
            },
            {
                label: 'Avg. Versatility',
                value: this.dashboardStats.averageVersatility.toFixed(1),
                icon: 'pi pi-chart-line',
                color: 'purple',
                trend: versatilityPercent,
                trendLabel: 'of max (4.0)',
                progress: versatilityPercent
            }
        ];
    }

    hasActiveFilters(): boolean {
        return this.activeFilters.length > 0;
    }

    get activeFilterCount(): number {
        return this.activeFilters.length;
    }

    applyQuickFilter(): void {
        // Clear existing status filter
        this.activeFilters = this.activeFilters.filter(f => f.key !== 'quickFilter');

        if (this.selectedQuickFilter !== 'all') {
            this.activeFilters.push({
                key: 'quickFilter',
                label: this.quickFilterOptions.find(o => o.value === this.selectedQuickFilter)?.label || '',
                value: this.selectedQuickFilter
            });
        }
        // filteredEmployees getter handles filtering automatically
    }

    removeFilter(filter: { key: string; label: string; value: any }): void {
        this.activeFilters = this.activeFilters.filter(f => f.key !== filter.key);

        // Reset corresponding filter value
        switch (filter.key) {
            case 'department':
                this.selectedDepartment = null;
                break;
            case 'category':
                this.selectedCategory = null;
                break;
            case 'status':
                this.selectedStatus = null;
                break;
            case 'quickFilter':
                this.selectedQuickFilter = 'all';
                break;
        }
        // filteredEmployees getter handles filtering automatically
    }

    clearAllFilters(): void {
        this.activeFilters = [];
        this.selectedDepartment = null;
        this.selectedCategory = null;
        this.selectedStatus = null;
        this.selectedQuickFilter = 'all';
        this.searchTerm = '';
        // filteredEmployees getter handles filtering automatically
    }

    applyFilters(): void {
        // Update active filters based on selected values
        this.activeFilters = [];

        if (this.selectedDepartment) {
            this.activeFilters.push({
                key: 'department',
                label: `Dept: ${this.selectedDepartment}`,
                value: this.selectedDepartment
            });
        }

        if (this.selectedCategory) {
            this.activeFilters.push({
                key: 'category',
                label: `Category: ${this.selectedCategory}`,
                value: this.selectedCategory
            });
        }

        if (this.selectedStatus) {
            this.activeFilters.push({
                key: 'status',
                label: `Status: ${this.selectedStatus}`,
                value: this.selectedStatus
            });
        }
        // filteredEmployees getter handles filtering automatically
    }

    deleteFormation(formation: Formation): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete formation "${formation.name}"?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.hrService.deleteFormation(formation.id).subscribe({
                    next: () => {
                        this.formations = this.formations.filter(f => f.id !== formation.id);
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Formation deleted successfully' });
                    },
                    error: (err: any) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete formation' });
                    }
                });
            }
        });
    }

    // Group formations by process for accordion display
    updateGroupedFormations(): void {
        const grouped = new Map<string, Formation[]>();
        this.formations.forEach(formation => {
            const processName = formation.process_name || this.getProcessName(formation.process) || 'Other';
            if (!grouped.has(processName)) {
                grouped.set(processName, []);
            }
            grouped.get(processName)!.push(formation);
        });
        this.groupedFormations = grouped;
    }

    get activeTrainersCount(): number {
        return this.formateurs.filter(f => f.is_active || f.Status === 'Active').length;
    }

    get ongoingSessions(): number {
        // Return count of ongoing formation sessions (placeholder)
        return this.formationStats?.plannedFormations || 0;
    }

    // ==================== WORKSTATION ASSIGNMENTS (AFFECTATIONS) ====================

    /**
     * @deprecated Use loadWorkstationAssignmentsWithState() instead.
     * Kept for backward compatibility.
     */
    loadWorkstationAssignments(): void {
        this.loadWorkstationAssignmentsWithState();
    }

    /**
     * Update filters in the state service.
     * The filtered list is a computed signal that automatically updates.
     */
    filterAssignments(): void {
        // Search term is already synced via getter/setter
        // Filtered list is a computed signal - automatically updated
        // This method is kept for backward compatibility with template bindings
    }

    openNewAssignmentDialog(): void {
        this.isEditModeAssignment = false;
        this.selectedAssignment = null;
        this.assignmentForm.reset({ is_primary: false });
        this.loadMachines();
        this.showAssignmentDialog = true;
    }

    editAssignment(assignment: EmployeeWorkstationAssignment): void {
        this.isEditModeAssignment = true;
        this.selectedAssignment = assignment;
        this.assignmentForm.patchValue({
            employee: assignment.employee,
            workstation: assignment.workstation,
            machine: assignment.machine,
            is_primary: assignment.is_primary,
            notes: assignment.notes || ''
        });
        this.loadMachines(assignment.workstation);
        this.showAssignmentDialog = true;
    }

    loadMachines(workstationId?: number): void {
        this.productionService.getMachines(workstationId).subscribe({
            next: (machines) => {
                this.machines = machines;
            },
            error: (error) => {
                console.error('Error loading machines:', error);
            }
        });
    }

    onWorkstationChangeInAssignment(event: any): void {
        const workstationId = event?.value;
        this.assignmentForm.patchValue({ machine: null });
        if (workstationId) {
            this.loadMachines(workstationId);
        } else {
            this.machines = [];
        }
    }

    saveAssignment(): void {
        if (this.assignmentForm.invalid) {
            this.assignmentForm.markAllAsTouched();
            return;
        }

        const formValue = this.assignmentForm.value;

        const request: AssignmentCreateRequest = {
            employee: formValue.employee,
            workstation: formValue.workstation,
            machine: formValue.machine || null,
            is_primary: formValue.is_primary || false,
            notes: formValue.notes || ''
        };

        // Check for existing assignment before creating
        if (!this.isEditModeAssignment) {
            const existingAssignment = this.workstationAssignments.find(a =>
                a.employee === request.employee &&
                a.workstation === request.workstation &&
                (a.machine === request.machine || (!a.machine && !request.machine))
            );

            if (existingAssignment) {
                this.confirmationService.confirm({
                    message: 'Une affectation existe déjà pour cet employé sur ce poste de travail. Voulez-vous la mettre à jour?',
                    header: 'Affectation existante',
                    icon: 'pi pi-exclamation-triangle',
                    acceptLabel: 'Oui, mettre à jour',
                    rejectLabel: 'Non',
                    accept: () => {
                        this.assignmentLoadingStates.save = true;
                        this.hrService.updateWorkstationAssignment(existingAssignment.id, request).subscribe({
                            next: () => {
                                this.loadWorkstationAssignmentsWithState();
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Succès',
                                    detail: 'Affectation mise à jour'
                                });
                                this.showAssignmentDialog = false;
                                this.assignmentLoadingStates.save = false;
                            },
                            error: () => {
                                this.messageService.add({
                                    severity: 'error',
                                    summary: 'Erreur',
                                    detail: 'Échec de la mise à jour'
                                });
                                this.assignmentLoadingStates.save = false;
                            }
                        });
                    }
                });
                return;
            }
        }

        this.assignmentLoadingStates.save = true;

        if (this.isEditModeAssignment && this.selectedAssignment) {
            // UPDATE MODE
            this.hrService.updateWorkstationAssignment(this.selectedAssignment.id, request).subscribe({
                next: () => {
                    this.loadWorkstationAssignmentsWithState();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: 'Assignation mise à jour avec succès'
                    });
                    this.showAssignmentDialog = false;
                    this.assignmentLoadingStates.save = false;
                },
                error: (error) => {
                    console.error('Error updating assignment:', error);
                    let errorMessage = 'Échec de la mise à jour';
                    if (error.error?.employee || error.error?.workstation || error.error?.machine || error.error?.non_field_errors) {
                        errorMessage = 'Cet employé est déjà assigné à ce poste de travail';
                    } else if (error.error?.detail) {
                        errorMessage = error.error.detail;
                    }
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: errorMessage
                    });
                    this.assignmentLoadingStates.save = false;
                }
            });
        } else {
            // CREATE MODE
            this.hrService.createWorkstationAssignment(request).subscribe({
                next: () => {
                    this.loadWorkstationAssignmentsWithState();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: 'Assignation créée avec succès'
                    });
                    this.showAssignmentDialog = false;
                    this.assignmentLoadingStates.save = false;
                },
                error: (error) => {
                    console.error('Error creating assignment:', error);
                    this.assignmentLoadingStates.save = false;

                    // Check for unique constraint violation (duplicate assignment)
                    const isUniqueError = error.error?.non_field_errors?.some((e: string) =>
                        e.toLowerCase().includes('unique') || e.toLowerCase().includes('already exists')
                    );

                    if (isUniqueError) {
                        // Ask user if they want to update the existing assignment
                        this.confirmationService.confirm({
                            message: 'Une affectation existe déjà pour cet employé sur ce poste de travail. Voulez-vous la mettre à jour?',
                            header: 'Affectation existante',
                            icon: 'pi pi-exclamation-triangle',
                            acceptLabel: 'Oui, mettre à jour',
                            rejectLabel: 'Non',
                            accept: () => {
                                // Find existing assignment and update it
                                const existingAssignment = this.workstationAssignments.find(a =>
                                    a.employee === request.employee &&
                                    a.workstation === request.workstation
                                );
                                if (existingAssignment) {
                                    this.assignmentLoadingStates.save = true;
                                    this.hrService.updateWorkstationAssignment(existingAssignment.id, request).subscribe({
                                        next: () => {
                                            this.loadWorkstationAssignmentsWithState();
                                            this.messageService.add({
                                                severity: 'success',
                                                summary: 'Succès',
                                                detail: 'Affectation mise à jour'
                                            });
                                            this.showAssignmentDialog = false;
                                            this.assignmentLoadingStates.save = false;
                                        },
                                        error: () => {
                                            this.messageService.add({
                                                severity: 'error',
                                                summary: 'Erreur',
                                                detail: 'Échec de la mise à jour'
                                            });
                                            this.assignmentLoadingStates.save = false;
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        let errorMessage = 'Échec de la création';
                        if (error.error?.non_field_errors) {
                            errorMessage = error.error.non_field_errors.join(', ');
                        } else if (error.error?.employee) {
                            errorMessage = 'Employé invalide';
                        } else if (error.error?.workstation) {
                            errorMessage = 'Poste de travail invalide';
                        } else if (error.error?.detail) {
                            errorMessage = error.error.detail;
                        }
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: errorMessage
                        });
                    }
                }
            });
        }
    }

    deleteAssignment(assignment: EmployeeWorkstationAssignment): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the assignment of ${assignment.employee_name} to ${assignment.workstation_name}?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.assignmentLoadingStates.delete = true;
                this.hrService.deleteWorkstationAssignment(assignment.id).subscribe({
                    next: () => {
                        // Signal-based state is automatically updated by the service
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Assignment deleted successfully'
                        });
                        this.assignmentLoadingStates.delete = false;
                    },
                    error: (error) => {
                        console.error('Error deleting assignment:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete assignment'
                        });
                        this.assignmentLoadingStates.delete = false;
                    }
                });
            }
        });
    }

    setAsPrimary(assignment: EmployeeWorkstationAssignment): void {
        if (assignment.is_primary) {
            return; // Already primary
        }

        this.hrService.setPrimaryAssignment(assignment.id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `${assignment.employee_name} primary assignment set to ${assignment.workstation_name}`
                });
                // Invalidate and reload to get updated is_primary flags
                this.assignmentState.invalidate();
                this.loadWorkstationAssignmentsWithState();
            },
            error: (error) => {
                console.error('Error setting primary assignment:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to set primary assignment'
                });
            }
        });
    }

    // ==================== QUALIFICATIONS LIST TAB (TAB 10) ====================

    /**
     * Load qualifications from API.
     * The service automatically updates the signal-based state,
     * so we just need to call getQualifications().
     */
    loadQualificationsList(): void {
        // The service handles loading state and signal updates via tap()
        this.hrService.getQualifications().subscribe({
            next: () => {
                // Signal-based state is automatically updated by the service
                // Stats and filtered list are computed signals - no manual update needed
            },
            error: (err) => {
                console.error('Error loading qualifications:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec du chargement des qualifications'
                });
            }
        });
    }

    /**
     * @deprecated Stats are now computed automatically via QualificationStateService.stats()
     * Kept for backward compatibility with any code that might call it directly
     */
    updateQualificationStats(): void {
        // No-op: Stats are now a computed signal in QualificationStateService
        // This method is kept for backward compatibility
    }

    /**
     * Update filters in the state service.
     * The filtered list is a computed signal that automatically updates.
     */
    filterQualificationsList(): void {
        // Update filters in the state service
        this.qualificationState.setSearchTerm(this.qualificationSearchTerm || '');
        this.qualificationState.setStatusFilter(this.qualificationStatusFilter);
        this.qualificationState.setEmployeeFilter(this.qualificationEmployeeFilter);
        this.qualificationState.setFormationFilter(this.qualificationFormationFilter);
        // Filtered list is a computed signal - automatically updated
    }

    openNewQualificationFromList(): void {
        this.isEditMode = false;
        this.qualificationForm.reset({
            start_qualif: new Date()
        });
        this.showQualificationDialog = true;
    }

    editQualificationFromList(qual: any): void {
        this.isEditMode = true;
        this.qualificationForm.patchValue({
            Id_Emp: qual.employee,
            id_formation: qual.formation,
            Trainer: qual.trainer,
            start_qualif: qual.start_date ? new Date(qual.start_date) : null,
            end_qualif: qual.end_date ? new Date(qual.end_date) : null,
            test_result: qual.test_result,
            score: qual.score,
            comment_qualif: qual.comment || qual.notes
        });
        // Store the qualification ID for update
        (this.qualificationForm as any)._qualificationId = qual.id;
        this.showQualificationDialog = true;
    }

    deleteQualificationFromList(qual: any): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer la qualification de ${qual.employee_name} pour ${qual.formation_name}?`,
            header: 'Confirmer la suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.hrService.deleteQualification(qual.id).subscribe({
                    next: () => {
                        // Signal-based state is automatically updated by the service
                        // UI will refresh automatically - no need to call loadQualificationsList()
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: 'Qualification supprimée'
                        });
                    },
                    error: (err) => {
                        console.error('Error deleting qualification:', err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: 'Échec de la suppression'
                        });
                    }
                });
            }
        });
    }

    openEmployeeTimeline(qual: any): void {
        this.selectedEmployeeForTimeline = {
            Id_Emp: qual.employee,
            Prenom_Emp: qual.employee_name?.split(' ')[0] || '',
            Nom_Emp: qual.employee_name?.split(' ').slice(1).join(' ') || ''
        };
        this.loadEmployeeQualificationHistory(qual.employee);
        this.showEmployeeTimelineDialog = true;
    }

    loadEmployeeQualificationHistory(employeeId: number): void {
        this.employeeQualificationHistory = this.qualificationsList
            .filter(q => q.employee === employeeId)
            .sort((a, b) => {
                const dateA = a.end_date ? new Date(a.end_date).getTime() : 0;
                const dateB = b.end_date ? new Date(b.end_date).getTime() : 0;
                return dateB - dateA; // Sort by end_date descending
            });
    }

    // Get timeline stats for selected employee
    getTimelineStats(): { passed: number; failed: number; pending: number; inProgress: number; total: number; avgScore: number } {
        const history = this.employeeQualificationHistory;
        const passed = history.filter(q => q.test_result === 'passed').length;
        const failed = history.filter(q => q.test_result === 'failed').length;
        const pending = history.filter(q => q.test_result === 'pending').length;
        const inProgress = history.filter(q => q.test_result === 'in_progress').length;
        const scores = history.filter(q => q.score !== null && q.score !== undefined).map(q => q.score);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        return { passed, failed, pending, inProgress, total: history.length, avgScore };
    }

    // Get color for timeline marker based on status
    getTimelineMarkerColor(status: string): string {
        switch (status) {
            case 'passed': return 'var(--green-500)';
            case 'failed': return 'var(--red-500)';
            case 'pending': return 'var(--orange-500)';
            case 'in_progress': return 'var(--cyan-500)';
            default: return 'var(--gray-500)';
        }
    }

    // Get icon for timeline marker
    getTimelineMarkerIcon(status: string): string {
        switch (status) {
            case 'passed': return 'pi pi-check';
            case 'failed': return 'pi pi-times';
            case 'pending': return 'pi pi-clock';
            case 'in_progress': return 'pi pi-spin pi-spinner';
            default: return 'pi pi-circle';
        }
    }

    // Get knob color based on score
    getScoreKnobColor(score: number): string {
        if (score >= 80) return 'var(--green-500)';
        if (score >= 60) return 'var(--cyan-500)';
        if (score >= 40) return 'var(--orange-500)';
        return 'var(--red-500)';
    }

    exportQualificationsCsv(): void {
        const data = this.filteredQualifications.map(q => ({
            'Employé': q.employee_name || '',
            'Formation': q.formation_name || '',
            'Formateur': q.trainer_name || '',
            'Date Début': q.start_date ? new Date(q.start_date).toLocaleDateString('fr-FR') : '',
            'Date Fin': q.end_date ? new Date(q.end_date).toLocaleDateString('fr-FR') : '',
            'Score': q.score !== null ? q.score + '%' : '-',
            'Statut': q.test_result || ''
        }));

        if (data.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Attention',
                detail: 'Aucune donnée à exporter'
            });
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => `"${(row as any)[h]}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `qualifications_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.messageService.add({
            severity: 'success',
            summary: 'Export réussi',
            detail: `${data.length} qualifications exportées`
        });
    }

    resetQualificationFilters(): void {
        this.qualificationSearchTerm = '';
        this.qualificationStatusFilter = null;
        this.qualificationEmployeeFilter = null;
        this.qualificationFormationFilter = null;
        // State service computed signal automatically recalculates filtered list
        this.qualificationState.setSearchTerm('');
        this.qualificationState.setStatusFilter(null);
        this.qualificationState.setEmployeeFilter(null);
        this.qualificationState.setFormationFilter(null);
    }
}
