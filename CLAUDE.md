# CLAUDE.md - Instructions pour Génération Interface DMS Production

## 📋 Vue d'Ensemble du Projet

**Nom du Projet**: DMS Production (Digital Manufacturing System)  
**Objectif**: Système de monitoring et gestion de production industrielle en temps réel  
**Utilisateurs Cibles**: Managers de production, opérateurs, techniciens de maintenance, équipe qualité

## 🎯 Stack Technique

```
Framework:     Angular v19
UI Library:    PrimeNG v19
Template:      Sakai (Angular + PrimeNG)
Backend:       REST API (SQL Server)
Styling:       SCSS + PrimeFlex
Charts:        Chart.js (via PrimeNG)
Icons:         PrimeIcons
State:         Services avec BehaviorSubject
HTTP:          HttpClient avec Interceptors
```

## 📁 Structure de l'Application à Générer

```
src/app/
├── core/
│   ├── models/
│   │   ├── kpi.model.ts
│   │   ├── production.model.ts
│   │   ├── employee.model.ts
│   │   ├── defect.model.ts
│   │   ├── inventory.model.ts
│   │   └── maintenance.model.ts
│   ├── services/
│   │   ├── api.service.ts           # Service de base HTTP
│   │   ├── auth.service.ts
│   │   └── notification.service.ts
│   ├── guards/
│   │   └── auth.guard.ts
│   └── interceptors/
│       └── auth.interceptor.ts
│
├── shared/
│   ├── components/
│   │   ├── loading-spinner/
│   │   ├── confirmation-dialog/
│   │   └── error-message/
│   ├── directives/
│   └── pipes/
│       └── safe-html.pipe.ts
│
├── features/
│   ├── dashboard/
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.component.html
│   │   ├── dashboard.component.scss
│   │   ├── dashboard.service.ts
│   │   └── components/
│   │       ├── kpi-card/
│   │       └── production-line-card/
│   │
│   ├── production/
│   │   ├── production.component.ts
│   │   ├── production.component.html
│   │   ├── production.component.scss
│   │   ├── production.service.ts
│   │   └── components/
│   │       ├── shift-form/
│   │       ├── output-tracker/
│   │       ├── team-assignment/
│   │       └── downtime-tracker/
│   │
│   ├── inventory/
│   │   ├── inventory.component.ts
│   │   ├── inventory.service.ts
│   │   └── components/
│   │       ├── parts-list/
│   │       ├── stock-entry/
│   │       └── location-manager/
│   │
│   ├── hr/
│   │   ├── hr.component.ts
│   │   ├── hr.service.ts
│   │   └── components/
│   │       ├── employee-list/
│   │       ├── qualification-matrix/
│   │       └── attendance-tracker/
│   │
│   ├── quality/
│   │   ├── quality.component.ts
│   │   ├── quality.service.ts
│   │   └── components/
│   │       ├── defect-entry/
│   │       ├── defect-list/
│   │       └── quality-charts/
│   │
│   ├── maintenance/
│   │   ├── maintenance.component.ts
│   │   ├── maintenance.service.ts
│   │   └── components/
│   │       ├── downtime-list/
│   │       ├── ticket-form/
│   │       └── maintenance-calendar/
│   │
│   ├── kpi/
│   │   ├── kpi.component.ts
│   │   ├── kpi.service.ts
│   │   └── components/
│   │       ├── indicator-card/
│   │       ├── monthly-input/
│   │       └── action-plan/
│   │
│   └── lessons/
│       ├── lessons.component.ts
│       ├── lessons.service.ts
│       └── components/
│           ├── lesson-card/
│           ├── lesson-form/
│           └── action-tracker/
│
├── layout/
│   ├── app.layout.component.ts
│   ├── app.layout.component.html
│   ├── app.sidebar.component.ts
│   ├── app.sidebar.component.html
│   ├── app.topbar.component.ts
│   ├── app.topbar.component.html
│   ├── app.menu.component.ts
│   └── app.menu.service.ts
│
└── app-routing.module.ts
```

## 🎨 Design System à Respecter

### Couleurs (Variables CSS à définir)

