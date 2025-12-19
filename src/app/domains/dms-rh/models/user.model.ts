/**
 * DMS-RH Models - DMS User
 * Domain: Human Resources Management
 */

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

// ==================== DMS USER CREATE ====================
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

// ==================== USER POSITION ====================
export type UserPosition = 'admin' | 'rh_manager' | 'team_leader' | 'supervisor' | 'operator' | 'formateur';

export const UserPositionLabels: Record<UserPosition, string> = {
    admin: 'Administrateur',
    rh_manager: 'Manager RH',
    team_leader: 'Chef d\'équipe',
    supervisor: 'Superviseur',
    operator: 'Opérateur',
    formateur: 'Formateur'
};

// ==================== USER STATUS ====================
export type UserStatus = 'active' | 'inactive' | 'suspended';

export const UserStatusLabels: Record<UserStatus, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    suspended: 'Suspendu'
};

// ==================== PASSWORD ====================
export interface PasswordChangeRequest {
    old_password: string;
    new_password: string;
}
