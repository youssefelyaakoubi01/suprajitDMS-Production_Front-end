/**
 * DMS-Production Downtime Service
 * Domain: Production Management
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    Downtime,
    DowntimeProblem,
    DowntimeCategory,
    DowntimeAnalysis,
    DowntimeByHour,
    DowntimeCreatePayload,
    DowntimeUpdatePayload
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class DmsDowntimeService {
    private readonly endpoint = 'production';

    constructor(private api: ApiService) {}

    // ==================== DOWNTIMES ====================
    getDowntimes(hourlyProdId?: number): Observable<Downtime[]> {
        const params = hourlyProdId ? { hourly_production: hourlyProdId } : undefined;
        return this.api.get<Downtime[]>(`${this.endpoint}/downtimes`, params);
    }

    getDowntime(id: number): Observable<Downtime> {
        return this.api.get<Downtime>(`${this.endpoint}/downtimes/${id}`);
    }

    createDowntime(downtime: DowntimeCreatePayload): Observable<Downtime> {
        return this.api.post<Downtime>(`${this.endpoint}/downtimes`, downtime);
    }

    updateDowntime(id: number, downtime: Partial<DowntimeUpdatePayload>): Observable<Downtime> {
        return this.api.patch<Downtime>(`${this.endpoint}/downtimes/${id}`, downtime);
    }

    deleteDowntime(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/downtimes/${id}`);
    }

    // ==================== DOWNTIME PROBLEMS ====================
    getDowntimeProblems(): Observable<DowntimeProblem[]> {
        return this.api.get<DowntimeProblem[]>(`${this.endpoint}/downtime-problems`);
    }

    getDowntimeProblem(id: number): Observable<DowntimeProblem> {
        return this.api.get<DowntimeProblem>(`${this.endpoint}/downtime-problems/${id}`);
    }

    createDowntimeProblem(problem: Partial<DowntimeProblem>): Observable<DowntimeProblem> {
        return this.api.post<DowntimeProblem>(`${this.endpoint}/downtime-problems`, problem);
    }

    updateDowntimeProblem(id: number, problem: Partial<DowntimeProblem>): Observable<DowntimeProblem> {
        return this.api.put<DowntimeProblem>(`${this.endpoint}/downtime-problems/${id}`, problem);
    }

    // ==================== DOWNTIME CATEGORIES ====================
    getDowntimeCategories(): Observable<DowntimeCategory[]> {
        return this.api.get<DowntimeCategory[]>(`${this.endpoint}/downtime-categories`);
    }

    // ==================== ANALYSIS ====================
    getDowntimeAnalysis(params?: {
        startDate?: string;
        endDate?: string;
        lineId?: number;
        shift?: string;
    }): Observable<DowntimeAnalysis[]> {
        return this.api.get<DowntimeAnalysis[]>(`${this.endpoint}/downtimes/analysis`, params);
    }

    getDowntimeByHour(params?: {
        date?: string;
        lineId?: number;
        shift?: string;
    }): Observable<DowntimeByHour[]> {
        return this.api.get<DowntimeByHour[]>(`${this.endpoint}/downtimes/by-hour`, params);
    }
}
