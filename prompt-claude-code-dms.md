# Prompt pour Claude Code - Génération Interface DMS Production

## Context du Projet

Je développe un système **DMS (Digital Manufacturing System) Production** pour la gestion et le monitoring en temps réel de la production industrielle. Le système doit gérer:
- Monitoring de production en temps réel
- Gestion des employés et qualifications
- Tracking des défauts et qualité
- Gestion de l'inventaire
- Maintenance des équipements
- KPI et indicateurs de performance
- Lessons learned
- Transport et logistique

## Stack Technique Requis

**Framework**: Angular v19
**UI Library**: PrimeNG v19
**Template**: Sakai (template Angular + PrimeNG)
**Base de données**: SQL Server (schémas fournis ci-dessous)

## Spécifications UI/UX

J'ai déjà créé des spécifications complètes de design que tu dois suivre:

### Design System
- **Couleurs principales**:
  - Primary Blue: #2563EB
  - Success Green: #10B981
  - Warning Yellow: #F59E0B
  - Danger Red: #EF4444
  - Grays: du #F9FAFB au #111827

- **Typography**: System UI fonts, tailles de 10px à 24px
- **Spacing**: Système basé sur 4px
- **Border Radius**: 4px à 16px selon les composants

### Structure de Navigation

Créer une application avec:
1. **Sidebar gauche** (256px expanded, 80px collapsed) avec les sections:
   - Dashboard (icône: LayoutDashboard)
   - Production (icône: Activity)
   - Inventory (icône: Package)
   - HR & Employees (icône: Users)
   - Quality & Defects (icône: AlertTriangle)
   - Maintenance (icône: Wrench)
   - KPI & Indicators (icône: TrendingUp)
   - Lessons Learned (icône: BookOpen)
   - Transport (icône: Truck)
   - Settings (icône: Settings)

2. **Header** (64px height) avec:
   - Titre de la page
   - Informations du shift en cours
   - Badge "Live" pour le monitoring temps réel
   - Profil utilisateur

3. **Zone de contenu principale** avec padding 24px

## Schémas de Base de Données

### Tables Principales à Intégrer

```sql
-- Production
Parts_Table (Id_Part, PN_Part, Id_Project, ShiftTarget_Part, Price_Part, Efficiency, etc.)
PartsSF_Table (Id_PartSF, PN_PartSF, id_process, ShiftTarget_PartSF, etc.)
HourlyProd_Table (Id_HourlyProd, Date_HourlyProd, Shift_HourlyProd, Hour_HourlyProd, etc.)
Output (outputNo, dateOutput, Id_Project, Id_ProdLine, Id_Part, Yield)

-- Workstations & Machines
Workstation_Table (id_worksation, desc_worksation, id_process, Id_ProdLine, id_machine)
Table_Machines (id_machine, name_machine, id_process, VOUTPUT, VSCRAP, VDT)
Process_Table (id_process, desc_process, ZoneID)

-- Downtime
Downtime_Table (Id_Downtime, Total_Downtime, Comment_Downtime, Id_DowntimeProblems)
DowntimeProblems_Table (Id_DowntimeProblems, Name_DowntimeProblems)

-- Quality
Defect_Table (id_defect, qty_defect, id_worksation, Id_DefectList)
DefectsList_Table (Id_DefectList, Code_Defect, Description_Defect)
Scrap_table (ID_BOM, id_defect, qty_scrap, batch)

-- HR
Employe_Table (Id_Emp, Nom_Emp, Prenom_Emp, Categorie_Emp, Picture, EmpStatus)
Qualification (id_qualif, start_qualif, end_qualif, id_formation, Id_Emp, test_result)
Formation_Table (id_formation, name_formation, type_formation, id_process)
Attendance_Table (Id_attendance, Id_Operator, Id_ProdLine, Datetime_Attendance, Shift_Attendance)

-- Projects & Production Lines
Projects_Table (Id_Project, Name_Project, Id_Customer, ProjectImage, Type)
ProdLine_Table (Id_ProdLine, Name_ProdLine, Id_Project, ProdLineTeamLeader)

-- Inventory
PNLIST (PN, PNDESC, UNIT, TOTALSTOCK, PRICE)
DATAENTRY (SN, PN, BATCHNO, SUNO, QTY, DATEENTRY, AREA)
PNLOCATION (PN, LOCATION, RACK)

-- KPI
Indicators (indicatorID, Name, Unit, Formula, YearTarget, MounthTarget)
MonthlyInput (MounthlyInputID, indicatorID, DateMounthlyInput, Target, Result)
Actions (ActionsID, Description, Cause, Action, Responsible, DueDate, Status)

-- Lessons Learned
Lessons (LessonID, Type, Description, Project, PN, Process, RootCause, Status)
LLActions (ActionID, LessonID, Description, Responsible, DueDate, Status)

-- Maintenance
MaintUser (MaintUserID, FullName, Position, UserType)
MaintenanceKPI (Date, HP, tempOuverture, ZoneID)
```

