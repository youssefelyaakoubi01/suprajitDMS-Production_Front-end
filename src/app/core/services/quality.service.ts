import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
    DefectCategory,
    DefectType,
    QualityDefect,
    QualityInspection
} from '../models/quality.model';

@Injectable({
    providedIn: 'root'
})
export class QualityService {
    private readonly endpoint = 'quality';

    constructor(private api: ApiService) {}

    // Defect Categories
    getDefectCategories(): Observable<DefectCategory[]> {
        return this.api.get<DefectCategory[]>(`${this.endpoint}/categories`);
    }

    // Defect Types
    getDefectTypes(categoryId?: number): Observable<DefectType[]> {
        const params = categoryId ? { categoryId } : undefined;
        return this.api.get<DefectType[]>(`${this.endpoint}/types`, params);
    }

    getDefectType(id: number): Observable<DefectType> {
        return this.api.get<DefectType>(`${this.endpoint}/types/${id}`);
    }

    createDefectType(defectType: Partial<DefectType>): Observable<DefectType> {
        return this.api.post<DefectType>(`${this.endpoint}/types`, defectType);
    }

    updateDefectType(id: number, defectType: Partial<DefectType>): Observable<DefectType> {
        return this.api.put<DefectType>(`${this.endpoint}/types/${id}`, defectType);
    }

    // Defects
    getDefects(params?: {
        date?: string;
        shift?: string;
        hourlyProdId?: number;
        defectTypeId?: number
    }): Observable<QualityDefect[]> {
        return this.api.get<QualityDefect[]>(`${this.endpoint}/defects`, params);
    }

    getDefect(id: number): Observable<QualityDefect> {
        return this.api.get<QualityDefect>(`${this.endpoint}/defects/${id}`);
    }

    createDefect(defect: Partial<QualityDefect>): Observable<QualityDefect> {
        return this.api.post<QualityDefect>(`${this.endpoint}/defects`, defect);
    }

    updateDefect(id: number, defect: Partial<QualityDefect>): Observable<QualityDefect> {
        return this.api.put<QualityDefect>(`${this.endpoint}/defects/${id}`, defect);
    }

    deleteDefect(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/defects/${id}`);
    }

    // Quality Inspections
    getInspections(params?: {
        date?: string;
        shift?: string;
        partId?: number;
        lineId?: number
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
}
