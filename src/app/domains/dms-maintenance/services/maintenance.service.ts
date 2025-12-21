/**
 * DMS-Maintenance Service
 * Domain: Maintenance Operations Management
 */
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import {
    MaintenanceTicket,
    MaintenanceDowntime,
    PreventiveMaintenance,
    MaintenanceUser,
    MaintenanceStats,
    MaintenanceDashboardData,
    MaintenanceKPISummary,
    MaintenanceKPIData,
    ProductionKPIData,
    MaintenanceFilterOptions,
    TicketStatus,
    DateFilterType
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class DmsMaintenanceService {
    private readonly endpoint = 'maintenance';

    constructor(private api: ApiService) {}

    // ==================== TICKETS ====================
    getTickets(params?: {
        zone?: string;
        project?: string;
        productionLine?: string;
        status?: TicketStatus;
        dateFilter?: DateFilterType;
        startDate?: string;
        endDate?: string;
    }): Observable<MaintenanceTicket[]> {
        // Use downtimes/tickets/ endpoint (action on ViewSet)
        return this.api.get<any[]>(`${this.endpoint}/downtimes/tickets/`, params).pipe(
            map(tickets => this.mapTicketsResponse(tickets)),
            catchError(() => of(this.getMockTickets()))
        );
    }

    getOpenTickets(): Observable<MaintenanceTicket[]> {
        return this.api.get<any[]>(`${this.endpoint}/downtimes/open_tickets/`).pipe(
            map(tickets => this.mapTicketsResponse(tickets)),
            catchError(() => of(this.getMockTickets()))
        );
    }

    getTicket(id: number): Observable<MaintenanceTicket> {
        return this.api.get<any>(`${this.endpoint}/downtimes/${id}/`).pipe(
            map(ticket => this.mapSingleTicketResponse(ticket))
        );
    }

    createTicket(ticket: Partial<MaintenanceTicket>): Observable<MaintenanceTicket> {
        return this.api.post<any>(`${this.endpoint}/downtimes/`, this.mapTicketToBackend(ticket)).pipe(
            map(t => this.mapSingleTicketResponse(t))
        );
    }

    updateTicket(id: number, ticket: Partial<MaintenanceTicket>): Observable<MaintenanceTicket> {
        return this.api.put<any>(`${this.endpoint}/downtimes/${id}/`, this.mapTicketToBackend(ticket)).pipe(
            map(t => this.mapSingleTicketResponse(t))
        );
    }

    assignTicket(id: number, userId: string): Observable<MaintenanceTicket> {
        return this.api.post<any>(`${this.endpoint}/downtimes/${id}/start_intervention/`, { assigned_to: userId }).pipe(
            map(t => this.mapSingleTicketResponse(t))
        );
    }

    closeTicket(id: number, resolution: string): Observable<MaintenanceTicket> {
        return this.api.post<any>(`${this.endpoint}/downtimes/${id}/complete/`, { actions_taken: resolution }).pipe(
            map(t => this.mapSingleTicketResponse(t))
        );
    }

    // ==================== DASHBOARD ====================
    getDashboardData(params?: {
        zone?: string;
        status?: TicketStatus;
        dateFilter?: DateFilterType;
        startDate?: string;
        endDate?: string;
        days?: number;
    }): Observable<MaintenanceDashboardData> {
        return this.api.get<any>(`${this.endpoint}/dashboard/`, { days: params?.days || 30 }).pipe(
            map(data => this.mapDashboardResponse(data)),
            catchError(() => of(this.getMockDashboardData()))
        );
    }

    getTopProjects(limit: number = 3): Observable<{ name: string; value: number }[]> {
        return this.getDashboardData().pipe(
            map(data => data.topProjects.slice(0, limit))
        );
    }

    getTopMachines(limit: number = 3): Observable<{ name: string; value: number }[]> {
        return this.getDashboardData().pipe(
            map(data => data.topMachines.slice(0, limit))
        );
    }

    getTopEmployees(limit: number = 5): Observable<{ name: string; closedTickets: number }[]> {
        return this.getDashboardData().pipe(
            map(data => data.topEmployees.slice(0, limit))
        );
    }

    // ==================== KPI ====================
    getKPIData(params?: {
        productionLine?: string;
        zone?: string;
        startDate?: string;
        endDate?: string;
        weeks?: number;
    }): Observable<MaintenanceKPISummary> {
        const apiParams: any = {};
        if (params?.productionLine) apiParams.production_line = params.productionLine;
        if (params?.zone) apiParams.zone = params.zone;
        if (params?.weeks) apiParams.weeks = params.weeks;

        return this.api.get<any>(`${this.endpoint}/kpi/`, apiParams).pipe(
            map(data => this.mapKPIResponse(data)),
            catchError(() => of(this.getMockKPIData()))
        );
    }

    getWeeklyKPIs(weekNumber?: number): Observable<MaintenanceKPIData[]> {
        return this.getKPIData().pipe(
            map(data => data.weeks)
        );
    }

    // ==================== PRODUCTION KPI ====================
    getProductionKPIData(params?: {
        startDate?: string;
        endDate?: string;
        productionLine?: string;
    }): Observable<ProductionKPIData[]> {
        const apiParams: any = {};
        if (params?.productionLine) apiParams.production_line = params.productionLine;

        return this.api.get<any[]>(`${this.endpoint}/production-kpi/`, apiParams).pipe(
            map(data => this.mapProductionKPIResponse(data)),
            catchError(() => of(this.getMockProductionKPIData()))
        );
    }

    // ==================== DOWNTIME ====================
    getDowntimes(params?: {
        status?: string;
        startDate?: string;
        endDate?: string;
        workstation?: string;
    }): Observable<MaintenanceDowntime[]> {
        return this.api.get<MaintenanceDowntime[]>(`${this.endpoint}/downtimes`, params);
    }

    getDowntime(id: number): Observable<MaintenanceDowntime> {
        return this.api.get<MaintenanceDowntime>(`${this.endpoint}/downtimes/${id}`);
    }

    startIntervention(id: number, maintUserId: number): Observable<MaintenanceDowntime> {
        return this.api.post<MaintenanceDowntime>(`${this.endpoint}/downtimes/${id}/start`, {
            maint_user_id: maintUserId
        });
    }

    endIntervention(id: number, actions: string): Observable<MaintenanceDowntime> {
        return this.api.post<MaintenanceDowntime>(`${this.endpoint}/downtimes/${id}/end`, { actions });
    }

    // ==================== PREVENTIVE MAINTENANCE ====================
    getPreventiveMaintenances(params?: {
        status?: string;
        machine?: string;
        assignedTo?: number;
    }): Observable<PreventiveMaintenance[]> {
        return this.api.get<PreventiveMaintenance[]>(`${this.endpoint}/preventive`, params);
    }

    completePreventiveMaintenance(id: number): Observable<PreventiveMaintenance> {
        return this.api.post<PreventiveMaintenance>(`${this.endpoint}/preventive/${id}/complete`, {});
    }

    // ==================== MAINTENANCE USERS ====================
    getMaintenanceUsers(available?: boolean): Observable<MaintenanceUser[]> {
        const params = available !== undefined ? { available } : undefined;
        return this.api.get<MaintenanceUser[]>(`${this.endpoint}/users`, params);
    }

    // ==================== FILTER OPTIONS ====================
    getFilterOptions(): Observable<MaintenanceFilterOptions> {
        return this.api.get<any>(`${this.endpoint}/filter-options/`).pipe(
            map(data => ({
                zones: data.zones || [],
                projects: data.projects || [],
                productionLines: (data.production_lines || []).map((pl: any) => pl.name || pl),
                machines: data.machines || [],
                statuses: (data.statuses || ['Open', 'Closed', 'In Progress', 'Assigned']) as TicketStatus[]
            })),
            catchError(() => of({
                zones: ['Assembly', 'Die casting', 'Pressing', 'Cutting Wire', 'Winding Spiral'],
                projects: ['HBPO', 'Motor B10', 'Faurecia Pilsen', 'Adient PL', 'SEAT', 'Grammer', 'MQB', 'Q3', 'Witte DEP', 'BT', 'AUDI TB'],
                productionLines: ['HBPO Production Line 1', 'Motor B10 line 2', 'Faurecia Pilsen Production', 'Die casting 2nd side'],
                machines: ['ASSEMBLY', 'FTC-0004', 'MAB-0023', 'PNP-0011', 'TOX-0033', 'RSM-0010', 'ZMR-0002'],
                statuses: ['Open', 'Closed', 'In Progress', 'Assigned'] as TicketStatus[]
            }))
        );
    }

    // ==================== STATS ====================
    getMaintenanceStats(): Observable<MaintenanceStats> {
        return this.api.get<MaintenanceStats>(`${this.endpoint}/stats`);
    }

    // ==================== PRIVATE HELPERS ====================
    private mapTicketsResponse(data: any[]): MaintenanceTicket[] {
        return (data || []).map(item => this.mapSingleTicketResponse(item));
    }

    private mapSingleTicketResponse(item: any): MaintenanceTicket {
        return {
            Id_Ticket: item.id ?? item.id_ticket ?? item.Id_Ticket ?? 0,
            TicketNo: item.ticket_no ?? item.ticket_number ?? item.TicketNo ?? '',
            Zone: item.zone ?? item.zone_name ?? item.Zone ?? 'N/A',
            Project: item.project ?? item.project_name ?? item.Project ?? '',
            ProductionLine: item.production_line ?? item.production_line_name ?? item.ProductionLine ?? '',
            Workstation: item.workstation ?? item.workstation_name ?? item.Workstation ?? '',
            Machine: item.machine ?? item.machine_name ?? item.Machine ?? 'N/A',
            Description: item.description ?? item.cause ?? item.Description ?? '',
            Status: item.status ?? item.Status ?? 'Open',
            DowntimeStartsAt: new Date(item.downtime_starts_at ?? item.downtime_start ?? item.DowntimeStartsAt ?? new Date()),
            CreatedOn: new Date(item.created_on ?? item.created_at ?? item.CreatedOn ?? new Date()),
            AssignedTo: item.assigned_to ?? item.assigned_to_name ?? item.AssignedTo,
            AcceptedBy: item.accepted_by ?? item.AcceptedBy,
            ClosedAt: item.closed_at || item.intervention_end ? new Date(item.closed_at || item.intervention_end) : undefined,
            InterventionTime: item.intervention_time ?? item.intervention_duration ?? item.InterventionTime,
            ReactivityTime: item.reactivity_time ?? item.ReactivityTime,
            WaitingTime: item.waiting_time ?? item.WaitingTime,
            Causes: item.causes ?? item.cause ?? item.Causes,
            Actions: item.actions ?? item.actions_taken ?? item.Actions,
            Priority: item.priority
        };
    }

    private mapTicketToBackend(ticket: Partial<MaintenanceTicket>): any {
        return {
            workstation: ticket.Workstation,
            zone: ticket.Zone,
            cause: ticket.Description || ticket.Causes,
            priority: ticket.Priority || 'medium',
            downtime_start: ticket.DowntimeStartsAt?.toISOString(),
            actions_taken: ticket.Actions
        };
    }

    private mapDashboardResponse(data: any): MaintenanceDashboardData {
        return {
            topProjects: (data.top_projects?.labels || []).map((label: string, index: number) => ({
                name: label,
                value: data.top_projects?.data?.[index] || 0
            })),
            topMachines: (data.top_machines?.labels || []).map((label: string, index: number) => ({
                name: label,
                value: data.top_machines?.data?.[index] || 0
            })),
            topEmployees: (data.top_employees?.labels || []).map((label: string, index: number) => ({
                name: label,
                closedTickets: data.top_employees?.data?.[index] || 0
            })),
            downtimeList: (data.downtime_list || []).map((item: any) => ({
                id: item.id,
                ticketNo: item.ticket_no,
                ticket: item.ticket_no,
                zone: item.zone,
                project: item.project,
                impactedProject: item.project,
                productionLine: item.production_line,
                workstation: item.workstation,
                impactedMachine: item.workstation,
                description: item.description,
                status: item.status,
                downtimeMin: item.downtime_min,
                createdOn: item.created_on,
                createdAt: item.created_on,
                downtimeStartsAt: item.downtime_starts_at,
                closedAt: item.closed_at,
                assignedTo: item.assigned_to,
                acceptedBy: item.assigned_to,
                interventionTime: item.intervention_time,
                reactivityTime: item.reactivity_time,
                waitingTime: item.waiting_time
            }))
        };
    }

    private mapKPIResponse(data: any): MaintenanceKPISummary {
        return {
            weeks: (data.weeks || []).map((w: any) => ({
                weekNumber: w.weekNumber,
                totalDowntime: w.totalDowntime,
                downtimeMin: w.downtimeMin,
                downtimePercent: w.downtimePercent,
                downtimeTargetPercent: w.downtimeTargetPercent,
                mtbf: w.mtbf,
                mtbfTarget: w.mtbfTarget,
                mttrMin: w.mttrMin,
                mttrTarget: w.mttrTarget
            })),
            followUpDowntimePercent: data.weeklyDowntime || { labels: [], actual: [], target: [] },
            weeklyMTTR: data.weeklyMTTR || { labels: [], actual: [], target: [] },
            weeklyMTBF: data.weeklyMTBF || { labels: [], actual: [], target: [] }
        };
    }

    private mapProductionKPIResponse(data: any[]): ProductionKPIData[] {
        return (data || []).map(item => ({
            date: new Date(item.date),
            hp: item.hp,
            tempOuverture: item.tempOuverture ?? item.temp_ouverture,
            weekNumber: item.weekNumber ?? item.week_number
        }));
    }

    private getMockTickets(): MaintenanceTicket[] {
        const baseDate = new Date();
        return [
            {
                Id_Ticket: 63870, TicketNo: '63870', Zone: 'Assembly', Project: 'HBPO',
                ProductionLine: 'HBPO Production Line 1', Workstation: 'Die casting 640', Machine: 'ASSEMBLY',
                Description: 'panne', Status: 'Open', DowntimeStartsAt: new Date(baseDate.setHours(-2)),
                CreatedOn: new Date(baseDate.setHours(-1))
            },
            {
                Id_Ticket: 63869, TicketNo: '63869', Zone: 'Die casting', Project: 'Motor B10',
                ProductionLine: 'Motor B10 line 2', Workstation: 'die casting 2nd side', Machine: 'FTC-0004',
                Description: 'panne', Status: 'Open', DowntimeStartsAt: new Date(baseDate.setHours(-3)),
                CreatedOn: new Date(baseDate.setHours(-2))
            },
            {
                Id_Ticket: 63868, TicketNo: '63868', Zone: 'Assembly', Project: 'Faurecia Pilsen',
                ProductionLine: 'Faurecia Pilsen Production', Workstation: 'Prepressing', Machine: 'ASSEMBLY',
                Description: 'panne', Status: 'Open', DowntimeStartsAt: new Date(baseDate.setHours(-4)),
                CreatedOn: new Date(baseDate.setHours(-3))
            },
            {
                Id_Ticket: 63867, TicketNo: '63867', Zone: 'Assembly', Project: 'Adient PL',
                ProductionLine: 'Adient PL Production Line 1', Workstation: 'pressing 2', Machine: 'MAB-0023',
                Description: 'panne', Status: 'Open', DowntimeStartsAt: new Date(baseDate.setHours(-5)),
                CreatedOn: new Date(baseDate.setHours(-4))
            },
            {
                Id_Ticket: 63866, TicketNo: '63866', Zone: 'Assembly', Project: 'Motor B10',
                ProductionLine: 'Motor B10 LINE 1', Workstation: 'Prepressing', Machine: 'PNP-0011',
                Description: 'panne', Status: 'Closed', DowntimeStartsAt: new Date(baseDate.setHours(-6)),
                CreatedOn: new Date(baseDate.setHours(-5)), AssignedTo: 'SENHOUNI YASSINE',
                InterventionTime: 8, ReactivityTime: 1, WaitingTime: 9
            }
        ];
    }

    private getMockDashboardData(): MaintenanceDashboardData {
        return {
            topProjects: [
                { name: 'Grammer', value: 8000 },
                { name: 'Technoconfort', value: 3844 },
                { name: 'WITTE', value: 3726 },
                { name: 'Motor B10', value: 2096 },
                { name: 'MQB', value: 1500 }
            ],
            topMachines: [
                { name: 'ASSEMBLY', value: 5130 },
                { name: 'FTC-0004', value: 2770 },
                { name: 'ZM6-0001', value: 1430 },
                { name: 'ZM6-0005', value: 1786 },
                { name: 'ZM6-0003', value: 1200 }
            ],
            topEmployees: [
                { name: 'ZIAR Mohamed', closedTickets: 4459 },
                { name: 'DAHRI Abdellalif', closedTickets: 4209 },
                { name: 'EL HOUSSI Khalid', closedTickets: 2955 },
                { name: 'SENHOUNI YASSINE', closedTickets: 2893 }
            ],
            downtimeList: []
        };
    }

    private getMockKPIData(): MaintenanceKPISummary {
        return {
            weeks: [
                { weekNumber: 1, totalDowntime: 8247.38, downtimeMin: 1543636.50, downtimePercent: 5.00, downtimeTargetPercent: 3.00, mtbf: 50.00, mtbfTarget: 56.00, mttrMin: 3.86, mttrTarget: 25.00 },
                { weekNumber: 2, totalDowntime: 47024.11, downtimeMin: 2876042.00, downtimePercent: 5.00, downtimeTargetPercent: 3.00, mtbf: 56.00, mtbfTarget: 56.00, mttrMin: 35.00, mttrTarget: 25.00 },
                { weekNumber: 3, totalDowntime: 7396.87, downtimeMin: 643814.00, downtimePercent: 3.00, downtimeTargetPercent: 3.00, mtbf: 56.00, mtbfTarget: 56.00, mttrMin: 27.00, mttrTarget: 25.00 },
                { weekNumber: 4, totalDowntime: 1874.24, downtimeMin: 132458.00, downtimePercent: 3.00, downtimeTargetPercent: 3.00, mtbf: 56.00, mtbfTarget: 56.00, mttrMin: 18.00, mttrTarget: 25.00 },
                { weekNumber: 5, totalDowntime: 380, downtimeMin: 18000, downtimePercent: 2.00, downtimeTargetPercent: 3.00, mtbf: 58.00, mtbfTarget: 56.00, mttrMin: 10.00, mttrTarget: 25.00 }
            ],
            followUpDowntimePercent: {
                labels: ['W1', 'W2', 'W3', 'W4', 'W5'],
                actual: [5.00, 5.00, 3.00, 3.00, 2.00],
                target: [3.00, 3.00, 3.00, 3.00, 3.00]
            },
            weeklyMTTR: {
                labels: ['11', '14', '15', '18', '21', '23', '25', '28', '31', '1', '4', '8', '11', '15', '18', '22', '25'],
                actual: [236, 248, 0, 0, 0, 312, 0, 0, 57, 0, 0, 0, 0, 0, 15, 11, 25],
                target: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
            },
            weeklyMTBF: {
                labels: ['1', '6', '11', '18', '21', '31', '36', '41', '46', '51'],
                actual: [0, 0, 0, 0, 0, 1.91, 0, 0, 0, 0.28],
                target: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
            }
        };
    }

    private getMockProductionKPIData(): ProductionKPIData[] {
        return [
            { date: new Date('2024-07-09'), hp: 1411, tempOuverture: 588, weekNumber: 28 },
            { date: new Date('2024-07-02'), hp: 100, tempOuverture: 120, weekNumber: 27 },
            { date: new Date('2024-06-25'), hp: 200, tempOuverture: 500, weekNumber: 26 }
        ];
    }
}
