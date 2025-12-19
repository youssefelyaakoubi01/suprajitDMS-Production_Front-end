/**
 * DMS-RH Models - Formation
 * Domain: Human Resources Management
 */

import { Employee } from './employee.model';

// ==================== FORMATION ====================
export interface Formation {
    id: number;
    name: string;
    type: string;
    process: number;
    process_name?: string;
    duration_hours?: number;
    description?: string;
    is_active?: boolean;
    created_at?: string;
}

// ==================== FORMATION TYPE ====================
export type FormationType = 'initial' | 'continuous' | 'recyclage' | 'certification';

export const FormationTypeLabels: Record<FormationType, string> = {
    initial: 'Formation initiale',
    continuous: 'Formation continue',
    recyclage: 'Recyclage',
    certification: 'Certification'
};

// ==================== FORMATION PLAN ====================
export interface FormationPlan {
    Id_Plan: number;
    id_formation: number;
    Id_Emp: number;
    planned_date: Date;
    status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
    TrainerID?: number;
    notes?: string;
    Formation?: Formation;
    Employee?: Employee;
}

// ==================== FORMATEUR ====================
export interface Formateur {
    id?: number;
    name: string;
    email?: string;
    phone?: string;
    specialization?: string;
    is_active?: boolean;
    // Legacy
    TrainerID?: number;
    Name?: string;
    login?: string;
    password?: string;
    Status?: string;
    IsAdmin?: boolean;
    LastModified?: Date;
    Email?: string;
}

// ==================== TRAINER SPECIALIZATION ====================
export interface TrainerSpecialization {
    id: number;
    name: string;
    description?: string;
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

// ==================== FORMATION STATS ====================
export interface FormationStats {
    totalFormations: number;
    plannedFormations: number;
    completedFormations: number;
    formationsByType: { type: string; count: number }[];
    upcomingFormations: FormationPlan[];
}
