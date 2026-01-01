import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { HRService } from './hr.service';
import { RecyclageEmployee } from '../models/employee.model';

export interface RecyclageAlertConfig {
    alertThresholdDays: number;
}

export interface RecyclageAlert {
    employee: RecyclageEmployee;
    severity: 'danger' | 'warn' | 'info';
    message: string;
    daysRemaining: number;
}

@Injectable({
    providedIn: 'root'
})
export class RecyclageAlertService implements OnDestroy {
    private readonly CONFIG_KEY = 'dms_recyclage_alert_config';
    private readonly DEFAULT_THRESHOLD = 3;
    private readonly REFRESH_INTERVAL = 300000; // 5 minutes

    private config: RecyclageAlertConfig = {
        alertThresholdDays: this.DEFAULT_THRESHOLD
    };

    // Subjects
    private alertsSubject = new BehaviorSubject<RecyclageAlert[]>([]);
    private urgentCountSubject = new BehaviorSubject<number>(0);
    private destroy$ = new Subject<void>();
    private initialized = false;

    // Public observables
    public alerts$ = this.alertsSubject.asObservable();
    public urgentCount$ = this.urgentCountSubject.asObservable();

    constructor(
        private hrService: HRService,
        private messageService: MessageService
    ) {
        this.loadConfig();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Initialize the service - called at app startup via APP_INITIALIZER
     */
    initialize(): Promise<void> {
        if (this.initialized) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this.loadRecyclageAlerts();
            this.startAutoRefresh();
            this.initialized = true;
            resolve();
        });
    }

    /**
     * Load recyclage alerts from API
     */
    loadRecyclageAlerts(): void {
        this.hrService.getEmployeesRequiringRecyclage()
            .pipe(
                takeUntil(this.destroy$),
                catchError(error => {
                    console.error('Erreur lors du chargement des alertes recyclage:', error);
                    return [];
                })
            )
            .subscribe((employees: RecyclageEmployee[]) => {
                const urgentEmployees = this.filterUrgentEmployees(employees);
                const alerts = this.mapToAlerts(urgentEmployees);

                this.alertsSubject.next(alerts);
                this.urgentCountSubject.next(alerts.length);

                // Show toast notifications on first load
                if (this.initialized === false) {
                    this.showInitialToasts(alerts);
                }
            });
    }

    /**
     * Filter employees based on threshold
     */
    private filterUrgentEmployees(employees: RecyclageEmployee[]): RecyclageEmployee[] {
        return employees.filter(emp =>
            emp.requiresRecyclage &&
            (emp.isOverdue || emp.daysUntilRecyclage <= this.config.alertThresholdDays)
        );
    }

    /**
     * Map employees to alert objects
     */
    private mapToAlerts(employees: RecyclageEmployee[]): RecyclageAlert[] {
        return employees.map(emp => ({
            employee: emp,
            severity: this.getAlertSeverity(emp),
            message: this.getAlertMessage(emp),
            daysRemaining: emp.daysUntilRecyclage
        }));
    }

    /**
     * Determine alert severity
     */
    private getAlertSeverity(emp: RecyclageEmployee): 'danger' | 'warn' | 'info' {
        if (emp.isOverdue) return 'danger';
        if (emp.daysUntilRecyclage <= 1) return 'danger';
        if (emp.daysUntilRecyclage <= this.config.alertThresholdDays) return 'warn';
        return 'info';
    }

    /**
     * Generate alert message
     */
    private getAlertMessage(emp: RecyclageEmployee): string {
        const name = `${emp.Employee.Prenom_Emp} ${emp.Employee.Nom_Emp}`;

        if (emp.isOverdue) {
            return `${name}: En retard de ${Math.abs(emp.daysUntilRecyclage)} jour(s)`;
        }

        if (emp.daysUntilRecyclage === 0) {
            return `${name}: Expire aujourd'hui!`;
        }

        if (emp.daysUntilRecyclage === 1) {
            return `${name}: Il reste 1 jour`;
        }

        return `${name}: Il reste ${emp.daysUntilRecyclage} jours`;
    }

    /**
     * Show toast notifications for urgent alerts
     */
    private showInitialToasts(alerts: RecyclageAlert[]): void {
        // Limit to 5 toasts max to avoid overwhelming the user
        const toastsToShow = alerts.slice(0, 5);

        toastsToShow.forEach((alert, index) => {
            setTimeout(() => {
                const isOverdue = alert.employee.isOverdue;
                const name = `${alert.employee.Employee.Prenom_Emp} ${alert.employee.Employee.Nom_Emp}`;

                this.messageService.add({
                    severity: isOverdue ? 'error' : 'warn',
                    summary: isOverdue ? 'Recyclage en retard!' : 'Recyclage imminent',
                    detail: alert.message,
                    life: 5000,
                    key: 'recyclageAlert'
                });
            }, index * 500); // Stagger toasts by 500ms
        });

        // If there are more alerts, show a summary
        if (alerts.length > 5) {
            setTimeout(() => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Alertes Recyclage',
                    detail: `${alerts.length - 5} autres opérateurs nécessitent un recyclage`,
                    life: 5000,
                    key: 'recyclageAlert'
                });
            }, 5 * 500 + 500);
        }
    }

    /**
     * Start auto-refresh interval
     */
    private startAutoRefresh(): void {
        interval(this.REFRESH_INTERVAL)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.loadRecyclageAlerts();
            });
    }

    /**
     * Get current alerts
     */
    getAlerts(): RecyclageAlert[] {
        return this.alertsSubject.getValue();
    }

    /**
     * Get urgent count
     */
    getUrgentCount(): number {
        return this.urgentCountSubject.getValue();
    }

    /**
     * Check if there are critical (overdue) alerts
     */
    hasCriticalAlerts(): boolean {
        return this.alertsSubject.getValue().some(a => a.employee.isOverdue);
    }

    /**
     * Update alert threshold
     */
    updateThreshold(days: number): void {
        this.config.alertThresholdDays = days;
        this.saveConfig();
        this.loadRecyclageAlerts(); // Reload with new threshold
    }

    /**
     * Get current threshold
     */
    getThreshold(): number {
        return this.config.alertThresholdDays;
    }

    /**
     * Load configuration from localStorage
     */
    private loadConfig(): void {
        try {
            const saved = localStorage.getItem(this.CONFIG_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.config = { ...this.config, ...parsed };
            }
        } catch (error) {
            console.warn('Erreur lors du chargement de la configuration recyclage:', error);
        }
    }

    /**
     * Save configuration to localStorage
     */
    private saveConfig(): void {
        try {
            localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
        } catch (error) {
            console.warn('Erreur lors de la sauvegarde de la configuration recyclage:', error);
        }
    }

    /**
     * Force refresh alerts
     */
    refresh(): void {
        this.loadRecyclageAlerts();
    }
}
