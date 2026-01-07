import { Injectable, inject } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
    Employee,
    EmployeeCategory,
    Team,
    Trajet,
    TransportPlanning,
    Department,
    DMSUser,
    DMSUserCreate,
    LoginResponse,
    PasswordChangeRequest,
    Qualification,
    VersatilityMatrix,
    Formation,
    FormationPlan,
    Formateur,
    TrainerSpecialization,
    HRProcess,
    HRWorkstation,
    RecyclageEmployee,
    RecyclageNotification,
    Attendance,
    HRDashboardStats,
    FormationStats,
    EmployeeDetail,
    License,
    LicenseType,
    LicenseCreate,
    LicenseStats
} from '../models/employee.model';
import {
    EmployeeWorkstationAssignment,
    AssignmentCreateRequest,
    EmployeePrimaryAssignment,
    AssignmentStats
} from '../../domains/dms-rh/models/assignment.model';
import { HRCacheStateService } from '../state/hr-cache-state.service';
import { QualificationStateService } from '../state/qualification-state.service';
import { AssignmentStateService } from '../state/assignment-state.service';

@Injectable({
    providedIn: 'root'
})
export class HRService {
    private readonly endpoint = 'employees';

    // Inject state services for reactive state management
    private cacheState = inject(HRCacheStateService);
    private qualificationState = inject(QualificationStateService);
    private assignmentState = inject(AssignmentStateService);

