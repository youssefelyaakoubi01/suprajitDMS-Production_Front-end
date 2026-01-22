/**
 * Alert Panel Component
 * Real-time alerts display for Maintenance team
 * Style: PrimeNG v19 + Sakai Template (inspired by DMS-Production)
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ChipModule } from 'primeng/chip';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TimelineModule } from 'primeng/timeline';

import {
    DowntimeNotificationService,
    DowntimeAlert,
    AlertType,
    AlertPriority
} from '@core/services/downtime-notification.service';
import { MaintenanceService, DowntimeDeclaration } from '@core/services/maintenance.service';
import { EmployeeService } from '@core/services/employee.service';

@Component({
    selector: 'app-alert-panel',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        ButtonModule,
        BadgeModule,
        TagModule,
        TooltipModule,
        RippleModule,
        DividerModule,
        ScrollPanelModule,
        SelectModule,
        ToggleSwitchModule,
        DialogModule,
        ToastModule,
        AvatarModule,
        ChipModule,
        MessageModule,
        TextareaModule,
        ProgressSpinnerModule,
        TimelineModule
    ],
    providers: [MessageService],
    templateUrl: './alert-panel.component.html',
    styleUrls: ['./alert-panel.component.scss']
})
export class AlertPanelComponent implements OnInit, OnDestroy {
    @Input() expanded = false;
    @Output() alertClicked = new EventEmitter<DowntimeAlert>();
    @Output() acknowledgeClicked = new EventEmitter<DowntimeAlert>();
    @Output() takeOverClicked = new EventEmitter<DowntimeAlert>();

    private destroy$ = new Subject<void>();

    // Data
    alerts: DowntimeAlert[] = [];
    filteredAlerts: DowntimeAlert[] = [];
    criticalAlerts: DowntimeAlert[] = [];
    unreadCount = 0;
    hasUnread = false;
    isConnected = false;

    // Filters
    filterPriority: AlertPriority | null = null;
    filterType: AlertType | null = null;

    // UI State
    showSettings = false;
    showDetailsDialog = false;
    selectedAlert: DowntimeAlert | null = null;
    selectedDeclaration: DowntimeDeclaration | null = null;
    loadingDetails = false;

    // Technician selection
    technicians: any[] = [];
    selectedTechnician: any = null;
    resolutionNotes = '';
    savingAction = false;

    // Preferences
    preferences = {
        enableSound: true,
        enableDesktop: true,
        autoRefreshInterval: 10,
        showCriticalOnly: false
    };

    // Options
    priorityOptions = [
        { label: 'Critical', value: 'critical' },
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' }
    ];

    typeOptions = [
        { label: 'New Downtime', value: 'new_downtime' },
        { label: 'Acknowledged', value: 'acknowledged' },
        { label: 'Technician Assigned', value: 'technician_assigned' },
        { label: 'Work Started', value: 'work_started' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Critical', value: 'critical' }
    ];

    refreshIntervalOptions = [
        { label: '5 seconds', value: 5 },
        { label: '10 seconds', value: 10 },
        { label: '30 seconds', value: 30 },
        { label: '1 minute', value: 60 }
    ];

    constructor(
        private notificationService: DowntimeNotificationService,
        private maintenanceService: MaintenanceService,
        private employeeService: EmployeeService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadPreferences();
        this.subscribeToAlerts();
        this.notificationService.startPolling(this.preferences.autoRefreshInterval);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private subscribeToAlerts(): void {
        this.notificationService.alerts$
            .pipe(takeUntil(this.destroy$))
            .subscribe(alerts => {
                this.alerts = alerts;
                this.applyFilters();
            });

        this.notificationService.criticalAlerts$
            .pipe(takeUntil(this.destroy$))
            .subscribe(alerts => {
                this.criticalAlerts = alerts;
            });

        this.notificationService.unreadCount$
            .pipe(takeUntil(this.destroy$))
            .subscribe(count => {
                this.unreadCount = count;
                this.hasUnread = count > 0;
            });

        this.notificationService.isConnected$
            .pipe(takeUntil(this.destroy$))
            .subscribe(connected => {
                this.isConnected = connected;
            });

        this.notificationService.newAlert$
            .pipe(takeUntil(this.destroy$))
            .subscribe(alert => {
                this.showAlertToast(alert);
            });
    }

    applyFilters(): void {
        let filtered = [...this.alerts];

        if (this.preferences.showCriticalOnly) {
            filtered = filtered.filter(a => a.priority === 'critical');
        }

        if (this.filterPriority) {
            filtered = filtered.filter(a => a.priority === this.filterPriority);
        }

        if (this.filterType) {
            filtered = filtered.filter(a => a.type === this.filterType);
        }

        filtered.sort((a, b) => {
            if (a.status === 'unread' && b.status !== 'unread') return -1;
            if (a.status !== 'unread' && b.status === 'unread') return 1;
            return b.createdAt.getTime() - a.createdAt.getTime();
        });

        this.filteredAlerts = filtered;
    }

    refresh(): void {
        this.notificationService.startPolling(this.preferences.autoRefreshInterval);
        this.messageService.add({
            severity: 'info',
            summary: 'Refreshed',
            detail: 'Alerts updated',
            life: 2000
        });
    }

    toggleExpand(): void {
        this.expanded = !this.expanded;
    }

    // Alert Actions
    handleAlertClick(alert: DowntimeAlert): void {
        if (alert.status === 'unread') {
            this.notificationService.markAsRead(alert.id);
        }
        this.alertClicked.emit(alert);
    }

    acknowledgeAlert(alert: DowntimeAlert): void {
        this.acknowledgeClicked.emit(alert);
        this.messageService.add({
            severity: 'success',
            summary: 'Acknowledged',
            detail: `Alert ${alert.ticketNumber || alert.id} acknowledged`
        });
    }

    takeOverAlert(alert: DowntimeAlert): void {
        this.takeOverClicked.emit(alert);
        this.messageService.add({
            severity: 'success',
            summary: 'Assigned',
            detail: `You are now assigned to ${alert.ticketNumber || alert.workstation}`
        });
    }

    markAsRead(alert: DowntimeAlert): void {
        this.notificationService.markAsRead(alert.id);
    }

    markAllRead(): void {
        this.notificationService.markAllAsRead();
        this.messageService.add({
            severity: 'info',
            summary: 'Done',
            detail: 'All alerts marked as read'
        });
    }

    dismissAlert(alert: DowntimeAlert): void {
        this.notificationService.dismissAlert(alert.id);
    }

    viewAllTickets(): void {
        window.location.href = '/dms-maintenance/open-tickets';
    }

    // UI Helpers
    getTypeIcon(type: AlertType): string {
        return this.notificationService.getAlertIcon(type);
    }

    getTypeIconClass(type: AlertType): string {
        const classes: Record<AlertType, string> = {
            'new_downtime': 'text-red-500',
            'acknowledged': 'text-blue-500',
            'technician_assigned': 'text-green-500',
            'work_started': 'text-orange-500',
            'resolved': 'text-green-600',
            'escalated': 'text-yellow-600',
            'critical': 'text-red-600'
        };
        return classes[type] || 'text-gray-500';
    }

    getPrioritySeverity(priority: AlertPriority): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const map: Record<AlertPriority, 'success' | 'info' | 'warn' | 'danger'> = {
            'low': 'success',
            'medium': 'info',
            'high': 'warn',
            'critical': 'danger'
        };
        return map[priority];
    }

    getPriorityClass(priority: AlertPriority): string {
        const classes: Record<AlertPriority, string> = {
            'low': 'priority-low',
            'medium': 'priority-medium',
            'high': 'priority-high',
            'critical': 'priority-critical'
        };
        return classes[priority];
    }

    getAvatarBg(priority: AlertPriority): string {
        const backgrounds: Record<AlertPriority, string> = {
            'low': 'var(--green-100)',
            'medium': 'var(--blue-100)',
            'high': 'var(--orange-100)',
            'critical': 'var(--red-100)'
        };
        return backgrounds[priority] || 'var(--surface-100)';
    }

    getAvatarColor(priority: AlertPriority): string {
        const colors: Record<AlertPriority, string> = {
            'low': 'var(--green-600)',
            'medium': 'var(--blue-600)',
            'high': 'var(--orange-600)',
            'critical': 'var(--red-600)'
        };
        return colors[priority] || 'var(--text-color-secondary)';
    }

    getTimeAgo(date: Date): string {
        return this.notificationService.formatTimeAgo(date);
    }

    trackByAlertId(index: number, alert: DowntimeAlert): string {
        return alert.id;
    }

    private showAlertToast(alert: DowntimeAlert): void {
        const severity = alert.priority === 'critical' ? 'error' :
                        alert.priority === 'high' ? 'warn' : 'info';

        this.messageService.add({
            severity,
            summary: alert.title,
            detail: alert.message,
            life: alert.priority === 'critical' ? 10000 : 5000,
            sticky: alert.priority === 'critical'
        });
    }

    // Preferences
    loadPreferences(): void {
        this.notificationService.loadPreferences();
        this.preferences = this.notificationService.getPreferences();
    }

    savePreferences(): void {
        this.notificationService.updatePreferences(this.preferences);
    }

    // ==================== Details Dialog ====================

    openDetailsDialog(alert: DowntimeAlert): void {
        this.selectedAlert = alert;
        this.loadingDetails = true;
        this.showDetailsDialog = true;
        this.selectedTechnician = null;
        this.resolutionNotes = '';

        // Load technicians if not loaded
        if (this.technicians.length === 0) {
            this.loadTechnicians();
        }

        // Load declaration details
        if (alert.declarationId) {
            this.maintenanceService.getDeclaration(alert.declarationId).subscribe({
                next: (declaration) => {
                    this.selectedDeclaration = declaration;
                    this.loadingDetails = false;

                    // Pre-select assigned technician if any
                    if (declaration.assigned_technician) {
                        this.selectedTechnician = this.technicians.find(
                            t => t.id === declaration.assigned_technician
                        );
                    }
                },
                error: (err) => {
                    console.error('Error loading declaration:', err);
                    this.loadingDetails = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load declaration details'
                    });
                }
            });
        } else {
            this.loadingDetails = false;
        }
    }

    closeDetailsDialog(): void {
        this.showDetailsDialog = false;
        this.selectedAlert = null;
        this.selectedDeclaration = null;
    }

    loadTechnicians(): void {
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
                    // Fallback: load from Maintenance department
                    this.employeeService.getEmployees({ department: 'Maintenance' }).subscribe({
                        next: (resp: any) => {
                            const emps = Array.isArray(resp) ? resp : resp.results || [];
                            this.technicians = emps.map((e: any) => ({
                                id: e.id,
                                name: `${e.first_name} ${e.last_name}`,
                                department: e.department
                            }));
                        }
                    });
                }
            },
            error: () => {
                // Fallback: load all active employees
                this.employeeService.getEmployees({ status: 'active' }).subscribe({
                    next: (resp: any) => {
                        const emps = Array.isArray(resp) ? resp : resp.results || [];
                        this.technicians = emps.map((e: any) => ({
                            id: e.id,
                            name: `${e.first_name} ${e.last_name}`,
                            department: e.department
                        }));
                    }
                });
            }
        });
    }

    // ==================== Actions ====================

    acknowledgeDeclaration(): void {
        if (!this.selectedDeclaration) return;

        this.savingAction = true;
        this.maintenanceService.acknowledgeDeclaration(this.selectedDeclaration.id, {
            acknowledged_by: 1, // TODO: Get current user ID
            assigned_technician: this.selectedTechnician?.id
        }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Acknowledged',
                    detail: `Declaration ${this.selectedDeclaration?.ticket_number} acknowledged`
                });
                this.savingAction = false;
                this.refreshDeclarationDetails();
            },
            error: (err) => {
                this.savingAction = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.error || 'Failed to acknowledge'
                });
            }
        });
    }

    assignTechnician(): void {
        if (!this.selectedDeclaration || !this.selectedTechnician) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please select a technician'
            });
            return;
        }

        this.savingAction = true;
        this.maintenanceService.startWorkOnDeclaration(
            this.selectedDeclaration.id,
            this.selectedTechnician.id
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Assigned',
                    detail: `${this.selectedTechnician.name} assigned to ticket`
                });
                this.savingAction = false;
                this.refreshDeclarationDetails();
            },
            error: (err) => {
                this.savingAction = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.error || 'Failed to assign technician'
                });
            }
        });
    }

    resolveDeclaration(): void {
        if (!this.selectedDeclaration) return;

        if (!this.resolutionNotes.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please enter resolution notes'
            });
            return;
        }

        this.savingAction = true;
        this.maintenanceService.resolveDeclaration(
            this.selectedDeclaration.id,
            this.resolutionNotes
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Resolved',
                    detail: `Declaration ${this.selectedDeclaration?.ticket_number} resolved`
                });
                this.savingAction = false;
                this.closeDetailsDialog();
                this.refresh();
            },
            error: (err) => {
                this.savingAction = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.error || 'Failed to resolve'
                });
            }
        });
    }

    refreshDeclarationDetails(): void {
        if (this.selectedDeclaration) {
            this.maintenanceService.getDeclaration(this.selectedDeclaration.id).subscribe({
                next: (declaration) => {
                    this.selectedDeclaration = declaration;
                }
            });
        }
    }

    // ==================== Time Calculations ====================

    getWaitingTime(): string {
        if (!this.selectedDeclaration) return '-';
        const declared = new Date(this.selectedDeclaration.declared_at);
        const start = this.selectedDeclaration.actual_start
            ? new Date(this.selectedDeclaration.actual_start)
            : new Date();
        return this.formatDuration(start.getTime() - declared.getTime());
    }

    getInterventionTime(): string {
        if (!this.selectedDeclaration?.actual_start) return '-';
        const start = new Date(this.selectedDeclaration.actual_start);
        const end = this.selectedDeclaration.actual_end
            ? new Date(this.selectedDeclaration.actual_end)
            : new Date();
        return this.formatDuration(end.getTime() - start.getTime());
    }

    getTotalDowntime(): string {
        if (!this.selectedDeclaration) return '-';
        const declared = new Date(this.selectedDeclaration.declared_at);
        const end = this.selectedDeclaration.actual_end
            ? new Date(this.selectedDeclaration.actual_end)
            : new Date();
        return this.formatDuration(end.getTime() - declared.getTime());
    }

    private formatDuration(ms: number): string {
        if (ms < 0) return '-';
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${remainingMinutes}min`;
        }
        return `${minutes}min`;
    }

    formatDateTime(dateStr: string | undefined): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString();
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'declared': 'Declared',
            'acknowledged': 'Acknowledged',
            'in_progress': 'In Progress',
            'resolved': 'Resolved',
            'cancelled': 'Cancelled'
        };
        return labels[status] || status;
    }

    getStatusDetailSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            'declared': 'warn',
            'acknowledged': 'info',
            'in_progress': 'info',
            'resolved': 'success',
            'cancelled': 'secondary'
        };
        return map[status] || 'info';
    }

    getDeclarationTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            'planned': 'info',
            'unplanned': 'warn',
            'emergency': 'danger'
        };
        return map[type] || 'secondary';
    }
}
