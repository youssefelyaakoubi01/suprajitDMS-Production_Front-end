# PROMPT CONCIS POUR CLAUDE CODE

Génère une application **DMS Production** (Digital Manufacturing System) pour le monitoring de production en temps réel.

## Stack
- **Angular v19**
- **PrimeNG v19**
- **Template Sakai** (Angular + PrimeNG)
- **Backend**: SQL Server (REST API)

## Structure de l'Application

### Layout Principal
```
├── Sidebar gauche (256px) - 10 sections
├── Header (64px) - Titre + Shift Info + Live Badge
└── Content Area - Composants dynamiques
```

### 10 Sections à Créer

1. **Dashboard** - Vue d'ensemble avec KPIs
2. **Production** - Monitoring hourly production
3. **Inventory** - Gestion stock et matériel
4. **HR & Employees** - RH et qualifications
5. **Quality & Defects** - Contrôle qualité
6. **Maintenance** - Gestion maintenance machines
7. **KPI & Indicators** - Indicateurs performance
8. **Lessons Learned** - Base de connaissances
9. **Transport** - Logistique
10. **Settings** - Configuration

## Dashboard (Page Prioritaire)

### Layout
```html
<div class="grid">
  <!-- Row 1: 4 KPI Cards -->
  <div class="col-12 lg:col-3">
    <p-card>
      <h3>Output</h3>
      <div class="text-4xl font-bold">412</div>
      <div class="text-sm">Target: 424 units</div>
      <p-tag severity="warning">-2.8%</p-tag>
    </p-card>
  </div>
  <!-- Répéter pour Efficiency, Scrap, Downtime -->

  <!-- Row 2: Production Lines Table -->
  <div class="col-12">
    <p-card>
      <h2>Production Lines Status</h2>
      <p-table [value]="productionLines">
        <!-- Colonnes: Name, Project, Status, Efficiency, Output/Target -->
      </p-table>
    </p-card>
  </div>

  <!-- Row 3: Charts -->
  <div class="col-12 lg:col-6">
    <p-card>
      <h3>Output / Hour</h3>
      <p-chart type="bar" [data]="outputData"></p-chart>
    </p-card>
  </div>
  <div class="col-12 lg:col-6">
    <p-card>
      <h3>Downtime Analysis</h3>
      <p-chart type="horizontalBar" [data]="downtimeData"></p-chart>
    </p-card>
  </div>
</div>
```

### Service Dashboard
```typescript
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getKPIs(): Observable<KPI[]> {
    return this.http.get<KPI[]>(`${this.apiUrl}/dashboard/kpis`);
  }

  getProductionLines(): Observable<ProductionLine[]> {
    return this.http.get<ProductionLine[]>(`${this.apiUrl}/production/lines`);
  }

  getOutputPerHour(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/output-hour`);
  }
}
```

## Production Monitoring (Page Prioritaire)

### Layout
```html
<p-card>
  <h2>Shift Information</h2>
  <div class="grid p-fluid">
    <div class="col-12 md:col-4">
      <label>Shift</label>
      <p-dropdown [options]="shifts" [(ngModel)]="selectedShift"></p-dropdown>
    </div>
    <div class="col-12 md:col-4">
      <label>Project</label>
      <p-dropdown [options]="projects" [(ngModel)]="selectedProject"></p-dropdown>
    </div>
    <div class="col-12 md:col-4">
      <label>Part Number</label>
      <p-autoComplete [(ngModel)]="selectedPart" [suggestions]="filteredParts"></p-autoComplete>
    </div>
  </div>
</p-card>

<div class="grid">
  <div class="col-12 md:col-3">
    <p-card>
      <h3>Output</h3>
      <p-inputNumber [(ngModel)]="output" [showButtons]="true"></p-inputNumber>
    </p-card>
  </div>
  <div class="col-12 md:col-3">
    <p-card>
      <h3>Target</h3>
      <div class="text-3xl font-bold">{{target}}</div>
    </p-card>
  </div>
  <div class="col-12 md:col-3">
    <p-card>
      <h3>Efficiency</h3>
      <div class="text-3xl font-bold">{{efficiency}}%</div>
    </p-card>
  </div>
</div>

<p-card>
  <h2>Production Team / Workstation</h2>
  <div class="grid">
    <div class="col-12 md:col-6">
      <label>Scan ID Card</label>
      <p-inputText [(ngModel)]="employeeId" placeholder="Scan employee badge"></p-inputText>
    </div>
    <div class="col-12 md:col-6">
      <label>Workstation</label>
      <p-dropdown [options]="workstations" [(ngModel)]="selectedWorkstation"></p-dropdown>
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
        <td><img [src]="emp.picture" width="40" height="40" class="border-circle"></td>
        <td>{{emp.name}}</td>
        <td>{{emp.id}}</td>
        <td>{{emp.workstation}}</td>
        <td>{{emp.qualification}}</td>
        <td>
          <p-button icon="pi pi-trash" severity="danger" (click)="removeEmployee(emp)"></p-button>
        </td>
      </tr>
    </ng-template>
  </p-table>
</p-card>

<p-card>
  <h2>Downtime Tracking</h2>
  <div class="flex gap-2 mb-3">
    <p-button label="Create Ticket" (click)="createDowntimeTicket()"></p-button>
    <p-button label="Confirm Ticket" severity="success"></p-button>
  </div>
  
  <div class="grid p-fluid">
    <div class="col-12 md:col-6">
      <label>Time/Min</label>
      <p-inputNumber [(ngModel)]="downtimeMinutes"></p-inputNumber>
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

