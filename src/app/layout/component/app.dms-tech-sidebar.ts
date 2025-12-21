import { Component, ElementRef } from '@angular/core';
import { AppDmsTechMenu } from './app.dms-tech-menu';

@Component({
    selector: 'app-dms-tech-sidebar',
    standalone: true,
    imports: [AppDmsTechMenu],
    template: ` <div class="layout-sidebar">
        <app-dms-tech-menu></app-dms-tech-menu>
    </div>`
})
export class AppDmsTechSidebar {
    constructor(public el: ElementRef) {}
}
