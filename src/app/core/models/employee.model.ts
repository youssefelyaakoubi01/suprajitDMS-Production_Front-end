// ==================== EMPLOYEE ====================
export interface Employee {
    Id_Emp: number;
    Nom_Emp: string;
    Prenom_Emp: string;
    DateNaissance_Emp: Date;
    Genre_Emp: string;
    Categorie_Emp: string;
    DateEmbauche_Emp: Date;
    Departement_Emp: string;
    Picture: string;
    EmpStatus: string;
    team?: Team;
    trajet?: Trajet;
    category_fk?: EmployeeCategory;
    created_by?: string;
    changed_by?: string;
    // Legacy fields (keep if needed or mark deprecated)
    TeamLeaderID?: number;
    BadgeNumber?: string;
    trajetID?: number;
    teamID?: number;
    IDEmployeeCategory?: number;
    CreatedBy?: string;
    CreatedDate?: Date;
    ChangedBy?: string;
    ChangedDate?: Date;
}

export interface EmployeeCategory {
    id?: number;
    name: string;
    description?: string;
    // Legacy
    IDEmployeeCategory?: number;
    categoryDescription?: string;
}

export interface EmployeeStatus {
    id?: number;
    name: string;
    code: string;
    description?: string;
    color?: string;  // 'success', 'warning', 'danger', 'info'
    is_active?: boolean;
}

// ==================== TEAMS & TRANSPORT ====================
export interface Team {
    id?: number;
    name: string;
    code: string;
    description?: string;
    // Legacy
    teamID?: number;
    teamName?: string;
}

export interface Trajet {
    id?: number;
    name: string;
    code: string;
    description?: string;
    cost?: number;
    // Legacy
    trajetID?: number;
    trajetName?: string;
}

export interface TransportPlanning {
    id?: number;
    employee: number | Employee; // ID or Object
    date: Date;
    shift: number; // Shift ID
    trajet: number | Trajet; // ID or Object
    // Legacy
    Id_Planning?: number;
    Id_Emp?: number;
    datePlanning?: Date;
    typeHoraireID?: number;
    Employee?: Employee;
}

// ==================== DEPARTMENT ====================
export interface Department {
    id: number;
    department: string;
}

// ==================== DMS USER ====================
export interface DMSUser {
    id: number;
    name: string;
    login: string;
    password?: string;
    position: 'admin' | 'rh_manager' | 'team_leader' | 'supervisor' | 'operator' | 'formateur';
    position_display?: string;
    employee?: number;
    employee_name?: string;
    department?: number;
    department_name?: string;
    status: 'active' | 'inactive' | 'suspended';
    status_display?: string;
    // DMS Module permissions
    dms_ll: boolean;
    dms_kpi: boolean;
    dms_hr: boolean;
    dms_production: boolean;
    dms_quality: boolean;
    dms_maintenance: boolean;
    last_login?: Date;
    created_at?: Date;
    updated_at?: Date;
    // Legacy fields
    Id_User?: number;
    Name_User?: string;
    Login_User?: string;
    Password_User?: string;
    Position_User?: string;
    Id_Emp?: number;
    departmentID?: number;
    Status?: string;
    DMS_LL?: boolean;
    DMS_KPI?: boolean;
}

export interface DMSUserCreate {
    name: string;
    login: string;
    password: string;
    position: string;
    employee?: number;
    department?: number;
    status?: string;
    dms_ll?: boolean;
    dms_kpi?: boolean;
    dms_hr?: boolean;
    dms_production?: boolean;
    dms_quality?: boolean;
    dms_maintenance?: boolean;
}

export interface LoginResponse {
    success: boolean;
    user?: DMSUser;
    error?: string;
}

export interface PasswordChangeRequest {
    old_password: string;
    new_password: string;
}

// ==================== QUALIFICATION ====================
export interface Qualification {
    id: number;
    start_date: Date | string | null;
    end_date: Date | string | null;
    test?: string;
    test_result: string;
    score?: number | null;
    comment?: string;
    prod_line?: string;
    notes?: string;
    created_by?: string;
    changed_by?: string;
    created_at?: string;
    updated_at?: string;
    // Foreign keys (IDs)
    employee: number;
    formation: number;
    project: number | null;
    trainer: number | null;
    // Joined fields (read-only from API)
    employee_name?: string;
    formation_name?: string;
    project_name?: string;
    Employee?: Employee;
    Formation?: Formation;
    TrainerName?: string;
    // Legacy field aliases for backward compatibility
    id_qualif?: number;
}

export type QualificationLevel = 0 | 1 | 2 | 3 | 4;

export interface VersatilityCell {
    employeeId: number;
    workstationId: number;
    level: QualificationLevel;
    qualificationId?: number;
}

export interface VersatilityMatrix {
    employees: Employee[];
    workstations: HRWorkstation[];
    cells: VersatilityCell[];
}

