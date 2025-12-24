import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuItem, ConfirmationService } from 'primeng/api';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { PopoverModule } from 'primeng/popover';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.model';
import { Subscription, filter } from 'rxjs';
import { environment } from '../../../environments/environment';

interface DmsModuleInfo {
    title: string;
    icon: string;
    color: string;
}

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [
        RouterModule,
        CommonModule,
        StyleClassModule,
        AvatarModule,
        MenuModule,
        ButtonModule,
        RippleModule,
        TooltipModule,
        ConfirmDialogModule,
        BadgeModule,
        DividerModule,
        TagModule,
        PopoverModule,
        AppConfigurator
    ],
    providers: [ConfirmationService],
    template: `
    <div class="layout-topbar">
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
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()" pTooltip="Toggle Theme" tooltipPosition="bottom">
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
                        pTooltip="Customize"
                        tooltipPosition="bottom"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
            </div>

            <!-- Separator -->
            <div class="topbar-separator desktop-only"></div>

            <!-- Notifications - Always visible on desktop -->
            <button type="button" class="layout-topbar-action desktop-only" pTooltip="Notifications" tooltipPosition="bottom">
                <i class="pi pi-bell"></i>
                <span class="notification-badge" *ngIf="notificationCount > 0">{{ notificationCount }}</span>
            </button>

            <!-- Home - Always visible on desktop -->
            <button type="button" class="layout-topbar-action desktop-only" routerLink="/dms-home" pTooltip="DMS Home" tooltipPosition="bottom">
                <i class="pi pi-home"></i>
            </button>

            <!-- Separator before user -->
            <div class="topbar-separator desktop-only"></div>

            <!-- User Profile Section - Desktop -->
            <div class="user-profile-section desktop-only" *ngIf="currentUser">
                <div class="user-info-container" (click)="userMenu.toggle($event)">
                    <p-avatar
                        *ngIf="!getUserPicture()"
                        [label]="getUserInitials()"
                        [style]="{'background': getAvatarColor(), 'color': '#ffffff', 'font-weight': '600'}"
                        shape="circle"
                        size="normal">
                    </p-avatar>
                    <p-avatar
                        *ngIf="getUserPicture()"
                        [image]="getUserPicture()"
                        shape="circle"
                        size="normal">
                    </p-avatar>
                    <div class="user-details">
                        <span class="user-name">{{ getUserDisplayName() }}</span>
                        <span class="user-role">{{ getUserRole() }}</span>
                    </div>
                    <i class="pi pi-chevron-down" style="font-size: 0.7rem; color: var(--text-color-secondary); margin-left: 0.25rem;"></i>
                </div>

                <!-- User Menu Popover -->
                <p-popover #userMenu>
                    <div class="user-menu-popover">
                        <!-- User Header -->
                        <div class="user-menu-header">
                            <p-avatar
                                *ngIf="!getUserPicture()"
                                [label]="getUserInitials()"
                                [style]="{'background': getAvatarColor(), 'color': '#ffffff', 'font-weight': '700', 'font-size': '1.25rem'}"
                                shape="circle"
                                size="large">
                            </p-avatar>
                            <p-avatar
                                *ngIf="getUserPicture()"
                                [image]="getUserPicture()"
                                shape="circle"
                                size="large">
                            </p-avatar>
                            <div class="user-menu-info">
                                <span class="user-menu-name">{{ getUserDisplayName() }}</span>
                                <span class="user-menu-email">{{ currentUser.email }}</span>
                                <p-tag [value]="getUserRole()" [severity]="getRoleSeverity()" [rounded]="true" class="mt-1"></p-tag>
                            </div>
                        </div>

                        <!-- User Details -->
                        <div class="user-menu-details" *ngIf="currentUser.department_name || currentUser.employee_name">
                            <div class="detail-item" *ngIf="currentUser.department_name">
                                <i class="pi pi-building"></i>
                                <span>{{ currentUser.department_name }}</span>
                            </div>
                            <div class="detail-item" *ngIf="currentUser.employee_name">
                                <i class="pi pi-id-card"></i>
                                <span>{{ currentUser.employee_name }}</span>
                            </div>
                        </div>

                        <!-- Module Permissions -->
                        <div class="user-menu-permissions" *ngIf="hasAnyModulePermission()">
                            <span class="permissions-label">Accès aux modules:</span>
                            <div class="permissions-badges">
                                <span class="permission-badge" *ngIf="currentUser.dms_production" pTooltip="Production">
                                    <i class="pi pi-bolt"></i>
                                </span>
                                <span class="permission-badge" *ngIf="currentUser.dms_hr" pTooltip="RH">
                                    <i class="pi pi-users"></i>
                                </span>
                                <span class="permission-badge" *ngIf="currentUser.dms_quality" pTooltip="Qualité">
                                    <i class="pi pi-check-circle"></i>
                                </span>
                                <span class="permission-badge" *ngIf="currentUser.dms_maintenance" pTooltip="Maintenance">
                                    <i class="pi pi-wrench"></i>
                                </span>
                                <span class="permission-badge" *ngIf="currentUser.dms_inventory" pTooltip="Inventaire">
                                    <i class="pi pi-box"></i>
                                </span>
                                <span class="permission-badge" *ngIf="currentUser.dms_analytics" pTooltip="Analytics">
                                    <i class="pi pi-chart-bar"></i>
                                </span>
                                <span class="permission-badge" *ngIf="currentUser.dms_tech" pTooltip="Tech">
                                    <i class="pi pi-cog"></i>
                                </span>
                                <span class="permission-badge admin" *ngIf="currentUser.dms_admin" pTooltip="Admin">
                                    <i class="pi pi-shield"></i>
                                </span>
                            </div>
                        </div>

                        <p-divider></p-divider>

                        <!-- Menu Actions -->
                        <div class="user-menu-actions">
                            <a class="menu-action-item" routerLink="/dms-production/profile" (click)="userMenu.hide()">
                                <i class="pi pi-user"></i>
                                <span>My Profile</span>
                            </a>
                            <a class="menu-action-item" routerLink="/dms-production/user-settings" (click)="userMenu.hide()">
                                <i class="pi pi-cog"></i>
                                <span>Settings</span>
                            </a>
                            <a class="menu-action-item" (click)="toggleDarkMode(); userMenu.hide()">
                                <i [class]="layoutService.isDarkTheme() ? 'pi pi-sun' : 'pi pi-moon'"></i>
                                <span>{{ layoutService.isDarkTheme() ? 'Light Mode' : 'Dark Mode' }}</span>
                            </a>
                        </div>

                        <p-divider></p-divider>

                        <!-- Logout -->
                        <div class="user-menu-logout">
                            <a class="menu-action-item logout" (click)="userMenu.hide(); confirmLogout()">
                                <i class="pi pi-sign-out"></i>
                                <span>Logout</span>
                            </a>
                        </div>
                    </div>
                </p-popover>
            </div>

            <!-- Login Button - Desktop (if not logged in) -->
            <button type="button" class="layout-topbar-action login-btn desktop-only" (click)="goToLogin()" *ngIf="!currentUser">
                <i class="pi pi-sign-in"></i>
                <span>Login</span>
            </button>

            <!-- Mobile Menu Button -->
            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <!-- Mobile Menu -->
            <div class="layout-topbar-menu hidden">
                <div class="layout-topbar-menu-content">
                    <!-- User info in mobile menu -->
                    <div class="mobile-user-header" *ngIf="currentUser">
                        <p-avatar
                            *ngIf="!getUserPicture()"
                            [label]="getUserInitials()"
                            [style]="{'background': getAvatarColor(), 'color': '#ffffff', 'font-weight': '600'}"
                            shape="circle"
                            size="normal">
                        </p-avatar>
                        <div class="mobile-user-info">
                            <span class="mobile-user-name">{{ getUserDisplayName() }}</span>
                            <span class="mobile-user-role">{{ getUserRole() }}</span>
                        </div>
                    </div>

                    <button type="button" class="layout-topbar-action" pTooltip="Notifications">
                        <i class="pi pi-bell"></i>
                        <span>Notifications</span>
                    </button>
                    <button type="button" class="layout-topbar-action" routerLink="/dms-home">
                        <i class="pi pi-home"></i>
                        <span>DMS Home</span>
                    </button>
                    <button type="button" class="layout-topbar-action" *ngIf="currentUser" routerLink="/dms-production/profile">
                        <i class="pi pi-user"></i>
                        <span>My Profile</span>
                    </button>
                    <button type="button" class="layout-topbar-action logout-action" (click)="confirmLogout()" *ngIf="currentUser">
                        <i class="pi pi-sign-out"></i>
                        <span>Logout</span>
                    </button>
                    <button type="button" class="layout-topbar-action" (click)="goToLogin()" *ngIf="!currentUser">
                        <i class="pi pi-sign-in"></i>
                        <span>Login</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Confirm Dialog -->
        <p-confirmDialog key="logoutDialog" styleClass="logout-confirm-dialog">
            <ng-template pTemplate="headless" let-message>
                <div class="flex flex-column align-items-center p-5 surface-overlay border-round">
                    <div class="border-circle bg-primary inline-flex justify-content-center align-items-center h-6rem w-6rem">
                        <i class="pi pi-sign-out text-5xl text-white"></i>
                    </div>
                    <span class="font-bold text-2xl block mb-2 mt-4">{{ message.header }}</span>
                    <p class="mb-0 text-center">{{ message.message }}</p>
                    <div class="flex gap-2 mt-4">
                        <button pButton pRipple label="Cancel" (click)="cancelLogout()" class="p-button-outlined p-button-secondary"></button>
                        <button pButton pRipple label="Logout" (click)="logout()" class="p-button-danger"></button>
                    </div>
                </div>
            </ng-template>
        </p-confirmDialog>
    </div>
    `,
    styles: [`
        /* Desktop Only - Show on screens >= 992px */
        .desktop-only {
            display: none !important;
        }

        @media screen and (min-width: 992px) {
            .desktop-only {
                display: inline-flex !important;
            }

            .desktop-only.topbar-separator {
                display: block !important;
            }

            /* Hide mobile menu button on desktop */
            :host ::ng-deep .layout-topbar-menu-button {
                display: none !important;
            }
        }

        /* User Profile Section - Main container */
        .user-profile-section {
            align-items: center;
            height: 100%;
        }

        .user-info-container {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.375rem 0.75rem;
            border-radius: var(--border-radius);
            background: var(--surface-ground);
            border: 1px solid var(--surface-border);
            transition: all 0.2s ease;
            height: 2.5rem;
        }

        .user-info-container:hover {
            background: var(--surface-hover);
            border-color: var(--primary-color);
        }

        .user-details {
            display: flex;
            flex-direction: column;
            line-height: 1.1;
            max-width: 120px;
        }

        .user-name {
            font-weight: 600;
            font-size: 0.8rem;
            color: var(--text-color);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .user-role {
            font-size: 0.65rem;
            color: var(--text-color-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .topbar-separator {
            width: 1px;
            height: 1.5rem;
            background: var(--surface-border);
            align-self: center;
        }

        .layout-topbar-action {
            position: relative;
        }

        .login-action {
            color: var(--primary-color) !important;
            gap: 0.5rem;
            padding: 0.5rem 1rem !important;
            width: auto !important;
            border-radius: var(--border-radius) !important;
            background: var(--primary-100) !important;
        }

        .login-action:hover {
            background: var(--primary-200) !important;
        }

        .login-action span {
            display: inline !important;
            font-size: 0.875rem;
        }

        /* User Menu Popover Styles */
        .user-menu-popover {
            min-width: 300px;
        }

        .user-menu-header {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            padding: 1rem;
            background: linear-gradient(135deg, var(--primary-50) 0%, var(--surface-ground) 100%);
            border-bottom: 1px solid var(--surface-border);
        }

        .user-menu-info {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
            flex: 1;
            min-width: 0;
        }

        .user-menu-name {
            font-weight: 700;
            font-size: 1rem;
            color: var(--text-color);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .user-menu-email {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .user-menu-details {
            padding: 0.75rem 1rem;
            background: var(--surface-50);
            border-bottom: 1px solid var(--surface-border);
        }

        .detail-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0;
            font-size: 0.8rem;
            color: var(--text-color-secondary);
        }

        .detail-item i {
            font-size: 0.875rem;
            width: 1.25rem;
            color: var(--primary-500);
        }

        .user-menu-permissions {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--surface-border);
        }

        .permissions-label {
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--text-color-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: block;
            margin-bottom: 0.5rem;
        }

        .permissions-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 0.375rem;
        }

        .permission-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.75rem;
            height: 1.75rem;
            border-radius: 6px;
            background: var(--primary-100);
            color: var(--primary-600);
            font-size: 0.8rem;
            transition: all 0.2s;
            cursor: default;
        }

        .permission-badge:hover {
            background: var(--primary-200);
            transform: scale(1.05);
        }

        .permission-badge.admin {
            background: var(--red-100);
            color: var(--red-600);
        }

        .permission-badge.admin:hover {
            background: var(--red-200);
        }

        .user-menu-actions, .user-menu-logout {
            padding: 0.375rem;
        }

        .menu-action-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.625rem 0.875rem;
            border-radius: 6px;
            color: var(--text-color);
            text-decoration: none;
            transition: all 0.15s ease;
            cursor: pointer;
        }

        .menu-action-item:hover {
            background: var(--surface-hover);
        }

        .menu-action-item i {
            font-size: 0.9rem;
            width: 1.25rem;
            color: var(--text-color-secondary);
        }

        .menu-action-item span {
            font-size: 0.875rem;
            display: inline !important;
        }

        .menu-action-item.logout {
            color: var(--red-500);
        }

        .menu-action-item.logout i {
            color: var(--red-500);
        }

        .menu-action-item.logout:hover {
            background: var(--red-50);
        }

        /* PrimeNG Overrides */
        :host ::ng-deep .logout-confirm-dialog {
            .p-dialog-header {
                display: none;
            }
            .p-dialog-content {
                padding: 0;
            }
        }

        :host ::ng-deep .p-popover {
            .p-popover-content {
                padding: 0;
                border-radius: var(--border-radius);
                overflow: hidden;
            }
        }

        :host ::ng-deep .p-divider {
            margin: 0 !important;
        }

        :host ::ng-deep .p-tag {
            font-size: 0.7rem;
            padding: 0.15rem 0.5rem;
        }

        :host ::ng-deep .p-avatar {
            flex-shrink: 0;
        }

        /* Notification Badge */
        .notification-badge {
            position: absolute;
            top: 2px;
            right: 2px;
            min-width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--red-500);
            color: white;
            font-size: 0.625rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
        }

        /* Login Button */
        .login-btn {
            gap: 0.5rem;
            padding: 0.5rem 1rem !important;
            width: auto !important;
            border-radius: var(--border-radius) !important;
            background: var(--primary-color) !important;
            color: white !important;
        }

        .login-btn:hover {
            background: var(--primary-600) !important;
        }

        .login-btn span {
            display: inline !important;
            font-size: 0.875rem;
        }

        /* Logout action in mobile */
        .logout-action {
            color: var(--red-500) !important;
        }

        .logout-action:hover {
            background: var(--red-50) !important;
        }

        /* Mobile User Header */
        .mobile-user-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            margin-bottom: 0.5rem;
            background: var(--surface-ground);
            border-radius: var(--border-radius);
        }

        .mobile-user-info {
            display: flex;
            flex-direction: column;
            line-height: 1.2;
        }

        .mobile-user-name {
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--text-color);
        }

        .mobile-user-role {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }

        /* Responsive */
        @media (max-width: 991px) {
            .user-profile-section {
                width: 100%;
            }

            .user-info-container {
                width: 100%;
                justify-content: flex-start;
                padding: 0.5rem 1rem;
                height: auto;
            }

            .user-details {
                max-width: none;
                flex: 1;
            }
        }
    `]
})
export class AppTopbar implements OnInit, OnDestroy {
    items!: MenuItem[];
    private routerSubscription!: Subscription;
    private authSubscription!: Subscription;

