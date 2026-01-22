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
    ShiftType,
    Zone,
    ZoneType,
    HourlyProduction,
    Downtime,
    DowntimeProblem,
    TeamAssignment,
    PartLineAssignment,
    HeadcountRequirement
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

    deleteProject(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/projects/${id}`);
    }

    // Production Lines
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
        return this.api.patch<ProductionLine>(`${this.endpoint}/lines/${id}`, line);
    }

    deleteProductionLine(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/lines/${id}`);
    }

    // Workstations
    getWorkstations(lineId?: number, projectId?: number): Observable<Workstation[]> {
        const params: any = {};
        if (lineId) {
            params.production_line = lineId;
        }
        if (projectId) {
            params.project = projectId;
        }
        return this.api.get<Workstation[]>(`${this.endpoint}/workstations`, Object.keys(params).length ? params : undefined);
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

    deleteWorkstation(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/workstations/${id}`);
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

    createPart(part: Partial<Part>): Observable<Part> {
        return this.api.post<Part>(`${this.endpoint}/parts`, part);
    }

    updatePart(id: number, part: Partial<Part>): Observable<Part> {
        return this.api.patch<Part>(`${this.endpoint}/parts/${id}`, part);
    }

    deletePart(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/parts/${id}`);
    }

    getPartsByProductionLine(lineId: number): Observable<Part[]> {
        return this.api.get<Part[]>(`${this.endpoint}/parts/by_production_line`, { line_id: lineId });
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

    // Shift Types
    getShiftTypes(): Observable<ShiftType[]> {
        return this.api.get<ShiftType[]>(`${this.endpoint}/shift-types`);
    }

    getActiveShiftTypes(): Observable<ShiftType[]> {
        return this.api.get<ShiftType[]>(`${this.endpoint}/shift-types/active`);
    }

    getShiftType(id: number): Observable<ShiftType> {
        return this.api.get<ShiftType>(`${this.endpoint}/shift-types/${id}`);
    }

    createShiftType(shiftType: Partial<ShiftType>): Observable<ShiftType> {
        return this.api.post<ShiftType>(`${this.endpoint}/shift-types`, shiftType);
    }

    updateShiftType(id: number, shiftType: Partial<ShiftType>): Observable<ShiftType> {
        return this.api.put<ShiftType>(`${this.endpoint}/shift-types/${id}`, shiftType);
    }

    deleteShiftType(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/shift-types/${id}`);
    }

    // Zones
    getZones(): Observable<Zone[]> {
        return this.api.get<Zone[]>(`${this.endpoint}/zones`);
    }

    getActiveZones(): Observable<Zone[]> {
        return this.api.get<Zone[]>(`${this.endpoint}/zones/active`);
    }

    getZone(id: number): Observable<Zone> {
        return this.api.get<Zone>(`${this.endpoint}/zones/${id}`);
    }

    createZone(zone: Partial<Zone>): Observable<Zone> {
        return this.api.post<Zone>(`${this.endpoint}/zones`, zone);
    }

    updateZone(id: number, zone: Partial<Zone>): Observable<Zone> {
        return this.api.put<Zone>(`${this.endpoint}/zones/${id}`, zone);
    }

    deleteZone(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/zones/${id}`);
    }

    getZonesByProject(projectId: number): Observable<Zone[]> {
        return this.api.get<Zone[]>(`${this.endpoint}/zones/by_project`, { project_id: projectId });
    }

    getZonesByType(zoneType: ZoneType): Observable<Zone[]> {
        return this.api.get<Zone[]>(`${this.endpoint}/zones/by_type`, { zone_type: zoneType });
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

    patchHourlyProductionShiftType(hourlyProductionId: number, shiftTypeId: number): Observable<HourlyProduction> {
        return this.api.patch<HourlyProduction>(`${this.endpoint}/hourly/${hourlyProductionId}`, { shift_type: shiftTypeId });
    }

    patchHourlyProductionOrderNo(hourlyProductionId: number, orderNo: string): Observable<HourlyProduction> {
        return this.api.patch<HourlyProduction>(`${this.endpoint}/hourly/${hourlyProductionId}`, { order_no: orderNo });
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

    createDowntimeProblem(data: Partial<DowntimeProblem>): Observable<DowntimeProblem> {
        return this.api.post<DowntimeProblem>(`${this.endpoint}/downtime-problems/`, data);
    }

    updateDowntimeProblem(id: number, data: Partial<DowntimeProblem>): Observable<DowntimeProblem> {
        return this.api.put<DowntimeProblem>(`${this.endpoint}/downtime-problems/${id}/`, data);
    }

    deleteDowntimeProblem(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/downtime-problems/${id}/`);
    }

    // Team Assignments
    getTeamAssignments(hourlyProdId?: number): Observable<TeamAssignment[]> {
        const params = hourlyProdId ? { hourly_production: hourlyProdId } : undefined;
        return this.api.get<TeamAssignment[]>(`${this.endpoint}/team-assignments`, params);
    }

    createTeamAssignment(assignment: Partial<TeamAssignment>): Observable<TeamAssignment> {
        // Use the custom /assign/ endpoint which uses get_or_create for better duplicate handling
        return this.api.post<TeamAssignment>(`${this.endpoint}/team-assignments/assign`, assignment);
    }

    deleteTeamAssignment(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/team-assignments/${id}`);
    }

    // Part-Line Assignments
    getPartLineAssignments(params?: { part?: number; production_line?: number }): Observable<PartLineAssignment[]> {
        return this.api.get<PartLineAssignment[]>(`${this.endpoint}/part-line-assignments`, params);
    }

    getPartLineAssignment(id: number): Observable<PartLineAssignment> {
        return this.api.get<PartLineAssignment>(`${this.endpoint}/part-line-assignments/${id}`);
    }

    getPartLineAssignmentsByLine(lineId: number): Observable<PartLineAssignment[]> {
        return this.api.get<PartLineAssignment[]>(`${this.endpoint}/part-line-assignments/by_line`, { line_id: lineId });
    }

    getPartLineAssignmentsByPart(partId: number): Observable<PartLineAssignment[]> {
        return this.api.get<PartLineAssignment[]>(`${this.endpoint}/part-line-assignments/by_part`, { part_id: partId });
    }

    getPartLineAssignmentsByProject(projectId: number): Observable<PartLineAssignment[]> {
        return this.api.get<PartLineAssignment[]>(`${this.endpoint}/part-line-assignments/by_project`, { project_id: projectId });
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

    bulkAssignPartsToLine(lineId: number, partIds: number[]): Observable<PartLineAssignment[]> {
        return this.api.post<PartLineAssignment[]>(`${this.endpoint}/part-line-assignments/bulk_assign`, {
            production_line: lineId,
            parts: partIds
        });
    }

    setPrimaryLineForPart(assignmentId: number): Observable<PartLineAssignment> {
        return this.api.post<PartLineAssignment>(`${this.endpoint}/part-line-assignments/${assignmentId}/set_primary`, {});
    }

    // Headcount Requirements
    getHeadcountRequirements(params?: { production_line?: number; part?: number; shift_type?: number }): Observable<HeadcountRequirement[]> {
        return this.api.get<HeadcountRequirement[]>(`${this.endpoint}/headcount-requirements`, params);
    }

    getHeadcountRequirement(id: number): Observable<HeadcountRequirement> {
        return this.api.get<HeadcountRequirement>(`${this.endpoint}/headcount-requirements/${id}`);
    }

    getHeadcountRequirementsByLine(lineId: number): Observable<HeadcountRequirement[]> {
        return this.api.get<HeadcountRequirement[]>(`${this.endpoint}/headcount-requirements/by_line`, { line_id: lineId });
    }

    getHeadcountRequirementForContext(lineId: number, partId?: number, shiftTypeId?: number): Observable<HeadcountRequirement | null> {
        const params: any = { line_id: lineId };
        if (partId) params.part_id = partId;
        if (shiftTypeId) params.shift_type_id = shiftTypeId;
        return this.api.get<HeadcountRequirement | null>(`${this.endpoint}/headcount-requirements/by_line_and_part`, params);
    }

    getHeadcountRequirementsByProject(projectId: number): Observable<HeadcountRequirement[]> {
        return this.api.get<HeadcountRequirement[]>(`${this.endpoint}/headcount-requirements/by_project`, { project_id: projectId });
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

    saveOrUpdateHeadcountRequirement(requirement: Partial<HeadcountRequirement>): Observable<HeadcountRequirement> {
        return this.api.post<HeadcountRequirement>(`${this.endpoint}/headcount-requirements/save_or_update`, requirement);
    }
}
