# CLAUDE-DMS-PRODUCTION.md - Application DMS Production Séparée

## 🎯 Vue d'Ensemble du Système DMS Modulaire

### Architecture Multi-Applications

Le système DMS (Digital Manufacturing System) est divisé en **applications indépendantes** :

```
Écosystème DMS
├── 🏭 DMS-Production     ← À GÉNÉRER EN PRIORITÉ
├── 👥 DMS-RH             ← Phase 2
├── 📦 DMS-Inventory      ← Phase 3
├── ✅ DMS-Quality        ← Phase 4
├── 🔧 DMS-Maintenance    ← Phase 5
├── 📊 DMS-KPI            ← Phase 6
└── 🔐 DMS-Auth (Central) ← Service d'authentification partagé
```

### Avantages de la Séparation

✅ **Développement parallèle** - Équipes différentes sur chaque module
✅ **Déploiement indépendant** - Mise à jour sans impacter les autres
✅ **Sécurité renforcée** - Accès contrôlé par application
✅ **Performance optimisée** - Chargement uniquement du nécessaire
✅ **Maintenance simplifiée** - Code isolé par domaine métier

## 📱 APPLICATION 1: DMS-Production (PRIORITÉ)

### 🎯 Périmètre Fonctionnel

**Module**: DMS-Production  
**Objectif**: Monitoring et gestion de la production en temps réel  
**Périmètre**:
- ✅ Dashboard production temps réel
- ✅ Shift management (Morning/Evening/Night)
- ✅ Hourly production tracking
- ✅ Output / Target / Efficiency
- ✅ Workstation assignment
- ✅ Employee assignment to workstations
- ✅ Downtime tracking et tickets
- ✅ Real-time monitoring (auto-refresh 5s)
- ✅ Production reports

**Hors Périmètre** (autres applications):
- ❌ Gestion employés complète → DMS-RH
- ❌ Gestion stock/inventaire → DMS-Inventory
- ❌ Gestion défauts/qualité → DMS-Quality
- ❌ Maintenance préventive → DMS-Maintenance
- ❌ KPIs avancés → DMS-KPI

## 👥 Acteurs et Rôles (DMS-Production)

### Définition des Rôles

```typescript
export enum UserRole {
  // Niveau 1 - Opérateurs
  OPERATOR = 'OPERATOR',                    // Opérateur de production
  
  // Niveau 2 - Supervision
  LINE_LEADER = 'LINE_LEADER',              // Chef d'équipe / Line Leader
  TEAM_LEADER = 'TEAM_LEADER',              // Team Leader
  
  // Niveau 3 - Management
  PRODUCTION_SUPERVISOR = 'PRODUCTION_SUPERVISOR',  // Superviseur production
  PRODUCTION_MANAGER = 'PRODUCTION_MANAGER',        // Manager production
  
  // Niveau 4 - Support
  QUALITY_AGENT = 'QUALITY_AGENT',          // Agent qualité (lecture seule)
  MAINTENANCE_TECH = 'MAINTENANCE_TECH',    // Technicien maintenance (tickets DT)
  
  // Niveau 5 - Administration
  ADMIN = 'ADMIN',                          // Administrateur système
  SUPER_ADMIN = 'SUPER_ADMIN'              // Super administrateur
}
```

### Matrice des Permissions

| Fonctionnalité | Operator | Line Leader | Team Leader | Prod Supervisor | Prod Manager | Admin |
|----------------|----------|-------------|-------------|-----------------|--------------|-------|
| **Dashboard**
| Voir Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voir toutes lignes | ❌ | ✅ (sa ligne) | ✅ (son équipe) | ✅ | ✅ | ✅ |
| **Production Tracking**
| Saisir output | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modifier output | ❌ | ✅ (2h max) | ✅ (4h max) | ✅ (shift) | ✅ | ✅ |
| Supprimer output | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Team Assignment**
| Voir équipe | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assigner employés | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Retirer employés | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Downtime**
| Créer ticket | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modifier ticket | ❌ | ✅ (ses tickets) | ✅ | ✅ | ✅ | ✅ |
| Clôturer ticket | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Reports**
| Voir rapports | ❌ | ✅ (sa ligne) | ✅ (son équipe) | ✅ | ✅ | ✅ |
| Exporter données | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Configuration**
| Gérer utilisateurs | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Configurer système | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Règles de Visibilité des Données

