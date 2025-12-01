import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
    Employee,
    EmployeeCategory,
    Team,
    Trajet,
    TransportPlanning,
    Department,
    DMSUser,
    Qualification,
    VersatilityMatrix,
    Formation,
    FormationPlan,
    Formateur,
    HRProcess,
    HRWorkstation,
    RecyclageEmployee,
    RecyclageNotification,
    Attendance,
    HRDashboardStats,
    FormationStats,
    EmployeeDetail
} from '../models/employee.model';

@Injectable({
    providedIn: 'root'
})
export class HRService {
    private readonly endpoint = 'employees';

    // Cache subjects
    private employeesCache$ = new BehaviorSubject<Employee[]>([]);
    private teamsCache$ = new BehaviorSubject<Team[]>([]);
    private departmentsCache$ = new BehaviorSubject<Department[]>([]);

    constructor(private api: ApiService) { }

    // ==================== DASHBOARD ====================
    getDashboardStats(): Observable<HRDashboardStats> {
        return this.api.get<HRDashboardStats>(`${this.endpoint}/dashboard-stats`);
    }

    getFormationStats(): Observable<FormationStats> {
        return this.api.get<FormationStats>(`formations`);
    }

    // ==================== EMPLOYEES ====================
    getEmployees(params?: {
        department?: string;
        category?: string;
        status?: string;
        teamId?: number;
        search?: string;
    }): Observable<Employee[]> {
        return this.api.get<Employee[]>(`${this.endpoint}`, params).pipe(
            tap(employees => this.employeesCache$.next(employees))
        );
    }

    getEmployee(id: number): Observable<EmployeeDetail> {
        return this.api.get<EmployeeDetail>(`${this.endpoint}/${id}`);
    }

    getEmployeeByBadge(badgeId: string): Observable<Employee> {
        const cleanBadgeId = badgeId?.trim() || '';
        return this.api.get<Employee>(`${this.endpoint}/by_badge`, { badge: cleanBadgeId });
    }

    createEmployee(employee: Partial<Employee>): Observable<Employee> {
        return this.api.post<Employee>(`${this.endpoint}`, employee);
    }

    updateEmployee(id: number, employee: Partial<Employee>): Observable<Employee> {
        return this.api.put<Employee>(`${this.endpoint}/${id}`, employee);
    }

    // Methods with photo upload support (FormData)
    createEmployeeWithPhoto(formData: FormData): Observable<Employee> {
        return this.api.post<Employee>(`${this.endpoint}`, formData);
    }

    updateEmployeeWithPhoto(id: number, formData: FormData): Observable<Employee> {
        return this.api.patch<Employee>(`${this.endpoint}/${id}`, formData);
    }

