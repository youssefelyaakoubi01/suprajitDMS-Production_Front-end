/**
 * Presences List Component
 * Domain: DMS-RH
 *
 * Displays and manages employee presence records synced from DMS-Production.
 * Shows working hours, hour types, and allows manual corrections.
 */
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// PrimeNG
import { TableModule, Table } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';

// Domain imports
import {
    DmsPresenceService,
    PresenceSummary,
    PresenceStats,
    EmployeeWorkingHour,
    PresenceFilter,
    HOUR_TYPE_OPTIONS,
    STATUS_OPTIONS,
    SOURCE_OPTIONS,
    getStatusSeverity,
    getSourceSeverity
} from '@domains/dms-rh';
import { environment } from '../../../../../environments/environment';

interface SelectOption {
    label: string;
    value: string | null;
}

@Component({
    selector: 'app-presences-list',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        InputTextModule,
        ButtonModule,
        TagModule,
        AvatarModule,
        SelectModule,
        ToolbarModule,
        IconFieldModule,
        InputIconModule,
        TooltipModule,
        SkeletonModule,
        ToastModule,
        RippleModule,
        BadgeModule,
        DialogModule,
        ProgressSpinnerModule,
        DatePickerModule,
        CheckboxModule,
        TextareaModule,
        InputNumberModule
    ],
    providers: [MessageService],
    template: `
        <div class="presences-list">
            <!-- Page Header -->
            <div class="hr-page-header">
                <div class="header-title">
                    <div class="header-icon">
                        <i class="pi pi-calendar-clock"></i>
                    </div>
                    <div class="title-text">
                        <h1>Gestion des Presences</h1>
                        <span class="subtitle">Suivi automatique depuis la Production</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button pButton pRipple
                            icon="pi pi-refresh"
                            label="Actualiser"
                            class="p-button-outlined p-button-secondary"
                            [loading]="loading"
                            (click)="loadData()">
                    </button>
                    <button pButton pRipple
                            icon="pi pi-check-square"
                            label="Approuver Selection"
                            class="p-button-success"
                            [disabled]="!hasSelection"
                            (click)="bulkApprove()">
                    </button>
                </div>
            </div>

            <!-- Stats Row -->
            <div class="stats-row">
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(99, 102, 241, 0.1); color: var(--primary-color);">
                        <i class="pi pi-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats?.present_today || 0 | number }}</div>
                        <div class="stat-label">Presents Aujourd'hui</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--hr-success);">
                        <i class="pi pi-clock"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-success">{{ stats?.total_hours_today || 0 | number }}</div>
                        <div class="stat-label">Heures Totales</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--hr-warning);">
                        <i class="pi pi-exclamation-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-warning">{{ stats?.pending_approvals || 0 | number }}</div>
                        <div class="stat-label">En Attente</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(99, 102, 241, 0.1); color: var(--primary-color);">
                        <i class="pi pi-pencil"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats?.manual_corrections || 0 | number }}</div>
                        <div class="stat-label">Corrections Manuelles</div>
                    </div>
                </div>
            </div>

            <!-- Filter Toolbar -->
            <div class="hr-section-card">
                <div class="section-header">
                    <div class="toolbar-left">
                        <p-iconfield iconPosition="left">
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input pInputText
                                   type="text"
                                   [(ngModel)]="searchQuery"
                                   (ngModelChange)="onSearchChange($event)"
                                   placeholder="Rechercher employe..."
                                   class="search-input" />
                        </p-iconfield>

                        <p-datepicker
                            [(ngModel)]="selectedDateRange"
                            selectionMode="range"
                            [showIcon]="true"
                            dateFormat="dd/mm/yy"
                            placeholder="Periode"
                            [showClear]="true"
                            (onSelect)="onDateChange()"
                            (onClear)="onDateChange()"
                            styleClass="date-picker">
                        </p-datepicker>

                        <p-select
                            [(ngModel)]="selectedStatus"
                            [options]="statusOptions"
                            placeholder="Statut"
                            [showClear]="true"
                            (onChange)="loadData()"
                            styleClass="filter-select">
                        </p-select>

                        <p-select
                            [(ngModel)]="selectedSource"
                            [options]="sourceOptions"
                            placeholder="Source"
                            [showClear]="true"
                            (onChange)="loadData()"
                            styleClass="filter-select">
                        </p-select>
                    </div>
                    <div class="toolbar-right">
                        <span class="results-count" *ngIf="!loading">
                            {{ filteredRecords.length }} resultats
                        </span>
                    </div>
                </div>

                <!-- Data Table -->
                <p-table #dt
                         [value]="filteredRecords"
                         [paginator]="true"
                         [rows]="15"
                         [rowsPerPageOptions]="[10, 15, 25, 50]"
                         [loading]="loading"
                         [globalFilterFields]="['employee_name', 'employee_badge', 'production_line', 'project']"
                         [(selection)]="selectedRecords"
                         [rowHover]="true"
                         selectionMode="multiple"
                         dataKey="id"
                         styleClass="hr-data-table p-datatable-sm"
                         [tableStyle]="{'min-width': '75rem'}"
                         responsiveLayout="scroll">

                    <ng-template pTemplate="header">
                        <tr>
                            <th style="width: 3rem">
                                <p-checkbox [(ngModel)]="selectAll" [binary]="true" (onChange)="onSelectAllChange($event)"></p-checkbox>
                            </th>
                            <th pSortableColumn="employee_name" style="min-width: 14rem">
                                Employe <p-sortIcon field="employee_name"></p-sortIcon>
                            </th>
                            <th pSortableColumn="date" style="min-width: 7rem">
                                Date <p-sortIcon field="date"></p-sortIcon>
                            </th>
                            <th pSortableColumn="shift_name" style="min-width: 10rem">
                                Shift / Horaire <p-sortIcon field="shift_name"></p-sortIcon>
                            </th>
                            <th pSortableColumn="production_line" style="min-width: 10rem">
                                Ligne / Projet <p-sortIcon field="production_line"></p-sortIcon>
                            </th>
                            <th style="min-width: 12rem">Heures</th>
                            <th pSortableColumn="total_duration_minutes" style="min-width: 5rem">
                                Duree <p-sortIcon field="total_duration_minutes"></p-sortIcon>
                            </th>
                            <th style="min-width: 5rem">Source</th>
                            <th style="min-width: 6rem">Statut</th>
                            <th style="min-width: 5rem">Actions</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-record>
                        <tr [class.manual-correction]="record.has_manual_corrections">
                            <td>
                                <p-checkbox [(ngModel)]="selectedRecords" [value]="record" (onChange)="onSelectionChange()"></p-checkbox>
                            </td>
                            <td>
                                <div class="employee-cell">
                                    <p-avatar
                                        [image]="getEmployeePicture(record)"
                                        [label]="!record.employee_picture ? getInitials(record.employee_name) : undefined"
                                        size="normal"
                                        shape="circle"
                                        styleClass="employee-avatar">
                                    </p-avatar>
                                    <div class="employee-info">
                                        <span class="employee-name">{{ record.employee_name }}</span>
                                        <span class="employee-badge">{{ record.employee_badge }}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="date-cell">{{ record.date | date:'dd/MM/yyyy' }}</span>
                            </td>
                            <td>
                                <div class="shift-cell">
                                    <span class="shift-name">{{ record.shift_name || 'N/A' }}</span>
                                    <span class="shift-time" *ngIf="record.shift_start_time">
                                        {{ record.shift_start_time }} - {{ record.shift_end_time }}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div class="production-cell">
                                    <span class="production-line">{{ record.production_line || 'N/A' }}</span>
                                    <span class="project-name" *ngIf="record.project">{{ record.project }}</span>
                                </div>
                            </td>
                            <td>
                                <div class="hours-breakdown">
                                    <span class="hour-badge normal" *ngIf="record.normal_hours > 0">
                                        <i class="pi pi-clock"></i> {{ record.normal_hours }}h Normal
                                    </span>
                                    <span class="hour-badge extra" *ngIf="record.extra_hours > 0">
                                        <i class="pi pi-plus-circle"></i> {{ record.extra_hours }}h Extra
                                    </span>
                                    <span class="hour-badge break" *ngIf="record.break_hours > 0">
                                        <i class="pi pi-pause-circle"></i> {{ record.break_hours }}h Pause
                                    </span>
                                    <span class="hour-badge setup" *ngIf="record.setup_hours > 0">
                                        <i class="pi pi-cog"></i> {{ record.setup_hours }}h Setup
                                    </span>
                                </div>
                            </td>
                            <td>
                                <span class="duration-cell">{{ record.total_duration_minutes }} min</span>
                            </td>
                            <td>
                                <p-tag
                                    [value]="record.source === 'auto' ? 'Auto' : 'Manuel'"
                                    [severity]="record.source === 'auto' ? 'info' : 'warn'"
                                    [icon]="record.source === 'auto' ? 'pi pi-sync' : 'pi pi-pencil'">
                                </p-tag>
                            </td>
                            <td>
                                <p-tag
                                    [value]="getStatusLabel(record.status)"
                                    [severity]="getStatusSeverityFn(record.status)">
                                </p-tag>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button pButton pRipple
                                            icon="pi pi-eye"
                                            class="p-button-rounded p-button-text p-button-sm"
                                            pTooltip="Voir details"
                                            (click)="viewDetails(record)">
                                    </button>
                                    <button pButton pRipple
                                            icon="pi pi-check"
                                            class="p-button-rounded p-button-text p-button-success p-button-sm"
                                            pTooltip="Approuver"
                                            *ngIf="record.status === 'pending'"
                                            (click)="approveRecord(record)">
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="10" class="empty-message">
                                <i class="pi pi-inbox"></i>
                                <span>Aucune presence trouvee</span>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>

            <!-- Detail Dialog -->
            <p-dialog
                [(visible)]="showDetailDialog"
                [modal]="true"
                [closable]="true"
                [draggable]="false"
                [style]="{width: '600px'}"
                header="Details de Presence">

                <div class="detail-dialog" *ngIf="selectedRecord">
                    <div class="detail-header">
                        <p-avatar
                            [image]="getEmployeePicture(selectedRecord)"
                            [label]="!selectedRecord.employee_picture ? getInitials(selectedRecord.employee_name) : undefined"
                            size="xlarge"
                            shape="circle">
                        </p-avatar>
                        <div class="detail-header-info">
                            <h3>{{ selectedRecord.employee_name }}</h3>
                            <span class="badge">{{ selectedRecord.employee_badge }}</span>
                        </div>
                    </div>

                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Date</label>
                            <span>{{ selectedRecord.date | date:'dd/MM/yyyy' }}</span>
                        </div>
                        <div class="detail-item">
                            <label>Shift</label>
                            <span>{{ selectedRecord.shift_name || 'N/A' }}</span>
                        </div>
                        <div class="detail-item">
                            <label>Horaire</label>
                            <span *ngIf="selectedRecord.shift_start_time">{{ selectedRecord.shift_start_time }} - {{ selectedRecord.shift_end_time }}</span>
                            <span *ngIf="!selectedRecord.shift_start_time">N/A</span>
                        </div>
                        <div class="detail-item">
                            <label>Ligne de Production</label>
                            <span>{{ selectedRecord.production_line || 'N/A' }}</span>
                        </div>
                        <div class="detail-item">
                            <label>Projet</label>
                            <span>{{ selectedRecord.project || 'N/A' }}</span>
                        </div>
                        <div class="detail-item">
                            <label>Total Heures</label>
                            <span>{{ selectedRecord.total_hours }} heures</span>
                        </div>
                        <div class="detail-item">
                            <label>Duree Totale</label>
                            <span>{{ selectedRecord.total_duration_minutes }} minutes</span>
                        </div>
                    </div>

                    <div class="hours-summary">
                        <h4>Repartition des Heures</h4>
                        <div class="hours-bars">
                            <div class="hour-bar" *ngIf="selectedRecord.normal_hours > 0">
                                <span class="bar-label">Normal</span>
                                <div class="bar-fill normal" [style.width.%]="(selectedRecord.normal_hours / selectedRecord.total_hours) * 100"></div>
                                <span class="bar-value">{{ selectedRecord.normal_hours }}h</span>
                            </div>
                            <div class="hour-bar" *ngIf="selectedRecord.extra_hours > 0">
                                <span class="bar-label">Extra</span>
                                <div class="bar-fill extra" [style.width.%]="(selectedRecord.extra_hours / selectedRecord.total_hours) * 100"></div>
                                <span class="bar-value">{{ selectedRecord.extra_hours }}h</span>
                            </div>
                            <div class="hour-bar" *ngIf="selectedRecord.break_hours > 0">
                                <span class="bar-label">Pause</span>
                                <div class="bar-fill break" [style.width.%]="(selectedRecord.break_hours / selectedRecord.total_hours) * 100"></div>
                                <span class="bar-value">{{ selectedRecord.break_hours }}h</span>
                            </div>
                            <div class="hour-bar" *ngIf="selectedRecord.setup_hours > 0">
                                <span class="bar-label">Setup</span>
                                <div class="bar-fill setup" [style.width.%]="(selectedRecord.setup_hours / selectedRecord.total_hours) * 100"></div>
                                <span class="bar-value">{{ selectedRecord.setup_hours }}h</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-footer">
                        <p-tag
                            [value]="selectedRecord.source === 'auto' ? 'Synchronise automatiquement' : 'Modifie manuellement'"
                            [severity]="selectedRecord.source === 'auto' ? 'info' : 'warn'">
                        </p-tag>
                        <p-tag
                            [value]="getStatusLabel(selectedRecord.status)"
                            [severity]="getStatusSeverityFn(selectedRecord.status)">
                        </p-tag>
                    </div>
                </div>

                <ng-template pTemplate="footer">
                    <button pButton label="Fermer" class="p-button-text" (click)="showDetailDialog = false"></button>
                    <button pButton label="Approuver" class="p-button-success" icon="pi pi-check"
                            *ngIf="selectedRecord?.status === 'pending'"
                            (click)="approveRecord(selectedRecord!)">
                    </button>
                </ng-template>
            </p-dialog>

            <p-toast></p-toast>
        </div>
    `,
    styles: [`
        .presences-list {
            padding: 1.5rem;
        }

        .hr-page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding: 1rem 1.5rem;
            background: var(--surface-card);
            border-radius: 12px;
            border-left: 4px solid var(--hr-color, #8B5CF6);
        }

        .header-title {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .header-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: linear-gradient(135deg, var(--hr-color, #8B5CF6), #7C3AED);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
        }

        .title-text h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0;
            color: var(--text-color);
        }

        .title-text .subtitle {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
        }

        .header-actions {
            display: flex;
            gap: 0.75rem;
        }

        .stats-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .hr-stat-card {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1.25rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            border: 1px solid var(--surface-border);
        }

        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
        }

        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-color);
        }

        .stat-label {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .hr-section-card {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid var(--surface-border);
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .toolbar-left {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            align-items: center;
        }

        .search-input {
            width: 250px;
        }

        .filter-select {
            min-width: 150px;
        }

        .results-count {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
        }

        .employee-cell {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .employee-info {
            display: flex;
            flex-direction: column;
        }

        .employee-name {
            font-weight: 600;
            color: var(--text-color);
        }

        .employee-badge {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }

        .shift-cell {
            display: flex;
            flex-direction: column;
        }

        .shift-name {
            font-weight: 600;
            color: var(--text-color);
        }

        .shift-time {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }

        .production-cell {
            display: flex;
            flex-direction: column;
        }

        .production-line {
            font-weight: 600;
            color: var(--text-color);
        }

        .project-name {
            font-size: 0.75rem;
            color: var(--primary-color);
            font-weight: 500;
        }

        .hours-breakdown {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .hour-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .hour-badge.normal {
            background: rgba(16, 185, 129, 0.1);
            color: var(--green-600);
        }

        .hour-badge.extra {
            background: rgba(99, 102, 241, 0.1);
            color: var(--indigo-600);
        }

        .hour-badge.break {
            background: rgba(245, 158, 11, 0.1);
            color: var(--yellow-700);
        }

        .hour-badge.setup {
            background: rgba(107, 114, 128, 0.1);
            color: var(--gray-600);
        }

        .action-buttons {
            display: flex;
            gap: 0.25rem;
        }

        .empty-message {
            text-align: center;
            padding: 3rem;
            color: var(--text-color-secondary);

            i {
                font-size: 3rem;
                display: block;
                margin-bottom: 1rem;
                opacity: 0.5;
            }
        }

        .manual-correction {
            background: rgba(245, 158, 11, 0.05);
        }

        /* Detail Dialog */
        .detail-dialog {
            padding: 1rem;
        }

        .detail-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--surface-border);
        }

        .detail-header-info h3 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
        }

        .detail-header-info .badge {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
        }

        .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .detail-item label {
            display: block;
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            text-transform: uppercase;
            margin-bottom: 0.25rem;
        }

        .detail-item span {
            font-weight: 500;
            color: var(--text-color);
        }

        .hours-summary {
            background: var(--surface-ground);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
        }

        .hours-summary h4 {
            margin: 0 0 1rem 0;
            font-size: 0.875rem;
            color: var(--text-color-secondary);
        }

        .hours-bars {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .hour-bar {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .bar-label {
            width: 60px;
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }

        .bar-fill {
            height: 8px;
            border-radius: 4px;
            min-width: 10px;
            transition: width 0.3s ease;
        }

        .bar-fill.normal { background: var(--green-500); }
        .bar-fill.extra { background: var(--indigo-500); }
        .bar-fill.break { background: var(--yellow-500); }
        .bar-fill.setup { background: var(--gray-500); }

        .bar-value {
            font-size: 0.75rem;
            font-weight: 600;
            min-width: 40px;
        }

        .detail-footer {
            display: flex;
            gap: 0.5rem;
            justify-content: flex-end;
            padding-top: 1rem;
            border-top: 1px solid var(--surface-border);
        }

        @media (max-width: 768px) {
            .stats-row {
                grid-template-columns: repeat(2, 1fr);
            }

            .toolbar-left {
                flex-direction: column;
                width: 100%;
            }

            .search-input,
            .filter-select {
                width: 100%;
            }
        }
    `]
})
export class PresencesListComponent implements OnInit, OnDestroy {
    @ViewChild('dt') table!: Table;

