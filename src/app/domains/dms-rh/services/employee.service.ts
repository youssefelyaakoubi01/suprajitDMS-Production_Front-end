/**
 * DMS-RH Employee Service
 * Domain: Human Resources Management
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    Employee,
    EmployeeCategory,
    EmployeeDetail,
    EmployeeWithAssignment,
    Department,
    Attendance
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class DmsEmployeeService {
    private readonly endpoint = 'employees';

    constructor(private api: ApiService) {}

    // ==================== EMPLOYEES ====================
    getEmployees(params?: {
        department?: string;
        status?: string;
        team?: number;
        search?: string;
    }): Observable<Employee[]> {
        return this.api.get<Employee[]>(this.endpoint, params);
    }

    getEmployee(id: number): Observable<Employee> {
        return this.api.get<Employee>(`${this.endpoint}/${id}`);
    }

    getEmployeeDetail(id: number): Observable<EmployeeDetail> {
        return this.api.get<EmployeeDetail>(`${this.endpoint}/${id}/detail`);
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

    uploadEmployeePhoto(id: number, photo: File): Observable<Employee> {
        const formData = new FormData();
        formData.append('photo', photo);
        return this.api.post<Employee>(`${this.endpoint}/${id}/photo`, formData);
    }

    // ==================== EMPLOYEE CATEGORIES ====================
    getEmployeeCategories(): Observable<EmployeeCategory[]> {
        return this.api.get<EmployeeCategory[]>(`${this.endpoint}/categories`);
    }

    getEmployeeCategory(id: number): Observable<EmployeeCategory> {
        return this.api.get<EmployeeCategory>(`${this.endpoint}/categories/${id}`);
    }

    createEmployeeCategory(category: Partial<EmployeeCategory>): Observable<EmployeeCategory> {
        return this.api.post<EmployeeCategory>(`${this.endpoint}/categories`, category);
    }

    updateEmployeeCategory(id: number, category: Partial<EmployeeCategory>): Observable<EmployeeCategory> {
        return this.api.put<EmployeeCategory>(`${this.endpoint}/categories/${id}`, category);
    }

    // ==================== DEPARTMENTS ====================
    getDepartments(): Observable<Department[]> {
        return this.api.get<Department[]>(`${this.endpoint}/departments`);
    }

    // ==================== ATTENDANCE ====================
    getAttendance(params?: {
        employeeId?: number;
        date?: string;
        startDate?: string;
        endDate?: string;
        shift?: string;
    }): Observable<Attendance[]> {
        return this.api.get<Attendance[]>(`${this.endpoint}/attendance`, params);
    }

    recordAttendance(attendance: Partial<Attendance>): Observable<Attendance> {
        return this.api.post<Attendance>(`${this.endpoint}/attendance`, attendance);
    }

    updateAttendance(id: number, attendance: Partial<Attendance>): Observable<Attendance> {
        return this.api.put<Attendance>(`${this.endpoint}/attendance/${id}`, attendance);
    }

    // ==================== SEARCH ====================
    searchEmployees(query: string): Observable<Employee[]> {
        return this.api.get<Employee[]>(`${this.endpoint}/search`, { q: query });
    }

    getEmployeesByBadge(badgeNumber: string): Observable<Employee> {
        return this.api.get<Employee>(`${this.endpoint}/by-badge`, { badge: badgeNumber });
    }
}