## Tables SQL Principales

```sql
-- Production
Parts_Table (Id_Part, PN_Part, ShiftTarget_Part, Efficiency)
HourlyProd_Table (Id_HourlyProd, Date_HourlyProd, Shift_HourlyProd)
Output (outputNo, dateOutput, Id_Part, Yield)

-- Workstations
Workstation_Table (id_worksation, desc_worksation, Id_ProdLine)
Table_Machines (id_machine, name_machine, VOUTPUT, VSCRAP, VDT)

-- Downtime
Downtime_Table (Id_Downtime, Total_Downtime, Comment_Downtime)
DowntimeProblems_Table (Id_DowntimeProblems, Name_DowntimeProblems)

-- Employees
Employe_Table (Id_Emp, Nom_Emp, Prenom_Emp, Picture)
Qualification (id_qualif, Id_Emp, id_formation, test_result)

-- Quality
Defect_Table (id_defect, qty_defect, Id_DefectList)
DefectsList_Table (Id_DefectList, Code_Defect, Description_Defect)
```

## Models TypeScript

```typescript
export interface KPI {
  label: string;
  value: number;
  target: number;
  unit: string;
  trend: number;
  status: 'success' | 'warning' | 'danger';
}

export interface ProductionLine {
  id: number;
  name: string;
  project: string;
  status: 'running' | 'downtime' | 'setup';
  efficiency: number;
  output: number;
  target: number;
}

export interface Employee {
  Id_Emp: number;
  Nom_Emp: string;
  Prenom_Emp: string;
  Picture: string;
  EmpStatus: string;
}

export interface HourlyProduction {
  Id_HourlyProd: number;
  Date_HourlyProd: Date;
  Shift_HourlyProd: string;
  Hour_HourlyProd: number;
  Result_HourlyProdPN: number;
  Target_HourlyProdPN: number;
}

export interface Downtime {
  Id_Downtime: number;
  Total_Downtime: number;
  Comment_Downtime: string;
  Id_DowntimeProblems: number;
}
```

## Theme Personnalisé

Dans `assets/layout/styles/custom-theme.scss`:

```scss
:root {
  --primary-color: #2563EB;
  --primary-color-text: #ffffff;
  --surface-0: #ffffff;
  --surface-50: #F9FAFB;
  --surface-100: #F3F4F6;
  --surface-200: #E5E7EB;
  --text-color: #374151;
  --text-color-secondary: #6B7280;
}

.status-running {
  background-color: #D1FAE5 !important;
  color: #047857 !important;
}

.status-downtime {
  background-color: #FEE2E2 !important;
  color: #991B1B !important;
}

.status-setup {
  background-color: #FEF3C7 !important;
  color: #92400E !important;
}
```

## Real-Time Updates

```typescript
export class DashboardComponent implements OnInit, OnDestroy {
  private refreshInterval$!: Subscription;

  ngOnInit() {
    this.loadData();
    
    // Refresh every 5 seconds
    this.refreshInterval$ = interval(5000)
      .pipe(switchMap(() => this.dashboardService.getKPIs()))
      .subscribe(kpis => {
        this.kpis = kpis;
        this.messageService.add({
          severity: 'info',
          summary: 'Data Updated',
          life: 1000
        });
      });
  }

  ngOnDestroy() {
    this.refreshInterval$?.unsubscribe();
  }
}
```

## Routing

```typescript
const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'production', component: ProductionComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: 'hr', component: HRComponent },
      { path: 'quality', component: QualityComponent },
      { path: 'maintenance', component: MaintenanceComponent },
      { path: 'kpi', component: KPIComponent },
      { path: 'lessons', component: LessonsComponent },
      { path: 'transport', component: TransportComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  }
];
```

## Composants PrimeNG à Utiliser

### Essentiels
- `p-table` - Toutes les listes de données
- `p-card` - Conteneurs de contenu
- `p-dropdown` - Sélections
- `p-calendar` - Dates
- `p-inputNumber` - Nombres
- `p-chart` - Graphiques
- `p-dialog` - Modales
- `p-toast` - Notifications
- `p-tag` - Badges de statut
- `p-button` - Boutons

### Avancés
- `p-autoComplete` - Part numbers, employees
- `p-fileUpload` - Photos, documents
- `p-progressBar` - Indicateurs de progression
- `p-timeline` - Historique maintenance
- `p-dataView` - Grilles de cartes
- `p-confirmDialog` - Confirmations

## Commandes d'Installation

```bash
# Créer le projet Angular
ng new dms-production --style=scss --routing=true

# Installer PrimeNG et dépendances
npm install primeng@19 primeicons@latest primeflex@latest

# Installer Chart.js pour les graphiques
npm install chart.js

# Angular animations
npm install @angular/animations
```

## Fichiers de Configuration

**angular.json** - Ajouter dans styles:
```json
"styles": [
  "node_modules/primeng/resources/themes/lara-light-blue/theme.css",
  "node_modules/primeng/resources/primeng.min.css",
  "node_modules/primeicons/primeicons.css",
  "node_modules/primeflex/primeflex.css",
  "src/styles.scss"
]
```

**app.module.ts** - Imports PrimeNG:
```typescript
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
// ... etc
```

## Ordre de Développement

1. **Setup projet + Layout** (1h)
2. **Dashboard avec KPIs** (2h)
3. **Production monitoring** (3h)
4. **Services et API** (2h)
5. **Autres modules** (4h chacun)

---

**Génère le code complet avec tous les composants, services, et routing configurés. Utilise le template Sakai comme base et PrimeNG v19 pour tous les composants UI.**
