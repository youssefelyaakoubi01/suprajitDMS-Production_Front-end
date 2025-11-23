import { Component, ElementRef } from '@angular/core';
import { AppDmsMenu } from './app.dms-menu';

@Component({
    selector: 'app-dms-sidebar',
    standalone: true,
    imports: [AppDmsMenu],
    template: ` <div class="layout-sidebar">
        <app-dms-menu></app-dms-menu>
    </div>`
})
export class AppDmsSidebar {
    constructor(public el: ElementRef) {}
}