```scss
// src/assets/layout/styles/theme/custom-theme.scss

:root {
  // Primary Colors
  --primary-color: #2563EB;
  --primary-dark-color: #1E40AF;
  --primary-light-color: #3B82F6;
  
  // Status Colors
  --success-color: #10B981;
  --success-light: #D1FAE5;
  --success-dark: #047857;
  
  --warning-color: #F59E0B;
  --warning-light: #FEF3C7;
  --warning-dark: #D97706;
  
  --danger-color: #EF4444;
  --danger-light: #FEE2E2;
  --danger-dark: #DC2626;
  
  // Neutral Grays
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;
  
  // Surface Colors
  --surface-0: #ffffff;
  --surface-50: #F9FAFB;
  --surface-100: #F3F4F6;
  
  // Text Colors
  --text-color: #374151;
  --text-color-secondary: #6B7280;
  
  // Section Colors
  --hr-color: #8B5CF6;
  --maintenance-color: #06B6D4;
  --kpi-color: #EC4899;
  --lessons-color: #F97316;
  --transport-color: #14B8A6;
}
```

### Spacing System (4px base)

```scss
$spacing-xs: 4px;   // 0.25rem
$spacing-sm: 8px;   // 0.5rem
$spacing-md: 16px;  // 1rem
$spacing-lg: 24px;  // 1.5rem
$spacing-xl: 32px;  // 2rem
$spacing-2xl: 48px; // 3rem
```

### Typography

```scss
// Font Sizes
$font-xs: 10px;   // 0.625rem
$font-sm: 12px;   // 0.75rem
$font-base: 14px; // 0.875rem
$font-lg: 16px;   // 1rem
$font-xl: 18px;   // 1.125rem
$font-2xl: 20px;  // 1.25rem
$font-3xl: 24px;  // 1.5rem
$font-4xl: 30px;  // 1.875rem

// Font Weights
$font-regular: 400;
$font-medium: 500;
$font-semibold: 600;
$font-bold: 700;
```

## 🗄️ Modèles de Données TypeScript

### Interfaces Principales à Créer

```typescript
// src/app/core/models/kpi.model.ts
export interface KPI {
  label: string;
  value: number;
  target: number;
  unit: string;
  trend: number;
  status: 'success' | 'warning' | 'danger';
  icon: string;
}

// src/app/core/models/production.model.ts
export interface ProductionLine {
  id: number;
  name: string;
  project: string;
  projectId: number;
  status: 'running' | 'downtime' | 'setup';
  efficiency: number;
  output: number;
  target: number;
}

export interface HourlyProduction {
  Id_HourlyProd: number;
  Date_HourlyProd: Date;
  Shift_HourlyProd: string;
  Hour_HourlyProd: number;
  Id_Part: number;
  Result_HourlyProdPN: number;
  Target_HourlyProdPN: number;
  HC_HourlyProdPN: number;
  Id_ProdLine: number;
}

export interface Part {
  Id_Part: number;
  PN_Part: string;
  Id_Project: number;
  ShiftTarget_Part: number;
  Price_Part: number;
  Efficiency: number;
  MATSTATUS: string;
}

export interface Downtime {
  Id_Downtime: number;
  Total_Downtime: number;
  Comment_Downtime: string;
  Id_HourlyProd: number;
  Id_DowntimeProblems: number;
}

export interface DowntimeProblem {
  Id_DowntimeProblems: number;
  Name_DowntimeProblems: string;
}

// src/app/core/models/employee.model.ts
export interface Employee {
  Id_Emp: number;
  Nom_Emp: string;
  Prenom_Emp: string;
  DateNaissance_Emp: Date;
  Genre_Emp: string;
  Categorie_Emp: string;
  DateEmbauche_Emp: Date;
  Departement_Emp: string;
  Picture: string;
  EmpStatus: string;
  TeamLeaderID?: number;
}

export interface Qualification {
  id_qualif: number;
  start_qualif: Date;
  end_qualif: Date;
  id_formation: number;
  test_result: string;
  Id_Emp: number;
  Trainer: string;
  Id_Project: number;
}

export interface Formation {
  id_formation: number;
  name_formation: string;
  type_formation: string;
  id_process: number;
}

// src/app/core/models/defect.model.ts
export interface Defect {
  id_defect: number;
  qty_defect: number;
  id_worksation: number;
  Id_DefectList: number;
  Id_HourlyProd: number;
  datedefect: Date;
}

export interface DefectList {
  Id_DefectList: number;
  Code_Defect: string;
  Description_Defect: string;
  id_worksation: number;
}

// src/app/core/models/inventory.model.ts
export interface InventoryItem {
  PN: string;
  PNDESC: string;
  UNIT: string;
  TOTALSTOCK: number;
  PRICE: number;
}

export interface DataEntry {
  SN: string;
  PN: string;
  BATCHNO: string;
  SUNO: string;
  QTY: number;
  COMMENT: string;
  DATEENTRY: Date;
  AREA: string;
  USERID: string;
}

// src/app/core/models/maintenance.model.ts
export interface MaintenanceDowntime {
  DowntimeID: number;
  DateTimeDT: Date;
  WorkstationDT: string;
  DowntimeStart: Date;
  StartIntervention: Date;
  EndIntervention: Date;
  MaintUserID: number;
  DowntimeStatus: string;
  CauseDT: string;
  ActionsMaint: string;
}
```

