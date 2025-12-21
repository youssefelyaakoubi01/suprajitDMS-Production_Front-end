/**
 * Production Line Card Component
 * Domain: DMS-Production
 *
 * Displays production line status and metrics
 */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ProductionLine } from '@core/models';

@Component({
    selector: 'app-production-line-card',
    standalone: true,
    imports: [CommonModule, TagModule],
    templateUrl: './production-line-card.component.html',
    styleUrls: ['./production-line-card.component.scss']
})
export class ProductionLineCardComponent {
    @Input() line!: ProductionLine;
    @Output() lineClick = new EventEmitter<ProductionLine>();

    getStatusSeverity(): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
        const map: Record<string, 'success' | 'danger' | 'warn'> = {
            running: 'success',
            downtime: 'danger',
            setup: 'warn'
        };
        return map[this.line.status] || 'info';
    }

    getStatusLabel(): string {
        const labels: Record<string, string> = {
            running: 'Running',
            downtime: 'Downtime',
            setup: 'Setup'
        };
        return labels[this.line.status] || this.line.status;
    }

    onClick(): void {
        this.lineClick.emit(this.line);
    }
}
