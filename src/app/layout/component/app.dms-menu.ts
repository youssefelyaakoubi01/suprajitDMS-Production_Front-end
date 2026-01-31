import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-dms-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppDmsMenu {
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
                        label: 'Production Entry',
                        icon: 'pi pi-fw pi-bolt',
                        routerLink: ['/dms-production/production']
                    },
                    {
                        label: 'Production List',
                        icon: 'pi pi-fw pi-list',
                        routerLink: ['/dms-production/production-list']
                    },
                    {
                        label: 'Downtime List',
                        icon: 'pi pi-fw pi-clock',
                        routerLink: ['/dms-production/downtime-list']
                    },
                    {
                        label: 'Declare Downtime',
                        icon: 'pi pi-fw pi-exclamation-triangle',
                        routerLink: ['/dms-production/downtime-declaration']
                    },
                    {
                        label: 'Qualified Employees',
                        icon: 'pi pi-fw pi-verified',
                        routerLink: ['/dms-production/qualified-employees']
                    },
                    {
                        label: 'Production History',
                        icon: 'pi pi-fw pi-history',
                        routerLink: ['/dms-production/production-history']
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
