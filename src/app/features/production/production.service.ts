import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
    Project,
    ProductionLine,
    Part,
    Workstation,
    Shift,
    DowntimeProblem,
    HourlyProduction,
    Downtime
} from '../../core/models';
import { EmployeeWithAssignment } from '../../core/models/employee.model';

@Injectable({
    providedIn: 'root'
})
export class ProductionService {
    getShifts(): Observable<Shift[]> {
        return of([
            { id: 'morning', name: 'Morning', startHour: 6, endHour: 14 },
            { id: 'evening', name: 'Evening', startHour: 14, endHour: 22 },
            { id: 'night', name: 'Night', startHour: 22, endHour: 6 }
        ]).pipe(delay(200));
    }

    getProjects(): Observable<Project[]> {
        return of([
            { Id_Project: 1, Name_Project: 'VW Handle Assy', Code_Project: 'VW-HA', Status_Project: 'Active' },
            { Id_Project: 2, Name_Project: 'HÖRMANN', Code_Project: 'HOR', Status_Project: 'Active' },
            { Id_Project: 3, Name_Project: 'WITTE', Code_Project: 'WIT', Status_Project: 'Active' },
            { Id_Project: 4, Name_Project: 'Grammer', Code_Project: 'GRM', Status_Project: 'Active' }
        ]).pipe(delay(300));
    }

    getProductionLines(projectId?: number): Observable<ProductionLine[]> {
        const lines: ProductionLine[] = [
            { id: 1, name: 'VW Handle Assy Line 1', project: 'VW Handle Assy', projectId: 1, status: 'running', efficiency: 97.2, output: 412, target: 424 },
            { id: 2, name: 'VW Handle Assy Line 2', project: 'VW Handle Assy', projectId: 1, status: 'running', efficiency: 95.8, output: 380, target: 400 },
            { id: 3, name: 'HÖRMANN Line 1', project: 'HÖRMANN', projectId: 2, status: 'running', efficiency: 92.5, output: 185, target: 200 },
            { id: 4, name: 'WITTE Assembly Line', project: 'WITTE', projectId: 3, status: 'setup', efficiency: 0, output: 0, target: 300 },
            { id: 5, name: 'Grammer Line 1', project: 'Grammer', projectId: 4, status: 'downtime', efficiency: 82, output: 164, target: 200 }
        ];

        const filtered = projectId ? lines.filter(l => l.projectId === projectId) : lines;
        return of(filtered).pipe(delay(300));
    }

    getParts(projectId?: number): Observable<Part[]> {
        const parts: Part[] = [
            { Id_Part: 1, PN_Part: 'VW-HA-001', Id_Project: 1, ShiftTarget_Part: 424, ScrapTarget_Part: 8, Price_Part: 2.50, Efficiency: 95, MATSTATUS: 'Active' },
            { Id_Part: 2, PN_Part: 'VW-HA-002', Id_Project: 1, ShiftTarget_Part: 400, ScrapTarget_Part: 6, Price_Part: 2.75, Efficiency: 92, MATSTATUS: 'Active' },
            { Id_Part: 3, PN_Part: 'HOR-001', Id_Project: 2, ShiftTarget_Part: 200, ScrapTarget_Part: 4, Price_Part: 3.00, Efficiency: 90, MATSTATUS: 'Active' },
            { Id_Part: 4, PN_Part: 'WIT-001', Id_Project: 3, ShiftTarget_Part: 300, ScrapTarget_Part: 5, Price_Part: 1.80, Efficiency: 88, MATSTATUS: 'Active' },
            { Id_Part: 5, PN_Part: 'GRM-001', Id_Project: 4, ShiftTarget_Part: 200, ScrapTarget_Part: 3, Price_Part: 4.50, Efficiency: 93, MATSTATUS: 'Active' }
        ];

        const filtered = projectId ? parts.filter(p => p.Id_Project === projectId) : parts;
        return of(filtered).pipe(delay(300));
    }

    getWorkstations(lineId?: number): Observable<Workstation[]> {
        return of([
            { Id_Workstation: 1, Name_Workstation: 'Assembly Station 1', Code_Workstation: 'ASB-001', Id_ProdLine: 1 },
            { Id_Workstation: 2, Name_Workstation: 'Assembly Station 2', Code_Workstation: 'ASB-002', Id_ProdLine: 1 },
            { Id_Workstation: 3, Name_Workstation: 'Packaging Station', Code_Workstation: 'PKG-001', Id_ProdLine: 1 },
            { Id_Workstation: 4, Name_Workstation: 'Quality Check', Code_Workstation: 'QC-001', Id_ProdLine: 1 }
        ]).pipe(delay(300));
    }

