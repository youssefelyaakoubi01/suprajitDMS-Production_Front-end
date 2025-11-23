import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { KPIIndicator, ActionPlan } from '../../core/models';

@Component({
    selector: 'app-kpi',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, ChartModule, TableModule, ButtonModule, TagModule, SelectModule, ToastModule],
    providers: [MessageService],
    templateUrl: './kpi.component.html',
    styleUrls: ['./kpi.component.scss']
})
export class KpiComponent implements OnInit {
    indicators: KPIIndicator[] = [];
    actionPlans: ActionPlan[] = [];
    trendChartData: any;
    chartOptions: any;
    departments = [{ label: 'All', value: null }, { label: 'Production', value: 'production' }, { label: 'Quality', value: 'quality' }];
    selectedDepartment: string | null = null;

    ngOnInit(): void {
        this.loadData();
        this.initChart();
    }

    loadData(): void {
        this.indicators = [
            { id: 1, name: 'OEE', category: 'Production', value: 85.5, target: 90, unit: '%', frequency: 'daily', responsibleId: 1, departmentId: 1 },
            { id: 2, name: 'Scrap Rate', category: 'Quality', value: 1.2, target: 1.5, unit: '%', frequency: 'daily', responsibleId: 2, departmentId: 2 },
            { id: 3, name: 'On-Time Delivery', category: 'Logistics', value: 98.2, target: 99, unit: '%', frequency: 'weekly', responsibleId: 3, departmentId: 3 }
        ];
        this.actionPlans = [
            { id: 1, indicatorId: 1, issue: 'OEE below target', rootCause: 'Machine downtime', action: 'Preventive maintenance', responsibleId: 1, dueDate: new Date(), status: 'in_progress' }
        ];
    }

    initChart(): void {
        this.trendChartData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                { label: 'OEE', data: [82, 84, 85, 83, 86, 85.5], borderColor: '#2563EB', tension: 0.4 },
                { label: 'Target', data: [90, 90, 90, 90, 90, 90], borderColor: '#9CA3AF', borderDash: [5, 5] }
            ]
        };
        this.chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } };
    }

    getStatusColor(value: number, target: number): 'success' | 'warn' | 'danger' {
        const ratio = value / target;
        if (ratio >= 1) return 'success';
        if (ratio >= 0.9) return 'warn';
        return 'danger';
    }

    getActionStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
        const map: Record<string, 'success' | 'warn' | 'danger'> = { completed: 'success', in_progress: 'warn', overdue: 'danger' };
        return map[status] || 'info';
    }
}
