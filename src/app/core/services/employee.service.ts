import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
    Employee,
    HRProcess,
    Formation,
    Qualification,
    Attendance
} from '../models/employee.model';

@Injectable({
    providedIn: 'root'
})
export class EmployeeService {
    private readonly endpoint = 'employees';

    constructor(private api: ApiService) {}

    // Employees
    getEmployees(params?: {
        department?: string;
        category?: string;
        status?: string
    }): Observable<Employee[]> {
        return this.api.get<Employee[]>(this.endpoint, params);
    }

    getEmployee(id: number): Observable<Employee> {
        return this.api.get<Employee>(`${this.endpoint}/${id}`);
    }

    getEmployeeByBadge(badgeId: string): Observable<Employee> {
        // Trim whitespace from badge ID (common issue with barcode scanners)
        const cleanBadgeId = badgeId?.trim() || '';
        return this.api.get<Employee>(`${this.endpoint}/by_badge`, { badge: cleanBadgeId });
    }

    createEmployee(employee: Partial<Employee>): Observable<Employee> {
        return this.api.post<Employee>(this.endpoint, employee);
    }

    updateEmployee(id: number, employee: Partial<Employee>): Observable<Employee> {
        return this.api.put<Employee>(`${this.endpoint}/${id}`, employee);
    }

    deleteEmployee(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/${id}`);
    }

    // Processes
    getProcesses(): Observable<HRProcess[]> {
        return this.api.get<HRProcess[]>(`${this.endpoint}/processes`);
    }

    // Formations
    getFormations(processId?: number): Observable<Formation[]> {
        const params = processId ? { processId } : undefined;
        return this.api.get<Formation[]>(`${this.endpoint}/formations`, params);
    }

    getFormation(id: number): Observable<Formation> {
        return this.api.get<Formation>(`${this.endpoint}/formations/${id}`);
    }

    createFormation(formation: Partial<Formation>): Observable<Formation> {
        return this.api.post<Formation>(`${this.endpoint}/formations`, formation);
    }

    // Qualifications
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

    // Attendance
    getAttendance(params?: {
        date?: string;
        shift?: string;
        employeeId?: number
    }): Observable<Attendance[]> {
        return this.api.get<Attendance[]>(`${this.endpoint}/attendance`, params);
    }

    createAttendance(attendance: Partial<Attendance>): Observable<Attendance> {
        return this.api.post<Attendance>(`${this.endpoint}/attendance`, attendance);
    }

    updateAttendance(id: number, attendance: Partial<Attendance>): Observable<Attendance> {
        return this.api.put<Attendance>(`${this.endpoint}/attendance/${id}`, attendance);
    }
}