    currentUser: User | null = null;
    notificationCount = 0;
    showLogoutDialog = false;

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
        'dms-admin': { title: 'DMS ADMIN', icon: 'pi pi-shield', color: '#DC2626' },
        'dms-home': { title: 'DMS HOME', icon: 'pi pi-home', color: '#10B981' }
    };

    private roleLabels: { [key: string]: string } = {
        'admin': 'Administrator',
        'rh_manager': 'HR Manager',
        'team_leader': 'Team Leader',
        'supervisor': 'Supervisor',
        'operator': 'Operator',
        'formateur': 'Trainer',
        'manager': 'Manager',
        'technician': 'Technician',
        'viewer': 'Viewer'
    };

    constructor(
        public layoutService: LayoutService,
        private router: Router,
        private authService: AuthService,
        private confirmationService: ConfirmationService
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

        // Subscribe to auth state changes
        this.authSubscription = this.authService.getAuthState().subscribe(state => {
            this.currentUser = state.user;
        });

        // Also get current user immediately
        this.currentUser = this.authService.getCurrentUser();
    }

    ngOnDestroy() {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
        if (this.authSubscription) {
            this.authSubscription.unsubscribe();
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

    // User display methods
    getUserDisplayName(): string {
        if (!this.currentUser) return '';

        // Try different name fields
        if (this.currentUser.first_name && this.currentUser.last_name) {
            return `${this.currentUser.first_name} ${this.currentUser.last_name}`;
        }
        if (this.currentUser.employee_name) {
            return this.currentUser.employee_name;
        }
        if (this.currentUser.first_name) {
            return this.currentUser.first_name;
        }
        if (this.currentUser.username) {
            return this.currentUser.username;
        }
        return 'User';
    }

    getUserInitials(): string {
        const name = this.getUserDisplayName();
        if (!name) return 'U';

        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    getUserRole(): string {
        if (!this.currentUser) return '';

        const position = this.currentUser.position;
        if (!position) return 'User';
        return this.roleLabels[position] || position || 'User';
    }

    getAvatarColor(): string {
        const colors = [
            '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
            '#F59E0B', '#10B981', '#06B6D4', '#6366F1'
        ];

        // Generate consistent color based on user name
        const name = this.getUserDisplayName();
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    getUserPicture(): string | undefined {
        if (!this.currentUser) return undefined;

        // Check for picture field (from employee)
        const picture = (this.currentUser as any).picture || (this.currentUser as any).photo;
        if (!picture) return undefined;

        // If already a full URL, return as is
        if (picture.startsWith('http') || picture.startsWith('data:')) {
            return picture;
        }

        // Prepend media URL
        return `${environment.mediaUrl}${picture}`;
    }

    getRoleSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        if (!this.currentUser?.position) return 'secondary';

        const severityMap: { [key: string]: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' } = {
            'admin': 'danger',
            'manager': 'warn',
            'rh_manager': 'warn',
            'supervisor': 'info',
            'team_leader': 'info',
            'formateur': 'success',
            'technician': 'success',
            'operator': 'secondary',
            'viewer': 'secondary'
        };

        return severityMap[this.currentUser.position] || 'secondary';
    }

    hasAnyModulePermission(): boolean {
        if (!this.currentUser) return false;

        return !!(
            this.currentUser.dms_production ||
            this.currentUser.dms_hr ||
            this.currentUser.dms_quality ||
            this.currentUser.dms_maintenance ||
            this.currentUser.dms_inventory ||
            this.currentUser.dms_analytics ||
            this.currentUser.dms_tech ||
            this.currentUser.dms_admin ||
            this.currentUser.dms_kpi ||
            this.currentUser.dms_ll
        );
    }

    // Logout methods
    confirmLogout(): void {
        this.confirmationService.confirm({
            key: 'logoutDialog',
            header: 'Logout',
            message: 'Are you sure you want to logout?',
            accept: () => {
                this.logout();
            }
        });
    }

    cancelLogout(): void {
        this.confirmationService.close();
    }

    logout(): void {
        this.confirmationService.close();
        this.authService.logout();

        // Clear any session data
        sessionStorage.removeItem('dms_user');

        // Redirect to login or home
        this.router.navigate(['/dms-home']);
    }

    goToLogin(): void {
        // Navigate to login based on current module
        const moduleKey = this.router.url.split('/').filter(s => s)[0] || 'dms-home';

        if (moduleKey === 'dms-production') {
            this.router.navigate(['/dms-production-login']);
        } else {
            this.router.navigate(['/dms-login'], {
                queryParams: { returnUrl: this.router.url }
            });
        }
    }
}
