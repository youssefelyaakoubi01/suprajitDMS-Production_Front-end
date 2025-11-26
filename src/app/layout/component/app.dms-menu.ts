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
                    }
                ]
            },
            { separator: true },
            {
                label: 'Settings',
                items: [
                    {
                        label: 'Shifts',
                        icon: 'pi pi-fw pi-calendar',
                        routerLink: ['/dms-production/settings/shifts']
                    }
                ]
            },
            { separator: true },
            {
                label: 'Navigation',
                items: [
                    {
                        label: 'Back to Main',
                        icon: 'pi pi-fw pi-arrow-left',
                        routerLink: ['/inventory']
                    }
                ]
            }
        ];
    }
}
