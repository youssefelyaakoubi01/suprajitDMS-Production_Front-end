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
                        label: 'Catégories',
                        icon: 'pi pi-fw pi-tag',
                        routerLink: ['/dms-hr/categories']
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
                        label: 'Formateurs',
                        icon: 'pi pi-fw pi-user-edit',
                        routerLink: ['/dms-hr/formateurs']
                    },
                    {
                        label: 'Qualifications',
                        icon: 'pi pi-fw pi-check-circle',
                        routerLink: ['/dms-hr/qualifications']
                    },
                    {
                        label: 'Recyclage',
                        icon: 'pi pi-fw pi-refresh',
                        routerLink: ['/dms-hr/recyclage']
                    },
                    {
                        label: 'Affectations Non Qualifiées',
                        icon: 'pi pi-fw pi-exclamation-triangle',
                        routerLink: ['/dms-hr/non-qualified-assignments']
                    },
                    {
                        label: 'Présences',
                        icon: 'pi pi-fw pi-clock',
                        routerLink: ['/dms-hr/presences']
                    },
                    {
                        label: 'Départements',
                        icon: 'pi pi-fw pi-building',
                        routerLink: ['/dms-hr/departements']
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
