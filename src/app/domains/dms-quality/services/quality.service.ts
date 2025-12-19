/**
 * DMS-Quality Service
 * Domain: Quality Control Management
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    QualityDefect,
    DefectType,
    DefectCategory,
    DefectCreatePayload,
    QualityInspection,
    QualityStats,
    QualityAlert
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class DmsQualityService {
    private readonly endpoint = 'quality';

    constructor(private api: ApiService) {}

    // ==================== DEFECTS ====================
    getDefects(params?: {
        hourlyProdId?: number;
        defectTypeId?: number;
        startDate?: string;
        endDate?: string;
    }): Observable<QualityDefect[]> {
        return this.api.get<QualityDefect[]>(`${this.endpoint}/defects`, params);
    }

    getDefect(id: number): Observable<QualityDefect> {
        return this.api.get<QualityDefect>(`${this.endpoint}/defects/${id}`);
    }

    createDefect(defect: DefectCreatePayload): Observable<QualityDefect> {
        return this.api.post<QualityDefect>(`${this.endpoint}/defects`, defect);
    }

    updateDefect(id: number, defect: Partial<QualityDefect>): Observable<QualityDefect> {
        return this.api.put<QualityDefect>(`${this.endpoint}/defects/${id}`, defect);
    }

    deleteDefect(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/defects/${id}`);
    }

    // ==================== DEFECT TYPES ====================
    getDefectTypes(categoryId?: number): Observable<DefectType[]> {
        const params = categoryId ? { category: categoryId } : undefined;
        return this.api.get<DefectType[]>(`${this.endpoint}/defect-types`, params);
    }

    getDefectType(id: number): Observable<DefectType> {
        return this.api.get<DefectType>(`${this.endpoint}/defect-types/${id}`);
    }

    createDefectType(defectType: Partial<DefectType>): Observable<DefectType> {
        return this.api.post<DefectType>(`${this.endpoint}/defect-types`, defectType);
    }

    updateDefectType(id: number, defectType: Partial<DefectType>): Observable<DefectType> {
        return this.api.put<DefectType>(`${this.endpoint}/defect-types/${id}`, defectType);
    }

    deleteDefectType(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/defect-types/${id}`);
    }

    // ==================== DEFECT CATEGORIES ====================
    getDefectCategories(): Observable<DefectCategory[]> {
        return this.api.get<DefectCategory[]>(`${this.endpoint}/defect-categories`);
    }

    getDefectCategory(id: number): Observable<DefectCategory> {
        return this.api.get<DefectCategory>(`${this.endpoint}/defect-categories/${id}`);
    }

    createDefectCategory(category: Partial<DefectCategory>): Observable<DefectCategory> {
        return this.api.post<DefectCategory>(`${this.endpoint}/defect-categories`, category);
    }

    updateDefectCategory(id: number, category: Partial<DefectCategory>): Observable<DefectCategory> {
        return this.api.put<DefectCategory>(`${this.endpoint}/defect-categories/${id}`, category);
    }

    // ==================== INSPECTIONS ====================
    getInspections(params?: {
        partId?: number;
        productionLineId?: number;
        startDate?: string;
        endDate?: string;
    }): Observable<QualityInspection[]> {
        return this.api.get<QualityInspection[]>(`${this.endpoint}/inspections`, params);
    }

    getInspection(id: number): Observable<QualityInspection> {
        return this.api.get<QualityInspection>(`${this.endpoint}/inspections/${id}`);
    }

    createInspection(inspection: Partial<QualityInspection>): Observable<QualityInspection> {
        return this.api.post<QualityInspection>(`${this.endpoint}/inspections`, inspection);
    }

    updateInspection(id: number, inspection: Partial<QualityInspection>): Observable<QualityInspection> {
        return this.api.put<QualityInspection>(`${this.endpoint}/inspections/${id}`, inspection);
    }

    // ==================== STATS & DASHBOARD ====================
    getQualityStats(params?: {
        startDate?: string;
        endDate?: string;
        productionLineId?: number;
    }): Observable<QualityStats> {
        return this.api.get<QualityStats>(`${this.endpoint}/stats`, params);
    }

    getAlerts(): Observable<QualityAlert[]> {
        return this.api.get<QualityAlert[]>(`${this.endpoint}/alerts`);
    }

    acknowledgeAlert(id: number): Observable<QualityAlert> {
        return this.api.put<QualityAlert>(`${this.endpoint}/alerts/${id}`, { isAcknowledged: true });
    }
}