```typescript
// Operator
- Voit : Sa ligne de production uniquement
- Dashboard : Sa ligne seulement

// Line Leader
- Voit : Sa ligne de production
- Dashboard : Sa ligne avec détails complets
- Peut modifier : Dernières 2 heures

// Team Leader
- Voit : Toutes les lignes de son équipe
- Dashboard : Vue équipe complète
- Peut modifier : Dernières 4 heures

// Production Supervisor
- Voit : Toutes les lignes de production
- Dashboard : Vue globale
- Peut modifier : Shift complet

// Production Manager
- Voit : Tout
- Dashboard : Vue globale + analytics
- Peut tout modifier
- Accès aux exports et rapports avancés

// Admin
- Accès total
- Configuration système
- Gestion utilisateurs
```

## 🏗️ Architecture DMS-Production

### Stack Technique

```
Frontend:  Angular v19
UI:        PrimeNG v19
Template:  Sakai (simplifié)
Auth:      JWT + Role-Based Access Control (RBAC)
State:     Services + BehaviorSubject
HTTP:      Interceptors (Auth + Error)
Backend:   REST API (SQL Server)
```

### Structure du Projet

```
dms-production/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/
│   │   │   │   ├── user.model.ts           # User + Role
│   │   │   │   ├── production.model.ts
│   │   │   │   ├── shift.model.ts
│   │   │   │   ├── downtime.model.ts
│   │   │   │   └── permissions.model.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts         # Authentification
│   │   │   │   ├── permission.service.ts   # Gestion permissions
│   │   │   │   ├── production.service.ts
│   │   │   │   └── api.service.ts
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts           # Vérif authentification
│   │   │   │   └── role.guard.ts           # Vérif rôle
│   │   │   └── interceptors/
│   │   │       ├── auth.interceptor.ts     # Ajout JWT token
│   │   │       └── error.interceptor.ts
│   │   │
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── unauthorized/          # Page 403
│   │   │   │   └── access-denied/
│   │   │   └── directives/
│   │   │       ├── has-permission.directive.ts
│   │   │       └── has-role.directive.ts
│   │   │
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   └── login.component.html
│   │   │   │   └── auth.module.ts
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.service.ts
│   │   │   │   └── components/
│   │   │   │       ├── kpi-card/
│   │   │   │       └── production-line-card/
│   │   │   │
│   │   │   ├── production/
│   │   │   │   ├── production.component.ts
│   │   │   │   ├── production.service.ts
│   │   │   │   └── components/
│   │   │   │       ├── shift-form/
│   │   │   │       ├── output-tracker/
│   │   │   │       ├── team-assignment/
│   │   │   │       └── downtime-tracker/
│   │   │   │
│   │   │   └── reports/
│   │   │       ├── reports.component.ts
│   │   │       └── reports.service.ts
│   │   │
│   │   ├── layout/
│   │   │   ├── app.layout.component.ts
│   │   │   ├── app.sidebar.component.ts
│   │   │   └── app.topbar.component.ts
│   │   │
│   │   └── app-routing.module.ts
│   │
│   ├── assets/
│   └── environments/
│       ├── environment.ts
│       └── environment.prod.ts
│
└── package.json
```

## 🔐 Système d'Authentification et Permissions

### 1. Models

