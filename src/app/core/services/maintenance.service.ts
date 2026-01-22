import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface MaintenanceType {
    id: number;
    name: string;
    code: string;
    type: 'preventive' | 'corrective' | 'predictive' | 'emergency';
    description?: string;
    is_active: boolean;
}

export interface MaintenanceDowntime {
    id: number;
    ticket_number: string;
    workstation: number;
    workstation_name?: string;
    production_line_name?: string;
    maintenance_type: number;
    maintenance_type_name?: string;
    downtime_start: string;
    intervention_start?: string;
    intervention_end?: string;
    status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    cause?: string;
    actions_taken?: string;
    spare_parts_used?: string;
    assigned_to?: number;
    assigned_to_name?: string;
    reported_by?: number;
    reported_by_name?: string;
    downtime_duration?: number;
    intervention_duration?: number;
    created_at: string;
    updated_at: string;
}

export interface PreventiveMaintenance {
    PMID: number;
    EquipmentName: string;
    MaintenanceType: string;
    Frequency: string;
    LastMaintenanceDate?: string;
    NextMaintenanceDate: string;
    ResponsiblePerson?: string;
    Status: string;
}

export interface MaintenanceLog {
    LogID: number;
    DowntimeID?: number;
    PMID?: number;
    LogDate: string;
    TechnicianName: string;
    WorkPerformed: string;
    PartsUsed?: string;
    Duration: number;
    Cost?: number;
}

export interface DowntimeDeclaration {
    id: number;
    ticket_number: string;
    workstation: number;
    workstation_name?: string;
    workstation_code?: string;
    machine?: number;
    machine_name?: string;
    machine_code?: string;
    production_line: number;
    production_line_name?: string;
    production_line_code?: string;
    declaration_type: 'planned' | 'unplanned' | 'emergency';
    impact_level: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    description?: string;
    declared_at: string;
    expected_start?: string;
    expected_end?: string;
    actual_start?: string;
    actual_end?: string;
    declared_by?: number;
    declared_by_name?: string;
    acknowledged_by?: number;
    acknowledged_by_name?: string;
    assigned_technician?: number;
    assigned_technician_name?: string;
    status: 'declared' | 'acknowledged' | 'in_progress' | 'resolved' | 'cancelled';
    acknowledged_at?: string;
    resolution_notes?: string;
    maintenance_downtime?: number;
    downtime_duration?: number;
    waiting_time?: number;
    created_at: string;
    updated_at: string;
    // New fields for Declaration Details dialog
    project_name?: string;
    zone_name?: string;
    declaration_type_display?: string;
}

@Injectable({
    providedIn: 'root'
})
export class MaintenanceService {
    private readonly endpoint = 'maintenance';

    constructor(private api: ApiService) {}

    // Maintenance Types
    getMaintenanceTypes(): Observable<MaintenanceType[]> {
        return this.api.get<MaintenanceType[]>(`${this.endpoint}/types`);
    }

    // Maintenance Downtimes
    getDowntimes(params?: {
        startDate?: string;
        endDate?: string;
        workstation?: string;
        status?: string
    }): Observable<MaintenanceDowntime[]> {
        return this.api.get<MaintenanceDowntime[]>(`${this.endpoint}/downtimes`, params);
    }

    getDowntime(id: number): Observable<MaintenanceDowntime> {
        return this.api.get<MaintenanceDowntime>(`${this.endpoint}/downtimes/${id}`);
    }

    createDowntime(downtime: Partial<MaintenanceDowntime>): Observable<MaintenanceDowntime> {
        return this.api.post<MaintenanceDowntime>(`${this.endpoint}/downtimes`, downtime);
    }

    updateDowntime(id: number, downtime: Partial<MaintenanceDowntime>): Observable<MaintenanceDowntime> {
        return this.api.put<MaintenanceDowntime>(`${this.endpoint}/downtimes/${id}`, downtime);
    }

    // Preventive Maintenance
    getPreventiveMaintenance(params?: {
        equipment?: string;
        status?: string
    }): Observable<PreventiveMaintenance[]> {
        return this.api.get<PreventiveMaintenance[]>(`${this.endpoint}/preventive`, params);
    }

    getPreventiveMaintenanceItem(id: number): Observable<PreventiveMaintenance> {
        return this.api.get<PreventiveMaintenance>(`${this.endpoint}/preventive/${id}`);
    }

    createPreventiveMaintenance(pm: Partial<PreventiveMaintenance>): Observable<PreventiveMaintenance> {
        return this.api.post<PreventiveMaintenance>(`${this.endpoint}/preventive`, pm);
    }

    updatePreventiveMaintenance(id: number, pm: Partial<PreventiveMaintenance>): Observable<PreventiveMaintenance> {
        return this.api.put<PreventiveMaintenance>(`${this.endpoint}/preventive/${id}`, pm);
    }

    // Maintenance Logs
    getLogs(params?: {
        startDate?: string;
        endDate?: string;
        downtimeId?: number;
        pmId?: number
    }): Observable<MaintenanceLog[]> {
        return this.api.get<MaintenanceLog[]>(`${this.endpoint}/logs`, params);
    }

    createLog(log: Partial<MaintenanceLog>): Observable<MaintenanceLog> {
        return this.api.post<MaintenanceLog>(`${this.endpoint}/logs`, log);
    }

