/**
 * DMS-RH Models - Qualification
 * Domain: Human Resources Management
 */

import { Employee } from './employee.model';
import { Formation } from './formation.model';
import { HRWorkstation } from './workstation.model';

// ==================== QUALIFICATION ====================
export interface Qualification {
    id_qualif: number;
    start_qualif: Date;
    end_qualif: Date;
    id_formation: number;
    test?: string;
    test_result: string;
    Id_Emp: number;
    Trainer: number;
    comment_qualif?: string;
    prodline?: string;
    Id_Project: number;
    createdby?: string;
    createddate?: Date;
    changedby?: string;
    changeddate?: Date;
    // Joined fields
    Employee?: Employee;
    Formation?: Formation;
    TrainerName?: string;
}

// ==================== QUALIFICATION LEVEL ====================
export type QualificationLevel = 0 | 1 | 2 | 3 | 4;

export const QualificationLevelLabels: Record<QualificationLevel, string> = {
    0: 'Non qualifié',
    1: 'En formation',
    2: 'Sous supervision',
    3: 'Autonome',
    4: 'Expert/Formateur'
};

export const QualificationLevelColors: Record<QualificationLevel, string> = {
    0: '#EF4444', // danger
    1: '#F59E0B', // warning
    2: '#3B82F6', // info
    3: '#10B981', // success
    4: '#8B5CF6'  // purple
};

// ==================== VERSATILITY ====================
export interface VersatilityCell {
    employeeId: number;
    workstationId: number;
    level: QualificationLevel;
    qualificationId?: number;
}

export interface VersatilityMatrix {
    employees: Employee[];
    workstations: HRWorkstation[];
    cells: VersatilityCell[];
}

// ==================== RECYCLAGE (RETRAINING) ====================
export interface RecyclageEmployee {
    Id_Emp: number;
    Employee: Employee;
    DateEmbauche_Emp: Date;
    daysUntilRecyclage: number;
    isOverdue: boolean;
    lastQualificationDate?: Date;
    requiresRecyclage: boolean;
}

export interface RecyclageNotification {
    Id_Notification: number;
    Id_Emp: number;
    notificationDate: Date;
    notificationType: 'warning' | 'due' | 'overdue';
    isRead: boolean;
    Employee?: Employee;
}
