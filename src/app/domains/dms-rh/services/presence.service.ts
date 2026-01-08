/**
 * DMS-RH Presence Service
 * Domain: Human Resources Management
 *
 * Handles working hours and presence tracking.
 * Data is automatically synced from DMS-Production TeamAssignment via Django signals.
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import {
    EmployeeWorkingHour,
    PresenceSummary,
    PresenceFilter,
    WorkingHourUpdate,
    BulkApproveRequest,
    BulkApproveResponse,
    PresenceStats
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class DmsPresenceService {
    private readonly endpoint = 'employees/working-hours';

    constructor(private api: ApiService) {}

    // ==================== WORKING HOURS ====================

    /**
     * Get list of working hours with optional filters.
     */
    getWorkingHours(filters?: PresenceFilter): Observable<EmployeeWorkingHour[]> {
        return this.api.get<{ count: number; results: EmployeeWorkingHour[] } | EmployeeWorkingHour[]>(
            this.endpoint,
            filters as Record<string, unknown>
        ).pipe(
            map(response => Array.isArray(response) ? response : response.results || [])
        );
    }

    /**
     * Get working hours with server-side pagination.
     */
    getWorkingHoursPaginated(params: {
        page?: number;
        page_size?: number;
        ordering?: string;
    } & PresenceFilter): Observable<{ count: number; results: EmployeeWorkingHour[] }> {
        return this.api.get<{ count: number; results: EmployeeWorkingHour[] }>(
            this.endpoint,
            params as Record<string, unknown>
        );
    }

    /**
     * Get a single working hour record by ID.
     */
    getWorkingHour(id: number): Observable<EmployeeWorkingHour> {
        return this.api.get<EmployeeWorkingHour>(`${this.endpoint}/${id}`);
    }

    /**
     * Update a working hour record (manual correction).
     * This will automatically set source='manual' on the backend.
     */
    updateWorkingHour(id: number, data: WorkingHourUpdate): Observable<EmployeeWorkingHour> {
        return this.api.patch<EmployeeWorkingHour>(`${this.endpoint}/${id}`, data);
    }

    // ==================== SUMMARIES ====================

    /**
     * Get aggregated presence summary by employee/date.
     * Used for the main presence list view.
     */
    getPresenceSummary(filters?: PresenceFilter): Observable<PresenceSummary[]> {
        return this.api.get<PresenceSummary[]>(
            `${this.endpoint}/summary`,
            filters as Record<string, unknown>
        );
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Bulk approve multiple working hour records.
     */
    bulkApprove(ids: number[]): Observable<BulkApproveResponse> {
        return this.api.post<BulkApproveResponse>(
            `${this.endpoint}/bulk-approve`,
            { ids } as BulkApproveRequest
        );
    }

    // ==================== STATISTICS ====================

    /**
     * Get presence statistics for dashboard.
     * Returns counts and totals for the specified date (or today).
     */
    getPresenceStats(date?: string): Observable<PresenceStats> {
        const params = date ? { date } : {};
        return this.api.get<PresenceStats>(`${this.endpoint}/stats`, params);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Get working hours for a specific employee.
     */
    getEmployeeWorkingHours(employeeId: number, filters?: Omit<PresenceFilter, 'employee'>): Observable<EmployeeWorkingHour[]> {
        return this.getWorkingHours({ ...filters, employee: employeeId });
    }

    /**
     * Get working hours for a specific date.
     */
    getWorkingHoursByDate(date: string, filters?: Omit<PresenceFilter, 'date'>): Observable<EmployeeWorkingHour[]> {
        return this.getWorkingHours({ ...filters, date });
    }

    /**
     * Get working hours for a date range.
     */
    getWorkingHoursByDateRange(dateFrom: string, dateTo: string, filters?: Omit<PresenceFilter, 'date_from' | 'date_to'>): Observable<EmployeeWorkingHour[]> {
        return this.getWorkingHours({ ...filters, date_from: dateFrom, date_to: dateTo });
    }

    /**
     * Approve a single working hour record.
     */
    approveWorkingHour(id: number, reason?: string): Observable<EmployeeWorkingHour> {
        return this.updateWorkingHour(id, {
            status: 'approved',
            modification_reason: reason || 'Approved'
        });
    }

    /**
     * Reject a single working hour record.
     */
    rejectWorkingHour(id: number, reason: string): Observable<EmployeeWorkingHour> {
        return this.updateWorkingHour(id, {
            status: 'rejected',
            modification_reason: reason
        });
    }

    /**
     * Confirm a single working hour record.
     */
    confirmWorkingHour(id: number): Observable<EmployeeWorkingHour> {
        return this.updateWorkingHour(id, {
            status: 'confirmed',
            modification_reason: 'Confirmed'
        });
    }
}
