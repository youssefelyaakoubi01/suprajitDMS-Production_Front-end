import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MaintenanceService, DowntimeDeclaration } from '../../core/services/maintenance.service';
import { ProductionService } from '../production/production.service';
import { EmployeeService } from '../../core/services/employee.service';
import { DowntimeNotificationService, AlertPriority } from '../../core/services/downtime-notification.service';
import { ProductionLine, Workstation, Machine } from '../../core/models';

@Component({
    selector: 'app-downtime-declaration',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CardModule,
        SelectModule,
        DatePickerModule,
        InputTextModule,
        TextareaModule,
        ButtonModule,
        TableModule,
        TagModule,
        ToastModule,
        DialogModule,
        DividerModule,
        BadgeModule,
        TooltipModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './downtime-declaration.component.html',
    styleUrls: ['./downtime-declaration.component.scss']
})
export class DowntimeDeclarationComponent implements OnInit, OnDestroy {
    // Declarations list
    declarations: DowntimeDeclaration[] = [];
    pendingDeclarations: DowntimeDeclaration[] = [];
    isLoading = false;

    // Reference data
    productionLines: ProductionLine[] = [];
    workstations: Workstation[] = [];
    machines: Machine[] = [];
    technicians: any[] = [];

    // Form dialog
    showDeclarationDialog = false;
    isEditMode = false;
    selectedDeclaration: DowntimeDeclaration | null = null;
    declarationForm!: FormGroup;

    // Action dialog (for acknowledge, start work, resolve)
    showActionDialog = false;
    actionType: 'acknowledge' | 'start_work' | 'resolve' | 'cancel' | null = null;
    actionDeclaration: DowntimeDeclaration | null = null;
    actionForm!: FormGroup;

    // Filter
    statusFilter: string | null = null;
    lineFilter: number | null = null;

    // Options
    declarationTypes = [
        { label: 'Planned', value: 'planned' },
        { label: 'Unplanned', value: 'unplanned' },
        { label: 'Emergency', value: 'emergency' }
    ];

    impactLevels = [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' }
    ];

