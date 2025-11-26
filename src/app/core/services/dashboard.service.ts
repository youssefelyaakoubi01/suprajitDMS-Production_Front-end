import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
    DashboardKPI,
    ProductionLineStatus,
    OutputPerHour,
    DowntimeAnalysis,
    DashboardSummary
} from '../models/dashboard.model';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private readonly endpoint = 'dashboard';

    constructor(private api: ApiService) {}

    getKPIs(params?: { date?: string; shift?: string }): Observable<DashboardKPI[]> {
        return this.api.get<DashboardKPI[]>(`${this.endpoint}/kpis`, params);
    }

    getProductionLines(params?: { date?: string; shift?: string }): Observable<ProductionLineStatus[]> {
        return this.api.get<ProductionLineStatus[]>(`${this.endpoint}/production-lines`, params);
    }

    getOutputPerHour(params?: { date?: string; shift?: string; projectId?: number }): Observable<OutputPerHour[]> {
        return this.api.get<OutputPerHour[]>(`${this.endpoint}/output-hour`, params);
    }

    getDowntimeAnalysis(params?: { date?: string; shift?: string; projectId?: number }): Observable<DowntimeAnalysis[]> {
        return this.api.get<DowntimeAnalysis[]>(`${this.endpoint}/downtime-analysis`, params);
    }

    getSummary(params?: { date?: string; shift?: string }): Observable<DashboardSummary> {
        return this.api.get<DashboardSummary>(`${this.endpoint}/summary`, params);
    }
}