## Fonctionnalités à Implémenter

### 1. Dashboard (Page d'accueil)
**Composants PrimeNG à utiliser**: p-card, p-chart, p-table, p-tag

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  Row 1: 4 KPI Cards (p-card)                        │
│  - Output (valeur/target)                           │
│  - Efficiency (%)                                   │
│  - Scrap (%)                                        │
│  - Downtime (%)                                     │
├─────────────────────────────────────────────────────┤
│  Row 2: Production Lines Status (p-table)          │
│  Liste des lignes de production avec statut        │
├─────────────────────────────────────────────────────┤
│  Row 3: Charts                                      │
│  - Output/Hour (p-chart bar)                       │
│  - Downtime Analysis (p-chart horizontal bar)      │
└─────────────────────────────────────────────────────┘
```

**Services Angular**:
- `DashboardService` pour récupérer les KPIs
- `ProductionLineService` pour les statuts des lignes
- Rafraîchissement automatique toutes les 5 secondes avec RxJS interval

### 2. Production Monitoring
**Composants**: p-dropdown, p-calendar, p-inputNumber, p-dataTable, p-dialog

**Sections**:
1. **Shift Information Form**:
   - Dropdown shift (Morning/Evening/Night)
   - Calendar date picker
   - Dropdown project
   - Dropdown production line
   - Dropdown part number
   - Dropdown hour (Hour No1 - 14:00/15:0X)

2. **Output/Hour Section**:
   - InputNumber pour output
   - Display target
   - Affichage efficiency calculé
   - Bouton "Dashboard Viewer"

3. **Production Team/Workstation**:
   - Scan ID card (p-inputText)
   - Dropdown workstation
   - Table des opérateurs assignés avec photos
   - Boutons Add/Remove
   - Display required qualification

4. **Downtime Tracking**:
   - Boutons "Create Ticket" / "Confirm Ticket"
   - InputNumber time/min
   - Dropdown problem category
   - Textarea action/comment
   - Liste des downtimes du shift

**Services**:
- `ProductionService` (CRUD operations)
- `HourlyProductionService`
- `DowntimeService`
- `WorkstationService`

### 3. Inventory Management
**Composants**: p-table, p-paginator, p-dialog, p-fileUpload

**Features**:
- Table avec toutes les parts (PNLIST)
- Recherche et filtres
- Entrée/sortie de stock (DATAENTRY)
- Gestion des locations (PNLOCATION)
- Scan barcode/QR code
- Export Excel

**Services**:
- `InventoryService`
- `LocationService`
- `BatchService`

### 4. HR & Employees
**Composants**: p-table, p-card, p-image, p-dialog, p-fileUpload

**Features**:
- Liste des employés avec photos
- Matrice de qualification (employee x process)
- Gestion des formations
- Suivi des certifications
- Tracking attendance
- Gestion des équipes et trajets (transport)

**Services**:
- `EmployeeService`
- `QualificationService`
- `FormationService`
- `AttendanceService`

### 5. Quality & Defects
**Composants**: p-table, p-chart, p-dialog, p-dropdown

**Features**:
- Enregistrement des défauts
- Liste des défauts par shift/jour/semaine
- Pareto chart des top défauts
- Taux de scrap
- PPM tracking
- Photos des défauts

**Services**:
- `DefectService`
- `QualityService`
- `ScrapService`

### 6. Maintenance
**Composants**: p-table, p-dialog, p-calendar, p-timeline

**Features**:
- Liste des downtimes machines
- Création/fermeture de tickets
- Suivi du temps d'intervention
- Maintenance préventive
- KPI maintenance (HP, temps d'ouverture)
- Assignation techniciens

**Services**:
- `MaintenanceService`
- `MachineService`
- `MaintUserService`

### 7. KPI & Indicators
**Composants**: p-card, p-chart, p-table, p-dialog

**Features**:
- Liste des KPIs configurables
- Saisie mensuelle (MonthlyInput)
- Charts de tendance
- Action plans
- Comparaison target vs actual
- Filtres par département

**Services**:
- `KPIService`
- `IndicatorService`
- `ActionPlanService`

### 8. Lessons Learned
**Composants**: p-card, p-dialog, p-editor, p-fileUpload, p-tag

**Features**:
- Liste des lessons learned
- Catégorisation (Good/Bad practice)
- Photos et documents
- Actions correctives
- Statut (Open/Closed)
- Réactions/feedback

**Services**:
- `LessonsService`
- `LLActionsService`

## Architecture Angular Recommandée

```
src/
├── app/
│   ├── core/
│   │   ├── models/          # Interfaces TypeScript
│   │   ├── services/        # Services API
│   │   ├── guards/          # Auth guards
│   │   └── interceptors/    # HTTP interceptors
│   ├── shared/
│   │   ├── components/      # Composants réutilisables
│   │   ├── directives/
│   │   └── pipes/
│   ├── features/
│   │   ├── dashboard/
│   │   │   ├── dashboard.component.ts
│   │   │   ├── dashboard.component.html
│   │   │   ├── dashboard.component.scss
│   │   │   └── dashboard.service.ts
│   │   ├── production/
│   │   │   ├── components/
│   │   │   │   ├── shift-form/
│   │   │   │   ├── output-tracking/
│   │   │   │   ├── team-assignment/
│   │   │   │   └── downtime-tracking/
│   │   │   ├── production.component.ts
│   │   │   └── production.service.ts
│   │   ├── inventory/
│   │   ├── hr/
│   │   ├── quality/
│   │   ├── maintenance/
│   │   ├── kpi/
│   │   └── lessons/
│   ├── layout/
│   │   ├── app.layout.component.ts
│   │   ├── app.sidebar.component.ts
│   │   ├── app.topbar.component.ts
│   │   └── app.menu.component.ts
│   └── app-routing.module.ts
└── assets/
    ├── layout/
    │   └── styles/
    │       └── custom-theme.scss  # Thème personnalisé
    └── images/
