/**
 * Activity Logs Component
 * Domain: DMS-Admin
 *
 * Enhanced view and filter user activity logs with modern UI/UX
 * Uses PrimeNG components and PrimeFlex for professional interface
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { TimelineModule } from 'primeng/timeline';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { ActivityLog, ActivityAction, ActivityTargetType } from '../../models';

interface ActionOption {
    label: string;
    value: ActivityAction;
    icon: string;
    color: string;
}

interface StatSummary {
    label: string;
    count: number;
    icon: string;
    color: string;
    gradient: string;
}

@Component({
    selector: 'app-activity-logs',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TableModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        DatePickerModule,
        TagModule,
        ToolbarModule,
        ToastModule,
        SkeletonModule,
        AvatarModule,
        TooltipModule,
        RippleModule,
        DividerModule,
        TimelineModule,
        InputGroupModule,
        InputGroupAddonModule
    ],
    providers: [MessageService],
    template: `
        <p-toast position="top-right"></p-toast>

        <div class="flex flex-column gap-4">
            <!-- Header Card -->
            <div class="surface-card shadow-2 border-round-xl p-4">
                <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-4">
                    <div class="flex align-items-center gap-4">
                        <div class="flex align-items-center justify-content-center border-round-xl"
                             style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);">
                            <i class="pi pi-history text-white text-3xl"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl md:text-3xl font-bold m-0 text-900">Logs d'Activité</h1>
                            <p class="text-500 mt-1 mb-0">
                                <span class="font-semibold text-primary">{{ logs.length }}</span> événement(s) enregistré(s)
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-2 flex-wrap">
                        <button pButton pRipple label="Actualiser" icon="pi pi-refresh"
                                class="p-button-outlined" (click)="loadLogs()" [loading]="loading"></button>
                        <button pButton pRipple label="Exporter" icon="pi pi-download"
                                class="p-button-secondary" (click)="exportLogs()"></button>
                    </div>
                </div>
            </div>

            <!-- DMS-Tech Logs Section -->
            <div class="surface-card shadow-2 border-round-xl p-4">
                <div class="flex align-items-center gap-3 mb-4">
                    <div class="flex align-items-center justify-content-center border-round-xl"
                         style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
                        <i class="pi pi-database text-white text-xl"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-semibold m-0 text-900">Logs DMS-Tech</h2>
                        <p class="text-500 text-sm m-0">Historique des modifications des données de production</p>
                    </div>
                </div>
                <div class="grid">
                    <div class="col-6 md:col-4 lg:col-2" *ngFor="let log of techLogs">
                        <a [routerLink]="log.route" class="no-underline">
                            <div class="surface-hover border-round-lg p-3 text-center cursor-pointer transition-all transition-duration-200"
                                 style="border: 1px solid var(--surface-border);">
                                <i [class]="log.icon + ' text-2xl mb-2'" [style.color]="log.color"></i>
                                <div class="text-900 font-medium text-sm">{{ log.label }}</div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid">
                <div class="col-6 md:col-3" *ngFor="let stat of statsSummary; let i = index">
                    <div class="surface-card shadow-2 border-round-xl overflow-hidden h-full stat-card"
                         [class.animate-in]="!loading" [style.animation-delay]="(i * 100) + 'ms'">
                        <div class="p-4 flex align-items-center gap-3">
                            <div class="flex align-items-center justify-content-center border-round-xl"
                                 [style.background]="stat.gradient"
                                 style="width: 3rem; height: 3rem;">
                                <i [class]="stat.icon + ' text-white text-xl'"></i>
                            </div>
                            <div>
                                <div class="text-3xl font-bold text-900" *ngIf="!loading">{{ stat.count }}</div>
                                <p-skeleton *ngIf="loading" width="2.5rem" height="2rem"></p-skeleton>
                                <div class="text-500 text-sm font-medium">{{ stat.label }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content Card -->
            <div class="surface-card shadow-2 border-round-xl overflow-hidden">
                <!-- Filters Bar -->
                <div class="p-4 surface-ground border-bottom-1 surface-border">
                    <div class="flex flex-column lg:flex-row gap-3 align-items-start lg:align-items-end">
                        <!-- Action Filter -->
                        <div class="flex flex-column gap-2">
                            <label class="font-medium text-sm text-700">Action</label>
                            <p-select [options]="actionOptions" [(ngModel)]="selectedAction"
                                      (onChange)="loadLogs()" placeholder="Toutes les actions"
                                      [showClear]="true" styleClass="w-full md:w-auto" style="min-width: 200px;">
                                <ng-template let-action pTemplate="selectedItem">
                                    <div class="flex align-items-center gap-2" *ngIf="action">
                                        <span class="flex align-items-center justify-content-center border-round"
                                              [style.background]="action.color" style="width: 1.5rem; height: 1.5rem;">
                                            <i [class]="action.icon + ' text-white'" style="font-size: 0.7rem;"></i>
                                        </span>
                                        <span>{{ action.label }}</span>
                                    </div>
                                </ng-template>
                                <ng-template let-action pTemplate="item">
                                    <div class="flex align-items-center gap-2">
                                        <span class="flex align-items-center justify-content-center border-round"
                                              [style.background]="action.color" style="width: 1.5rem; height: 1.5rem;">
                                            <i [class]="action.icon + ' text-white'" style="font-size: 0.7rem;"></i>
                                        </span>
                                        <span>{{ action.label }}</span>
                                    </div>
                                </ng-template>
                            </p-select>
                        </div>

                        <!-- Date Range -->
                        <div class="flex flex-column gap-2">
                            <label class="font-medium text-sm text-700">Période</label>
                            <div class="flex gap-2">
                                <p-datepicker [(ngModel)]="fromDate" (onSelect)="loadLogs()"
                                              dateFormat="dd/mm/yy" [showIcon]="true"
                                              [showClear]="true" placeholder="Du..."
                                              [maxDate]="toDate || today"
                                              styleClass="w-full" style="min-width: 140px;">
                                </p-datepicker>
                                <p-datepicker [(ngModel)]="toDate" (onSelect)="loadLogs()"
                                              dateFormat="dd/mm/yy" [showIcon]="true"
                                              [showClear]="true" placeholder="Au..."
                                              [minDate]="fromDate"
                                              [maxDate]="today"
                                              styleClass="w-full" style="min-width: 140px;">
                                </p-datepicker>
                            </div>
                        </div>

                        <!-- Quick Filters -->
                        <div class="flex flex-column gap-2">
                            <label class="font-medium text-sm text-700">Raccourcis</label>
                            <div class="flex gap-1">
                                <button pButton pRipple label="Aujourd'hui" class="p-button-sm p-button-text"
                                        [class.p-button-primary]="quickFilter === 'today'"
                                        (click)="setQuickFilter('today')"></button>
                                <button pButton pRipple label="7 jours" class="p-button-sm p-button-text"
                                        [class.p-button-primary]="quickFilter === '7days'"
                                        (click)="setQuickFilter('7days')"></button>
                                <button pButton pRipple label="30 jours" class="p-button-sm p-button-text"
                                        [class.p-button-primary]="quickFilter === '30days'"
                                        (click)="setQuickFilter('30days')"></button>
                            </div>
                        </div>

                        <!-- Spacer -->
                        <div class="flex-1"></div>

                        <!-- Reset -->
                        <button pButton pRipple icon="pi pi-filter-slash" label="Réinitialiser"
                                class="p-button-outlined p-button-secondary"
                                (click)="resetFilters()" *ngIf="hasActiveFilters"></button>
                    </div>
                </div>

                <!-- View Toggle -->
                <div class="flex align-items-center justify-content-between p-3 border-bottom-1 surface-border">
                    <div class="flex gap-2">
                        <button pButton pRipple icon="pi pi-table" pTooltip="Vue tableau"
                                [class]="viewMode === 'table' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'"
                                class="p-button-sm" (click)="viewMode = 'table'"></button>
                        <button pButton pRipple icon="pi pi-clock" pTooltip="Vue timeline"
                                [class]="viewMode === 'timeline' ? 'p-button-primary' : 'p-button-outlined p-button-secondary'"
                                class="p-button-sm" (click)="viewMode = 'timeline'"></button>
                    </div>
                    <span class="text-500 text-sm">
                        {{ logs.length }} résultat(s)
                    </span>
                </div>

                <!-- Table View -->
                <div *ngIf="viewMode === 'table'">
                    <p-table [value]="logs" [rows]="15" [paginator]="true"
                             [rowsPerPageOptions]="[15, 30, 50, 100]" [loading]="loading"
                             [showCurrentPageReport]="true"
                             currentPageReportTemplate="Affichage {first} à {last} sur {totalRecords}"
                             styleClass="p-datatable-sm"
                             [rowHover]="true">

                        <ng-template pTemplate="header">
                            <tr>
                                <th style="width: 180px">Date/Heure</th>
                                <th style="width: 200px">Utilisateur</th>
                                <th style="width: 160px">Action</th>
                                <th style="width: 120px">Type</th>
                                <th>Cible</th>
                                <th>Détails</th>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="body" let-log>
                            <tr>
                                <td>
                                    <div class="flex flex-column">
                                        <span class="font-semibold text-900">{{ formatDate(log.created_at) }}</span>
                                        <span class="text-500 text-sm">{{ formatTime(log.created_at) }}</span>
                                    </div>
                                </td>
                                <td>
                                    <div class="flex align-items-center gap-2">
                                        <p-avatar [label]="getInitials(log.user_name)"
                                                  [style]="{'background': getAvatarGradient(log.user_name), 'color': '#fff', 'font-size': '0.75rem'}"
                                                  shape="circle" size="normal"></p-avatar>
                                        <span class="font-medium text-900">{{ log.user_name }}</span>
                                    </div>
                                </td>
                                <td>
                                    <div class="flex align-items-center gap-2">
                                        <span class="flex align-items-center justify-content-center border-round-lg"
                                              [style.background]="getActionColor(log.action)"
                                              style="width: 2rem; height: 2rem;">
                                            <i [class]="getActionIcon(log.action) + ' text-white'" style="font-size: 0.8rem;"></i>
                                        </span>
                                        <span class="font-medium">{{ getActionLabel(log.action) }}</span>
                                    </div>
                                </td>
                                <td>
                                    <p-tag [value]="getTargetTypeLabel(log.target_type)"
                                           [severity]="getTargetTypeSeverity(log.target_type)"
                                           [rounded]="true"></p-tag>
                                </td>
                                <td>
                                    <span *ngIf="log.target_name" class="font-medium text-900">{{ log.target_name }}</span>
                                    <span *ngIf="!log.target_name" class="text-400">—</span>
                                </td>
                                <td>
                                    <span *ngIf="log.details" class="text-600 text-sm line-clamp-1"
                                          [pTooltip]="log.details" tooltipPosition="top">
                                        {{ log.details }}
                                    </span>
                                    <span *ngIf="!log.details" class="text-400">—</span>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="6">
                                    <div class="flex flex-column align-items-center justify-content-center py-6">
                                        <div class="flex align-items-center justify-content-center border-round-xl surface-ground mb-4"
                                             style="width: 5rem; height: 5rem;">
                                            <i class="pi pi-inbox text-4xl text-500"></i>
                                        </div>
                                        <span class="font-semibold text-900 mb-1">Aucun log trouvé</span>
                                        <span class="text-500 text-sm">Essayez de modifier vos filtres</span>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="loadingbody">
                            <tr *ngFor="let i of [1,2,3,4,5,6,7,8]">
                                <td>
                                    <div class="flex flex-column gap-1">
                                        <p-skeleton width="80px" height="1rem"></p-skeleton>
                                        <p-skeleton width="50px" height="0.8rem"></p-skeleton>
                                    </div>
                                </td>
                                <td>
                                    <div class="flex align-items-center gap-2">
                                        <p-skeleton shape="circle" size="2rem"></p-skeleton>
                                        <p-skeleton width="100px" height="1rem"></p-skeleton>
                                    </div>
                                </td>
                                <td>
                                    <div class="flex align-items-center gap-2">
                                        <p-skeleton width="2rem" height="2rem" borderRadius="8px"></p-skeleton>
                                        <p-skeleton width="80px" height="1rem"></p-skeleton>
                                    </div>
                                </td>
                                <td><p-skeleton width="70px" height="1.5rem" borderRadius="16px"></p-skeleton></td>
                                <td><p-skeleton width="90px" height="1rem"></p-skeleton></td>
                                <td><p-skeleton width="120px" height="1rem"></p-skeleton></td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>

                <!-- Timeline View -->
                <div *ngIf="viewMode === 'timeline'" class="p-4">
                    <div *ngIf="!loading && logs.length > 0" class="timeline-container">
                        <div *ngFor="let log of logs.slice(0, 20); let last = last"
                             class="flex gap-4 pb-4" [class.border-bottom-1]="!last" [class.surface-border]="!last" [class.mb-4]="!last">
                            <!-- Timeline Marker -->
                            <div class="flex flex-column align-items-center">
                                <div class="flex align-items-center justify-content-center border-round-xl shadow-2"
                                     [style.background]="getActionColor(log.action)"
                                     style="width: 3rem; height: 3rem;">
                                    <i [class]="getActionIcon(log.action) + ' text-white text-lg'"></i>
                                </div>
                                <div *ngIf="!last" class="flex-1 w-1px bg-primary-100 mt-2"></div>
                            </div>

                            <!-- Content -->
                            <div class="flex-1">
                                <div class="flex align-items-center justify-content-between mb-2">
                                    <div class="flex align-items-center gap-2">
                                        <p-avatar [label]="getInitials(log.user_name)"
                                                  [style]="{'background': getAvatarGradient(log.user_name), 'color': '#fff', 'font-size': '0.7rem'}"
                                                  shape="circle" size="normal"></p-avatar>
                                        <span class="font-semibold text-900">{{ log.user_name }}</span>
                                        <span class="text-500">{{ getActionLabel(log.action) }}</span>
                                        <span *ngIf="log.target_name" class="font-medium text-primary">{{ log.target_name }}</span>
                                    </div>
                                    <span class="text-500 text-sm white-space-nowrap">{{ formatRelativeTime(log.created_at) }}</span>
                                </div>
                                <div class="flex align-items-center gap-2">
                                    <p-tag [value]="getTargetTypeLabel(log.target_type)"
                                           [severity]="getTargetTypeSeverity(log.target_type)"
                                           [rounded]="true" styleClass="text-xs"></p-tag>
                                    <span *ngIf="log.details" class="text-600 text-sm">{{ log.details }}</span>
                                </div>
                            </div>
                        </div>

                        <div *ngIf="logs.length > 20" class="text-center pt-4">
                            <button pButton pRipple label="Voir plus dans le tableau" icon="pi pi-table"
                                    class="p-button-text" (click)="viewMode = 'table'"></button>
                        </div>
                    </div>

                    <div *ngIf="loading" class="flex flex-column gap-4">
                        <div *ngFor="let i of [1,2,3,4,5]" class="flex gap-4">
                            <p-skeleton shape="circle" size="3rem"></p-skeleton>
                            <div class="flex-1 flex flex-column gap-2">
                                <p-skeleton width="60%" height="1rem"></p-skeleton>
                                <p-skeleton width="40%" height="0.8rem"></p-skeleton>
                            </div>
                        </div>
                    </div>

                    <div *ngIf="!loading && logs.length === 0"
                         class="flex flex-column align-items-center justify-content-center py-6 text-500">
                        <i class="pi pi-inbox text-4xl mb-3"></i>
                        <span class="font-medium">Aucun log trouvé</span>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host ::ng-deep {
            .p-datatable .p-datatable-tbody > tr > td {
                padding: 0.75rem 1rem;
                vertical-align: middle;
            }

            .p-datatable .p-datatable-thead > tr > th {
                padding: 1rem;
                background: var(--surface-50);
                font-weight: 600;
            }

            .p-datatable .p-datatable-tbody > tr:hover {
                background: var(--surface-50) !important;
            }

            .p-paginator {
                padding: 1rem;
                border-top: 1px solid var(--surface-border);
            }
        }

        .stat-card {
            opacity: 0;
            transform: translateY(20px);
        }

        .stat-card.animate-in {
            animation: slideUp 0.5s ease forwards;
        }

        @keyframes slideUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    `]
})
export class ActivityLogsComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    logs: ActivityLog[] = [];
    loading = true;
    viewMode: 'table' | 'timeline' = 'table';
    quickFilter: 'today' | '7days' | '30days' | null = null;
    today = new Date();

    selectedAction: ActivityAction | null = null;
    fromDate: Date | null = null;
    toDate: Date | null = null;

    statsSummary: StatSummary[] = [
        { label: 'Connexions', count: 0, icon: 'pi pi-sign-in', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
        { label: 'Créations', count: 0, icon: 'pi pi-plus', color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
        { label: 'Modifications', count: 0, icon: 'pi pi-pencil', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
        { label: 'Suppressions', count: 0, icon: 'pi pi-trash', color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }
    ];

    actionOptions: ActionOption[] = [
        { label: 'Connexion', value: 'login', icon: 'pi pi-sign-in', color: '#10B981' },
        { label: 'Déconnexion', value: 'logout', icon: 'pi pi-sign-out', color: '#6B7280' },
        { label: 'Création', value: 'create', icon: 'pi pi-plus', color: '#3B82F6' },
        { label: 'Modification', value: 'update', icon: 'pi pi-pencil', color: '#F59E0B' },
        { label: 'Suppression', value: 'delete', icon: 'pi pi-trash', color: '#EF4444' },
        { label: 'Changement permissions', value: 'permission_change', icon: 'pi pi-lock', color: '#8B5CF6' },
        { label: 'Reset mot de passe', value: 'password_reset', icon: 'pi pi-key', color: '#EC4899' }
    ];

    techLogs = [
        { label: 'Parts', icon: 'pi pi-box', route: '/dms-admin/activity-logs/parts-history', color: '#3B82F6' },
        { label: 'Projects', icon: 'pi pi-folder', route: '/dms-admin/activity-logs/projects-history', color: '#8B5CF6' },
        { label: 'Zones', icon: 'pi pi-map', route: '/dms-admin/activity-logs/zones-history', color: '#F59E0B' },
        { label: 'Prod. Lines', icon: 'pi pi-sitemap', route: '/dms-admin/activity-logs/production-lines-history', color: '#10B981' },
        { label: 'Processes', icon: 'pi pi-cog', route: '/dms-admin/activity-logs/processes-history', color: '#EC4899' }
    ];

    get hasActiveFilters(): boolean {
        return !!(this.selectedAction || this.fromDate || this.toDate);
    }

    constructor(
        private adminService: AdminService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadLogs();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadLogs(): void {
        this.loading = true;

        const params: any = {};
        if (this.selectedAction) params.action = this.selectedAction;
        if (this.fromDate) params.from_date = this.formatDateForApi(this.fromDate);
        if (this.toDate) params.to_date = this.formatDateForApi(this.toDate);

        this.adminService.getActivityLogs(params)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (logs) => {
                    this.logs = logs;
                    this.updateStats(logs);
                    this.loading = false;
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Impossible de charger les logs'
                    });
                    this.loading = false;
                }
            });
    }

    setQuickFilter(filter: 'today' | '7days' | '30days'): void {
        this.quickFilter = filter;
        const now = new Date();
        this.toDate = now;

        switch (filter) {
            case 'today':
                this.fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case '7days':
                this.fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30days':
                this.fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }

        this.loadLogs();
    }

    resetFilters(): void {
        this.selectedAction = null;
        this.fromDate = null;
        this.toDate = null;
        this.quickFilter = null;
        this.loadLogs();
    }

    exportLogs(): void {
        // Simple CSV export
        const headers = ['Date', 'Utilisateur', 'Action', 'Type', 'Cible', 'Détails'];
        const rows = this.logs.map(log => [
            new Date(log.created_at).toLocaleString('fr-FR'),
            log.user_name,
            this.getActionLabel(log.action),
            this.getTargetTypeLabel(log.target_type),
            log.target_name || '',
            log.details || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.messageService.add({
            severity: 'success',
            summary: 'Export réussi',
            detail: 'Les logs ont été exportés au format CSV',
            life: 3000
        });
    }

    private updateStats(logs: ActivityLog[]): void {
        this.statsSummary = [
            {
                label: 'Connexions',
                count: logs.filter(l => l.action === 'login').length,
                icon: 'pi pi-sign-in',
                color: '#10B981',
                gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            },
            {
                label: 'Créations',
                count: logs.filter(l => l.action === 'create').length,
                icon: 'pi pi-plus',
                color: '#3B82F6',
                gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
            },
            {
                label: 'Modifications',
                count: logs.filter(l => l.action === 'update').length,
                icon: 'pi pi-pencil',
                color: '#F59E0B',
                gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
            },
            {
                label: 'Suppressions',
                count: logs.filter(l => l.action === 'delete').length,
                icon: 'pi pi-trash',
                color: '#EF4444',
                gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
            }
        ];
    }

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.split(' ');
        return parts.map(p => p[0]).join('').toUpperCase().substring(0, 2);
    }

    getAvatarGradient(name: string): string {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
        ];
        const hash = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return gradients[hash % gradients.length];
    }

    getActionIcon(action: ActivityAction): string {
        const found = this.actionOptions.find(a => a.value === action);
        return found?.icon || 'pi pi-circle';
    }

    getActionColor(action: ActivityAction): string {
        const found = this.actionOptions.find(a => a.value === action);
        return found?.color || '#6B7280';
    }

    getActionLabel(action: ActivityAction): string {
        const found = this.actionOptions.find(a => a.value === action);
        return found?.label || action;
    }

    getTargetTypeLabel(type: ActivityTargetType): string {
        const labels: Record<ActivityTargetType, string> = {
            'user': 'Utilisateur',
            'permission': 'Permission',
            'session': 'Session',
            'settings': 'Paramètres'
        };
        return labels[type] || type;
    }

    getTargetTypeSeverity(type: ActivityTargetType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const severities: Record<ActivityTargetType, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            'user': 'info',
            'permission': 'warn',
            'session': 'success',
            'settings': 'secondary'
        };
        return severities[type] || 'secondary';
    }

    formatDate(date: Date | string): string {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    formatTime(date: Date | string): string {
        return new Date(date).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatRelativeTime(date: Date | string): string {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes}min`;
        if (hours < 24) return `Il y a ${hours}h`;
        if (days < 7) return `Il y a ${days}j`;

        return this.formatDate(date);
    }

    private formatDateForApi(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}
