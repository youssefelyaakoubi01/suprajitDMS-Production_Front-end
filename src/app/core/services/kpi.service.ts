import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface KPICategory {
    CategoryID: number;
    CategoryName: string;
    Description?: string;
    Color?: string;
}

export interface KPIIndicator {
    IndicatorID: number;
    IndicatorName: string;
    CategoryID: number;
    Unit: string;
    TargetValue: number;
    Description?: string;
    Formula?: string;
}

export interface MonthlyKPIData {
    DataID: number;
    IndicatorID: number;
    Month: string;
    ActualValue: number;
    TargetValue: number;
    Variance: number;
    Status: string;
    Comments?: string;
}

export interface ActionPlan {
    ActionID: number;
    IndicatorID?: number;
    ActionTitle: string;
    Description: string;
    Owner: string;
    StartDate: string;
    DueDate: string;
    Status: string;
    Priority: string;
    Progress: number;
}

@Injectable({
    providedIn: 'root'
})
export class KPIService {
    private readonly endpoint = 'kpi';

    constructor(private api: ApiService) {}

    // KPI Categories
    getCategories(): Observable<KPICategory[]> {
        return this.api.get<KPICategory[]>(`${this.endpoint}/categories`);
    }

    // KPI Indicators
    getIndicators(categoryId?: number): Observable<KPIIndicator[]> {
        const params = categoryId ? { categoryId } : undefined;
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

    // Monthly KPI Data
    getMonthlyData(params?: {
        indicatorId?: number;
        month?: string;
        year?: number
    }): Observable<MonthlyKPIData[]> {
        return this.api.get<MonthlyKPIData[]>(`${this.endpoint}/monthly-data`, params);
    }

    getMonthlyDataItem(id: number): Observable<MonthlyKPIData> {
        return this.api.get<MonthlyKPIData>(`${this.endpoint}/monthly-data/${id}`);
    }

    createMonthlyData(data: Partial<MonthlyKPIData>): Observable<MonthlyKPIData> {
        return this.api.post<MonthlyKPIData>(`${this.endpoint}/monthly-data`, data);
    }

    updateMonthlyData(id: number, data: Partial<MonthlyKPIData>): Observable<MonthlyKPIData> {
        return this.api.put<MonthlyKPIData>(`${this.endpoint}/monthly-data/${id}`, data);
    }

    // Action Plans
    getActionPlans(params?: {
        indicatorId?: number;
        status?: string;
        owner?: string
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
}
