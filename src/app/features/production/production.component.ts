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
import { MessageService } from 'primeng/api';
import { ProductionService } from './production.service';
import {
    Project,
    ProductionLine,
    Part,
    Workstation,
    Shift,
    DowntimeProblem
} from '../../core/models';
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
        ProgressBarModule
    ],
    providers: [MessageService],
    templateUrl: './production.component.html',
    styleUrls: ['./production.component.scss']
})
export class ProductionComponent implements OnInit, OnDestroy {
    // Form
    shiftForm!: FormGroup;

    // Data
    shifts: Shift[] = [];
    projects: Project[] = [];
    productionLines: ProductionLine[] = [];
    parts: Part[] = [];
    workstations: Workstation[] = [];
    hours: { label: string; value: number; startTime: string; endTime: string; isOvertime: boolean }[] = [];
    downtimeProblems: DowntimeProblem[] = [];
    assignedEmployees: EmployeeWithAssignment[] = [];

    // Production actors IDs
    lineLeaderId = '';
    qualityAgentId = '';
    maintenanceTechId = '';
    pqcId = '';

    // State
    output = 0;
    scrap = 0;
    target = 53;
    scrapTarget = 5; // Target maximum scrap allowed per hour
    efficiency = 0;
    scrapRate = 0;
    employeeIdScan = '';
    selectedWorkstation: Workstation | null = null;
    downtimeMinutes = 0;
    selectedProblem: DowntimeProblem | null = null;
    downtimeComment = '';
    showDowntimeDialog = false;

    // Real-time tracking
    currentTime: Date = new Date();
    hourProgress = 0;
    totalDowntimeToday = 0;
    hourlyHistory: { hour: number; startTime: string; endTime: string; output: number; target: number; efficiency: number; isOvertime: boolean }[] = [];
    private timerSubscription?: Subscription;

    constructor(
        private fb: FormBuilder,
        private productionService: ProductionService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.initForm();
        this.loadData();
        this.startRealTimeUpdates();
        this.loadHourlyHistory();
    }

    ngOnDestroy(): void {
        this.timerSubscription?.unsubscribe();
    }

    startRealTimeUpdates(): void {
        // Update time and progress every second
        this.timerSubscription = interval(1000).subscribe(() => {
            this.currentTime = new Date();
            this.updateHourProgress();
        });
    }

    updateHourProgress(): void {
        const minutes = this.currentTime.getMinutes();
        this.hourProgress = Math.round((minutes / 60) * 100);
    }