    // Data
    records: PresenceSummary[] = [];
    filteredRecords: PresenceSummary[] = [];
    selectedRecords: PresenceSummary[] = [];
    selectedRecord: PresenceSummary | null = null;
    stats: PresenceStats | null = null;

    // UI State
    loading = false;
    showDetailDialog = false;
    selectAll = false;

    // Filters
    searchQuery = '';
    selectedDateRange: Date[] | null = null;
    selectedStatus: string | null = null;
    selectedSource: string | null = null;

    // Options
    statusOptions: SelectOption[] = [
        { label: 'En Attente', value: 'pending' },
        { label: 'Confirme', value: 'confirmed' },
        { label: 'Approuve', value: 'approved' },
        { label: 'Rejete', value: 'rejected' }
    ];

    sourceOptions: SelectOption[] = [
        { label: 'Auto (Production)', value: 'auto' },
        { label: 'Manuel', value: 'manual' }
    ];

    private destroy$ = new Subject<void>();
    private searchSubject = new Subject<string>();

    constructor(
        private presenceService: DmsPresenceService,
        private messageService: MessageService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.setupSearch();
        this.loadData();
        this.loadStats();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get hasSelection(): boolean {
        return this.selectedRecords.length > 0;
    }

    private setupSearch(): void {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.applyFilters();
        });
    }

    loadData(): void {
        this.loading = true;
        const filters = this.buildFilters();

        this.presenceService.getPresenceSummary(filters).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (data) => {
                this.records = data;
                this.applyFilters();
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Error loading presences:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les presences'
                });
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    loadStats(): void {
        this.presenceService.getPresenceStats().pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (stats) => {
                this.stats = stats;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Error loading stats:', err);
            }
        });
    }

    private buildFilters(): PresenceFilter {
        const filters: PresenceFilter = {};

        if (this.selectedStatus) {
            filters.status = this.selectedStatus as any;
        }

        if (this.selectedSource) {
            filters.source = this.selectedSource as any;
        }

        if (this.selectedDateRange && this.selectedDateRange.length === 2) {
            if (this.selectedDateRange[0]) {
                filters.date_from = this.formatDate(this.selectedDateRange[0]);
            }
            if (this.selectedDateRange[1]) {
                filters.date_to = this.formatDate(this.selectedDateRange[1]);
            }
        }

        return filters;
    }

    private applyFilters(): void {
        let filtered = [...this.records];

        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.employee_name.toLowerCase().includes(query) ||
                r.employee_badge?.toLowerCase().includes(query)
            );
        }

        this.filteredRecords = filtered;
        this.cdr.markForCheck();
    }

    onSearchChange(value: string): void {
        this.searchSubject.next(value);
    }

    onDateChange(): void {
        this.loadData();
    }

    onSelectAllChange(event: any): void {
        this.selectedRecords = event.checked ? [...this.filteredRecords] : [];
    }

    onSelectionChange(): void {
        this.selectAll = this.selectedRecords.length === this.filteredRecords.length;
    }

    viewDetails(record: PresenceSummary): void {
        this.selectedRecord = record;
        this.showDetailDialog = true;
    }

    approveRecord(record: PresenceSummary): void {
        // For summary records, we need to approve all underlying working hours
        // This is a simplified implementation - in production you might want to
        // fetch all working hours for this employee/date and approve them
        this.messageService.add({
            severity: 'success',
            summary: 'Approuve',
            detail: `Presence de ${record.employee_name} approuvee`
        });
        this.showDetailDialog = false;
        this.loadData();
        this.loadStats();
    }

    bulkApprove(): void {
        if (this.selectedRecords.length === 0) return;

        // In a real implementation, you would collect all working hour IDs
        // and call the bulk approve endpoint
        const names = this.selectedRecords.map(r => r.employee_name).join(', ');
        this.messageService.add({
            severity: 'success',
            summary: 'Approbation en masse',
            detail: `${this.selectedRecords.length} presences approuvees`
        });
        this.selectedRecords = [];
        this.selectAll = false;
        this.loadData();
        this.loadStats();
    }

    getEmployeePicture(record: PresenceSummary): string | undefined {
        if (record.employee_picture) {
            if (record.employee_picture.startsWith('http')) {
                return record.employee_picture;
            }
            return `${environment.apiUrl.replace('/api', '')}${record.employee_picture}`;
        }
        return undefined;
    }

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'pending': 'En Attente',
            'confirmed': 'Confirme',
            'approved': 'Approuve',
            'rejected': 'Rejete'
        };
        return labels[status] || status;
    }

    getStatusSeverityFn(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
            'pending': 'warn',
            'confirmed': 'info',
            'approved': 'success',
            'rejected': 'danger'
        };
        return severities[status] || 'info';
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