```typescript
// src/app/core/models/user.model.ts
export interface User {
  Id_User: number;
  Name_User: string;
  Login_User: string;
  Position_User: string;
  Id_Emp: number;
  departmentID: number;
  roles: UserRole[];
  permissions: Permission[];
  Status: 'active' | 'inactive';
  lastLogin?: Date;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

// src/app/core/models/permissions.model.ts
export interface Permission {
  resource: string;      // 'dashboard', 'production', 'downtime', etc.
  action: PermissionAction;
  conditions?: any;      // Conditions supplémentaires
}

export enum PermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export'
}

// Permissions par rôle
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OPERATOR]: [
    { resource: 'dashboard', action: PermissionAction.VIEW },
    { resource: 'production', action: PermissionAction.VIEW },
    { resource: 'production', action: PermissionAction.CREATE },
    { resource: 'downtime', action: PermissionAction.CREATE }
  ],
  [UserRole.LINE_LEADER]: [
    { resource: 'dashboard', action: PermissionAction.VIEW },
    { resource: 'production', action: PermissionAction.VIEW },
    { resource: 'production', action: PermissionAction.CREATE },
    { resource: 'production', action: PermissionAction.UPDATE },
    { resource: 'team', action: PermissionAction.VIEW },
    { resource: 'team', action: PermissionAction.UPDATE },
    { resource: 'downtime', action: PermissionAction.CREATE },
    { resource: 'downtime', action: PermissionAction.UPDATE },
    { resource: 'reports', action: PermissionAction.VIEW }
  ],
  // ... autres rôles
};
```

### 2. Auth Service

```typescript
// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User, AuthResponse, UserRole } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private apiUrl = 'http://localhost:5000/api/auth';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      username,
      password
    }).pipe(
      tap(response => {
        this.setSession(response);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Vérifier si le token est expiré
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('refreshToken', authResult.refreshToken);
    localStorage.setItem('user', JSON.stringify(authResult.user));
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Error loading user from storage', e);
      }
    }
  }
}
```

### 3. Permission Service

```typescript
// src/app/core/services/permission.service.ts
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Permission, PermissionAction, ROLE_PERMISSIONS } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  constructor(private authService: AuthService) {}

  hasPermission(resource: string, action: PermissionAction): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    // Admin a tous les droits
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')) {
      return true;
    }

    // Vérifier les permissions du rôle
    const permissions = this.getUserPermissions();
    return permissions.some(p => 
      p.resource === resource && p.action === action
    );
  }

  canViewDashboard(): boolean {
    return this.hasPermission('dashboard', PermissionAction.VIEW);
  }

  canCreateProduction(): boolean {
    return this.hasPermission('production', PermissionAction.CREATE);
  }

  canUpdateProduction(hoursAgo: number = 0): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    // Line Leader : 2 heures max
    if (user.roles.includes('LINE_LEADER') && hoursAgo > 2) {
      return false;
    }

    // Team Leader : 4 heures max
    if (user.roles.includes('TEAM_LEADER') && hoursAgo > 4) {
      return false;
    }

    return this.hasPermission('production', PermissionAction.UPDATE);
  }

  canDeleteProduction(): boolean {
    return this.hasPermission('production', PermissionAction.DELETE);
  }

  canManageTeam(): boolean {
    return this.hasPermission('team', PermissionAction.UPDATE);
  }

  canCreateDowntime(): boolean {
    return this.hasPermission('downtime', PermissionAction.CREATE);
  }

  canExportReports(): boolean {
    return this.hasPermission('reports', PermissionAction.EXPORT);
  }

  private getUserPermissions(): Permission[] {
    const user = this.authService.getCurrentUser();
    if (!user || !user.roles) return [];

    // Combiner les permissions de tous les rôles de l'utilisateur
    return user.roles.flatMap(role => ROLE_PERMISSIONS[role] || []);
  }
}
```

### 4. Guards

```typescript
// src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}

// src/app/core/guards/role.guard.ts
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowedRoles = route.data['roles'] as UserRole[];
    
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    if (this.authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    this.router.navigate(['/unauthorized']);
    return false;
  }
}
```

### 5. Directives

```typescript
// src/app/shared/directives/has-permission.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { PermissionService } from '@core/services/permission.service';
import { PermissionAction } from '@core/models';

@Directive({
  selector: '[appHasPermission]'
})
export class HasPermissionDirective implements OnInit {
  @Input() appHasPermission!: { resource: string; action: PermissionAction };

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    if (this.permissionService.hasPermission(
      this.appHasPermission.resource,
      this.appHasPermission.action
    )) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

// src/app/shared/directives/has-role.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@core/models';

@Directive({
  selector: '[appHasRole]'
})
export class HasRoleDirective implements OnInit {
  @Input() appHasRole!: UserRole | UserRole[];

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const roles = Array.isArray(this.appHasRole) ? this.appHasRole : [this.appHasRole];
    
    if (this.authService.hasAnyRole(roles)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
```

