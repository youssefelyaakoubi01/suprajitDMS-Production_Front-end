import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-dms-login',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        CheckboxModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './dms-login.component.html',
    styleUrls: ['./dms-login.component.scss']
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
            // For demo: accept any credentials
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
