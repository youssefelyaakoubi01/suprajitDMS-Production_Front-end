/**
 * DMS-RH Formation Service
 * Domain: Human Resources Management
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    Formation,
    FormationPlan,
    Formateur,
    TrainerSpecialization,
    FormationStats
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class DmsFormationService {
    private readonly endpoint = 'employees';

    constructor(private api: ApiService) {}

    // ==================== FORMATIONS ====================
    getFormations(params?: {
        type?: string;
        processId?: number;
        isActive?: boolean;
    }): Observable<Formation[]> {
        return this.api.get<Formation[]>(`${this.endpoint}/formations`, params);
    }

    getFormation(id: number): Observable<Formation> {
        return this.api.get<Formation>(`${this.endpoint}/formations/${id}`);
    }

    createFormation(formation: Partial<Formation>): Observable<Formation> {
        return this.api.post<Formation>(`${this.endpoint}/formations`, formation);
    }

    updateFormation(id: number, formation: Partial<Formation>): Observable<Formation> {
        return this.api.put<Formation>(`${this.endpoint}/formations/${id}`, formation);
    }

    deleteFormation(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/formations/${id}`);
    }

    // ==================== FORMATION PLANS ====================
    getFormationPlans(params?: {
        employeeId?: number;
        formationId?: number;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Observable<FormationPlan[]> {
        return this.api.get<FormationPlan[]>(`${this.endpoint}/formation-plans`, params);
    }

    getFormationPlan(id: number): Observable<FormationPlan> {
        return this.api.get<FormationPlan>(`${this.endpoint}/formation-plans/${id}`);
    }

    createFormationPlan(plan: Partial<FormationPlan>): Observable<FormationPlan> {
        return this.api.post<FormationPlan>(`${this.endpoint}/formation-plans`, plan);
    }

    updateFormationPlan(id: number, plan: Partial<FormationPlan>): Observable<FormationPlan> {
        return this.api.put<FormationPlan>(`${this.endpoint}/formation-plans/${id}`, plan);
    }

    deleteFormationPlan(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/formation-plans/${id}`);
    }

    // ==================== FORMATEURS ====================
    getFormateurs(params?: {
        isActive?: boolean;
        specialization?: string;
    }): Observable<Formateur[]> {
        return this.api.get<Formateur[]>(`${this.endpoint}/formateurs`, params);
    }

    getFormateur(id: number): Observable<Formateur> {
        return this.api.get<Formateur>(`${this.endpoint}/formateurs/${id}`);
    }

    createFormateur(formateur: Partial<Formateur>): Observable<Formateur> {
        return this.api.post<Formateur>(`${this.endpoint}/formateurs`, formateur);
    }

    updateFormateur(id: number, formateur: Partial<Formateur>): Observable<Formateur> {
        return this.api.put<Formateur>(`${this.endpoint}/formateurs/${id}`, formateur);
    }

    deleteFormateur(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/formateurs/${id}`);
    }

    // ==================== TRAINER SPECIALIZATIONS ====================
    getTrainerSpecializations(): Observable<TrainerSpecialization[]> {
        return this.api.get<TrainerSpecialization[]>(`${this.endpoint}/specializations`);
    }

    getTrainerSpecialization(id: number): Observable<TrainerSpecialization> {
        return this.api.get<TrainerSpecialization>(`${this.endpoint}/specializations/${id}`);
    }

    createTrainerSpecialization(specialization: Partial<TrainerSpecialization>): Observable<TrainerSpecialization> {
        return this.api.post<TrainerSpecialization>(`${this.endpoint}/specializations`, specialization);
    }

    updateTrainerSpecialization(id: number, specialization: Partial<TrainerSpecialization>): Observable<TrainerSpecialization> {
        return this.api.put<TrainerSpecialization>(`${this.endpoint}/specializations/${id}`, specialization);
    }

    deleteTrainerSpecialization(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/specializations/${id}`);
    }

    // ==================== STATS ====================
    getFormationStats(): Observable<FormationStats> {
        return this.api.get<FormationStats>(`${this.endpoint}/formations/stats`);
    }
}
