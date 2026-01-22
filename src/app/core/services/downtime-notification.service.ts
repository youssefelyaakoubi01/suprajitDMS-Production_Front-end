/**
 * Downtime Notification Service
 * Manages real-time notifications between Production (downtime declaration) and Maintenance
 *
 * Flow:
 * 1. Operator declares downtime → Alert sent to Maintenance
 * 2. Maintenance acknowledges → Operator notified
 * 3. Technician starts work → Status updated
 * 4. Issue resolved → All parties notified
 */
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, Subscription, of } from 'rxjs';
import { takeUntil, filter, map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { PushNotificationService, PushSubscriptionState } from './push-notification.service';

// Alert types
export type AlertType = 'new_downtime' | 'acknowledged' | 'technician_assigned' | 'work_started' | 'resolved' | 'escalated' | 'critical';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'unread' | 'read' | 'dismissed';

// Alert interface
export interface DowntimeAlert {
    id: string;
    type: AlertType;
    priority: AlertPriority;
    status: AlertStatus;
    title: string;
    message: string;
    declarationId: number;
    ticketNumber?: string;
    workstation?: string;
    productionLine?: string;
    machine?: string;
    zone?: string;
    declaredBy?: string;
    assignedTechnician?: string;
    createdAt: Date;
    readAt?: Date;
    metadata?: Record<string, any>;
}

// Notification preferences
export interface NotificationPreferences {
    enableSound: boolean;
    enableDesktop: boolean;
    enablePush: boolean; // Web Push notifications (works when browser is closed)
    autoRefreshInterval: number; // seconds
    showCriticalOnly: boolean;
    filterByZone?: string[];
    filterByLine?: number[];
}

// Statistics
export interface AlertStatistics {
    total: number;
    unread: number;
    critical: number;
    byType: Record<AlertType, number>;
    avgResponseTime: number; // minutes
}

@Injectable({
    providedIn: 'root'
})
export class DowntimeNotificationService implements OnDestroy {
    private readonly endpoint = 'maintenance';

    // Alerts storage
    private alertsSubject = new BehaviorSubject<DowntimeAlert[]>([]);
    public alerts$ = this.alertsSubject.asObservable();

    // Unread count
    private unreadCountSubject = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadCountSubject.asObservable();

    // Critical alerts
    private criticalAlertsSubject = new BehaviorSubject<DowntimeAlert[]>([]);
    public criticalAlerts$ = this.criticalAlertsSubject.asObservable();

    // New alert event (for sounds/notifications)
    private newAlertSubject = new Subject<DowntimeAlert>();
    public newAlert$ = this.newAlertSubject.asObservable();

    // Connection status
    private isConnectedSubject = new BehaviorSubject<boolean>(false);
    public isConnected$ = this.isConnectedSubject.asObservable();

    // Cleanup
    private destroy$ = new Subject<void>();
    private pollingSubscription?: Subscription;

    // Preferences
    private preferences: NotificationPreferences = {
        enableSound: true,
        enableDesktop: true,
        enablePush: false,
        autoRefreshInterval: 10,
        showCriticalOnly: false
    };

    // Audio support
    private alertSound?: HTMLAudioElement;
    private soundsAvailable = false;

    // Push notification state
    private pushStateSubject = new BehaviorSubject<PushSubscriptionState | null>(null);
    public pushState$ = this.pushStateSubject.asObservable();

    constructor(
        private api: ApiService,
        private pushService: PushNotificationService
    ) {
        this.initializeSounds();
        this.requestNotificationPermission();
        this.initializePushNotifications();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.stopPolling();
    }

    // ==================== INITIALIZATION ====================

    private initializeSounds(): void {
        try {
            // Create audio element for alert sound
            this.alertSound = new Audio();
            this.alertSound.volume = 0.6;

            // Handle load success
            this.alertSound.addEventListener('canplaythrough', () => {
                this.soundsAvailable = true;
            }, { once: true });

            // Handle load error gracefully
            this.alertSound.addEventListener('error', () => {
                console.warn('Alert sound file not available, audio notifications disabled');
                this.soundsAvailable = false;
            }, { once: true });

            // Load alert.mp3
            this.alertSound.src = 'assets/sounds/alert.mp3';
            this.alertSound.load();
        } catch (e) {
            console.warn('Could not initialize alert sounds:', e);
            this.soundsAvailable = false;
        }
    }

    private requestNotificationPermission(): void {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    private initializePushNotifications(): void {
        // Subscribe to push state changes
        this.pushService.getState()
            .pipe(takeUntil(this.destroy$))
            .subscribe(state => {
                this.pushStateSubject.next(state);
                // Update preferences based on actual subscription state
                if (state.isSubscribed !== this.preferences.enablePush) {
                    this.preferences.enablePush = state.isSubscribed;
                    this.saveToLocalStorage();
                }
            });

        // Initialize push service
        this.pushService.init().then(success => {
            if (success) {
                console.log('[Downtime Notifications] Push service initialized');
            }
        });
    }

    // ==================== PUSH NOTIFICATION METHODS ====================

    /**
     * Enable push notifications for the current user
     * @param employeeId Optional employee ID to associate with the subscription
     */
    async enablePushNotifications(employeeId?: number): Promise<boolean> {
        try {
            const subscription = await this.pushService.subscribe(employeeId);
            if (subscription) {
                this.preferences.enablePush = true;
                this.saveToLocalStorage();
                return true;
            }
            return false;
        } catch (error) {
            console.error('[Downtime Notifications] Failed to enable push:', error);
            return false;
        }
    }

    /**
     * Disable push notifications
     */
    async disablePushNotifications(): Promise<boolean> {
        try {
            const success = await this.pushService.unsubscribe();
            if (success) {
                this.preferences.enablePush = false;
                this.saveToLocalStorage();
            }
            return success;
        } catch (error) {
            console.error('[Downtime Notifications] Failed to disable push:', error);
            return false;
        }
    }

    /**
     * Toggle push notifications on/off
     * @param employeeId Optional employee ID for subscription
     */
    async togglePushNotifications(employeeId?: number): Promise<boolean> {
        if (this.pushService.isSubscribed()) {
            return this.disablePushNotifications();
        } else {
            return this.enablePushNotifications(employeeId);
        }
    }

    /**
     * Check if push notifications are enabled
     */
    isPushEnabled(): boolean {
        return this.pushService.isSubscribed();
    }

    /**
     * Get the current push notification state
     */
    getPushState(): PushSubscriptionState | null {
        return this.pushStateSubject.value;
    }

    /**
     * Send a test push notification
     */
    async sendTestPushNotification(): Promise<boolean> {
        return this.pushService.sendTestNotification();
    }

    // ==================== POLLING ====================

    startPolling(intervalSeconds?: number): void {
        const pollInterval = (intervalSeconds || this.preferences.autoRefreshInterval) * 1000;

        this.stopPolling();
        this.isConnectedSubject.next(true);

        // Initial fetch
        this.fetchAlerts();

        // Start polling
        this.pollingSubscription = interval(pollInterval)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.fetchAlerts());
    }

    stopPolling(): void {
        this.pollingSubscription?.unsubscribe();
        this.isConnectedSubject.next(false);
    }

    private fetchAlerts(): void {
        this.api.get<any>(`${this.endpoint}/declarations/alerts/`).subscribe({
            next: (data) => {
                // Handle both array and object response formats
                const alertsData = Array.isArray(data) ? data : (data.alerts || []);
                const alerts = this.mapAlertsFromApi(alertsData);
                this.processNewAlerts(alerts);
            },
            error: (err) => {
                console.error('Failed to fetch alerts:', err);
                // Use local storage as fallback
                this.loadFromLocalStorage();
            }
        });
    }

    private processNewAlerts(alerts: DowntimeAlert[]): void {
        const currentAlerts = this.alertsSubject.value;
        const currentIds = new Set(currentAlerts.map(a => a.id));

        // Find new alerts
        const newAlerts = alerts.filter(a => !currentIds.has(a.id));

        // Notify for each new alert
        newAlerts.forEach(alert => {
            this.newAlertSubject.next(alert);
            this.playAlertSound(alert);
            this.showDesktopNotification(alert);
        });

        // Update alerts
        this.alertsSubject.next(alerts);
        this.updateCounts();
        this.saveToLocalStorage();
    }

    private updateCounts(): void {
        const alerts = this.alertsSubject.value;
        const unread = alerts.filter(a => a.status === 'unread').length;
        const critical = alerts.filter(a => a.priority === 'critical' && a.status !== 'dismissed');

        this.unreadCountSubject.next(unread);
        this.criticalAlertsSubject.next(critical);
    }

    // ==================== API MAPPING ====================

    private mapAlertsFromApi(data: any[]): DowntimeAlert[] {
        return (data || []).map(item => ({
            id: item.id?.toString() || `alert-${Date.now()}`,
            type: this.mapAlertType(item.type || item.status),
            priority: item.priority || item.impactLevel || item.impact_level || 'medium',
            status: item.isNew ? 'unread' : (item.read ? 'read' : 'unread'),
            title: this.generateAlertTitle(item),
            message: item.message || item.reason || item.description || '',
            declarationId: item.declarationId || item.declaration_id || item.id,
            ticketNumber: item.ticketNumber || item.ticket_number,
            workstation: item.workstation || item.workstation_name,
            productionLine: item.productionLine || item.production_line_name || item.production_line,
            machine: item.machine || item.machine_name,
            zone: item.zone,
            declaredBy: item.declaredBy || item.declared_by_name || item.declared_by,
            assignedTechnician: item.assignedTechnician || item.assigned_technician_name,
            createdAt: new Date(item.declaredAt || item.created_at || item.declared_at || Date.now()),
            readAt: item.read_at ? new Date(item.read_at) : undefined,
            metadata: item.metadata
        }));
    }

    private mapAlertType(status: string): AlertType {
        const typeMap: Record<string, AlertType> = {
            'declared': 'new_downtime',
            'acknowledged': 'acknowledged',
            'assigned': 'technician_assigned',
            'in_progress': 'work_started',
            'resolved': 'resolved',
            'escalated': 'escalated',
            'critical': 'critical'
        };
        return typeMap[status] || 'new_downtime';
    }

    private generateAlertTitle(item: any): string {
        const type = item.type || item.status;
        const ws = item.workstation_name || item.workstation || 'Unknown';

        switch (type) {
            case 'declared':
            case 'new_downtime':
                return `🚨 New Downtime: ${ws}`;
            case 'acknowledged':
                return `✓ Acknowledged: ${ws}`;
            case 'assigned':
            case 'technician_assigned':
                return `👤 Technician Assigned: ${ws}`;
            case 'in_progress':
            case 'work_started':
                return `🔧 Work Started: ${ws}`;
            case 'resolved':
                return `✅ Resolved: ${ws}`;
            case 'escalated':
                return `⚠️ Escalated: ${ws}`;
            case 'critical':
                return `🔴 CRITICAL: ${ws}`;
            default:
                return `Alert: ${ws}`;
        }
    }

    // ==================== NOTIFICATIONS ====================

    private playAlertSound(alert: DowntimeAlert): void {
        if (!this.preferences.enableSound) return;
        if (!this.soundsAvailable || !this.alertSound) return;

        // Set volume based on priority
        this.alertSound.volume = alert.priority === 'critical' ? 1.0 : 0.6;

        // Reset to start if already playing
        this.alertSound.currentTime = 0;

        // Play - catch rejection silently (autoplay policy)
        this.alertSound.play().catch(() => {
            // Ignore play errors (user interaction required, autoplay blocked, etc.)
        });
    }

    private showDesktopNotification(alert: DowntimeAlert): void {
        if (!this.preferences.enableDesktop) return;
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;

        const notification = new Notification(alert.title, {
            body: alert.message,
            icon: this.getAlertIconPath(alert.type),
            tag: alert.id,
            requireInteraction: alert.priority === 'critical'
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        // Auto-close non-critical after 5 seconds
        if (alert.priority !== 'critical') {
            setTimeout(() => notification.close(), 5000);
        }
    }

    private getAlertIconPath(type: AlertType): string {
        const icons: Record<AlertType, string> = {
            'new_downtime': 'assets/icons/alert-red.png',
            'acknowledged': 'assets/icons/check-blue.png',
            'technician_assigned': 'assets/icons/user-green.png',
            'work_started': 'assets/icons/wrench-orange.png',
            'resolved': 'assets/icons/check-green.png',
            'escalated': 'assets/icons/warning-yellow.png',
            'critical': 'assets/icons/critical-red.png'
        };
        return icons[type] || 'assets/icons/alert.png';
    }

    // ==================== ALERT ACTIONS ====================

    markAsRead(alertId: string): void {
        const alerts = this.alertsSubject.value.map(a =>
            a.id === alertId ? { ...a, status: 'read' as AlertStatus, readAt: new Date() } : a
        );
        this.alertsSubject.next(alerts);
        this.updateCounts();
        this.saveToLocalStorage();

        // Notify backend
        this.api.post(`${this.endpoint}/alerts/${alertId}/read`, {}).subscribe();
    }

    markAllAsRead(): void {
        const alerts = this.alertsSubject.value.map(a => ({
            ...a,
            status: 'read' as AlertStatus,
            readAt: new Date()
        }));
        this.alertsSubject.next(alerts);
        this.updateCounts();
        this.saveToLocalStorage();

        // Notify backend
        this.api.post(`${this.endpoint}/alerts/mark-all-read`, {}).subscribe();
    }

    dismissAlert(alertId: string): void {
        const alerts = this.alertsSubject.value.map(a =>
            a.id === alertId ? { ...a, status: 'dismissed' as AlertStatus } : a
        );
        this.alertsSubject.next(alerts);
        this.updateCounts();
        this.saveToLocalStorage();
    }

    clearDismissed(): void {
        const alerts = this.alertsSubject.value.filter(a => a.status !== 'dismissed');
        this.alertsSubject.next(alerts);
        this.saveToLocalStorage();
    }

    // ==================== CREATE ALERT (for production side) ====================

    createDowntimeAlert(declaration: {
        id: number;
        ticketNumber?: string;
        workstation?: string;
        workstationName?: string;
        productionLine?: string;
        productionLineName?: string;
        machine?: string;
        machineName?: string;
        zone?: string;
        reason: string;
        impactLevel: AlertPriority;
        declarationType: string;
        declaredBy?: string;
    }): Observable<DowntimeAlert> {
        const alert: DowntimeAlert = {
            id: `alert-${declaration.id}-${Date.now()}`,
            type: declaration.declarationType === 'emergency' ? 'critical' : 'new_downtime',
            priority: declaration.impactLevel,
            status: 'unread',
            title: `🚨 ${declaration.declarationType === 'emergency' ? 'EMERGENCY' : 'New Downtime'}: ${declaration.workstationName || declaration.workstation}`,
            message: declaration.reason,
            declarationId: declaration.id,
            ticketNumber: declaration.ticketNumber,
            workstation: declaration.workstationName || declaration.workstation,
            productionLine: declaration.productionLineName || declaration.productionLine,
            machine: declaration.machineName || declaration.machine,
            zone: declaration.zone,
            declaredBy: declaration.declaredBy,
            createdAt: new Date()
        };

        // Add to local alerts immediately
        const currentAlerts = this.alertsSubject.value;
        this.alertsSubject.next([alert, ...currentAlerts]);
        this.updateCounts();

        // Notify subscribers
        this.newAlertSubject.next(alert);
        this.playAlertSound(alert);
        this.showDesktopNotification(alert);

        // Save locally
        this.saveToLocalStorage();

        // Send to backend for distribution to maintenance (optional - may not be implemented)
        return this.api.post<any>(`${this.endpoint}/declarations/send_alert/`, {
            declaration_id: declaration.id,
            alert_type: alert.type,
            priority: alert.priority
        }).pipe(
            map(() => alert),
            catchError((error) => {
                // If endpoint doesn't exist, just return the alert (local notification still works)
                console.warn('Alert endpoint not available, using local notifications only:', error.status);
                return of(alert);
            })
        );
    }

    // Alert when technician is assigned
    notifyTechnicianAssigned(declarationId: number, technicianName: string): void {
        this.updateAlertType(declarationId, 'technician_assigned', {
            assignedTechnician: technicianName,
            message: `Technician ${technicianName} has been assigned`
        });
    }

    // Alert when work starts
    notifyWorkStarted(declarationId: number, technicianName: string): void {
        this.updateAlertType(declarationId, 'work_started', {
            message: `${technicianName} has started working on the issue`
        });
    }

    // Alert when resolved
    notifyResolved(declarationId: number, resolution: string): void {
        this.updateAlertType(declarationId, 'resolved', {
            message: `Issue resolved: ${resolution}`
        });
    }

    private updateAlertType(declarationId: number, newType: AlertType, updates: Partial<DowntimeAlert>): void {
        const alerts = this.alertsSubject.value.map(a => {
            if (a.declarationId === declarationId) {
                return {
                    ...a,
                    type: newType,
                    title: this.generateAlertTitle({ type: newType, workstation_name: a.workstation }),
                    ...updates
                };
            }
            return a;
        });
        this.alertsSubject.next(alerts);
        this.saveToLocalStorage();
    }

    // ==================== FILTERING ====================

    getAlertsByType(type: AlertType): Observable<DowntimeAlert[]> {
        return this.alerts$.pipe(
            map(alerts => alerts.filter(a => a.type === type))
        );
    }

    getAlertsByPriority(priority: AlertPriority): Observable<DowntimeAlert[]> {
        return this.alerts$.pipe(
            map(alerts => alerts.filter(a => a.priority === priority))
        );
    }

    getUnreadAlerts(): Observable<DowntimeAlert[]> {
        return this.alerts$.pipe(
            map(alerts => alerts.filter(a => a.status === 'unread'))
        );
    }

    getAlertsByDeclaration(declarationId: number): Observable<DowntimeAlert[]> {
        return this.alerts$.pipe(
            map(alerts => alerts.filter(a => a.declarationId === declarationId))
        );
    }

    // ==================== STATISTICS ====================

    getStatistics(): Observable<AlertStatistics> {
        return this.alerts$.pipe(
            map(alerts => {
                const byType = alerts.reduce((acc, a) => {
                    acc[a.type] = (acc[a.type] || 0) + 1;
                    return acc;
                }, {} as Record<AlertType, number>);

                return {
                    total: alerts.length,
                    unread: alerts.filter(a => a.status === 'unread').length,
                    critical: alerts.filter(a => a.priority === 'critical').length,
                    byType,
                    avgResponseTime: this.calculateAvgResponseTime(alerts)
                };
            })
        );
    }

    private calculateAvgResponseTime(alerts: DowntimeAlert[]): number {
        const acknowledgedAlerts = alerts.filter(a => a.type === 'acknowledged' && a.readAt);
        if (acknowledgedAlerts.length === 0) return 0;

        const totalTime = acknowledgedAlerts.reduce((sum, a) => {
            const diff = (a.readAt!.getTime() - a.createdAt.getTime()) / 60000;
            return sum + diff;
        }, 0);

        return Math.round(totalTime / acknowledgedAlerts.length);
    }

    // ==================== PREFERENCES ====================

    updatePreferences(prefs: Partial<NotificationPreferences>): void {
        this.preferences = { ...this.preferences, ...prefs };
        localStorage.setItem('dms_notification_prefs', JSON.stringify(this.preferences));

        // Restart polling if interval changed
        if (prefs.autoRefreshInterval && this.isConnectedSubject.value) {
            this.startPolling(prefs.autoRefreshInterval);
        }
    }

    getPreferences(): NotificationPreferences {
        return { ...this.preferences };
    }

    loadPreferences(): void {
        const saved = localStorage.getItem('dms_notification_prefs');
        if (saved) {
            try {
                this.preferences = { ...this.preferences, ...JSON.parse(saved) };
            } catch (e) {
                console.warn('Could not load notification preferences');
            }
        }
    }

    // ==================== LOCAL STORAGE ====================

    private saveToLocalStorage(): void {
        try {
            const alerts = this.alertsSubject.value.slice(0, 100); // Keep last 100
            localStorage.setItem('dms_alerts', JSON.stringify(alerts));
        } catch (e) {
            console.warn('Could not save alerts to localStorage');
        }
    }

    private loadFromLocalStorage(): void {
        try {
            const saved = localStorage.getItem('dms_alerts');
            if (saved) {
                const alerts = JSON.parse(saved).map((a: any) => ({
                    ...a,
                    createdAt: new Date(a.createdAt),
                    readAt: a.readAt ? new Date(a.readAt) : undefined
                }));
                this.alertsSubject.next(alerts);
                this.updateCounts();
            }
        } catch (e) {
            console.warn('Could not load alerts from localStorage');
        }
    }

    // ==================== UTILITY ====================

    getAlertColor(alert: DowntimeAlert): string {
        const colors: Record<AlertPriority, string> = {
            'low': '#10B981',
            'medium': '#3B82F6',
            'high': '#F59E0B',
            'critical': '#EF4444'
        };
        return colors[alert.priority];
    }

    getAlertIcon(type: AlertType): string {
        const icons: Record<AlertType, string> = {
            'new_downtime': 'pi pi-exclamation-triangle',
            'acknowledged': 'pi pi-eye',
            'technician_assigned': 'pi pi-user',
            'work_started': 'pi pi-wrench',
            'resolved': 'pi pi-check-circle',
            'escalated': 'pi pi-arrow-up',
            'critical': 'pi pi-times-circle'
        };
        return icons[type];
    }

    formatTimeAgo(date: Date): string {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }
}
