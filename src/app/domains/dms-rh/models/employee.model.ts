/**
 * DMS-RH Models - Employee
 * Domain: Human Resources Management
 */

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
    // Legacy fields
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

// ==================== EMPLOYEE CATEGORY ====================
export interface EmployeeCategory {
    id?: number;
    name: string;
    description?: string;
    // Legacy
    IDEmployeeCategory?: number;
    categoryDescription?: string;
}

// ==================== DEPARTMENT ====================
export interface Department {
    id: number;
    department: string;
}

// ==================== EMPLOYEE EXTENDED ====================
export interface EmployeeWithAssignment extends Employee {
    workstation?: string;
    workstationId?: number;
    machine?: string;
    machineId?: number;
    qualification?: string;
    qualificationLevel?: number;
    team?: Team;
    category?: EmployeeCategory;
    isNonQualified?: boolean; // Flag for non-qualified assignments (traceability)
}

export interface EmployeeDetail extends Employee {
    qualifications: Qualification[];
    formations: FormationPlan[];
    attendance: Attendance[];
    team?: Team;
    category?: EmployeeCategory;
    trajet?: Trajet;
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

// Forward declarations for circular dependencies
import { Team } from './team.model';
import { Trajet } from './transport.model';
import { Qualification } from './qualification.model';
import { FormationPlan } from './formation.model';
