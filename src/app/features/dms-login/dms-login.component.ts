import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';

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
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-12 px-8 sm:px-20" style="border-radius: 53px">
                        <!-- Header with Logo -->
                        <div class="text-center mb-8">
                            <div class="inline-flex items-center justify-center mb-6" style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-600) 100%);">
                                <i class="pi pi-bolt text-4xl text-white"></i>
                            </div>
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-2">DMS Production</div>
                            <span class="text-muted-color font-medium">Digital Manufacturing System</span>
                        </div>

                        <!-- Login Form -->
                        <div class="mb-6">
                            <div class="text-center mb-6">
                                <span class="text-surface-600 dark:text-surface-300 text-xl font-semibold">Team Leader Login</span>
                            </div>

                            <label for="employeeId" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Employee ID</label>
                            <input
                                pInputText
                                id="employeeId"
                                type="text"
                                placeholder="Enter your Employee ID"
                                class="w-full md:w-120 mb-6"
                                [(ngModel)]="employeeId"
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
                        </div>

                        <!-- Footer -->
                        <div class="text-center mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                            <p class="text-surface-500 text-sm m-0">Suprajit DMS - Digital Manufacturing System</p>
                            <p class="text-surface-400 text-xs mt-2 m-0">&copy; 2026 All rights reserved</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <p-toast position="top-center"></p-toast>
    `
})
export class DmsLoginComponent {
    employeeId = '';
    password = '';
    rememberMe = false;
    isLoading = false;

    constructor(
        private router: Router,
        private messageService: MessageService
    ) {}

    onLogin(): void {
        if (!this.employeeId || !this.password) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please enter Employee ID and Password'
            });
            return;
        }

        this.isLoading = true;

        // Simulate login (replace with real authentication later)
        setTimeout(() => {
            if (this.employeeId && this.password) {
                // Store user info in session
                sessionStorage.setItem('dms_user', JSON.stringify({
                    employeeId: this.employeeId,
                    role: 'Team Leader',
                    loginTime: new Date().toISOString()
                }));

                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Login successful! Redirecting...'
                });

                // Redirect to DMS-Production dashboard
                setTimeout(() => {
                    this.router.navigate(['/dms-production/dashboard']);
                }, 1000);
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Invalid credentials'
                });
                this.isLoading = false;
            }
        }, 1500);
    }

    onScanBadge(): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Info',
            detail: 'Badge scanner ready. Please scan your badge.'
        });
    }
}
