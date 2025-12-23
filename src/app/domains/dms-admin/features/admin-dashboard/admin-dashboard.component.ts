/**
 * Admin Dashboard Component
 * Domain: DMS-Admin
 *
 * Enhanced dashboard with user statistics, charts, and recent activity
 * Uses PrimeNG components and PrimeFlex for modern UI/UX
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TimelineModule } from 'primeng/timeline';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';
import { Subject, takeUntil } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '@core/services/auth.service';
import {
    AdminDashboardStats,
    ActivityLog,
    DMS_MODULE_PERMISSIONS
} from '../../models';

interface StatCard {
    label: string;
    value: number;
    icon: string;
    gradient: string;
    trend?: number;
    trendLabel?: string;
}

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        CardModule,
        ChartModule,
        TableModule,
        TagModule,
        ButtonModule,
        SkeletonModule,
        TimelineModule,
        AvatarModule,
        AvatarGroupModule,
        RippleModule,
        TooltipModule,
        DividerModule,
        BadgeModule,
        ProgressBarModule
    ],
    template: `
        <div class="flex flex-column gap-4">
            <!-- Welcome Header -->
            <div class="surface-card shadow-2 border-round-xl p-4">
                <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-4">
                    <div class="flex align-items-center gap-4">
                        <div class="flex align-items-center justify-content-center border-round-xl"
                             style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <i class="pi pi-shield text-white text-3xl"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl md:text-3xl font-bold m-0 text-900">
                                Bienvenue, {{ currentUserName }}
                            </h1>
                            <p class="text-500 mt-1 mb-0 text-sm md:text-base">
                                Panneau d'administration DMS • {{ currentDate }}
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-2 flex-wrap">
                        <button pButton pRipple label="Nouvel Utilisateur" icon="pi pi-user-plus"
                                class="p-button-primary" routerLink="/dms-admin/users"></button>
                        <button pButton pRipple label="Voir Logs" icon="pi pi-history"
                                class="p-button-outlined" routerLink="/dms-admin/activity-logs"></button>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid">
                <div class="col-12 sm:col-6 lg:col-3" *ngFor="let stat of statCards; let i = index">
                    <div class="h-full surface-card shadow-2 border-round-xl overflow-hidden stat-card"
                         [class.animate-in]="!loading" [style.animation-delay]="(i * 100) + 'ms'">
                        <div class="p-4" [style.background]="stat.gradient">
                            <div class="flex align-items-center justify-content-between mb-3">
                                <div class="flex align-items-center justify-content-center bg-white-alpha-30 border-round-lg"
                                     style="width: 3rem; height: 3rem;">
                                    <i [class]="stat.icon + ' text-white text-xl'"></i>
                                </div>
                                <div *ngIf="stat.trend !== undefined"
                                     class="flex align-items-center gap-1 px-2 py-1 border-round-lg"
                                     [class.bg-green-400]="stat.trend >= 0"
                                     [class.bg-red-400]="stat.trend < 0">
                                    <i [class]="stat.trend >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"
                                       class="text-white text-xs"></i>
                                    <span class="text-white text-xs font-semibold">{{ Math.abs(stat.trend) }}%</span>
                                </div>
                            </div>
                            <div class="text-white">
                                <div class="text-4xl font-bold mb-1" *ngIf="!loading">{{ stat.value }}</div>
                                <p-skeleton *ngIf="loading" width="4rem" height="2.5rem" styleClass="mb-1"></p-skeleton>
                                <div class="text-white-alpha-80 font-medium">{{ stat.label }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="grid">
                <div class="col-12 lg:col-6">
                    <div class="surface-card shadow-2 border-round-xl h-full">
                        <div class="flex align-items-center justify-content-between p-4 border-bottom-1 surface-border">
                            <div class="flex align-items-center gap-2">
                                <div class="flex align-items-center justify-content-center border-round-lg bg-blue-100"
                                     style="width: 2.5rem; height: 2.5rem;">
                                    <i class="pi pi-users text-blue-600"></i>
                                </div>
                                <span class="font-semibold text-900">Utilisateurs par Rôle</span>
                            </div>
                            <p-tag [severity]="'info'"
                                   [value]="stats.total_users + ' users'" *ngIf="stats"></p-tag>
                        </div>
                        <div class="p-4">
                            <div style="height: 280px;" *ngIf="!loading && roleChartData">
                                <p-chart type="doughnut" [data]="roleChartData" [options]="doughnutChartOptions"></p-chart>
                            </div>
                            <div *ngIf="loading" class="flex align-items-center justify-content-center" style="height: 280px;">
                                <p-skeleton shape="circle" size="180px"></p-skeleton>
                            </div>
                            <div *ngIf="!loading && (!roleChartData || !roleChartData.labels?.length)"
                                 class="flex flex-column align-items-center justify-content-center text-500" style="height: 280px;">
                                <i class="pi pi-chart-pie text-4xl mb-3"></i>
                                <span>Aucune donnée disponible</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 lg:col-6">
                    <div class="surface-card shadow-2 border-round-xl h-full">
                        <div class="flex align-items-center justify-content-between p-4 border-bottom-1 surface-border">
                            <div class="flex align-items-center gap-2">
                                <div class="flex align-items-center justify-content-center border-round-lg bg-purple-100"
                                     style="width: 2.5rem; height: 2.5rem;">
                                    <i class="pi pi-th-large text-purple-600"></i>
                                </div>
                                <span class="font-semibold text-900">Accès aux Modules</span>
                            </div>
                        </div>
                        <div class="p-4">
                            <div style="height: 280px;" *ngIf="!loading && moduleChartData">
                                <p-chart type="bar" [data]="moduleChartData" [options]="barChartOptions"></p-chart>
                            </div>
                            <div *ngIf="loading" class="flex flex-column gap-3" style="height: 280px;">
                                <div *ngFor="let i of [1,2,3,4,5]" class="flex align-items-center gap-3">
                                    <p-skeleton width="80px" height="1rem"></p-skeleton>
                                    <p-skeleton width="100%" height="1.5rem"></p-skeleton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions & Activity Row -->
            <div class="grid">
                <!-- Quick Actions -->
                <div class="col-12 lg:col-4">
                    <div class="surface-card shadow-2 border-round-xl h-full">
                        <div class="flex align-items-center gap-2 p-4 border-bottom-1 surface-border">
                            <div class="flex align-items-center justify-content-center border-round-lg bg-orange-100"
                                 style="width: 2.5rem; height: 2.5rem;">
                                <i class="pi pi-bolt text-orange-600"></i>
                            </div>
                            <span class="font-semibold text-900">Actions Rapides</span>
                        </div>
                        <div class="p-4 flex flex-column gap-3">
                            <a pRipple routerLink="/dms-admin/users"
                               class="flex align-items-center gap-3 p-3 border-round-lg surface-hover cursor-pointer transition-all transition-duration-200 no-underline text-900"
                               style="border: 1px solid var(--surface-border);">
                                <div class="flex align-items-center justify-content-center border-round-lg"
                                     style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);">
                                    <i class="pi pi-user-plus text-white"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="font-semibold">Créer Utilisateur</div>
                                    <div class="text-500 text-sm">Ajouter un nouvel accès</div>
                                </div>
                                <i class="pi pi-chevron-right text-500"></i>
                            </a>

                            <a pRipple routerLink="/dms-admin/activity-logs"
                               class="flex align-items-center gap-3 p-3 border-round-lg surface-hover cursor-pointer transition-all transition-duration-200 no-underline text-900"
                               style="border: 1px solid var(--surface-border);">
                                <div class="flex align-items-center justify-content-center border-round-lg"
                                     style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
                                    <i class="pi pi-history text-white"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="font-semibold">Logs d'Activité</div>
                                    <div class="text-500 text-sm">Consulter l'historique</div>
                                </div>
                                <i class="pi pi-chevron-right text-500"></i>
                            </a>

                            <a pRipple routerLink="/dms-admin/users"
                               class="flex align-items-center gap-3 p-3 border-round-lg surface-hover cursor-pointer transition-all transition-duration-200 no-underline text-900"
                               style="border: 1px solid var(--surface-border);">
                                <div class="flex align-items-center justify-content-center border-round-lg"
                                     style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
                                    <i class="pi pi-lock text-white"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="font-semibold">Gérer Permissions</div>
                                    <div class="text-500 text-sm">Modifier les accès</div>
                                </div>
                                <i class="pi pi-chevron-right text-500"></i>
                            </a>

                            <p-divider></p-divider>

                            <a pRipple routerLink="/dms-home"
                               class="flex align-items-center gap-3 p-3 border-round-lg surface-hover cursor-pointer transition-all transition-duration-200 no-underline text-900"
                               style="border: 1px solid var(--surface-border);">
                                <div class="flex align-items-center justify-content-center border-round-lg surface-200"
                                     style="width: 2.5rem; height: 2.5rem;">
                                    <i class="pi pi-home text-600"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="font-semibold">Retour à l'accueil</div>
                                    <div class="text-500 text-sm">DMS Home</div>
                                </div>
                                <i class="pi pi-chevron-right text-500"></i>
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="col-12 lg:col-8">
                    <div class="surface-card shadow-2 border-round-xl h-full">
                        <div class="flex align-items-center justify-content-between p-4 border-bottom-1 surface-border">
                            <div class="flex align-items-center gap-2">
                                <div class="flex align-items-center justify-content-center border-round-lg bg-cyan-100"
                                     style="width: 2.5rem; height: 2.5rem;">
                                    <i class="pi pi-clock text-cyan-600"></i>
                                </div>
                                <span class="font-semibold text-900">Activité Récente</span>
                            </div>
                            <button pButton pRipple label="Voir tout" icon="pi pi-external-link"
                                    class="p-button-text p-button-sm" routerLink="/dms-admin/activity-logs"></button>
                        </div>
                        <div class="p-4">
                            <div *ngIf="!loading && recentActivities.length > 0">
                                <div *ngFor="let activity of recentActivities; let last = last"
                                     class="flex align-items-start gap-3 py-3"
                                     [class.border-bottom-1]="!last" [class.surface-border]="!last">
                                    <div class="flex align-items-center justify-content-center border-round-lg flex-shrink-0"
                                         [style.background]="getActionColor(activity.action)"
                                         style="width: 2.5rem; height: 2.5rem;">
                                        <i [class]="getActionIcon(activity.action) + ' text-white'"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex align-items-center justify-content-between gap-2 mb-1">
                                            <span class="font-semibold text-900 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                                                {{ activity.user_name }}
                                            </span>
                                            <span class="text-500 text-sm white-space-nowrap">
                                                {{ formatDate(activity.created_at) }}
                                            </span>
                                        </div>
                                        <div class="text-600 text-sm">
                                            {{ getActionLabel(activity.action) }}
                                            <span *ngIf="activity.target_name" class="font-medium text-700">
                                                 • {{ activity.target_name }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div *ngIf="loading" class="flex flex-column gap-3">
                                <div *ngFor="let i of [1,2,3,4,5]" class="flex align-items-center gap-3 py-2">
                                    <p-skeleton shape="circle" size="2.5rem"></p-skeleton>
                                    <div class="flex-1">
                                        <p-skeleton width="40%" height="1rem" styleClass="mb-2"></p-skeleton>
                                        <p-skeleton width="70%" height="0.8rem"></p-skeleton>
                                    </div>
                                    <p-skeleton width="60px" height="0.8rem"></p-skeleton>
                                </div>
                            </div>

                            <div *ngIf="!loading && recentActivities.length === 0"
                                 class="flex flex-column align-items-center justify-content-center py-5 text-500">
                                <i class="pi pi-inbox text-4xl mb-3"></i>
                                <span class="font-medium">Aucune activité récente</span>
                                <span class="text-sm">Les actions des utilisateurs apparaîtront ici</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DMS Modules Grid -->
            <div class="surface-card shadow-2 border-round-xl">
                <div class="flex align-items-center justify-content-between p-4 border-bottom-1 surface-border">
                    <div class="flex align-items-center gap-2">
                        <div class="flex align-items-center justify-content-center border-round-lg bg-indigo-100"
                             style="width: 2.5rem; height: 2.5rem;">
                            <i class="pi pi-th-large text-indigo-600"></i>
                        </div>
                        <span class="font-semibold text-900">Modules DMS</span>
                    </div>
                    <p-tag [value]="dmsModules.length + ' modules'" severity="secondary"></p-tag>
                </div>
                <div class="p-4">
                    <div class="grid">
                        <div class="col-6 sm:col-4 md:col-3 lg:col-2" *ngFor="let module of dmsModules">
                            <a pRipple [routerLink]="module.route"
                               class="flex flex-column align-items-center gap-2 p-3 border-round-xl cursor-pointer transition-all transition-duration-200 no-underline module-card"
                               style="border: 2px solid transparent;">
                                <div class="flex align-items-center justify-content-center border-round-xl"
                                     [style.background]="module.color"
                                     style="width: 3.5rem; height: 3.5rem;">
                                    <i [class]="module.icon + ' text-white text-2xl'"></i>
                                </div>
                                <div class="text-center">
                                    <div class="font-semibold text-900 text-sm">{{ module.label }}</div>
                                    <div class="text-500 text-xs" *ngIf="stats">
                                        {{ getModuleUserCount(module.label) }} utilisateurs
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host ::ng-deep {
            .p-card .p-card-content {
                padding: 0;
            }

            .p-timeline-event-opposite {
                flex: 0 0 auto;
                min-width: 80px;
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

        .module-card:hover {
            background: var(--surface-ground);
            border-color: var(--primary-color) !important;
            transform: translateY(-2px);
        }

        .surface-hover:hover {
            background: var(--surface-ground) !important;
        }
    `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
    Math = Math;
    private destroy$ = new Subject<void>();

    loading = true;
    stats: AdminDashboardStats | null = null;
    recentActivities: ActivityLog[] = [];
    currentUserName = 'Admin';
    currentDate = '';

    dmsModules = DMS_MODULE_PERMISSIONS;

    statCards: StatCard[] = [
        { label: 'Total Utilisateurs', value: 0, icon: 'pi pi-users', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        { label: 'Utilisateurs Actifs', value: 0, icon: 'pi pi-check-circle', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
        { label: 'Utilisateurs Inactifs', value: 0, icon: 'pi pi-minus-circle', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
        { label: 'Comptes Suspendus', value: 0, icon: 'pi pi-ban', gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }
    ];

    roleChartData: any;
    moduleChartData: any;
    doughnutChartOptions: any;
    barChartOptions: any;

    constructor(
        private adminService: AdminService,
        private authService: AuthService
    ) {
        this.initChartOptions();
        this.setCurrentDate();
        this.setCurrentUser();
    }

    ngOnInit(): void {
        this.loadDashboardData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setCurrentDate(): void {
        const now = new Date();
        this.currentDate = now.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        // Capitalize first letter
        this.currentDate = this.currentDate.charAt(0).toUpperCase() + this.currentDate.slice(1);
    }

    private setCurrentUser(): void {
        const user = this.authService.getCurrentUser();
        if (user) {
            this.currentUserName = user.first_name || user.username || 'Admin';
        }
    }

    private loadDashboardData(): void {
        this.loading = true;

        this.adminService.getDashboardStats()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (stats) => {
                    this.stats = stats;
                    this.updateStatCards(stats);
                    this.updateCharts(stats);
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });

        this.adminService.getActivityLogs({ page_size: 5 })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (logs) => {
                    this.recentActivities = logs.slice(0, 5);
                }
            });
    }

    private updateStatCards(stats: AdminDashboardStats): void {
        this.statCards = [
            {
                label: 'Total Utilisateurs',
                value: stats.total_users,
                icon: 'pi pi-users',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            {
                label: 'Utilisateurs Actifs',
                value: stats.active_users,
                icon: 'pi pi-check-circle',
                gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                trend: stats.total_users > 0 ? Math.round((stats.active_users / stats.total_users) * 100) : 0,
                trendLabel: 'du total'
            },
            {
                label: 'Utilisateurs Inactifs',
                value: stats.inactive_users,
                icon: 'pi pi-minus-circle',
                gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
            },
            {
                label: 'Comptes Suspendus',
                value: stats.suspended_users,
                icon: 'pi pi-ban',
                gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
            }
        ];
    }

    private updateCharts(stats: AdminDashboardStats): void {
        // Role distribution doughnut chart
        const roleColors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
        if (stats.users_by_role && stats.users_by_role.length > 0) {
            this.roleChartData = {
                labels: stats.users_by_role.map(r => r.role || 'Non défini'),
                datasets: [{
                    data: stats.users_by_role.map(r => r.count),
                    backgroundColor: stats.users_by_role.map((_, i) => roleColors[i % roleColors.length]),
                    hoverBackgroundColor: stats.users_by_role.map((_, i) => roleColors[i % roleColors.length]),
                    borderWidth: 0
                }]
            };
        }

        // Module access bar chart
        const moduleData = stats.module_access_distribution || [];
        if (moduleData.length > 0) {
            this.moduleChartData = {
                labels: moduleData.map(m => m.module),
                datasets: [{
                    label: 'Utilisateurs',
                    data: moduleData.map(m => m.count),
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    borderRadius: 6,
                    barThickness: 20
                }]
            };
        }
    }

    private initChartOptions(): void {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color') || '#374151';
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6B7280';
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#E5E7EB';

        this.doughnutChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 16,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        };

        this.barChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: textColorSecondary,
                        stepSize: 1,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        };
    }

    getModuleUserCount(moduleName: string): number {
        if (!this.stats?.module_access_distribution) return 0;
        const found = this.stats.module_access_distribution.find(m => m.module === moduleName);
        return found?.count || 0;
    }

    getActionIcon(action: string): string {
        const icons: Record<string, string> = {
            'login': 'pi pi-sign-in',
            'logout': 'pi pi-sign-out',
            'create': 'pi pi-plus',
            'update': 'pi pi-pencil',
            'delete': 'pi pi-trash',
            'permission_change': 'pi pi-lock',
            'password_reset': 'pi pi-key'
        };
        return icons[action] || 'pi pi-circle';
    }

    getActionColor(action: string): string {
        const colors: Record<string, string> = {
            'login': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            'logout': 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
            'create': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            'update': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            'delete': 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            'permission_change': 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            'password_reset': 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)'
        };
        return colors[action] || 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)';
    }

    getActionLabel(action: string): string {
        const labels: Record<string, string> = {
            'login': 's\'est connecté',
            'logout': 's\'est déconnecté',
            'create': 'a créé',
            'update': 'a modifié',
            'delete': 'a supprimé',
            'permission_change': 'a changé les permissions',
            'password_reset': 'a réinitialisé le mot de passe'
        };
        return labels[action] || action;
    }

    formatDate(date: Date | string): string {
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

        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }
}