### 6. Interceptors

```typescript
// src/app/core/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');
    
    if (token) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(cloned);
    }
    
    return next.handle(req);
  }
}
```

## 🎨 Composants UI avec Permissions

### 1. Login Component

```typescript
// src/app/features/auth/login/login.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  providers: [MessageService]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Login successful'
        });
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid credentials'
        });
      }
    });
  }
}
```

```html
<!-- src/app/features/auth/login/login.component.html -->
<div class="login-container flex align-items-center justify-content-center" style="height: 100vh;">
  <p-card styleClass="login-card" style="width: 400px;">
    <ng-template pTemplate="header">
      <div class="text-center p-4">
        <i class="pi pi-chart-line text-6xl text-primary mb-3"></i>
        <h2 class="m-0">DMS Production</h2>
        <p class="text-600">Sign in to your account</p>
      </div>
    </ng-template>

    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <div class="field">
        <label for="username">Username</label>
        <input 
          pInputText 
          id="username" 
          formControlName="username"
          class="w-full"
          placeholder="Enter your username">
      </div>

      <div class="field">
        <label for="password">Password</label>
        <p-password 
          formControlName="password"
          [toggleMask]="true"
          [feedback]="false"
          styleClass="w-full"
          inputStyleClass="w-full"
          placeholder="Enter your password">
        </p-password>
      </div>

      <p-button 
        label="Sign In" 
        type="submit"
        [loading]="isLoading"
        styleClass="w-full"
        [disabled]="loginForm.invalid">
      </p-button>
    </form>
  </p-card>
</div>

<p-toast></p-toast>
```

### 2. Dashboard avec Permissions

```html
<!-- src/app/features/dashboard/dashboard.component.html -->
<div class="grid">
  <!-- KPI Cards - Visible par tous -->
  <div class="col-12 lg:col-3" *ngFor="let kpi of kpis">
    <p-card [ngClass]="'kpi-card kpi-' + kpi.status">
      <div class="flex justify-content-between align-items-start mb-2">
        <span class="text-sm font-medium text-600">{{ kpi.label }}</span>
        <i [class]="kpi.icon + ' text-2xl'"></i>
      </div>
      <div class="flex align-items-baseline gap-2 mb-2">
        <span class="text-4xl font-bold">{{ kpi.value }}</span>
        <span class="text-xl text-600">{{ kpi.unit }}</span>
      </div>
      <div class="flex justify-content-between">
        <span class="text-sm text-600">Target: {{ kpi.target }}{{ kpi.unit }}</span>
        <p-tag [severity]="kpi.trend > 0 ? 'danger' : 'success'"
               [value]="(kpi.trend > 0 ? '+' : '') + kpi.trend + '%'"></p-tag>
      </div>
    </p-card>
  </div>

  <!-- Production Lines - Filtré selon le rôle -->
  <div class="col-12">
    <p-card>
      <ng-template pTemplate="header">
        <div class="px-3 py-2 flex justify-content-between align-items-center">
          <h2 class="text-xl font-semibold m-0">Production Lines Status</h2>
          
          <!-- Bouton export - Visible uniquement pour TL et supérieur -->
          <p-button 
            *appHasRole="['TEAM_LEADER', 'PRODUCTION_SUPERVISOR', 'PRODUCTION_MANAGER', 'ADMIN']"
            label="Export" 
            icon="pi pi-download"
            styleClass="p-button-outlined"
            (click)="exportData()">
          </p-button>
        </div>
      </ng-template>

      <p-table [value]="productionLines" [loading]="isLoading">
        <ng-template pTemplate="header">
          <tr>
            <th>Production Line</th>
            <th>Project</th>
            <th>Status</th>
            <th class="text-center">Efficiency</th>
            <th class="text-center">Output/Target</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-line>
          <tr style="cursor: pointer;" (click)="navigateToLine(line)">
            <td><div class="font-semibold">{{ line.name }}</div></td>
            <td><div class="text-sm text-600">{{ line.project }}</div></td>
            <td><p-tag [value]="line.status" [severity]="getStatusSeverity(line.status)"></p-tag></td>
            <td class="text-center">
              <div class="text-2xl font-bold">{{ line.efficiency }}%</div>
            </td>
            <td class="text-center">
              <div class="text-2xl font-bold">{{ line.output }}/{{ line.target }}</div>
            </td>
            <td><i class="pi pi-chevron-right"></i></td>
          </tr>
        </ng-template>
      </p-table>
    </p-card>
  </div>
</div>
```

