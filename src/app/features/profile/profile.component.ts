import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.model';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        AvatarModule,
        TagModule,
        DividerModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <div class="profile-container p-4">
            <h1 class="text-3xl font-bold mb-4">My Profile</h1>

            <div class="grid">
                <!-- Profile Header Card -->
                <div class="col-12">
                    <p-card>
                        <div class="flex flex-column md:flex-row align-items-center gap-4">
                            <p-avatar
                                [label]="getUserInitials()"
                                [style]="{'background': getAvatarColor(), 'color': '#ffffff', 'font-size': '2rem', 'width': '6rem', 'height': '6rem'}"
                                shape="circle"
                                size="xlarge">
                            </p-avatar>
                            <div class="flex-1 text-center md:text-left">
                                <h2 class="text-2xl font-bold m-0">{{ user?.first_name }} {{ user?.last_name }}</h2>
                                <p class="text-color-secondary mt-1 mb-2">{{ user?.email }}</p>
                                <div class="flex gap-2 flex-wrap justify-content-center md:justify-content-start">
                                    <p-tag [value]="getRoleLabel()" [severity]="getRoleSeverity()"></p-tag>
                                    <p-tag *ngIf="user?.department_name" [value]="user?.department_name || ''" severity="secondary"></p-tag>
                                    <p-tag *ngIf="user?.status" [value]="user?.status || ''" [severity]="getStatusSeverity()"></p-tag>
                                </div>
                            </div>
                        </div>
                    </p-card>
                </div>

                <!-- Personal Information -->
                <div class="col-12 md:col-6">
                    <p-card header="Personal Information">
                        <div class="flex flex-column gap-3">
                            <div class="flex justify-content-between py-2 border-bottom-1 surface-border">
                                <span class="text-color-secondary font-medium">Username</span>
                                <span class="font-semibold">{{ user?.username }}</span>
                            </div>
                            <div class="flex justify-content-between py-2 border-bottom-1 surface-border">
                                <span class="text-color-secondary font-medium">Email</span>
                                <span class="font-semibold">{{ user?.email }}</span>
                            </div>
                            <div class="flex justify-content-between py-2 border-bottom-1 surface-border">
                                <span class="text-color-secondary font-medium">First Name</span>
                                <span class="font-semibold">{{ user?.first_name || '-' }}</span>
                            </div>
                            <div class="flex justify-content-between py-2 border-bottom-1 surface-border">
                                <span class="text-color-secondary font-medium">Last Name</span>
                                <span class="font-semibold">{{ user?.last_name || '-' }}</span>
                            </div>
                            <div *ngIf="user?.employee_name" class="flex justify-content-between py-2">
                                <span class="text-color-secondary font-medium">Employee Name</span>
                                <span class="font-semibold">{{ user?.employee_name }}</span>
                            </div>
                        </div>
                    </p-card>
                </div>

                <!-- Module Access -->
                <div class="col-12 md:col-6">
                    <p-card header="Module Access">
                        <div class="grid">
                            <div class="col-6 sm:col-4 lg:col-3" *ngFor="let module of modules">
                                <div class="flex flex-column align-items-center p-3 border-round"
                                     [ngClass]="{'surface-100': hasModuleAccess(module.key), 'surface-50 opacity-40': !hasModuleAccess(module.key)}">
                                    <i [class]="module.icon" class="text-2xl mb-2"
                                       [ngClass]="{'text-primary': hasModuleAccess(module.key)}"></i>
                                    <span class="text-sm font-medium text-center">{{ module.label }}</span>
                                </div>
                            </div>
                        </div>
                    </p-card>
                </div>

                <!-- Account Information -->
                <div class="col-12">
                    <p-card header="Account Information">
                        <div class="grid">
                            <div class="col-12 md:col-4">
                                <div class="flex justify-content-between py-2">
                                    <span class="text-color-secondary font-medium">User ID</span>
                                    <span class="font-semibold">{{ user?.id }}</span>
                                </div>
                            </div>
                            <div class="col-12 md:col-4">
                                <div class="flex justify-content-between py-2">
                                    <span class="text-color-secondary font-medium">Position</span>
                                    <span class="font-semibold">{{ getRoleLabel() }}</span>
                                </div>
                            </div>
                            <div class="col-12 md:col-4">
                                <div class="flex justify-content-between align-items-center py-2">
                                    <span class="text-color-secondary font-medium">Status</span>
                                    <p-tag [value]="user?.status || 'active'" [severity]="getStatusSeverity()"></p-tag>
                                </div>
                            </div>
                        </div>
                    </p-card>
                </div>
            </div>
        </div>
    `
})
export class ProfileComponent implements OnInit {
    user: User | null = null;

    modules = [
        { key: 'dms_production', label: 'Production', icon: 'pi pi-bolt' },
        { key: 'dms_hr', label: 'HR', icon: 'pi pi-users' },
        { key: 'dms_quality', label: 'Quality', icon: 'pi pi-check-circle' },
        { key: 'dms_maintenance', label: 'Maintenance', icon: 'pi pi-wrench' },
        { key: 'dms_inventory', label: 'Inventory', icon: 'pi pi-box' },
        { key: 'dms_analytics', label: 'Analytics', icon: 'pi pi-chart-bar' },
        { key: 'dms_tech', label: 'Tech', icon: 'pi pi-cog' },
        { key: 'dms_admin', label: 'Admin', icon: 'pi pi-shield' }
    ];

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
        private authService: AuthService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.user = this.authService.getCurrentUser();
        if (this.user) {
            this.authService.getUserProfile().subscribe({
                next: (user) => this.user = user,
                error: () => {}
            });
        }
    }

    getUserInitials(): string {
        if (!this.user) return 'U';
        const first = this.user.first_name?.[0] || '';
        const last = this.user.last_name?.[0] || '';
        return (first + last).toUpperCase() || this.user.username.substring(0, 2).toUpperCase();
    }

    getAvatarColor(): string {
        const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981'];
        const name = `${this.user?.first_name || ''}${this.user?.last_name || ''}`;
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    getRoleLabel(): string {
        return this.roleLabels[this.user?.position || ''] || this.user?.position || 'User';
    }

    getRoleSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: { [key: string]: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' } = {
            'admin': 'danger',
            'manager': 'warn',
            'supervisor': 'info',
            'team_leader': 'info',
            'operator': 'secondary'
        };
        return map[this.user?.position || ''] || 'secondary';
    }

    getStatusSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: { [key: string]: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' } = {
            'active': 'success',
            'inactive': 'secondary',
            'suspended': 'danger'
        };
        return map[this.user?.status || ''] || 'secondary';
    }

    hasModuleAccess(moduleKey: string): boolean {
        return (this.user as any)?.[moduleKey] === true;
    }
}
