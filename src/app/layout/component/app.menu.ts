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
                    }
                ]
            },
            {
                label: 'Operations',
                items: [
                    {
                        label: 'Inventory',
                        icon: 'pi pi-fw pi-box',
                        routerLink: ['/inventory']
                    },
                    {
                        label: 'Quality',
                        icon: 'pi pi-fw pi-exclamation-triangle',
                        routerLink: ['/quality']
                    },
                    {
                        label: 'Maintenance',
                        icon: 'pi pi-fw pi-wrench',
                        routerLink: ['/maintenance']
                    }
                ]
            },
            {
                label: 'Resources',
                items: [
                    {
                        label: 'HR & Employees',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/hr']
                    },
                    {
                        label: 'KPI & Indicators',
                        icon: 'pi pi-fw pi-chart-bar',
                        routerLink: ['/kpi']
                    },
                    {
                        label: 'Lessons Learned',
                        icon: 'pi pi-fw pi-book',
                        routerLink: ['/lessons']
                    }
                ]
            },
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