    loadHourlyHistory(): void {
        // Mock hourly history with actual times (Morning shift 06:00 start)
        this.hourlyHistory = [
            { hour: 1, startTime: '06:00', endTime: '07:00', output: 52, target: 53, efficiency: 98, isOvertime: false },
            { hour: 2, startTime: '07:00', endTime: '08:00', output: 48, target: 53, efficiency: 91, isOvertime: false },
            { hour: 3, startTime: '08:00', endTime: '09:00', output: 55, target: 53, efficiency: 104, isOvertime: false },
            { hour: 4, startTime: '09:00', endTime: '10:00', output: 50, target: 53, efficiency: 94, isOvertime: false }
        ];
        this.totalDowntimeToday = 45;
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

    getTotalOutput(): number {
        return this.hourlyHistory.reduce((sum, h) => sum + h.output, 0) + this.output;
    }

    getTotalTarget(): number {
        return this.hourlyHistory.reduce((sum, h) => sum + h.target, 0) + this.target;
    }

    getOverallEfficiency(): number {
        const totalTarget = this.getTotalTarget();
        if (totalTarget === 0) return 0;
        return Math.round((this.getTotalOutput() / totalTarget) * 100);
    }

    initForm(): void {
        this.shiftForm = this.fb.group({
            shift: [null, Validators.required],
            date: [new Date(), Validators.required],
            project: [null, Validators.required],
            productionLine: [null, Validators.required],
            partNumber: [null, Validators.required],
            hour: [null, Validators.required]
        });

        // Watch for shift changes to reload hours with correct times
        this.shiftForm.get('shift')?.valueChanges.subscribe((shift: Shift) => {
            if (shift) {
                this.loadHours(shift.id);
                this.shiftForm.patchValue({ hour: null });
            }
        });

        // Watch for project changes
        this.shiftForm.get('project')?.valueChanges.subscribe((project: Project) => {
            if (project) {
                this.loadProductionLines(project.Id_Project);
                this.loadParts(project.Id_Project);
            }
        });

        // Watch for production line changes
        this.shiftForm.get('productionLine')?.valueChanges.subscribe((line: ProductionLine) => {
            if (line) {
                this.loadWorkstations(line.id);
                this.target = line.target / 8; // Target per hour
            }
        });

        // Watch for part number changes
        this.shiftForm.get('partNumber')?.valueChanges.subscribe((part: Part) => {
            if (part) {
                this.target = Math.round(part.ShiftTarget_Part / 8); // Target per hour
                this.scrapTarget = Math.round(part.ScrapTarget_Part / 8) || 1; // Scrap target per hour (min 1)
                this.calculateScrapRate();
            }
        });
    }

    loadData(): void {
        this.productionService.getShifts().subscribe(shifts => this.shifts = shifts);
        this.productionService.getProjects().subscribe(projects => this.projects = projects);
        this.loadHours(); // Load default hours (morning shift)
        this.productionService.getDowntimeProblems().subscribe(problems => this.downtimeProblems = problems);
        this.productionService.getAssignedEmployees().subscribe(employees => this.assignedEmployees = employees);
    }

    loadHours(shiftId?: string): void {
        this.productionService.getHours(shiftId).subscribe(hours => this.hours = hours);
    }

    loadProductionLines(projectId: number): void {
        this.productionService.getProductionLines(projectId).subscribe(lines => {
            this.productionLines = lines;
            this.shiftForm.patchValue({ productionLine: null });
        });
    }

    loadParts(projectId: number): void {
        this.productionService.getParts(projectId).subscribe(parts => {
            this.parts = parts;
            this.shiftForm.patchValue({ partNumber: null });
        });
    }

    loadWorkstations(lineId: number): void {
        this.productionService.getWorkstations(lineId).subscribe(workstations => {
            this.workstations = workstations;
        });
    }

    calculateEfficiency(): void {
        if (this.target > 0) {
            this.efficiency = Math.round((this.output / this.target) * 100);
        }
    }

    calculateScrapRate(): void {
        // Scrap Rate = (Scrap / Scrap Target) × 100
        if (this.scrapTarget > 0) {
            this.scrapRate = Math.round((this.scrap / this.scrapTarget) * 10000) / 100; // 2 decimal places
        } else {
            this.scrapRate = 0;
        }
    }

    onOutputChange(): void {
        this.calculateEfficiency();
        this.calculateScrapRate();
    }

    onScrapChange(): void {
        this.calculateScrapRate();
    }

    addEmployee(): void {
        if (!this.employeeIdScan || !this.selectedWorkstation) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please scan employee ID and select workstation'
            });
            return;
        }

        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Employee ${this.employeeIdScan} assigned to ${this.selectedWorkstation.Name_Workstation}`
        });

        this.employeeIdScan = '';
    }

    removeEmployee(employee: EmployeeWithAssignment): void {
        this.assignedEmployees = this.assignedEmployees.filter(e => e.Id_Emp !== employee.Id_Emp);
        this.messageService.add({
            severity: 'info',
            summary: 'Removed',
            detail: `${employee.Prenom_Emp} ${employee.Nom_Emp} removed from assignment`
        });
    }

    openDowntimeDialog(): void {
        this.showDowntimeDialog = true;
    }

    closeDowntimeDialog(): void {
        this.showDowntimeDialog = false;
        this.resetDowntimeForm();
    }

    saveDowntime(): void {
        if (!this.selectedProblem || this.downtimeMinutes <= 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please fill in all downtime fields'
            });
            return;
        }

        this.productionService.saveDowntime({
            Total_Downtime: this.downtimeMinutes,
            Comment_Downtime: this.downtimeComment,
            Id_DowntimeProblems: this.selectedProblem.Id_DowntimeProblems
        }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Downtime ticket created successfully'
                });
                this.closeDowntimeDialog();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to create downtime ticket'
                });
            }
        });
    }

    resetDowntimeForm(): void {
        this.downtimeMinutes = 0;
        this.selectedProblem = null;
        this.downtimeComment = '';
    }

    saveProduction(): void {
        if (this.shiftForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please fill in all required fields'
            });
            return;
        }

        const formValue = this.shiftForm.value;

        this.productionService.saveHourlyProduction({
            Date_HourlyProd: formValue.date,
            Shift_HourlyProd: formValue.shift.id,
            Hour_HourlyProd: formValue.hour.value,
            Id_Part: formValue.partNumber.Id_Part,
            Result_HourlyProdPN: this.output,
            Target_HourlyProdPN: this.target,
            HC_HourlyProdPN: this.assignedEmployees.length,
            Id_ProdLine: formValue.productionLine.id
        }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Production data saved successfully'
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save production data'
                });
            }
        });
    }

    getQualificationSeverity(level: number | undefined): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
        if (!level) return 'secondary';
        if (level >= 4) return 'success';
        if (level >= 3) return 'info';
        if (level >= 2) return 'warn';
        return 'danger';
    }
}
