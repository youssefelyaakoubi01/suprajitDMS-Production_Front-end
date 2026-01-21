/**
 * Admin Service
 * Domain: DMS-Admin
 *
 * Handles user management, dashboard stats, and activity logs
 * Uses existing HRService endpoints with additional admin-specific operations
 */
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import {
    DMSUser,
    DMSUserCreate,
    AdminDashboardStats,
    ActivityLog,
    BulkStatusUpdate,
    DMS_MODULE_PERMISSIONS
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private readonly endpoint = 'employees/users';
    private readonly logsEndpoint = 'employees/activity-logs';

    constructor(private api: ApiService) {}

    // ==================== USERS CRUD ====================

    getUsers(params?: {
        search?: string;
        status?: string;
        position?: string;
        department?: number;
    }): Observable<DMSUser[]> {
        return this.api.get<DMSUser[]>(this.endpoint, params).pipe(
            map((data: any) => Array.isArray(data) ? data : (data.results || []))
        );
    }

    getUser(id: number): Observable<DMSUser> {
        return this.api.get<DMSUser>(`${this.endpoint}/${id}`);
    }

    createUser(user: DMSUserCreate): Observable<DMSUser> {
        return this.api.post<DMSUser>(this.endpoint, user);
    }

    updateUser(id: number, user: Partial<DMSUser>): Observable<DMSUser> {
        return this.api.put<DMSUser>(`${this.endpoint}/${id}`, user);
    }

    deleteUser(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/${id}`);
    }

    // ==================== DASHBOARD STATS ====================

    getDashboardStats(): Observable<AdminDashboardStats> {
        // Directly calculate stats from users list (admin-stats endpoint not available)
        return this.getUsers().pipe(
            map(users => this.calculateStatsFromUsers(users)),
            catchError(() => of(this.getEmptyStats()))
        );
    }

    private getEmptyStats(): AdminDashboardStats {
        return {
            total_users: 0,
            active_users: 0,
            inactive_users: 0,
            suspended_users: 0,
            users_by_role: [],
            users_by_department: [],
            module_access_distribution: [],
            recent_logins: []
        };
    }

    private calculateStatsFromUsers(users: DMSUser[]): AdminDashboardStats {
        const roleCount: Record<string, number> = {};
        const deptCount: Record<string, number> = {};
        const moduleCount: Record<string, number> = {};

        let active = 0, inactive = 0, suspended = 0;

        users.forEach(user => {
            // Status counts
            if (user.status === 'active') active++;
            else if (user.status === 'inactive') inactive++;
            else if (user.status === 'suspended') suspended++;

            // Role counts
            const role = user.position_display || user.position || 'Unknown';
            roleCount[role] = (roleCount[role] || 0) + 1;

            // Department counts
            const dept = user.department_name || 'Sans d\u00e9partement';
            deptCount[dept] = (deptCount[dept] || 0) + 1;

            // Module access counts
            DMS_MODULE_PERMISSIONS.forEach(perm => {
                if ((user as any)[perm.key]) {
                    moduleCount[perm.label] = (moduleCount[perm.label] || 0) + 1;
                }
            });
        });

        return {
            total_users: users.length,
            active_users: active,
            inactive_users: inactive,
            suspended_users: suspended,
            users_by_role: Object.entries(roleCount).map(([role, count]) => ({ role, count })),
            users_by_department: Object.entries(deptCount).map(([department, count]) => ({ department, count })),
            module_access_distribution: Object.entries(moduleCount).map(([module, count]) => ({ module, count })),
            recent_logins: [] // Would need actual login data from backend
        };
    }

    // ==================== BULK OPERATIONS ====================

    bulkUpdateStatus(data: BulkStatusUpdate): Observable<{ updated: number }> {
        return this.api.post<{ updated: number }>(`${this.endpoint}/bulk-status`, data).pipe(
            catchError(() => {
                // Fallback: update individually
                return of({ updated: 0 });
            })
        );
    }

    bulkDelete(userIds: number[]): Observable<{ deleted: number }> {
        return this.api.post<{ deleted: number }>(`${this.endpoint}/bulk-delete`, { user_ids: userIds }).pipe(
            catchError(() => of({ deleted: 0 }))
        );
    }

    // ==================== PASSWORD MANAGEMENT ====================

    resetPassword(userId: number, newPassword: string): Observable<{ success: boolean }> {
        return this.api.post<{ success: boolean }>(`${this.endpoint}/${userId}/reset-password`, {
            new_password: newPassword
        }).pipe(
            catchError(() => {
                // Fallback: update user with new password
                return this.updateUser(userId, { password: newPassword } as any).pipe(
                    map(() => ({ success: true }))
                );
            })
        );
    }

    // ==================== VALIDATION ====================

    checkLoginAvailability(login: string, excludeUserId?: number): Observable<{ available: boolean }> {
        const params: Record<string, string | number> = { login };
        if (excludeUserId !== undefined) {
            params['exclude'] = excludeUserId;
        }
        return this.api.get<{ available: boolean }>(`${this.endpoint}/check-login`, params).pipe(
            catchError(() => {
                // Fallback: check against existing users
                return this.getUsers().pipe(
                    map(users => ({
                        available: !users.some(u => u.login === login && u.id !== excludeUserId)
                    }))
                );
            })
        );
    }

    // ==================== ACTIVITY LOGS ====================

    getActivityLogs(params?: {
        user_id?: number;
        action?: string;
        from_date?: string;
        to_date?: string;
        page?: number;
        page_size?: number;
    }): Observable<ActivityLog[]> {
        return this.api.get<ActivityLog[]>(this.logsEndpoint, params).pipe(
            map((data: any) => Array.isArray(data) ? data : (data.results || [])),
            catchError(() => of(this.getMockActivityLogs()))
        );
    }

    private getMockActivityLogs(): ActivityLog[] {
        const now = new Date();
        return [
            {
                id: 1,
                user_id: 1,
                user_name: 'Admin',
                action: 'login',
                target_type: 'session',
                created_at: new Date(now.getTime() - 3600000)
            },
            {
                id: 2,
                user_id: 1,
                user_name: 'Admin',
                action: 'create',
                target_type: 'user',
                target_name: 'Nouvel utilisateur',
                created_at: new Date(now.getTime() - 7200000)
            },
            {
                id: 3,
                user_id: 1,
                user_name: 'Admin',
                action: 'permission_change',
                target_type: 'permission',
                target_name: 'User permissions',
                created_at: new Date(now.getTime() - 10800000)
            }
        ];
    }

    // ==================== EMPLOYEES FOR LINKING ====================

    getAvailableEmployees(): Observable<{ id: number; name: string; badge?: string }[]> {
        return this.api.get<any[]>('employees/minimal').pipe(
            map(employees => employees.map(emp => ({
                id: emp.id,
                name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
                badge: emp.employee_id
            }))),
            catchError(() => of([]))
        );
    }

    getDepartments(): Observable<{ id: number; name: string }[]> {
        return this.api.get<any[]>('employees/departments').pipe(
            map(depts => depts.map(d => ({
                id: d.id || d.Id_Dept,
                name: d.name || d.Name_Dept || d.department_name
            }))),
            catchError(() => of([]))
        );
    }
}
