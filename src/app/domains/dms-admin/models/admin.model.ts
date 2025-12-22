/**
 * DMS-Admin Models
 * Domain: User & Permission Administration
 */

// Re-export existing user model
export type { DMSUser, DMSUserCreate, UserPosition, UserStatus } from '../../dms-rh/models/user.model';
export { UserPositionLabels, UserStatusLabels } from '../../dms-rh/models/user.model';

// ==================== MODULE PERMISSIONS ====================

export interface DmsModulePermission {
    key: string;
    label: string;
    icon: string;
    color: string;
    route: string;
}

export const DMS_MODULE_PERMISSIONS: DmsModulePermission[] = [
    { key: 'dms_production', label: 'Production', icon: 'pi pi-bolt', color: '#3B82F6', route: '/dms-production' },
    { key: 'dms_hr', label: 'RH', icon: 'pi pi-users', color: '#8B5CF6', route: '/dms-hr' },
    { key: 'dms_maintenance', label: 'Maintenance', icon: 'pi pi-wrench', color: '#06B6D4', route: '/dms-maintenance' },
    { key: 'dms_inventory', label: 'Inventaire', icon: 'pi pi-box', color: '#F59E0B', route: '/dms-inventory' },
    { key: 'dms_quality', label: 'Qualit\u00e9', icon: 'pi pi-shield', color: '#10B981', route: '/dms-quality' },
    { key: 'dms_analytics', label: 'Analytics', icon: 'pi pi-chart-bar', color: '#EC4899', route: '/analytics' },
    { key: 'dms_tech', label: 'Tech Config', icon: 'pi pi-cog', color: '#6366F1', route: '/dms-tech' },
    { key: 'dms_kpi', label: 'KPI', icon: 'pi pi-chart-line', color: '#EF4444', route: '/analytics' },
    { key: 'dms_ll', label: 'Lessons Learned', icon: 'pi pi-book', color: '#F97316', route: '/analytics' },
    { key: 'dms_admin', label: 'Admin', icon: 'pi pi-lock', color: '#DC2626', route: '/dms-admin' }
];

// ==================== DASHBOARD STATS ====================

export interface AdminDashboardStats {
    total_users: number;
    active_users: number;
    inactive_users: number;
    suspended_users: number;
    users_by_role: { role: string; count: number }[];
    users_by_department: { department: string; count: number }[];
    module_access_distribution: { module: string; count: number }[];
    recent_logins: { user_name: string; login_time: Date }[];
}

// ==================== ACTIVITY LOG ====================

export type ActivityAction = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'permission_change' | 'password_reset';
export type ActivityTargetType = 'user' | 'permission' | 'session' | 'settings';

export interface ActivityLog {
    id: number;
    user_id: number;
    user_name: string;
    action: ActivityAction;
    target_type: ActivityTargetType;
    target_id?: number;
    target_name?: string;
    details?: string;
    old_value?: string;
    new_value?: string;
    ip_address?: string;
    user_agent?: string;
    created_at: Date;
}

// ==================== BULK OPERATIONS ====================

export interface BulkStatusUpdate {
    user_ids: number[];
    status: 'active' | 'inactive' | 'suspended';
}

export interface BulkPermissionUpdate {
    user_ids: number[];
    permissions: Record<string, boolean>;
}

// ==================== OPTIONS ====================

export const USER_POSITION_OPTIONS = [
    { label: 'Administrateur', value: 'admin', icon: 'pi pi-shield', severity: 'danger' },
    { label: 'Manager RH', value: 'rh_manager', icon: 'pi pi-briefcase', severity: 'info' },
    { label: 'Chef d\'\u00e9quipe', value: 'team_leader', icon: 'pi pi-star', severity: 'warn' },
    { label: 'Superviseur', value: 'supervisor', icon: 'pi pi-eye', severity: 'secondary' },
    { label: 'Op\u00e9rateur', value: 'operator', icon: 'pi pi-user', severity: 'success' },
    { label: 'Formateur', value: 'formateur', icon: 'pi pi-book', severity: 'contrast' }
];

export const USER_STATUS_OPTIONS = [
    { label: 'Actif', value: 'active', severity: 'success' as const },
    { label: 'Inactif', value: 'inactive', severity: 'secondary' as const },
    { label: 'Suspendu', value: 'suspended', severity: 'danger' as const }
];
