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
import { MessageService } from 'primeng/api';
import { ProductionService } from './production.service';
import { EmployeeService } from '../../core/services/employee.service';
import {
    Project,
    ProductionLine,
    Part,
    Workstation,
    Shift,
    DowntimeProblem,
    Downtime
} from '../../core/models';
import {
    ShiftProductionSession,
    HourlyProductionState,
    HourProductionInput,
    DowntimeExtended,
    HourStatus,
    HourType,
    HOUR_TYPE_TARGET_PERCENTAGE
} from '../../core/models/production-session.model';
import { EmployeeWithAssignment } from '../../core/models/employee.model';

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
        CheckboxModule
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
        orderNo: '',
        team: [],
        actors: {
            lineLeader: '',
            qualityAgent: '',
            maintenanceTech: '',
            pqc: ''
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
    downtimeProblems: DowntimeProblem[] = [];

    // Hour Type Options
    hourTypeOptions: { label: string; value: HourType }[] = [
        { label: 'Normal', value: 'normal' },
        { label: 'Setup', value: 'setup' },
        { label: 'Break', value: 'break' },
        { label: 'Extra Hour Break', value: 'extra_hour_break' }
    ];

    // Team Assignment
    employeeIdScan = '';
    selectedWorkstation: Workstation | null = null;

    // Hour Production Dialog
    showHourDialog = false;
    selectedHourIndex: number | null = null;
    hourProductionInput: HourProductionInput = {
        output: 0,
        scrap: 0,
        hasDowntime: false,
        downtime: {
            duration: 0,
            problemId: 0,
            comment: ''
        }
    };

    // Downtime Dialog (for adding downtime to existing hour)
    showDowntimeDialog = false;
    downtimeHourIndex: number | null = null;
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

            // If we have params, load production data after reference data is loaded
            if (params['shift'] && params['date'] && params['line'] && params['part']) {
                this.loadProductionFromParams(params);
            }
        });
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
                                    Picture: employee.picture || employee.Picture || 'assets/images/avatar-default.png',
                                    EmpStatus: employee.status || employee.EmpStatus || 'active',
                                    workstation: workstation?.Name_Workstation || 'Unknown',
                                    qualification: this.getCategoryQualification(employee.category || employee.Categorie_Emp || ''),
                                    qualificationLevel: this.getCategoryLevel(employee.category || employee.Categorie_Emp || '')
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
                                        Picture: employee.picture || employee.Picture || 'assets/images/avatar-default.png',
                                        EmpStatus: employee.status || employee.EmpStatus || 'active',
                                        workstation: workstation?.Name_Workstation || 'Unknown',
                                        qualification: this.getCategoryQualification(employee.category || employee.Categorie_Emp || ''),
                                        qualificationLevel: this.getCategoryLevel(employee.category || employee.Categorie_Emp || '')
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

                    const assignmentData = {
                        hourly_production: hourlyProductionId,
                        employee: member.Id_Emp,
                        workstation: workstationId
                    };

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

            this.productionService.createTeamAssignment({
                hourly_production: hourlyProductionId,
                employee: member.Id_Emp,
                workstation: workstationId
            }).subscribe({
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
            partNumber: [null, Validators.required]
        });

        // Watch for project changes
        this.shiftSetupForm.get('project')?.valueChanges.subscribe((project: Project) => {
            if (project) {
                this.loadProductionLines(project.Id_Project);
                this.loadParts(project.Id_Project);
            }
        });

        // Watch for production line changes
        this.shiftSetupForm.get('productionLine')?.valueChanges.subscribe((line: ProductionLine) => {
            if (line) {
                this.loadWorkstations(line.id);
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
    }

    loadProductionLines(projectId: number): void {
        this.productionService.getProductionLines(projectId).subscribe(lines => {
            this.productionLines = lines;
            this.shiftSetupForm.patchValue({ productionLine: null });
        });
    }

    loadParts(projectId: number): void {
        this.productionService.getParts(projectId).subscribe(parts => {
            this.parts = parts;
            this.shiftSetupForm.patchValue({ partNumber: null });
        });
    }

    loadWorkstations(lineId: number): void {
        this.productionService.getWorkstations(lineId).subscribe(workstations => {
            this.workstations = workstations;
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
        this.session.isSetupComplete = true;

        // Generate hours for the shift
        this.session.hours = this.generateShiftHours(formValue.shift, formValue.partNumber);

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
                hourType: 'normal' as HourType, // Default to normal
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
                    Picture: employee.picture || 'assets/images/avatar-default.png',
                    EmpStatus: employee.status,
                    workstation: this.selectedWorkstation!.Name_Workstation,
                    qualification: this.getCategoryQualification(employee.category),
                    qualificationLevel: this.getCategoryLevel(employee.category)
                };

                this.session.team.push(newAssignment);

                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `${employee.first_name} ${employee.last_name} assigned`
                });

                // Save session to localStorage
                this.saveSessionToStorage();

                this.employeeIdScan = '';
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

    onOrderNoChange(): void {
        // Save session to localStorage when order number is modified
        this.saveSessionToStorage();
    }

    onHourTypeChange(hourIndex: number, newType: HourType): void {
        const hour = this.session.hours[hourIndex];
        const baseTarget = this.getBaseHourlyTarget();

        hour.hourType = newType;
        // Recalculate target based on hour type
        const targetPercentage = HOUR_TYPE_TARGET_PERCENTAGE[newType];
        hour.target = Math.round(baseTarget * (targetPercentage / 100));

        // Recalculate efficiency if output exists
        if (hour.output !== null && hour.target > 0) {
            hour.efficiency = Math.round((hour.output / hour.target) * 100);
        }

        this.saveSessionToStorage();
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
        const labels: Record<HourType, string> = {
            'normal': 'Normal',
            'setup': 'Setup',
            'break': 'Break',
            'extra_hour_break': 'Extra Hour Break'
        };
        return labels[type] || type;
    }

    getHourTypeSeverity(type: HourType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const severities: Record<HourType, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            'normal': 'success',
            'setup': 'info',
            'break': 'warn',
            'extra_hour_break': 'secondary'
        };
        return severities[type] || 'info';
    }

    // ==================== HOUR PRODUCTION ====================

    openHourDialog(hourIndex: number): void {
        this.selectedHourIndex = hourIndex;
        const hour = this.session.hours[hourIndex];

        // If hour already has data, pre-fill the form
        if (hour.status === 'completed') {
            this.hourProductionInput = {
                output: hour.output || 0,
                scrap: hour.scrap || 0,
                hasDowntime: hour.downtimes.length > 0,
                downtime: hour.downtimes.length > 0 ? {
                    duration: hour.downtimes[0].Total_Downtime,
                    problemId: hour.downtimes[0].Id_DowntimeProblems,
                    comment: hour.downtimes[0].Comment_Downtime
                } : {
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

        const productionData = {
            date: this.session.date,
            shift: this.session.shift.id,
            hour: hour.hour,
            hour_type: hour.hourType || 'normal',
            part: this.session.part.Id_Part,
            result: this.hourProductionInput.output,
            target: hour.target,
            headcount: this.session.team.length || 0,
            production_line: this.session.productionLine.id,
            // Order Number
            order_no: this.session.orderNo || '',
            // Production Supervisors & Key Personnel
            line_leader: this.session.actors.lineLeader || '',
            quality_agent: this.session.actors.qualityAgent || '',
            maintenance_tech: this.session.actors.maintenanceTech || '',
            pqc: this.session.actors.pqc || ''
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

                // If downtime was added
                if (this.hourProductionInput.hasDowntime && this.hourProductionInput.downtime &&
                    this.hourProductionInput.downtime.duration > 0 && this.hourProductionInput.downtime.problemId > 0) {
                    this.saveDowntimeForHour(this.selectedHourIndex!, this.hourProductionInput.downtime);
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
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.detail || 'Failed to save production'
                });
            }
        });
    }

    saveDowntimeForHour(hourIndex: number, downtime: { duration: number; problemId: number; comment: string }): void {
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
            Id_HourlyProd: hour.hourlyProductionId
        }).subscribe({
            next: () => {
                const newDowntime: DowntimeExtended = {
                    Total_Downtime: downtime.duration,
                    Comment_Downtime: downtime.comment,
                    Id_DowntimeProblems: downtime.problemId,
                    Id_HourlyProd: hour.hourlyProductionId!,
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

        // Pre-fill with existing downtime data if available
        if (hour.downtimes && hour.downtimes.length > 0) {
            const existingDowntime = hour.downtimes[0]; // Use the first downtime
            this.downtimeInput = {
                Total_Downtime: existingDowntime.Total_Downtime || 0,
                Id_DowntimeProblems: existingDowntime.Id_DowntimeProblems || 0,
                Comment_Downtime: existingDowntime.Comment_Downtime || ''
            };
        } else {
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

        this.productionService.saveDowntime({
            ...this.downtimeInput,
            Id_HourlyProd: hour.hourlyProductionId!
        }).subscribe({
            next: () => {
                const newDowntime: DowntimeExtended = {
                    ...this.downtimeInput,
                    Id_HourlyProd: hour.hourlyProductionId!,
                    problemName: this.downtimeProblems.find(p => p.Id_DowntimeProblems === this.downtimeInput.Id_DowntimeProblems)?.Name_DowntimeProblems
                };
                hour.downtimes.push(newDowntime);
                hour.totalDowntime = hour.downtimes.reduce((sum, dt) => sum + dt.Total_Downtime, 0);

                // Save session to localStorage after adding downtime
                this.saveSessionToStorage();

                this.closeDowntimeDialog();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Saved',
                    detail: 'Downtime ticket added successfully'
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
            orderNo: '',
            team: [],
            actors: {
                lineLeader: '',
                qualityAgent: '',
                maintenanceTech: '',
                pqc: ''
            },
            hours: [],
            isSetupComplete: false,
            isTeamComplete: false,
            currentHourIndex: null
        };

        this.shiftSetupForm.reset({ date: new Date() });
        this.employeeIdScan = '';
        this.selectedWorkstation = null;

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
            console.log('Session saved to localStorage');
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
            this.session = {
                ...parsed.session,
                date: new Date(parsed.session.date),
                // Ensure hours array has all required properties with defaults
                hours: (parsed.session.hours || []).map((h: any) => ({
                    ...h,
                    downtimes: h.downtimes || [],
                    totalDowntime: h.totalDowntime || 0
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
                                    }
                                });

                                this.session.hours = newHours;
                                this.session.shift = shift; // Update with fresh shift data
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