    statusOptions = [
        { label: 'All', value: null },
        { label: 'Declared', value: 'declared' },
        { label: 'Acknowledged', value: 'acknowledged' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Cancelled', value: 'cancelled' }
    ];

    // Auto-refresh
    private refreshSubscription?: Subscription;
    autoRefreshEnabled = true;

    constructor(
        private fb: FormBuilder,
        private maintenanceService: MaintenanceService,
        private productionService: ProductionService,
        private employeeService: EmployeeService,
        private notificationService: DowntimeNotificationService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.initForms();
        this.loadReferenceData();
        this.loadDeclarations();
        this.startAutoRefresh();
    }

    ngOnDestroy(): void {
        this.refreshSubscription?.unsubscribe();
    }

    initForms(): void {
        this.declarationForm = this.fb.group({
            production_line: [null, Validators.required],
            workstation: [{ value: null, disabled: true }, Validators.required],
            machine: [{ value: null, disabled: true }],
            declaration_type: ['unplanned', Validators.required],
            impact_level: ['medium', Validators.required],
            reason: ['', [Validators.required, Validators.minLength(10)]],
            description: [''],
            expected_start: [null],
            expected_end: [null]
        });

        this.actionForm = this.fb.group({
            assigned_technician: [null],
            resolution_notes: [''],
            cancel_reason: ['']
        });

        // Watch production line changes to load workstations
        this.declarationForm.get('production_line')?.valueChanges.subscribe((line: ProductionLine) => {
            if (line) {
                this.loadWorkstations(line.id);
                this.declarationForm.get('workstation')?.enable();
            } else {
                this.workstations = [];
                this.machines = [];
                this.declarationForm.get('workstation')?.disable();
                this.declarationForm.get('workstation')?.reset();
                this.declarationForm.get('machine')?.disable();
                this.declarationForm.get('machine')?.reset();
            }
        });

        // Watch workstation changes to load machines
        this.declarationForm.get('workstation')?.valueChanges.subscribe((workstation: Workstation) => {
            if (workstation) {
                const workstationId = workstation.Id_Workstation || (workstation as any).id;
                this.loadMachines(workstationId);
                this.declarationForm.get('machine')?.enable();
            } else {
                this.machines = [];
                this.declarationForm.get('machine')?.disable();
                this.declarationForm.get('machine')?.reset();
            }
        });
    }

    loadReferenceData(): void {
        // Load production lines
        this.productionService.getProductionLines().subscribe({
            next: (lines) => {
                // Handle paginated response or direct array
                this.productionLines = Array.isArray(lines) ? lines : (lines as any).results || [];
            },
            error: (err) => {
                console.error('Error loading production lines:', err);
            }
        });

        // Load technicians (employees with category 'technician' OR from Maintenance department)
        this.loadTechnicians();
    }

    loadTechnicians(): void {
        // First try to load technicians by category
        this.employeeService.getEmployees({ category: 'technician' }).subscribe({
            next: (response: any) => {
                const employees = Array.isArray(response) ? response : response.results || [];

                if (employees.length > 0) {
                    this.technicians = employees.map((e: any) => ({
                        id: e.id,
                        name: `${e.first_name} ${e.last_name}`,
                        department: e.department
                    }));
                } else {
                    // If no technicians found by category, try loading from Maintenance department
                    this.loadTechniciansByDepartment();
                }
            },
            error: (err) => {
                console.error('Error loading technicians by category:', err);
                // Fallback to department loading
                this.loadTechniciansByDepartment();
            }
        });
    }

    loadTechniciansByDepartment(): void {
        this.employeeService.getEmployees({ department: 'Maintenance' }).subscribe({
            next: (response: any) => {
                const employees = Array.isArray(response) ? response : response.results || [];

                if (employees.length > 0) {
                    this.technicians = employees.map((e: any) => ({
                        id: e.id,
                        name: `${e.first_name} ${e.last_name}`,
                        department: e.department
                    }));
                } else {
                    // If still no technicians, load all active employees as fallback
                    this.loadAllActiveEmployees();
                }
            },
            error: (err) => {
                console.error('Error loading technicians by department:', err);
                this.loadAllActiveEmployees();
            }
        });
    }

    loadAllActiveEmployees(): void {
        this.employeeService.getEmployees({ status: 'active' }).subscribe({
            next: (response: any) => {
                const employees = Array.isArray(response) ? response : response.results || [];
                this.technicians = employees.map((e: any) => ({
                    id: e.id,
                    name: `${e.first_name} ${e.last_name}`,
                    department: e.department
                }));

                if (this.technicians.length === 0) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'No Technicians',
                        detail: 'No technicians found in the system. Please add employees first.',
                        life: 5000
                    });
                }
            },
            error: (err) => {
                console.error('Error loading employees:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load technicians'
                });
            }
        });
    }

    loadWorkstations(lineId: number): void {
        this.productionService.getWorkstations(lineId).subscribe({
            next: (response: any) => {
                // Handle paginated response or direct array
                this.workstations = Array.isArray(response) ? response : response.results || [];
                this.declarationForm.get('workstation')?.reset();
                // Reset machines as well
                this.machines = [];
                this.declarationForm.get('machine')?.reset();
            },
            error: (err) => {
                console.error('Error loading workstations:', err);
            }
        });
    }

    loadMachines(workstationId: number): void {
        this.productionService.getMachines(workstationId).subscribe({
            next: (response: any) => {
                // Handle paginated response or direct array
                this.machines = Array.isArray(response) ? response : response.results || [];
                this.declarationForm.get('machine')?.reset();
            },
            error: (err) => {
                console.error('Error loading machines:', err);
            }
        });
    }

    loadDeclarations(): void {
        this.isLoading = true;
        const params: any = {};
        if (this.statusFilter) {
            params.status = this.statusFilter;
        }
        if (this.lineFilter) {
            params.production_line = this.lineFilter;
        }

        this.maintenanceService.getDeclarations(params).subscribe({
            next: (response: any) => {
                // Handle paginated response or direct array
                const declarations = Array.isArray(response) ? response : response.results || [];
                this.declarations = declarations;
                this.pendingDeclarations = declarations.filter((d: DowntimeDeclaration) => d.status === 'declared');
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading declarations:', err);
                this.declarations = [];
                this.pendingDeclarations = [];
                this.isLoading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load declarations'
                });
            }
        });
    }

    startAutoRefresh(): void {
        this.refreshSubscription = interval(30000).subscribe(() => {
            if (this.autoRefreshEnabled) {
                this.loadDeclarations();
            }
        });
    }

    toggleAutoRefresh(): void {
        this.autoRefreshEnabled = !this.autoRefreshEnabled;
        this.messageService.add({
            severity: 'info',
            summary: 'Auto-Refresh',
            detail: this.autoRefreshEnabled ? 'Enabled' : 'Disabled'
        });
    }

    // ==================== CRUD Operations ====================

    openNewDeclarationDialog(): void {
        this.isEditMode = false;
        this.selectedDeclaration = null;
        this.declarationForm.reset({
            declaration_type: 'unplanned',
            impact_level: 'medium'
        });
        this.showDeclarationDialog = true;
    }

    saveDeclaration(): void {
        if (this.declarationForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill in all required fields'
            });
            return;
        }

        // Use getRawValue() to include disabled controls
        const formValue = this.declarationForm.getRawValue();
        const declarationData: any = {
            workstation: formValue.workstation?.Id_Workstation || formValue.workstation?.id,
            production_line: formValue.production_line?.id,
            declaration_type: formValue.declaration_type,
            impact_level: formValue.impact_level,
            reason: formValue.reason,
            description: formValue.description || '',
            expected_start: formValue.expected_start ? new Date(formValue.expected_start).toISOString() : undefined,
            expected_end: formValue.expected_end ? new Date(formValue.expected_end).toISOString() : undefined
        };

        // Add machine if selected
        if (formValue.machine) {
            declarationData.machine = formValue.machine.id;
        }

        this.maintenanceService.createDeclaration(declarationData).subscribe({
            next: (declaration) => {
                // Send alert notification to maintenance team
                this.notificationService.createDowntimeAlert({
                    id: declaration.id,
                    ticketNumber: declaration.ticket_number,
                    workstation: declarationData.workstation?.toString(),
                    workstationName: declaration.workstation_name || formValue.workstation?.Name_Workstation,
                    productionLine: declarationData.production_line?.toString(),
                    productionLineName: declaration.production_line_name || formValue.production_line?.name,
                    machine: declarationData.machine?.toString(),
                    machineName: declaration.machine_name || formValue.machine?.name,
                    zone: formValue.production_line?.zone,
                    reason: declarationData.reason,
                    impactLevel: declarationData.impact_level as AlertPriority,
                    declarationType: declarationData.declaration_type,
                    declaredBy: declaration.declared_by_name
                }).subscribe({
                    next: () => {
                        console.log('Alert sent to maintenance team');
                    },
                    error: (alertErr) => {
                        console.warn('Could not send alert notification:', alertErr);
                    }
                });

                this.messageService.add({
                    severity: 'success',
                    summary: 'Declaration Created',
                    detail: `Declaration ${declaration.ticket_number} created and maintenance team notified`,
                    life: 5000
                });
                this.showDeclarationDialog = false;
                this.loadDeclarations();
            },
            error: (err) => {
                console.error('Error creating declaration:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to create declaration'
                });
            }
        });
    }

    deleteDeclaration(declaration: DowntimeDeclaration): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete declaration ${declaration.ticket_number}?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.maintenanceService.deleteDeclaration(declaration.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Deleted',
                            detail: `Declaration ${declaration.ticket_number} deleted`
                        });
                        this.loadDeclarations();
                    },
                    error: (err) => {
                        console.error('Error deleting declaration:', err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete declaration'
                        });
                    }
                });
            }
        });
    }

    // ==================== Action Operations ====================

    openActionDialog(declaration: DowntimeDeclaration, action: 'acknowledge' | 'start_work' | 'resolve' | 'cancel'): void {
        this.actionDeclaration = declaration;
        this.actionType = action;
        this.actionForm.reset();
        this.showActionDialog = true;
    }

    executeAction(): void {
        if (!this.actionDeclaration || !this.actionType) return;

        const id = this.actionDeclaration.id;
        const formValue = this.actionForm.value;

        switch (this.actionType) {
            case 'acknowledge':
                this.maintenanceService.acknowledgeDeclaration(id, {
                    acknowledged_by: 1, // TODO: Get current user ID
                    assigned_technician: formValue.assigned_technician?.id
                }).subscribe({
                    next: () => {
                        // Notify if technician assigned
                        if (formValue.assigned_technician?.name) {
                            this.notificationService.notifyTechnicianAssigned(id, formValue.assigned_technician.name);
                        }
                        this.handleActionSuccess('acknowledged');
                    },
                    error: (err) => this.handleActionError(err)
                });
                break;

            case 'start_work':
                // Validate technician selection
                if (!formValue.assigned_technician?.id) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Technician Required',
                        detail: 'Please select a technician to start work on this downtime'
                    });
                    return;
                }
                const techId = formValue.assigned_technician.id;
                const techName = formValue.assigned_technician.name;
                this.maintenanceService.startWorkOnDeclaration(id, techId).subscribe({
                    next: () => {
                        // Notify that work has started
                        this.notificationService.notifyWorkStarted(id, techName);
                        this.handleActionSuccess('started');
                    },
                    error: (err) => this.handleActionError(err)
                });
                break;

            case 'resolve':
                if (!formValue.resolution_notes) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Required',
                        detail: 'Please provide resolution notes'
                    });
                    return;
                }
                this.maintenanceService.resolveDeclaration(id, formValue.resolution_notes).subscribe({
                    next: () => {
                        // Notify that issue is resolved
                        this.notificationService.notifyResolved(id, formValue.resolution_notes);
                        this.handleActionSuccess('resolved');
                    },
                    error: (err) => this.handleActionError(err)
                });
                break;

            case 'cancel':
                this.maintenanceService.cancelDeclaration(id, formValue.cancel_reason || 'Cancelled').subscribe({
                    next: () => this.handleActionSuccess('cancelled'),
                    error: (err) => this.handleActionError(err)
                });
                break;
        }
    }

    handleActionSuccess(action: string): void {
        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Declaration ${action} successfully`
        });
        this.showActionDialog = false;
        this.actionDeclaration = null;
        this.actionType = null;
        this.loadDeclarations();
    }

    handleActionError(err: any): void {
        console.error('Action error:', err);
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.error || 'Action failed'
        });
    }

    // ==================== UI Helpers ====================

    getCountByStatus(status: string): number {
        return this.declarations.filter(d => d.status === status).length;
    }

    getCriticalCount(): number {
        return this.declarations.filter(d => d.impact_level === 'critical' && d.status !== 'resolved' && d.status !== 'cancelled').length;
    }

    getStatusIcon(status: string): string {
        const icons: Record<string, string> = {
            'declared': 'pi pi-clock',
            'acknowledged': 'pi pi-eye',
            'in_progress': 'pi pi-spinner pi-spin',
            'resolved': 'pi pi-check-circle',
            'cancelled': 'pi pi-times-circle'
        };
        return icons[status] || 'pi pi-circle';
    }

    getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
        const map: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
            'declared': 'warn',
            'acknowledged': 'info',
            'in_progress': 'info',
            'resolved': 'success',
            'cancelled': 'secondary'
        };
        return map[status] || 'info';
    }

    getImpactSeverity(impact: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
        const map: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
            'low': 'success',
            'medium': 'info',
            'high': 'warn',
            'critical': 'danger'
        };
        return map[impact] || 'info';
    }

    getTypeSeverity(type: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
        const map: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
            'planned': 'info',
            'unplanned': 'warn',
            'emergency': 'danger'
        };
        return map[type] || 'info';
    }

    getActionLabel(): string {
        const labels: Record<string, string> = {
            'acknowledge': 'Acknowledge Declaration',
            'start_work': 'Start Working',
            'resolve': 'Resolve Declaration',
            'cancel': 'Cancel Declaration'
        };
        return labels[this.actionType || ''] || 'Action';
    }

    formatDateTime(dateStr: string | undefined): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString();
    }

    canAcknowledge(declaration: DowntimeDeclaration): boolean {
        return declaration.status === 'declared';
    }

    canStartWork(declaration: DowntimeDeclaration): boolean {
        return declaration.status === 'declared' || declaration.status === 'acknowledged';
    }

    canResolve(declaration: DowntimeDeclaration): boolean {
        return declaration.status === 'acknowledged' || declaration.status === 'in_progress';
    }

    canCancel(declaration: DowntimeDeclaration): boolean {
        return declaration.status !== 'resolved' && declaration.status !== 'cancelled';
    }

    canDelete(declaration: DowntimeDeclaration): boolean {
        return declaration.status === 'declared' || declaration.status === 'cancelled';
    }

    onFilterChange(): void {
        this.loadDeclarations();
    }
}
