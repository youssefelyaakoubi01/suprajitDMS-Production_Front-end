import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { interval, Subscription, forkJoin } from 'rxjs';
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
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ProductionService } from './production.service';
import { EmployeeService } from '../../core/services/employee.service';
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
    Zone
} from '../../core/models';
import {
    ShiftProductionSession,
    HourlyProductionState,
    HourProductionInput,
    DowntimeExtended,
    HourStatus,
    HourType
} from '../../core/models/production-session.model';
import { EmployeeWithAssignment, ProductionRole, ProductionRoleOption } from '../../core/models/employee.model';
import { environment } from '../../../environments/environment';

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
        TooltipModule
    ],
    providers: [MessageService],
    templateUrl: './production.component.html',
    styleUrls: ['./production.component.scss']
})
export class ProductionComponent implements OnInit, OnDestroy {
    // Production Session
    session: ShiftProductionSession = {
        shift: null,
        date: new Date(),
        project: null,
        productionLine: null,
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
    parts: Part[] = [];
    workstations: Workstation[] = [];
    machines: Machine[] = [];
    downtimeProblems: DowntimeProblem[] = [];
    shiftTypes: ShiftType[] = [];
    zones: Zone[] = [];

    // Hour Type Options - loaded from database
    hourTypeOptions: { label: string; value: string }[] = [];

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
    newDowntimeInput: { duration: number; problemId: number; comment: string; id?: number } = {
        duration: 0,
        problemId: 0,
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

    // Real-time tracking
    currentTime: Date = new Date();
    hourProgress = 0;
    private timerSubscription?: Subscription;

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
        private productionService: ProductionService,
        private employeeService: EmployeeService,
        private messageService: MessageService
    ) {}

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
    }

