import { Component, ElementRef } from '@angular/core';
import { AppDmsHrMenu } from './app.dms-hr-menu';

@Component({
    selector: 'app-dms-hr-sidebar',
    standalone: true,
    imports: [AppDmsHrMenu],
    template: ` <div class="layout-sidebar">
        <app-dms-hr-menu></app-dms-hr-menu>
    </div>`
})
export class AppDmsHrSidebar {
    constructor(public el: ElementRef) {}
}
