/**
 * DMS-Analytics Models - KPI
 * Domain: Analytics & Reporting
 */

// ==================== KPI ====================
export interface KPI {
    label: string;
    value: number;
    target: number;
    unit: string;
    trend: number;
    status: KPIStatus;
    icon: string;
}

// ==================== KPI INDICATOR ====================
export interface KPIIndicator {
    id: number;
    name: string;
    category: string;
    value: number;
    target: number;
    unit: string;
    frequency: KPIFrequency;
    responsibleId: number;
    departmentId: number;
}

// ==================== MONTHLY KPI INPUT ====================
export interface MonthlyKPIInput {
    id: number;
    indicatorId: number;
    month: Date;
    value: number;
    comment?: string;
    enteredBy: number;
    enteredAt: Date;
}

// ==================== ACTION PLAN ====================
export interface ActionPlan {
    id: number;
    indicatorId: number;
    issue: string;
    rootCause: string;
    action: string;
    responsibleId: number;
    dueDate: Date;
    status: ActionPlanStatus;
    completedDate?: Date;
}

// ==================== ENUMS & TYPES ====================
export type KPIStatus = 'success' | 'warning' | 'danger';
export type KPIFrequency = 'daily' | 'weekly' | 'monthly';
export type ActionPlanStatus = 'open' | 'in_progress' | 'completed' | 'overdue';

export const KPIStatusLabels: Record<KPIStatus, string> = {
    success: 'Objectif atteint',
    warning: 'Attention',
    danger: 'Critique'
};

export const KPIStatusColors: Record<KPIStatus, string> = {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
};

export const FrequencyLabels: Record<KPIFrequency, string> = {
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel'
};

export const ActionPlanStatusLabels: Record<ActionPlanStatus, string> = {
    open: 'Ouvert',
    in_progress: 'En cours',
    completed: 'Terminé',
    overdue: 'En retard'
};

// ==================== KPI DASHBOARD ====================
export interface KPIDashboard {
    kpis: KPI[];
    indicators: KPIIndicator[];
    actionPlans: ActionPlan[];
    trends: KPITrend[];
}

export interface KPITrend {
    indicatorId: number;
    indicatorName: string;
    data: { date: string; value: number; target: number }[];
}
