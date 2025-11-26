import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { KPI, ProductionLine } from '../../core/models';
import { ApiService } from '../../core/services/api.service';

export interface DashboardResponse {
    kpis: KPI[];
    production_lines: ProductionLine[];
    output_chart: { labels: string[]; data: number[]; targets: number[] };
    downtime_chart: { labels: string[]; data: number[] };
    last_updated: string;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private readonly endpoint = 'production/dashboard';
    private cachedData: Map<string, DashboardResponse> = new Map();

    constructor(private api: ApiService) {}

    /**
     * Get all dashboard data in one API call, optionally filtered by project and date
     * @param projectId - Optional project ID to filter dashboard data
     * @param date - Optional date string (YYYY-MM-DD) to filter dashboard data
     */
    getDashboardData(projectId?: number, date?: string): Observable<DashboardResponse> {
        const cacheKey = `${projectId || 'all'}_${date || 'today'}`;
        const params: Record<string, string | number> = {};
        if (projectId) {
            params['project'] = projectId;
        }
        if (date) {
            params['date'] = date;
        }

        return this.api.get<DashboardResponse>(this.endpoint, Object.keys(params).length > 0 ? params : undefined).pipe(
            map(response => {
                this.cachedData.set(cacheKey, response);
                return response;
            }),
            catchError(error => {
                console.error('Error fetching dashboard data:', error);
                // Return cached data if available, otherwise return empty data
                const cached = this.cachedData.get(cacheKey);
                if (cached) {
                    return of(cached);
                }
                return of(this.getEmptyDashboardData());
            })
        );
    }

    getKPIs(): Observable<KPI[]> {
        return this.getDashboardData().pipe(
            map(data => data.kpis)
        );
    }

    getProductionLines(): Observable<ProductionLine[]> {
        return this.getDashboardData().pipe(
            map(data => data.production_lines)
        );
    }

    getOutputPerHour(): Observable<{ labels: string[]; data: number[]; targets: number[] }> {
        return this.getDashboardData().pipe(
            map(data => data.output_chart)
        );
    }

    getDowntimeAnalysis(): Observable<{ labels: string[]; data: number[] }> {
        return this.getDashboardData().pipe(
            map(data => data.downtime_chart)
        );
    }

    private getEmptyDashboardData(): DashboardResponse {
        return {
            kpis: [
                { label: 'Output', value: 0, target: 0, unit: 'units', trend: 0, status: 'warning', icon: 'pi pi-box' },
                { label: 'Efficiency', value: 0, target: 95, unit: '%', trend: 0, status: 'warning', icon: 'pi pi-chart-line' },
                { label: 'Scrap Rate', value: 0, target: 2, unit: '%', trend: 0, status: 'success', icon: 'pi pi-trash' },
                { label: 'Downtime', value: 0, target: 30, unit: 'min', trend: 0, status: 'success', icon: 'pi pi-clock' }
            ],
            production_lines: [],
            output_chart: { labels: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8'], data: [0, 0, 0, 0, 0, 0, 0, 0], targets: [0, 0, 0, 0, 0, 0, 0, 0] },
            downtime_chart: { labels: ['No Downtime'], data: [0] },
            last_updated: new Date().toISOString()
        };
    }
}