## 🚀 Composants Prioritaires à Générer

### 1. Dashboard Component (PRIORITÉ HAUTE)

**Fichier**: `src/app/features/dashboard/dashboard.component.ts`

**Fonctionnalités**:
- Affichage 4 KPI cards (Output, Efficiency, Scrap, Downtime)
- Table des lignes de production avec statuts
- Chart Output/Hour (bar chart)
- Chart Downtime Analysis (horizontal bar chart)
- Auto-refresh toutes les 5 secondes
- Loading states
- Error handling

**Composants PrimeNG**:
- `p-card` pour les KPI cards
- `p-table` pour la liste des lignes de production
- `p-chart` pour les graphiques
- `p-tag` pour les badges de statut
- `p-toast` pour les notifications
- `p-progressSpinner` pour le loading

**Code Template**:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DashboardService } from './dashboard.service';
import { MessageService } from 'primeng/api';
import { KPI, ProductionLine } from '@core/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [MessageService]
})
export class DashboardComponent implements OnInit, OnDestroy {
  kpis: KPI[] = [];
  productionLines: ProductionLine[] = [];
  outputChartData: any;
  downtimeChartData: any;
  chartOptions: any;
  isLoading: boolean = true;
  private refreshSubscription?: Subscription;

  constructor(
    private dashboardService: DashboardService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initChartOptions();
    this.loadDashboardData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  loadDashboardData(): void {
    // Implémenter le chargement des données
  }

  startAutoRefresh(): void {
    this.refreshSubscription = interval(5000)
      .pipe(switchMap(() => this.dashboardService.getKPIs()))
      .subscribe(kpis => {
        this.kpis = kpis;
        this.showRefreshToast();
      });
  }

  showRefreshToast(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Updated',
      life: 1000
    });
  }

  getStatusSeverity(status: string): string {
    const map: any = {
      'running': 'success',
      'downtime': 'danger',
      'setup': 'warning'
    };
    return map[status] || 'info';
  }

  private initChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' }
      },
      scales: { y: { beginAtZero: true } }
    };
  }
}
```

**HTML Template**:

```html
<div class="grid">
  <!-- KPI Cards -->
  <div class="col-12 lg:col-3" *ngFor="let kpi of kpis">
    <p-card styleClass="kpi-card" [ngClass]="'kpi-' + kpi.status">
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

  <!-- Production Lines -->
  <div class="col-12">
    <p-card>
      <ng-template pTemplate="header">
        <div class="px-3 py-2">
          <h2 class="text-xl font-semibold m-0">Production Lines Status</h2>
        </div>
      </ng-template>
      
      <p-table [value]="productionLines" [loading]="isLoading" [rowHover]="true">
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
          <tr style="cursor: pointer;">
            <td><div class="font-semibold">{{ line.name }}</div></td>
            <td><div class="text-sm text-600">{{ line.project }}</div></td>
            <td><p-tag [value]="line.status" [severity]="getStatusSeverity(line.status)"></p-tag></td>
            <td class="text-center">
              <div class="text-2xl font-bold">{{ line.efficiency }}%</div>
              <div class="text-xs text-600">Efficiency</div>
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

  <!-- Charts -->
  <div class="col-12 lg:col-6">
    <p-card>
      <ng-template pTemplate="header">
        <div class="px-3 py-2"><h3>Output / Hour</h3></div>
      </ng-template>
      <div style="height: 300px;">
        <p-chart type="bar" [data]="outputChartData" [options]="chartOptions"></p-chart>
      </div>
    </p-card>
  </div>

  <div class="col-12 lg:col-6">
    <p-card>
      <ng-template pTemplate="header">
        <div class="px-3 py-2"><h3>Downtime Analysis</h3></div>
      </ng-template>
      <div style="height: 300px;">
        <p-chart type="horizontalBar" [data]="downtimeChartData" [options]="chartOptions"></p-chart>
      </div>
    </p-card>
  </div>
