import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { MessageModule } from 'primeng/message';
import { AppMenuitem } from './app.menuitem';
import { DowntimeNotificationService } from '../../core/services/downtime-notification.service';

@Component({
    selector: 'app-dms-maintenance-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule, BadgeModule, MessageModule],
    template: `
        <ul class="layout-menu">
            <!-- Alert Banner -->
            <li *ngIf="unreadCount > 0" class="menu-alert-item">
                <p-message severity="error" styleClass="w-full menu-alert-message">
                    <ng-template pTemplate="content">
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-bell animate-pulse"></i>
                            <span class="font-semibold">{{ unreadCount }} new alert(s)</span>
                        </div>
                    </ng-template>
                </p-message>
            </li>

            <ng-container *ngFor="let item of model; let i = index">
                <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
                <li *ngIf="item.separator" class="menu-separator"></li>
            </ng-container>
        </ul>
    `,
    styles: [`
        .menu-alert-item {
            margin: 0.5rem 1rem;
        }

        ::ng-deep .menu-alert-message {
            .p-message-content {
                padding: 0.5rem 0.75rem;
            }
        }

        .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `]
})
export class AppDmsMaintenanceMenu implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    model: MenuItem[] = [];
    unreadCount = 0;

    constructor(private notificationService: DowntimeNotificationService) {}

    ngOnInit() {
        // Subscribe to unread alerts count
        this.notificationService.unreadCount$
            .pipe(takeUntil(this.destroy$))
            .subscribe(count => {
                this.unreadCount = count;
                this.updateMenuBadges();
            });

        // Start polling if not already started
        this.notificationService.startPolling(15);
        this.model = [
            {
                label: 'DMS Maintenance',
                items: [
                    {
                        label: 'Open Tickets',
                        icon: 'pi pi-fw pi-ticket',
                        routerLink: ['/dms-maintenance/open-tickets']
                    },
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-fw pi-chart-bar',
                        routerLink: ['/dms-maintenance/dashboard']
                    },
                    {
                        label: 'Data',
                        icon: 'pi pi-fw pi-database',
                        routerLink: ['/dms-maintenance/data']
                    },
                    {
                        label: 'Weekly Follow-up',
                        icon: 'pi pi-fw pi-calendar',
                        routerLink: ['/dms-maintenance/weekly-followup']
                    },
                    {
                        label: 'Production KPI',
                        icon: 'pi pi-fw pi-chart-line',
                        routerLink: ['/dms-maintenance/production-kpi']
                    }
                ]
            },
            { separator: true },
            {
                label: 'Management',
                items: [
                    {
                        label: 'Preventive Maintenance',
                        icon: 'pi pi-fw pi-wrench',
                        routerLink: ['/dms-maintenance/preventive']
                    },
                    {
                        label: 'Spare Parts',
                        icon: 'pi pi-fw pi-cog',
                        routerLink: ['/dms-maintenance/spare-parts']
                    },
                    {
                        label: 'Technicians',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/dms-maintenance/technicians']
                    },
                    {
                        label: 'Problem Types',
                        icon: 'pi pi-fw pi-exclamation-triangle',
                        routerLink: ['/dms-maintenance/problem-types']
                    }
                ]
            },
            { separator: true },
            {
                label: 'Reports',
                items: [
                    {
                        label: 'MTBF / MTTR',
                        icon: 'pi pi-fw pi-percentage',
                        routerLink: ['/dms-maintenance/reports/mtbf-mttr']
                    },
                    {
                        label: 'Downtime Analysis',
                        icon: 'pi pi-fw pi-clock',
                        routerLink: ['/dms-maintenance/reports/downtime']
                    }
                ]
            },
            { separator: true },
            {
                label: 'Navigation',
                items: [
                    {
                        label: 'Back to DMS Home',
                        icon: 'pi pi-fw pi-arrow-left',
                        routerLink: ['/dms-home']
                    }
                ]
            }
        ];
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private updateMenuBadges(): void {
        // Update badge on Open Tickets menu item
        if (this.model.length > 0 && this.model[0].items) {
            const openTicketsItem = this.model[0].items.find(
                item => item.label === 'Open Tickets'
            );
            if (openTicketsItem) {
                openTicketsItem.badge = this.unreadCount > 0 ? this.unreadCount.toString() : undefined;
                openTicketsItem.badgeStyleClass = this.unreadCount > 0 ? 'p-badge-danger' : undefined;
            }
        }
    }
}
