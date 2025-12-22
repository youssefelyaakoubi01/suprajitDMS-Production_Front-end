import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '@core/services/auth.service';

interface ModuleConfig {
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    gradient: string;
    loginLabel: string;
}

@Component({
    selector: 'app-dms-login',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        CheckboxModule,
        ToastModule,
        RippleModule
    ],
    providers: [MessageService],
    template: `
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem;" [ngStyle]="{'background': 'linear-gradient(180deg, ' + moduleConfig.color + ' 10%, transparent 30%)'}">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-12 px-8 sm:px-20" style="border-radius: 53px">
                        <!-- Header with Logo -->
                        <div class="text-center mb-8">
                            <div class="inline-flex items-center justify-center mb-6"
                                 style="width: 80px; height: 80px; border-radius: 50%;"
                                 [ngStyle]="{'background': moduleConfig.gradient}">
                                <i [class]="moduleConfig.icon + ' text-4xl text-white'"></i>
                            </div>
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-2">{{ moduleConfig.title }}</div>
                            <span class="text-muted-color font-medium">{{ moduleConfig.subtitle }}</span>
                        </div>

                        <!-- Login Form -->
                        <div class="mb-6">
                            <div class="text-center mb-6">
                                <span class="text-surface-600 dark:text-surface-300 text-xl font-semibold">{{ moduleConfig.loginLabel }}</span>
                            </div>

                            <label for="username" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Username</label>
                            <input
                                pInputText
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                class="w-full md:w-120 mb-6"
                                [(ngModel)]="username"
                                (keyup.enter)="onLogin()" />

                            <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                            <p-password
                                id="password"
                                [(ngModel)]="password"
                                placeholder="Enter your password"
                                [toggleMask]="true"
                                styleClass="mb-4"
                                [fluid]="true"
                                [feedback]="false"
                                (keyup.enter)="onLogin()">
                            </p-password>

                            <div class="flex items-center justify-between mt-2 mb-6 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox [(ngModel)]="rememberMe" id="rememberMe" binary class="mr-2"></p-checkbox>
                                    <label for="rememberMe" class="text-surface-900 dark:text-surface-0">Remember me</label>
                                </div>
                            </div>

                            <p-button
                                label="Sign In"
                                icon="pi pi-sign-in"
                                styleClass="w-full mb-4"
                                [loading]="isLoading"
                                (click)="onLogin()">
                            </p-button>

                            <!-- Show scan badge only for production module -->
                            <ng-container *ngIf="targetModule === 'production'">
                                <div class="flex items-center my-6">
                                    <div class="flex-1 border-t border-surface-300 dark:border-surface-600"></div>
                                    <span class="px-4 text-surface-500 text-sm font-medium">OR</span>
                                    <div class="flex-1 border-t border-surface-300 dark:border-surface-600"></div>
                                </div>

                                <p-button
                                    label="Scan Badge"
                                    icon="pi pi-id-card"
                                    styleClass="w-full"
                                    severity="secondary"
                                    [outlined]="true"
                                    (click)="onScanBadge()">
                                </p-button>
                            </ng-container>
                        </div>

                        <!-- Back to Home -->
                        <div class="text-center mb-4">
                            <a routerLink="/dms-home" class="text-primary font-medium hover:underline">
                                <i class="pi pi-arrow-left mr-2"></i>Back to DMS Home
                            </a>
                        </div>

                        <!-- Footer -->
                        <div class="text-center mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                            <p class="text-surface-500 text-sm m-0">Suprajit DMS - Digital Manufacturing System</p>
                            <p class="text-surface-400 text-xs mt-2 m-0">&copy; {{ currentYear }} All rights reserved</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <p-toast position="top-center"></p-toast>
    `
})
export class DmsLoginComponent implements OnInit {
    username = '';
    password = '';
    rememberMe = false;
    isLoading = false;
    returnUrl = '/dms-home';
    targetModule = 'default';
    currentYear = new Date().getFullYear();

    // Module configurations
    private moduleConfigs: { [key: string]: ModuleConfig } = {
        'admin': {
            title: 'DMS Admin',
            subtitle: 'User & Permission Management',
            icon: 'pi pi-shield',
            color: '#DC2626',
            gradient: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
            loginLabel: 'Administrator Login'
        },
        'production': {
            title: 'DMS Production',
            subtitle: 'Manufacturing Excellence',
            icon: 'pi pi-bolt',
            color: '#3B82F6',
            gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            loginLabel: 'Team Leader Login'
        },
        'hr': {
            title: 'DMS HR',
            subtitle: 'Human Resources',
            icon: 'pi pi-users',
            color: '#8B5CF6',
            gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            loginLabel: 'HR Manager Login'
        },
        'maintenance': {
            title: 'DMS Maintenance',
            subtitle: 'Equipment Care',
            icon: 'pi pi-wrench',
            color: '#06B6D4',
            gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
            loginLabel: 'Technician Login'
        },
        'inventory': {
            title: 'DMS Inventory',
            subtitle: 'Stock Control',
            icon: 'pi pi-box',
            color: '#F59E0B',
            gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            loginLabel: 'Warehouse Login'
        },
        'quality': {
            title: 'DMS Quality',
            subtitle: 'Quality Assurance',
            icon: 'pi pi-check-circle',
            color: '#10B981',
            gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            loginLabel: 'Quality Inspector Login'
        },
        'tech': {
            title: 'DMS Tech',
            subtitle: 'System Configuration',
            icon: 'pi pi-cog',
            color: '#6366F1',
            gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            loginLabel: 'Technical Admin Login'
        },
        'analytics': {
            title: 'DMS Analytics',
            subtitle: 'Business Intelligence',
            icon: 'pi pi-chart-bar',
            color: '#EC4899',
            gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
            loginLabel: 'Manager Login'
        },
        'default': {
            title: 'DMS Portal',
            subtitle: 'Digital Manufacturing System',
            icon: 'pi pi-th-large',
            color: '#3B82F6',
            gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            loginLabel: 'User Login'
        }
    };

