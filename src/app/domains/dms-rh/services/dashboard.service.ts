/**
 * DMS-RH Dashboard Service
 * Domain: Human Resources Management
 *
 * Uses the existing 'employees' endpoint from the backend API
 */
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import { HRDashboardStats, HRKpi, HRAlert, HRQuickStats } from '../models';

@Injectable({
    providedIn: 'root'
})
export class DmsRhDashboardService {
    // Use 'employees' endpoint to match existing backend API
    private readonly endpoint = 'employees';

    constructor(private api: ApiService) {}

    // ==================== DASHBOARD ====================
    getDashboardStats(): Observable<HRDashboardStats> {
        return this.api.get<HRDashboardStats>(`${this.endpoint}/dashboard-stats`).pipe(
            catchError(err => {
                console.warn('HR Dashboard stats API not available, using empty data');
                return of(this.getEmptyStats());
            })
        );
    }

    getQuickStats(): Observable<HRQuickStats> {
        return this.api.get<HRQuickStats>(`${this.endpoint}/quick-stats`).pipe(
            catchError(err => {
                console.warn('HR Quick stats API not available');
                return of({
                    presentToday: 0,
                    absentToday: 0,
                    onLeave: 0,
                    pendingFormations: 0,
                    expiringLicenses: 0,
                    recyclageRequired: 0
                });
            })
        );
    }

    getKpis(): Observable<HRKpi[]> {
        return this.api.get<HRKpi[]>(`${this.endpoint}/kpis`).pipe(
            catchError(err => {
                console.warn('HR KPIs API not available');
                return of([]);
            })
        );
    }

    // ==================== ALERTS ====================
    getAlerts(params?: {
        type?: string;
        severity?: string;
        isRead?: boolean;
    }): Observable<HRAlert[]> {
        return this.api.get<HRAlert[]>(`${this.endpoint}/alerts`, params).pipe(
            catchError(err => {
                console.warn('HR Alerts API not available');
                return of([]);
            })
        );
    }

    markAlertRead(id: number): Observable<HRAlert> {
        return this.api.put<HRAlert>(`${this.endpoint}/alerts/${id}`, { isRead: true });
    }

    dismissAlert(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/alerts/${id}`);
    }

    private getEmptyStats(): HRDashboardStats {
        return {
            totalEmployees: 0,
            activeEmployees: 0,
            inactiveEmployees: 0,
            employeesByDepartment: [],
            employeesByCategory: [],
            recentHires: [],
            employeesRequiringRecyclage: 0,
            qualificationCompletionRate: 0,
            averageVersatility: 0
        };
    }
}
