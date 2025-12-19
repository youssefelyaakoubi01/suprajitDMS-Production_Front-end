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

import {
    DowntimeNotificationService,
    DowntimeAlert,
    AlertType,
    AlertPriority
} from '@core/services/downtime-notification.service';

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
        MessageModule
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
}
