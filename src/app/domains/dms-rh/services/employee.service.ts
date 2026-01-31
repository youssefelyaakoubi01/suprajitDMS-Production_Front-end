/**
 * DMS-RH Employee Service
 * Domain: Human Resources Management
 */
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import {
    Employee,
    EmployeeCategory,
    EmployeeDetail,
    EmployeeWithAssignment,
    Department,
    Attendance,
    Departement
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
        return this.api.get<{ count: number; results: Employee[] } | Employee[]>(this.endpoint, params).pipe(
            map(response => {
                // Handle both paginated and array responses for backward compatibility
                return Array.isArray(response) ? response : response.results || [];
            })
        );
    }

    /**
     * Get employees with server-side pagination
     */
    getEmployeesPaginated(params: {
        page?: number;
        page_size?: number;
        search?: string;
        department?: string;
        status?: string;
        ordering?: string;
    }): Observable<{ count: number; results: Employee[] }> {
        return this.api.get<{ count: number; results: Employee[] }>(this.endpoint, params);
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

    /**
     * Create an employee with photo upload
     * Creates employee first, then uploads photo separately
     */
    createEmployeeWithPhoto(employee: Partial<Employee>, photo: File): Observable<Employee> {
        return this.createEmployee(employee).pipe(
            switchMap((createdEmployee: Employee) => {
                // After creating employee, upload the photo
                const empId = createdEmployee.Id_Emp || (createdEmployee as unknown as { id: number }).id;
                return this.uploadPhoto(empId, photo);
            })
        );
    }

    updateEmployee(id: number, employee: Partial<Employee>): Observable<Employee> {
        return this.api.put<Employee>(`${this.endpoint}/${id}`, employee);
    }

    /**
     * Update an employee with photo upload
     * Updates employee first, then uploads photo separately
     */
    updateEmployeeWithPhoto(id: number, employee: Partial<Employee>, photo: File | null): Observable<Employee> {
        return this.updateEmployee(id, employee).pipe(
            switchMap((updatedEmployee: Employee) => {
                if (photo) {
                    // After updating employee, upload the new photo
                    return this.uploadPhoto(id, photo);
                }
                return of(updatedEmployee);
            })
        );
    }

    /**
     * Upload employee photo using dedicated endpoint
     */
    private uploadPhoto(employeeId: number, photo: File): Observable<Employee> {
        const formData = new FormData();
        formData.append('picture', photo, photo.name);
        return this.api.post<Employee>(`${this.endpoint}/${employeeId}/upload-photo`, formData);
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

    deleteEmployeeCategory(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/categories/${id}`);
    }

    // ==================== DEPARTMENTS (Legacy) ====================
    getDepartments(): Observable<Department[]> {
        return this.api.get<Department[]>(`${this.endpoint}/departments`);
    }

    // ==================== DEPARTEMENTS (CRUD) ====================
    getDepartements(): Observable<Departement[]> {
        return this.api.get<Departement[]>(`${this.endpoint}/department-mgmt`);
    }

    getDepartement(id: number): Observable<Departement> {
        return this.api.get<Departement>(`${this.endpoint}/department-mgmt/${id}`);
    }

    createDepartement(departement: Partial<Departement>): Observable<Departement> {
        return this.api.post<Departement>(`${this.endpoint}/department-mgmt`, departement);
    }

    updateDepartement(id: number, departement: Partial<Departement>): Observable<Departement> {
        return this.api.put<Departement>(`${this.endpoint}/department-mgmt/${id}`, departement);
    }

    deleteDepartement(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/department-mgmt/${id}`);
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

    // ==================== IMPORT/EXPORT ====================
    importEmployees(file: File): Observable<{ imported: number; updated: number; skipped: number; errors: string[]; success: boolean }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.api.post<{ imported: number; updated: number; skipped: number; errors: string[]; success: boolean }>(`${this.endpoint}/import`, formData);
    }
}
