export interface LoginCredentials {
    username: string;
    password: string;
}

export interface TokenResponse {
    access: string;
    refresh: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    position?: 'admin' | 'rh_manager' | 'team_leader' | 'supervisor' | 'operator' | 'formateur' | 'manager' | 'technician' | 'viewer';
    status?: 'active' | 'inactive' | 'suspended';
    employee?: number;
    employee_name?: string;
    department?: number;
    department_name?: string;
    // DMS Module permissions
    dms_ll?: boolean;
    dms_kpi?: boolean;
    dms_hr?: boolean;
    dms_production?: boolean;
    dms_quality?: boolean;
    dms_maintenance?: boolean;
    dms_inventory?: boolean;
    dms_analytics?: boolean;
    dms_tech?: boolean;
    dms_admin?: boolean;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
}