### 3. Production Component avec Permissions

```html
<!-- src/app/features/production/production.component.html -->
<p-card>
  <h2>Hourly Production Tracking</h2>
  
  <!-- Formulaire Shift - Visible par tous -->
  <form [formGroup]="shiftForm" class="grid p-fluid mb-4">
    <!-- ... champs du formulaire ... -->
  </form>

  <!-- Output Section -->
  <div class="grid">
    <div class="col-12 md:col-6">
      <label>Output</label>
      <p-inputNumber 
        [(ngModel)]="output"
        [showButtons]="true"
        [disabled]="!canCreateProduction()">
      </p-inputNumber>
    </div>
    <div class="col-12 md:col-6 flex align-items-end gap-2">
      <!-- Bouton Save - Tout le monde peut créer -->
      <p-button 
        label="Save Output"
        icon="pi pi-save"
        (click)="saveOutput()"
        [disabled]="!canCreateProduction()">
      </p-button>
      
      <!-- Bouton Delete - Uniquement superviseur et supérieur -->
      <p-button 
        *appHasRole="['PRODUCTION_SUPERVISOR', 'PRODUCTION_MANAGER', 'ADMIN']"
        label="Delete"
        icon="pi pi-trash"
        severity="danger"
        (click)="deleteOutput()">
      </p-button>
    </div>
  </div>
</p-card>

<!-- Team Assignment - Uniquement Line Leader et supérieur -->
<p-card *appHasRole="['LINE_LEADER', 'TEAM_LEADER', 'PRODUCTION_SUPERVISOR', 'PRODUCTION_MANAGER', 'ADMIN']">
  <h2>Team Assignment</h2>
  
  <div class="grid mb-3">
    <div class="col-12 md:col-6">
      <label>Scan Employee ID</label>
      <input pInputText [(ngModel)]="employeeId" placeholder="Scan badge">
    </div>
    <div class="col-12 md:col-4">
      <label>Workstation</label>
      <p-dropdown [options]="workstations" [(ngModel)]="selectedWorkstation"></p-dropdown>
    </div>
    <div class="col-12 md:col-2 flex align-items-end">
      <p-button label="Add" icon="pi pi-plus" (click)="assignEmployee()"></p-button>
    </div>
  </div>

  <p-table [value]="assignedEmployees">
    <!-- Table des employés assignés -->
  </p-table>
</p-card>

<!-- Downtime Tracking - Visible par tous, création autorisée -->
<p-card>
  <h2>Downtime Tracking</h2>
  
  <div class="flex gap-2 mb-3">
    <p-button 
      label="Create Ticket" 
      icon="pi pi-plus"
      (click)="openDowntimeDialog()"
      [disabled]="!canCreateDowntime()">
    </p-button>
  </div>
  
  <!-- Liste des downtimes -->
  <p-table [value]="downtimes">
    <ng-template pTemplate="body" let-dt>
      <tr>
        <td>{{ dt.id }}</td>
        <td>{{ dt.problem }}</td>
        <td>{{ dt.duration }} min</td>
        <td>
          <!-- Bouton Edit - Selon permissions -->
          <p-button 
            *ngIf="canUpdateDowntime(dt)"
            icon="pi pi-pencil"
            styleClass="p-button-text"
            (click)="editDowntime(dt)">
          </p-button>
        </td>
      </tr>
    </ng-template>
  </p-table>
</p-card>
```

