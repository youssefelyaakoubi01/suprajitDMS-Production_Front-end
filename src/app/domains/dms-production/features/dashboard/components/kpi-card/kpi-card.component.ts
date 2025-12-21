/**
 * KPI Card Component
 * Domain: DMS-Production
 *
 * Reusable component to display KPI metrics
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { KPI } from '@core/models';

@Component({
    selector: 'app-kpi-card',
    standalone: true,
    imports: [CommonModule, CardModule, TagModule],
    templateUrl: './kpi-card.component.html',
    styleUrls: ['./kpi-card.component.scss']
})
export class KpiCardComponent {
    @Input() kpi!: KPI;

    getTrendSeverity(): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
        if (this.kpi.label === 'Downtime' || this.kpi.label === 'Scrap Rate') {
            return this.kpi.trend > 0 ? 'danger' : 'success';
        }
        return this.kpi.trend > 0 ? 'success' : 'danger';
    }

    getTrendIcon(): string {
        return this.kpi.trend > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
    }
}
