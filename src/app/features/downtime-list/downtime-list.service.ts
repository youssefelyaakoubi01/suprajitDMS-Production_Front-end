import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DowntimeTicket, Zone, Machine } from '../../core/models';
import { ApiService } from '../../core/services/api.service';

export interface ProductionDowntime {
    id: number;
    hourly_production_id: number;
    problem: number;
    problem_name?: string;
    problem_category?: string;
    duration: number;
    comment: string;
    status: 'open' | 'in_progress' | 'closed';
    resolution: string;
    assigned_to?: string;
    closed_at: string | null;
    leader_confirmed_at: string | null;
    created_at: string;
    updated_at: string;
    // Related data from hourly_production
    date?: string;
    shift_name?: string;
    hour?: number;
    production_line_name?: string;
    part_number?: string;
}

@Injectable({
    providedIn: 'root'
})
export class DowntimeListService {

    constructor(private api: ApiService) {}

    /**
     * Get all production downtimes from the API
     */
    getDowntimeTickets(): Observable<DowntimeTicket[]> {
        return this.api.get<any>('production/downtimes/').pipe(
            map((response: any) => {
                const downtimes = response.results || response;
                return downtimes.map((d: ProductionDowntime) => this.mapToDowntimeTicket(d));
            })
        );
    }

    /**
     * Get a single downtime by ID
     */
    getTicket(id: number): Observable<DowntimeTicket> {
        return this.api.get<ProductionDowntime>(`production/downtimes/${id}`).pipe(
            map((d: ProductionDowntime) => this.mapToDowntimeTicket(d))
        );
    }

    /**
     * Create a new downtime
     */
    createTicket(ticket: Partial<DowntimeTicket>): Observable<DowntimeTicket> {
        const apiData = this.mapToApiFormat(ticket);
        return this.api.post<ProductionDowntime>('production/downtimes/', apiData).pipe(
            map((d: ProductionDowntime) => this.mapToDowntimeTicket(d))
        );
    }

    /**
     * Update an existing downtime
     */
    updateTicket(ticketId: number, data: Partial<DowntimeTicket>): Observable<DowntimeTicket> {
        const apiData = this.mapToApiFormat(data);
        console.log('updateTicket - Sending PATCH to:', `production/downtimes/${ticketId}`, 'with data:', apiData);
        return this.api.patch<ProductionDowntime>(`production/downtimes/${ticketId}`, apiData).pipe(
            map((d: ProductionDowntime) => this.mapToDowntimeTicket(d))
        );
    }

    /**
     * Update only duration and comment (safe update)
     */
    updateTicketBasic(ticketId: number, duration: number, comment: string): Observable<DowntimeTicket> {
        const apiData = { duration, comment };
        console.log('updateTicketBasic - Sending PATCH to:', `production/downtimes/${ticketId}`, 'with data:', apiData);
        return this.api.patch<ProductionDowntime>(`production/downtimes/${ticketId}`, apiData).pipe(
            map((d: ProductionDowntime) => this.mapToDowntimeTicket(d))
        );
    }

    /**
     * Delete a downtime
     */
    deleteTicket(ticketId: number): Observable<void> {
        return this.api.delete<void>(`production/downtimes/${ticketId}`);
    }

    /**
     * Close a ticket with resolution using the dedicated endpoint
     */
    closeTicket(ticketId: number, resolution: string): Observable<DowntimeTicket> {
        return this.api.post<ProductionDowntime>(`production/downtimes/${ticketId}/close`, {
            resolution: resolution
        }).pipe(
            map((d: ProductionDowntime) => this.mapToDowntimeTicket(d))
        );
    }

    /**
     * Leader confirms the closure of a downtime
     */
    confirmClose(ticketId: number): Observable<DowntimeTicket> {
        return this.api.post<ProductionDowntime>(`production/downtimes/${ticketId}/leader_confirm`, {}).pipe(
            map((d: ProductionDowntime) => this.mapToDowntimeTicket(d))
        );
    }

    /**
     * Get zones from production API (projects)
     */
    getZones(): Observable<Zone[]> {
        return this.api.get<any>('production/projects/').pipe(
            map((response: any) => {
                const projects = response.results || response;
                return projects.map((p: any) => ({
                    Id_Zone: p.id,
                    Name_Zone: p.name,
                    Code_Zone: p.code
                }));
            })
        );
    }

