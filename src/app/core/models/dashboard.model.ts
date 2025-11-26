export interface DashboardKPI {
    label: string;
    value: number;
    target: number;
    unit: string;
    trend: number;
    status: 'success' | 'warning' | 'danger';
    icon: string;
}

export interface ProductionLineStatus {
    id: number;
    name: string;
    project: string;
    projectId: number;
    status: 'running' | 'downtime' | 'setup' | 'maintenance';
    efficiency: number;
    output: number;
    target: number;
}

export interface OutputPerHour {
    hour: number;
    output: number;
    target: number;
}

export interface DowntimeAnalysis {
    category: string;
    total_minutes: number;
    count: number;
    percentage: number;
}

export interface DashboardSummary {
    total_output: number;
    total_target: number;
    efficiency: number;
    scrap_rate: number;
    total_downtime: number;
    running_lines: number;
    downtime_lines: number;
}
