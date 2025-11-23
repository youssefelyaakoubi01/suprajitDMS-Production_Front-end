import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { KPI, ProductionLine } from '../../core/models';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    // Mock data - replace with actual API calls
    getKPIs(): Observable<KPI[]> {
        const kpis: KPI[] = [
            {
                label: 'Output',
                value: 412,
                target: 424,
                unit: 'units',
                trend: -2.8,
                status: 'warning',
                icon: 'pi pi-box'
            },
            {
                label: 'Efficiency',
                value: 97.2,
                target: 95,
                unit: '%',
                trend: 2.3,
                status: 'success',
                icon: 'pi pi-chart-line'
            },
            {
                label: 'Scrap Rate',
                value: 1.2,
                target: 2,
                unit: '%',
                trend: -0.3,
                status: 'success',
                icon: 'pi pi-trash'
            },
            {
                label: 'Downtime',
                value: 45,
                target: 30,
                unit: 'min',
                trend: 15,
                status: 'danger',
                icon: 'pi pi-clock'
            }
        ];
        return of(kpis).pipe(delay(500));
    }

    getProductionLines(): Observable<ProductionLine[]> {
        const lines: ProductionLine[] = [
            {
                id: 1,
                name: 'VW Handle Assy Line 1',
                project: 'VW Handle Assy',
                projectId: 1,
                status: 'running',
                efficiency: 97.2,
                output: 412,
                target: 424
            },
            {
                id: 2,
                name: 'HÖRMANN Line 2',
                project: 'HÖRMANN',
                projectId: 2,
                status: 'running',
                efficiency: 95.8,
                output: 380,
                target: 400
            },
            {
                id: 3,
                name: 'WITTE Assembly Line',
                project: 'WITTE',
                projectId: 3,
                status: 'downtime',
                efficiency: 82.5,
                output: 165,
                target: 200
            },
            {
                id: 4,
                name: 'Grammer Line 1',
                project: 'Grammer',
                projectId: 4,
                status: 'setup',
                efficiency: 0,
                output: 0,
                target: 300
            }
        ];
        return of(lines).pipe(delay(500));
    }

    getOutputPerHour(): Observable<{ labels: string[]; data: number[]; targets: number[] }> {
        return of({
            labels: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8'],
            data: [52, 48, 55, 50, 45, 52, 58, 52],
            targets: [53, 53, 53, 53, 53, 53, 53, 53]
        }).pipe(delay(500));
    }

    getDowntimeAnalysis(): Observable<{ labels: string[]; data: number[] }> {
        return of({
            labels: ['Machine Breakdown', 'Material Shortage', 'Changeover', 'Quality Issue', 'Other'],
            data: [45, 20, 18, 12, 8]
        }).pipe(delay(500));
    }
}
