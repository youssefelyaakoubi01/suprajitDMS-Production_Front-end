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
    Id_User: number;
    Name_User: string;
    Login_User: string;
    Password_User?: string;
    Position_User: string;
    Id_Emp: number;
    departmentID?: number;
    Status: string;
    DMS_LL?: boolean;
    DMS_KPI?: boolean;
}

// ==================== QUALIFICATION ====================
export interface Qualification {
    id_qualif: number;
    start_qualif: Date;
    end_qualif: Date;
    id_formation: number;
    test?: string;
    test_result: string;
    Id_Emp: number;
    Trainer: number;
    comment_qualif?: string;
    prodline?: string;
    Id_Project: number;
    createdby?: string;
    createddate?: Date;
    changedby?: string;
    changeddate?: Date;
    // Joined fields
    Employee?: Employee;
    Formation?: Formation;
    TrainerName?: string;
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
    id_formation: number;
    name_formation: string;
    type_formation: string;
    id_process: number;
    Process?: HRProcess;
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

// ==================== PROCESS & HR WORKSTATION ====================
export interface HRProcess {
    id_process: number;
    desc_process: string;
    ZoneID?: number;
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

// ==================== EXTENDED INTERFACES ====================
export interface EmployeeWithAssignment extends Employee {
    workstation?: string;
    workstationId?: number;
    machine?: string;
    machineId?: number;
    qualification?: string;
    qualificationLevel?: number;
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
