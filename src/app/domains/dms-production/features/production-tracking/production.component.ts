import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription, forkJoin, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, catchError, takeUntil } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
// New PrimeNG UX improvement imports
import { StepperModule } from 'primeng/stepper';
import { SkeletonModule } from 'primeng/skeleton';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DrawerModule } from 'primeng/drawer';
import { MeterGroupModule } from 'primeng/metergroup';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProductionService } from './production.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { HRService } from '../../../../core/services/hr.service';
import { EmployeePrimaryAssignment } from '../../../dms-rh/models/assignment.model';
import { NonQualifiedAssignmentCreate, QualificationCheckResult } from '../../../dms-rh/models/non-qualified-assignment.model';
import {
    Project,
    ProductionLine,
    Part,
    Workstation,
    Machine,
    Shift,
    ShiftType,
    DowntimeProblem,
    Downtime,
    Zone,
    Process,
    PRODUCT_TYPE_OPTIONS
} from '../../../../core/models';
import {
    ShiftProductionSession,
    HourlyProductionState,
    HourProductionInput,
    DowntimeExtended,
    HourStatus,
    HourType,
    WorkflowStep,
    MeterItem
} from '../../../../core/models/production-session.model';
import { EmployeeWithAssignment, ProductionRole, ProductionRoleOption } from '../../../../core/models/employee.model';
import { environment } from '../../../../../environments/environment';
import { TeamAssignmentStateService } from '../../../../core/state/team-assignment-state.service';
import { AuthService } from '../../../../core/services/auth.service';

// Export libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
    selector: 'app-production',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CardModule,
        SelectModule,
        DatePickerModule,
        InputNumberModule,
        InputTextModule,
        TextareaModule,
        ButtonModule,
        TableModule,
        TagModule,
        ToastModule,
        DialogModule,
        DividerModule,
        AvatarModule,
        ProgressBarModule,
        MessageModule,
        CheckboxModule,
        TooltipModule,
        // New UX improvement modules
        StepperModule,
        SkeletonModule,
        FloatLabelModule,
        DrawerModule,
        MeterGroupModule,
        ConfirmPopupModule,
        IconFieldModule,
        InputIconModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './production.component.html',
    styleUrls: ['./production.component.scss']
})
export class ProductionComponent implements OnInit, OnDestroy {
    // Inject state service for reactive team assignment management
    private teamState = inject(TeamAssignmentStateService);

    // Getter for reactive team access (used in template)
    get team(): EmployeeWithAssignment[] {
        return this.teamState.team();
    }

    // Production Session
    session: ShiftProductionSession = {
        shift: null,
        date: new Date(),
        project: null,
        productionLine: null,
        process: null,  // For semi-finished products
        part: null,
        machine: null,
        zone: null,
        orderNo: '',
        team: [],
        actors: {
            lineLeader: { badgeId: '', name: '', qualification: '' },
            qualityAgent: { badgeId: '', name: '', qualification: '' },
            maintenanceTech: { badgeId: '', name: '', qualification: '' },
            pqc: { badgeId: '', name: '', qualification: '' }
        },
        hours: [],
        isSetupComplete: false,
        isTeamComplete: false,
        currentHourIndex: null
    };

    // Forms
    shiftSetupForm!: FormGroup;
    teamAssignmentForm!: FormGroup;

    // Reference Data
    shifts: Shift[] = [];
    projects: Project[] = [];
    productionLines: ProductionLine[] = [];
    processes: Process[] = [];  // For semi-finished products
    parts: Part[] = [];
    workstations: Workstation[] = [];
    machines: Machine[] = [];
    downtimeProblems: DowntimeProblem[] = [];
    shiftTypes: ShiftType[] = [];
    zones: Zone[] = [];

    // Hour Type Options - loaded from database
    hourTypeOptions: { label: string; value: string }[] = [];

    // Product Type Options
    PRODUCT_TYPE_OPTIONS = PRODUCT_TYPE_OPTIONS;

    // Team Assignment
    employeeIdScan = '';
    selectedWorkstation: Workstation | null = null;
    selectedMachineForAssignment: Machine | null = null;
    filteredMachinesForAssignment: Machine[] = [];
    selectedRole: ProductionRole = 'operator';
    roleOptions: ProductionRoleOption[] = [
        { label: 'Operator', value: 'operator', icon: 'pi pi-user' },
        { label: 'Line Leader', value: 'line_leader', icon: 'pi pi-star' },
        { label: 'Quality Agent', value: 'quality_agent', icon: 'pi pi-check-circle' },
        { label: 'Maintenance Tech', value: 'maintenance_tech', icon: 'pi pi-wrench' },
        { label: 'PQC', value: 'pqc', icon: 'pi pi-shield' }
    ];

    // Qualification Warning Dialog (for non-qualified employees)
    showQualificationWarningDialog = false;
    pendingEmployeeAssignment: EmployeeWithAssignment | null = null;
    qualificationWarningMessage = '';
    pendingEmployeeData: any = null;
    pendingPrimaryAssignment: EmployeePrimaryAssignment | null = null;
    // Pending manual assignment data (for explicit workstation selection)
    pendingManualAssignmentData: {
        employee: any;
        qualificationCheck: QualificationCheckResult | null;
        isManualSelection: boolean;
        workstation: Workstation | null;
        machine: Machine | null;
    } | null = null;

    // Manual Workstation Selection (when no default assignment exists)
    showManualWorkstationSelection = false;

    // Explicit Assignment Dialog (new manual selection mode)
    showExplicitAssignmentDialog = false;
    availableWorkstationsForAssignment: Workstation[] = [];
    selectedWorkstationForAssignment: Workstation | null = null;
    selectedMachineForExplicitAssignment: Machine | null = null;
    filteredMachinesForExplicitAssignment: Machine[] = [];

    // Employee Image Viewer Dialog
    showImageViewerDialog = false;
    selectedEmployeeForImage: EmployeeWithAssignment | null = null;

    // Hour Production Dialog
    showHourDialog = false;
    selectedHourIndex: number | null = null;
    hourProductionInput: HourProductionInput = {
        output: 0,
        scrap: 0,
        hasDowntime: false,
        downtimes: [],
        downtime: {
            duration: 0,
            problemId: 0,
            comment: ''
        }
    };

    // Multiple Downtimes in Dialog
    showAddDowntimeForm = false;
    editingDowntimeDialogIndex: number | null = null;
    newDowntimeInput: { duration: number; problemId: number; machineId?: number; comment: string; id?: number } = {
        duration: 0,
        problemId: 0,
        machineId: undefined,
        comment: ''
    };

    // Downtime Dialog (for adding/editing downtime to existing hour)
    showDowntimeDialog = false;
    downtimeHourIndex: number | null = null;
    editingDowntimeIndex: number | null = null; // Track which downtime is being edited
    downtimeInput: DowntimeExtended = {
        Total_Downtime: 0,
        Id_DowntimeProblems: 0,
        Comment_Downtime: ''
    };

    // Per-Hour Team Confirmation
    showTeamConfirmationStep = true;
    teamConfirmed = false;
    currentHourTeam: EmployeeWithAssignment[] = [];
    employeeScanForHour = '';

    // Shift Report Dialog
    showShiftReportDialog = false;

    // ========== UX IMPROVEMENTS ==========
    // Stepper Navigation (workflow steps: 1=Setup, 2=Team, 3=Tracker)
    currentStep: WorkflowStep = 1;

    // Loading States for Skeleton
    isLoadingReferenceData = true;
    isLoadingTeamData = false;
    isLoadingHourData = false;

    // Mobile/Tablet Detection
    isMobileView = false;
    private readonly MOBILE_BREAKPOINT = 768;
    private readonly TABLET_BREAKPOINT = 1024;

    // Hour Production Drawer (mobile alternative to dialog)
    showHourDrawer = false;

    // Quick Entry Mode
    showQuickEntryForHour: number | null = null;

    // Smart Team Confirmation (auto-confirm after H1)
    showTeamModifyButton = false;

    // ========== END UX IMPROVEMENTS ==========

    // Real-time tracking
    currentTime: Date = new Date();
    hourProgress = 0;
    private timerSubscription?: Subscription;

    // Debouncing for Order No changes
    private orderNoChange$ = new Subject<string>();
    private destroy$ = new Subject<void>();
    isUpdatingOrderNo = false;

    // Flag to prevent circular reset when productType is set from part selection
    private isSettingProductTypeFromPart = false;

    // Mode (from query params)
    mode: 'new' | 'view' | 'edit' = 'new';
    loadedProductionId: number | null = null;

    // Session persistence key
    private readonly SESSION_STORAGE_KEY = 'dms_production_session';

    // Computed values
    get shiftTotalOutput(): number {
        return this.session.hours.reduce((sum, h) => sum + (h.output || 0), 0);
    }

    get shiftTotalTarget(): number {
        return this.session.hours.reduce((sum, h) => sum + h.target, 0);
    }

    get shiftOverallEfficiency(): number {
        if (this.shiftTotalTarget === 0) return 0;
        return Math.round((this.shiftTotalOutput / this.shiftTotalTarget) * 100);
    }

    get shiftTotalScrap(): number {
        return this.session.hours.reduce((sum, h) => sum + (h.scrap || 0), 0);
    }

    get shiftTotalDowntime(): number {
        return this.session.hours.reduce((sum, h) => sum + h.totalDowntime, 0);
    }

    get completedHours(): number {
        return this.session.hours.filter(h => h.status === 'completed').length;
    }