    /**
     * Get machines (workstations) from production API
     */
    getMachines(): Observable<Machine[]> {
        return this.api.get<any>('production/workstations/').pipe(
            map((response: any) => {
                const workstations = response.results || response;
                return workstations.map((w: any) => ({
                    Id_Machine: w.id,
                    Name_Machine: w.name,
                    Code_Machine: w.code,
                    Id_Zone: w.production_line,
                    Id_Project: w.production_line
                }));
            })
        );
    }

    /**
     * Get downtime problems
     */
    getDowntimeProblems(): Observable<any[]> {
        return this.api.get<any>('production/downtime-problems/').pipe(
            map((response: any) => response.results || response)
        );
    }

    // ==================== MAPPING FUNCTIONS ====================

    /**
     * Map API response to frontend DowntimeTicket format
     */
    private mapToDowntimeTicket(d: ProductionDowntime): DowntimeTicket {
        return {
            Id_DowntimeTicket: d.id,
            TicketNo: `DT-${String(d.id).padStart(6, '0')}`,
            Zone: d.production_line_name || 'Production',
            ImpactedProject: d.production_line_name || 'Unknown',
            ImpactedMachine: d.part_number || 'Unknown',
            Status: this.mapStatusFromApi(d.status),
            DowntimeStartsAt: new Date(d.created_at),
            TicketCreatedAt: new Date(d.created_at),
            ClosedAt: d.closed_at ? new Date(d.closed_at) : null,
            AssignedTo: d.assigned_to || 'Production Team',
            AssignedToId: 0,
            LeaderConfirmeClosedAt: d.leader_confirmed_at ? new Date(d.leader_confirmed_at) : null,
            Description: d.problem_name || 'Downtime Issue',
            Priority: this.mapCategoryToPriority(d.problem_category),
            DowntimeDuration: d.duration || 0,
            Resolution: d.resolution || null
        };
    }

    /**
     * Map API status to frontend status
     */
    private mapStatusFromApi(status: string): 'Open' | 'In Progress' | 'Closed' {
        switch (status) {
            case 'open':
                return 'Open';
            case 'in_progress':
                return 'In Progress';
            case 'closed':
                return 'Closed';
            default:
                return 'Open';
        }
    }

    /**
     * Map frontend format to API format
     * Note: status is excluded because it should be changed via close/reopen endpoints
     */
    private mapToApiFormat(ticket: Partial<DowntimeTicket>): any {
        const apiData: any = {};

        if (ticket.DowntimeDuration !== undefined && ticket.DowntimeDuration !== null) {
            apiData.duration = ticket.DowntimeDuration;
        }
        if (ticket.Description !== undefined && ticket.Description !== null) {
            apiData.comment = ticket.Description;
        }
        if (ticket.Resolution !== undefined) {
            apiData.resolution = ticket.Resolution || '';
        }
        // Map AssignedTo (string) to assigned_to for the backend
        if (ticket.AssignedTo !== undefined) {
            apiData.assigned_to = ticket.AssignedTo || '';
        }
        // Don't include status in PATCH - use dedicated endpoints for status changes
        // if (ticket.Status !== undefined && ticket.Status !== null) {
        //     apiData.status = this.mapStatusToApi(ticket.Status);
        // }

        console.log('mapToApiFormat - Input:', ticket);
        console.log('mapToApiFormat - Output:', apiData);

        return apiData;
    }

    /**
     * Map frontend status to API status
     */
    private mapStatusToApi(status: 'Open' | 'In Progress' | 'Closed'): string {
        switch (status) {
            case 'Open':
                return 'open';
            case 'In Progress':
                return 'in_progress';
            case 'Closed':
                return 'closed';
            default:
                return 'open';
        }
    }

    /**
     * Map problem category to priority
     */
    private mapCategoryToPriority(category?: string): 'Low' | 'Medium' | 'High' | 'Critical' {
        switch (category?.toLowerCase()) {
            case 'mechanical':
            case 'electrical':
                return 'High';
            case 'quality':
                return 'Critical';
            case 'material':
            case 'manpower':
                return 'Medium';
            default:
                return 'Low';
        }
    }
}
