import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { interval, Subscription, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { DashboardService } from './dashboard.service';
import { ProductionService } from '../../core/services/production.service';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { ProductionLineCardComponent } from './components/production-line-card/production-line-card.component';
import { KPI, ProductionLine, Project } from '../../core/models';

@Component({
    selector: 'app-dms-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        ChartModule,
        TableModule,
        TagModule,
        ToastModule,
        ProgressSpinnerModule,
        ButtonModule,
        SelectModule,
        DatePickerModule,
        KpiCardComponent,
        ProductionLineCardComponent
    ],
    providers: [MessageService],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DmsDashboardComponent implements OnInit, OnDestroy {
    kpis: KPI[] = [];
    productionLines: ProductionLine[] = [];
    outputChartData: any;
    downtimeChartData: any;
    chartOptions: any;
    horizontalChartOptions: any;
    isLoading = true;
    lastUpdated: Date = new Date();

    // Project selection
    projects: Project[] = [];
    selectedProjectId: number | null = null;
    projectOptions: { label: string; value: number | null }[] = [];

    // Date selection
    selectedDate: Date = new Date();
    today: Date = new Date();

    private refreshSubscription?: Subscription;

    constructor(
        private dashboardService: DashboardService,
        private productionService: ProductionService,
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.initChartOptions();
        this.loadProjects();
        this.loadDashboardData();
        this.startAutoRefresh();
    }

    loadProjects(): void {
        this.productionService.getProjects().subscribe({
            next: (response: any) => {
                // Handle both array response and paginated response (with results property)
                const projects = Array.isArray(response) ? response : (response.results || []);
                this.projects = projects;
                this.projectOptions = [
                    { label: 'All Projects', value: null },
                    ...projects.map((p: any) => ({ label: p.name || p.Name_Project, value: p.id || p.Id_Project }))
                ];
            },
            error: (error) => {
                console.error('Error loading projects:', error);
            }
        });
    }

    onProjectChange(): void {
        this.restartAutoRefresh();
        this.loadDashboardData();
    }

    onDateChange(): void {
        this.restartAutoRefresh();
        this.loadDashboardData();
    }

    ngOnDestroy(): void {
        this.refreshSubscription?.unsubscribe();
    }

    loadDashboardData(): void {
        this.isLoading = true;
        // Single API call to get all dashboard data, filtered by project and date
        const projectId = this.selectedProjectId ?? undefined;
        const dateStr = this.formatDate(this.selectedDate);
        this.dashboardService.getDashboardData(projectId, dateStr).subscribe({
            next: (data) => {
                this.kpis = data.kpis;
                this.productionLines = data.production_lines;
                this.setupOutputChart(data.output_chart);
                this.setupDowntimeChart(data.downtime_chart);
                this.lastUpdated = new Date(data.last_updated);
                this.isLoading = false;
            },
            error: (error) => {
                this.isLoading = false;
                console.error('Dashboard error:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load dashboard data'
                });
            }
        });
    }

    startAutoRefresh(): void {
        // Auto-refresh every 30 seconds (reduced from 5s to avoid excessive API calls)
        const projectId = this.selectedProjectId ?? undefined;
        const dateStr = this.formatDate(this.selectedDate);
        this.refreshSubscription = interval(30000)
            .pipe(
                switchMap(() => this.dashboardService.getDashboardData(projectId, dateStr))
            )
            .subscribe({
                next: (data) => {
                    this.kpis = data.kpis;
                    this.productionLines = data.production_lines;
                    this.setupOutputChart(data.output_chart);
                    this.setupDowntimeChart(data.downtime_chart);
                    this.lastUpdated = new Date(data.last_updated);
                }
            });
    }

    restartAutoRefresh(): void {
        this.refreshSubscription?.unsubscribe();
        this.startAutoRefresh();
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    showRefreshToast(): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Updated',
            detail: 'Dashboard data refreshed',
            life: 2000
        });
    }

    onLineClick(line: ProductionLine): void {
        this.router.navigate(['/production'], { queryParams: { lineId: line.id } });
    }

    private initChartOptions(): void {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: textColor }
                }
            },
            scales: {
                x: {
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                }
            }
        };

        this.horizontalChartOptions = {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                },
                y: {
                    ticks: { color: textColorSecondary },
                    grid: { display: false }
                }
            }
        };
    }

    private setupOutputChart(data: { labels: string[]; data: number[]; targets: number[] }): void {
        const documentStyle = getComputedStyle(document.documentElement);

        this.outputChartData = {
            labels: data.labels,
            datasets: [
                {
                    label: 'Output',
                    data: data.data,
                    backgroundColor: documentStyle.getPropertyValue('--primary-color'),
                    borderRadius: 4
                },
                {
                    label: 'Target',
                    data: data.targets,
                    backgroundColor: documentStyle.getPropertyValue('--surface-400'),
                    borderRadius: 4
                }
            ]
        };
    }

    private setupDowntimeChart(data: { labels: string[]; data: number[] }): void {
        const documentStyle = getComputedStyle(document.documentElement);

        this.downtimeChartData = {
            labels: data.labels,
            datasets: [
                {
                    label: 'Minutes',
                    data: data.data,
                    backgroundColor: [
                        documentStyle.getPropertyValue('--red-500'),
                        documentStyle.getPropertyValue('--orange-500'),
                        documentStyle.getPropertyValue('--yellow-500'),
                        documentStyle.getPropertyValue('--blue-500'),
                        documentStyle.getPropertyValue('--gray-500')
                    ],
                    borderRadius: 4
                }
            ]
        };
    }
}