</div>

<p-toast position="top-right"></p-toast>
```

### 2. Production Component (PRIORITÉ HAUTE)

**Fonctionnalités**:
- Formulaire de sélection shift/date/project/part
- Tracking output hourly
- Assignment équipe/workstation
- Création tickets downtime
- Display des métriques en temps réel

**Composants PrimeNG**:
- `p-dropdown` pour les sélections
- `p-calendar` pour les dates
- `p-inputNumber` pour les nombres
- `p-autoComplete` pour part numbers
- `p-table` pour la liste des employés assignés
- `p-dialog` pour les formulaires
- `p-button` pour les actions

**Sections du Component**:

```html
<!-- Shift Information Form -->
<p-card>
  <h2>Shift Information</h2>
  <form [formGroup]="shiftForm" class="grid p-fluid">
    <div class="col-12 md:col-4">
      <label>Shift</label>
      <p-dropdown [options]="shifts" formControlName="shift"></p-dropdown>
    </div>
    <div class="col-12 md:col-4">
      <label>Date</label>
      <p-calendar formControlName="date" [showIcon]="true"></p-calendar>
    </div>
    <div class="col-12 md:col-4">
      <label>Project</label>
      <p-dropdown [options]="projects" formControlName="project"></p-dropdown>
    </div>
    <div class="col-12 md:col-4">
      <label>Production Line</label>
      <p-dropdown [options]="productionLines" formControlName="productionLine"></p-dropdown>
    </div>
    <div class="col-12 md:col-4">
      <label>Part Number</label>
      <p-autoComplete formControlName="partNumber" [suggestions]="filteredParts"></p-autoComplete>
    </div>
    <div class="col-12 md:col-4">
      <label>Hour</label>
      <p-dropdown [options]="hours" formControlName="hour"></p-dropdown>
    </div>
  </form>
</p-card>

<!-- Output Metrics -->
<div class="grid">
  <div class="col-12 md:col-3">
    <p-card>
      <h3>Output</h3>
      <p-inputNumber [(ngModel)]="output" [showButtons]="true" [min]="0"></p-inputNumber>
    </p-card>
  </div>
  <div class="col-12 md:col-3">
    <p-card>
      <h3>Target</h3>
      <div class="text-3xl font-bold">{{ target }}</div>
    </p-card>
  </div>
  <div class="col-12 md:col-3">
    <p-card>
      <h3>Efficiency</h3>
      <div class="text-3xl font-bold">{{ efficiency }}%</div>
    </p-card>
  </div>
  <div class="col-12 md:col-3">
    <p-card>
      <p-button label="Dashboard Viewer" icon="pi pi-chart-bar" styleClass="w-full"></p-button>
    </p-card>
  </div>
</div>

<!-- Team Assignment -->
<p-card>
  <h2>Production Team / Workstation</h2>
  <div class="grid mb-3">
    <div class="col-12 md:col-6">
      <label>Scan ID Card</label>
      <input pInputText [(ngModel)]="employeeIdScan" placeholder="Scan employee badge">
    </div>
    <div class="col-12 md:col-4">
      <label>Select Workstation</label>
      <p-dropdown [options]="workstations" [(ngModel)]="selectedWorkstation"></p-dropdown>
    </div>
    <div class="col-12 md:col-2">
      <label>&nbsp;</label>
      <p-button label="Add" icon="pi pi-plus" (click)="addEmployee()"></p-button>
    </div>
  </div>
  
  <p-table [value]="assignedEmployees">
    <ng-template pTemplate="header">
      <tr>
        <th>Photo</th>
        <th>Name</th>
        <th>ID</th>
        <th>Workstation</th>
        <th>Qualification</th>
        <th>Actions</th>
      </tr>
    </ng-template>
    <ng-template pTemplate="body" let-emp>
      <tr>
        <td><img [src]="emp.Picture" width="40" height="40" class="border-circle"></td>
        <td>{{ emp.Nom_Emp }} {{ emp.Prenom_Emp }}</td>
        <td>{{ emp.Id_Emp }}</td>
        <td>{{ emp.workstation }}</td>
        <td>{{ emp.qualification }}</td>
        <td><p-button icon="pi pi-trash" severity="danger" (click)="removeEmployee(emp)"></p-button></td>
      </tr>
    </ng-template>
  </p-table>