    // Legacy cache subjects (kept for backward compatibility)
    // @deprecated Use cacheState signals instead
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
        this.cacheState.setLoadingEmployees(true);
        return this.api.get<{ count: number; results: Employee[] } | Employee[]>(`${this.endpoint}`, params).pipe(
            map(response => {
                // Handle both paginated and array responses for backward compatibility
                return Array.isArray(response) ? response : response.results || [];
            }),
            tap(employees => {
                // Update signal-based cache
                this.cacheState.setEmployees(employees);
                this.cacheState.setLoadingEmployees(false);
                // Also update legacy BehaviorSubject for backward compatibility
                this.employeesCache$.next(employees);
            }),
            catchError(err => {
                this.cacheState.setLoadingEmployees(false);
                throw err;
            })
        );
    }

    /**
     * Get employees with server-side pagination
     * Returns paginated response with count and results
     */
    getEmployeesPaginated(params: {
        page?: number;
        page_size?: number;
        search?: string;
        department?: string;
        category?: string;
        status?: string;
        ordering?: string;
    }): Observable<{ count: number; results: Employee[] }> {
        this.cacheState.setLoadingEmployees(true);
        return this.api.get<{ count: number; results: Employee[] }>(`${this.endpoint}`, params).pipe(
            tap(() => this.cacheState.setLoadingEmployees(false)),
            catchError(err => {
                this.cacheState.setLoadingEmployees(false);
                throw err;
            })
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
        return this.api.post<Employee>(`${this.endpoint}`, employee).pipe(
            tap(created => this.cacheState.addEmployee(created))
        );
    }

    updateEmployee(id: number, employee: Partial<Employee>): Observable<Employee> {
        return this.api.put<Employee>(`${this.endpoint}/${id}`, employee).pipe(
            tap(updated => this.cacheState.updateEmployee(id, updated))
        );
    }

    // Methods with photo upload support (FormData)
    createEmployeeWithPhoto(formData: FormData): Observable<Employee> {
        return this.api.post<Employee>(`${this.endpoint}`, formData).pipe(
            tap(created => this.cacheState.addEmployee(created))
        );
    }

    updateEmployeeWithPhoto(id: number, formData: FormData): Observable<Employee> {
        return this.api.patch<Employee>(`${this.endpoint}/${id}`, formData).pipe(
            tap(updated => this.cacheState.updateEmployee(id, updated))
        );
    }

    deleteEmployee(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/${id}`).pipe(
            tap(() => this.cacheState.removeEmployee(id))
        );
    }

    importEmployeesExcel(file: File): Observable<{ imported: number; updated: number; skipped: number; errors: string[]; success: boolean }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.api.post<{ imported: number; updated: number; skipped: number; errors: string[]; success: boolean }>(`${this.endpoint}/import`, formData);
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
            tap(teams => {
                this.cacheState.setTeams(teams);
                this.teamsCache$.next(teams);
            })
        );
    }

    getTeam(id: number): Observable<Team> {
        return this.api.get<Team>(`${this.endpoint}/teams/${id}`);
    }

    createTeam(team: Partial<Team>): Observable<Team> {
        return this.api.post<Team>(`${this.endpoint}/teams`, team).pipe(
            tap(created => this.cacheState.addTeam(created))
        );
    }

    updateTeam(id: number, team: Partial<Team>): Observable<Team> {
        return this.api.put<Team>(`${this.endpoint}/teams/${id}`, team).pipe(
            tap(updated => this.cacheState.updateTeam(id, updated))
        );
    }

    deleteTeam(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/teams/${id}`).pipe(
            tap(() => this.cacheState.removeTeam(id))
        );
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

    // ==================== EMPLOYEE STATUSES ====================
    getEmployeeStatuses(): Observable<any[]> {
        return this.api.get<any[]>(`${this.endpoint}/statuses`);
    }

    createStatus(status: any): Observable<any> {
        return this.api.post<any>(`${this.endpoint}/statuses`, status);
    }

    updateStatus(id: number, status: any): Observable<any> {
        return this.api.put<any>(`${this.endpoint}/statuses/${id}`, status);
    }

    deleteStatus(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/statuses/${id}`);
    }

    // ==================== DEPARTMENTS ====================
    getDepartments(): Observable<Department[]> {
        return this.api.get<Department[]>(`${this.endpoint}/departments`).pipe(
            tap(depts => {
                this.cacheState.setDepartments(depts);
                this.departmentsCache$.next(depts);
            })
        );
    }

    getDepartmentEntities(): Observable<any[]> {
        return this.api.get<any[]>(`${this.endpoint}/department-mgmt`);
    }

    createDepartment(department: { name: string; description?: string }): Observable<any> {
        return this.api.post<any>(`${this.endpoint}/department-mgmt`, department);
    }

    updateDepartment(id: number, department: { name?: string; description?: string }): Observable<any> {
        return this.api.put<any>(`${this.endpoint}/department-mgmt/${id}`, department);
    }

    deleteDepartment(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/department-mgmt/${id}`);
    }

    // ==================== DMS USERS ====================
    getUsers(params?: { status?: string; position?: string; department?: number }): Observable<DMSUser[]> {
        return this.api.get<DMSUser[]>(`${this.endpoint}/users`, params);
    }

    getUser(id: number): Observable<DMSUser> {
        return this.api.get<DMSUser>(`${this.endpoint}/users/${id}`);
    }

    createUser(user: DMSUserCreate): Observable<DMSUser> {
        return this.api.post<DMSUser>(`${this.endpoint}/users`, user);
    }

    updateUser(id: number, user: Partial<DMSUser>): Observable<DMSUser> {
        return this.api.put<DMSUser>(`${this.endpoint}/users/${id}`, user);
    }

    deleteUser(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/users/${id}`);
    }

    authenticateUser(login: string, password: string): Observable<LoginResponse> {
        return this.api.post<LoginResponse>(`${this.endpoint}/users/authenticate`, { login, password });
    }

    changeUserPassword(userId: number, passwords: PasswordChangeRequest): Observable<{ success: boolean; message: string }> {
        return this.api.post<{ success: boolean; message: string }>(`${this.endpoint}/users/${userId}/change-password`, passwords);
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
        this.qualificationState.setLoading(true);
        return this.api.get<Qualification[]>(`${this.endpoint}/qualifications`, params).pipe(
            tap(qualifications => {
                this.qualificationState.setQualifications(qualifications);
                this.qualificationState.setLoading(false);
            }),
            catchError(err => {
                this.qualificationState.setLoading(false);
                throw err;
            })
        );
    }

    getQualification(id: number): Observable<Qualification> {
        return this.api.get<Qualification>(`${this.endpoint}/qualifications/${id}`);
    }

    createQualification(qualification: Partial<Qualification>): Observable<Qualification> {
        return this.api.post<Qualification>(`${this.endpoint}/qualifications`, qualification).pipe(
            tap(created => {
                // Immediately update the state - UI will refresh automatically
                this.qualificationState.addQualification(created);
            })
        );
    }

    updateQualification(id: number, qualification: Partial<Qualification>): Observable<Qualification> {
        return this.api.patch<Qualification>(`${this.endpoint}/qualifications/${id}`, qualification).pipe(
            tap(updated => {
                // Immediately update the state - UI will refresh automatically
                this.qualificationState.updateQualification(id, updated);
            })
        );
    }

    deleteQualification(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/qualifications/${id}`).pipe(
            tap(() => {
                // Immediately update the state - UI will refresh automatically
                this.qualificationState.removeQualification(id);
            })
        );
    }

    validateQualification(id: number, result: string, comment?: string): Observable<Qualification> {
        return this.api.put<Qualification>(`${this.endpoint}/qualifications/${id}/validate`, {
            test_result: result,
            comment_qualif: comment,
            end_qualif: new Date()
        }).pipe(
            tap(updated => {
                // Immediately update the state - UI will refresh automatically
                this.qualificationState.updateQualification(id, updated);
            })
        );
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

    // ==================== TRAINER SPECIALIZATIONS ====================
    // Default specializations (fallback when API not available)
    private defaultSpecializations: TrainerSpecialization[] = [
        { id: 1, name: 'Assembly', description: 'Assembly line operations', is_active: true },
        { id: 2, name: 'Quality Control', description: 'Quality inspection and control', is_active: true },
        { id: 3, name: 'Safety & HSE', description: 'Health, Safety and Environment', is_active: true },
        { id: 4, name: 'Machine Operation', description: 'Machine operation and handling', is_active: true },
        { id: 5, name: 'Maintenance', description: 'Equipment maintenance', is_active: true },
        { id: 6, name: 'Process Improvement', description: 'Continuous improvement methods', is_active: true },
        { id: 7, name: 'Welding', description: 'Welding techniques and safety', is_active: true },
        { id: 8, name: 'Electrical', description: 'Electrical systems and safety', is_active: true }
    ];

    getSpecializations(params?: { status?: string }): Observable<TrainerSpecialization[]> {
        return this.api.get<TrainerSpecialization[]>(`${this.endpoint}/specializations`, params).pipe(
            catchError(err => {
                console.warn('Specializations API not available, using default data');
                return of(this.defaultSpecializations);
            })
        );
    }

    getSpecialization(id: number): Observable<TrainerSpecialization> {
        return this.api.get<TrainerSpecialization>(`${this.endpoint}/specializations/${id}`);
    }

    createSpecialization(specialization: Partial<TrainerSpecialization>): Observable<TrainerSpecialization> {
        return this.api.post<TrainerSpecialization>(`${this.endpoint}/specializations`, specialization);
    }

    updateSpecialization(id: number, specialization: Partial<TrainerSpecialization>): Observable<TrainerSpecialization> {
        return this.api.put<TrainerSpecialization>(`${this.endpoint}/specializations/${id}`, specialization);
    }

    deleteSpecialization(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/specializations/${id}`);
    }

    // ==================== PROCESSES & WORKSTATIONS ====================
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

    deleteProcess(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/processes/${id}`);
    }

    getWorkstations(params?: { processId?: number; prodLineId?: number }): Observable<HRWorkstation[]> {
        return this.api.get<HRWorkstation[]>('production/workstations', params);
    }

    getWorkstation(id: number): Observable<HRWorkstation> {
        return this.api.get<HRWorkstation>(`production/workstations/${id}`);
    }

    createWorkstation(workstation: Partial<HRWorkstation>): Observable<HRWorkstation> {
        return this.api.post<HRWorkstation>('production/workstations', workstation);
    }

    updateWorkstation(id: number, workstation: Partial<HRWorkstation>): Observable<HRWorkstation> {
        return this.api.put<HRWorkstation>(`production/workstations/${id}`, workstation);
    }

    deleteWorkstation(id: number): Observable<void> {
        return this.api.delete<void>(`production/workstations/${id}`);
    }

    getProductionLines(): Observable<any[]> {
        return this.api.get<any[]>('production/lines');
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

    // ==================== LICENSES ====================
    getLicenses(params?: {
        employee?: number;
        license_type?: number;
    }): Observable<License[]> {
        return this.api.get<License[]>(`${this.endpoint}/licenses`, params);
    }

    getLicense(id: number): Observable<License> {
        return this.api.get<License>(`${this.endpoint}/licenses/${id}`);
    }

    createLicense(license: LicenseCreate): Observable<License> {
        return this.api.post<License>(`${this.endpoint}/licenses`, license);
    }

    updateLicense(id: number, license: Partial<LicenseCreate>): Observable<License> {
        return this.api.put<License>(`${this.endpoint}/licenses/${id}`, license);
    }

    deleteLicense(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/licenses/${id}`);
    }

    getExpiringLicenses(days: number = 30): Observable<License[]> {
        return this.api.get<License[]>(`${this.endpoint}/licenses/expiring`, { days });
    }

    getExpiredLicenses(): Observable<License[]> {
        return this.api.get<License[]>(`${this.endpoint}/licenses/expired`);
    }

    getLicenseStats(): Observable<LicenseStats> {
        return this.api.get<LicenseStats>(`${this.endpoint}/licenses/stats`);
    }

    getLicensesByEmployee(employeeId: number): Observable<License[]> {
        return this.api.get<License[]>(`${this.endpoint}/licenses/by-employee`, { employee_id: employeeId });
    }

    // ==================== LICENSE TYPES ====================
    getLicenseTypes(): Observable<LicenseType[]> {
        return this.api.get<LicenseType[]>(`${this.endpoint}/license-types`);
    }

    getLicenseType(id: number): Observable<LicenseType> {
        return this.api.get<LicenseType>(`${this.endpoint}/license-types/${id}`);
    }

    createLicenseType(licenseType: Partial<LicenseType>): Observable<LicenseType> {
        return this.api.post<LicenseType>(`${this.endpoint}/license-types`, licenseType);
    }

    updateLicenseType(id: number, licenseType: Partial<LicenseType>): Observable<LicenseType> {
        return this.api.put<LicenseType>(`${this.endpoint}/license-types/${id}`, licenseType);
    }

    deleteLicenseType(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/license-types/${id}`);
    }

    // ==================== EMPLOYEE WORKSTATION ASSIGNMENTS ====================

    /**
     * Get all workstation assignments with optional filters.
     * Automatically updates the AssignmentStateService via tap().
     */
    getWorkstationAssignments(params?: {
        employee?: number;
        workstation?: number;
        is_primary?: boolean;
    }): Observable<EmployeeWorkstationAssignment[]> {
        this.assignmentState.setLoading(true);
        return this.api.get<EmployeeWorkstationAssignment[] | { results: EmployeeWorkstationAssignment[] }>(`${this.endpoint}/workstation-assignments`, params).pipe(
            map(response => {
                // Handle both direct array and paginated response formats
                if (Array.isArray(response)) {
                    return response;
                }
                // Handle DRF paginated response: { count, next, previous, results }
                if (response && 'results' in response && Array.isArray(response.results)) {
                    return response.results;
                }
                return [];
            }),
            tap(assignments => {
                // Update state service (single source of truth)
                this.assignmentState.setAssignments(assignments);
                this.assignmentState.setLoading(false);
            }),
            catchError(err => {
                this.assignmentState.setLoading(false);
                throw err;
            })
        );
    }

    /**
     * Get all assignments for a specific employee
     */
    getEmployeeAssignments(employeeId: number): Observable<EmployeeWorkstationAssignment[]> {
        return this.api.get<EmployeeWorkstationAssignment[]>(
            `${this.endpoint}/workstation-assignments/by-employee/${employeeId}`
        );
    }

    /**
     * Get primary assignment for an employee with qualification validation.
     * Used by Production module when scanning employee badges.
     */
    getPrimaryAssignment(employeeId: number): Observable<EmployeePrimaryAssignment> {
        return this.api.get<EmployeePrimaryAssignment>(
            `${this.endpoint}/workstation-assignments/primary/${employeeId}`
        );
    }

    /**
     * Get all assignments for a specific workstation
     */
    getWorkstationEmployees(workstationId: number): Observable<EmployeeWorkstationAssignment[]> {
        return this.api.get<EmployeeWorkstationAssignment[]>(
            `${this.endpoint}/workstation-assignments/by-workstation/${workstationId}`
        );
    }

    /**
     * Create a new workstation assignment
     */
    createWorkstationAssignment(assignment: AssignmentCreateRequest): Observable<EmployeeWorkstationAssignment> {
        return this.api.post<EmployeeWorkstationAssignment>(
            `${this.endpoint}/workstation-assignments`,
            assignment
        ).pipe(
            tap(() => {
                // Invalidate state to force reload with full data
                // Backend returns partial data on create, so we need to reload
                this.assignmentState.invalidate();
            })
        );
    }

    /**
     * Update an existing workstation assignment
     */
    updateWorkstationAssignment(
        id: number,
        assignment: Partial<AssignmentCreateRequest>
    ): Observable<EmployeeWorkstationAssignment> {
        return this.api.put<EmployeeWorkstationAssignment>(
            `${this.endpoint}/workstation-assignments/${id}`,
            assignment
        ).pipe(
            tap(() => {
                // Invalidate state to force reload with full data
                this.assignmentState.invalidate();
            })
        );
    }

    /**
     * Delete a workstation assignment
     */
    deleteWorkstationAssignment(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/workstation-assignments/${id}`).pipe(
            tap(() => {
                // Remove from state for immediate UI update
                this.assignmentState.removeAssignment(id);
            })
        );
    }

    /**
     * Set an assignment as primary (auto-unsets others for the same employee)
     */
    setPrimaryAssignment(assignmentId: number): Observable<{ success: boolean; message: string }> {
        return this.api.post<{ success: boolean; message: string }>(
            `${this.endpoint}/workstation-assignments/set-primary`,
            { assignment_id: assignmentId }
        ).pipe(
            tap(() => {
                // Invalidate state to force reload (multiple assignments may have changed)
                this.assignmentState.invalidate();
            })
        );
    }

    /**
     * Get assignment statistics
     */
    getAssignmentStats(): Observable<AssignmentStats> {
        return this.api.get<AssignmentStats>(`${this.endpoint}/workstation-assignments/stats`);
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
