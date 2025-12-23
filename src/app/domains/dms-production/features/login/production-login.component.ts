/**
 * Production Login Component
 * Domain: DMS-Production
 *
 * Dedicated login page for production team members with:
 * - Modern industrial design
 * - Credentials authentication
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MessageService } from 'primeng/api';
import { AuthService } from '@core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-production-login',
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
        RippleModule,
        DialogModule,
        DividerModule,
        InputGroupModule,
        InputGroupAddonModule
    ],
    providers: [MessageService],
    template: `
        <div class="production-login-container">
            <!-- Animated Background -->
            <div class="background-animation">
                <div class="gear gear-1"><i class="pi pi-cog"></i></div>
                <div class="gear gear-2"><i class="pi pi-cog"></i></div>
                <div class="gear gear-3"><i class="pi pi-cog"></i></div>
                <div class="line line-1"></div>
                <div class="line line-2"></div>
                <div class="line line-3"></div>
            </div>

            <!-- Main Content -->
            <div class="login-content">
                <!-- Left Panel - Branding -->
                <div class="branding-panel">
                    <div class="branding-content">
                        <div class="logo-container">
                            <div class="logo-icon">
                                <i class="pi pi-bolt"></i>
                            </div>
                            <h1 class="logo-text">DMS Production</h1>
                        </div>
                        <p class="tagline">Manufacturing Excellence System</p>

                        <div class="features-list">
                            <div class="feature-item">
                                <div class="feature-icon"><i class="pi pi-chart-line"></i></div>
                                <div class="feature-text">
                                    <h4>Real-time Monitoring</h4>
                                    <p>Track production metrics live</p>
                                </div>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon"><i class="pi pi-clock"></i></div>
                                <div class="feature-text">
                                    <h4>Downtime Tracking</h4>
                                    <p>Minimize production losses</p>
                                </div>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon"><i class="pi pi-users"></i></div>
                                <div class="feature-text">
                                    <h4>Team Management</h4>
                                    <p>Coordinate your workforce</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Right Panel - Login Form -->
                <div class="login-panel">
                    <div class="login-card">
                        <!-- Credentials Login -->
                        <div class="login-form">
                            <h2 class="form-title">Bienvenue</h2>
                            <p class="form-subtitle">Connectez-vous pour accéder au tableau de bord de production</p>

                            <div class="form-group">
                                <label for="username">Identifiant</label>
                                <p-inputGroup>
                                    <p-inputGroupAddon><i class="pi pi-user"></i></p-inputGroupAddon>
                                    <input pInputText id="username" type="text"
                                           [(ngModel)]="username"
                                           placeholder="Entrez votre identifiant"
                                           (keyup.enter)="onLogin()"
                                           autocomplete="username" />
                                </p-inputGroup>
                            </div>

                            <div class="form-group">
                                <label for="password">Mot de passe</label>
                                <p-password id="password"
                                            [(ngModel)]="password"
                                            placeholder="Entrez votre mot de passe"
                                            [toggleMask]="true"
                                            [feedback]="false"
                                            styleClass="w-full"
                                            [inputStyleClass]="'w-full'"
                                            (keyup.enter)="onLogin()">
                                </p-password>
                            </div>

                            <div class="form-options">
                                <div class="remember-me">
                                    <p-checkbox [(ngModel)]="rememberMe" [binary]="true" inputId="remember"></p-checkbox>
                                    <label for="remember">Se souvenir de moi</label>
                                </div>
                            </div>

                            <button pButton pRipple class="login-btn" [loading]="isLoading"
                                    (click)="onLogin()">
                                <i class="pi pi-sign-in" *ngIf="!isLoading"></i>
                                <span>Se connecter</span>
                            </button>
                        </div>

                        <!-- Footer -->
                        <div class="login-footer">
                            <a routerLink="/dms-home" class="back-link">
                                <i class="pi pi-arrow-left"></i>
                                <span>Retour à l'accueil DMS</span>
                            </a>
                        </div>
                    </div>

                    <!-- Bottom Info -->
                    <div class="bottom-info">
                        <p>&copy; {{ currentYear }} Suprajit DMS - Digital Manufacturing System</p>
                    </div>
                </div>
            </div>
        </div>

        <p-toast position="top-center"></p-toast>
    `,
    styles: [`
        :host {
            display: block;
            height: 100vh;
            width: 100vw;
        }

        .production-login-container {
            min-height: 100vh;
            width: 100%;
            display: flex;
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }

        /* Animated Background */
        .background-animation {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
        }

        .gear {
            position: absolute;
            color: rgba(59, 130, 246, 0.1);
            animation: rotate 20s linear infinite;
        }

        .gear-1 {
            font-size: 200px;
            top: -50px;
            right: -50px;
        }

        .gear-2 {
            font-size: 150px;
            bottom: 10%;
            left: -30px;
            animation-direction: reverse;
            animation-duration: 25s;
        }

        .gear-3 {
            font-size: 100px;
            top: 40%;
            left: 30%;
            animation-duration: 30s;
        }

        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .line {
            position: absolute;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
            animation: moveLine 3s ease-in-out infinite;
        }

        .line-1 {
            width: 200px;
            top: 20%;
            left: 10%;
            animation-delay: 0s;
        }

        .line-2 {
            width: 150px;
            top: 50%;
            right: 15%;
            animation-delay: 1s;
        }

        .line-3 {
            width: 180px;
            bottom: 30%;
            left: 20%;
            animation-delay: 2s;
        }

        @keyframes moveLine {
            0%, 100% { opacity: 0; transform: translateX(-50px); }
            50% { opacity: 1; transform: translateX(50px); }
        }

        /* Main Content */
        .login-content {
            display: flex;
            width: 100%;
            min-height: 100vh;
            position: relative;
            z-index: 1;
        }

        /* Branding Panel */
        .branding-panel {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%);
        }

        .branding-content {
            max-width: 500px;
            color: white;
        }

        .logo-container {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .logo-icon {
            width: 70px;
            height: 70px;
            border-radius: 16px;
            background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
        }

        .logo-icon i {
            font-size: 2rem;
            color: white;
        }

        .logo-text {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0;
            background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .tagline {
            font-size: 1.25rem;
            color: #94a3b8;
            margin: 0 0 3rem 0;
        }

        .features-list {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-bottom: 3rem;
        }

        .feature-item {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .feature-icon {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            background: rgba(59, 130, 246, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .feature-icon i {
            font-size: 1.25rem;
            color: #3B82F6;
        }

        .feature-text h4 {
            margin: 0;
            font-size: 1rem;
            font-weight: 600;
            color: white;
        }

        .feature-text p {
            margin: 0.25rem 0 0 0;
            font-size: 0.875rem;
            color: #94a3b8;
        }

        /* Login Panel */
        .login-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        }

        .login-card {
            width: 100%;
            max-width: 420px;
            background: rgba(30, 41, 59, 0.8);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .form-title {
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
            font-weight: 700;
            color: white;
            text-align: center;
        }

        .form-subtitle {
            margin: 0 0 2rem 0;
            font-size: 0.875rem;
            color: #94a3b8;
            text-align: center;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: #e2e8f0;
        }

        :host ::ng-deep .p-inputgroup {
            .p-inputgroup-addon {
                background: rgba(15, 23, 42, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-right: none;
                color: #64748b;
            }

            .p-inputtext {
                background: rgba(15, 23, 42, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
                padding: 0.875rem 1rem;

                &::placeholder {
                    color: #64748b;
                }

                &:focus {
                    border-color: #3B82F6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                }
            }
        }

        :host ::ng-deep .p-password {
            width: 100%;

            .p-inputtext {
                width: 100%;
                background: rgba(15, 23, 42, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
                padding: 0.875rem 1rem;

                &::placeholder {
                    color: #64748b;
                }

                &:focus {
                    border-color: #3B82F6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                }
            }

            .p-password-toggle-icon {
                color: #64748b;
            }
        }

        .form-options {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .remember-me {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .remember-me label {
            font-size: 0.875rem;
            color: #94a3b8;
            cursor: pointer;
        }

        :host ::ng-deep .p-checkbox .p-checkbox-box {
            background: rgba(15, 23, 42, 0.8);
            border-color: rgba(255, 255, 255, 0.1);

            &.p-highlight {
                background: #3B82F6;
                border-color: #3B82F6;
            }
        }

        .login-btn {
            width: 100%;
            padding: 0.875rem 1.5rem;
            font-size: 1rem;
            font-weight: 600;
            border: none;
            border-radius: 12px;
            background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(59, 130, 246, 0.4);
            }

            &:active {
                transform: translateY(0);
            }
        }

        .login-footer {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        }

        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #94a3b8;
            font-size: 0.875rem;
            text-decoration: none;
            transition: color 0.3s ease;

            &:hover {
                color: #3B82F6;
            }
        }

        .bottom-info {
            margin-top: 2rem;
            text-align: center;
        }

        .bottom-info p {
            margin: 0;
            font-size: 0.75rem;
            color: #64748b;
        }

        /* Responsive */
        @media (max-width: 1024px) {
            .branding-panel {
                display: none;
            }

            .login-panel {
                flex: 1;
            }
        }

        @media (max-width: 480px) {
            .login-card {
                padding: 1.5rem;
            }

            .logo-text {
                font-size: 1.75rem;
            }

            .tab-btn span {
                display: none;
            }

            .tab-btn i {
                font-size: 1.25rem;
            }
        }
    `]
})
export class ProductionLoginComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    username = '';
    password = '';
    rememberMe = false;
    isLoading = false;
    currentYear = new Date().getFullYear();

    constructor(
        private router: Router,
        private messageService: MessageService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        // Check if already authenticated
        if (this.authService.isAuthenticated()) {
            const user = this.authService.getCurrentUser();
            if (user && this.hasProductionAccess(user)) {
                this.router.navigate(['/dms-production/dashboard']);
            }
        }

        // Load remembered username
        const savedUsername = localStorage.getItem('production_username');
        if (savedUsername) {
            this.username = savedUsername;
            this.rememberMe = true;
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private hasProductionAccess(user: any): boolean {
        if (user.position === 'admin') return true;
        return user.dms_production === true;
    }

    onLogin(): void {
        if (!this.username || !this.password) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Attention',
                detail: 'Veuillez entrer votre identifiant et mot de passe'
            });
            return;
        }

        this.isLoading = true;

        // Save username if remember me is checked
        if (this.rememberMe) {
            localStorage.setItem('production_username', this.username);
        } else {
            localStorage.removeItem('production_username');
        }

        this.authService.login({ username: this.username, password: this.password }).subscribe({
            next: () => {
                this.authService.getUserProfile().subscribe({
                    next: (user) => {
                        this.handleSuccessfulLogin(user);
                    },
                    error: () => {
                        const user = this.authService.getCurrentUser();
                        if (user) {
                            this.handleSuccessfulLogin(user);
                        } else {
                            this.isLoading = false;
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erreur',
                                detail: 'Impossible de récupérer le profil utilisateur'
                            });
                        }
                    }
                });
            },
            error: (error) => {
                this.isLoading = false;
                console.error('Login error:', error);

                let errorMessage = 'Échec de l\'authentification. Vérifiez vos identifiants.';
                if (error.status === 401) {
                    errorMessage = 'Identifiant ou mot de passe incorrect.';
                } else if (error.status === 0) {
                    errorMessage = 'Impossible de se connecter au serveur.';
                } else if (error.error?.detail) {
                    errorMessage = error.error.detail;
                }

                this.messageService.add({
                    severity: 'error',
                    summary: 'Connexion échouée',
                    detail: errorMessage
                });
            }
        });
    }

    private handleSuccessfulLogin(user: any): void {
        // Store user
        this.authService.setUser(user);

        // Check production access
        if (!this.hasProductionAccess(user)) {
            this.isLoading = false;
            this.messageService.add({
                severity: 'warn',
                summary: 'Accès restreint',
                detail: 'Vous n\'avez pas accès au module Production.'
            });
            setTimeout(() => {
                this.router.navigate(['/dms-home']);
            }, 2000);
            return;
        }

        // Store session for backward compatibility
        sessionStorage.setItem('dms_user', JSON.stringify({
            employeeId: user.employee || user.id,
            username: user.username,
            role: user.position || 'operator',
            loginTime: new Date().toISOString()
        }));

        this.messageService.add({
            severity: 'success',
            summary: 'Bienvenue',
            detail: `Connexion réussie ! Bienvenue ${user.first_name || user.name || user.username}`
        });

        setTimeout(() => {
            this.isLoading = false;
            this.router.navigate(['/dms-production/dashboard']);
        }, 1000);
    }
}