    deleteEmployee(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/${id}`);
    }

    importEmployeesExcel(file: File): Observable<{ imported: number; errors: string[]; success: boolean }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.api.post<{ imported: number; errors: string[]; success: boolean }>(`${this.endpoint}/import`, formData);
    }

    exportEmployeesExcel(params?: { department?: string; status?: string }): Observable<Blob> {
        // Build the URL with query params for download
        let url = `${this.endpoint}/export`;
        const queryParams: string[] = [];
        if (params?.department) queryParams.push(`department=${encodeURIComponent(params.department)}`);
        if (params?.status) queryParams.push(`status=${encodeURIComponent(params.status)}`);
        if (queryParams.length) url += '?' + queryParams.join('&');
        return this.api.get<Blob>(url, { responseType: 'blob' });
    }

    syncEmployees(): Observable<{ synced: number; errors: string[] }> {
        return this.api.post<{ synced: number; errors: string[] }>(`${this.endpoint}/sync`, {});
    }

    // ==================== TEAMS ====================
    getTeams(): Observable<Team[]> {
        return this.api.get<Team[]>(`${this.endpoint}/teams`).pipe(
            tap(teams => this.teamsCache$.next(teams))
        );
    }

    getTeam(id: number): Observable<Team> {
        return this.api.get<Team>(`${this.endpoint}/teams/${id}`);
    }

    createTeam(team: Partial<Team>): Observable<Team> {
        return this.api.post<Team>(`${this.endpoint}/teams`, team);
    }

    updateTeam(id: number, team: Partial<Team>): Observable<Team> {
        return this.api.put<Team>(`${this.endpoint}/teams/${id}`, team);
    }

    deleteTeam(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/teams/${id}`);
    }

    assignEmployeeToTeam(employeeId: number, teamId: number): Observable<void> {
        return this.api.put<void>(`${this.endpoint}/${employeeId}/team`, { teamId });
    }

    getTeamMembers(teamId: number): Observable<Employee[]> {
        return this.api.get<Employee[]>(`${this.endpoint}/teams/${teamId}/members`);
    }

    // ==================== EMPLOYEE CATEGORIES ====================
    getEmployeeCategories(): Observable<EmployeeCategory[]> {
        return this.api.get<EmployeeCategory[]>(`${this.endpoint}/categories`);
    }

    createCategory(category: Partial<EmployeeCategory>): Observable<EmployeeCategory> {
        return this.api.post<EmployeeCategory>(`${this.endpoint}/categories`, category);
    }

    updateCategory(id: number, category: Partial<EmployeeCategory>): Observable<EmployeeCategory> {
        return this.api.put<EmployeeCategory>(`${this.endpoint}/categories/${id}`, category);
    }

    deleteCategory(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/categories/${id}`);
    }

    // ==================== DEPARTMENTS ====================
    getDepartments(): Observable<Department[]> {
        return this.api.get<Department[]>(`${this.endpoint}/departments`).pipe(
            tap(depts => this.departmentsCache$.next(depts))
        );
    }

    // ==================== FORMATIONS ====================
    getFormations(params?: { processId?: number; type?: string }): Observable<Formation[]> {
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

    // Formation Plans
    getFormationPlans(params?: {
        employeeId?: number;
        formationId?: number;
        status?: string;
        fromDate?: string;
        toDate?: string;
    }): Observable<FormationPlan[]> {
        return this.api.get<FormationPlan[]>(`${this.endpoint}/formation-plans`, params);
    }

    createFormationPlan(plan: Partial<FormationPlan>): Observable<FormationPlan> {
        return this.api.post<FormationPlan>(`${this.endpoint}/formation-plans`, plan);
    }

    updateFormationPlan(id: number, plan: Partial<FormationPlan>): Observable<FormationPlan> {
        return this.api.put<FormationPlan>(`${this.endpoint}/formation-plans/${id}`, plan);
    }

    assignFormationToEmployee(employeeId: number, formationId: number, plannedDate: Date, trainerId?: number): Observable<FormationPlan> {
        return this.api.post<FormationPlan>(`${this.endpoint}/formation-plans`, {
            Id_Emp: employeeId,
            id_formation: formationId,
            planned_date: plannedDate,
            TrainerID: trainerId,
            status: 'planned'
        });
    }

    // ==================== QUALIFICATIONS ====================
    getQualifications(params?: {
        employeeId?: number;
        formationId?: number;
        projectId?: number;
        result?: string;
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

    validateQualification(id: number, result: string, comment?: string): Observable<Qualification> {
        return this.api.put<Qualification>(`${this.endpoint}/qualifications/${id}/validate`, {
            test_result: result,
            comment_qualif: comment,
            end_qualif: new Date()
        });
    }

    getTotalQualification(): Observable<{
        employeeId: number;
        employeeName: string;
        totalQualifications: number;
        passedQualifications: number;
        versatilityScore: number;
    }[]> {
        return this.api.get<any[]>(`${this.endpoint}/qualifications/total`);
    }

    // ==================== VERSATILITY MATRIX ====================
    getVersatilityMatrix(params?: {
        prodLineId?: number;
        department?: string;
    }): Observable<VersatilityMatrix> {
        const apiParams: any = {};
        if (params?.prodLineId) apiParams.production_line = params.prodLineId;
        if (params?.department) apiParams.department = params.department;
        return this.api.get<VersatilityMatrix>(`${this.endpoint}/versatility/matrix`, apiParams);
    }

    updateVersatilityCell(employeeId: number, workstationId: number, level: number): Observable<any> {
        return this.api.post<any>(`${this.endpoint}/versatility/update-cell`, {
            employee_id: employeeId,
            workstation_id: workstationId,
            level
        });
    }

    // ==================== FORMATEURS ====================
    getFormateurs(params?: { status?: string }): Observable<Formateur[]> {
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

    assignFormateurToFormation(formationPlanId: number, formateurId: number): Observable<FormationPlan> {
        return this.api.put<FormationPlan>(`${this.endpoint}/formation-plans/${formationPlanId}/trainer`, {
            TrainerID: formateurId
        });
    }

    // ==================== PROCESSES & WORKSTATIONS ====================
    getProcesses(): Observable<HRProcess[]> {
        return this.api.get<HRProcess[]>(`${this.endpoint}/processes`);
    }

    getWorkstations(params?: { processId?: number; prodLineId?: number }): Observable<HRWorkstation[]> {
        return this.api.get<HRWorkstation[]>('production/workstations', params);
    }

    assignEmployeeToWorkstation(employeeId: number, workstationId: number): Observable<void> {
        return this.api.post<void>(`${this.endpoint}/workstation-assignments`, {
            employeeId,
            workstationId
        });
    }

    // ==================== RECYCLAGE (RETRAINING) ====================
    getEmployeesRequiringRecyclage(): Observable<RecyclageEmployee[]> {
        return this.api.get<RecyclageEmployee[]>(`${this.endpoint}/recyclage`);
    }

    getRecyclageNotifications(params?: { isRead?: boolean }): Observable<RecyclageNotification[]> {
        return this.api.get<RecyclageNotification[]>(`${this.endpoint}/recyclage/notifications`, params);
    }

    markNotificationAsRead(id: number): Observable<void> {
        return this.api.put<void>(`${this.endpoint}/recyclage/notifications/${id}/read`, {});
    }

    planRecyclage(employeeId: number, formationId: number, plannedDate: Date): Observable<FormationPlan> {
        return this.api.post<FormationPlan>(`${this.endpoint}/recyclage/plan`, {
            Id_Emp: employeeId,
            id_formation: formationId,
            planned_date: plannedDate,
            status: 'planned'
        });
    }

    validateRecyclage(employeeId: number, qualificationId: number): Observable<void> {
        return this.api.put<void>(`${this.endpoint}/recyclage/validate`, {
            employeeId,
            qualificationId
        });
    }

    // ==================== TRANSPORT ====================
    getTrajets(): Observable<Trajet[]> {
        return this.api.get<Trajet[]>(`${this.endpoint}/trajets`);
    }

    getTransportPlannings(params?: {
        date?: string;
        employeeId?: number;
        trajetId?: number;
    }): Observable<TransportPlanning[]> {
        return this.api.get<TransportPlanning[]>(`${this.endpoint}/transport-plannings`, params);
    }

    createTransportPlanning(planning: Partial<TransportPlanning>): Observable<TransportPlanning> {
        return this.api.post<TransportPlanning>(`${this.endpoint}/transport-plannings`, planning);
    }

    updateTransportPlanning(id: number, planning: Partial<TransportPlanning>): Observable<TransportPlanning> {
        return this.api.put<TransportPlanning>(`${this.endpoint}/transport-plannings/${id}`, planning);
    }

    assignEmployeeToTrajet(employeeId: number, trajetId: number): Observable<void> {
        return this.api.put<void>(`${this.endpoint}/${employeeId}/trajet`, { trajetId });
    }

    // ==================== ATTENDANCE ====================
    getAttendance(params?: {
        date?: string;
        shift?: string;
        employeeId?: number;
        status?: string;
    }): Observable<Attendance[]> {
        return this.api.get<Attendance[]>(`${this.endpoint}/attendance`, params);
    }

    createAttendance(attendance: Partial<Attendance>): Observable<Attendance> {
        return this.api.post<Attendance>(`${this.endpoint}/attendance`, attendance);
    }

    updateAttendance(id: number, attendance: Partial<Attendance>): Observable<Attendance> {
        return this.api.put<Attendance>(`${this.endpoint}/attendance/${id}`, attendance);
    }

    checkIn(employeeId: number, shift: string): Observable<Attendance> {
        return this.api.post<Attendance>(`${this.endpoint}/attendance/check-in`, {
            Id_Emp: employeeId,
            Shift_Attendance: shift
        });
    }

    checkOut(attendanceId: number): Observable<Attendance> {
        return this.api.put<Attendance>(`${this.endpoint}/attendance/${attendanceId}/check-out`, {});
    }

    // ==================== REPORTS ====================
    generateFormationReport(params: {
        fromDate: string;
        toDate: string;
        departmentId?: number;
        formateurId?: number;
    }): Observable<Blob> {
        return this.api.get<Blob>(`${this.endpoint}/reports/formations`, { ...params, responseType: 'blob' });
    }

    generateQualificationReport(params: {
        employeeId?: number;
        projectId?: number;
        fromDate?: string;
        toDate?: string;
    }): Observable<Blob> {
        return this.api.get<Blob>(`${this.endpoint}/reports/qualifications`, { ...params, responseType: 'blob' });
    }

    generateVersatilityReport(params: {
        prodLineId?: number;
        processId?: number;
    }): Observable<Blob> {
        return this.api.get<Blob>(`${this.endpoint}/reports/versatility`, { ...params, responseType: 'blob' });
    }

    // ==================== CACHE GETTERS ====================
    get cachedEmployees$(): Observable<Employee[]> {
        return this.employeesCache$.asObservable();
    }

    get cachedTeams$(): Observable<Team[]> {
        return this.teamsCache$.asObservable();
    }

    get cachedDepartments$(): Observable<Department[]> {
        return this.departmentsCache$.asObservable();
    }
}
