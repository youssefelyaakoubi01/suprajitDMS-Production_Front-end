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
}
