import { Component, ElementRef } from '@angular/core';
import { AppDmsAdminMenu } from './app.dms-admin-menu';

@Component({
    selector: 'app-dms-admin-sidebar',
    standalone: true,
    imports: [AppDmsAdminMenu],
    template: ` <div class="layout-sidebar">
        <app-dms-admin-menu></app-dms-admin-menu>
    </div>`
})
export class AppDmsAdminSidebar {
    constructor(public el: ElementRef) {}
}
