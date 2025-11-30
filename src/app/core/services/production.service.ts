import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
    Project,
    ProductionLine,
    Workstation,
    Machine,
    Part,
    Shift,
    HourlyProduction,
    Downtime,
    DowntimeProblem,
    TeamAssignment
} from '../models/production.model';

@Injectable({
    providedIn: 'root'
})
export class ProductionService {
    private readonly endpoint = 'production';

    constructor(private api: ApiService) {}

    // Projects
    getProjects(): Observable<Project[]> {
        return this.api.get<Project[]>(`${this.endpoint}/projects`);
    }

    getProject(id: number): Observable<Project> {
        return this.api.get<Project>(`${this.endpoint}/projects/${id}`);
    }

    createProject(project: Partial<Project>): Observable<Project> {
        return this.api.post<Project>(`${this.endpoint}/projects`, project);
    }

    updateProject(id: number, project: Partial<Project>): Observable<Project> {
        return this.api.put<Project>(`${this.endpoint}/projects/${id}`, project);
    }

    // Production Lines
    getProductionLines(projectId?: number): Observable<ProductionLine[]> {
        const params = projectId ? { project: projectId } : undefined;
        return this.api.get<ProductionLine[]>(`${this.endpoint}/lines`, params);
    }

    getProductionLine(id: number): Observable<ProductionLine> {
        return this.api.get<ProductionLine>(`${this.endpoint}/lines/${id}`);
    }

    // Workstations
    getWorkstations(lineId?: number): Observable<Workstation[]> {
        const params = lineId ? { production_line: lineId } : undefined;
        return this.api.get<Workstation[]>(`${this.endpoint}/workstations`, params);
    }

    getWorkstation(id: number): Observable<Workstation> {
        return this.api.get<Workstation>(`${this.endpoint}/workstations/${id}`);
    }

    // Machines
    getMachines(workstationId?: number): Observable<Machine[]> {
        const params = workstationId ? { workstation: workstationId } : undefined;
        return this.api.get<Machine[]>(`${this.endpoint}/machines`, params);
    }

    getMachinesByProductionLine(lineId: number): Observable<Machine[]> {
        return this.api.get<Machine[]>(`${this.endpoint}/machines/by_production_line`, { line_id: lineId });
    }

    getMachine(id: number): Observable<Machine> {
        return this.api.get<Machine>(`${this.endpoint}/machines/${id}`);
    }

    createMachine(machine: Partial<Machine>): Observable<Machine> {
        return this.api.post<Machine>(`${this.endpoint}/machines`, machine);
    }

    updateMachine(id: number, machine: Partial<Machine>): Observable<Machine> {
        return this.api.put<Machine>(`${this.endpoint}/machines/${id}`, machine);
    }

    deleteMachine(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/machines/${id}`);
    }

    updateMachineStatus(id: number, status: Machine['status']): Observable<Machine> {
        return this.api.post<Machine>(`${this.endpoint}/machines/${id}/update_status`, { status });
    }

    // Parts
    getParts(projectId?: number): Observable<Part[]> {
        const params = projectId ? { project: projectId } : undefined;
        return this.api.get<Part[]>(`${this.endpoint}/parts`, params);
    }

    getPart(id: number): Observable<Part> {
        return this.api.get<Part>(`${this.endpoint}/parts/${id}`);
    }

    // Shifts
    getShifts(): Observable<Shift[]> {
        return this.api.get<Shift[]>(`${this.endpoint}/shifts`);
    }

    getShiftsByProductionLine(productionLineId: number): Observable<Shift[]> {
        return this.api.get<Shift[]>(`${this.endpoint}/shifts/by_production_line`, { production_line: productionLineId });
    }

    getShift(id: number): Observable<Shift> {
        return this.api.get<Shift>(`${this.endpoint}/shifts/${id}`);
    }

    createShift(shift: Partial<Shift>): Observable<Shift> {
        return this.api.post<Shift>(`${this.endpoint}/shifts`, shift);
    }

    updateShift(id: number, shift: Partial<Shift>): Observable<Shift> {
        return this.api.put<Shift>(`${this.endpoint}/shifts/${id}`, shift);
    }

    deleteShift(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/shifts/${id}`);
    }

    // Hourly Production
    getHourlyProduction(params?: {
        date?: string;
        shift?: string;
        lineId?: number;
        partId?: number
    }): Observable<HourlyProduction[]> {
        return this.api.get<HourlyProduction[]>(`${this.endpoint}/hourly`, params);
    }

    getHourlyProductionById(id: number): Observable<HourlyProduction> {
        return this.api.get<HourlyProduction>(`${this.endpoint}/hourly/${id}`);
    }

    createHourlyProduction(data: Partial<HourlyProduction>): Observable<HourlyProduction> {
        return this.api.post<HourlyProduction>(`${this.endpoint}/hourly`, data);
    }

    updateHourlyProduction(id: number, data: Partial<HourlyProduction>): Observable<HourlyProduction> {
        return this.api.put<HourlyProduction>(`${this.endpoint}/hourly/${id}`, data);
    }

    deleteHourlyProduction(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/hourly/${id}`);
    }

    // Downtime
    getDowntimes(hourlyProdId?: number): Observable<Downtime[]> {
        const params = hourlyProdId ? { hourly_production: hourlyProdId } : undefined;
        return this.api.get<Downtime[]>(`${this.endpoint}/downtimes`, params);
    }

    getDowntime(id: number): Observable<Downtime> {
        return this.api.get<Downtime>(`${this.endpoint}/downtimes/${id}`);
    }

    createDowntime(downtime: Partial<Downtime>): Observable<Downtime> {
        return this.api.post<Downtime>(`${this.endpoint}/downtimes`, downtime);
    }

    updateDowntime(id: number, downtime: Partial<Downtime>): Observable<Downtime> {
        return this.api.patch<Downtime>(`${this.endpoint}/downtimes/${id}`, downtime);
    }

    deleteDowntime(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/downtimes/${id}`);
    }

    // Downtime Problems
    getDowntimeProblems(): Observable<DowntimeProblem[]> {
        return this.api.get<DowntimeProblem[]>(`${this.endpoint}/downtime-problems`);
    }

    // Team Assignments
    getTeamAssignments(hourlyProdId?: number): Observable<TeamAssignment[]> {
        const params = hourlyProdId ? { hourly_production: hourlyProdId } : undefined;
        return this.api.get<TeamAssignment[]>(`${this.endpoint}/team-assignments`, params);
    }

    createTeamAssignment(assignment: Partial<TeamAssignment>): Observable<TeamAssignment> {
        return this.api.post<TeamAssignment>(`${this.endpoint}/team-assignments`, assignment);
    }

    deleteTeamAssignment(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/team-assignments/${id}`);
    }
}