    getHours(shiftId?: string): Observable<{ label: string; value: number; startTime: string; endTime: string; isOvertime: boolean }[]> {
        // Shift timings based on 24/7 operation
        const shiftStartHours: Record<string, number> = {
            morning: 6,   // 06:00 - 14:00
            evening: 14,  // 14:00 - 22:00
            night: 22     // 22:00 - 06:00
        };

        const startHour = shiftStartHours[shiftId || 'morning'] || 6;
        const hours = [];

        // Regular 8 hours
        for (let i = 0; i < 8; i++) {
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

        // Overtime hours (H9, H10, H11, H12)
        for (let i = 8; i < 12; i++) {
            const hourStart = (startHour + i) % 24;
            const hourEnd = (startHour + i + 1) % 24;
            hours.push({
                label: `H${i + 1} OT (${this.formatHour(hourStart)} - ${this.formatHour(hourEnd)})`,
                value: i + 1,
                startTime: this.formatHour(hourStart),
                endTime: this.formatHour(hourEnd),
                isOvertime: true
            });
        }

        return of(hours);
    }

    private formatHour(hour: number): string {
        return `${hour.toString().padStart(2, '0')}:00`;
    }

    getDowntimeProblems(): Observable<DowntimeProblem[]> {
        return of([
            { Id_DowntimeProblems: 1, Name_DowntimeProblems: 'Machine Breakdown', Category_DowntimeProblems: 'Technical' },
            { Id_DowntimeProblems: 2, Name_DowntimeProblems: 'Material Shortage', Category_DowntimeProblems: 'Supply' },
            { Id_DowntimeProblems: 3, Name_DowntimeProblems: 'Changeover', Category_DowntimeProblems: 'Process' },
            { Id_DowntimeProblems: 4, Name_DowntimeProblems: 'Quality Issue', Category_DowntimeProblems: 'Quality' },
            { Id_DowntimeProblems: 5, Name_DowntimeProblems: 'Operator Absence', Category_DowntimeProblems: 'HR' },
            { Id_DowntimeProblems: 6, Name_DowntimeProblems: 'Other', Category_DowntimeProblems: 'Other' }
        ]).pipe(delay(200));
    }

    getAssignedEmployees(hourlyProdId?: number): Observable<EmployeeWithAssignment[]> {
        return of([
            {
                Id_Emp: 54,
                Nom_Emp: 'ELBOURIANY',
                Prenom_Emp: 'WISSAL',
                DateNaissance_Emp: new Date('1990-05-15'),
                Genre_Emp: 'F',
                Categorie_Emp: 'Operator',
                DateEmbauche_Emp: new Date('2020-03-01'),
                Departement_Emp: 'Production',
                Picture: 'assets/images/avatar-default.png',
                EmpStatus: 'Active',
                workstation: 'Assembly Station 1',
                qualification: 'Level 3',
                qualificationLevel: 3
            },
            {
                Id_Emp: 55,
                Nom_Emp: 'BENALI',
                Prenom_Emp: 'AHMED',
                DateNaissance_Emp: new Date('1988-08-20'),
                Genre_Emp: 'M',
                Categorie_Emp: 'Operator',
                DateEmbauche_Emp: new Date('2019-06-15'),
                Departement_Emp: 'Production',
                Picture: 'assets/images/avatar-default.png',
                EmpStatus: 'Active',
                workstation: 'Assembly Station 2',
                qualification: 'Level 4',
                qualificationLevel: 4
            }
        ]).pipe(delay(300));
    }

    saveHourlyProduction(data: Partial<HourlyProduction>): Observable<HourlyProduction> {
        return of({
            Id_HourlyProd: Math.floor(Math.random() * 10000),
            Date_HourlyProd: new Date(),
            Shift_HourlyProd: 'morning',
            Hour_HourlyProd: 1,
            Id_Part: 1,
            Result_HourlyProdPN: 0,
            Target_HourlyProdPN: 53,
            HC_HourlyProdPN: 2,
            Id_ProdLine: 1,
            ...data
        } as HourlyProduction).pipe(delay(500));
    }

    saveDowntime(data: Partial<Downtime>): Observable<Downtime> {
        return of({
            Id_Downtime: Math.floor(Math.random() * 10000),
            Total_Downtime: 0,
            Comment_Downtime: '',
            Id_HourlyProd: 1,
            Id_DowntimeProblems: 1,
            ...data
        } as Downtime).pipe(delay(500));
    }
}