```typescript
// src/app/features/production/production.component.ts (extraits)
export class ProductionComponent {
  constructor(
    private permissionService: PermissionService,
    private authService: AuthService
  ) {}

  canCreateProduction(): boolean {
    return this.permissionService.canCreateProduction();
  }

  canUpdateProduction(createdAt: Date): boolean {
    const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    return this.permissionService.canUpdateProduction(hoursAgo);
  }

  canDeleteProduction(): boolean {
    return this.permissionService.canDeleteProduction();
  }

  canCreateDowntime(): boolean {
    return this.permissionService.canCreateDowntime();
  }

  canUpdateDowntime(downtime: any): boolean {
    const user = this.authService.getCurrentUser();
    
    // Peut modifier ses propres tickets ou si rôle supérieur
    return downtime.createdBy === user?.Id_User ||
           this.permissionService.hasPermission('downtime', PermissionAction.UPDATE);
  }
}
```

## 🛣️ Routing avec Guards

```typescript
// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { RoleGuard } from '@core/guards/role.guard';
import { UserRole } from '@core/models';

const routes: Routes = [
  // Public routes
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  
  // Protected routes
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
        data: { 
          roles: [
            UserRole.OPERATOR,
            UserRole.LINE_LEADER,
            UserRole.TEAM_LEADER,
            UserRole.PRODUCTION_SUPERVISOR,
            UserRole.PRODUCTION_MANAGER,
            UserRole.ADMIN
          ]
        },
        canActivate: [RoleGuard]
      },
      {
        path: 'production',
        loadChildren: () => import('./features/production/production.module').then(m => m.ProductionModule),
        data: { 
          roles: [
            UserRole.OPERATOR,
            UserRole.LINE_LEADER,
            UserRole.TEAM_LEADER,
            UserRole.PRODUCTION_SUPERVISOR,
            UserRole.PRODUCTION_MANAGER,
            UserRole.ADMIN
          ]
        },
        canActivate: [RoleGuard]
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule),
        data: { 
          roles: [
            UserRole.TEAM_LEADER,
            UserRole.PRODUCTION_SUPERVISOR,
            UserRole.PRODUCTION_MANAGER,
            UserRole.ADMIN
          ]
        },
        canActivate: [RoleGuard]
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule),
        data: { 
          roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
        },
        canActivate: [RoleGuard]
      }
    ]
  },
  
  // Error routes
  {
    path: 'unauthorized',
    loadChildren: () => import('./shared/components/unauthorized/unauthorized.module').then(m => m.UnauthorizedModule)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

## 📊 Filtrage des Données selon le Rôle

```typescript
// src/app/features/dashboard/dashboard.service.ts
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    private api: ApiService,
    private authService: AuthService
  ) {}

  getProductionLines(): Observable<any[]> {
    return this.api.get<any[]>('dashboard/production-lines').pipe(
      map(lines => this.filterLinesByRole(lines))
    );
  }

  private filterLinesByRole(lines: any[]): any[] {
    const user = this.authService.getCurrentUser();
    if (!user) return [];

    // Admin et Manager voient tout
    if (user.roles.includes(UserRole.ADMIN) || 
        user.roles.includes(UserRole.SUPER_ADMIN) ||
        user.roles.includes(UserRole.PRODUCTION_MANAGER)) {
      return lines;
    }

    // Supervisor voit toutes les lignes
    if (user.roles.includes(UserRole.PRODUCTION_SUPERVISOR)) {
      return lines;
    }

    // Team Leader voit les lignes de son équipe
    if (user.roles.includes(UserRole.TEAM_LEADER)) {
      return lines.filter(line => this.isLineInUserTeam(line, user));
    }

    // Line Leader voit sa ligne uniquement
    if (user.roles.includes(UserRole.LINE_LEADER)) {
      return lines.filter(line => line.lineLeaderId === user.Id_Emp);
    }

    // Operator voit sa ligne uniquement
    if (user.roles.includes(UserRole.OPERATOR)) {
      return lines.filter(line => this.isUserAssignedToLine(line, user));
    }

    return [];
  }

  private isLineInUserTeam(line: any, user: any): boolean {
    // Logique pour vérifier si la ligne appartient à l'équipe du TL
    return line.teamLeaderId === user.Id_Emp;
  }

  private isUserAssignedToLine(line: any, user: any): boolean {
    // Logique pour vérifier si l'opérateur est assigné à cette ligne
    return line.Id_ProdLine === user.assignedLineId;
  }
}
```

## 🎯 API Endpoints avec Authentification

```typescript
// Backend API Structure (pour référence)