// ==================== FORMATION ====================
export interface Formation {
    id: number;
    name: string;
    type: string;
    process: number;
    process_name?: string;
    duration_hours?: number;
    description?: string;
    is_active?: boolean;
    created_at?: string;
}

export interface FormationPlan {
    Id_Plan: number;
    id_formation: number;
    Id_Emp: number;
    planned_date: Date;
    status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
    TrainerID?: number;
    notes?: string;
    Formation?: Formation;
    Employee?: Employee;
}

// ==================== FORMATEUR ====================
export interface Formateur {
    id?: number;
    name: string;
    email?: string;
    phone?: string;
    specialization?: string;
    is_active?: boolean;
    // Legacy
    TrainerID?: number;
    Name?: string;
    login?: string;
    password?: string;
    Status?: string;
    IsAdmin?: boolean;
    LastModified?: Date;
    Email?: string;
}

// ==================== TRAINER SPECIALIZATION ====================
export interface TrainerSpecialization {
    id: number;
    name: string;
    description?: string;
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

// ==================== PROCESS & HR WORKSTATION ====================
export interface HRProcess {
    id: number;
    name: string;
    code: string;
    description?: string;
    is_active?: boolean;
}

export interface HRWorkstation {
    id_workstation: number;
    desc_workstation: string;
    id_process: number;
    Id_ProdLine: number;
    id_machine?: number;
    kpi_index?: number;
    id_formation?: number;
    processIndex?: number;
    Process?: HRProcess;
    // Enhanced fields
    process_mode?: 'manual' | 'semi_auto' | 'full_auto';
    typ_order?: string;
    cycle_time_seconds?: number;
    max_operators?: number;
    is_critical?: boolean;
    description?: string;
}

// ==================== RECYCLAGE (RETRAINING) ====================
export interface RecyclageEmployee {
    Id_Emp: number;
    Employee: Employee;
    DateEmbauche_Emp: Date;
    daysUntilRecyclage: number;
    isOverdue: boolean;
    lastQualificationDate?: Date;
    requiresRecyclage: boolean;
}

export interface RecyclageNotification {
    Id_Notification: number;
    Id_Emp: number;
    notificationDate: Date;
    notificationType: 'warning' | 'due' | 'overdue';
    isRead: boolean;
    Employee?: Employee;
}

// ==================== ATTENDANCE ====================
export interface Attendance {
    Id_Attendance: number;
    Id_Emp: number;
    Date_Attendance: Date;
    Shift_Attendance: string;
    CheckIn: Date;
    CheckOut?: Date;
    Status: 'present' | 'absent' | 'late' | 'leave';
    Employee?: Employee;
}

// ==================== HR DASHBOARD ====================
export interface HRDashboardStats {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    employeesByDepartment: { department: string; count: number }[];
    employeesByCategory: { category: string; count: number }[];
    recentHires: Employee[];
    employeesRequiringRecyclage: number;
    qualificationCompletionRate: number;
    averageVersatility: number;
}

export interface FormationStats {
    totalFormations: number;
    plannedFormations: number;
    completedFormations: number;
    formationsByType: { type: string; count: number }[];
    upcomingFormations: FormationPlan[];
}

// ==================== PRODUCTION ROLE TYPES ====================
export type ProductionRole = 'operator' | 'line_leader' | 'quality_agent' | 'maintenance_tech' | 'pqc';

export interface ProductionRoleOption {
    label: string;
    value: ProductionRole;
    icon: string;
}

// ==================== EXTENDED INTERFACES ====================
export interface EmployeeWithAssignment extends Employee {
    workstation?: string;
    workstationId?: number;
    machine?: string;
    machineId?: number;
    qualification?: string;
    qualificationLevel?: number;
    role?: ProductionRole;
    team?: Team;
    category?: EmployeeCategory;
}

export interface EmployeeDetail extends Employee {
    qualifications: Qualification[];
    formations: FormationPlan[];
    attendance: Attendance[];
    team?: Team;
    category?: EmployeeCategory;
    trajet?: Trajet;
}

// ==================== LICENSE MANAGEMENT ====================
export interface LicenseType {
    id: number;
    name: string;
    description?: string;
    validity_months: number;
    renewal_advance_days?: number;
    is_mandatory: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface License {
    id: number;
    employee: number;
    employee_name?: string;
    employee_id_display?: string;
    license_type: number;
    license_type_name?: string;
    license_number: string;
    issue_date: Date;
    expiry_date: Date;
    issuing_authority: string;
    document_url?: string;
    notes?: string;
    status: 'active' | 'expired' | 'expiring_soon';
    days_until_expiry?: number;
    created_by?: string;
    changed_by?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface LicenseCreate {
    employee: number;
    license_type: number;
    license_number: string;
    issue_date: Date | string;
    expiry_date: Date | string;
    issuing_authority: string;
    document_url?: string;
    notes?: string;
    created_by?: string;
}

export interface LicenseStats {
    total: number;
    active: number;
    expired: number;
    expiring_soon: number;
    by_type: { license_type__name: string; count: number }[];
}