</p-card>

<!-- Downtime Tracking -->
<p-card>
  <h2>Downtime / Hour</h2>
  <div class="flex gap-2 mb-3">
    <p-button label="Create Ticket" icon="pi pi-plus" (click)="openDowntimeDialog()"></p-button>
    <p-button label="Confirm Ticket" icon="pi pi-check" severity="success"></p-button>
  </div>
  
  <div class="grid p-fluid">
    <div class="col-12 md:col-6">
      <label>Time/Min</label>
      <p-inputNumber [(ngModel)]="downtimeMinutes" [min]="0"></p-inputNumber>
    </div>
    <div class="col-12 md:col-6">
      <label>Problem</label>
      <p-dropdown [options]="downtimeProblems" [(ngModel)]="selectedProblem"></p-dropdown>
    </div>
    <div class="col-12">
      <label>Action/Comment</label>
      <textarea pInputTextarea [(ngModel)]="downtimeComment" rows="3"></textarea>
    </div>
  </div>
</p-card>
```

### 3. Layout Components

**app.sidebar.component.html**:

```html
<div class="layout-sidebar">
  <!-- Logo -->
  <div class="sidebar-header">
    <a [routerLink]="['/']" class="logo">
      <div class="logo-icon">
        <i class="pi pi-chart-line"></i>
      </div>
      <span class="logo-text" *ngIf="!collapsed">DMS Production</span>
    </a>
    <button class="toggle-btn" (click)="toggleSidebar()">
      <i [class]="collapsed ? 'pi pi-bars' : 'pi pi-times'"></i>
    </button>
  </div>

  <!-- Navigation Menu -->
  <nav class="sidebar-nav">
    <a *ngFor="let item of menuItems" 
       [routerLink]="[item.route]"
       routerLinkActive="active"
       class="nav-item">
      <i [class]="item.icon"></i>
      <span *ngIf="!collapsed">{{ item.label }}</span>
    </a>
  </nav>

  <!-- User Profile -->
  <div class="sidebar-footer">
    <div class="user-profile">
      <div class="user-avatar">
        <img [src]="currentUser.picture" alt="User">
      </div>
      <div *ngIf="!collapsed" class="user-info">
        <div class="user-name">{{ currentUser.name }}</div>
        <div class="user-role">{{ currentUser.role }}</div>
      </div>
    </div>
  </div>
</div>
```

**Menu Items**:

```typescript
menuItems = [
  { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard', color: '#2563EB' },
  { label: 'Production', icon: 'pi pi-bolt', route: '/production', color: '#10B981' },
  { label: 'Inventory', icon: 'pi pi-box', route: '/inventory', color: '#F59E0B' },
  { label: 'HR & Employees', icon: 'pi pi-users', route: '/hr', color: '#8B5CF6' },
  { label: 'Quality & Defects', icon: 'pi pi-exclamation-triangle', route: '/quality', color: '#EF4444' },
  { label: 'Maintenance', icon: 'pi pi-wrench', route: '/maintenance', color: '#06B6D4' },
  { label: 'KPI & Indicators', icon: 'pi pi-chart-bar', route: '/kpi', color: '#EC4899' },
  { label: 'Lessons Learned', icon: 'pi pi-book', route: '/lessons', color: '#F97316' },
  { label: 'Transport', icon: 'pi pi-truck', route: '/transport', color: '#14B8A6' },
  { label: 'Settings', icon: 'pi pi-cog', route: '/settings', color: '#6B7280' }
];
```

## 📦 Services à Générer

### Base API Service

```typescript
// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        httpParams = httpParams.set(key, params[key]);
      });
    }
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { params: httpParams });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`);
  }
}
```

### Dashboard Service

```typescript
// src/app/features/dashboard/dashboard.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { KPI, ProductionLine } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private api: ApiService) {}

  getKPIs(): Observable<KPI[]> {
    return this.api.get<KPI[]>('dashboard/kpis');
  }

  getProductionLines(): Observable<ProductionLine[]> {
    return this.api.get<ProductionLine[]>('dashboard/production-lines');
  }

  getOutputPerHour(): Observable<any> {
    return this.api.get('dashboard/output-hour');
  }

  getDowntimeAnalysis(): Observable<any> {
    return this.api.get('dashboard/downtime-analysis');
  }
}
```