    // Helper to build full image URL for employee pictures
    getEmployeePictureUrl(picture: string | null | undefined): string {
        if (!picture) {
            return 'assets/images/avatar-default.png';
        }
        // If already a full URL or local asset, return as is
        if (picture.startsWith('http') || picture.startsWith('assets/')) {
            return picture;
        }
        // Otherwise, prepend the media URL
        return `${environment.mediaUrl}${picture}`;
    }

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private productionService: ProductionService,
        private employeeService: EmployeeService,
        private hrService: HRService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private authService: AuthService
    ) {
        // Initialize mobile detection
        this.checkMobileView();
    }

    // ========== UX IMPROVEMENT METHODS ==========

    /**
     * Listen for window resize to detect mobile/tablet view
     */
    @HostListener('window:resize', ['$event'])
    onResize(): void {
        this.checkMobileView();
    }

    /**
     * Check if current viewport is mobile or tablet
     */
    private checkMobileView(): void {
        if (typeof window !== 'undefined') {
            this.isMobileView = window.innerWidth <= this.TABLET_BREAKPOINT;
        }
    }

    /**
     * Get efficiency meter data for MeterGroup visualization
     */
    get efficiencyMeterData(): MeterItem[] {
        const efficiency = this.shiftOverallEfficiency;
        let color = '#EF4444'; // danger red
        if (efficiency >= 95) {
            color = '#10B981'; // success green
        } else if (efficiency >= 80) {
            color = '#F59E0B'; // warning amber
        }
        return [{ label: 'Efficiency', value: efficiency, color }];
    }

    /**
     * Navigate to a specific workflow step
     */
    goToStep(step: WorkflowStep): void {
        // Only allow forward navigation if previous steps are complete
        if (step === 2 && !this.session.isSetupComplete) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Setup Required',
                detail: 'Please complete shift setup first'
            });
            return;
        }
        if (step === 3 && !this.session.isTeamComplete) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Team Required',
                detail: 'Please assign team members first'
            });
            return;
        }
        this.currentStep = step;
    }

    /**
     * Update step based on session state
     */
    updateCurrentStep(): void {
        if (this.session.isSetupComplete && this.session.isTeamComplete) {
            this.currentStep = 3;
        } else if (this.session.isSetupComplete) {
            this.currentStep = 2;
        } else {
            this.currentStep = 1;
        }
    }

    /**
     * Toggle quick entry mode for a specific hour
     */
    toggleQuickEntry(hourIndex: number): void {
        if (this.showQuickEntryForHour === hourIndex) {
            this.showQuickEntryForHour = null;
        } else {
            this.showQuickEntryForHour = hourIndex;
            // Initialize quick output value
            if (this.session.hours[hourIndex]) {
                this.session.hours[hourIndex].quickOutput = this.session.hours[hourIndex].output;
                this.session.hours[hourIndex].quickEntryMode = true;
            }
        }
    }

    /**
     * Quick save hour production (simplified flow)
     */
    quickSaveHour(hourIndex: number): void {
        const hour = this.session.hours[hourIndex];
        if (!hour || hour.quickOutput === null || hour.quickOutput === undefined) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid Input',
                detail: 'Please enter an output value'
            });
            return;
        }

        // Use quick entry values
        hour.output = hour.quickOutput;
        hour.scrap = 0;
        hour.efficiency = hour.target > 0 ? Math.round((hour.output / hour.target) * 100) : 0;
        hour.status = 'completed';
        hour.quickEntryMode = false;

        // Copy team from previous hour or initial team
        if (hourIndex > 0 && this.session.hours[hourIndex - 1]?.team?.length > 0) {
            hour.team = [...this.session.hours[hourIndex - 1].team];
        } else {
            hour.team = [...this.team];
        }

        this.showQuickEntryForHour = null;

        // Save to backend
        this.saveHourProductionToBackend(hourIndex, hour.output, 0, []);
    }

    /**
     * Open full dialog from quick entry mode
     */
    openFullDialogFromQuickEntry(hourIndex: number): void {
        this.showQuickEntryForHour = null;
        if (this.session.hours[hourIndex]) {
            this.session.hours[hourIndex].quickEntryMode = false;
        }
        this.openHourDialog(hourIndex);
    }

    /**
     * Open hour drawer for mobile view
     */
    openHourDrawer(hourIndex: number): void {
        this.selectedHourIndex = hourIndex;
        this.initializeHourDialogData(hourIndex);
        this.initializeHourTeam(hourIndex);
        this.showHourDrawer = true;
    }

    /**
     * Close hour drawer
     */
    closeHourDrawer(): void {
        this.showHourDrawer = false;
        this.resetHourDialogState();
    }

    /**
     * Initialize hour dialog data (shared between dialog and drawer)
     */
    private initializeHourDialogData(hourIndex: number): void {
        const hour = this.session.hours[hourIndex];
        if (hour) {
            this.hourProductionInput = {
                output: hour.output || 0,
                scrap: hour.scrap || 0,
                hasDowntime: hour.totalDowntime > 0,
                downtimes: hour.downtimes.map(dt => ({
                    id: dt.id || dt.Id_Downtime,
                    duration: dt.Total_Downtime,
                    problemId: dt.Id_DowntimeProblems,
                    machineId: dt.machine,
                    comment: dt.Comment_Downtime
                }))
            };
        }
    }

    /**
     * Reset hour dialog state
     */
    private resetHourDialogState(): void {
        this.hourProductionInput = {
            output: 0,
            scrap: 0,
            hasDowntime: false,
            downtimes: []
        };
        this.teamConfirmed = false;
        this.showTeamConfirmationStep = true;
        this.showTeamModifyButton = false;
        this.showAddDowntimeForm = false;
        this.editingDowntimeDialogIndex = null;
    }

    /**
     * Get hour status label for mobile card view
     */
    getHourStatusLabelMobile(status: HourStatus): string {
        const labels: Record<HourStatus, string> = {
            'not_started': 'Not Started',
            'in_progress': 'In Progress',
            'completed': 'Completed'
        };
        return labels[status] || status;
    }

    /**
     * Save hour production to backend (shared method)
     */
    private saveHourProductionToBackend(hourIndex: number, output: number, scrap: number, downtimes: any[]): void {
        // This method will be called by both quick save and full dialog save
        // Implementation is already in saveHourProduction method
        this.selectedHourIndex = hourIndex;
        this.hourProductionInput.output = output;
        this.hourProductionInput.scrap = scrap;
        this.hourProductionInput.downtimes = downtimes;
        // Trigger existing save logic
        // Note: The actual save is handled by the existing saveHourProduction method
    }

    // ========== END UX IMPROVEMENT METHODS ==========

    ngOnInit(): void {
        this.initForms();
        this.loadReferenceData();
        this.startRealTimeUpdates();
        this.checkQueryParams();

        // Restore session from localStorage if no query params
        if (!this.route.snapshot.queryParams['id']) {
            setTimeout(() => {
                if (this.hasSavedSession()) {
                    this.restoreSessionFromStorage();
                }
            }, 1500);
        }

        // Setup debounced Order No change handler
        this.orderNoChange$.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.saveSessionToStorage();
            this.updateExistingRecordsOrderNo();
        });
    }

    checkQueryParams(): void {
        this.route.queryParams.subscribe(params => {
            console.log('Query params received:', params);

            if (params['id']) {
                // Handle both numeric IDs and string IDs
                const idValue = params['id'];
                if (!isNaN(Number(idValue))) {
                    this.loadedProductionId = Number(idValue);
                    // Set mode to view if not explicitly provided (fixes hidden button issue)
                    if (!params['mode']) {
                        this.mode = 'view';
                    }
                } else {
                    console.warn('Invalid production ID format:', idValue);
                    this.loadedProductionId = null;
                }
            }
            if (params['mode']) {
                this.mode = params['mode'] as 'view' | 'edit';
            }

            // If we have all params, load production data after reference data is loaded
            if (params['shift'] && params['date'] && params['line'] && params['part']) {
                this.loadProductionFromParams(params);
            }
            // If only lineId is provided (from dashboard click), pre-select the line
            else if (params['lineId']) {
                this.preSelectProductionLine(+params['lineId']);
            }
        });
    }

    /**
     * Pre-select production line when coming from dashboard
     */
    preSelectProductionLine(lineId: number): void {
        // Wait for reference data to load
        setTimeout(() => {
            this.productionService.getProductionLines().subscribe(lines => {
                const line = lines.find(l => l.id === lineId);
                if (!line) {
                    console.warn('Production line not found:', lineId);
                    return;
                }

                // Find the project for this line
                const project = this.projects.find(p => p.Id_Project === line.projectId);
                if (!project) {
                    console.warn('Project not found for line:', line);
                    return;
                }

                // Set today's date
                this.shiftSetupForm.patchValue({ date: new Date() });

                // Pre-select project
                this.shiftSetupForm.patchValue({ project: project });
                this.session.project = project;

                // Load and set production lines for this project
                this.productionLines = lines.filter(l => l.projectId === project.Id_Project);

                // Pre-select the production line
                this.shiftSetupForm.patchValue({ productionLine: line });
                this.session.productionLine = line;

                // Load related data
                this.loadParts(project.Id_Project);
                this.loadWorkstationsByProject(project.Id_Project);
                this.loadMachines(line.id);
                this.loadShiftsForProductionLine(line.id);

                this.messageService.add({
                    severity: 'info',
                    summary: 'Production Line Selected',
                    detail: `Pre-selected "${line.name}" from ${project.Name_Project}. Please complete the setup.`,
                    life: 5000
                });
            });
        }, 800);
    }

    loadProductionFromParams(params: any): void {
        // Wait a bit for reference data to load
        setTimeout(() => {
            const shiftId = +params['shift'];
            const lineId = +params['line'];
            const partId = +params['part'];
            const dateStr = params['date'];
            const hourNumber = params['hour'] ? +params['hour'] : null;

            // Find shift
            const shift = this.shifts.find(s => s.id === shiftId);
            if (!shift) {
                console.warn('Shift not found:', shiftId);
                return;
            }

            // Find production line and its project
            this.productionService.getProductionLines().subscribe(lines => {
                const line = lines.find(l => l.id === lineId);
                if (!line) {
                    console.warn('Production line not found:', lineId);
                    return;
                }

                // Find project
                const project = this.projects.find(p => p.Id_Project === line.projectId);
                if (!project) {
                    console.warn('Project not found for line:', line);
                    return;
                }

                // Load parts for this project
                this.productionService.getParts(project.Id_Project).subscribe(parts => {
                    const part = parts.find(p => p.Id_Part === partId);
                    if (!part) {
                        console.warn('Part not found:', partId);
                        return;
                    }

                    // Load production lines for dropdown
                    this.productionLines = lines.filter(l => l.projectId === project.Id_Project);
                    this.parts = parts;

                    // Set form values
                    const dateValue = new Date(dateStr);
                    this.shiftSetupForm.patchValue({
                        shift: shift,
                        date: dateValue,
                        project: project,
                        productionLine: line,
                        partNumber: part
                    });

                    // Load workstations for this project
                    this.loadWorkstationsByProject(project.Id_Project);

                    // Auto-complete the setup
                    this.session.shift = shift;
                    this.session.date = dateValue;
                    this.session.project = project;
                    this.session.productionLine = line;
                    this.session.part = part;
                    this.session.isSetupComplete = true;

                    // Generate hours for the shift
                    this.session.hours = this.generateShiftHours(shift, part);

                    // Load ALL hourly productions for this shift/date/line/part
                    this.loadAllHourlyProductionsForShift(dateStr, shiftId, lineId, partId, hourNumber);

                    this.messageService.add({
                        severity: 'info',
                        summary: 'Production Loaded',
                        detail: `Loaded production data for ${shift.name} on ${dateStr}`
                    });
                });
            });
        }, 500);
    }

    loadAllHourlyProductionsForShift(dateStr: string, shiftId: number, lineId: number, partId: number, selectedHour: number | null): void {
        // Format date to YYYY-MM-DD if it's not already
        let formattedDate = dateStr;
        if (dateStr && dateStr.includes(' ')) {
            // It's a Date string like "Tue Nov 25 2025...", convert to YYYY-MM-DD
            const dateObj = new Date(dateStr);
            formattedDate = dateObj.toISOString().split('T')[0];
        }

        // Load all hourly productions for this shift
        this.productionService.getHourlyProductions({
            date: formattedDate,
            shift: shiftId,
            lineId: lineId,
            partId: partId
        }).subscribe({
            next: (productions) => {
                console.log('Loaded productions for shift:', productions);

                // Update session hours with loaded data
                productions.forEach(prod => {
                    const hourIndex = this.session.hours.findIndex(h => h.hour === prod.Hour_HourlyProd);
                    if (hourIndex >= 0) {
                        this.session.hours[hourIndex].output = prod.Result_HourlyProdPN;
                        this.session.hours[hourIndex].scrap = prod.Scrap_HourlyProdPN || 0;
                        this.session.hours[hourIndex].status = 'completed';
                        this.session.hours[hourIndex].efficiency =
                            prod.Target_HourlyProdPN > 0
                                ? Math.round((prod.Result_HourlyProdPN / prod.Target_HourlyProdPN) * 100)
                                : 0;
                        this.session.hours[hourIndex].hourlyProductionId = prod.Id_HourlyProd;

                        // Map hour_type from backend to hourType
                        // Prefer hour_type (explicit value) over shift_type_code (derived from FK)
                        const backendHourType = (prod as any).hour_type || (prod as any).shift_type_code;
                        console.log(`Hour ${prod.Hour_HourlyProd}: backend hour_type=${(prod as any).hour_type}, shift_type_code=${(prod as any).shift_type_code}`);
                        if (backendHourType && this.isHourTypeInOptions(backendHourType)) {
                            this.session.hours[hourIndex].hourType = backendHourType as HourType;
                        }

                        // Load downtimes for this hour
                        this.loadDowntimesForHour(hourIndex, prod.Id_HourlyProd);
                    }
                });

                // Mark team as complete if we have productions
                if (productions.length > 0) {
                    // Load team assignments for each hour separately
                    // This properly populates both hour.team and session.team
                    const headcount = productions[0].HC_HourlyProdPN || 0;
                    this.loadTeamAssignmentsPerHour(productions, headcount);
                } else {
                    // No productions found - preserve team from localStorage/session
                    console.log('No productions found in DB - preserving existing team');
                    if (this.session.team && this.session.team.length > 0) {
                        // Team already restored from localStorage, ensure teamState is in sync
                        if (this.teamState.team().length === 0) {
                            console.log('Syncing session.team to teamState:', this.session.team.length, 'members');
                            this.teamState.setTeam(this.session.team);
                        }
                        this.session.isTeamComplete = true;
                    } else {
                        // Try loading from localStorage as fallback
                        const localStorageTeam = this.teamState.loadFromLocalStorage();
                        if (localStorageTeam && localStorageTeam.length > 0) {
                            console.log('Restored team from localStorage:', localStorageTeam.length, 'members');
                            this.session.team = localStorageTeam;
                            this.session.isTeamComplete = true;
                        }
                    }
                }

                // Open the selected hour dialog if in edit mode
                if (selectedHour !== null && this.mode === 'edit') {
                    const hourIndex = this.session.hours.findIndex(h => h.hour === selectedHour);
                    if (hourIndex >= 0) {
                        setTimeout(() => this.openHourDialog(hourIndex), 500);
                    }
                }
            },
            error: (err) => {
                console.error('Error loading hourly productions:', err);
            }
        });
    }

    loadDowntimesForHour(hourIndex: number, hourlyProductionId: number): void {
        this.productionService.getDowntimes(hourlyProductionId).subscribe({
            next: (downtimes) => {
                if (downtimes && downtimes.length > 0) {
                    const totalDowntime = downtimes.reduce((sum, d) => sum + (d.Total_Downtime || 0), 0);
                    this.session.hours[hourIndex].totalDowntime = totalDowntime;
                    this.session.hours[hourIndex].downtimes = downtimes.map(d => ({
                        id: d.Id_Downtime,
                        Id_Downtime: d.Id_Downtime,
                        Total_Downtime: d.Total_Downtime,
                        Comment_Downtime: d.Comment_Downtime,
                        Id_DowntimeProblems: d.Id_DowntimeProblems,
                        Id_HourlyProd: hourlyProductionId,
                        problemName: (d as any).problem_name || 'Unknown'
                    }));
                }
            },
            error: (err) => {
                console.error('Error loading downtimes for hour:', hourIndex, err);
            }
        });
    }

    loadTeamAssignmentsForProduction(hourlyProductionId: number): void {
        this.productionService.getTeamAssignments(hourlyProductionId).subscribe({
            next: (assignments) => {
                console.log('Loaded team assignments:', assignments);
                if (assignments && assignments.length > 0) {
                    // Convert assignments to team members
                    assignments.forEach(assignment => {
                        const empId = assignment.Id_Emp;
                        if (!empId) {
                            console.warn('No employee ID in assignment:', assignment);
                            return;
                        }

                        // Load employee details
                        this.employeeService.getEmployee(empId).subscribe({
                            next: (employee: any) => {
                                console.log('Loaded employee:', employee);
                                const workstation = this.workstations.find(w => w.Id_Workstation === assignment.Id_Workstation);

                                // Handle both backend format (snake_case) and frontend format (CamelCase)
                                const newMember: EmployeeWithAssignment = {
                                    Id_Emp: employee.id || employee.Id_Emp,
                                    Nom_Emp: employee.last_name || employee.Nom_Emp || '',
                                    Prenom_Emp: employee.first_name || employee.Prenom_Emp || '',
                                    DateNaissance_Emp: employee.birth_date || employee.DateNaissance_Emp || new Date(),
                                    Genre_Emp: employee.gender || employee.Genre_Emp || 'M',
                                    Categorie_Emp: employee.category || employee.Categorie_Emp || 'operator',
                                    DateEmbauche_Emp: employee.hire_date || employee.DateEmbauche_Emp || new Date(),
                                    Departement_Emp: employee.department || employee.Departement_Emp || 'Production',
                                    Picture: this.getEmployeePictureUrl(employee.picture || employee.Picture),
                                    EmpStatus: employee.status || employee.EmpStatus || 'active',
                                    workstation: workstation?.Name_Workstation || 'Unknown',
                                    qualification: employee.current_qualification || 'Not Qualified',
                                    qualificationLevel: employee.current_qualification ? 1 : 0
                                };

                                // Avoid duplicates
                                if (!this.session.team.find(t => t.Id_Emp === newMember.Id_Emp)) {
                                    this.session.team.push(newMember);
                                    console.log('Added team member:', newMember);
                                }
                            },
                            error: (err) => {
                                console.error('Error loading employee:', empId, err);
                            }
                        });
                    });
                }
            },
            error: (err) => {
                console.error('Error loading team assignments:', err);
            }
        });
    }

    loadTeamAssignmentsFromAllProductions(hourlyProductionIds: number[], headcount: number = 0): void {
        // Track loaded employee IDs to avoid duplicates
        const loadedEmployeeIds = new Set<number>();
        let totalAssignmentsFound = 0;
        let completedRequests = 0;

        // Load team assignments from each hourly production
        hourlyProductionIds.forEach(prodId => {
            this.productionService.getTeamAssignments(prodId).subscribe({
                next: (assignments) => {
                    console.log(`Loaded team assignments for production ${prodId}:`, assignments);
                    completedRequests++;
                    totalAssignmentsFound += assignments?.length || 0;

                    if (assignments && assignments.length > 0) {
                        assignments.forEach(assignment => {
                            const empId = assignment.Id_Emp;

                            // Skip if we've already processed this employee
                            if (!empId || loadedEmployeeIds.has(empId)) {
                                return;
                            }
                            loadedEmployeeIds.add(empId);

                            // Load employee details
                            this.employeeService.getEmployee(empId).subscribe({
                                next: (employee: any) => {
                                    console.log('Loaded employee:', employee);
                                    const workstation = this.workstations.find(w => w.Id_Workstation === assignment.Id_Workstation);

                                    // Handle both backend format (snake_case) and frontend format (CamelCase)
                                    const newMember: EmployeeWithAssignment = {
                                        Id_Emp: employee.id || employee.Id_Emp,
                                        Nom_Emp: employee.last_name || employee.Nom_Emp || '',
                                        Prenom_Emp: employee.first_name || employee.Prenom_Emp || '',
                                        DateNaissance_Emp: employee.birth_date || employee.DateNaissance_Emp || new Date(),
                                        Genre_Emp: employee.gender || employee.Genre_Emp || 'M',
                                        Categorie_Emp: employee.category || employee.Categorie_Emp || 'operator',
                                        DateEmbauche_Emp: employee.hire_date || employee.DateEmbauche_Emp || new Date(),
                                        Departement_Emp: employee.department || employee.Departement_Emp || 'Production',
                                        Picture: this.getEmployeePictureUrl(employee.picture || employee.Picture),
                                        EmpStatus: employee.status || employee.EmpStatus || 'active',
                                        workstation: workstation?.Name_Workstation || 'Unknown',
                                        qualification: employee.current_qualification || 'Not Qualified',
                                        qualificationLevel: employee.current_qualification ? 1 : 0
                                    };

                                    // Avoid duplicates in session team AND sync to teamState
                                    if (!this.session.team.find(t => t.Id_Emp === newMember.Id_Emp)) {
                                        this.session.team.push(newMember);
                                        // IMPORTANT: Also sync to teamState for reactive UI updates
                                        this.teamState.addMember(newMember);
                                        console.log('Added team member to session and teamState:', newMember);
                                    }
                                },
                                error: (err) => {
                                    console.error('Error loading employee:', empId, err);
                                }
                            });
                        });
                    }

                    // After all requests complete, check if we found any assignments
                    if (completedRequests === hourlyProductionIds.length && totalAssignmentsFound === 0 && headcount > 0) {
                        // No team assignments in database but headcount was recorded
                        // Try to restore team from localStorage first
                        const localStorageTeam = this.teamState.loadFromLocalStorage();
                        if (localStorageTeam && localStorageTeam.length > 0) {
                            console.log('No DB assignments, but found team in localStorage:', localStorageTeam.length, 'members');
                            this.session.team = localStorageTeam;
                            this.session.isTeamComplete = true;
                            // Sync to teamState for reactive UI updates
                            this.teamState.setTeam(localStorageTeam);
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Team Restored',
                                detail: `${localStorageTeam.length} team members restored from local session.`,
                                life: 5000
                            });
                        } else {
                            // No localStorage team either - show info message
                            this.session.isTeamComplete = false;
                            this.messageService.add({
                                severity: 'info',
                                summary: 'Team Data Not Available',
                                detail: `This production was recorded with ${headcount} team members, but individual assignments were not saved. You can re-assign the team if needed.`,
                                life: 8000
                            });
                        }
                    }
                },
                error: (err) => {
                    console.error(`Error loading team assignments for production ${prodId}:`, err);
                    completedRequests++;
                }
            });
        });
    }

    /**
     * Load team assignments for each hour separately and populate hour.team
     * This method properly separates shift-level team from hour-level team assignments
     */
    loadTeamAssignmentsPerHour(productions: any[], headcount: number = 0): void {
        // Track all unique employees across all hours for shift-level team
        const allEmployeeIds = new Set<number>();
        let totalAssignmentsFound = 0;
        let completedRequests = 0;
        const totalRequests = productions.length;

        // If no productions, nothing to load
        if (totalRequests === 0) {
            return;
        }

        // Load team assignments for each hourly production
        productions.forEach(prod => {
            const hourlyProductionId = prod.Id_HourlyProd;
            const hourNumber = prod.Hour_HourlyProd;

            // Find the corresponding hour in session
            const hourIndex = this.session.hours.findIndex(h => h.hour === hourNumber);

            this.productionService.getTeamAssignments(hourlyProductionId).subscribe({
                next: (assignments) => {
                    console.log(`Loaded team assignments for hour ${hourNumber} (prod ${hourlyProductionId}):`, assignments?.length || 0);
                    completedRequests++;
                    totalAssignmentsFound += assignments?.length || 0;

                    if (assignments && assignments.length > 0 && hourIndex >= 0) {
                        // Initialize hour team array if not exists
                        if (!this.session.hours[hourIndex].team) {
                            this.session.hours[hourIndex].team = [];
                        }

                        // Load each employee for this hour
                        assignments.forEach(assignment => {
                            const empId = assignment.Id_Emp || assignment.employee;
                            if (!empId) return;

                            // Track for shift-level team
                            allEmployeeIds.add(empId);

                            // Load employee details for additional fields (picture, qualification, etc.)
                            this.employeeService.getEmployee(empId).subscribe({
                                next: (employee: any) => {
                                    // Parse employee name from assignment (format: "FirstName LastName")
                                    const nameParts = (assignment.employee_name || '').split(' ');
                                    const firstName = nameParts[0] || employee.first_name || employee.Prenom_Emp || '';
                                    const lastName = nameParts.slice(1).join(' ') || employee.last_name || employee.Nom_Emp || '';

                                    const newMember: EmployeeWithAssignment = {
                                        Id_Emp: employee.id || employee.Id_Emp,
                                        Nom_Emp: lastName,
                                        Prenom_Emp: firstName,
                                        DateNaissance_Emp: employee.birth_date || employee.DateNaissance_Emp || new Date(),
                                        Genre_Emp: employee.gender || employee.Genre_Emp || 'M',
                                        Categorie_Emp: employee.category || employee.Categorie_Emp || 'operator',
                                        DateEmbauche_Emp: employee.hire_date || employee.DateEmbauche_Emp || new Date(),
                                        Departement_Emp: employee.department || employee.Departement_Emp || 'Production',
                                        Picture: this.getEmployeePictureUrl(employee.picture || employee.Picture),
                                        EmpStatus: employee.status || employee.EmpStatus || 'active',
                                        // Use badge number from assignment (employee_id field) or employee data
                                        BadgeNumber: assignment.employee_id || employee.badge_number || employee.BadgeNumber || employee.employee_id,
                                        badgeId: assignment.employee_id || employee.badge_number || employee.BadgeNumber || employee.employee_id,
                                        // Use workstation name directly from assignment
                                        workstation: assignment.workstation_name || 'Unknown',
                                        workstationId: assignment.Id_Workstation,
                                        // Use machine data directly from assignment
                                        machine: assignment.machine_name || undefined,
                                        machineId: assignment.machine_id || undefined,
                                        // Use qualification from employee data
                                        qualification: employee.current_qualification || employee.current_qualification_name || 'Not Qualified',
                                        qualificationLevel: employee.current_qualification_level || (employee.current_qualification ? 1 : 0)
                                    };

                                    // Add to hour-specific team (avoid duplicates)
                                    if (!this.session.hours[hourIndex].team.find(t => t.Id_Emp === newMember.Id_Emp)) {
                                        this.session.hours[hourIndex].team.push(newMember);
                                        console.log(`Added team member ${newMember.Prenom_Emp} ${newMember.Nom_Emp} to hour ${hourNumber}`);
                                    }

                                    // Also add to shift-level team (avoid duplicates)
                                    if (!this.session.team.find(t => t.Id_Emp === newMember.Id_Emp)) {
                                        this.session.team.push(newMember);
                                        this.teamState.addMember(newMember);
                                    }
                                },
                                error: (err) => {
                                    console.error(`Error loading employee ${empId} for hour ${hourNumber}:`, err);
                                }
                            });
                        });
                    }

                    // After all requests complete, check if we need to show message
                    this.checkTeamLoadingComplete(completedRequests, totalRequests, totalAssignmentsFound, headcount);
                },
                error: (err) => {
                    console.error(`Error loading team assignments for hour ${hourNumber}:`, err);
                    completedRequests++;
                    this.checkTeamLoadingComplete(completedRequests, totalRequests, totalAssignmentsFound, headcount);
                }
            });
        });
    }

    /**
     * Check if team loading is complete and show appropriate message
     */
    private checkTeamLoadingComplete(completedRequests: number, totalRequests: number, totalAssignmentsFound: number, headcount: number): void {
        if (completedRequests !== totalRequests) {
            return; // Not all requests completed yet
        }

        console.log(`Team loading complete: ${totalAssignmentsFound} total assignments found, headcount was ${headcount}`);
        console.log(`Current session.team length: ${this.session.team?.length || 0}, teamState length: ${this.teamState.team().length}`);

        if (totalAssignmentsFound === 0 && headcount > 0) {
            // No team assignments in database but headcount was recorded
            // Try to restore team from localStorage first
            const localStorageTeam = this.teamState.loadFromLocalStorage();
            if (localStorageTeam && localStorageTeam.length > 0) {
                console.log('No DB assignments, but found team in localStorage:', localStorageTeam.length, 'members');
                this.session.team = localStorageTeam;
                this.session.isTeamComplete = true;
                this.teamState.setTeam(localStorageTeam);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Team Restored',
                    detail: `${localStorageTeam.length} team members restored from local session.`,
                    life: 5000
                });
            } else {
                // No localStorage team either - show info message
                this.session.isTeamComplete = false;
                this.messageService.add({
                    severity: 'info',
                    summary: 'Team Data Not Available',
                    detail: `This production was recorded with ${headcount} team members, but individual assignments were not saved. You can re-assign the team if needed.`,
                    life: 8000
                });
            }
        } else if (totalAssignmentsFound === 0 && headcount === 0) {
            // No team assignments in DB and no headcount recorded
            // Preserve existing team from session/localStorage if available
            if (this.session.team && this.session.team.length > 0) {
                console.log('Preserving existing session team:', this.session.team.length, 'members');
                // Ensure teamState is in sync
                if (this.teamState.team().length === 0) {
                    this.teamState.setTeam(this.session.team);
                }
                this.session.isTeamComplete = true;
            } else {
                // Try to load from localStorage as fallback
                const localStorageTeam = this.teamState.loadFromLocalStorage();
                if (localStorageTeam && localStorageTeam.length > 0) {
                    console.log('No DB or session team, restored from localStorage:', localStorageTeam.length, 'members');
                    this.session.team = localStorageTeam;
                    this.session.isTeamComplete = true;
                    this.teamState.setTeam(localStorageTeam);
                }
            }
        } else if (totalAssignmentsFound > 0) {
            this.session.isTeamComplete = true;
            this.messageService.add({
                severity: 'success',
                summary: 'Team Loaded',
                detail: `${this.session.team.length} team members loaded from database.`,
                life: 3000
            });
        }
    }

    /**
     * Save team assignments for an hourly production
     * @param hourlyProductionId - The ID of the hourly production
     * @param teamToSave - The team to save (passed explicitly to avoid race conditions)
     */
    saveTeamAssignmentsForHour(hourlyProductionId: number, teamToSave: EmployeeWithAssignment[]): void {
        console.log('saveTeamAssignmentsForHour called. Production ID:', hourlyProductionId, 'Team size:', teamToSave.length);

        if (teamToSave.length === 0) {
            console.warn('No team members to save for hourly production:', hourlyProductionId);
            return;
        }

        // First, get existing assignments for this hourly production
        this.productionService.getTeamAssignments(hourlyProductionId).subscribe({
            next: (existingAssignments) => {
                const existingEmployeeIds = new Set(existingAssignments.map(a => a.employee || a.Id_Emp));
                console.log('Existing assignments:', existingAssignments.length, 'New to add:', teamToSave.filter(m => !existingEmployeeIds.has(m.Id_Emp)).length);

                // Only create assignments for employees not already assigned
                teamToSave.forEach(member => {
                    if (existingEmployeeIds.has(member.Id_Emp)) {
                        console.log(`Employee ${member.Id_Emp} already assigned, skipping...`);
                        return;
                    }

                    // Find the workstation ID - prioritize stored ID, then name lookup, then default
                    let workstationId: number | undefined;

                    // First use the stored workstationId from the member
                    if (member.workstationId) {
                        workstationId = member.workstationId;
                        console.log(`Using member's stored workstationId: ${workstationId}`);
                    }

                    // If not available, try to find by workstation name
                    if (!workstationId && member.workstation && this.workstations.length > 0) {
                        const workstation = this.workstations.find(w => w.Name_Workstation === member.workstation);
                        workstationId = workstation?.Id_Workstation;
                        if (workstationId) {
                            console.log(`Found workstation by name: ${member.workstation} (ID: ${workstationId})`);
                        }
                    }

                    // If still not found, use the first available workstation from the list
                    if (!workstationId && this.workstations.length > 0) {
                        workstationId = this.workstations[0].Id_Workstation;
                        console.log(`Using default workstation: ${this.workstations[0].Name_Workstation} (ID: ${workstationId})`);
                    }

                    // If still no workstation, try to get it from the selected line
                    if (!workstationId) {
                        const selectedLine = this.shiftSetupForm.get('productionLine')?.value;
                        if (selectedLine?.id) {
                            console.error(`Cannot save team assignment for employee ${member.Id_Emp}: No workstations loaded. Try loading workstations first.`);
                            // Skip this assignment but don't block others
                        } else {
                            console.error(`Cannot save team assignment for employee ${member.Id_Emp}: No production line selected`);
                        }
                        return;
                    }

                    const assignmentData: any = {
                        hourly_production: hourlyProductionId,
                        employee: member.Id_Emp,
                        workstation: workstationId
                    };

                    // Add machine if assigned
                    if (member.machineId) {
                        assignmentData.machine = member.machineId;
                    }

                    console.log('Creating team assignment:', assignmentData);

                    this.productionService.createTeamAssignment(assignmentData).subscribe({
                        next: (response) => {
                            console.log('Team assignment saved successfully:', response);
                        },
                        error: (err) => {
                            // Silently handle duplicate errors (race condition)
                            if (err.status === 400 && err.error?.non_field_errors) {
                                console.log('Team assignment already exists (race condition), skipping...');
                            } else {
                                console.error('Error saving team assignment:', err.error || err);
                            }
                        }
                    });
                });
            },
            error: (err) => {
                console.error('Error fetching existing team assignments:', err);
                // Fallback: try to create all assignments anyway
                this.createAllTeamAssignments(hourlyProductionId, teamToSave);
            }
        });
    }

    private createAllTeamAssignments(hourlyProductionId: number, teamToCreate: EmployeeWithAssignment[]): void {
        console.log('createAllTeamAssignments called. Production ID:', hourlyProductionId, 'Team size:', teamToCreate.length);

        if (teamToCreate.length === 0) {
            console.warn('No team members to create assignments for production:', hourlyProductionId);
            return;
        }

        teamToCreate.forEach(member => {
            // Find the workstation ID - prioritize stored ID, then name lookup, then default
            let workstationId: number | undefined;

            // First use the stored workstationId from the member
            if (member.workstationId) {
                workstationId = member.workstationId;
                console.log(`Using member's stored workstationId: ${workstationId}`);
            }

            // If not available, try to find by workstation name
            if (!workstationId && member.workstation && this.workstations.length > 0) {
                const workstation = this.workstations.find(w => w.Name_Workstation === member.workstation);
                workstationId = workstation?.Id_Workstation;
                if (workstationId) {
                    console.log(`Found workstation by name: ${member.workstation} (ID: ${workstationId})`);
                }
            }

            // If still not found, use the first available workstation from the list
            if (!workstationId && this.workstations.length > 0) {
                workstationId = this.workstations[0].Id_Workstation;
                console.log(`Using default workstation: ${this.workstations[0].Name_Workstation} (ID: ${workstationId})`);
            }

            // If still no workstation, skip this assignment
            if (!workstationId) {
                console.error(`Cannot create team assignment for employee ${member.Id_Emp}: No workstation available`);
                return;
            }

            const assignmentData: any = {
                hourly_production: hourlyProductionId,
                employee: member.Id_Emp,
                workstation: workstationId
            };

            // Add machine if assigned
            if (member.machineId) {
                assignmentData.machine = member.machineId;
            }

            this.productionService.createTeamAssignment(assignmentData).subscribe({
                next: (response) => console.log('Team assignment saved:', response),
                error: (err) => console.error('Error creating team assignment:', err.error || err)
            });
        });
    }

    ngOnDestroy(): void {
        this.timerSubscription?.unsubscribe();
        this.destroy$.next();
        this.destroy$.complete();
    }

    startRealTimeUpdates(): void {
        this.timerSubscription = interval(1000).subscribe(() => {
            this.currentTime = new Date();
            this.updateHourProgress();
        });
    }

    updateHourProgress(): void {
        const minutes = this.currentTime.getMinutes();
        this.hourProgress = Math.round((minutes / 60) * 100);
    }

    getCurrentHour(): number {
        const hour = this.currentTime.getHours();
        // Map to shift hour (assuming morning shift starts at 6)
        if (hour >= 6 && hour < 14) {
            return hour - 5;
        } else if (hour >= 14 && hour < 22) {
            return hour - 13;
        }
        return hour >= 22 ? hour - 21 : hour + 3;
    }

    // ==================== FORMS ====================

    initForms(): void {
        this.shiftSetupForm = this.fb.group({
            shift: [null, Validators.required],
            date: [new Date(), Validators.required],
            project: [null, Validators.required],
            productionLine: [null],  // Required only for finished_good
            process: [null],         // Required only for semi_finished
            productType: [null],     // Optional filter for parts by Semi-Finished or Finished Good
            partNumber: [null, Validators.required],
            zone: [null]
        });

        // Watch for project changes
        this.shiftSetupForm.get('project')?.valueChanges.subscribe((project: Project) => {
            if (project) {
                // Reset child controls first WITHOUT triggering their valueChanges
                this.shiftSetupForm.patchValue(
                    { productionLine: null, process: null, productType: null, partNumber: null },
                    { emitEvent: false }
                );
                // Clear machines (line-specific)
                this.machines = [];
                // Load data for this project (both production lines and processes initially)
                this.loadProductionLines(project.Id_Project);
                this.loadProcesses(project.Id_Project);
                this.loadParts(project.Id_Project);
                // Load workstations for all production lines of this project
                this.loadWorkstationsByProject(project.Id_Project);
            } else {
                // Clear all dependent data
                this.productionLines = [];
                this.processes = [];
                this.parts = [];
                this.workstations = [];
                this.machines = [];
            }
        });

        // Watch for productType changes to update validation dynamically
        this.shiftSetupForm.get('productType')?.valueChanges.subscribe((type: string | null) => {
            this.updateValidationByProductType(type);
        });

        // Watch for production line changes
        this.shiftSetupForm.get('productionLine')?.valueChanges.subscribe((line: ProductionLine) => {
            if (line) {
                // Note: Workstations are already loaded by project (loadWorkstationsByProject)
                // No need to reload them by line - this would overwrite the project filter
                this.loadMachines(line.id);
                this.loadShiftsForProductionLine(line.id);
            }
        });

        // Watch for process changes - load parts by process for semi-finished
        this.shiftSetupForm.get('process')?.valueChanges.subscribe((process: Process) => {
            if (process) {
                this.onProcessChange();
            }
        });

        // Watch for partNumber changes - auto-set productType from part's product_type
        this.shiftSetupForm.get('partNumber')?.valueChanges.subscribe((part: Part) => {
            if (part?.product_type) {
                // Set flag to prevent onProductTypeChange() from resetting partNumber
                // This is needed because PrimeNG's (onChange) event still fires even with emitEvent: false
                this.isSettingProductTypeFromPart = true;
                this.shiftSetupForm.get('productType')?.setValue(part.product_type, { emitEvent: false });
                // Manually update validation since emitEvent is false
                this.updateValidationByProductType(part.product_type);
                // Reset flag after a longer delay to guarantee PrimeNG's async change detection completes
                // Using Promise.resolve().then() + setTimeout ensures we wait for both microtask and macrotask queues
                Promise.resolve().then(() => {
                    setTimeout(() => {
                        this.isSettingProductTypeFromPart = false;
                    }, 50);
                });
            }
        });

        // Watch for date changes - keep session.date in sync with form
        this.shiftSetupForm.get('date')?.valueChanges.subscribe((date: Date) => {
            if (date) {
                this.session.date = date;
                console.log('Session date updated to:', date);
            }
        });
    }

    /**
     * Update validation rules based on product type selection
     * - semi_finished: requires process, not production line
     * - finished_good: requires production line, not process
     * - null/undefined: both optional
     */
    updateValidationByProductType(productType: string | null): void {
        const lineControl = this.shiftSetupForm.get('productionLine');
        const processControl = this.shiftSetupForm.get('process');

        if (productType === 'semi_finished') {
            lineControl?.clearValidators();
            processControl?.setValidators([Validators.required]);
        } else if (productType === 'finished_good') {
            lineControl?.setValidators([Validators.required]);
            processControl?.clearValidators();
        } else {
            // No product type selected - both optional
            lineControl?.clearValidators();
            processControl?.clearValidators();
        }

        lineControl?.updateValueAndValidity();
        processControl?.updateValueAndValidity();
    }

    loadReferenceData(): void {
        // Set loading state for skeleton display
        this.isLoadingReferenceData = true;

        // Use forkJoin to load all reference data in parallel
        forkJoin({
            shifts: this.productionService.getShifts(),
            projects: this.productionService.getProjects(),
            downtimeProblems: this.productionService.getDowntimeProblems(),
            shiftTypes: this.productionService.getActiveShiftTypes(),
            zones: this.productionService.getActiveZones()
        }).subscribe({
            next: (results) => {
                this.shifts = results.shifts;
                this.projects = results.projects;
                this.downtimeProblems = results.downtimeProblems;
                this.zones = results.zones;

                // Process shift types
                this.shiftTypes = results.shiftTypes;
                console.log('Loaded shift types:', results.shiftTypes);
                if (results.shiftTypes && results.shiftTypes.length > 0) {
                    this.hourTypeOptions = results.shiftTypes.map(st => ({
                        label: `${st.name} (${st.target_percentage}%)`,
                        value: st.name
                    }));
                    console.log('Updated hourTypeOptions:', this.hourTypeOptions);
                    // Synchronize existing hours with valid shift type codes (with delay to ensure hours are loaded)
                    setTimeout(() => this.syncHoursWithShiftTypes(), 100);
                }

                // Clear loading state
                this.isLoadingReferenceData = false;
            },
            error: (err) => {
                console.error('Error loading reference data:', err);
                this.isLoadingReferenceData = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Loading Error',
                    detail: 'Failed to load reference data. Please refresh the page.'
                });
            }
        });
    }

    loadProductionLines(projectId: number): void {
        this.productionService.getProductionLines(projectId).subscribe(lines => {
            this.productionLines = lines;
            // patchValue removed - now handled in project valueChanges with emitEvent: false
        });
    }

    loadParts(projectId: number, productType?: string): void {
        this.productionService.getParts(projectId, productType).subscribe(parts => {
            this.parts = parts;
            // patchValue removed - now handled in project valueChanges with emitEvent: false
        });
    }

    onProductTypeChange(): void {
        // Skip reset if productType was set programmatically from part selection
        // This prevents a circular reset bug where selecting a part auto-sets productType,
        // which triggers this method and clears the just-selected part
        if (this.isSettingProductTypeFromPart) {
            return;
        }

        const project = this.shiftSetupForm.get('project')?.value;
        const productType = this.shiftSetupForm.get('productType')?.value;

        // Reset dependent fields when product type changes
        this.shiftSetupForm.patchValue({
            productionLine: null,
            process: null,
            partNumber: null
        });
        this.parts = [];

        if (project) {
            if (productType === 'semi_finished') {
                // Semi-finished: load processes, clear production lines
                this.loadProcesses(project.Id_Project);
                this.productionLines = [];
                // Load parts filtered by semi_finished type
                this.loadParts(project.Id_Project, productType);
            } else if (productType === 'finished_good') {
                // Finished good: load production lines, clear processes
                this.loadProductionLines(project.Id_Project);
                this.processes = [];
                // Also load parts filtered by product type
                this.loadParts(project.Id_Project, productType);
            } else {
                // No type selected: load all
                this.loadProductionLines(project.Id_Project);
                this.loadProcesses(project.Id_Project);
                this.loadParts(project.Id_Project);
            }
        }
    }

    // Helper methods for template visibility - handles both string and object values from p-select
    shouldShowProcess(): boolean {
        const productType = this.shiftSetupForm.get('productType')?.value;
        if (!productType) return true;  // Show if no type selected
        // Handle case where productType is an object or a string
        const typeValue = typeof productType === 'object' ? productType?.value : productType;
        return typeValue === 'semi_finished';
    }

    shouldShowProductionLine(): boolean {
        const productType = this.shiftSetupForm.get('productType')?.value;
        if (!productType) return true;  // Show if no type selected
        // Handle case where productType is an object or a string
        const typeValue = typeof productType === 'object' ? productType?.value : productType;
        return typeValue === 'finished_good';
    }

    loadProcesses(projectId: number): void {
        this.productionService.getProcessesByProject(projectId).subscribe({
            next: (processes) => {
                this.processes = processes;
            },
            error: (err) => {
                console.error('Error loading processes:', err);
                this.processes = [];
            }
        });
    }

    onProcessChange(): void {
        const process = this.shiftSetupForm.get('process')?.value;
        const currentPart = this.shiftSetupForm.get('partNumber')?.value;

        // Reset part selection when process changes (use emitEvent: false to avoid triggering valueChanges)
        this.shiftSetupForm.patchValue({ partNumber: null }, { emitEvent: false });

        if (process) {
            // Load parts associated with this process
            this.productionService.getPartsByProcess(process.id).subscribe({
                next: (parts) => {
                    this.parts = parts;
                    // Restore selection if the part is still valid in the new parts list
                    if (currentPart && parts.some(p => p.Id_Part === currentPart.Id_Part)) {
                        // Find the matching part object from the new array (to ensure reference equality with compareWith)
                        const matchingPart = parts.find(p => p.Id_Part === currentPart.Id_Part);
                        this.shiftSetupForm.patchValue({ partNumber: matchingPart }, { emitEvent: false });
                    }
                },
                error: (err) => {
                    console.error('Error loading parts by process:', err);
                    this.parts = [];
                }
            });
        }
    }

    loadWorkstations(lineId: number): void {
        this.productionService.getWorkstations(lineId).subscribe(workstations => {
            this.workstations = workstations;
        });
    }

    loadWorkstationsByProject(projectId: number): void {
        this.productionService.getWorkstations(undefined, projectId).subscribe(workstations => {
            this.workstations = workstations;
        });
    }

    loadMachines(lineId: number): void {
        this.productionService.getMachinesByProductionLine(lineId).subscribe(machines => {
            this.machines = machines;
        });
    }

    loadShiftsForProductionLine(lineId: number): void {
        this.productionService.getShiftsByProductionLine(lineId).subscribe({
            next: (shifts) => {
                if (shifts && shifts.length > 0) {
                    // If there's only one shift used for this line, auto-select it
                    if (shifts.length === 1) {
                        const shiftToSelect = this.shifts.find(s => s.id === shifts[0].id);
                        if (shiftToSelect) {
                            this.shiftSetupForm.patchValue({ shift: shiftToSelect });
                            this.messageService.add({
                                severity: 'info',
                                summary: 'Shift Auto-Selected',
                                detail: `Shift "${shiftToSelect.name}" was automatically selected based on previous production data.`,
                                life: 3000
                            });
                        }
                    } else {
                        // Multiple shifts have been used, show info
                        const shiftNames = shifts.map(s => s.name).join(', ');
                        this.messageService.add({
                            severity: 'info',
                            summary: 'Previous Shifts Found',
                            detail: `This line has used: ${shiftNames}. Please select the appropriate shift.`,
                            life: 5000
                        });
                    }
                }
            },
            error: (err) => {
                console.error('Error loading shifts for production line:', err);
            }
        });
    }

    // ==================== SHIFT SETUP ====================

    completeShiftSetup(): void {
        if (this.shiftSetupForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Incomplete',
                detail: 'Please fill in all shift setup fields'
            });
            return;
        }

        const formValue = this.shiftSetupForm.value;

        this.session.shift = formValue.shift;
        this.session.date = formValue.date;
        this.session.project = formValue.project;
        this.session.productionLine = formValue.productionLine;
        this.session.process = formValue.process;  // For semi-finished products
        this.session.part = formValue.partNumber;
        this.session.zone = formValue.zone;
        this.session.isSetupComplete = true;

        // Generate hours for the shift
        this.session.hours = this.generateShiftHours(formValue.shift, formValue.partNumber);

        // Sync hours with valid shift type codes (in case shiftTypes are loaded)
        this.syncHoursWithShiftTypes();

        // Save session to localStorage
        this.saveSessionToStorage();

        // Update stepper to step 2 (Team Assignment)
        this.updateCurrentStep();

        this.messageService.add({
            severity: 'success',
            summary: 'Setup Complete',
            detail: `${formValue.shift.name} shift setup completed. Now assign your team.`
        });
    }

    generateShiftHours(shift: Shift, part: Part): HourlyProductionState[] {
        const hours: HourlyProductionState[] = [];

        // Use actual shift start/end times from database
        const shiftStart = shift.startHour ?? this.getShiftStartHour(shift.id);
        const shiftEnd = shift.endHour ?? (shiftStart + 8) % 24;

        // Calculate shift duration (handle overnight shifts like 22:00 - 07:00)
        let shiftDuration = shiftEnd - shiftStart;
        if (shiftDuration <= 0) {
            shiftDuration += 24; // Overnight shift
        }

        // ShiftTarget_Part already represents the hourly target (no division needed)
        const hourlyTarget = part.ShiftTarget_Part;
        const hourlyScrapTarget = part.ScrapTarget_Part || 0;

        // Generate hours based on actual shift duration
        for (let i = 0; i < shiftDuration; i++) {
            const hourNumber = i + 1;
            const startHour = (shiftStart + i) % 24;
            const endHour = (shiftStart + i + 1) % 24;

            hours.push({
                hour: hourNumber,
                timeRange: `${this.formatHour(startHour)} - ${this.formatHour(endHour)}`,
                startTime: this.formatHour(startHour),
                endTime: this.formatHour(endHour),
                isOvertime: false,
                hourType: this.getDefaultHourType(), // Use first available ShiftType code
                status: 'not_started',
                output: null,
                scrap: null,
                target: hourlyTarget,
                scrapTarget: hourlyScrapTarget,
                efficiency: null,
                scrapRate: null,
                downtimes: [],
                totalDowntime: 0,
                hourlyProductionId: null,
                team: [] // Per-hour team assignment
            });
        }

        return hours;
    }

    getShiftStartHour(shiftId: string | number): number {
        const shiftMap: Record<string, number> = {
            '1': 6,  // Morning: 06:00
            '2': 14, // Afternoon: 14:00
            '3': 22  // Night: 22:00
        };
        return shiftMap[String(shiftId)] || 6;
    }

    formatHour(hour: number): string {
        return hour.toString().padStart(2, '0') + ':00';
    }

    editShiftSetup(): void {
        this.session.isSetupComplete = false;
    }

    // ==================== TEAM ASSIGNMENT ====================

    addEmployee(): void {
        console.log('addEmployee() called, badge input:', this.employeeIdScan);

        // Trim whitespace from scanned badge (common issue with barcode scanners)
        const cleanBadgeId = this.employeeIdScan?.trim() || '';

        if (!cleanBadgeId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please scan employee ID'
            });
            return;
        }

        console.log('Searching for badge:', cleanBadgeId);

        // Step 1: Get employee by badge
        this.employeeService.getEmployeeByBadge(cleanBadgeId).subscribe({
            next: (employee: any) => {
                console.log('Employee found:', employee);
                // Check if employee is already in team (for info message, no longer blocking)
                const existingInTeam = this.teamState.isEmployeeInTeam(employee.id);
                console.log('Already in team:', existingInTeam, 'Employee ID:', employee.id);

                // Check if employee is NOT an operator (non-operators don't need workstation/qualification checks)
                // IMPORTANT: Prioritize custom category (Categorie_Emp, category_fk_detail) over default model field (category)
                // The backend returns "category" with default value "operator" even for non-operators
                const category = (
                    employee.Categorie_Emp ||                    // Custom category from serializer method field
                    employee.category_fk_detail?.name ||         // FK detail object
                    employee.category ||                         // Default model field (fallback)
                    ''
                ).toLowerCase().trim();
                const isOperator = category.includes('operator') ||
                                   category.includes('operateur') ||
                                   category.includes('opérateur');
                console.log('Employee category:', category, 'isOperator:', isOperator);

                if (!isOperator) {
                    // Non-operator: Add directly without workstation/qualification checks
                    const roleFromCategory = this.getRoleFromCategory(category);
                    console.log('Non-operator detected, role:', roleFromCategory);

                    if (existingInTeam) {
                        this.messageService.add({
                            severity: 'warn',
                            summary: 'Déjà assigné',
                            detail: `${employee.first_name} ${employee.last_name} est déjà dans l'équipe`
                        });
                        this.employeeIdScan = '';
                        return;
                    }

                    const newAssignment: EmployeeWithAssignment = {
                        Id_Emp: employee.id,
                        Nom_Emp: employee.last_name,
                        Prenom_Emp: employee.first_name,
                        DateNaissance_Emp: employee.date_of_birth ? new Date(employee.date_of_birth) : new Date(),
                        Genre_Emp: employee.gender,
                        Categorie_Emp: employee.Categorie_Emp || employee.category_fk_detail?.name || employee.category,
                        DateEmbauche_Emp: new Date(employee.hire_date),
                        Departement_Emp: employee.department,
                        Picture: this.getEmployeePictureUrl(employee.picture),
                        EmpStatus: employee.status,
                        BadgeNumber: employee.badge_number || employee.BadgeNumber,
                        badgeId: cleanBadgeId,
                        workstation: employee.department || 'N/A',
                        qualification: employee.Categorie_Emp || employee.category_fk_detail?.name || employee.category || 'Staff',
                        qualificationLevel: 3, // Non-operators are considered qualified
                        role: roleFromCategory
                    };

                    this.finalizeEmployeeAssignment(newAssignment, employee, cleanBadgeId);
                    return;
                }

                // Step 2: For operators - Show explicit assignment dialog to select workstation
                if (existingInTeam) {
                    // Inform user they can reassign
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Employé déjà assigné',
                        detail: 'Vous pouvez le réaffecter à un autre poste'
                    });
                }
                // Show explicit assignment dialog (user selects workstation manually)
                this.showExplicitAssignmentForEmployee(employee, null, cleanBadgeId);
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.error || 'Employee not found'
                });
            }
        });
    }

    /**
     * Finalize the employee assignment after qualification check.
     * Uses signal-based state management for immediate UI updates.
     */
    private finalizeEmployeeAssignment(assignment: EmployeeWithAssignment, employee: any, badgeId: string): void {
        console.log('finalizeEmployeeAssignment called with:', {
            employeeId: assignment.Id_Emp,
            name: `${assignment.Prenom_Emp} ${assignment.Nom_Emp}`,
            workstation: assignment.workstation,
            role: assignment.role
        });

        // Use signal-based state service for immediate UI update
        const success = this.teamState.addMember(assignment);
        console.log('addMember result:', success, 'Team size after:', this.teamState.team().length);

        if (!success) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: `${employee.first_name} ${employee.last_name} is already in the team`
            });
            return;
        }

        // Sync with session object for localStorage persistence
        this.session.team = [...this.teamState.team()];
        console.log('session.team synced, length:', this.session.team.length);

        const fullName = `${employee.first_name} ${employee.last_name}`;

        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `${fullName} assigned to ${assignment.workstation}${assignment.machine ? ' - ' + assignment.machine : ''}`
        });

        // Save session to localStorage
        this.saveSessionToStorage();
        console.log('Session saved. teamState.team().length:', this.teamState.team().length);

        // Reset form
        this.employeeIdScan = '';
        this.selectedWorkstation = null;
        this.selectedMachineForAssignment = null;
        this.showManualWorkstationSelection = false;
        this.pendingEmployeeData = null;
    }

    /**
     * Confirm adding an unqualified/expired employee
     */
    confirmQualificationWarning(): void {
        if (this.pendingManualAssignmentData?.isManualSelection) {
            // Manual assignment non-qualified case
            this.proceedWithExplicitAssignment(
                this.pendingManualAssignmentData.employee,
                this.pendingManualAssignmentData.qualificationCheck,
                true, // isNonQualified
                this.pendingManualAssignmentData.workstation,
                this.pendingManualAssignmentData.machine
            );
            this.resetQualificationWarningState();
        } else if (this.pendingEmployeeAssignment && this.pendingEmployeeData) {
            // Default assignment non-qualified case
            // Mark as non-qualified and record
            this.pendingEmployeeAssignment.isNonQualified = true;
            this.finalizeEmployeeAssignment(
                this.pendingEmployeeAssignment,
                this.pendingEmployeeData,
                this.employeeIdScan
            );
            // Record for traceability
            if (this.pendingEmployeeAssignment.workstationId) {
                const workstation = this.workstations.find(w => w.Id_Workstation === this.pendingEmployeeAssignment!.workstationId);
                if (workstation) {
                    this.recordNonQualifiedAssignment(this.pendingEmployeeData, workstation);
                }
            }
            this.resetQualificationWarningState();
        }
    }

    /**
     * Reset all qualification warning related state
     */
    private resetQualificationWarningState(): void {
        this.showQualificationWarningDialog = false;
        this.pendingEmployeeAssignment = null;
        this.pendingEmployeeData = null;
        this.pendingPrimaryAssignment = null;
        this.pendingManualAssignmentData = null;
        this.qualificationWarningMessage = '';
    }

    /**
     * Cancel adding an unqualified/expired employee
     */
    cancelQualificationWarning(): void {
        this.resetQualificationWarningState();
        this.employeeIdScan = '';
    }

    /**
     * Add employee with manually selected workstation (fallback when no default assignment)
     */
    addEmployeeManual(): void {
        if (!this.selectedWorkstation || !this.pendingEmployeeData) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please select a workstation'
            });
            return;
        }

        const employee = this.pendingEmployeeData;
        const newAssignment: EmployeeWithAssignment = {
            Id_Emp: employee.id,
            Nom_Emp: employee.last_name,
            Prenom_Emp: employee.first_name,
            DateNaissance_Emp: employee.date_of_birth ? new Date(employee.date_of_birth) : new Date(),
            Genre_Emp: employee.gender,
            Categorie_Emp: employee.category,
            DateEmbauche_Emp: new Date(employee.hire_date),
            Departement_Emp: employee.department,
            Picture: this.getEmployeePictureUrl(employee.picture),
            EmpStatus: employee.status,
            BadgeNumber: employee.badge_number || employee.BadgeNumber,
            badgeId: this.employeeIdScan.trim(), // Save the scanned badge ID
            workstation: this.selectedWorkstation!.Name_Workstation,
            workstationId: this.selectedWorkstation!.Id_Workstation,
            machine: this.selectedMachineForAssignment?.name,
            machineId: this.selectedMachineForAssignment?.id,
            qualification: employee.current_qualification || 'Not Qualified',
            qualificationLevel: employee.current_qualification ? 1 : 0,
            role: 'operator'
        };

        this.finalizeEmployeeAssignment(newAssignment, employee, this.employeeIdScan);
    }

    /**
     * Cancel manual workstation selection
     */
    cancelManualSelection(): void {
        this.showManualWorkstationSelection = false;
        this.pendingEmployeeData = null;
        this.selectedWorkstation = null;
        this.selectedMachineForAssignment = null;
        this.employeeIdScan = '';
    }

    // ==================== EXPLICIT ASSIGNMENT DIALOG ====================

    /**
     * Show the explicit assignment dialog for an employee.
     * Allows user to either use the default assignment or select a workstation manually.
     */
    showExplicitAssignmentForEmployee(employee: any, primaryAssignment: EmployeePrimaryAssignment | null, badgeId: string): void {
        this.pendingEmployeeData = employee;
        this.pendingPrimaryAssignment = primaryAssignment;
        this.employeeIdScan = badgeId;

        // Prepare available workstations (all workstations from the list)
        this.availableWorkstationsForAssignment = [...this.workstations];

        // Reset selection
        this.selectedWorkstationForAssignment = null;
        this.selectedMachineForExplicitAssignment = null;
        this.filteredMachinesForExplicitAssignment = [];

        // Show the dialog
        this.showExplicitAssignmentDialog = true;
    }

    /**
     * Use the default assignment (from HR module) to assign the employee
     */
    useDefaultAssignment(): void {
        if (!this.pendingEmployeeData || !this.pendingPrimaryAssignment) {
            return;
        }

        const employee = this.pendingEmployeeData;
        const primaryAssignment = this.pendingPrimaryAssignment;
        const badgeId = this.employeeIdScan.trim();

        const newAssignment: EmployeeWithAssignment = {
            Id_Emp: employee.id,
            Nom_Emp: employee.last_name,
            Prenom_Emp: employee.first_name,
            DateNaissance_Emp: employee.date_of_birth ? new Date(employee.date_of_birth) : new Date(),
            Genre_Emp: employee.gender,
            Categorie_Emp: employee.category,
            DateEmbauche_Emp: new Date(employee.hire_date),
            Departement_Emp: employee.department,
            Picture: this.getEmployeePictureUrl(employee.picture),
            EmpStatus: employee.status,
            BadgeNumber: employee.badge_number || employee.BadgeNumber,
            badgeId: badgeId,
            workstation: primaryAssignment.workstation_name,
            workstationId: primaryAssignment.workstation_id,
            machine: primaryAssignment.machine_name || undefined,
            machineId: primaryAssignment.machine_id || undefined,
            qualification: primaryAssignment.qualification_name || employee.current_qualification || 'Not Qualified',
            qualificationLevel: primaryAssignment.is_qualified ? (primaryAssignment.qualification_valid ? 3 : 2) : 0,
            qualificationEndDate: primaryAssignment.qualification_end_date ? new Date(primaryAssignment.qualification_end_date) : null,
            qualificationValid: primaryAssignment.qualification_valid,
            role: 'operator'
        };

        // Check if employee is already in team (reassignment case)
        const existingInTeam = this.teamState.isEmployeeInTeam(employee.id);

        // Check qualification validity
        if (!primaryAssignment.qualification_valid) {
            // Show warning dialog
            const fullName = `${employee.first_name} ${employee.last_name}`;
            if (!primaryAssignment.is_qualified) {
                this.qualificationWarningMessage = `${fullName} n'est pas qualifié(e) pour le poste "${primaryAssignment.workstation_name}". Êtes-vous sûr(e) de vouloir l'ajouter ?`;
            } else {
                this.qualificationWarningMessage = `La qualification de ${fullName} pour le poste "${primaryAssignment.workstation_name}" est expirée (fin: ${primaryAssignment.qualification_end_date ? new Date(primaryAssignment.qualification_end_date).toLocaleDateString() : 'N/A'}). Êtes-vous sûr(e) de vouloir l'ajouter ?`;
            }
            this.pendingEmployeeAssignment = newAssignment;
            this.showExplicitAssignmentDialog = false;
            this.showQualificationWarningDialog = true;
        } else {
            // Qualified - proceed with assignment
            if (existingInTeam) {
                // Reassign existing member
                this.teamState.reassignMember(employee.id, {
                    workstation: newAssignment.workstation,
                    workstationId: newAssignment.workstationId,
                    machine: newAssignment.machine,
                    machineId: newAssignment.machineId,
                    qualification: newAssignment.qualification,
                    qualificationLevel: newAssignment.qualificationLevel
                });
                this.session.team = [...this.teamState.team()];
                this.messageService.add({
                    severity: 'success',
                    summary: 'Réaffectation',
                    detail: `${employee.first_name} ${employee.last_name} réaffecté(e) à ${newAssignment.workstation}`
                });
                this.saveSessionToStorage();
            } else {
                // New assignment
                this.finalizeEmployeeAssignment(newAssignment, employee, badgeId);
            }
            this.cancelExplicitAssignment();
        }
    }

    /**
     * Confirm the explicit (manual) workstation selection
     * Now includes qualification verification before assignment
     */
    confirmExplicitAssignment(): void {
        if (!this.selectedWorkstationForAssignment || !this.pendingEmployeeData) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Attention',
                detail: 'Veuillez sélectionner un poste de travail'
            });
            return;
        }

        const employee = this.pendingEmployeeData;
        const workstationId = this.selectedWorkstationForAssignment!.Id_Workstation ?? this.selectedWorkstationForAssignment!.id;

        // Check qualification before assigning
        this.hrService.checkQualificationForWorkstation(employee.id, workstationId).subscribe({
            next: (qualificationCheck: QualificationCheckResult) => {
                if (!qualificationCheck.qualification_valid) {
                    // Qualification expired or missing - show warning dialog
                    this.showQualificationWarningForManualAssignment(employee, qualificationCheck);
                } else {
                    // Qualified - proceed with normal assignment
                    this.proceedWithExplicitAssignment(employee, qualificationCheck, false);
                }
            },
            error: () => {
                // On API error, allow assignment with warning (degraded mode)
                this.showQualificationWarningForManualAssignment(employee, null);
            }
        });
    }

    /**
     * Show qualification warning dialog for manual assignment
     */
    private showQualificationWarningForManualAssignment(employee: any, qualificationCheck: QualificationCheckResult | null): void {
        const fullName = `${employee.first_name} ${employee.last_name}`;
        const workstationName = this.selectedWorkstationForAssignment!.Name_Workstation;

        if (!qualificationCheck || !qualificationCheck.is_qualified) {
            this.qualificationWarningMessage = `${fullName} n'est pas qualifié(e) pour le poste "${workstationName}". Êtes-vous sûr(e) de vouloir l'ajouter ?`;
        } else {
            const endDateStr = qualificationCheck.qualification_end_date
                ? new Date(qualificationCheck.qualification_end_date).toLocaleDateString()
                : 'N/A';
            this.qualificationWarningMessage = `La qualification de ${fullName} pour le poste "${workstationName}" est expirée (fin: ${endDateStr}). Êtes-vous sûr(e) de vouloir l'ajouter ?`;
        }

        // Store info for assignment after confirmation (including workstation/machine since dialog will be hidden)
        this.pendingManualAssignmentData = {
            employee,
            qualificationCheck,
            isManualSelection: true,
            workstation: this.selectedWorkstationForAssignment,
            machine: this.selectedMachineForExplicitAssignment
        };
        this.showExplicitAssignmentDialog = false;
        this.showQualificationWarningDialog = true;
    }

    /**
     * Proceed with explicit assignment after qualification check
     */
    private proceedWithExplicitAssignment(
        employee: any,
        qualificationCheck: QualificationCheckResult | null,
        isNonQualified: boolean,
        workstation?: Workstation | null,
        machine?: Machine | null
    ): void {
        // Use provided workstation/machine or fall back to selected ones
        const wsToUse = workstation ?? this.selectedWorkstationForAssignment;
        const machineToUse = machine ?? this.selectedMachineForExplicitAssignment;

        if (!wsToUse) {
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Aucun poste de travail sélectionné'
            });
            return;
        }

        const badgeId = this.employeeIdScan.trim();

        const newAssignment: EmployeeWithAssignment = {
            Id_Emp: employee.id,
            Nom_Emp: employee.last_name,
            Prenom_Emp: employee.first_name,
            DateNaissance_Emp: employee.date_of_birth ? new Date(employee.date_of_birth) : new Date(),
            Genre_Emp: employee.gender,
            Categorie_Emp: employee.category,
            DateEmbauche_Emp: new Date(employee.hire_date),
            Departement_Emp: employee.department,
            Picture: this.getEmployeePictureUrl(employee.picture),
            EmpStatus: employee.status,
            BadgeNumber: employee.badge_number || employee.BadgeNumber,
            badgeId: badgeId,
            workstation: wsToUse.Name_Workstation,
            workstationId: wsToUse.Id_Workstation,
            machine: machineToUse?.name,
            machineId: machineToUse?.id,
            qualification: qualificationCheck?.qualification_name || 'Non Qualifié',
            qualificationLevel: qualificationCheck?.is_qualified
                ? (qualificationCheck.qualification_valid ? 3 : 2)
                : 0,
            qualificationEndDate: qualificationCheck?.qualification_end_date ? new Date(qualificationCheck.qualification_end_date) : null,
            qualificationValid: qualificationCheck?.qualification_valid ?? false,
            role: 'operator',
            isNonQualified: isNonQualified
        };

        // Check if employee is already in team (reassignment case)
        const existingInTeam = this.teamState.isEmployeeInTeam(employee.id);

        if (existingInTeam) {
            // Reassign existing member
            this.teamState.reassignMember(employee.id, {
                workstation: newAssignment.workstation,
                workstationId: newAssignment.workstationId,
                machine: newAssignment.machine,
                machineId: newAssignment.machineId,
                qualification: newAssignment.qualification,
                qualificationLevel: newAssignment.qualificationLevel
            });
            this.session.team = [...this.teamState.team()];
            this.messageService.add({
                severity: 'success',
                summary: 'Réaffectation',
                detail: `${employee.first_name} ${employee.last_name} réaffecté(e) à ${newAssignment.workstation}${newAssignment.machine ? ' - ' + newAssignment.machine : ''}`
            });
            this.saveSessionToStorage();
        } else {
            // New assignment
            this.finalizeEmployeeAssignment(newAssignment, employee, badgeId);
        }

        // Record non-qualified assignment for traceability if applicable
        if (isNonQualified) {
            this.recordNonQualifiedAssignment(employee, wsToUse);
        }

        this.cancelExplicitAssignment();
    }

    /**
     * Record a non-qualified assignment for traceability
     */
    private recordNonQualifiedAssignment(employee: any, workstation: Workstation): void {
        const workstationId = workstation.Id_Workstation ?? workstation.id;
        const employeeId = employee.id ?? employee.Id_Emp;

        // Validate required fields
        if (!employeeId || !workstationId) {
            console.error('Cannot record non-qualified assignment: missing required fields', {
                employeeId,
                workstationId,
                employee,
                workstation
            });
            return;
        }

        const currentUser = this.authService.getCurrentUser();
        const assignment: NonQualifiedAssignmentCreate = {
            employee_id: employeeId,
            workstation_id: workstationId,
            reason: 'Affectation manuelle avec qualification expirée/manquante'
        };

        // Only add machine_id if it exists
        if (this.selectedMachineForExplicitAssignment?.id) {
            assignment.machine_id = this.selectedMachineForExplicitAssignment.id;
        }

        // Only add assigned_by if user ID exists
        if (currentUser?.id) {
            assignment.assigned_by = currentUser.id;
        }

        console.log('Creating non-qualified assignment:', assignment);

        this.hrService.createNonQualifiedAssignment(assignment).subscribe({
            next: () => {
                console.log('Non-qualified assignment recorded for traceability');
            },
            error: (error) => {
                console.error('Failed to record non-qualified assignment:', error);
                console.error('Request payload was:', assignment);
            }
        });
    }

    /**
     * Cancel the explicit assignment dialog
     */
    cancelExplicitAssignment(): void {
        this.showExplicitAssignmentDialog = false;
        this.pendingEmployeeData = null;
        this.pendingPrimaryAssignment = null;
        this.selectedWorkstationForAssignment = null;
        this.selectedMachineForExplicitAssignment = null;
        this.filteredMachinesForExplicitAssignment = [];
        this.employeeIdScan = '';
    }

    /**
     * Handle workstation change in explicit assignment dialog - filter machines
     */
    onExplicitWorkstationChange(): void {
        if (this.selectedWorkstationForAssignment) {
            this.filteredMachinesForExplicitAssignment = this.machines.filter(
                m => m.workstation === this.selectedWorkstationForAssignment!.Id_Workstation
            );
        } else {
            this.filteredMachinesForExplicitAssignment = [];
        }
        this.selectedMachineForExplicitAssignment = null;
    }

    /**
     * Show employee image in a dialog
     */
    showEmployeeImage(employee: EmployeeWithAssignment): void {
        this.selectedEmployeeForImage = employee;
        this.showImageViewerDialog = true;
    }

    getRoleLabel(role: ProductionRole): string {
        const roleOption = this.roleOptions.find(r => r.value === role);
        return roleOption?.label || role;
    }

    /**
     * Determine the production role based on employee category
     */
    getRoleFromCategory(category: string): ProductionRole {
        const cat = (category || '').toLowerCase();
        if (cat.includes('leader') || cat.includes('chef') || cat.includes('supervisor')) {
            return 'line_leader';
        }
        if (cat.includes('quality') || cat.includes('qualite') || cat.includes('qualité')) {
            return 'quality_agent';
        }
        if (cat.includes('maintenance') || cat.includes('tech')) {
            return 'maintenance_tech';
        }
        if (cat.includes('pqc') || cat.includes('control')) {
            return 'pqc';
        }
        return 'operator';
    }

    getRoleSeverity(role: ProductionRole | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        if (!role) return 'secondary';
        switch (role) {
            case 'line_leader': return 'warn';
            case 'quality_agent': return 'success';
            case 'maintenance_tech': return 'info';
            case 'pqc': return 'danger';
            default: return 'secondary';
        }
    }

    removeEmployee(employee: EmployeeWithAssignment): void {
        // Use signal-based state service for immediate UI update
        this.teamState.removeMember(employee.Id_Emp);

        // Sync with session object for localStorage persistence
        this.session.team = [...this.teamState.team()];

        this.messageService.add({
            severity: 'info',
            summary: 'Removed',
            detail: `${employee.Prenom_Emp} ${employee.Nom_Emp} removed`
        });

        // Save session to localStorage
        this.saveSessionToStorage();
    }

    onWorkstationChange(): void {
        // Filter machines based on selected workstation
        if (this.selectedWorkstation) {
            this.filteredMachinesForAssignment = this.machines.filter(
                m => m.workstation === this.selectedWorkstation!.Id_Workstation
            );
        } else {
            this.filteredMachinesForAssignment = [];
        }
        this.selectedMachineForAssignment = null;
    }

    getCategoryQualification(category: string): string {
        const qualificationMap: Record<string, string> = {
            'operator': 'Operator Level 1',
            'team_leader': 'Team Leader',
            'supervisor': 'Supervisor',
            'manager': 'Manager',
            'technician': 'Technician',
            'engineer': 'Engineer'
        };
        return qualificationMap[category] || 'Not Qualified';
    }

    getCategoryLevel(category: string): number {
        const levelMap: Record<string, number> = {
            'operator': 1,
            'team_leader': 3,
            'supervisor': 4,
            'manager': 5,
            'technician': 3,
            'engineer': 4
        };
        return levelMap[category] || 0;
    }

    completeTeamAssignment(): void {
        if (this.session.team.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Team Members',
                detail: 'Please assign at least one team member'
            });
            return;
        }

        this.session.isTeamComplete = true;

        // Update stepper to step 3 (Hourly Tracker)
        this.updateCurrentStep();

        this.messageService.add({
            severity: 'success',
            summary: 'Team Complete',
            detail: `${this.session.team.length} team members assigned. You can now enter production data.`
        });
    }

    editTeamAssignment(): void {
        this.session.isTeamComplete = false;
    }

    onActorChange(): void {
        // Save session to localStorage when actors are modified
        this.saveSessionToStorage();
    }

    lookupActor(actorType: 'lineLeader' | 'qualityAgent' | 'maintenanceTech' | 'pqc'): void {
        const actor = this.session.actors[actorType];
        const badgeId = actor.badgeId?.trim();

        if (!badgeId) {
            // Clear the actor info if badge is empty
            actor.name = '';
            actor.qualification = '';
            actor.employeeId = undefined;
            this.saveSessionToStorage();
            return;
        }

        this.employeeService.getEmployeeByBadge(badgeId).subscribe({
            next: (employee: any) => {
                actor.name = `${employee.first_name} ${employee.last_name}`;
                actor.qualification = employee.current_qualification || 'Not Qualified';
                actor.employeeId = employee.id;
                this.saveSessionToStorage();

                this.messageService.add({
                    severity: 'success',
                    summary: 'Employee Found',
                    detail: `${actor.name} - ${actor.qualification}`,
                    life: 2000
                });
            },
            error: () => {
                actor.name = '';
                actor.qualification = '';
                actor.employeeId = undefined;
                this.saveSessionToStorage();

                this.messageService.add({
                    severity: 'error',
                    summary: 'Not Found',
                    detail: `Employee with badge ${badgeId} not found`
                });
            }
        });
    }

    onOrderNoChange(): void {
        // Emit to debounced Subject - saves to localStorage and updates backend after 500ms of inactivity
        this.orderNoChange$.next(this.session.orderNo);
    }

    private updateExistingRecordsOrderNo(): void {
        if (!this.session.orderNo) return;

        // Get all hours that have been saved (have hourlyProductionId)
        const savedHours = this.session.hours.filter(
            h => h.hourlyProductionId && typeof h.hourlyProductionId === 'number'
        );

        if (savedHours.length === 0) return;

        this.isUpdatingOrderNo = true;

        // Create observables for all updates with error handling per request
        const updateObservables = savedHours.map(hour =>
            this.productionService.updateHourlyProductionOrderNo(
                hour.hourlyProductionId as number,
                this.session.orderNo
            ).pipe(
                map(() => ({ success: true, hour: hour.hour })),
                catchError(err => of({ success: false, hour: hour.hour, error: err }))
            )
        );

        // Execute all updates in parallel and show appropriate toast
        forkJoin(updateObservables).subscribe({
            next: (results) => {
                this.isUpdatingOrderNo = false;
                const successCount = results.filter(r => r.success).length;
                const errorCount = results.filter(r => !r.success).length;

                if (errorCount === 0 && successCount > 0) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Order No Updated',
                        detail: `Updated ${successCount} record${successCount > 1 ? 's' : ''}`,
                        life: 2000
                    });
                } else if (errorCount > 0 && successCount > 0) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Partial Update',
                        detail: `${successCount} updated, ${errorCount} failed`,
                        life: 4000
                    });
                } else if (errorCount > 0) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Update Failed',
                        detail: `${errorCount} record${errorCount > 1 ? 's' : ''} failed to update`,
                        life: 4000
                    });
                }
            },
            error: () => {
                this.isUpdatingOrderNo = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Update Failed',
                    detail: 'Failed to update Order No',
                    life: 4000
                });
            }
        });
    }

    onHourTypeChange(hourIndex: number, newType: HourType): void {
        console.log(`onHourTypeChange called: hourIndex=${hourIndex}, newType=${newType}`);

        const hour = this.session.hours[hourIndex];
        const baseTarget = this.getBaseHourlyTarget();

        hour.hourType = newType;
        console.log(`Hour ${hour.hour} type set to: ${hour.hourType}`);

        // Recalculate target based on hour type using dynamic ShiftType percentage
        const shiftType = this.shiftTypes.find(st => st.name === newType);
        const targetPercentage = shiftType?.target_percentage ?? 100;
        hour.target = Math.round(baseTarget * (targetPercentage / 100));

        // Recalculate efficiency if output exists
        if (hour.output !== null && hour.target > 0) {
            hour.efficiency = Math.round((hour.output / hour.target) * 100);
        }

        // Save to backend if hourlyProductionId exists
        if (hour.hourlyProductionId && shiftType) {
            this.updateHourTypeInBackend(hour.hourlyProductionId, shiftType.id, newType);
        }

        this.saveSessionToStorage();
        console.log('Session saved after hour type change');
    }

    updateHourTypeInBackend(hourlyProductionId: number, shiftTypeId: number, hourType: string): void {
        // Update only the shift_type field in the backend
        this.productionService.patchHourlyProductionShiftType(hourlyProductionId, shiftTypeId).subscribe({
            next: () => {
                console.log(`Shift type updated in backend for production ${hourlyProductionId}`);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Type Updated',
                    detail: 'Hour type saved successfully',
                    life: 2000
                });
            },
            error: (error: Error) => {
                console.error('Error updating shift type in backend:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save hour type'
                });
            }
        });
    }

    getBaseHourlyTarget(): number {
        if (!this.session.part || !this.session.shift) return 0;

        const shiftStart = this.session.shift.startHour ?? 6;
        const shiftEnd = this.session.shift.endHour ?? 14;
        let shiftDuration = shiftEnd - shiftStart;
        if (shiftDuration <= 0) {
            shiftDuration += 24;
        }

        return this.session.part.ShiftTarget_Part;
    }

    getHourTypeLabel(type: HourType): string {
        // First try to find in loaded shiftTypes
        const shiftType = this.shiftTypes.find(st => st.name === type);
        if (shiftType) {
            return `${shiftType.name} (${shiftType.target_percentage}%)`;
        }
        // Fallback to hourTypeOptions (includes defaults)
        const option = this.hourTypeOptions.find(opt => opt.value === type);
        if (option) {
            return option.label;
        }
        // Last resort: capitalize the type code
        return type ? type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ') : '';
    }

    getHourTypeSeverity(type: HourType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const shiftType = this.shiftTypes.find(st => st.name === type);
        if (shiftType) {
            // Color based on target percentage
            if (shiftType.target_percentage >= 100) return 'success';
            if (shiftType.target_percentage >= 50) return 'info';
            if (shiftType.target_percentage > 0) return 'warn';
            return 'secondary'; // 0% target (break)
        }
        return 'secondary';
    }

    getHourTypeOption(value: string): { label: string; value: string } | undefined {
        return this.hourTypeOptions.find(opt => opt.value === value);
    }

    isHourTypeInOptions(value: string): boolean {
        return this.hourTypeOptions.some(opt => opt.value === value);
    }

    getDefaultHourType(): HourType {
        // Return the name of the first ShiftType with 100% target, or the first available
        const normalType = this.shiftTypes.find(st => st.target_percentage === 100);
        if (normalType) {
            return normalType.name as HourType;
        }
        // Fallback to first available ShiftType
        if (this.shiftTypes.length > 0) {
            return this.shiftTypes[0].name as HourType;
        }
        // Return empty string if no shift types loaded yet - will be synced later
        return '' as HourType;
    }

    syncHoursWithShiftTypes(): void {
        // Only sync if session has hours but no shiftTypes loaded yet should not reset
        if (!this.session.hours || this.session.hours.length === 0) return;
        if (this.shiftTypes.length === 0) return; // Don't sync if no shift types loaded

        const validCodes = this.shiftTypes.map(st => st.name);
        const defaultType = this.getDefaultHourType();

        console.log('Valid shift type codes:', validCodes);
        console.log('Current hour types:', this.session.hours.map(h => h.hourType));
        console.log('Default type will be:', defaultType);

        let updated = false;
        this.session.hours.forEach(hour => {
            // Only update if hourType is empty/undefined/invalid, don't overwrite existing valid values
            const hourTypeStr = hour.hourType as string;
            if (!hourTypeStr || hourTypeStr.trim() === '') {
                hour.hourType = defaultType;
                updated = true;
                console.log(`Hour ${hour.hour}: Set default type ${defaultType} (was empty)`);
            } else if (!validCodes.includes(hour.hourType)) {
                // Only reset truly invalid types (like 'normal' which might not exist in DB)
                console.log(`Hour ${hour.hour}: Invalid type "${hour.hourType}", setting to ${defaultType}`);
                hour.hourType = defaultType;
                updated = true;
            }
        });

        if (updated) {
            console.log('Hours synchronized with valid shift type codes');
            this.saveSessionToStorage();
        }
    }

    getHourTypeOptionsWithCurrent(currentValue: HourType): { label: string; value: string }[] {
        // If current value is already in options, return options as-is
        if (!currentValue || this.hourTypeOptions.some(opt => opt.value === currentValue)) {
            return this.hourTypeOptions;
        }
        // Otherwise, add the current value as an option at the beginning
        return [
            { label: this.getHourTypeLabel(currentValue), value: currentValue },
            ...this.hourTypeOptions
        ];
    }

    // ==================== HOUR PRODUCTION ====================

    openHourDialog(hourIndex: number): void {
        this.selectedHourIndex = hourIndex;
        const hour = this.session.hours[hourIndex];

        // Reset the add downtime form state
        this.showAddDowntimeForm = false;
        this.editingDowntimeDialogIndex = null;
        this.resetNewDowntimeForm();

        // If hour already has data, pre-fill the form
        if (hour.status === 'completed') {
            // Convert existing downtimes to dialog format
            const existingDowntimes = hour.downtimes.map(dt => ({
                id: dt.Id_Downtime,
                duration: dt.Total_Downtime,
                problemId: dt.Id_DowntimeProblems,
                comment: dt.Comment_Downtime || ''
            }));

            this.hourProductionInput = {
                output: hour.output || 0,
                scrap: hour.scrap || 0,
                hasDowntime: hour.downtimes.length > 0,
                downtimes: existingDowntimes,
                downtime: {
                    duration: 0,
                    problemId: 0,
                    comment: ''
                }
            };
        } else {
            // Reset form for new entry
            this.hourProductionInput = {
                output: 0,
                scrap: 0,
                hasDowntime: false,
                downtimes: [],
                downtime: {
                    duration: 0,
                    problemId: 0,
                    comment: ''
                }
            };
        }

        // Initialize per-hour team confirmation
        this.initializeHourTeam(hourIndex);

        this.showHourDialog = true;
    }

    closeHourDialog(): void {
        this.showHourDialog = false;
        this.selectedHourIndex = null;
        // Reset team confirmation state
        this.showTeamConfirmationStep = true;
        this.teamConfirmed = false;
        this.currentHourTeam = [];
        this.employeeScanForHour = '';
    }

    // ==================== PER-HOUR TEAM MANAGEMENT ====================

    /**
     * Get the team from the previous hour, or the current team state if this is H1
     * Deep copies the employees to preserve all properties including workstation
     * Uses teamState.team() for the most current data (reactive state)
     */
    getPreviousHourTeam(currentIndex: number | null): EmployeeWithAssignment[] {
        let sourceTeam: EmployeeWithAssignment[] = [];

        if (currentIndex === null || currentIndex < 0) {
            // Use reactive team state for most current data
            sourceTeam = this.teamState.team();
        } else if (currentIndex === 0) {
            // For H1 (index 0), use the current team state (most current data)
            sourceTeam = this.teamState.team();
        } else {
            // For subsequent hours, look for the most recent completed hour with a team
            for (let i = currentIndex - 1; i >= 0; i--) {
                const prevHour = this.session.hours[i];
                if (prevHour.team && prevHour.team.length > 0) {
                    sourceTeam = prevHour.team;
                    break;
                }
            }
            // Fallback to current team state if no previous hour has a team
            if (sourceTeam.length === 0) {
                sourceTeam = this.teamState.team();
            }
        }

        // Deep copy to preserve all properties including workstation
        return sourceTeam.map(emp => ({
            ...emp,
            // Ensure workstation is preserved or use fallback
            workstation: emp.workstation || emp.workstationId?.toString() || 'Non défini'
        }));
    }

    /**
     * Initialize the hour team when opening the dialog (with smart auto-confirmation)
     */
    initializeHourTeam(hourIndex: number): void {
        const hour = this.session.hours[hourIndex];
        const previousTeam = this.getPreviousHourTeam(hourIndex);

        // If hour already has a saved team, use it (deep copy with fallback)
        if (hour.team && hour.team.length > 0) {
            this.currentHourTeam = hour.team.map(emp => ({
                ...emp,
                workstation: emp.workstation || emp.workstationId?.toString() || 'Non défini'
            }));
            this.teamConfirmed = true;
            this.showTeamConfirmationStep = false;
            this.showTeamModifyButton = true;
        }
        // Smart auto-confirm: For hours after H1, auto-confirm if previous hour has team
        else if (hourIndex > 0 && previousTeam.length > 0) {
            this.currentHourTeam = [...previousTeam];
            this.teamConfirmed = true;
            this.showTeamConfirmationStep = false;
            this.showTeamModifyButton = true; // Show discrete "Modify" button
        }
        // For H1, auto-confirm if initial team assignment exists
        else if (hourIndex === 0 && this.team.length > 0) {
            this.currentHourTeam = [...this.team];
            this.teamConfirmed = true;
            this.showTeamConfirmationStep = false;
            this.showTeamModifyButton = true;
        }
        // No previous team, show confirmation step
        else {
            this.currentHourTeam = previousTeam;
            this.teamConfirmed = false;
            this.showTeamConfirmationStep = true;
            this.showTeamModifyButton = false;
        }
    }

    /**
     * User confirms the team is the same as previous hour
     */
    confirmTeamSameAsPrevious(): void {
        // Team is already initialized with previous hour's team
        this.teamConfirmed = true;
        this.showTeamConfirmationStep = false;

        this.messageService.add({
            severity: 'info',
            summary: 'Team Confirmed',
            detail: `${this.currentHourTeam.length} employees assigned to this hour`,
            life: 2000
        });
    }

    /**
     * User wants to modify the team for this hour
     */
    confirmTeamDifferent(): void {
        // Keep the current team as starting point but allow editing
        this.showTeamConfirmationStep = false;
        this.teamConfirmed = false; // Not confirmed yet, needs to be confirmed after editing
    }

    /**
     * Confirm the modified team and proceed to production input
     */
    confirmHourTeam(): void {
        if (this.currentHourTeam.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Team',
                detail: 'Please assign at least one employee to this hour'
            });
            return;
        }

        this.teamConfirmed = true;
        this.messageService.add({
            severity: 'success',
            summary: 'Team Confirmed',
            detail: `${this.currentHourTeam.length} employees assigned to this hour`,
            life: 2000
        });
    }

    /**
     * Add an employee to the current hour's team via badge scan
     */
    addEmployeeToHourTeam(): void {
        const badgeId = this.employeeScanForHour.trim();
        if (!badgeId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please scan an employee badge'
            });
            return;
        }

        // Check if already in current hour team
        if (this.currentHourTeam.some(e => e.Id_Emp.toString() === badgeId)) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Employee is already in the team for this hour'
            });
            this.employeeScanForHour = '';
            return;
        }

        this.employeeService.getEmployeeByBadge(badgeId).subscribe({
            next: (employee: any) => {
                // Add employee with minimal info (workstation will be selected manually)
                const newMember: EmployeeWithAssignment = {
                    Id_Emp: employee.id,
                    Nom_Emp: employee.last_name,
                    Prenom_Emp: employee.first_name,
                    DateNaissance_Emp: employee.date_of_birth ? new Date(employee.date_of_birth) : new Date(),
                    Genre_Emp: employee.gender,
                    Categorie_Emp: employee.category,
                    DateEmbauche_Emp: new Date(employee.hire_date),
                    Departement_Emp: employee.department,
                    Picture: this.getEmployeePictureUrl(employee.picture),
                    EmpStatus: employee.status,
                    BadgeNumber: employee.badge_number || employee.BadgeNumber,
                    badgeId: badgeId,
                    workstation: 'Not Assigned',
                    qualification: 'Not Qualified',
                    qualificationLevel: 0,
                    qualificationValid: false,
                    role: 'operator'
                };

                this.currentHourTeam.push(newMember);
                this.employeeScanForHour = '';

                this.messageService.add({
                    severity: 'success',
                    summary: 'Added',
                    detail: `${employee.first_name} ${employee.last_name} added to hour team`,
                    life: 2000
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Not Found',
                    detail: `Employee with badge ${badgeId} not found`
                });
                this.employeeScanForHour = '';
            }
        });
    }

    /**
     * Remove an employee from the current hour's team
     */
    removeEmployeeFromHourTeam(employee: EmployeeWithAssignment): void {
        const index = this.currentHourTeam.findIndex(e => e.Id_Emp === employee.Id_Emp);
        if (index > -1) {
            this.currentHourTeam.splice(index, 1);
            this.messageService.add({
                severity: 'info',
                summary: 'Removed',
                detail: `${employee.Prenom_Emp} ${employee.Nom_Emp} removed from hour team`,
                life: 2000
            });
        }
    }

    saveHourProduction(): void {
        if (this.selectedHourIndex === null) return;

        const hour = this.session.hours[this.selectedHourIndex];

        // Validate team is confirmed
        if (!this.teamConfirmed) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Team Not Confirmed',
                detail: 'Please confirm the team for this hour before saving'
            });
            return;
        }

        // Validate team has at least one member
        if (this.currentHourTeam.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Team',
                detail: 'Please assign at least one employee to this hour'
            });
            return;
        }

        // Validate
        if (this.hourProductionInput.output === null || this.hourProductionInput.output < 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid Input',
                detail: 'Please enter a valid output value'
            });
            return;
        }

        // Validate session data before saving
        const isSemiFinished = this.session.part?.product_type === 'semi_finished';
        const hasRequiredLocation = isSemiFinished
            ? !!this.session.process
            : !!this.session.productionLine;

        if (!this.session.date || !this.session.shift || !this.session.part || !hasRequiredLocation) {
            console.error('Missing session data:', {
                date: this.session.date,
                shift: this.session.shift,
                part: this.session.part,
                productionLine: this.session.productionLine,
                process: this.session.process,
                productType: this.session.part?.product_type
            });
            this.messageService.add({
                severity: 'error',
                summary: 'Session Error',
                detail: isSemiFinished
                    ? 'Please complete the session setup (Date, Shift, Part, Process)'
                    : 'Please complete the session setup (Date, Shift, Part, Production Line)'
            });
            return;
        }

        // Mark hour as in progress
        hour.status = 'in_progress';

        // Find the ShiftType based on the hour_type name (case-insensitive)
        const shiftType = this.shiftTypes.find(st =>
            st.name.toLowerCase() === (hour.hourType || '').toLowerCase()
        );

        // Backend expects lowercase hour_type values: 'normal', 'setup', 'break', 'extra_hour_break'
        // Map the ShiftType code to valid backend values
        const validBackendHourTypes = ['normal', 'setup', 'break', 'extra_hour_break'];
        let hourTypeToSend = 'normal'; // default

        if (hour.hourType) {
            const lowerHourType = hour.hourType.toLowerCase();
            // Check if it's already a valid backend value
            if (validBackendHourTypes.includes(lowerHourType)) {
                hourTypeToSend = lowerHourType;
            } else {
                // Try to map from ShiftType name/code to valid backend value
                if (lowerHourType.includes('setup')) {
                    hourTypeToSend = 'setup';
                } else if (lowerHourType.includes('break') && lowerHourType.includes('extra')) {
                    hourTypeToSend = 'extra_hour_break';
                } else if (lowerHourType.includes('break')) {
                    hourTypeToSend = 'break';
                } else {
                    hourTypeToSend = 'normal';
                }
            }
        }

        const productionData: any = {
            date: this.session.date,
            shift: this.session.shift.id,
            hour: hour.hour,
            hour_type: hourTypeToSend,
            shift_type: shiftType?.id || null,
            part: this.session.part.Id_Part,
            result: this.hourProductionInput.output,
            target: hour.target,
            headcount: this.currentHourTeam.length,
            // Machine
            machine: this.session.machine?.id || null,
            // Order Number
            order_no: this.session.orderNo || '',
            // Production Supervisors & Key Personnel
            line_leader: this.session.actors.lineLeader.badgeId || '',
            quality_agent: this.session.actors.qualityAgent.badgeId || '',
            maintenance_tech: this.session.actors.maintenanceTech.badgeId || '',
            pqc: this.session.actors.pqc.badgeId || ''
        };

        // Add location field based on product type
        if (isSemiFinished) {
            productionData.process = this.session.process?.id;
        } else {
            productionData.production_line = this.session.productionLine?.id;
        }

        console.log('Sending production data:', productionData);

        // Check if this is an update (hourlyProductionId exists) or a new creation
        const isUpdate = hour.hourlyProductionId && typeof hour.hourlyProductionId === 'number' && hour.hourlyProductionId > 0;

        const saveObservable = isUpdate
            ? this.productionService.updateHourlyProduction(hour.hourlyProductionId as number, productionData)
            : this.productionService.saveHourlyProduction(productionData);

        saveObservable.subscribe({
            next: (response: any) => {
                // Extract ID from response (support multiple response formats)
                console.log('Production saved, full response:', response);

                // Try different possible ID fields
                let extractedId = response?.id ||
                                 response?.Id_HourlyProd ||
                                 response?.ID_HOURLYPROD ||
                                 response?.hourly_production_id ||
                                 response?.production_id;

                // If response is an object with date/shift/hour, we need to fetch the ID differently
                // For now, create a composite key or fetch from backend
                if (!extractedId && response?.date && response?.shift && response?.hour) {
                    // Use a composite identifier temporarily
                    extractedId = `${response.date}_${response.shift}_${response.hour}`;
                    console.warn('Using composite ID:', extractedId);
                }

                hour.hourlyProductionId = extractedId || response;
                console.log('Assigned hourlyProductionId:', hour.hourlyProductionId);

                if (typeof hour.hourlyProductionId === 'object') {
                    console.error('ERROR: hourlyProductionId is an object instead of a number/string!', hour.hourlyProductionId);
                }

                hour.output = this.hourProductionInput.output;
                hour.scrap = this.hourProductionInput.scrap || 0;
                hour.efficiency = Math.round((hour.output! / hour.target) * 100);
                hour.scrapRate = hour.scrapTarget > 0 ?
                    Math.round((hour.scrap! / hour.scrapTarget) * 10000) / 100 : 0;
                hour.status = 'completed';

                // IMPORTANT: Capture the team BEFORE any async operations
                // This prevents race conditions where closeHourDialog() clears currentHourTeam
                const teamToSaveForHour: EmployeeWithAssignment[] = this.currentHourTeam.length > 0
                    ? [...this.currentHourTeam] // Deep copy to preserve data
                    : [...this.teamState.team()];

                // Save to hour.team for UI display
                hour.team = [...teamToSaveForHour];

                // Save session to localStorage
                this.saveSessionToStorage();

                console.log('Team save check:', {
                    hourlyProductionId: hour.hourlyProductionId,
                    typeofId: typeof hour.hourlyProductionId,
                    teamToSaveLength: teamToSaveForHour.length,
                    teamMembers: teamToSaveForHour.map(t => ({ id: t.Id_Emp, name: `${t.Prenom_Emp} ${t.Nom_Emp}` }))
                });

                // Save team assignments to database if there's team to save
                if (teamToSaveForHour.length > 0) {
                    // Pass the captured team to avoid race conditions
                    this.fetchProductionIdThenSaveTeam(hour, teamToSaveForHour);
                } else {
                    console.warn('No team members to save for this hour');
                }

                // Save all downtimes (new ones without id, update ones with id)
                if (this.hourProductionInput.downtimes && this.hourProductionInput.downtimes.length > 0) {
                    this.saveAllDowntimesForHour(this.selectedHourIndex!, hour.hourlyProductionId as number);
                } else {
                    this.closeHourDialog();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Saved',
                        detail: `Hour ${hour.hour} production saved successfully`
                    });
                }
            },
            error: (error) => {
                // If 404 on update, the record no longer exists (stale ID from localStorage) - create new instead
                if (error.status === 404 && isUpdate) {
                    console.warn('Record not found (404), creating new record instead');
                    // Clear the stale ID
                    hour.hourlyProductionId = null;
                    // Retry as POST (create)
                    this.productionService.saveHourlyProduction(productionData).subscribe({
                        next: (response: any) => {
                            // Same success handling as above
                            console.log('Production created after 404 retry, full response:', response);

                            // Try different possible ID fields
                            let extractedId = response?.id ||
                                             response?.Id_HourlyProd ||
                                             response?.ID_HOURLYPROD ||
                                             response?.hourly_production_id ||
                                             response?.production_id;

                            if (!extractedId && response?.date && response?.shift && response?.hour) {
                                extractedId = `${response.date}_${response.shift}_${response.hour}`;
                                console.warn('Using composite ID:', extractedId);
                            }

                            hour.hourlyProductionId = extractedId || response;
                            hour.output = this.hourProductionInput.output;
                            hour.scrap = this.hourProductionInput.scrap || 0;
                            hour.efficiency = Math.round((hour.output! / hour.target) * 100);
                            hour.scrapRate = hour.scrapTarget > 0 ?
                                Math.round((hour.scrap! / hour.scrapTarget) * 10000) / 100 : 0;
                            hour.status = 'completed';

                            // Capture team for saving
                            const teamToSaveForHour: EmployeeWithAssignment[] = this.currentHourTeam.length > 0
                                ? [...this.currentHourTeam]
                                : [...this.teamState.team()];

                            hour.team = [...teamToSaveForHour];
                            this.saveSessionToStorage();

                            // Save team assignments
                            if (teamToSaveForHour.length > 0) {
                                this.fetchProductionIdThenSaveTeam(hour, teamToSaveForHour);
                            }

                            // Save downtimes
                            if (this.hourProductionInput.downtimes && this.hourProductionInput.downtimes.length > 0) {
                                this.saveAllDowntimesForHour(this.selectedHourIndex!, hour.hourlyProductionId as number);
                            } else {
                                this.closeHourDialog();
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Saved',
                                    detail: `Hour ${hour.hour} production saved successfully`
                                });
                            }
                        },
                        error: (retryError) => {
                            hour.status = 'not_started';
                            console.error('Error creating hourly production after 404 retry:', retryError);
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Failed to save production'
                            });
                        }
                    });
                    return;
                }

                // Original error handling for other errors
                hour.status = 'not_started';
                console.error('Error saving hourly production:', error);
                // Extract detailed error message from DRF response
                let errorMessage = 'Failed to save production';
                if (error.error) {
                    if (typeof error.error === 'string') {
                        errorMessage = error.error;
                    } else if (error.error.detail) {
                        errorMessage = error.error.detail;
                    } else {
                        // DRF returns field errors as object { field: [errors] }
                        const fieldErrors = Object.entries(error.error)
                            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                            .join('; ');
                        if (fieldErrors) {
                            errorMessage = fieldErrors;
                        }
                    }
                }
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMessage
                });
            }
        });
    }

    saveDowntimeForHour(hourIndex: number, downtime: { duration: number; problemId: number; machineId?: number; comment: string }): void {
        const hour = this.session.hours[hourIndex];

        if (!hour.hourlyProductionId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Production must be saved first'
            });
            return;
        }

        // If hourlyProductionId is an object (not fetched yet), try to fetch it first
        if (typeof hour.hourlyProductionId === 'object') {
            console.log('Fetching real production ID before saving downtime...');
            this.fetchProductionIdThenSaveDowntime(hourIndex, downtime);
            return;
        }

        this.productionService.saveDowntime({
            Total_Downtime: downtime.duration,
            Comment_Downtime: downtime.comment,
            Id_DowntimeProblems: downtime.problemId,
            Id_HourlyProd: hour.hourlyProductionId,
            machine: downtime.machineId || this.session.machine?.id || undefined
        }).subscribe({
            next: () => {
                const newDowntime: DowntimeExtended = {
                    Total_Downtime: downtime.duration,
                    Comment_Downtime: downtime.comment,
                    Id_DowntimeProblems: downtime.problemId,
                    Id_HourlyProd: hour.hourlyProductionId!,
                    machine: downtime.machineId || this.session.machine?.id,
                    machine_name: this.session.machine?.name,
                    problemName: this.downtimeProblems.find(p => p.Id_DowntimeProblems === downtime.problemId)?.Name_DowntimeProblems
                };
                hour.downtimes.push(newDowntime);
                hour.totalDowntime = hour.downtimes.reduce((sum, dt) => sum + dt.Total_Downtime, 0);

                // Save session to localStorage after adding downtime
                this.saveSessionToStorage();

                this.closeHourDialog();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Saved',
                    detail: `Hour ${hour.hour} production and downtime saved`
                });
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.detail || 'Failed to save downtime'
                });
            }
        });
    }

    fetchProductionIdThenSaveDowntime(hourIndex: number, downtime: { duration: number; problemId: number; comment: string }): void {
        const hour = this.session.hours[hourIndex];
        const productionData = hour.hourlyProductionId as any;

        if (!productionData || !productionData.date || !productionData.shift || !productionData.hour) {
            console.error('Invalid production data:', productionData);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Unable to identify production record'
            });
            return;
        }

        // Fetch the production ID from backend using date/shift/hour
        this.productionService.getHourlyProductions({
            date: productionData.date,
            shift: productionData.shift,
            hour: productionData.hour
        }).subscribe({
            next: (productions: any[]) => {
                console.log('Fetched productions:', productions);

                if (productions && productions.length > 0) {
                    // Get the ID from the first matching production
                    const production = productions[0];
                    hour.hourlyProductionId = production.id || production.Id_HourlyProd;

                    console.log('Extracted production ID:', hour.hourlyProductionId);

                    // Now try to save downtime again
                    this.saveDowntimeForHour(hourIndex, downtime);
                } else {
                    console.error('No production found for:', productionData);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Production record not found. Please refresh and try again.'
                    });
                }
            },
            error: (error) => {
                console.error('Error fetching production ID:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to fetch production record'
                });
            }
        });
    }

    /**
     * Fetch the real production ID from backend and then save team assignments
     * This handles the case where hourlyProductionId is a composite string or object
     * @param hour - The hour production state
     * @param teamToSave - The team to save (captured BEFORE async call to avoid race condition)
     */
    fetchProductionIdThenSaveTeam(hour: HourlyProductionState, teamToSave: EmployeeWithAssignment[]): void {
        const productionData = hour.hourlyProductionId as any;

        console.log('fetchProductionIdThenSaveTeam called with team size:', teamToSave.length);

        if (teamToSave.length === 0) {
            console.warn('No team to save for hour:', hour.hour);
            return;
        }

        // Check if it's already a valid numeric ID
        if (typeof productionData === 'number' && productionData > 0) {
            this.saveTeamAssignmentsForHour(productionData, teamToSave);
            return;
        }

        // Check if it's a numeric string
        if (typeof productionData === 'string' && !isNaN(Number(productionData)) && Number(productionData) > 0) {
            this.saveTeamAssignmentsForHour(Number(productionData), teamToSave);
            return;
        }

        // It's a composite string like "2023-01-15_1_1" - need to fetch real ID
        // Parse composite string if needed
        let queryParams: any;

        if (typeof productionData === 'string' && productionData.includes('_')) {
            const parts = productionData.split('_');
            if (parts.length >= 3) {
                queryParams = {
                    date: parts[0],
                    shift: parseInt(parts[1]),
                    hour: parseInt(parts[2]),
                    partId: this.session.part?.Id_Part,
                    lineId: this.session.productionLine?.id
                };
            }
        } else if (typeof productionData === 'object' && productionData?.date) {
            queryParams = {
                date: productionData.date,
                shift: productionData.shift,
                hour: productionData.hour,
                partId: this.session.part?.Id_Part,
                lineId: this.session.productionLine?.id
            };
        }

        if (!queryParams) {
            console.error('Unable to parse production ID for team assignment:', productionData);
            return;
        }

        console.log('Fetching production ID for team assignments:', queryParams);

        // Fetch the production ID from backend
        this.productionService.getHourlyProductions(queryParams).subscribe({
            next: (productions: any[]) => {
                if (productions && productions.length > 0) {
                    const production = productions[0];
                    const realId = production.id || production.Id_HourlyProd;

                    if (realId) {
                        console.log('Found real production ID for team assignment:', realId);
                        // Update the hour's ID for future use
                        hour.hourlyProductionId = realId;
                        // Now save team assignments with the real ID and captured team
                        this.saveTeamAssignmentsForHour(realId, teamToSave);
                    } else {
                        console.error('Production found but no ID extracted:', production);
                    }
                } else {
                    console.error('No production found for team assignment:', queryParams);
                }
            },
            error: (error) => {
                console.error('Error fetching production ID for team assignment:', error);
            }
        });
    }

    // ==================== MULTIPLE DOWNTIMES IN DIALOG ====================

    saveAllDowntimesForHour(hourIndex: number, hourlyProductionId: number): void {
        const hour = this.session.hours[hourIndex];
        const downtimes = this.hourProductionInput.downtimes || [];

        if (downtimes.length === 0) {
            this.closeHourDialog();
            this.messageService.add({
                severity: 'success',
                summary: 'Saved',
                detail: `Hour ${hour.hour} production saved successfully`
            });
            return;
        }

        let savedCount = 0;
        let errorCount = 0;
        const totalToSave = downtimes.length;

        // Track which downtimes need to be deleted (existing ones not in the list anymore)
        const existingDowntimeIds = hour.downtimes.map(d => d.Id_Downtime).filter(id => id);
        const currentDowntimeIds = downtimes.map(d => d.id).filter(id => id);
        const toDelete = existingDowntimeIds.filter(id => !currentDowntimeIds.includes(id));

        // Delete removed downtimes
        toDelete.forEach(id => {
            this.productionService.deleteDowntime(id!).subscribe({
                next: () => console.log('Deleted downtime:', id),
                error: (err) => console.error('Error deleting downtime:', err)
            });
        });

        // Save/update downtimes
        downtimes.forEach((dt) => {
            const downtimePayload: any = {
                Total_Downtime: dt.duration,
                Comment_Downtime: dt.comment,
                Id_HourlyProd: hourlyProductionId,
                Id_Downtime: dt.id // Include ID for updates
            };

            // Only include problemId if it's a valid non-zero value
            if (dt.problemId && dt.problemId > 0) {
                downtimePayload.Id_DowntimeProblems = dt.problemId;
            }

            // Include machine if specified
            if (dt.machineId) {
                downtimePayload.machine = dt.machineId;
            }

            const saveObs = dt.id
                ? this.productionService.updateDowntime(dt.id, downtimePayload)
                : this.productionService.saveDowntime(downtimePayload);

            saveObs.subscribe({
                next: (response: any) => {
                    savedCount++;
                    // Update the ID if it was a new downtime
                    if (!dt.id && response?.id) {
                        dt.id = response.id;
                    }

                    if (savedCount + errorCount === totalToSave) {
                        this.finalizeSaveDowntimes(hourIndex, hourlyProductionId, savedCount, errorCount);
                    }
                },
                error: (error) => {
                    errorCount++;
                    console.error('Error saving downtime:', error);

                    if (savedCount + errorCount === totalToSave) {
                        this.finalizeSaveDowntimes(hourIndex, hourlyProductionId, savedCount, errorCount);
                    }
                }
            });
        });
    }

    finalizeSaveDowntimes(hourIndex: number, hourlyProductionId: number, savedCount: number, errorCount: number): void {
        const hour = this.session.hours[hourIndex];

        // Update hour's downtimes from dialog input
        hour.downtimes = (this.hourProductionInput.downtimes || []).map(dt => ({
            Id_Downtime: dt.id,
            Total_Downtime: dt.duration,
            Comment_Downtime: dt.comment,
            Id_DowntimeProblems: dt.problemId,
            Id_HourlyProd: hourlyProductionId,
            problemName: this.getDowntimeProblemName(dt.problemId)
        }));

        hour.totalDowntime = hour.downtimes.reduce((sum, dt) => sum + dt.Total_Downtime, 0);

        // Save session to localStorage
        this.saveSessionToStorage();

        this.closeHourDialog();

        if (errorCount > 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Partially Saved',
                detail: `Hour ${hour.hour}: ${savedCount} downtimes saved, ${errorCount} failed`
            });
        } else {
            this.messageService.add({
                severity: 'success',
                summary: 'Saved',
                detail: `Hour ${hour.hour} production and ${savedCount} downtime(s) saved successfully`
            });
        }
    }

    getDowntimeProblemName(problemId: number): string {
        const problem = this.downtimeProblems.find(p => p.Id_DowntimeProblems === problemId);
        return problem?.Name_DowntimeProblems || 'Unknown';
    }

    getMachineName(machineId: number | undefined): string {
        if (!machineId) return '';
        const machine = this.machines.find(m => m.id === machineId);
        return machine?.name || '';
    }

    getTotalDowntimeInDialog(): number {
        if (!this.hourProductionInput.downtimes) return 0;
        return this.hourProductionInput.downtimes.reduce((sum, dt) => sum + dt.duration, 0);
    }

    editDowntimeInDialog(index: number): void {
        const dt = this.hourProductionInput.downtimes![index];
        this.newDowntimeInput = {
            id: dt.id,
            duration: dt.duration,
            problemId: dt.problemId,
            machineId: dt.machineId,
            comment: dt.comment
        };
        this.editingDowntimeDialogIndex = index;
        this.showAddDowntimeForm = true;
    }

    removeDowntimeFromDialog(index: number): void {
        if (!this.hourProductionInput.downtimes) return;
        this.hourProductionInput.downtimes.splice(index, 1);
    }

    resetNewDowntimeForm(): void {
        this.newDowntimeInput = {
            duration: 0,
            problemId: 0,
            machineId: undefined,
            comment: ''
        };
        this.editingDowntimeDialogIndex = null;
    }

    confirmAddDowntimeInDialog(): void {
        if (this.newDowntimeInput.duration <= 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid Input',
                detail: 'Please enter a valid duration'
            });
            return;
        }

        // Validate Description is required
        if (!this.newDowntimeInput.comment || this.newDowntimeInput.comment.trim() === '') {
            this.messageService.add({
                severity: 'warn',
                summary: 'Required Field',
                detail: 'Description is required'
            });
            return;
        }

        if (!this.hourProductionInput.downtimes) {
            this.hourProductionInput.downtimes = [];
        }

        if (this.editingDowntimeDialogIndex !== null) {
            // Update existing
            this.hourProductionInput.downtimes[this.editingDowntimeDialogIndex] = {
                id: this.newDowntimeInput.id,
                duration: this.newDowntimeInput.duration,
                problemId: this.newDowntimeInput.problemId,
                machineId: this.newDowntimeInput.machineId,
                comment: this.newDowntimeInput.comment
            };
        } else {
            // Add new
            this.hourProductionInput.downtimes.push({
                duration: this.newDowntimeInput.duration,
                problemId: this.newDowntimeInput.problemId,
                machineId: this.newDowntimeInput.machineId,
                comment: this.newDowntimeInput.comment
            });
        }

        this.hourProductionInput.hasDowntime = true;
        this.showAddDowntimeForm = false;
        this.resetNewDowntimeForm();
    }

    cancelAddDowntimeInDialog(): void {
        this.showAddDowntimeForm = false;
        this.resetNewDowntimeForm();
    }

    // ==================== ADDITIONAL DOWNTIME ====================

    openDowntimeDialog(hourIndex: number): void {
        const hour = this.session.hours[hourIndex];

        if (!hour.hourlyProductionId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Production Not Saved',
                detail: 'Please save production for this hour first'
            });
            return;
        }

        this.downtimeHourIndex = hourIndex;

        // Pre-fill with existing downtime data if available (edit mode)
        if (hour.downtimes && hour.downtimes.length > 0) {
            const existingDowntime = hour.downtimes[0]; // Use the first downtime
            this.editingDowntimeIndex = 0; // Mark as editing the first downtime
            this.downtimeInput = {
                Total_Downtime: existingDowntime.Total_Downtime || 0,
                Id_DowntimeProblems: existingDowntime.Id_DowntimeProblems || 0,
                Comment_Downtime: existingDowntime.Comment_Downtime || '',
                Id_Downtime: existingDowntime.Id_Downtime // Keep the ID for update
            };
        } else {
            this.editingDowntimeIndex = null; // New downtime
            this.downtimeInput = {
                Total_Downtime: 0,
                Id_DowntimeProblems: 0,
                Comment_Downtime: ''
            };
        }

        this.showDowntimeDialog = true;
    }

    closeDowntimeDialog(): void {
        this.showDowntimeDialog = false;
        this.downtimeHourIndex = null;
        this.editingDowntimeIndex = null;
    }

    saveAdditionalDowntime(): void {
        if (this.downtimeHourIndex === null) return;

        const hour = this.session.hours[this.downtimeHourIndex];

        if (this.downtimeInput.Total_Downtime <= 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid Input',
                detail: 'Please enter a valid duration'
            });
            return;
        }

        // Validate Description is required
        if (!this.downtimeInput.Comment_Downtime || this.downtimeInput.Comment_Downtime.trim() === '') {
            this.messageService.add({
                severity: 'warn',
                summary: 'Required Field',
                detail: 'Description is required'
            });
            return;
        }

        // If hourlyProductionId is an object (not fetched yet), try to fetch it first
        if (typeof hour.hourlyProductionId === 'object') {
            console.log('Fetching real production ID before saving additional downtime...');
            const productionData = hour.hourlyProductionId as any;

            this.productionService.getHourlyProductions({
                date: productionData.date,
                shift: productionData.shift,
                hour: productionData.hour
            }).subscribe({
                next: (productions: any[]) => {
                    if (productions && productions.length > 0) {
                        hour.hourlyProductionId = productions[0].id || productions[0].Id_HourlyProd;
                        console.log('Got production ID, saving downtime now:', hour.hourlyProductionId);
                        this.saveAdditionalDowntime(); // Retry
                    }
                },
                error: (error) => {
                    console.error('Error fetching production ID:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to fetch production record'
                    });
                }
            });
            return;
        }

        // Check if we're editing an existing downtime or creating a new one
        const isEditing = hour.downtimes && hour.downtimes.length > 0 && this.editingDowntimeIndex !== null;

        const downtimePayload = {
            ...this.downtimeInput,
            Id_HourlyProd: hour.hourlyProductionId!
        };

        // If editing existing, include the ID for update
        if (isEditing && hour.downtimes[this.editingDowntimeIndex!]?.Id_Downtime) {
            (downtimePayload as any).Id_Downtime = hour.downtimes[this.editingDowntimeIndex!].Id_Downtime;
        }

        this.productionService.saveDowntime(downtimePayload).subscribe({
            next: (savedDowntime: any) => {
                const downtimeData: DowntimeExtended = {
                    ...this.downtimeInput,
                    Id_HourlyProd: hour.hourlyProductionId!,
                    Id_Downtime: savedDowntime?.id || savedDowntime?.Id_Downtime,
                    problemName: this.downtimeProblems.find(p => p.Id_DowntimeProblems === this.downtimeInput.Id_DowntimeProblems)?.Name_DowntimeProblems
                };

                if (isEditing && this.editingDowntimeIndex !== null) {
                    // Update existing downtime
                    hour.downtimes[this.editingDowntimeIndex] = downtimeData;
                } else {
                    // Add new downtime
                    hour.downtimes.push(downtimeData);
                }

                hour.totalDowntime = hour.downtimes.reduce((sum, dt) => sum + dt.Total_Downtime, 0);

                // Save session to localStorage after adding/updating downtime
                this.saveSessionToStorage();

                this.closeDowntimeDialog();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Saved',
                    detail: isEditing ? 'Downtime updated successfully' : 'Downtime added successfully'
                });
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.detail || 'Failed to save downtime'
                });
            }
        });
    }

    // ==================== UTILITY METHODS ====================

    getHourStatusClass(status: HourStatus): string {
        const map: Record<HourStatus, string> = {
            'not_started': 'status-not-started',
            'in_progress': 'status-in-progress',
            'completed': 'status-completed'
        };
        return map[status];
    }

    getHourStatusIcon(status: HourStatus): string {
        const map: Record<HourStatus, string> = {
            'not_started': 'pi-circle',
            'in_progress': 'pi-clock',
            'completed': 'pi-check-circle'
        };
        return map[status];
    }

    getHourStatusLabel(status: HourStatus): string {
        const map: Record<HourStatus, string> = {
            'not_started': 'Not Started',
            'in_progress': 'In Progress',
            'completed': 'Completed'
        };
        return map[status];
    }

    getEfficiencySeverity(efficiency: number | null): 'success' | 'info' | 'warn' | 'danger' {
        if (efficiency === null) return 'info';
        if (efficiency >= 100) return 'success';
        if (efficiency >= 90) return 'info';
        if (efficiency >= 80) return 'warn';
        return 'danger';
    }

    getProductTypeLabel(type: string | undefined): string {
        if (!type) return 'N/A';
        return type === 'semi_finished' ? 'Semi-Finished' : 'Finished Good';
    }

    getProductTypeSeverity(type: string | undefined): 'warn' | 'success' | 'secondary' {
        if (!type) return 'secondary';
        return type === 'semi_finished' ? 'warn' : 'success';
    }

    getQualificationSeverity(level: number | undefined): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
        if (!level) return 'secondary';
        if (level >= 4) return 'success';
        if (level >= 3) return 'info';
        if (level >= 2) return 'warn';
        return 'danger';
    }

    /**
     * Get qualification status label based on validity and end date
     */
    getQualificationStatusLabel(emp: EmployeeWithAssignment): string {
        // Check if operator by category pattern (same logic as isOperator detection)
        const category = (emp.Categorie_Emp || '').toLowerCase();
        const isOperatorByCategory = category.includes('operator') ||
                                      category.includes('operateur') ||
                                      category.includes('opérateur') ||
                                      category === '';
        // Non-operators don't need qualification status
        if (!isOperatorByCategory) {
            return '-';
        }

        if (emp.isNonQualified || !emp.qualificationValid) {
            return 'Expired';
        }

        // Check if expiring soon (within 30 days)
        if (emp.qualificationEndDate) {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const endDate = new Date(emp.qualificationEndDate);
            if (endDate <= thirtyDaysFromNow) {
                return 'Expiring';
            }
        }

        return 'Valid';
    }

    /**
     * Get qualification status severity for tag color
     */
    getQualificationStatusSeverity(emp: EmployeeWithAssignment): 'success' | 'warn' | 'danger' | 'secondary' {
        // Check if operator by category pattern (same logic as isOperator detection)
        const category = (emp.Categorie_Emp || '').toLowerCase();
        const isOperatorByCategory = category.includes('operator') ||
                                      category.includes('operateur') ||
                                      category.includes('opérateur') ||
                                      category === '';
        // Non-operators: neutral color (grey)
        if (!isOperatorByCategory) {
            return 'secondary';
        }

        if (emp.isNonQualified || !emp.qualificationValid) {
            return 'danger';
        }

        // Check if expiring soon (within 30 days)
        if (emp.qualificationEndDate) {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const endDate = new Date(emp.qualificationEndDate);
            if (endDate <= thirtyDaysFromNow) {
                return 'warn';
            }
        }

        return 'success';
    }

    /**
     * Create a new production - clears current session and starts fresh
     */
    createNewProduction(): void {
        // Confirm if there's unsaved data
        if (this.hasUnsavedChanges()) {
            this.confirmationService.confirm({
                message: 'You have unsaved changes. Are you sure you want to start a new production?',
                header: 'Confirm New Production',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Yes, Start New',
                rejectLabel: 'Cancel',
                accept: () => {
                    this.startNewProduction();
                }
            });
        } else {
            this.startNewProduction();
        }
    }

    /**
     * Start a new production by clearing state and navigating
     */
    private startNewProduction(): void {
        // Clear localStorage session
        localStorage.removeItem('dms_production_session');

        // Reset component state
        this.mode = 'new';
        this.loadedProductionId = null;
        this.resetSession();

        // Navigate to clean URL
        this.router.navigate(['/dms-production/production'], {
            queryParams: { mode: 'new' }
        });

        // Show success message
        this.messageService.add({
            severity: 'info',
            summary: 'New Production',
            detail: 'Ready to start a new production entry',
            life: 3000
        });
    }

    /**
     * Check if there are unsaved changes in the current session
     */
    private hasUnsavedChanges(): boolean {
        // Check if any data has been entered
        return this.session.isSetupComplete ||
               this.session.team.length > 0 ||
               this.session.hours.some(h => (h.output ?? 0) > 0);
    }

    resetSession(): void {
        this.session = {
            shift: null,
            date: new Date(),
            project: null,
            productionLine: null,
            process: null,
            part: null,
            machine: null,
            zone: null,
            orderNo: '',
            team: [],
            actors: {
                lineLeader: { badgeId: '', name: '', qualification: '' },
                qualityAgent: { badgeId: '', name: '', qualification: '' },
                maintenanceTech: { badgeId: '', name: '', qualification: '' },
                pqc: { badgeId: '', name: '', qualification: '' }
            },
            hours: [],
            isSetupComplete: false,
            isTeamComplete: false,
            currentHourIndex: null
        };

        this.shiftSetupForm.reset({ date: new Date() });
        this.employeeIdScan = '';
        this.selectedWorkstation = null;
        this.selectedMachineForAssignment = null;
        this.filteredMachinesForAssignment = [];

        this.messageService.add({
            severity: 'info',
            summary: 'Session Reset',
            detail: 'All data has been cleared. Start a new shift.'
        });

        // Clear saved session
        this.clearSavedSession();
    }

    // ==================== SESSION PERSISTENCE ====================

    saveSessionToStorage(): void {
        try {
            // Get current team from state service to ensure we save the latest
            const currentTeam = this.teamState.team();

            // Also keep session.team in sync
            this.session.team = [...currentTeam];

            const sessionData = {
                session: {
                    ...this.session,
                    date: this.session.date instanceof Date ? this.session.date.toISOString() : this.session.date,
                    // Explicitly save the team from state service
                    team: currentTeam,
                    // Explicitly save isTeamComplete
                    isTeamComplete: this.session.isTeamComplete
                },
                formValues: this.shiftSetupForm.value,
                timestamp: new Date().toISOString()
            };

            // Log what we're saving for debugging
            console.log('Saving session to localStorage:', {
                teamLength: currentTeam.length,
                isTeamComplete: this.session.isTeamComplete,
                isSetupComplete: this.session.isSetupComplete,
                hoursCount: this.session.hours.length
            });

            localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessionData));

            // Log for debugging
            const hourTeamCounts = this.session.hours.map(h => ({ hour: h.hour, teamCount: (h.team || []).length }));
            console.log('Session saved to localStorage. Main team:', currentTeam.length, 'employees. Per-hour teams:', hourTeamCounts);
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    restoreSessionFromStorage(): boolean {
        try {
            const savedData = localStorage.getItem(this.SESSION_STORAGE_KEY);
            if (!savedData) {
                return false;
            }

            const parsed = JSON.parse(savedData);

            // Check if session is from today and recent (within 12 hours)
            const savedTime = new Date(parsed.timestamp);
            const now = new Date();
            const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);

            if (hoursDiff > 12) {
                console.log('Saved session is too old, clearing...');
                this.clearSavedSession();
                return false;
            }

            // Restore session
            console.log('Restoring session. Saved hour types:', parsed.session.hours?.map((h: any) => ({ hour: h.hour, type: h.hourType })));

            this.session = {
                ...parsed.session,
                date: new Date(parsed.session.date),
                // Ensure team array is preserved
                team: parsed.session.team || [],
                // Ensure hours array has all required properties with defaults
                hours: (parsed.session.hours || []).map((h: any) => ({
                    ...h,
                    downtimes: h.downtimes || [],
                    totalDowntime: h.totalDowntime || 0,
                    hourType: h.hourType, // Preserve hour type from saved session (will be synced after shiftTypes load)
                    team: h.team || [] // Preserve per-hour team assignments
                }))
            };

            // Log restored session state for debugging
            console.log('Session restored - isSetupComplete:', this.session.isSetupComplete);
            console.log('Session restored - isTeamComplete:', this.session.isTeamComplete);
            console.log('Session restored - team array:', this.session.team);
            console.log('Session restored - team length:', this.session.team?.length || 0);

            // Sync team with state service for reactive UI updates
            if (this.session.team && this.session.team.length > 0) {
                console.log('Restoring main team to teamState:', this.session.team.length, 'employees');
                this.teamState.setTeam(this.session.team);

                // Ensure isTeamComplete is set if team has members
                if (!this.session.isTeamComplete) {
                    console.log('Setting isTeamComplete to true because team has members');
                    this.session.isTeamComplete = true;
                }
            } else {
                console.log('No team members to restore from localStorage');
                // Try to load from teamState's localStorage as fallback
                const fallbackTeam = this.teamState.loadFromLocalStorage();
                if (fallbackTeam && fallbackTeam.length > 0) {
                    console.log('Fallback: Loaded team from teamState localStorage:', fallbackTeam.length, 'employees');
                    this.session.team = fallbackTeam;
                    this.session.isTeamComplete = true;
                }
            }

            // Log per-hour teams for debugging
            const hourTeamCounts = this.session.hours.map(h => ({ hour: h.hour, teamCount: (h.team || []).length }));
            console.log('Restored per-hour teams:', hourTeamCounts);

            // Restore form values after reference data is loaded
            setTimeout(() => {
                if (parsed.formValues && this.session.isSetupComplete) {
                    // Find and set the objects from reference data
                    const shift = this.shifts.find(s => s.id === parsed.session.shift?.id);
                    const project = this.projects.find(p => p.Id_Project === parsed.session.project?.Id_Project);

                    // If shift was deleted, clear the session and notify user
                    if (!shift && parsed.session.shift?.id) {
                        console.log('Saved session shift no longer exists, clearing...');
                        this.clearSavedSession();
                        this.resetSession();
                        this.messageService.add({
                            severity: 'warn',
                            summary: 'Session Cleared',
                            detail: 'The saved shift no longer exists. Please start a new session.',
                            life: 5000
                        });
                        return;
                    }

                    // If project was deleted, clear the session
                    if (!project && parsed.session.project?.Id_Project) {
                        console.log('Saved session project no longer exists, clearing...');
                        this.clearSavedSession();
                        this.resetSession();
                        this.messageService.add({
                            severity: 'warn',
                            summary: 'Session Cleared',
                            detail: 'The saved project no longer exists. Please start a new session.',
                            life: 5000
                        });
                        return;
                    }

                    if (shift && project) {
                        this.loadProductionLines(project.Id_Project);
                        this.loadParts(project.Id_Project);

                        setTimeout(() => {
                            const line = this.productionLines.find(l => l.id === parsed.session.productionLine?.id);
                            const part = this.parts.find(p => p.Id_Part === parsed.session.part?.Id_Part);

                            this.shiftSetupForm.patchValue({
                                shift: shift,
                                date: new Date(parsed.session.date),
                                project: project,
                                productionLine: line,
                                partNumber: part
                            });

                            if (project) {
                                this.loadWorkstationsByProject(project.Id_Project);
                            }

                            // Regenerate hours with fresh shift data from backend
                            // This ensures shift time changes are reflected
                            if (shift && part && this.session.isSetupComplete) {
                                const oldHours = this.session.hours;
                                const newHours = this.generateShiftHours(shift, part);

                                // Preserve existing hour data (output, scrap, status, etc.)
                                newHours.forEach((newHour, index) => {
                                    const oldHour = oldHours.find(h => h.hour === newHour.hour);
                                    if (oldHour) {
                                        newHour.output = oldHour.output;
                                        newHour.scrap = oldHour.scrap;
                                        newHour.status = oldHour.status;
                                        newHour.efficiency = oldHour.efficiency;
                                        newHour.scrapRate = oldHour.scrapRate;
                                        newHour.downtimes = oldHour.downtimes || [];
                                        newHour.totalDowntime = oldHour.totalDowntime || 0;
                                        newHour.hourlyProductionId = oldHour.hourlyProductionId;
                                        // Preserve hour type (shift type) from saved session
                                        newHour.hourType = oldHour.hourType || this.getDefaultHourType();
                                        // Preserve per-hour team assignments
                                        newHour.team = oldHour.team || [];
                                    }
                                });

                                this.session.hours = newHours;
                                this.session.shift = shift; // Update with fresh shift data
                                console.log('Hours regenerated. Hour types after restore:', newHours.map(h => ({ hour: h.hour, type: h.hourType })));

                                // Sync hours with valid shift type codes
                                this.syncHoursWithShiftTypes();
                            }
                        }, 500);
                    }
                }
            }, 1000);

            this.messageService.add({
                severity: 'success',
                summary: 'Session Restored',
                detail: 'Your previous session has been restored.'
            });

            return true;
        } catch (error) {
            console.error('Error restoring session:', error);
            this.clearSavedSession();
            return false;
        }
    }

    clearSavedSession(): void {
        localStorage.removeItem(this.SESSION_STORAGE_KEY);
    }

    hasSavedSession(): boolean {
        return localStorage.getItem(this.SESSION_STORAGE_KEY) !== null;
    }

    // ==================== SHIFT REPORT ====================

    /**
     * Open the shift report dialog
     */
    openShiftReport(): void {
        this.showShiftReportDialog = true;
    }

    /**
     * Close the shift report dialog
     */
    closeShiftReport(): void {
        this.showShiftReportDialog = false;
    }

    /**
     * Get all unique employees across all hours
     */
    getAllShiftEmployees(): EmployeeWithAssignment[] {
        const employeeMap = new Map<number, EmployeeWithAssignment>();

        // Add employees from each completed hour
        this.session.hours.forEach(hour => {
            if (hour.team && hour.team.length > 0) {
                hour.team.forEach(emp => {
                    if (!employeeMap.has(emp.Id_Emp)) {
                        employeeMap.set(emp.Id_Emp, emp);
                    }
                });
            }
        });

        // Also include current team state if no hours have team data
        if (employeeMap.size === 0) {
            this.teamState.team().forEach(emp => {
                employeeMap.set(emp.Id_Emp, emp);
            });
        }

        return Array.from(employeeMap.values());
    }

    /**
     * Get hours worked by a specific employee
     */
    getEmployeeHoursWorked(employeeId: number): number[] {
        const hoursWorked: number[] = [];

        this.session.hours.forEach((hour, index) => {
            if (hour.team && hour.team.some(emp => emp.Id_Emp === employeeId)) {
                hoursWorked.push(index + 1);
            }
        });

        return hoursWorked;
    }

    /**
     * Format hours list for display (e.g., "H1, H2, H3")
     */
    formatHoursList(hours: number[]): string {
        if (hours.length === 0) return 'Aucune heure';
        return hours.map(h => `H${h}`).join(', ');
    }

    /**
     * Get report summary statistics
     */
    getReportSummary(): {
        totalEmployees: number;
        totalHoursCompleted: number;
        totalOutput: number;
        totalScrap: number;
        totalDowntime: number;
        overallEfficiency: number;
    } {
        return {
            totalEmployees: this.getAllShiftEmployees().length,
            totalHoursCompleted: this.completedHours,
            totalOutput: this.shiftTotalOutput,
            totalScrap: this.shiftTotalScrap,
            totalDowntime: this.shiftTotalDowntime,
            overallEfficiency: this.shiftOverallEfficiency
        };
    }

    /**
     * Get team count for a specific hour
     */
    getHourTeamCount(hour: HourlyProductionState): number {
        return hour.team?.length || 0;
    }

    /**
     * Check if an employee worked a specific hour
     */
    employeeWorkedHour(hour: HourlyProductionState, employeeId: number): boolean {
        return hour.team?.some(emp => emp.Id_Emp === employeeId) || false;
    }

    // ==================== REPORT EXPORT FUNCTIONS ====================

    /**
     * Generate filename for exports
     */
    private getExportFilename(extension: string): string {
        const date = this.session.date ? new Date(this.session.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const shift = this.session.shift?.name || 'Shift';
        const line = this.session.productionLine?.name || 'Line';
        return `Rapport_${line}_${shift}_${date}.${extension}`;
    }

    /**
     * Prepare hourly data for export
     */
    private getHourlyExportData(): any[] {
        return this.session.hours.map((hour, index) => ({
            'Heure': `H${index + 1}`,
            'Plage Horaire': hour.timeRange,
            'Type': this.getHourTypeLabel(hour.hourType),
            'Statut': hour.status === 'completed' ? 'Termine' : (hour.status === 'in_progress' ? 'En cours' : 'Non demarre'),
            'Output': hour.output ?? '-',
            'Target': hour.target,
            'Efficacite (%)': hour.efficiency ?? '-',
            'Scrap': hour.scrap ?? '-',
            'Downtime (min)': hour.totalDowntime,
            'Equipe': this.getHourTeamCount(hour)
        }));
    }

    /**
     * Prepare employee data for export
     */
    private getEmployeeExportData(): any[] {
        return this.getAllShiftEmployees().map(emp => ({
            'Nom': `${emp.Prenom_Emp} ${emp.Nom_Emp}`,
            'Badge': emp.badgeId || emp.BadgeNumber || `EMP-${emp.Id_Emp}`,
            'Categorie': emp.Categorie_Emp || emp.role || 'Operator',
            'Poste': emp.workstation || 'Non assigne',
            'Heures Travaillees': this.formatHoursList(this.getEmployeeHoursWorked(emp.Id_Emp)),
            'Total Heures': this.getEmployeeHoursWorked(emp.Id_Emp).length
        }));
    }

    /**
     * Export report to CSV format
     */
    exportToCSV(): void {
        try {
            // Summary section
            const summary = [
                ['RAPPORT DETAILLE DU SHIFT'],
                [''],
                ['Informations Generales'],
                ['Shift', this.session.shift?.name || 'N/A'],
                ['Date', this.session.date ? new Date(this.session.date).toLocaleDateString('fr-FR') : 'N/A'],
                ['Ligne', this.session.productionLine?.name || 'N/A'],
                ['Piece', this.session.part?.PN_Part || 'N/A'],
                [''],
                ['Resume'],
                ['Production Totale', `${this.shiftTotalOutput} / ${this.shiftTotalTarget}`],
                ['Efficacite', `${this.shiftOverallEfficiency}%`],
                ['Scrap Total', this.shiftTotalScrap],
                ['Downtime Total', `${this.shiftTotalDowntime} min`],
                ['']
            ];

            // Hourly data section
            const hourlyData = this.getHourlyExportData();
            const hourlyHeaders = Object.keys(hourlyData[0] || {});
            const hourlyRows = hourlyData.map(row => hourlyHeaders.map(h => row[h]));

            // Employee data section
            const employeeData = this.getEmployeeExportData();
            const employeeHeaders = Object.keys(employeeData[0] || {});
            const employeeRows = employeeData.map(row => employeeHeaders.map(h => row[h]));

            // Combine all sections
            const csvContent = [
                ...summary.map(row => row.join(',')),
                'DETAIL PAR HEURE',
                hourlyHeaders.join(','),
                ...hourlyRows.map(row => row.join(',')),
                '',
                'EMPLOYES ET HEURES TRAVAILLEES',
                employeeHeaders.join(','),
                ...employeeRows.map(row => row.join(','))
            ].join('\n');

            // Add BOM for Excel UTF-8 compatibility
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
            saveAs(blob, this.getExportFilename('csv'));

            this.messageService.add({
                severity: 'success',
                summary: 'Export CSV',
                detail: 'Rapport exporte en CSV avec succes'
            });
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Erreur lors de l\'export CSV'
            });
        }
    }

    /**
     * Export report to Excel format
     */
    exportToExcel(): void {
        try {
            const workbook = XLSX.utils.book_new();

            // Summary sheet
            const summaryData = [
                ['RAPPORT DETAILLE DU SHIFT'],
                [''],
                ['Informations Generales'],
                ['Shift', this.session.shift?.name || 'N/A'],
                ['Date', this.session.date ? new Date(this.session.date).toLocaleDateString('fr-FR') : 'N/A'],
                ['Ligne', this.session.productionLine?.name || 'N/A'],
                ['Piece', this.session.part?.PN_Part || 'N/A'],
                [''],
                ['Resume'],
                ['Production Totale', `${this.shiftTotalOutput} / ${this.shiftTotalTarget}`],
                ['Efficacite', `${this.shiftOverallEfficiency}%`],
                ['Scrap Total', this.shiftTotalScrap],
                ['Downtime Total', `${this.shiftTotalDowntime} min`]
            ];
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resume');

            // Hourly data sheet
            const hourlyData = this.getHourlyExportData();
            const hourlySheet = XLSX.utils.json_to_sheet(hourlyData);
            hourlySheet['!cols'] = [
                { wch: 8 }, { wch: 15 }, { wch: 10 }, { wch: 12 },
                { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 8 }
            ];
            XLSX.utils.book_append_sheet(workbook, hourlySheet, 'Detail Horaire');

            // Employee data sheet
            const employeeData = this.getEmployeeExportData();
            const employeeSheet = XLSX.utils.json_to_sheet(employeeData);
            employeeSheet['!cols'] = [
                { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 12 }
            ];
            XLSX.utils.book_append_sheet(workbook, employeeSheet, 'Employes');

            // Generate and save file
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, this.getExportFilename('xlsx'));

            this.messageService.add({
                severity: 'success',
                summary: 'Export Excel',
                detail: 'Rapport exporte en Excel avec succes'
            });
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Erreur lors de l\'export Excel'
            });
        }
    }

    /**
     * Export report to PDF format
     */
    exportToPDF(): void {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let yPos = 20;

            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('RAPPORT DETAILLE DU SHIFT', pageWidth / 2, yPos, { align: 'center' });
            yPos += 15;

            // General info
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Informations Generales', 14, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const infoLines = [
                `Shift: ${this.session.shift?.name || 'N/A'}`,
                `Date: ${this.session.date ? new Date(this.session.date).toLocaleDateString('fr-FR') : 'N/A'}`,
                `Ligne: ${this.session.productionLine?.name || 'N/A'}`,
                `Piece: ${this.session.part?.PN_Part || 'N/A'}`
            ];
            infoLines.forEach(line => {
                doc.text(line, 14, yPos);
                yPos += 6;
            });
            yPos += 5;

            // Summary
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Resume', 14, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const summaryLines = [
                `Production Totale: ${this.shiftTotalOutput} / ${this.shiftTotalTarget}`,
                `Efficacite: ${this.shiftOverallEfficiency}%`,
                `Scrap Total: ${this.shiftTotalScrap} pcs`,
                `Downtime Total: ${this.shiftTotalDowntime} min`
            ];
            summaryLines.forEach(line => {
                doc.text(line, 14, yPos);
                yPos += 6;
            });
            yPos += 10;

            // Hourly table
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Detail par Heure', 14, yPos);
            yPos += 5;

            const hourlyData = this.session.hours.map((hour, index) => [
                `H${index + 1}`,
                hour.timeRange,
                this.getHourTypeLabel(hour.hourType),
                hour.status === 'completed' ? 'OK' : (hour.status === 'in_progress' ? 'En cours' : '-'),
                hour.output?.toString() ?? '-',
                hour.target.toString(),
                hour.efficiency ? `${hour.efficiency}%` : '-',
                hour.scrap?.toString() ?? '-',
                hour.totalDowntime.toString()
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Heure', 'Plage', 'Type', 'Statut', 'Output', 'Target', 'Eff.', 'Scrap', 'DT']],
                body: hourlyData,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
                bodyStyles: { fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 18 },
                    3: { cellWidth: 18 },
                    4: { cellWidth: 18 },
                    5: { cellWidth: 18 },
                    6: { cellWidth: 15 },
                    7: { cellWidth: 18 },
                    8: { cellWidth: 15 }
                },
                margin: { left: 14 }
            });

            // Get final Y position after table
            yPos = (doc as any).lastAutoTable.finalY + 15;

            // Check if we need a new page for employees
            if (yPos > 200) {
                doc.addPage();
                yPos = 20;
            }

            // Employee table
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Employes et Heures Travaillees', 14, yPos);
            yPos += 5;

            const employeeData = this.getAllShiftEmployees().map(emp => [
                `${emp.Prenom_Emp} ${emp.Nom_Emp}`,
                emp.badgeId || emp.BadgeNumber || `EMP-${emp.Id_Emp}`,
                emp.Categorie_Emp || emp.role || 'Operator',
                emp.workstation || 'N/A',
                this.formatHoursList(this.getEmployeeHoursWorked(emp.Id_Emp)),
                this.getEmployeeHoursWorked(emp.Id_Emp).length.toString()
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Nom', 'Badge', 'Categorie', 'Poste', 'Heures', 'Total']],
                body: employeeData,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
                bodyStyles: { fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 35 },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 35 },
                    4: { cellWidth: 40 },
                    5: { cellWidth: 15 }
                },
                margin: { left: 14 }
            });

            // Footer
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                doc.text(
                    `Genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')} - Page ${i}/${pageCount}`,
                    pageWidth / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );
            }

            // Save file
            doc.save(this.getExportFilename('pdf'));

            this.messageService.add({
                severity: 'success',
                summary: 'Export PDF',
                detail: 'Rapport exporte en PDF avec succes'
            });
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Erreur lors de l\'export PDF'
            });
        }
    }
}