```

## Instructions Spécifiques pour Claude Code

### 1. Setup Initial
```bash
# Installer le template Sakai
# Configurer PrimeNG v19
# Setup Angular v19
# Configurer le routing
# Setup des services HTTP avec interceptors
```

### 2. Configuration PrimeNG Theme
Dans `custom-theme.scss`, personnaliser les couleurs:
```scss
$primaryColor: #2563EB;
$primaryDarkColor: #1E40AF;
$primaryLightColor: #3B82F6;
$successColor: #10B981;
$warningColor: #F59E0B;
$dangerColor: #EF4444;
```

### 3. Services API
Créer des services génériques avec HttpClient:
```typescript
@Injectable({ providedIn: 'root' })
export class BaseService<T> {
  constructor(private http: HttpClient, private endpoint: string) {}
  
  getAll(): Observable<T[]> { ... }
  getById(id: number): Observable<T> { ... }
  create(item: T): Observable<T> { ... }
  update(id: number, item: T): Observable<T> { ... }
  delete(id: number): Observable<void> { ... }
}
```

### 4. Real-Time Updates
Utiliser RxJS pour le rafraîchissement automatique:
```typescript
interval(5000).pipe(
  switchMap(() => this.dashboardService.getKPIs())
).subscribe(kpis => this.kpis = kpis);
```

### 5. Composants PrimeNG Prioritaires à Utiliser

**Navigation & Layout**:
- p-menubar, p-panelMenu, p-breadcrumb

**Data Display**:
- p-table (avec pagination, tri, filtres)
- p-dataView
- p-card
- p-panel
- p-accordion

**Forms**:
- p-inputText, p-inputNumber, p-inputTextarea
- p-dropdown, p-multiSelect
- p-calendar
- p-autoComplete
- p-checkbox, p-radioButton

**Charts**:
- p-chart (Chart.js)
- Types: bar, line, doughnut, pie

**Feedback**:
- p-toast (notifications)
- p-dialog
- p-confirmDialog
- p-progressBar, p-progressSpinner
- p-tag, p-badge

**Buttons & Actions**:
- p-button
- p-splitButton
- p-speedDial

### 6. Responsive Design
Utiliser PrimeFlex (inclus dans Sakai):
- Grid system: p-grid, p-col
- Spacing utilities: p-m-*, p-p-*
- Display utilities: p-d-*, p-flex-*

### 7. State Management
Implémenter un simple state management avec:
- Services avec BehaviorSubject
- Ou utiliser NgRx si nécessaire

### 8. Authentification
- Auth guard sur les routes
- JWT token storage
- Interceptor pour ajouter le token
- Login page avec p-card

## Priorités de Développement

### Phase 1 - Core (Semaine 1)
1. ✅ Setup projet avec Sakai template
2. ✅ Configuration routing et layout
3. ✅ Services de base et models
4. ✅ Dashboard avec KPIs
5. ✅ Production monitoring basique

### Phase 2 - Production (Semaine 2)
1. ✅ Shift management complet
2. ✅ Hourly production tracking
3. ✅ Team assignment
4. ✅ Downtime tracking
5. ✅ Real-time updates

### Phase 3 - Supporting Modules (Semaine 3)
1. ✅ Inventory management
2. ✅ HR & Employees
3. ✅ Quality & Defects
4. ✅ Maintenance

### Phase 4 - Analytics (Semaine 4)
1. ✅ KPI & Indicators
2. ✅ Lessons Learned
3. ✅ Advanced charts
4. ✅ Reports & exports

## Points d'Attention Importants

### Performance
- Lazy loading des modules
- OnPush change detection strategy
- Virtual scrolling pour les grandes tables
- Pagination côté serveur

### UX
- Loading states partout
- Error handling gracieux
- Toast notifications pour les actions
- Confirm dialogs pour les suppressions
- Keyboard shortcuts

### Data Validation
- Reactive forms avec validators
- Validation messages clairs
- Disabled states appropriés

### Accessibility
- Labels ARIA
- Keyboard navigation
- Focus management
- Contrast ratios

## API Endpoints (à adapter selon votre backend)

```typescript
// Base URL
const API_BASE = 'http://localhost:5000/api';

// Endpoints principaux
/api/dashboard/kpis
/api/production/hourly
/api/production/output
/api/workstations
/api/employees
/api/qualifications
/api/defects
/api/inventory
/api/maintenance/downtimes
/api/kpi/indicators
/api/lessons
```

## Livrables Attendus

1. **Application Angular complète** avec:
   - Toutes les pages fonctionnelles
   - Services API configurés
   - Routing configuré
   - Layout responsive
   - Theme personnalisé

2. **Documentation**:
   - README avec instructions de setup
   - Documentation des composants
   - Guide d'utilisation

3. **Code Quality**:
   - Code TypeScript typé
   - Composants réutilisables
   - Services découplés
   - Clean code practices

## Commande pour Démarrer

```bash
# Génère l'application complète avec:
# - Template Sakai + PrimeNG v19 + Angular v19
# - Toutes les pages listées
# - Services API configurés
# - Routing et guards
# - Theme personnalisé selon les spécifications
# - Composants réutilisables
# - Real-time updates
# - Responsive design
```

---

**Note**: Commence par la structure de base et le dashboard, puis implémente les modules progressivement. Utilise les composants PrimeNG au maximum pour gagner du temps et assurer la cohérence visuelle.