    moduleConfig: ModuleConfig = this.moduleConfigs['default'];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private messageService: MessageService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        // Get return URL from query params
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dms-home';

        // Detect target module from returnUrl
        this.targetModule = this.detectModule(this.returnUrl);
        this.moduleConfig = this.moduleConfigs[this.targetModule] || this.moduleConfigs['default'];

        // Check if already authenticated
        if (this.authService.isAuthenticated()) {
            const user = this.authService.getCurrentUser();
            if (user) {
                // Check if user has access to target module
                if (this.hasModuleAccess(user, this.targetModule)) {
                    this.router.navigate([this.returnUrl]);
                }
            }
        }
    }

    private detectModule(url: string): string {
        if (url.includes('dms-admin')) return 'admin';
        if (url.includes('dms-production')) return 'production';
        if (url.includes('dms-hr')) return 'hr';
        if (url.includes('dms-maintenance')) return 'maintenance';
        if (url.includes('dms-inventory')) return 'inventory';
        if (url.includes('dms-quality')) return 'quality';
        if (url.includes('dms-tech')) return 'tech';
        if (url.includes('analytics')) return 'analytics';
        return 'default';
    }

    private hasModuleAccess(user: any, module: string): boolean {
        const modulePermissionMap: { [key: string]: string } = {
            'admin': 'dms_admin',
            'production': 'dms_production',
            'hr': 'dms_hr',
            'maintenance': 'dms_maintenance',
            'inventory': 'dms_inventory',
            'quality': 'dms_quality',
            'tech': 'dms_tech',
            'analytics': 'dms_analytics'
        };

        const permission = modulePermissionMap[module];
        if (!permission) return true; // Default module accessible to all

        // Admin position has access to everything
        if (user.position === 'admin') return true;

        return user[permission] === true;
    }

    onLogin(): void {
        if (!this.username || !this.password) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please enter username and password'
            });
            return;
        }

        this.isLoading = true;

        // Use real API authentication
        this.authService.login({ username: this.username, password: this.password }).subscribe({
            next: () => {
                // Fetch user profile after successful login
                this.authService.getUserProfile().subscribe({
                    next: (user) => {
                        this.handleSuccessfulLogin(user);
                    },
                    error: (profileError) => {
                        console.warn('Could not fetch full profile, using basic user:', profileError);
                        // Continue with basic user info from token
                        const user = this.authService.getCurrentUser();
                        if (user) {
                            this.handleSuccessfulLogin(user);
                        } else {
                            this.handleSuccessfulLogin({
                                id: 0,
                                username: this.username,
                                email: '',
                                first_name: this.username,
                                last_name: ''
                            });
                        }
                    }
                });
            },
            error: (error) => {
                this.isLoading = false;
                console.error('Login error:', error);

                let errorMessage = 'Authentication failed. Please check your credentials.';
                if (error.status === 401) {
                    errorMessage = 'Invalid username or password.';
                } else if (error.status === 0) {
                    errorMessage = 'Cannot connect to server. Please try again later.';
                } else if (error.error?.detail) {
                    errorMessage = error.error.detail;
                }

                this.messageService.add({
                    severity: 'error',
                    summary: 'Login Failed',
                    detail: errorMessage
                });
            }
        });
    }

    private handleSuccessfulLogin(user: any): void {
        // Store user in AuthService
        this.authService.setUser(user);

        // Store session for backward compatibility
        sessionStorage.setItem('dms_user', JSON.stringify({
            employeeId: user.employee || user.id,
            username: user.username,
            role: user.position || 'User',
            loginTime: new Date().toISOString()
        }));

        // Check module access
        if (!this.hasModuleAccess(user, this.targetModule)) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Access Restricted',
                detail: `You don't have access to ${this.moduleConfig.title}. Redirecting to home.`
            });
            this.isLoading = false;
            setTimeout(() => {
                this.router.navigate(['/dms-home']);
            }, 2000);
            return;
        }

        this.messageService.add({
            severity: 'success',
            summary: 'Welcome',
            detail: `Login successful! Welcome ${user.first_name || user.username}`
        });

        // Redirect to return URL
        setTimeout(() => {
            this.isLoading = false;
            this.router.navigate([this.returnUrl]);
        }, 1000);
    }

    onScanBadge(): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Badge Scanner',
            detail: 'Badge scanner ready. Please scan your employee badge.'
        });
    }
}