## ⚙️ Configuration

### environment.ts

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```

### app.module.ts Imports

```typescript
// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FileUploadModule } from 'primeng/fileupload';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';
```

## 🎯 Étapes de Génération (Ordre Prioritaire)

### Phase 1: Setup & Foundation (2-3 heures)
1. ✅ Créer la structure de dossiers
2. ✅ Configurer le routing
3. ✅ Setup layout (sidebar, header, footer)
4. ✅ Créer les models TypeScript
5. ✅ Setup services de base (API, auth, notification)
6. ✅ Configurer le thème personnalisé
7. ✅ Setup HTTP interceptors

### Phase 2: Dashboard (2-3 heures)
1. ✅ Créer dashboard component
2. ✅ Implémenter les 4 KPI cards
3. ✅ Créer la table production lines
4. ✅ Implémenter les charts (output, downtime)
5. ✅ Setup auto-refresh
6. ✅ Ajouter loading states et error handling

### Phase 3: Production Monitoring (3-4 heures)
1. ✅ Créer production component
2. ✅ Implémenter shift form
3. ✅ Créer output tracking
4. ✅ Implémenter team assignment
5. ✅ Créer downtime tracking
6. ✅ Setup validation et error handling

### Phase 4: Supporting Modules (4-5 heures chacun)
1. ✅ Inventory management
2. ✅ HR & Employees
3. ✅ Quality & Defects
4. ✅ Maintenance

### Phase 5: Analytics & Reporting (3-4 heures)
1. ✅ KPI & Indicators
2. ✅ Lessons Learned
3. ✅ Advanced charts
4. ✅ Export functionality

## 📝 Checklist des Composants PrimeNG à Utiliser

### Essentiels (À utiliser partout)
- [x] `p-table` - Toutes les listes de données
- [x] `p-card` - Conteneurs principaux
- [x] `p-button` - Tous les boutons
- [x] `p-dropdown` - Sélections simples
- [x] `p-calendar` - Sélection de dates
- [x] `p-inputText` - Champs texte
- [x] `p-inputNumber` - Champs numériques
- [x] `p-toast` - Notifications
- [x] `p-tag` - Badges de statut

### Formulaires
- [x] `p-inputTextarea` - Zones de texte longues
- [x] `p-checkbox` - Cases à cocher
- [x] `p-radioButton` - Boutons radio
- [x] `p-multiSelect` - Sélections multiples
- [x] `p-autoComplete` - Recherche avec suggestions

### Data Display
- [x] `p-chart` - Graphiques (Chart.js)
- [x] `p-dataView` - Affichage en grille
- [x] `p-timeline` - Chronologie
- [x] `p-progressBar` - Barres de progression
- [x] `p-panel` - Panneaux pliables
- [x] `p-accordion` - Accordéons

### Overlays
- [x] `p-dialog` - Modales
- [x] `p-confirmDialog` - Dialogues de confirmation
- [x] `p-sidebar` - Panneau latéral
- [x] `p-menu` - Menus contextuels

### File Upload
- [x] `p-fileUpload` - Upload de fichiers/images

### Autres
- [x] `p-paginator` - Pagination
- [x] `p-progressSpinner` - Spinner de chargement
- [x] `p-badge` - Badges numériques
- [x] `p-avatar` - Avatars utilisateurs

## 🔧 Fonctionnalités Transversales

### 1. Auto-Refresh Système
Implémenter dans tous les composants de monitoring:

```typescript
private refreshInterval$ = interval(5000).pipe(
  switchMap(() => this.service.getData())
).subscribe(data => this.data = data);
```

### 2. Error Handling Global

```typescript
// HTTP Interceptor
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  return next.handle(req).pipe(
    catchError((error: HttpErrorResponse) => {
      this.notificationService.showError(error.message);
      return throwError(() => error);
    })
  );
}
```

### 3. Loading States

Utiliser `p-progressSpinner` partout:

```html
<div *ngIf="isLoading" class="loading-overlay">
  <p-progressSpinner></p-progressSpinner>
</div>

<div *ngIf="!isLoading">
  <!-- Content -->
