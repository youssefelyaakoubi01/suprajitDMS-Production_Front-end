/**
 * DMS-RH Models - Dashboard
 * Domain: Human Resources Management
 */

import { Employee } from './employee.model';
import { FormationPlan } from './formation.model';

// ==================== HR DASHBOARD STATS ====================
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
    // Non-qualified assignments tracking
    nonQualifiedAssignmentsActive: number;
    nonQualifiedAssignmentsTotal: number;
}

// ==================== HR KPI ====================
export interface HRKpi {
    label: string;
    value: number;
    target?: number;
    unit?: string;
    trend?: number;
    status: 'success' | 'warning' | 'danger';
    icon: string;
}

// ==================== HR ALERTS ====================
export interface HRAlert {
    id: number;
    type: 'recyclage' | 'license' | 'formation' | 'attendance';
    severity: 'info' | 'warning' | 'danger';
    message: string;
    employeeId?: number;
    employeeName?: string;
    dueDate?: Date;
    isRead: boolean;
    createdAt: Date;
}

// ==================== QUICK STATS ====================
export interface HRQuickStats {
    presentToday: number;
    absentToday: number;
    onLeave: number;
    pendingFormations: number;
    expiringLicenses: number;
    recyclageRequired: number;
}
