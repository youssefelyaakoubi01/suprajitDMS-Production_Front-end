import { Component, ElementRef } from '@angular/core';
import { AppDmsMaintenanceMenu } from './app.dms-maintenance-menu';

@Component({
    selector: 'app-dms-maintenance-sidebar',
    standalone: true,
    imports: [AppDmsMaintenanceMenu],
    template: ` <div class="layout-sidebar">
        <app-dms-maintenance-menu></app-dms-maintenance-menu>
    </div>`
})
export class AppDmsMaintenanceSidebar {
    constructor(public el: ElementRef) {}
}
