import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
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
    ShiftProductionSession,
    HourlyProductionState,
    HourProductionInput,
    Downtime,
    HourStatus
} from '../../core/models';
import { EmployeeWithAssignment } from '../../core/models/employee.model';
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
    downtimeInput: Downtime = {
        Total_Downtime: 0,
        Id_DowntimeProblems: 0,
        Comment_Downtime: ''
    };

    // Real-time tracking
    currentTime: Date = new Date();
    hourProgress = 0;
    private timerSubscription?: Subscription;

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
        private productionService: ProductionService,
        private employeeService: EmployeeService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.initForms();
        this.loadReferenceData();
        this.startRealTimeUpdates();
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

        this.messageService.add({
            severity: 'success',
            summary: 'Setup Complete',
            detail: `${formValue.shift.name} shift setup completed. Now assign your team.`
        });
    }

    generateShiftHours(shift: Shift, part: Part): HourlyProductionState[] {
        const hours: HourlyProductionState[] = [];
        const hourlyTarget = Math.round(part.ShiftTarget_Part / 8);
        const hourlyScrapTarget = Math.round((part.ScrapTarget_Part || 8) / 8);

        // Get shift start time
        const shiftStart = this.getShiftStartHour(shift.id);

        for (let i = 0; i < 8; i++) {
            const hourNumber = i + 1;
            const startHour = (shiftStart + i) % 24;
            const endHour = (shiftStart + i + 1) % 24;
            const isOvertime = i >= 8; // Hours beyond 8 are overtime

            hours.push({
                hour: hourNumber,
                timeRange: `${this.formatHour(startHour)} - ${this.formatHour(endHour)}`,
                startTime: this.formatHour(startHour),
                endTime: this.formatHour(endHour),
                isOvertime,
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
        if (!this.employeeIdScan || !this.selectedWorkstation) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please scan employee ID and select workstation'
            });
            return;
        }

        this.employeeService.getEmployeeByBadge(this.employeeIdScan).subscribe({
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
                    Picture: employee.picture ? `${environment.mediaUrl}${employee.picture}` : 'assets/images/avatar-default.png',
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

        // Mark hour as in progress
        hour.status = 'in_progress';

        // Save to backend
        this.productionService.saveHourlyProduction({
            Date_HourlyProd: this.session.date,
            Shift_HourlyProd: this.session.shift!.id,
            Hour_HourlyProd: hour.hour,
            Id_Part: this.session.part!.Id_Part,
            Result_HourlyProdPN: this.hourProductionInput.output,
            Target_HourlyProdPN: hour.target,
            HC_HourlyProdPN: this.session.team.length,
            Id_ProdLine: this.session.productionLine!.id,
            Scrap_HourlyProdPN: this.hourProductionInput.scrap
        }).subscribe({
            next: (response: any) => {
                hour.hourlyProductionId = response.id || response.Id_HourlyProd;
                hour.output = this.hourProductionInput.output;
                hour.scrap = this.hourProductionInput.scrap || 0;
                hour.efficiency = Math.round((hour.output! / hour.target) * 100);
                hour.scrapRate = hour.scrapTarget > 0 ?
                    Math.round((hour.scrap! / hour.scrapTarget) * 10000) / 100 : 0;
                hour.status = 'completed';

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

        this.productionService.saveDowntime({
            Total_Downtime: downtime.duration,
            Comment_Downtime: downtime.comment,
            Id_DowntimeProblems: downtime.problemId,
            Id_HourlyProd: hour.hourlyProductionId
        }).subscribe({
            next: () => {
                const newDowntime: Downtime = {
                    Total_Downtime: downtime.duration,
                    Comment_Downtime: downtime.comment,
                    Id_DowntimeProblems: downtime.problemId,
                    Id_HourlyProd: hour.hourlyProductionId!,
                    problemName: this.downtimeProblems.find(p => p.Id_DowntimeProblems === downtime.problemId)?.Name_DowntimeProblems
                };
                hour.downtimes.push(newDowntime);
                hour.totalDowntime = hour.downtimes.reduce((sum, dt) => sum + dt.Total_Downtime, 0);

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
        this.downtimeInput = {
            Total_Downtime: 0,
            Id_DowntimeProblems: 0,
            Comment_Downtime: ''
        };
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

        this.productionService.saveDowntime({
            ...this.downtimeInput,
            Id_HourlyProd: hour.hourlyProductionId!
        }).subscribe({
            next: () => {
                const newDowntime: Downtime = {
                    ...this.downtimeInput,
                    Id_HourlyProd: hour.hourlyProductionId!,
                    problemName: this.downtimeProblems.find(p => p.Id_DowntimeProblems === this.downtimeInput.Id_DowntimeProblems)?.Name_DowntimeProblems
                };
                hour.downtimes.push(newDowntime);
                hour.totalDowntime = hour.downtimes.reduce((sum, dt) => sum + dt.Total_Downtime, 0);

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
    }
}
