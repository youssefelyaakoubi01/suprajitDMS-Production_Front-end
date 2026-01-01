import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PopoverModule, Popover } from 'primeng/popover';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';

import { RecyclageAlertService, RecyclageAlert } from '../../core/services/recyclage-alert.service';

@Component({
    selector: 'app-recyclage-alert-badge',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        BadgeModule,
        ButtonModule,
        TooltipModule,
        PopoverModule,
        DividerModule,
        InputNumberModule,
        FormsModule
    ],
    template: `
        <button type="button"
                class="layout-topbar-action"
                (click)="alertPanel.toggle($event)"
                pTooltip="Alertes Recyclage"
                tooltipPosition="bottom">
            <i class="pi pi-sync"></i>
            <span class="recyclage-badge"
                  *ngIf="urgentCount > 0"
                  [class.critical]="hasCritical">
                {{ urgentCount > 99 ? '99+' : urgentCount }}
            </span>
        </button>

        <p-popover #alertPanel styleClass="recyclage-popover">
            <div class="recyclage-alert-popover">
                <!-- Header -->
                <div class="popover-header">
                    <div class="header-title">
                        <i class="pi pi-sync mr-2"></i>
                        <span class="font-semibold">Recyclages Urgents</span>
                    </div>
                    <span class="urgent-count" [class.critical]="hasCritical">
                        {{ urgentCount }}
                    </span>
                </div>

                <!-- Alert List -->
                <div class="alert-list" *ngIf="alerts.length > 0">
                    <div *ngFor="let alert of alerts.slice(0, 5)"
                         class="alert-item"
                         [class.danger]="alert.severity === 'danger'"
                         [class.warn]="alert.severity === 'warn'">
                        <div class="employee-info">
                            <span class="employee-name">
                                {{ alert.employee.Employee.Prenom_Emp }}
                                {{ alert.employee.Employee.Nom_Emp }}
                            </span>
                            <span class="days-info"
                                  [class.overdue]="alert.employee.isOverdue"
                                  [class.urgent]="!alert.employee.isOverdue && alert.daysRemaining <= 1">
                                <ng-container *ngIf="alert.employee.isOverdue">
                                    <i class="pi pi-exclamation-triangle mr-1"></i>
                                    En retard de {{ getAbsValue(alert.daysRemaining) }} jour(s)
                                </ng-container>
                                <ng-container *ngIf="!alert.employee.isOverdue">
                                    <i class="pi pi-clock mr-1"></i>
                                    Il reste {{ alert.daysRemaining }} jour(s)
                                </ng-container>
                            </span>
                        </div>
                    </div>

                    <!-- More alerts indicator -->
                    <div class="more-alerts" *ngIf="alerts.length > 5">
                        <span>+ {{ alerts.length - 5 }} autres opérateurs</span>
                    </div>
                </div>

                <!-- Empty State -->
                <div class="empty-state" *ngIf="alerts.length === 0">
                    <i class="pi pi-check-circle text-green-500"></i>
                    <span>Aucun recyclage urgent</span>
                </div>

                <p-divider></p-divider>

                <!-- Configuration -->
                <div class="config-section">
                    <label class="config-label">Seuil d'alerte (jours)</label>
                    <div class="config-input">
                        <p-inputNumber
                            [(ngModel)]="thresholdDays"
                            [min]="1"
                            [max]="30"
                            [showButtons]="true"
                            buttonLayout="horizontal"
                            spinnerMode="horizontal"
                            decrementButtonClass="p-button-text p-button-sm"
                            incrementButtonClass="p-button-text p-button-sm"
                            inputStyleClass="config-input-field"
                            (ngModelChange)="onThresholdChange($event)">
                        </p-inputNumber>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Footer -->
                <div class="popover-footer">
                    <a routerLink="/dms-hr" [queryParams]="{tab: 'recyclage'}"
                       class="view-all-link"
                       (click)="alertPanel.hide()">
                        <i class="pi pi-external-link mr-1"></i>
                        Voir tout
                    </a>
                    <button type="button"
                            class="refresh-btn"
                            (click)="refresh()">
                        <i class="pi pi-refresh"></i>
                    </button>
                </div>
            </div>
        </p-popover>
    `,
    styles: [`
        :host {
            display: inline-flex;
        }

        .layout-topbar-action {
            position: relative;
        }

        .recyclage-badge {
            position: absolute;
            top: 0px;
            right: 0px;
            min-width: 18px;
            height: 18px;
            border-radius: 50%;
            background: var(--orange-500);
            color: white;
            font-size: 0.65rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
            border: 2px solid var(--surface-0);
            animation: pulse 2s infinite;
        }

        .recyclage-badge.critical {
            background: var(--red-500);
            animation: pulse-critical 1s infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        @keyframes pulse-critical {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.15); opacity: 0.8; }
        }

        .recyclage-alert-popover {
            min-width: 320px;
            max-width: 380px;
        }

        .popover-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem;
            background: linear-gradient(135deg, var(--orange-50) 0%, var(--surface-0) 100%);
            border-bottom: 1px solid var(--surface-border);
        }

        .header-title {
            display: flex;
            align-items: center;
            color: var(--text-color);
        }

        .urgent-count {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--orange-100);
            color: var(--orange-700);
            font-weight: 700;
            font-size: 0.875rem;
        }

        .urgent-count.critical {
            background: var(--red-100);
            color: var(--red-700);
        }

        .alert-list {
            max-height: 280px;
            overflow-y: auto;
        }

        .alert-item {
            display: flex;
            align-items: center;
            padding: 0.625rem 1rem;
            border-bottom: 1px solid var(--surface-100);
            transition: background-color 0.2s;
        }

        .alert-item:hover {
            background: var(--surface-50);
        }

        .alert-item:last-child {
            border-bottom: none;
        }

        .alert-item.danger {
            border-left: 3px solid var(--red-500);
            background: var(--red-50);
        }

        .alert-item.warn {
            border-left: 3px solid var(--orange-500);
        }

        .employee-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            flex: 1;
        }

        .employee-name {
            font-weight: 600;
            font-size: 0.875rem;
            color: var(--text-color);
        }

        .days-info {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            display: flex;
            align-items: center;
        }

        .days-info.overdue {
            color: var(--red-600);
            font-weight: 600;
        }

        .days-info.urgent {
            color: var(--orange-600);
            font-weight: 600;
        }

        .more-alerts {
            padding: 0.5rem 1rem;
            text-align: center;
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            background: var(--surface-50);
            font-style: italic;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            padding: 1.5rem;
            color: var(--text-color-secondary);
        }

        .empty-state i {
            font-size: 2rem;
        }

        .config-section {
            padding: 0.75rem 1rem;
        }

        .config-label {
            display: block;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-color-secondary);
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .config-input {
            display: flex;
            justify-content: center;
        }

        :host ::ng-deep .config-input .p-inputnumber {
            width: 120px;
        }

        :host ::ng-deep .config-input .config-input-field {
            width: 50px;
            text-align: center;
            font-weight: 600;
        }

        .popover-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 1rem;
        }

        .view-all-link {
            display: flex;
            align-items: center;
            color: var(--primary-color);
            font-size: 0.875rem;
            font-weight: 500;
            text-decoration: none;
            transition: color 0.2s;
        }

        .view-all-link:hover {
            color: var(--primary-700);
            text-decoration: underline;
        }

        .refresh-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: none;
            background: var(--surface-100);
            color: var(--text-color-secondary);
            cursor: pointer;
            transition: all 0.2s;
        }

        .refresh-btn:hover {
            background: var(--primary-100);
            color: var(--primary-color);
        }

        :host ::ng-deep .p-popover .p-popover-content {
            padding: 0;
            border-radius: var(--border-radius);
            overflow: hidden;
        }

        :host ::ng-deep .p-divider {
            margin: 0 !important;
        }
    `]
})
export class RecyclageAlertBadgeComponent implements OnInit, OnDestroy {
    @ViewChild('alertPanel') alertPanel!: Popover;

    alerts: RecyclageAlert[] = [];
    urgentCount = 0;
    hasCritical = false;
    thresholdDays = 3;

    private destroy$ = new Subject<void>();

    constructor(private recyclageAlertService: RecyclageAlertService) {}

    ngOnInit(): void {
        // Subscribe to alerts
        this.recyclageAlertService.alerts$
            .pipe(takeUntil(this.destroy$))
            .subscribe(alerts => {
                this.alerts = alerts;
                this.hasCritical = alerts.some(a => a.employee.isOverdue);
            });

        // Subscribe to count
        this.recyclageAlertService.urgentCount$
            .pipe(takeUntil(this.destroy$))
            .subscribe(count => {
                this.urgentCount = count;
            });

        // Get current threshold
        this.thresholdDays = this.recyclageAlertService.getThreshold();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getAbsValue(value: number): number {
        return Math.abs(value);
    }

    onThresholdChange(value: number): void {
        if (value && value >= 1 && value <= 30) {
            this.recyclageAlertService.updateThreshold(value);
        }
    }

    refresh(): void {
        this.recyclageAlertService.refresh();
    }
}