</div>
```

### 4. Validation Forms

Utiliser Reactive Forms avec validators:

```typescript
this.form = this.fb.group({
  shift: ['', Validators.required],
  date: [new Date(), Validators.required],
  project: [null, Validators.required],
  partNumber: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
  output: [0, [Validators.required, Validators.min(0)]]
});
```

## 📊 API Endpoints (Backend Reference)

```typescript
// Dashboard
GET  /api/dashboard/kpis
GET  /api/dashboard/production-lines
GET  /api/dashboard/output-hour
GET  /api/dashboard/downtime-analysis

// Production
GET  /api/production/hourly?date={date}&shift={shift}
POST /api/production/hourly
PUT  /api/production/hourly/{id}
GET  /api/production/parts
GET  /api/production/projects
GET  /api/production/lines/{projectId}

// Downtime
GET  /api/downtime
POST /api/downtime
PUT  /api/downtime/{id}
GET  /api/downtime/problems

// Employees
GET  /api/employees
GET  /api/employees/{id}
POST /api/employees/{id}/assign
DELETE /api/employees/{id}/unassign

// Quality
GET  /api/defects
POST /api/defects
GET  /api/defects/types

// Inventory
GET  /api/inventory/parts
POST /api/inventory/entry
GET  /api/inventory/locations

// Maintenance
GET  /api/maintenance/downtimes
POST /api/maintenance/downtimes
PUT  /api/maintenance/downtimes/{id}

// KPI
GET  /api/kpi/indicators
POST /api/kpi/monthly-input
GET  /api/kpi/actions

// Lessons
GET  /api/lessons
POST /api/lessons
PUT  /api/lessons/{id}
```

## 🎨 Custom Styles à Ajouter

```scss
// src/assets/layout/styles/custom.scss

.kpi-card {
  border-left: 4px solid;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  }
  
  &.kpi-success {
    border-left-color: var(--success-color);
    background: linear-gradient(135deg, var(--success-light) 0%, #fff 100%);
  }
  
  &.kpi-warning {
    border-left-color: var(--warning-color);
    background: linear-gradient(135deg, var(--warning-light) 0%, #fff 100%);
  }
  
  &.kpi-danger {
    border-left-color: var(--danger-color);
    background: linear-gradient(135deg, var(--danger-light) 0%, #fff 100%);
  }
}

.status-running {
  background-color: var(--success-light);
  color: var(--success-dark);
}

.status-downtime {
  background-color: var(--danger-light);
  color: var(--danger-dark);
}

.status-setup {
  background-color: var(--warning-light);
  color: var(--warning-dark);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
```

## ✅ Critères de Qualité du Code

1. **TypeScript Strict**: Tous les types doivent être définis
2. **Reactive Forms**: Utiliser partout où il y a des formulaires
3. **OnPush Strategy**: Pour optimiser les performances
4. **Lazy Loading**: Pour les modules features
5. **Error Handling**: Try-catch et gestion d'erreurs partout
6. **Loading States**: Afficher des spinners pendant le chargement
7. **Responsive**: Utiliser PrimeFlex grid system
8. **Accessibility**: Labels ARIA, keyboard navigation
9. **Clean Code**: Pas de code dupliqué, fonctions courtes
10. **Comments**: Documenter les fonctions complexes

## 🚀 Commandes de Démarrage

```bash
# Installation
npm install

# Development
ng serve

# Build Production
ng build --configuration production

# Tests
ng test
ng e2e

# Linting
ng lint
```

---

## 📌 INSTRUCTIONS FINALES POUR CLAUDE CODE

**GÉNÈRE L'APPLICATION COMPLÈTE** avec:

1. ✅ Tous les fichiers de structure (modules, routing, services)
2. ✅ Dashboard component fonctionnel avec charts et auto-refresh
3. ✅ Production component avec toutes les sections
4. ✅ Layout complet (sidebar, header, footer)
5. ✅ Tous les models TypeScript
6. ✅ Tous les services avec méthodes API
7. ✅ Configuration thème personnalisé
8. ✅ Routing configuré pour toutes les pages
9. ✅ HTTP interceptors pour auth et error handling
10. ✅ Components PrimeNG configurés et stylisés

**COMMENCE PAR**:
1. La structure de base et le routing
2. Le layout (sidebar + header)
3. Le dashboard
4. Puis les autres modules progressivement

**ASSURE-TOI QUE**:
- Tout le code compile sans erreurs
- Les imports sont corrects
- Les services sont injectés correctement
- Les composants PrimeNG sont bien configurés
- Le thème personnalisé est appliqué
- Le code suit les best practices Angular

Génère le code complet, prêt à être déployé!
