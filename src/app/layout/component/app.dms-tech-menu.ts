import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-dms-tech-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppDmsTechMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'DMS Tech',
                items: [
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/dms-tech/dashboard']
                    }
                ]
            },
            { separator: true },
            {
                label: 'Master Data',
                items: [
                    {
                        label: 'Projects',
                        icon: 'pi pi-fw pi-briefcase',
                        routerLink: ['/dms-tech/projects']
                    },
                    {
                        label: 'Production Lines',
                        icon: 'pi pi-fw pi-sitemap',
                        routerLink: ['/dms-tech/production-lines']
                    },
                    {
                        label: 'Part Numbers',
                        icon: 'pi pi-fw pi-box',
                        routerLink: ['/dms-tech/parts']
                    },
                    {
                        label: 'Workstations',
                        icon: 'pi pi-fw pi-desktop',
                        routerLink: ['/dms-tech/workstations']
                    },
                    {
                        label: 'Machines',
                        icon: 'pi pi-fw pi-cog',
                        routerLink: ['/dms-tech/machines']
                    },
                    {
                        label: 'Zones',
                        icon: 'pi pi-fw pi-map',
                        routerLink: ['/dms-tech/zones']
                    }
                ]
            },
            { separator: true },
            {
                label: 'Configuration',
                items: [
                    {
                        label: 'Part-Line Assignments',
                        icon: 'pi pi-fw pi-link',
                        routerLink: ['/dms-tech/part-line-assignments']
                    },
                    {
                        label: 'Headcount Config',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/dms-tech/headcount-config']
                    },
                    {
                        label: 'Problem Types',
                        icon: 'pi pi-fw pi-exclamation-triangle',
                        routerLink: ['/dms-tech/problem-types']
                    },
                    {
                        label: 'Targets',
                        icon: 'pi pi-fw pi-chart-bar',
                        routerLink: ['/dms-tech/targets']
                    },
                    {
                        label: 'Shifts',
                        icon: 'pi pi-fw pi-calendar',
                        routerLink: ['/dms-tech/shifts']
                    },
                    {
                        label: 'Shift Types',
                        icon: 'pi pi-fw pi-sliders-h',
                        routerLink: ['/dms-tech/shift-types']
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
