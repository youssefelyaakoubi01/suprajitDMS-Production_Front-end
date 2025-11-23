export interface KPI {
    label: string;
    value: number;
    target: number;
    unit: string;
    trend: number;
    status: 'success' | 'warning' | 'danger';
    icon: string;
}

export interface KPIIndicator {
    id: number;
    name: string;
    category: string;
    value: number;
    target: number;
    unit: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    responsibleId: number;
    departmentId: number;
}

export interface MonthlyKPIInput {
    id: number;
    indicatorId: number;
    month: Date;
    value: number;
    comment?: string;
    enteredBy: number;
    enteredAt: Date;
}

export interface ActionPlan {
    id: number;
    indicatorId: number;
    issue: string;
    rootCause: string;
    action: string;
    responsibleId: number;
    dueDate: Date;
    status: 'open' | 'in_progress' | 'completed' | 'overdue';
    completedDate?: Date;
}
