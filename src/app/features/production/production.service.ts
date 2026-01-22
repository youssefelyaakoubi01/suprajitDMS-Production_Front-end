import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
    Project,
    ProductionLine,
    Part,
    Workstation,
    Machine,
    Shift,
    ShiftType,
    DowntimeProblem,
    HourlyProduction,
    Downtime,
    Zone
} from '../../core/models';
import { EmployeeWithAssignment } from '../../core/models/employee.model';
import { ProductionService as CoreProductionService } from '../../core/services/production.service';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProductionService {
    constructor(private coreService: CoreProductionService) {}

    getShifts(): Observable<Shift[]> {
        return this.coreService.getShifts().pipe(
            map((response: any) => {
                const shifts = response.results || response;
                return shifts.map((shift: any) => ({
                    id: shift.id,  // Use numeric ID from Django
                    name: shift.name,
                    startHour: this.parseTimeToHour(shift.start_time),
                    endHour: this.parseTimeToHour(shift.end_time)
                }));
            })
        );
    }

    getShiftsByProductionLine(productionLineId: number): Observable<Shift[]> {
        return this.coreService.getShiftsByProductionLine(productionLineId).pipe(
            map((response: any) => {
                const shifts = response.results || response;
                return shifts.map((shift: any) => ({
                    id: shift.id,
                    name: shift.name,
                    startHour: this.parseTimeToHour(shift.start_time),
                    endHour: this.parseTimeToHour(shift.end_time)
                }));
            })
        );
    }

    private parseTimeToHour(timeString: string): number {
        if (!timeString) return 0;
        const parts = timeString.split(':');
        return parseInt(parts[0], 10);
    }

    getActiveShiftTypes(): Observable<ShiftType[]> {
        return this.coreService.getActiveShiftTypes().pipe(
            map((response: any) => {
                const shiftTypes = response.results || response;
                return shiftTypes.map((st: any) => ({
                    id: st.id,
                    name: st.name,
                    code: st.code,
                    target_percentage: st.target_percentage,
                    description: st.description,
                    is_active: st.is_active
                }));
            })
        );
    }

    getActiveZones(): Observable<Zone[]> {
        return this.coreService.getActiveZones().pipe(
            map((response: any) => {
                const zones = response.results || response;
                return zones.map((z: any) => ({
                    id: z.id,
                    name: z.name,
                    code: z.code,
                    description: z.description,
                    is_active: z.is_active
                }));
            })
        );
    }

    getProjects(): Observable<Project[]> {
        return this.coreService.getProjects().pipe(
            map((response: any) => {
                const projects = response.results || response;
                return projects.map((p: any) => ({
                    Id_Project: p.id,
                    Name_Project: p.name,
                    Code_Project: p.code,
                    Status_Project: p.is_active ? 'Active' : 'Inactive'
                }));
            })
        );
    }

    getProductionLines(projectId?: number): Observable<ProductionLine[]> {
        return this.coreService.getProductionLines(projectId).pipe(
            map((response: any) => {
                const lines = response.results || response;
                return lines.map((line: any) => ({
                    id: line.id,
                    name: line.name,
                    project: line.project_name || line.project,
                    projectId: line.project,
                    status: line.status,
                    efficiency: 0, // TODO: Calculate from hourly production
                    output: 0, // TODO: Calculate from hourly production
                    target: line.capacity || 0
                }));
            })
        );
    }

    getParts(projectId?: number): Observable<Part[]> {
        return this.coreService.getParts(projectId).pipe(
            map((response: any) => {
                const parts = response.results || response;
                return parts.map((p: any) => ({
                    Id_Part: p.id,
                    PN_Part: p.part_number,
                    Id_Project: p.project,
                    ShiftTarget_Part: p.shift_target || 0,
                    ScrapTarget_Part: 0, // TODO: Add to Django model
                    Price_Part: parseFloat(p.price) || 0,
                    Efficiency: p.efficiency || 0,
                    MATSTATUS: p.material_status || 'active'
                }));
            })
        );
    }

    getWorkstations(lineId?: number, projectId?: number): Observable<Workstation[]> {
        return this.coreService.getWorkstations(lineId, projectId).pipe(
            map((response: any) => {
                const workstations = response.results || response;
                return workstations.map((w: any) => ({
                    Id_Workstation: w.id,
                    Name_Workstation: w.name,
                    Code_Workstation: w.code,
                    Id_ProdLine: w.production_line,
                    project: w.project,
                    machines_count: w.machines_count || 0
                }));
            })
        );
    }

    getMachines(workstationId?: number): Observable<Machine[]> {
        return this.coreService.getMachines(workstationId).pipe(
            map((response: any) => {
                const machines = response.results || response;
                return machines;
            })
        );
    }

    getMachinesByProductionLine(lineId: number): Observable<Machine[]> {
        return this.coreService.getMachinesByProductionLine(lineId).pipe(
            map((response: any) => {
                const machines = response.results || response;
                return machines;
            })
        );
    }

    getHours(shift?: Shift): Observable<{ label: string; value: number; startTime: string; endTime: string; isOvertime: boolean }[]> {
        // Use shift's actual start and end hours from database
        const startHour = shift?.startHour ?? 6;
        const endHour = shift?.endHour ?? 14;

        // Calculate shift duration (handle overnight shifts)
        let shiftDuration = endHour - startHour;
        if (shiftDuration <= 0) {
            shiftDuration += 24; // Overnight shift (e.g., 22:00 - 07:00 = 9 hours)
        }

        const hours = [];

        // Generate hours based on actual shift duration
        for (let i = 0; i < shiftDuration; i++) {
            const hourStart = (startHour + i) % 24;
            const hourEnd = (startHour + i + 1) % 24;
            hours.push({
                label: `H${i + 1} (${this.formatHour(hourStart)} - ${this.formatHour(hourEnd)})`,
                value: i + 1,
                startTime: this.formatHour(hourStart),
                endTime: this.formatHour(hourEnd),
                isOvertime: false
            });
        }

        return of(hours);
    }

    private formatHour(hour: number): string {
        return `${hour.toString().padStart(2, '0')}:00`;
    }

    getDowntimeProblems(): Observable<DowntimeProblem[]> {
        return this.coreService.getDowntimeProblems().pipe(
            map((response: any) => {
                const problems = response.results || response;
                return problems.map((p: any) => ({
                    Id_DowntimeProblems: p.id,
                    Name_DowntimeProblems: p.name,
                    Category_DowntimeProblems: p.category
                }));
            })
        );
    }

    getAssignedEmployees(hourlyProdId?: number): Observable<EmployeeWithAssignment[]> {
        return this.coreService.getTeamAssignments(hourlyProdId).pipe(
            map((response: any) => {
                const assignments = response.results || response;
                return assignments.map((a: any) => ({
                    Id_Emp: a.employee?.id || a.employee,
                    Nom_Emp: a.employee?.last_name || '',
                    Prenom_Emp: a.employee?.first_name || '',
                    DateNaissance_Emp: a.employee?.birth_date ? new Date(a.employee.birth_date) : new Date(),
                    Genre_Emp: a.employee?.gender || 'M',
                    Categorie_Emp: a.employee?.category || 'Operator',
                    DateEmbauche_Emp: a.employee?.hire_date ? new Date(a.employee.hire_date) : new Date(),
                    Departement_Emp: a.employee?.department || 'Production',
                    Picture: a.employee?.picture ? `${environment.mediaUrl}${a.employee.picture}` : 'assets/images/avatar-default.png',
                    EmpStatus: a.employee?.status || 'active',
                    workstation: a.workstation?.name || '',
                    qualification: '', // TODO: Get from qualifications
                    qualificationLevel: 0
                }));
            })
        );
    }

    getTeamAssignments(hourlyProdId: number): Observable<any[]> {
        return this.coreService.getTeamAssignments(hourlyProdId).pipe(
            map((response: any) => {
                const assignments = response.results || response;
                return assignments.map((a: any) => ({
                    Id_Assignment: a.id,
                    Id_Emp: a.employee?.id || a.employee,
                    Id_Workstation: a.workstation?.id || a.workstation,
                    Id_HourlyProd: a.hourly_production,
                    // Include all backend fields for proper display
                    employee_name: a.employee_name,
                    employee_id: a.employee_id, // Badge number
                    workstation_name: a.workstation_name,
                    machine_id: a.machine,
                    machine_name: a.machine_name,
                    machine_code: a.machine_code,
                    assigned_at: a.assigned_at
                }));
            })
        );
    }

    getDowntimes(hourlyProdId: number): Observable<Downtime[]> {
        return this.coreService.getDowntimes(hourlyProdId).pipe(
            map((response: any) => {
                const downtimes = response.results || response;
                return downtimes.map((d: any) => ({
                    Id_Downtime: d.id,
                    Total_Downtime: d.duration,
                    Comment_Downtime: d.comment,
                    Id_HourlyProd: d.hourly_production,
                    Id_DowntimeProblems: d.problem,
                    problem_name: d.problem_name
                }));
            })
        );
    }

    saveHourlyProduction(data: any): Observable<HourlyProduction> {
        // Support both old field names (Date_HourlyProd) and new field names (date)
        const inputDate = data.date || data.Date_HourlyProd;
        const apiData: any = {
            date: inputDate instanceof Date
                ? this.formatLocalDate(inputDate)
                : inputDate,
            shift: data.shift || (typeof data.Shift_HourlyProd === 'string' ? parseInt(data.Shift_HourlyProd, 10) : data.Shift_HourlyProd),
            hour: data.hour || data.Hour_HourlyProd,
            hour_type: data.hour_type || 'normal',
            shift_type: data.shift_type || null,
            part: data.part || data.Id_Part,
            production_line: data.production_line || data.Id_ProdLine,
            machine: data.machine || null,
            result: data.result ?? data.Result_HourlyProdPN ?? 0,
            target: data.target ?? data.Target_HourlyProdPN ?? 0,
            headcount: data.headcount ?? data.HC_HourlyProdPN ?? 0,
            // Order Number
            order_no: data.order_no || '',
            // Production Supervisors & Key Personnel
            line_leader: data.line_leader || '',
            quality_agent: data.quality_agent || '',
            maintenance_tech: data.maintenance_tech || '',
            pqc: data.pqc || ''
        };

        console.log('saveHourlyProduction - Input data:', data);
        console.log('saveHourlyProduction - API data being sent:', apiData);

        const existingId = data.id || data.Id_HourlyProd;
        if (existingId) {
            return this.coreService.updateHourlyProduction(existingId, apiData);
        } else {
            return this.coreService.createHourlyProduction(apiData);
        }
    }

    updateHourlyProduction(id: number, data: any): Observable<HourlyProduction> {
        // Support both old field names (Date_HourlyProd) and new field names (date)
        const inputDate = data.date || data.Date_HourlyProd;
        const apiData: any = {
            date: inputDate instanceof Date
                ? this.formatLocalDate(inputDate)
                : inputDate,
            shift: data.shift || (typeof data.Shift_HourlyProd === 'string' ? parseInt(data.Shift_HourlyProd, 10) : data.Shift_HourlyProd),
            hour: data.hour || data.Hour_HourlyProd,
            hour_type: data.hour_type || 'normal',
            shift_type: data.shift_type || null,
            part: data.part || data.Id_Part,
            production_line: data.production_line || data.Id_ProdLine,
            machine: data.machine || null,
            result: data.result ?? data.Result_HourlyProdPN ?? 0,
            scrap: data.scrap ?? data.Scrap_HourlyProdPN ?? 0,
            // Order Number
            order_no: data.order_no ?? '',
            // Production Supervisors & Key Personnel
            line_leader: data.line_leader || '',
            quality_agent: data.quality_agent || '',
            maintenance_tech: data.maintenance_tech || '',
            pqc: data.pqc || ''
        };

        // Only include target and headcount if they are provided (to avoid overwriting with 0)
        if (data.target !== undefined || data.Target_HourlyProdPN !== undefined) {
            apiData.target = data.target ?? data.Target_HourlyProdPN ?? 0;
        }
        if (data.headcount !== undefined || data.HC_HourlyProdPN !== undefined) {
            apiData.headcount = data.headcount ?? data.HC_HourlyProdPN ?? 0;
        }

        return this.coreService.updateHourlyProduction(id, apiData);
    }

    saveDowntime(data: Partial<Downtime>): Observable<Downtime> {
        // Map front-end field names to Django API field names
        let hourlyProductionValue: any;

        // Handle different formats of hourly production ID
        if (typeof data.Id_HourlyProd === 'object' && data.Id_HourlyProd !== null) {
            // If it's an object with date/shift/hour, we need to send those fields
            const obj = data.Id_HourlyProd as any;
            console.log('Id_HourlyProd is an object:', obj);

            // Try to extract a numeric ID if it exists
            hourlyProductionValue = obj.id || obj.Id_HourlyProd || obj.production_id;

            // If no ID found, send the composite key parts
            if (!hourlyProductionValue) {
                console.warn('No ID found in object, using date/shift/hour lookup');
                // Backend should support this format or we need to fetch the ID first
                hourlyProductionValue = obj.date && obj.shift && obj.hour ?
                    { date: obj.date, shift: obj.shift, hour: obj.hour } : null;
            }
        } else {
            hourlyProductionValue = data.Id_HourlyProd;
        }

        const apiData: any = {
            duration: data.Total_Downtime,
            comment: data.Comment_Downtime || '',
            hourly_production: hourlyProductionValue,
            machine: (data as any).machine || null
        };

        // Only include problem if it's a valid non-zero value
        if (data.Id_DowntimeProblems && data.Id_DowntimeProblems > 0) {
            apiData.problem = data.Id_DowntimeProblems;
        }

        console.log('Downtime API data being sent:', apiData);

        if (data.Id_Downtime) {
            return this.coreService.updateDowntime(data.Id_Downtime, apiData);
        } else {
            return this.coreService.createDowntime(apiData);
        }
    }

    updateDowntime(id: number, data: Partial<Downtime>): Observable<Downtime> {
        const apiData: any = {
            duration: data.Total_Downtime,
            comment: data.Comment_Downtime || '',
            hourly_production: data.Id_HourlyProd,
            machine: (data as any).machine || null
        };

        // Only include problem if it's a valid non-zero value
        if (data.Id_DowntimeProblems && data.Id_DowntimeProblems > 0) {
            apiData.problem = data.Id_DowntimeProblems;
        }

        return this.coreService.updateDowntime(id, apiData);
    }

    deleteDowntime(id: number): Observable<void> {
        return this.coreService.deleteDowntime(id);
    }

    getHourlyProductions(params?: {
        date?: string;
        shift?: string | number;
        hour?: number;
        lineId?: number;
        partId?: number;
        projectId?: number;
    }): Observable<HourlyProduction[]> {
        // Map front-end parameter names to Django API parameter names
        const apiParams: any = {};
        if (params?.date) apiParams.date = params.date;
        if (params?.shift) apiParams.shift = params.shift;
        if (params?.hour !== undefined) apiParams.hour = params.hour;
        if (params?.lineId) apiParams.production_line = params.lineId;  // Django expects 'production_line'
        if (params?.partId) apiParams.part = params.partId;  // Django expects 'part'
        if (params?.projectId) apiParams.production_line__project = params.projectId;  // Django expects 'production_line__project'

        return this.coreService.getHourlyProduction(apiParams).pipe(
            map((response: any) => {
                const productions = response.results || response;
                return productions.map((p: any) => ({
                    Id_HourlyProd: p.id,
                    Date_HourlyProd: new Date(p.date),
                    Shift_HourlyProd: p.shift,
                    Hour_HourlyProd: p.hour,
                    Id_Part: p.part,
                    Result_HourlyProdPN: p.result,
                    Target_HourlyProdPN: p.target,
                    HC_HourlyProdPN: p.headcount,
                    Scrap_HourlyProdPN: p.scrap,
                    Id_ProdLine: p.production_line,
                    // Additional fields for display
                    shiftName: p.shift_name,
                    projectName: p.project_name,
                    lineName: p.line_name,
                    partNumber: p.part_number,
                    // Order number
                    order_no: p.order_no,
                    // Shift type info for hour type persistence
                    shift_type: p.shift_type,
                    shift_type_code: p.shift_type_code,
                    hour_type: p.hour_type
                }));
            })
        );
    }

    getHourlyProductionById(id: number): Observable<HourlyProduction> {
        return this.coreService.getHourlyProductionById(id).pipe(
            map((p: any) => ({
                Id_HourlyProd: p.id,
                Date_HourlyProd: new Date(p.date),
                Shift_HourlyProd: p.shift,
                Hour_HourlyProd: p.hour,
                Id_Part: p.part,
                Result_HourlyProdPN: p.result,
                Target_HourlyProdPN: p.target,
                HC_HourlyProdPN: p.headcount,
                Id_ProdLine: p.production_line
            }))
        );
    }

    deleteHourlyProduction(id: number): Observable<void> {
        return this.coreService.deleteHourlyProduction(id);
    }

    createTeamAssignment(assignment: { hourly_production: number; employee: number; workstation: number; machine?: number }): Observable<any> {
        // The core service expects TeamAssignment interface, but we're sending API format
        // Cast to any to bypass type checking since we're sending directly to API
        return this.coreService.createTeamAssignment(assignment as any);
    }

    deleteTeamAssignment(id: number): Observable<void> {
        return this.coreService.deleteTeamAssignment(id);
    }

    patchHourlyProductionShiftType(hourlyProductionId: number, shiftTypeId: number): Observable<HourlyProduction> {
        return this.coreService.patchHourlyProductionShiftType(hourlyProductionId, shiftTypeId);
    }

    updateHourlyProductionOrderNo(id: number, orderNo: string): Observable<HourlyProduction> {
        return this.coreService.patchHourlyProductionOrderNo(id, orderNo);
    }

    /**
     * Format a Date object to YYYY-MM-DD string using local timezone
     * This prevents timezone conversion issues where toISOString() would shift the date
     */
    private formatLocalDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
