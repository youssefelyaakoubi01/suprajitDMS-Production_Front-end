import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            // ==================== DMS HOME ====================
            {
                label: 'Navigation',
                items: [
                    {
                        label: 'DMS Home',
                        icon: 'pi pi-fw pi-th-large',
                        routerLink: ['/dms-home'],
                        styleClass: 'dms-home-link'
                    }
                ]
            },
            { separator: true },
            // ==================== DMS PRODUCTION ====================
            {
                label: 'DMS Production',
                items: [
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/dms-production/dashboard']
                    },
                    {
                        label: 'Production',
                        icon: 'pi pi-fw pi-bolt',
                        routerLink: ['/dms-production/production']
                    },
                    {
                        label: 'Downtime List',
                        icon: 'pi pi-fw pi-clock',
                        routerLink: ['/dms-production/downtime-list']
                    },
                    {
                        label: 'Quality',
                        icon: 'pi pi-fw pi-exclamation-triangle',
                        routerLink: ['/dms-production/quality']
                    },
                    {
                        label: 'Maintenance',
                        icon: 'pi pi-fw pi-wrench',
                        routerLink: ['/dms-production/maintenance']
                    },
                    {
                        label: 'Inventory',
                        icon: 'pi pi-fw pi-box',
                        routerLink: ['/dms-production/inventory']
                    }
                ]
            },
            { separator: true },
            // ==================== DMS HR ====================
            {
                label: 'DMS HR',
                items: [
                    {
                        label: 'HR Dashboard',
                        icon: 'pi pi-fw pi-chart-pie',
                        routerLink: ['/dms-hr/dashboard']
                    },
                    {
                        label: 'Employees',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/dms-hr/employees']
                    },
                    {
                        label: 'Formations',
                        icon: 'pi pi-fw pi-book',
                        routerLink: ['/dms-hr/formations']
                    },
                    {
                        label: 'Processus',
                        icon: 'pi pi-fw pi-cog',
                        routerLink: ['/dms-hr/processes']
                    },
                    {
                        label: 'Qualifications',
                        icon: 'pi pi-fw pi-verified',
                        routerLink: ['/dms-hr/qualifications']
                    },
                    {
                        label: 'Versatility Matrix',
                        icon: 'pi pi-fw pi-th-large',
                        routerLink: ['/dms-hr/versatility']
                    },
                    {
                        label: 'Recyclage',
                        icon: 'pi pi-fw pi-refresh',
                        routerLink: ['/dms-hr/recyclage']
                    },
                    {
                        label: 'Teams & Trainers',
                        icon: 'pi pi-fw pi-sitemap',
                        routerLink: ['/dms-hr/teams']
                    }
                ]
            },
            { separator: true },
            // ==================== ANALYTICS ====================
            {
                label: 'Analytics',
                items: [
                    {
                        label: 'KPI & Indicators',
                        icon: 'pi pi-fw pi-chart-bar',
                        routerLink: ['/analytics/kpi']
                    },
                    {
                        label: 'Lessons Learned',
                        icon: 'pi pi-fw pi-lightbulb',
                        routerLink: ['/analytics/lessons']
                    }
                ]
            },
            { separator: true },
            // ==================== SYSTEM ====================
            {
                label: 'System',
                items: [
                    {
                        label: 'Auth',
                        icon: 'pi pi-fw pi-user',
                        items: [
                            {
                                label: 'Login',
                                icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/auth/login']
                            },
                            {
                                label: 'Access Denied',
                                icon: 'pi pi-fw pi-lock',
                                routerLink: ['/auth/access']
                            }
                        ]
                    },
                    {
                        label: 'Settings',
                        icon: 'pi pi-fw pi-cog',
                        routerLink: ['/settings']
                    }
                ]
            }
        ];
    }
}