// Auth
POST   /api/auth/login              # Login utilisateur
POST   /api/auth/refresh            # Refresh token
POST   /api/auth/logout             # Logout
GET    /api/auth/me                 # Get current user info

// Dashboard (tous les rôles)
GET    /api/dashboard/kpis          # KPIs (filtrés par rôle)
GET    /api/dashboard/production-lines  # Lignes (filtrées par rôle)

// Production (OPERATOR+)
GET    /api/production/hourly       # Get hourly production
POST   /api/production/hourly       # Create (OPERATOR+)
PUT    /api/production/hourly/:id   # Update (LINE_LEADER+ avec restrictions temps)
DELETE /api/production/hourly/:id   # Delete (SUPERVISOR+)

// Team (LINE_LEADER+)
GET    /api/team/employees          # Get assignable employees
POST   /api/team/assign             # Assign employee to workstation
DELETE /api/team/unassign/:id       # Unassign employee

// Downtime (tous peuvent créer)
GET    /api/downtime                # Get downtimes (filtrés)
POST   /api/downtime                # Create ticket (tous)
PUT    /api/downtime/:id            # Update (LINE_LEADER+ ou créateur)
DELETE /api/downtime/:id            # Delete (SUPERVISOR+)

// Reports (TEAM_LEADER+)
GET    /api/reports/shift           # Shift report
GET    /api/reports/daily           # Daily report
GET    /api/reports/export          # Export data (TEAM_LEADER+)

// Settings (ADMIN uniquement)
GET    /api/settings/users          # Manage users
POST   /api/settings/users          # Create user
PUT    /api/settings/users/:id      # Update user
DELETE /api/settings/users/:id      # Delete user
```

## 📝 Base de Données - Tables Nécessaires

```sql
-- Users et Roles
CREATE TABLE Users_Table (
    Id_User INT PRIMARY KEY IDENTITY,
    Name_User NVARCHAR(100),
    Login_User NVARCHAR(50) UNIQUE,
    Password_User NVARCHAR(255),  -- Hashé
    Position_User NVARCHAR(100),
    Id_Emp INT,  -- Lien avec Employe_Table
    departmentID INT,
    Status NVARCHAR(20) DEFAULT 'active',
    CreatedDate DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME,
    FOREIGN KEY (Id_Emp) REFERENCES Employe_Table(Id_Emp)
);

CREATE TABLE UserRoles (
    Id INT PRIMARY KEY IDENTITY,
    Id_User INT,
    Role NVARCHAR(50),
    AssignedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (Id_User) REFERENCES Users_Table(Id_User)
);

-- Ajouter des champs pour la sécurité
ALTER TABLE Employe_Table ADD assignedLineId INT;
ALTER TABLE Employe_Table ADD TeamLeaderID INT;

ALTER TABLE HourlyProd_Table ADD CreatedBy INT;
ALTER TABLE HourlyProd_Table ADD CreatedDate DATETIME DEFAULT GETDATE();
ALTER TABLE HourlyProd_Table ADD ModifiedBy INT;
ALTER TABLE HourlyProd_Table ADD ModifiedDate DATETIME;

ALTER TABLE Downtime_Table ADD CreatedBy INT;
ALTER TABLE Downtime_Table ADD CreatedDate DATETIME DEFAULT GETDATE();
```

## 🎨 Layout avec User Menu

```html
<!-- src/app/layout/app.topbar.component.html -->
<div class="layout-topbar">
  <div class="layout-topbar-left">
    <h1 class="text-2xl font-bold">DMS Production</h1>
  </div>

  <div class="layout-topbar-right">
    <!-- Shift Info -->
    <div class="mr-4">
      <span class="text-sm text-600">
        <i class="pi pi-clock mr-2"></i>
        Shift: <strong>{{ currentShift }}</strong> • 
        Hour: <strong>{{ currentHour }}</strong>
      </span>
    </div>

    <!-- Live Badge -->
    <p-tag value="Live" severity="success" styleClass="mr-4"></p-tag>

    <!-- User Menu -->
    <p-button 
      icon="pi pi-user" 
      styleClass="p-button-text p-button-rounded"
      (click)="menu.toggle($event)">
    </p-button>
    
    <p-menu #menu [popup]="true" [model]="userMenuItems"></p-menu>
  </div>
