/**
 * DMS-Analytics KPI Service
 * Domain: Analytics & Reporting
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    KPI,
    KPIIndicator,
    MonthlyKPIInput,
    ActionPlan,
    KPIDashboard,
    KPITrend
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class DmsKpiService {
    private readonly endpoint = 'analytics';

    constructor(private api: ApiService) {}

    // ==================== KPIs ====================
    getKPIs(params?: {
        departmentId?: number;
        category?: string;
    }): Observable<KPI[]> {
        return this.api.get<KPI[]>(`${this.endpoint}/kpis`, params);
    }

    // ==================== INDICATORS ====================
    getIndicators(params?: {
        category?: string;
        departmentId?: number;
        frequency?: string;
    }): Observable<KPIIndicator[]> {
        return this.api.get<KPIIndicator[]>(`${this.endpoint}/indicators`, params);
    }

    getIndicator(id: number): Observable<KPIIndicator> {
        return this.api.get<KPIIndicator>(`${this.endpoint}/indicators/${id}`);
    }

    createIndicator(indicator: Partial<KPIIndicator>): Observable<KPIIndicator> {
        return this.api.post<KPIIndicator>(`${this.endpoint}/indicators`, indicator);
    }

    updateIndicator(id: number, indicator: Partial<KPIIndicator>): Observable<KPIIndicator> {
        return this.api.put<KPIIndicator>(`${this.endpoint}/indicators/${id}`, indicator);
    }

    deleteIndicator(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/indicators/${id}`);
    }

    // ==================== MONTHLY INPUTS ====================
    getMonthlyInputs(params?: {
        indicatorId?: number;
        startMonth?: string;
        endMonth?: string;
    }): Observable<MonthlyKPIInput[]> {
        return this.api.get<MonthlyKPIInput[]>(`${this.endpoint}/monthly-inputs`, params);
    }

    getMonthlyInput(id: number): Observable<MonthlyKPIInput> {
        return this.api.get<MonthlyKPIInput>(`${this.endpoint}/monthly-inputs/${id}`);
    }

    createMonthlyInput(input: Partial<MonthlyKPIInput>): Observable<MonthlyKPIInput> {
        return this.api.post<MonthlyKPIInput>(`${this.endpoint}/monthly-inputs`, input);
    }

    updateMonthlyInput(id: number, input: Partial<MonthlyKPIInput>): Observable<MonthlyKPIInput> {
        return this.api.put<MonthlyKPIInput>(`${this.endpoint}/monthly-inputs/${id}`, input);
    }

    // ==================== ACTION PLANS ====================
    getActionPlans(params?: {
        indicatorId?: number;
        status?: string;
        responsibleId?: number;
    }): Observable<ActionPlan[]> {
        return this.api.get<ActionPlan[]>(`${this.endpoint}/action-plans`, params);
    }

    getActionPlan(id: number): Observable<ActionPlan> {
        return this.api.get<ActionPlan>(`${this.endpoint}/action-plans/${id}`);
    }

    createActionPlan(plan: Partial<ActionPlan>): Observable<ActionPlan> {
        return this.api.post<ActionPlan>(`${this.endpoint}/action-plans`, plan);
    }

    updateActionPlan(id: number, plan: Partial<ActionPlan>): Observable<ActionPlan> {
        return this.api.put<ActionPlan>(`${this.endpoint}/action-plans/${id}`, plan);
    }

    completeActionPlan(id: number): Observable<ActionPlan> {
        return this.api.post<ActionPlan>(`${this.endpoint}/action-plans/${id}/complete`, {});
    }

    // ==================== DASHBOARD ====================
    getDashboard(): Observable<KPIDashboard> {
        return this.api.get<KPIDashboard>(`${this.endpoint}/dashboard`);
    }

    // ==================== TRENDS ====================
    getTrends(params?: {
        indicatorIds?: number[];
        startDate?: string;
        endDate?: string;
    }): Observable<KPITrend[]> {
        return this.api.get<KPITrend[]>(`${this.endpoint}/trends`, params);
    }

    getIndicatorTrend(indicatorId: number, months: number = 12): Observable<KPITrend> {
        return this.api.get<KPITrend>(`${this.endpoint}/indicators/${indicatorId}/trend`, { months });
    }
}
