import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { DashboardService } from './dashboard.service';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { ProductionLineCardComponent } from './components/production-line-card/production-line-card.component';
import { KPI, ProductionLine } from '../../core/models';

@Component({
    selector: 'app-dms-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ChartModule,
        TableModule,
        TagModule,
        ToastModule,
        ProgressSpinnerModule,
        ButtonModule,
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

    private refreshSubscription?: Subscription;

    constructor(
        private dashboardService: DashboardService,
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.initChartOptions();
        this.loadDashboardData();
        this.startAutoRefresh();
    }

    ngOnDestroy(): void {
        this.refreshSubscription?.unsubscribe();
    }

    loadDashboardData(): void {
        this.isLoading = true;
        // Single API call to get all dashboard data
        this.dashboardService.getDashboardData().subscribe({
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
        this.refreshSubscription = interval(30000)
            .pipe(
                switchMap(() => this.dashboardService.getDashboardData())
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
