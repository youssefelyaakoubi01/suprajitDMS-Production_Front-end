import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '@core/services/auth.service';
import { Subscription } from 'rxjs';

interface DMSModule {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    color: string;
    gradient: string;
    route: string;
    loginRoute?: string;
    features: string[];
    isActive: boolean;
}

@Component({
    selector: 'app-dms-selector',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ButtonModule,
        CardModule,
        RippleModule,
        TooltipModule,
        AvatarModule,
        MenuModule
    ],
    templateUrl: './dms-selector.component.html',
    styleUrls: ['./dms-selector.component.scss']
})
export class DmsSelectorComponent implements OnInit, OnDestroy {
    currentYear = new Date().getFullYear();
    currentUser: any = null;
    userMenuItems: MenuItem[] = [];
    private authSubscription!: Subscription;

    dmsModules: DMSModule[] = [
        {
            id: 'production',
            title: 'DMS Production',
            subtitle: 'Manufacturing Excellence',
            description: 'Real-time production monitoring, output tracking, downtime management and shift operations.',
            icon: 'pi pi-bolt',
            color: '#3B82F6',
            gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            route: '/dms-production/dashboard',
            loginRoute: '/dms-production-login',
            features: ['Production Tracking', 'Downtime Analysis', 'Output Metrics', 'Shift Management'],
            isActive: true
        },
        {
            id: 'hr',
            title: 'DMS HR',
            subtitle: 'Human Resources',
            description: 'Employee management, training programs, qualifications matrix and team organization.',
            icon: 'pi pi-users',
            color: '#8B5CF6',
            gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            route: '/dms-hr/dashboard',
            features: ['Employee Management', 'Formations', 'Versatility Matrix', 'Recyclage'],
            isActive: true
        },
        {
            id: 'maintenance',
            title: 'DMS Maintenance',
            subtitle: 'Equipment Care',
            description: 'Preventive and corrective maintenance, equipment tracking and intervention management.',
            icon: 'pi pi-wrench',
            color: '#06B6D4',
            gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
            route: '/dms-maintenance/dashboard',
            features: ['Work Orders', 'Preventive Maintenance', 'Spare Parts', 'Equipment History'],
            isActive: true
        },
        {
            id: 'inventory',
            title: 'DMS Inventory',
            subtitle: 'Stock Control',
            description: 'Inventory management, stock levels, parts tracking and warehouse operations.',
            icon: 'pi pi-box',
            color: '#F59E0B',
            gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            route: '/dms-inventory/dashboard',
            features: ['Stock Management', 'Parts Catalog', 'Location Tracking', 'Inventory Reports'],
            isActive: true
        },
        {
            id: 'tech',
            title: 'DMS Tech',
            subtitle: 'Configuration',
            description: 'Configure and manage master data: Projects, Production Lines, Parts, Machines, Zones and Targets.',
            icon: 'pi pi-cog',
            color: '#6366F1',
            gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            route: '/dms-tech/dashboard',
            features: ['Projects', 'Production Lines', 'Parts & Machines', 'Targets & Headcount'],
            isActive: true
        },
        {
            id: 'admin',
            title: 'DMS Admin',
            subtitle: 'User Management',
            description: 'Manage user accounts, permissions, module access and activity logs. Administrator access only.',
            icon: 'pi pi-shield',
            color: '#DC2626',
            gradient: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
            route: '/dms-admin/dashboard',
            features: ['User Accounts', 'Permissions', 'Module Access', 'Activity Logs'],
            isActive: true
        }
    ];

    constructor(
        private router: Router,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        // Subscribe to auth state
        this.authSubscription = this.authService.getAuthState().subscribe(state => {
            this.currentUser = state.user;
            this.updateUserMenu();
        });

        // Get current user
        this.currentUser = this.authService.getCurrentUser();
        this.updateUserMenu();
    }

    ngOnDestroy(): void {
        if (this.authSubscription) {
            this.authSubscription.unsubscribe();
        }
    }

    private updateUserMenu(): void {
        this.userMenuItems = [
            {
                label: this.getUserDisplayName(),
                items: [
                    {
                        label: 'Mon Profil',
                        icon: 'pi pi-user',
                        command: () => {}
                    },
                    {
                        separator: true
                    },
                    {
                        label: 'Déconnexion',
                        icon: 'pi pi-sign-out',
                        command: () => this.logout()
                    }
                ]
            }
        ];
    }

    navigateToModule(module: DMSModule): void {
        if (module.isActive) {
            // Check if user is authenticated for modules that require login
            if (module.loginRoute && !this.authService.isAuthenticated()) {
                this.router.navigate([module.loginRoute]);
            } else {
                this.router.navigate([module.route]);
            }
        }
    }

    goToLogin(module: DMSModule, event: Event): void {
        event.stopPropagation();
        if (module.loginRoute) {
            this.router.navigate([module.loginRoute]);
        } else {
            this.router.navigate(['/dms-login'], {
                queryParams: { returnUrl: module.route }
            });
        }
    }

    getModuleStatus(module: DMSModule): string {
        return module.isActive ? 'Active' : 'Coming Soon';
    }

    isAuthenticated(): boolean {
        return this.authService.isAuthenticated();
    }

    getUserDisplayName(): string {
        if (!this.currentUser) return 'Utilisateur';

        if (this.currentUser.first_name && this.currentUser.last_name) {
            return `${this.currentUser.first_name} ${this.currentUser.last_name}`;
        }
        if (this.currentUser.name) return this.currentUser.name;
        if (this.currentUser.first_name) return this.currentUser.first_name;
        if (this.currentUser.username) return this.currentUser.username;
        return 'Utilisateur';
    }

    getUserInitials(): string {
        const name = this.getUserDisplayName();
        if (!name || name === 'Utilisateur') return 'U';

        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    logout(): void {
        this.authService.logout();
        this.currentUser = null;
    }
}
