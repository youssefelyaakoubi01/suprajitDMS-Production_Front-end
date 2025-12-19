/**
 * DMS-RH Qualification Service
 * Domain: Human Resources Management
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    Qualification,
    VersatilityMatrix,
    VersatilityCell,
    RecyclageEmployee,
    RecyclageNotification,
    HRWorkstation,
    HRProcess
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class DmsQualificationService {
    private readonly endpoint = 'hr';

    constructor(private api: ApiService) {}

    // ==================== QUALIFICATIONS ====================
    getQualifications(params?: {
        employeeId?: number;
        formationId?: number;
        projectId?: number;
    }): Observable<Qualification[]> {
        return this.api.get<Qualification[]>(`${this.endpoint}/qualifications`, params);
    }

    getQualification(id: number): Observable<Qualification> {
        return this.api.get<Qualification>(`${this.endpoint}/qualifications/${id}`);
    }

    createQualification(qualification: Partial<Qualification>): Observable<Qualification> {
        return this.api.post<Qualification>(`${this.endpoint}/qualifications`, qualification);
    }

    updateQualification(id: number, qualification: Partial<Qualification>): Observable<Qualification> {
        return this.api.put<Qualification>(`${this.endpoint}/qualifications/${id}`, qualification);
    }

    deleteQualification(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/qualifications/${id}`);
    }

    // ==================== VERSATILITY MATRIX ====================
    getVersatilityMatrix(params?: {
        productionLineId?: number;
        processId?: number;
        teamId?: number;
    }): Observable<VersatilityMatrix> {
        return this.api.get<VersatilityMatrix>(`${this.endpoint}/versatility/matrix`, params);
    }

    updateVersatilityCell(cell: VersatilityCell): Observable<VersatilityCell> {
        return this.api.post<VersatilityCell>(`${this.endpoint}/versatility/cell`, cell);
    }

    // ==================== HR WORKSTATIONS ====================
    getHRWorkstations(params?: {
        processId?: number;
        productionLineId?: number;
    }): Observable<HRWorkstation[]> {
        return this.api.get<HRWorkstation[]>(`${this.endpoint}/workstations`, params);
    }

    getHRWorkstation(id: number): Observable<HRWorkstation> {
        return this.api.get<HRWorkstation>(`${this.endpoint}/workstations/${id}`);
    }

    createHRWorkstation(workstation: Partial<HRWorkstation>): Observable<HRWorkstation> {
        return this.api.post<HRWorkstation>(`${this.endpoint}/workstations`, workstation);
    }

    updateHRWorkstation(id: number, workstation: Partial<HRWorkstation>): Observable<HRWorkstation> {
        return this.api.put<HRWorkstation>(`${this.endpoint}/workstations/${id}`, workstation);
    }

    deleteHRWorkstation(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/workstations/${id}`);
    }

    // ==================== PROCESSES ====================
    getProcesses(): Observable<HRProcess[]> {
        return this.api.get<HRProcess[]>(`${this.endpoint}/processes`);
    }

    getProcess(id: number): Observable<HRProcess> {
        return this.api.get<HRProcess>(`${this.endpoint}/processes/${id}`);
    }

    createProcess(process: Partial<HRProcess>): Observable<HRProcess> {
        return this.api.post<HRProcess>(`${this.endpoint}/processes`, process);
    }

    updateProcess(id: number, process: Partial<HRProcess>): Observable<HRProcess> {
        return this.api.put<HRProcess>(`${this.endpoint}/processes/${id}`, process);
    }

    // ==================== RECYCLAGE ====================
    getRecyclageEmployees(params?: {
        daysThreshold?: number;
        includeOverdue?: boolean;
    }): Observable<RecyclageEmployee[]> {
        return this.api.get<RecyclageEmployee[]>(`${this.endpoint}/recyclage/employees`, params);
    }

    getRecyclageNotifications(params?: {
        isRead?: boolean;
    }): Observable<RecyclageNotification[]> {
        return this.api.get<RecyclageNotification[]>(`${this.endpoint}/recyclage/notifications`, params);
    }

    markNotificationRead(id: number): Observable<RecyclageNotification> {
        return this.api.put<RecyclageNotification>(`${this.endpoint}/recyclage/notifications/${id}`, { isRead: true });
    }
}