</div>
```

```typescript
// src/app/layout/app.topbar.component.ts
export class AppTopbarComponent implements OnInit {
  currentUser: User | null = null;
  userMenuItems: MenuItem[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.buildUserMenu();
    });
  }

  private buildUserMenu(): void {
    this.userMenuItems = [
      {
        label: this.currentUser?.Name_User || 'User',
        items: [
          {
            label: 'Profile',
            icon: 'pi pi-user',
            command: () => this.router.navigate(['/profile'])
          },
          {
            label: 'Settings',
            icon: 'pi pi-cog',
            command: () => this.router.navigate(['/settings']),
            visible: this.authService.hasRole(UserRole.ADMIN)
          },
          {
            separator: true
          },
          {
            label: 'Logout',
            icon: 'pi pi-sign-out',
            command: () => this.logout()
          }
        ]
      }
    ];
  }

  logout(): void {
    this.authService.logout();
  }
}
```

## ✅ Checklist de Génération

### Phase 1: Authentication & Authorization (PRIORITÉ)
- [x] Models (User, Role, Permission)
- [x] Auth Service (login, logout, token management)
- [x] Permission Service (check permissions)
- [x] Guards (auth.guard, role.guard)
- [x] Interceptors (auth.interceptor, error.interceptor)
- [x] Directives (hasPermission, hasRole)
- [x] Login Component
- [x] Unauthorized Component (403)

### Phase 2: Core Structure
- [x] Project structure
- [x] Routing avec guards
- [x] Layout (sidebar, topbar, footer)
- [x] Navigation menu
- [x] User menu avec logout

### Phase 3: Dashboard
- [x] KPI Cards (filtrés par rôle)
- [x] Production Lines Table (filtrée)
- [x] Charts (output, downtime)
- [x] Auto-refresh
- [x] Export button (conditionnel)

### Phase 4: Production Monitoring
- [x] Shift Form
- [x] Output Tracking (permissions)
- [x] Team Assignment (LINE_LEADER+)
- [x] Downtime Tracking
- [x] Edit/Delete avec permissions

### Phase 5: Reports (TEAM_LEADER+)
- [x] Shift Reports
- [x] Daily Reports
- [x] Export functionality

### Phase 6: Settings (ADMIN)
- [x] User Management
- [x] Role Assignment
- [x] System Configuration

## 🚀 Commande de Génération pour Claude Code

```
Génère l'application DMS-Production complète en suivant ce fichier CLAUDE-DMS-PRODUCTION.md.

PRIORITÉS:
1. Système d'authentification complet avec JWT
2. Gestion des rôles et permissions (RBAC)
3. Login component
4. Guards et interceptors
5. Directives hasPermission et hasRole
6. Dashboard avec filtrage par rôle
7. Production component avec permissions conditionnelles
8. Layout avec user menu

RÔLES À IMPLÉMENTER:
- OPERATOR (lecture + création)
- LINE_LEADER (lecture + création + modification 2h)
- TEAM_LEADER (lecture + création + modification 4h + exports)
- PRODUCTION_SUPERVISOR (lecture + création + modification shift)
- PRODUCTION_MANAGER (accès complet + analytics)
- ADMIN (configuration système)

Technologies:
- Angular v19
- PrimeNG v19
- JWT pour l'authentification
- Role-Based Access Control
- Guards et interceptors

Commence par l'authentification et la structure de sécurité, puis le dashboard, puis production monitoring.
```

---

**Cette architecture assure une séparation propre des applications DMS avec un contrôle d'accès granulaire par rôle. L'application DMS-Production est autonome et sécurisée.** 🔐
