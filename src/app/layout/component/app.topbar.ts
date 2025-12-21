import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { Subscription, filter } from 'rxjs';

interface DmsModuleInfo {
    title: string;
    icon: string;
    color: string;
}

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/dms-home">
                <div class="logo-container" style="display: flex; align-items: center; gap: 0.5rem;">
                    <div class="logo-icon" [style.background]="currentModule.color" style="border-radius: 8px; padding: 0.5rem; display: flex; align-items: center; justify-content: center;">
                        <i [class]="currentModule.icon" style="font-size: 1.5rem; color: white;"></i>
                    </div>
                    <div class="logo-text" style="display: flex; flex-direction: column; line-height: 1.1;">
                        <span style="font-size: 1.25rem; font-weight: 700; color: var(--primary-color);">SUPRAJIT</span>
                        <span style="font-size: 0.7rem; font-weight: 500; color: var(--text-color-secondary); letter-spacing: 0.15em;">{{ currentModule.title }}</span>
                    </div>
                </div>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-calendar"></i>
                        <span>Calendar</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-inbox"></i>
                        <span>Messages</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-user"></i>
                        <span>Profile</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar implements OnInit, OnDestroy {
    items!: MenuItem[];
    private routerSubscription!: Subscription;

    currentModule: DmsModuleInfo = {
        title: 'DMS PRODUCTION',
        icon: 'pi pi-bolt',
        color: '#3B82F6'
    };

    private moduleMap: { [key: string]: DmsModuleInfo } = {
        'dms-production': { title: 'DMS PRODUCTION', icon: 'pi pi-bolt', color: '#3B82F6' },
        'dms-tech': { title: 'DMS TECH', icon: 'pi pi-cog', color: '#6366F1' },
        'dms-hr': { title: 'DMS HR', icon: 'pi pi-users', color: '#8B5CF6' },
        'dms-maintenance': { title: 'DMS MAINTENANCE', icon: 'pi pi-wrench', color: '#06B6D4' },
        'dms-inventory': { title: 'DMS INVENTORY', icon: 'pi pi-box', color: '#F59E0B' },
        'dms-quality': { title: 'DMS QUALITY', icon: 'pi pi-check-circle', color: '#EF4444' },
        'analytics': { title: 'ANALYTICS', icon: 'pi pi-chart-bar', color: '#EC4899' },
        'dms-home': { title: 'DMS HOME', icon: 'pi pi-home', color: '#10B981' }
    };

    constructor(
        public layoutService: LayoutService,
        private router: Router
    ) {}

    ngOnInit() {
        // Set initial module based on current URL
        this.updateCurrentModule(this.router.url);

        // Listen for route changes
        this.routerSubscription = this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                this.updateCurrentModule(event.urlAfterRedirects);
            });
    }

    ngOnDestroy() {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }

    private updateCurrentModule(url: string) {
        // Extract the first segment of the URL (e.g., 'dms-production' from '/dms-production/dashboard')
        const segments = url.split('/').filter(s => s);
        const moduleKey = segments[0] || 'dms-home';

        if (this.moduleMap[moduleKey]) {
            this.currentModule = this.moduleMap[moduleKey];
        }
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }
}