    // Delete downtime
    deleteDowntime(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/downtimes/${id}`);
    }

    // Start intervention
    startIntervention(id: number, assignedTo: number): Observable<MaintenanceDowntime> {
        return this.api.post<MaintenanceDowntime>(`${this.endpoint}/downtimes/${id}/start_intervention`, {
            assigned_to: assignedTo
        });
    }

    // Complete downtime
    completeDowntime(id: number, data: { actions_taken: string; spare_parts_used?: string; performed_by?: number }): Observable<MaintenanceDowntime> {
        return this.api.post<MaintenanceDowntime>(`${this.endpoint}/downtimes/${id}/complete`, data);
    }

    // Add log to downtime
    addLogToDowntime(id: number, data: { action: string; notes?: string; performed_by?: number }): Observable<MaintenanceLog> {
        return this.api.post<MaintenanceLog>(`${this.endpoint}/downtimes/${id}/add_log`, data);
    }

    // Get open tickets
    getOpenTickets(): Observable<MaintenanceDowntime[]> {
        return this.api.get<MaintenanceDowntime[]>(`${this.endpoint}/downtimes/open_tickets`);
    }

    // Get statistics
    getStatistics(days: number = 30): Observable<{
        total_tickets: number;
        completed: number;
        open: number;
        avg_resolution_time_minutes: number;
        by_type: { maintenance_type__name: string; count: number }[];
        by_status: { status: string; count: number }[];
    }> {
        return this.api.get(`${this.endpoint}/downtimes/statistics`, { days });
    }

    // ============================================
    // Downtime Declarations (Notifications to Technicians)
    // ============================================

    getDeclarations(params?: {
        workstation?: number;
        production_line?: number;
        status?: string;
        declaration_type?: string;
        impact_level?: string;
        assigned_technician?: number;
    }): Observable<DowntimeDeclaration[]> {
        return this.api.get<DowntimeDeclaration[]>(`${this.endpoint}/declarations`, params);
    }

    getDeclaration(id: number): Observable<DowntimeDeclaration> {
        return this.api.get<DowntimeDeclaration>(`${this.endpoint}/declarations/${id}`);
    }

    createDeclaration(declaration: {
        workstation: number;
        machine?: number;
        production_line: number;
        declaration_type: string;
        impact_level: string;
        reason: string;
        description?: string;
        expected_start?: string;
        expected_end?: string;
        declared_by?: number;
    }): Observable<DowntimeDeclaration> {
        return this.api.post<DowntimeDeclaration>(`${this.endpoint}/declarations`, declaration);
    }

    updateDeclaration(id: number, declaration: Partial<DowntimeDeclaration>): Observable<DowntimeDeclaration> {
        return this.api.put<DowntimeDeclaration>(`${this.endpoint}/declarations/${id}`, declaration);
    }

    deleteDeclaration(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/declarations/${id}`);
    }

    // Get pending declarations (not yet acknowledged)
    getPendingDeclarations(): Observable<DowntimeDeclaration[]> {
        return this.api.get<DowntimeDeclaration[]>(`${this.endpoint}/declarations/pending`);
    }

    // Get active declarations (declared, acknowledged, or in progress)
    getActiveDeclarations(): Observable<DowntimeDeclaration[]> {
        return this.api.get<DowntimeDeclaration[]>(`${this.endpoint}/declarations/active`);
    }

    // Get declarations assigned to a specific technician
    getDeclarationsForTechnician(technicianId: number): Observable<DowntimeDeclaration[]> {
        return this.api.get<DowntimeDeclaration[]>(`${this.endpoint}/declarations/for_technician`, {
            technician_id: technicianId
        });
    }

    // Acknowledge a declaration
    acknowledgeDeclaration(id: number, data: {
        acknowledged_by: number;
        assigned_technician?: number;
    }): Observable<DowntimeDeclaration> {
        return this.api.post<DowntimeDeclaration>(`${this.endpoint}/declarations/${id}/acknowledge`, data);
    }

    // Start working on a declaration
    startWorkOnDeclaration(id: number, assignedTechnician: number): Observable<DowntimeDeclaration> {
        return this.api.post<DowntimeDeclaration>(`${this.endpoint}/declarations/${id}/start_work`, {
            assigned_technician: assignedTechnician
        });
    }

    // Resolve a declaration
    resolveDeclaration(id: number, resolutionNotes: string): Observable<DowntimeDeclaration> {
        return this.api.post<DowntimeDeclaration>(`${this.endpoint}/declarations/${id}/resolve`, {
            resolution_notes: resolutionNotes
        });
    }

    // Cancel a declaration
    cancelDeclaration(id: number, reason: string): Observable<DowntimeDeclaration> {
        return this.api.post<DowntimeDeclaration>(`${this.endpoint}/declarations/${id}/cancel`, {
            reason: reason
        });
    }

    // Get declaration statistics
    getDeclarationStatistics(days: number = 30): Observable<{
        total: number;
        by_status: { status: string; count: number }[];
        by_type: { declaration_type: string; count: number }[];
        by_impact: { impact_level: string; count: number }[];
        by_production_line: { production_line__name: string; count: number }[];
        avg_waiting_time_minutes: number;
        avg_downtime_minutes: number;
    }> {
        return this.api.get(`${this.endpoint}/declarations/statistics`, { days });
    }
}
