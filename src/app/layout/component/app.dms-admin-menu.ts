import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-dms-admin-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppDmsAdminMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Administration',
                items: [
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/dms-admin/dashboard']
                    },
                    {
                        label: 'Users',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/dms-admin/users']
                    },
                    {
                        label: 'Positions',
                        icon: 'pi pi-fw pi-id-card',
                        routerLink: ['/dms-admin/positions']
                    },
                    {
                        label: 'Activity Logs',
                        icon: 'pi pi-fw pi-history',
                        items: [
                            {
                                label: 'User Activity',
                                icon: 'pi pi-fw pi-users',
                                routerLink: ['/dms-admin/activity-logs']
                            },
                            {
                                label: 'DMS-Tech',
                                icon: 'pi pi-fw pi-database',
                                items: [
                                    {
                                        label: 'Parts History',
                                        icon: 'pi pi-fw pi-box',
                                        routerLink: ['/dms-admin/activity-logs/parts-history']
                                    },
                                    {
                                        label: 'Projects History',
                                        icon: 'pi pi-fw pi-folder',
                                        routerLink: ['/dms-admin/activity-logs/projects-history']
                                    },
                                    {
                                        label: 'Zones History',
                                        icon: 'pi pi-fw pi-map',
                                        routerLink: ['/dms-admin/activity-logs/zones-history']
                                    },
                                    {
                                        label: 'Prod. Lines History',
                                        icon: 'pi pi-fw pi-sitemap',
                                        routerLink: ['/dms-admin/activity-logs/production-lines-history']
                                    },
                                    {
                                        label: 'Processes History',
                                        icon: 'pi pi-fw pi-cog',
                                        routerLink: ['/dms-admin/activity-logs/processes-history']
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        label: 'Data Import',
                        icon: 'pi pi-fw pi-upload',
                        routerLink: ['/dms-admin/data-import']
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
}
