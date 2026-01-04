import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-dms-hr-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppDmsHrMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'DMS HR',
                items: [
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-fw pi-home',
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
                        label: 'Qualifications',
                        icon: 'pi pi-fw pi-check-circle',
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
                        label: 'Teams',
                        icon: 'pi pi-fw pi-sitemap',
                        routerLink: ['/dms-hr/teams']
                    },
                    {
                        label: 'Licenses Manager',
                        icon: 'pi pi-fw pi-id-card',
                        routerLink: ['/dms-hr/licenses']
                    },
                    {
                        label: 'Workstations',
                        icon: 'pi pi-fw pi-desktop',
                        routerLink: ['/dms-hr/workstations']
                    },
                    {
                        label: 'Affectations',
                        icon: 'pi pi-fw pi-link',
                        routerLink: ['/dms-hr/affectations']
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
