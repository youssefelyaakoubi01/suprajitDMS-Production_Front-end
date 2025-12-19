/**
 * DMS-RH Models - Transport
 * Domain: Human Resources Management
 */

import { Employee } from './employee.model';

// ==================== TRAJET ====================
export interface Trajet {
    id?: number;
    name: string;
    code: string;
    description?: string;
    cost?: number;
    // Legacy
    trajetID?: number;
    trajetName?: string;
}

// ==================== TRANSPORT PLANNING ====================
export interface TransportPlanning {
    id?: number;
    employee: number | Employee;
    date: Date;
    shift: number;
    trajet: number | Trajet;
    // Legacy
    Id_Planning?: number;
    Id_Emp?: number;
    datePlanning?: Date;
    typeHoraireID?: number;
    Employee?: Employee;
}

// ==================== TRANSPORT STATS ====================
export interface TransportStats {
    totalEmployees: number;
    byTrajet: { trajet: string; count: number; cost: number }[];
    totalCost: number;
}
