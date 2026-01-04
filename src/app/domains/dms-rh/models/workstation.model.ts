/**
 * DMS-RH Models - Workstation & Process
 * Domain: Human Resources Management
 */

// ==================== HR PROCESS ====================
export interface HRProcess {
    id: number;
    name: string;
    code: string;
    description?: string;
    is_active?: boolean;
}

// ==================== HR WORKSTATION ====================
export interface HRWorkstation {
    // Backend fields from production/workstations
    id: number;
    name: string;
    code: string;
    description?: string;
    production_line: number;
    production_line_name?: string;
    zone?: number;
    process_order?: number;
    process_mode?: 'manual' | 'semi_auto' | 'full_auto';
    typ_order?: string;
    cycle_time_seconds?: number;
    max_operators?: number;
    is_critical?: boolean;
    is_active?: boolean;
    machines_count?: number;
}

// ==================== PROCESS MODE ====================
export type ProcessMode = 'manual' | 'semi_auto' | 'full_auto';

export const ProcessModeLabels: Record<ProcessMode, string> = {
    manual: 'Manuel',
    semi_auto: 'Semi-automatique',
    full_auto: 'Automatique'
};
