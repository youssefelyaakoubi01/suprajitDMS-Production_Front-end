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
    id_workstation: number;
    desc_workstation: string;
    id_process: number;
    Id_ProdLine: number;
    id_machine?: number;
    kpi_index?: number;
    id_formation?: number;
    processIndex?: number;
    Process?: HRProcess;
    // Enhanced fields
    process_mode?: 'manual' | 'semi_auto' | 'full_auto';
    typ_order?: string;
    cycle_time_seconds?: number;
    max_operators?: number;
    is_critical?: boolean;
    description?: string;
}

// ==================== PROCESS MODE ====================
export type ProcessMode = 'manual' | 'semi_auto' | 'full_auto';

export const ProcessModeLabels: Record<ProcessMode, string> = {
    manual: 'Manuel',
    semi_auto: 'Semi-automatique',
    full_auto: 'Automatique'
};