    checkQueryParams(): void {
        this.route.queryParams.subscribe(params => {
            console.log('Query params received:', params);

            if (params['mode']) {
                this.mode = params['mode'] as 'view' | 'edit';
            }
            if (params['id']) {
                // Handle both numeric IDs and string IDs
                const idValue = params['id'];
                if (!isNaN(Number(idValue))) {
                    this.loadedProductionId = Number(idValue);
                } else {
                    console.warn('Invalid production ID format:', idValue);
                    this.loadedProductionId = null;
                }
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
                this.loadWorkstations(line.id);
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

                    // Load workstations for this line
                    this.loadWorkstations(line.id);

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

                        // Map shift_type_code from backend to hourType
                        // Use shift_type_code if available, otherwise use hour_type or default
                        const backendHourType = (prod as any).shift_type_code || (prod as any).hour_type;
                        if (backendHourType && this.isHourTypeInOptions(backendHourType)) {
                            this.session.hours[hourIndex].hourType = backendHourType as HourType;
                        }

                        // Load downtimes for this hour
                        this.loadDowntimesForHour(hourIndex, prod.Id_HourlyProd);
                    }
                });

                // Mark team as complete if we have productions
                if (productions.length > 0) {
                    this.session.isTeamComplete = true;

                    // Load team assignments from ALL hourly productions (not just the first one)
                    // This ensures we get all team members even if they were assigned to different hours
                    const headcount = productions[0].HC_HourlyProdPN || 0;
                    this.loadTeamAssignmentsFromAllProductions(productions.map(p => p.Id_HourlyProd), headcount);
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

                                    // Avoid duplicates in session team
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

                    // After all requests complete, check if we found any assignments
                    if (completedRequests === hourlyProductionIds.length && totalAssignmentsFound === 0 && headcount > 0) {
                        // No team assignments in database but headcount was recorded
                        // Allow team editing and show info message
                        this.session.isTeamComplete = false;
                        this.messageService.add({
                            severity: 'info',
                            summary: 'Team Data Not Available',
                            detail: `This production was recorded with ${headcount} team members, but individual assignments were not saved. You can re-assign the team if needed.`,
                            life: 8000
                        });
                    }
                },
                error: (err) => {
                    console.error(`Error loading team assignments for production ${prodId}:`, err);
                    completedRequests++;
                }
            });
        });
    }

    saveTeamAssignmentsForHour(hourlyProductionId: number): void {
        // First, get existing assignments for this hourly production
        this.productionService.getTeamAssignments(hourlyProductionId).subscribe({
            next: (existingAssignments) => {
                const existingEmployeeIds = new Set(existingAssignments.map(a => a.employee || a.Id_Emp));

                // Only create assignments for employees not already assigned
                this.session.team.forEach(member => {
                    if (existingEmployeeIds.has(member.Id_Emp)) {
                        console.log(`Employee ${member.Id_Emp} already assigned, skipping...`);
                        return;
                    }

                    // Find the workstation ID from the workstation name
                    const workstation = this.workstations.find(w => w.Name_Workstation === member.workstation);
                    const workstationId = workstation?.Id_Workstation || this.workstations[0]?.Id_Workstation;

                    if (!workstationId) {
                        console.warn('No workstation found for team assignment');
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
                        next: (response) => {
                            console.log('Team assignment saved:', response);
                        },
                        error: (err) => {
                            // Silently handle duplicate errors (race condition)
                            if (err.status === 400 && err.error?.non_field_errors) {
                                console.log('Team assignment already exists (race condition), skipping...');
                            } else {
                                console.error('Error saving team assignment:', err.error);
                            }
                        }
                    });
                });
            },
            error: (err) => {
                console.error('Error fetching existing team assignments:', err);
                // Fallback: try to create all assignments anyway
                this.createAllTeamAssignments(hourlyProductionId);
            }
        });
    }

    private createAllTeamAssignments(hourlyProductionId: number): void {
        this.session.team.forEach(member => {
            const workstation = this.workstations.find(w => w.Name_Workstation === member.workstation);
            const workstationId = workstation?.Id_Workstation || this.workstations[0]?.Id_Workstation;

            if (!workstationId) return;

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
                error: () => {} // Silently ignore duplicates
            });
        });
    }

    ngOnDestroy(): void {
        this.timerSubscription?.unsubscribe();
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
            productionLine: [null, Validators.required],
            partNumber: [null, Validators.required],
            machine: [null],
            zone: [null]
        });

        // Watch for project changes
        this.shiftSetupForm.get('project')?.valueChanges.subscribe((project: Project) => {
            if (project) {
                // Reset child controls first WITHOUT triggering their valueChanges
                this.shiftSetupForm.patchValue(
                    { productionLine: null, partNumber: null, machine: null },
                    { emitEvent: false }
                );
                // Clear dependent arrays
                this.workstations = [];
                this.machines = [];
                // Then load new data
                this.loadProductionLines(project.Id_Project);
                this.loadParts(project.Id_Project);
            } else {
                // Clear all dependent data
                this.productionLines = [];
                this.parts = [];
                this.workstations = [];
                this.machines = [];
            }
        });

        // Watch for production line changes
        this.shiftSetupForm.get('productionLine')?.valueChanges.subscribe((line: ProductionLine) => {
            if (line) {
                this.loadWorkstations(line.id);
                this.loadMachines(line.id);
                this.loadShiftsForProductionLine(line.id);
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

    loadReferenceData(): void {
        this.productionService.getShifts().subscribe(shifts => this.shifts = shifts);
        this.productionService.getProjects().subscribe(projects => this.projects = projects);
        this.productionService.getDowntimeProblems().subscribe(problems => this.downtimeProblems = problems);
        this.productionService.getActiveShiftTypes().subscribe({
            next: (shiftTypes) => {
                this.shiftTypes = shiftTypes;
                console.log('Loaded shift types:', shiftTypes);
                // Update hourTypeOptions with database values
                if (shiftTypes && shiftTypes.length > 0) {
                    this.hourTypeOptions = shiftTypes.map(st => ({
                        label: `${st.name} (${st.target_percentage}%)`,
                        value: st.code
                    }));
                    console.log('Updated hourTypeOptions:', this.hourTypeOptions);

                    // Synchronize existing hours with valid shift type codes (with delay to ensure hours are loaded)
                    setTimeout(() => this.syncHoursWithShiftTypes(), 100);
                }
            },
            error: (err) => {
                console.error('Error loading shift types:', err);
                // Keep fallback options if loading fails
            }
        });
        this.productionService.getActiveZones().subscribe({
            next: (zones) => {
                this.zones = zones;
                console.log('Loaded zones:', zones);
            },
            error: (err) => {
                console.error('Error loading zones:', err);
            }
        });
    }

    loadProductionLines(projectId: number): void {
        this.productionService.getProductionLines(projectId).subscribe(lines => {
            this.productionLines = lines;
            // patchValue removed - now handled in project valueChanges with emitEvent: false
        });
    }

    loadParts(projectId: number): void {
        this.productionService.getParts(projectId).subscribe(parts => {
            this.parts = parts;
            // patchValue removed - now handled in project valueChanges with emitEvent: false
        });
    }

    loadWorkstations(lineId: number): void {
        this.productionService.getWorkstations(lineId).subscribe(workstations => {
            this.workstations = workstations;
        });
    }

    loadMachines(lineId: number): void {
        this.productionService.getMachinesByProductionLine(lineId).subscribe(machines => {
            this.machines = machines;
            this.shiftSetupForm.patchValue({ machine: null });
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
        this.session.part = formValue.partNumber;
        this.session.machine = formValue.machine;
        this.session.zone = formValue.zone;
        this.session.isSetupComplete = true;

        // Generate hours for the shift
        this.session.hours = this.generateShiftHours(formValue.shift, formValue.partNumber);

        // Sync hours with valid shift type codes (in case shiftTypes are loaded)
        this.syncHoursWithShiftTypes();

        // Save session to localStorage
        this.saveSessionToStorage();

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

        // Calculate hourly target based on actual shift duration
        const hourlyTarget = Math.round(part.ShiftTarget_Part / shiftDuration);
        const hourlyScrapTarget = Math.round((part.ScrapTarget_Part || shiftDuration) / shiftDuration);

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
                hourlyProductionId: null
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
        // Trim whitespace from scanned badge (common issue with barcode scanners)
        const cleanBadgeId = this.employeeIdScan?.trim() || '';

        if (!cleanBadgeId || !this.selectedWorkstation) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please scan employee ID and select workstation'
            });
            return;
        }

        this.employeeService.getEmployeeByBadge(cleanBadgeId).subscribe({
            next: (employee: any) => {
                const alreadyAssigned = this.session.team.some(e => e.Id_Emp === employee.id);
                if (alreadyAssigned) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Warning',
                        detail: `${employee.first_name} ${employee.last_name} is already assigned`
                    });
                    return;
                }

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
                    workstation: this.selectedWorkstation!.Name_Workstation,
                    workstationId: this.selectedWorkstation!.Id_Workstation,
                    machine: this.selectedMachineForAssignment?.name,
                    machineId: this.selectedMachineForAssignment?.id,
                    qualification: employee.current_qualification || 'Not Qualified',
                    qualificationLevel: employee.current_qualification ? 1 : 0,
                    role: this.selectedRole
                };

                this.session.team.push(newAssignment);

                // Update actors based on role
                const fullName = `${employee.first_name} ${employee.last_name}`;
                const qualification = employee.current_qualification || 'Not Qualified';

                if (this.selectedRole === 'line_leader') {
                    this.session.actors.lineLeader = {
                        badgeId: cleanBadgeId,
                        name: fullName,
                        qualification: qualification,
                        employeeId: employee.id
                    };
                } else if (this.selectedRole === 'quality_agent') {
                    this.session.actors.qualityAgent = {
                        badgeId: cleanBadgeId,
                        name: fullName,
                        qualification: qualification,
                        employeeId: employee.id
                    };
                } else if (this.selectedRole === 'maintenance_tech') {
                    this.session.actors.maintenanceTech = {
                        badgeId: cleanBadgeId,
                        name: fullName,
                        qualification: qualification,
                        employeeId: employee.id
                    };
                } else if (this.selectedRole === 'pqc') {
                    this.session.actors.pqc = {
                        badgeId: cleanBadgeId,
                        name: fullName,
                        qualification: qualification,
                        employeeId: employee.id
                    };
                }

                const roleLabel = this.getRoleLabel(this.selectedRole);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `${fullName} assigned as ${roleLabel} to ${this.selectedWorkstation!.Name_Workstation}${this.selectedMachineForAssignment ? ' - ' + this.selectedMachineForAssignment.name : ''}`
                });

                // Save session to localStorage
                this.saveSessionToStorage();

                this.employeeIdScan = '';
                this.selectedMachineForAssignment = null;
                this.selectedRole = 'operator'; // Reset to default role
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

    getRoleLabel(role: ProductionRole): string {
        const roleOption = this.roleOptions.find(r => r.value === role);
        return roleOption?.label || role;
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
        this.session.team = this.session.team.filter(e => e.Id_Emp !== employee.Id_Emp);
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
        // Save session to localStorage when order number is modified
        this.saveSessionToStorage();
    }

    onHourTypeChange(hourIndex: number, newType: HourType): void {
        console.log(`onHourTypeChange called: hourIndex=${hourIndex}, newType=${newType}`);

        const hour = this.session.hours[hourIndex];
        const baseTarget = this.getBaseHourlyTarget();

        hour.hourType = newType;
        console.log(`Hour ${hour.hour} type set to: ${hour.hourType}`);

        // Recalculate target based on hour type using dynamic ShiftType percentage
        const shiftType = this.shiftTypes.find(st => st.code === newType);
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

        return Math.round(this.session.part.ShiftTarget_Part / shiftDuration);
    }

    getHourTypeLabel(type: HourType): string {
        // First try to find in loaded shiftTypes
        const shiftType = this.shiftTypes.find(st => st.code === type);
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
        const shiftType = this.shiftTypes.find(st => st.code === type);
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
        // Return the code of the first ShiftType with 100% target, or the first available
        const normalType = this.shiftTypes.find(st => st.target_percentage === 100);
        if (normalType) {
            return normalType.code as HourType;
        }
        // Fallback to first available ShiftType
        if (this.shiftTypes.length > 0) {
            return this.shiftTypes[0].code as HourType;
        }
        // Last fallback
        return 'normal' as HourType;
    }

    syncHoursWithShiftTypes(): void {
        // Only sync if session has hours but no shiftTypes loaded yet should not reset
        if (!this.session.hours || this.session.hours.length === 0) return;
        if (this.shiftTypes.length === 0) return; // Don't sync if no shift types loaded

        const validCodes = this.shiftTypes.map(st => st.code);
        const defaultType = this.getDefaultHourType();

        console.log('Valid shift type codes:', validCodes);
        console.log('Current hour types:', this.session.hours.map(h => h.hourType));

        let updated = false;
        this.session.hours.forEach(hour => {
            // Only update if hourType is empty/undefined, don't overwrite existing valid values
            if (!hour.hourType) {
                hour.hourType = defaultType;
                updated = true;
                console.log(`Hour ${hour.hour}: Set default type ${defaultType}`);
            } else if (!validCodes.includes(hour.hourType)) {
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

        this.showHourDialog = true;
    }

    closeHourDialog(): void {
        this.showHourDialog = false;
        this.selectedHourIndex = null;
    }

    saveHourProduction(): void {
        if (this.selectedHourIndex === null) return;

        const hour = this.session.hours[this.selectedHourIndex];

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
        if (!this.session.date || !this.session.shift || !this.session.part || !this.session.productionLine) {
            console.error('Missing session data:', {
                date: this.session.date,
                shift: this.session.shift,
                part: this.session.part,
                productionLine: this.session.productionLine
            });
            this.messageService.add({
                severity: 'error',
                summary: 'Session Error',
                detail: 'Please complete the session setup (Date, Shift, Part, Production Line)'
            });
            return;
        }

        // Mark hour as in progress
        hour.status = 'in_progress';

        // Find the ShiftType based on the hour_type code
        const shiftType = this.shiftTypes.find(st => st.code === (hour.hourType || 'normal'));

        // Validate hour_type - must be one of the valid choices in the backend model
        const validHourTypes = ['normal', 'setup', 'break', 'extra_hour_break'];
        const hourTypeToSend = validHourTypes.includes(hour.hourType) ? hour.hourType : 'normal';

        const productionData: any = {
            date: this.session.date,
            shift: this.session.shift.id,
            hour: hour.hour,
            hour_type: hourTypeToSend,
            shift_type: shiftType?.id || null,
            part: this.session.part.Id_Part,
            result: this.hourProductionInput.output,
            target: hour.target,
            headcount: this.session.team.length || 0,
            production_line: this.session.productionLine.id,
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

                // Save session to localStorage
                this.saveSessionToStorage();

                // Save team assignments for this hourly production (only if it's a new creation)
                if (!isUpdate && typeof hour.hourlyProductionId === 'number' && this.session.team.length > 0) {
                    this.saveTeamAssignmentsForHour(hour.hourlyProductionId);
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
            const downtimePayload = {
                Total_Downtime: dt.duration,
                Comment_Downtime: dt.comment,
                Id_DowntimeProblems: dt.problemId,
                Id_HourlyProd: hourlyProductionId,
                Id_Downtime: dt.id // Include ID for updates
            };

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
            comment: ''
        };
        this.editingDowntimeDialogIndex = null;
    }

    confirmAddDowntimeInDialog(): void {
        if (this.newDowntimeInput.duration <= 0 || this.newDowntimeInput.problemId === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid Input',
                detail: 'Please enter duration and select a problem category'
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
                comment: this.newDowntimeInput.comment
            };
        } else {
            // Add new
            this.hourProductionInput.downtimes.push({
                duration: this.newDowntimeInput.duration,
                problemId: this.newDowntimeInput.problemId,
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

        if (this.downtimeInput.Total_Downtime <= 0 || this.downtimeInput.Id_DowntimeProblems === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid Input',
                detail: 'Please enter duration and select a problem'
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

    getQualificationSeverity(level: number | undefined): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
        if (!level) return 'secondary';
        if (level >= 4) return 'success';
        if (level >= 3) return 'info';
        if (level >= 2) return 'warn';
        return 'danger';
    }

    resetSession(): void {
        this.session = {
            shift: null,
            date: new Date(),
            project: null,
            productionLine: null,
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
            const sessionData = {
                session: {
                    ...this.session,
                    date: this.session.date instanceof Date ? this.session.date.toISOString() : this.session.date
                },
                formValues: this.shiftSetupForm.value,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessionData));
            console.log('Session saved to localStorage. Hour types:', this.session.hours.map(h => ({ hour: h.hour, type: h.hourType })));
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
                // Ensure hours array has all required properties with defaults
                hours: (parsed.session.hours || []).map((h: any) => ({
                    ...h,
                    downtimes: h.downtimes || [],
                    totalDowntime: h.totalDowntime || 0,
                    hourType: h.hourType // Preserve hour type from saved session (will be synced after shiftTypes load)
                }))
            };

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

                            if (line) {
                                this.loadWorkstations(line.id);
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
}
