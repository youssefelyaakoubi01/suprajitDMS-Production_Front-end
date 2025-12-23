/**
 * DMS-Production Service
 * Domain: Production Management
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    Project,
    ProductionLine,
    Workstation,
    Machine,
    Part,
    Shift,
    HourlyProduction,
    TeamAssignment,
    ProductionDashboardStats,
    HourlyOutputData,
    PartLineAssignment,
    HeadcountRequirement
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class DmsProductionService {
    private readonly endpoint = 'production';

    constructor(private api: ApiService) {}

    // ==================== PROJECTS ====================
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

    // ==================== PRODUCTION LINES ====================
    getProductionLines(projectId?: number): Observable<ProductionLine[]> {
        const params = projectId ? { project: projectId } : undefined;
        return this.api.get<ProductionLine[]>(`${this.endpoint}/lines`, params);
    }

    getProductionLine(id: number): Observable<ProductionLine> {
        return this.api.get<ProductionLine>(`${this.endpoint}/lines/${id}`);
    }

    createProductionLine(line: Partial<ProductionLine>): Observable<ProductionLine> {
        return this.api.post<ProductionLine>(`${this.endpoint}/lines`, line);
    }

    updateProductionLine(id: number, line: Partial<ProductionLine>): Observable<ProductionLine> {
        return this.api.put<ProductionLine>(`${this.endpoint}/lines/${id}`, line);
    }

    // ==================== WORKSTATIONS ====================
    getWorkstations(lineId?: number): Observable<Workstation[]> {
        const params = lineId ? { production_line: lineId } : undefined;
        return this.api.get<Workstation[]>(`${this.endpoint}/workstations`, params);
    }

    getWorkstation(id: number): Observable<Workstation> {
        return this.api.get<Workstation>(`${this.endpoint}/workstations/${id}`);
    }

    createWorkstation(workstation: Partial<Workstation>): Observable<Workstation> {
        return this.api.post<Workstation>(`${this.endpoint}/workstations`, workstation);
    }

    updateWorkstation(id: number, workstation: Partial<Workstation>): Observable<Workstation> {
        return this.api.put<Workstation>(`${this.endpoint}/workstations/${id}`, workstation);
    }

    // ==================== MACHINES ====================
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

    // ==================== PARTS ====================
    getParts(projectId?: number): Observable<Part[]> {
        const params = projectId ? { project: projectId } : undefined;
        return this.api.get<Part[]>(`${this.endpoint}/parts`, params);
    }

    getPart(id: number): Observable<Part> {
        return this.api.get<Part>(`${this.endpoint}/parts/${id}`);
    }

    createPart(part: Partial<Part>): Observable<Part> {
        return this.api.post<Part>(`${this.endpoint}/parts`, part);
    }

    updatePart(id: number, part: Partial<Part>): Observable<Part> {
        return this.api.put<Part>(`${this.endpoint}/parts/${id}`, part);
    }

    // ==================== SHIFTS ====================
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

    // ==================== HOURLY PRODUCTION ====================
    getHourlyProduction(params?: {
        date?: string;
        shift?: string;
        lineId?: number;
        partId?: number;
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

    patchHourlyProductionShiftType(hourlyProductionId: number, shiftTypeId: number): Observable<HourlyProduction> {
        return this.api.patch<HourlyProduction>(`${this.endpoint}/hourly/${hourlyProductionId}`, { shift_type: shiftTypeId });
    }

    // ==================== TEAM ASSIGNMENTS ====================
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

    // ==================== DASHBOARD ====================
    getDashboardStats(params?: { date?: string; shift?: string }): Observable<ProductionDashboardStats> {
        return this.api.get<ProductionDashboardStats>(`${this.endpoint}/dashboard/stats`, params);
    }

    getHourlyOutputData(params?: { date?: string; shift?: string; lineId?: number }): Observable<HourlyOutputData[]> {
        return this.api.get<HourlyOutputData[]>(`${this.endpoint}/dashboard/hourly-output`, params);
    }

    // ==================== PRODUCTION LINES BY PROJECT ====================
    getProductionLinesByProject(projectId: number): Observable<ProductionLine[]> {
        return this.api.get<ProductionLine[]>(`${this.endpoint}/lines`, { project: projectId });
    }

    // ==================== PARTS BY PROJECT ====================
    getPartsByProject(projectId: number): Observable<Part[]> {
        return this.api.get<Part[]>(`${this.endpoint}/parts`, { project: projectId });
    }

    // ==================== SAVE METHODS ====================
    saveHourlyProduction(data: HourlyProduction): Observable<HourlyProduction> {
        if (data.Id_HourlyProd) {
            return this.updateHourlyProduction(data.Id_HourlyProd, data);
        }
        return this.createHourlyProduction(data);
    }

    // ==================== DOWNTIME ====================
    getDowntimes(params?: { date?: string; lineId?: number }): Observable<any[]> {
        return this.api.get<any[]>(`${this.endpoint}/downtimes`, params);
    }

    getDowntimesByHourlyProduction(hourlyProdId: number): Observable<any[]> {
        return this.api.get<any[]>(`${this.endpoint}/downtimes`, { hourly_production: hourlyProdId });
    }

    getDowntimeProblems(): Observable<any[]> {
        return this.api.get<any[]>(`${this.endpoint}/downtime-problems`);
    }

    saveDowntime(downtime: any): Observable<any> {
        if (downtime.Id_Downtime) {
            return this.api.put<any>(`${this.endpoint}/downtimes/${downtime.Id_Downtime}`, downtime);
        }
        return this.api.post<any>(`${this.endpoint}/downtimes`, downtime);
    }

    updateDowntime(id: number, downtime: any): Observable<any> {
        return this.api.put<any>(`${this.endpoint}/downtimes/${id}`, downtime);
    }

    deleteDowntime(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/downtimes/${id}`);
    }

    // ==================== PARTS BY PRODUCTION LINE ====================
    /**
     * Get parts assigned to a specific production line via PartLineAssignment
     * Falls back to project-based filtering if no assignments exist
     */
    getPartsByProductionLine(lineId: number): Observable<Part[]> {
        return this.api.get<Part[]>(`${this.endpoint}/parts/by_production_line`, { line_id: lineId });
    }

    // ==================== PART-LINE ASSIGNMENTS ====================
    getPartLineAssignments(params?: {
        part?: number;
        production_line?: number;
        is_active?: boolean;
        is_primary?: boolean;
    }): Observable<PartLineAssignment[]> {
        return this.api.get<PartLineAssignment[]>(`${this.endpoint}/part-line-assignments`, params);
    }

    getPartLineAssignment(id: number): Observable<PartLineAssignment> {
        return this.api.get<PartLineAssignment>(`${this.endpoint}/part-line-assignments/${id}`);
    }

    createPartLineAssignment(assignment: Partial<PartLineAssignment>): Observable<PartLineAssignment> {
        return this.api.post<PartLineAssignment>(`${this.endpoint}/part-line-assignments`, assignment);
    }

    updatePartLineAssignment(id: number, assignment: Partial<PartLineAssignment>): Observable<PartLineAssignment> {
        return this.api.patch<PartLineAssignment>(`${this.endpoint}/part-line-assignments/${id}`, assignment);
    }

    deletePartLineAssignment(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/part-line-assignments/${id}`);
    }

    // ==================== HEADCOUNT REQUIREMENTS ====================
    getHeadcountRequirements(params?: {
        production_line?: number;
        part?: number;
        shift_type?: number;
        is_active?: boolean;
    }): Observable<HeadcountRequirement[]> {
        return this.api.get<HeadcountRequirement[]>(`${this.endpoint}/headcount-requirements`, params);
    }

    getHeadcountRequirement(id: number): Observable<HeadcountRequirement> {
        return this.api.get<HeadcountRequirement>(`${this.endpoint}/headcount-requirements/${id}`);
    }

    createHeadcountRequirement(requirement: Partial<HeadcountRequirement>): Observable<HeadcountRequirement> {
        return this.api.post<HeadcountRequirement>(`${this.endpoint}/headcount-requirements`, requirement);
    }

    updateHeadcountRequirement(id: number, requirement: Partial<HeadcountRequirement>): Observable<HeadcountRequirement> {
        return this.api.patch<HeadcountRequirement>(`${this.endpoint}/headcount-requirements/${id}`, requirement);
    }

    deleteHeadcountRequirement(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/headcount-requirements/${id}`);
    }
}
