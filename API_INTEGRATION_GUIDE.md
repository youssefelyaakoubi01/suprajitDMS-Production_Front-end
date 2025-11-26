# Guide d'Intégration API - DMS Production

## 📋 Vue d'ensemble

Ce document explique comment le front-end Angular est connecté au back-end Django REST Framework.

## ⚠️ Notes Importantes sur les Modèles

Pour éviter les conflits de noms entre les modèles, certaines interfaces ont été renommées :
- **`KPI`** → **`DashboardKPI`** (dans `dashboard.model.ts`) - Pour l'affichage du dashboard
- **`KPI`** reste disponible dans `kpi.model.ts` pour le module KPI complet
- **`Defect`** reste dans `defect.model.ts` (format original)
- **`QualityDefect`** dans `quality.model.ts` (format étendu avec relations)

## ✅ Configuration Complète

### 1. Configuration du Port API

**Fichier**: `src/environments/environment.ts`

```typescript
export const environment = {
    production: false,
    apiUrl: 'http://localhost:8000/api'
};
```

Le front-end est maintenant configuré pour communiquer avec Django sur le port **8000**.

### 2. Authentification JWT

#### Service d'Authentification
**Fichier**: `src/app/core/services/auth.service.ts`

**Fonctionnalités**:
- Login avec JWT
- Refresh token automatique
- Stockage sécurisé dans localStorage
- Logout et redirection

**Utilisation**:
```typescript
import { AuthService } from '@core/services/auth.service';

constructor(private authService: AuthService) {}

login() {
  this.authService.login({ username: 'user', password: 'pass' })
    .subscribe({
      next: (response) => {
        console.log('Logged in successfully');
        // Les tokens sont automatiquement stockés
      },
      error: (error) => console.error('Login failed', error)
    });
}

logout() {
  this.authService.logout(); // Redirige vers /dms-login
}

isAuthenticated() {
  return this.authService.isAuthenticated();
}
```

#### Intercepteur JWT
**Fichier**: `src/app/core/interceptors/auth.interceptor.ts`

**Fonctionnalités**:
- Ajoute automatiquement le token `Authorization: Bearer <token>` à toutes les requêtes
- Refresh automatique du token en cas d'expiration (401)
- Logout automatique si le refresh échoue

#### Guard de Protection
**Fichier**: `src/app/core/guards/auth.guard.ts`

**Utilisation dans les routes**:
```typescript
import { authGuard } from '@core/guards/auth.guard';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  }
];
```

### 3. Gestion des Erreurs

**Fichier**: `src/app/core/interceptors/error.interceptor.ts`

L'intercepteur d'erreurs capture automatiquement toutes les erreurs HTTP et affiche des notifications via le `NotificationService`.

### 4. Configuration Globale

**Fichier**: `src/app.config.ts`

Les intercepteurs sont configurés globalement :
```typescript
provideHttpClient(
    withFetch(),
    withInterceptors([authInterceptor, errorInterceptor])
)
```

## 🔌 Services API Disponibles

### Service API de Base

**Fichier**: `src/app/core/services/api.service.ts`

Service générique pour les appels HTTP :
```typescript
import { ApiService } from '@core/services/api.service';

constructor(private api: ApiService) {}

getData() {
  return this.api.get<MyType>('endpoint');
}

postData(data: MyType) {
  return this.api.post<MyType>('endpoint', data);
}
```

### 1. DashboardService

**Fichier**: `src/app/core/services/dashboard.service.ts`

**Endpoints Django**:
- `GET /api/dashboard/kpis` - KPIs du dashboard
- `GET /api/dashboard/production-lines` - Statut des lignes
- `GET /api/dashboard/output-hour` - Output par heure
- `GET /api/dashboard/downtime-analysis` - Analyse downtime

**Exemple d'utilisation**:
```typescript
import { DashboardService } from '@core/services/dashboard.service';

constructor(private dashboardService: DashboardService) {}

ngOnInit() {
  this.dashboardService.getKPIs({ date: '2025-01-20', shift: 'A' })
    .subscribe(kpis => {
      this.kpis = kpis;
    });

  this.dashboardService.getProductionLines()
    .subscribe(lines => {
      this.productionLines = lines;
    });
}
```

### 2. ProductionService

**Fichier**: `src/app/core/services/production.service.ts`

**Endpoints Django**:
- `GET/POST /api/production/projects` - Projets
- `GET /api/production/lines` - Lignes de production
- `GET /api/production/parts` - Pièces
- `GET /api/production/shifts` - Shifts
- `GET/POST/PUT /api/production/hourly` - Production horaire
- `GET/POST/PUT/DELETE /api/production/downtimes` - Downtimes
- `GET /api/production/downtime-problems` - Types de problèmes
- `GET/POST/DELETE /api/production/team-assignments` - Assignations équipe

**Exemple d'utilisation**:
```typescript
import { ProductionService } from '@core/services/production.service';

constructor(private productionService: ProductionService) {}

loadData() {
  // Charger les projets
  this.productionService.getProjects().subscribe(projects => {
    this.projects = projects;
  });

  // Charger la production horaire
  this.productionService.getHourlyProduction({
    date: '2025-01-20',
    shift: 'A',
    lineId: 1
  }).subscribe(hourlyData => {
    this.hourlyProduction = hourlyData;
  });

  // Créer une entrée de production
  this.productionService.createHourlyProduction({
    Date_HourlyProd: '2025-01-20',
    Shift_HourlyProd: 'A',
    Hour_HourlyProd: 8,
    Id_Part: 1,
    Result_HourlyProdPN: 50,
    Target_HourlyProdPN: 60,
    HC_HourlyProdPN: 4,
    Id_ProdLine: 1
  }).subscribe(created => {
    console.log('Production entry created', created);
  });

  // Créer un downtime
  this.productionService.createDowntime({
    Total_Downtime: 15,
    Comment_Downtime: 'Machine breakdown',
    Id_HourlyProd: 1,
    Id_DowntimeProblems: 2
  }).subscribe(downtime => {
    console.log('Downtime created', downtime);
  });
}
```

### 3. EmployeeService

**Fichier**: `src/app/core/services/employee.service.ts`

**Endpoints Django**:
- `GET/POST/PUT/DELETE /api/employees/employees` - Employés
- `GET /api/employees/employees/badge/:id` - Recherche par badge
- `GET /api/employees/processes` - Processus
- `GET/POST /api/employees/formations` - Formations
- `GET/POST/PUT /api/employees/qualifications` - Qualifications
- `GET/POST/PUT /api/employees/attendance` - Présences

**Exemple d'utilisation**:
```typescript
import { EmployeeService } from '@core/services/employee.service';

constructor(private employeeService: EmployeeService) {}

loadEmployees() {
  this.employeeService.getEmployees({
    department: 'Production',
    status: 'Active'
  }).subscribe(employees => {
    this.employees = employees;
  });
}

scanBadge(badgeId: string) {
  this.employeeService.getEmployeeByBadge(badgeId)
    .subscribe(employee => {
      console.log('Employee found', employee);
      this.assignToWorkstation(employee);
    });
}
```

### 4. QualityService

**Fichier**: `src/app/core/services/quality.service.ts`

**Endpoints Django**:
- `GET /api/quality/categories` - Catégories de défauts
- `GET/POST/PUT /api/quality/types` - Types de défauts
- `GET/POST/PUT/DELETE /api/quality/defects` - Défauts
- `GET/POST/PUT /api/quality/inspections` - Inspections qualité

**Exemple d'utilisation**:
```typescript
import { QualityService } from '@core/services/quality.service';

constructor(private qualityService: QualityService) {}

createDefect() {
  this.qualityService.createDefect({
    Qty_Defect: 5,
    Id_DefectType: 1,
    Id_HourlyProd: 10,
    DateDefect: '2025-01-20',
    Comment_Defect: 'Paint defects'
  }).subscribe(defect => {
    console.log('Defect created', defect);
  });
}
```

### 5. InventoryService

**Fichier**: `src/app/core/services/inventory.service.ts`

**Endpoints Django**:
- `GET/POST/PUT /api/inventory/items` - Articles d'inventaire
- `GET /api/inventory/locations` - Emplacements
- `GET/POST /api/inventory/entries` - Mouvements de stock
- `GET/POST/PUT /api/inventory/suppliers` - Fournisseurs

### 6. MaintenanceService

**Fichier**: `src/app/core/services/maintenance.service.ts`

**Endpoints Django**:
- `GET /api/maintenance/types` - Types de maintenance
- `GET/POST/PUT /api/maintenance/downtimes` - Downtimes maintenance
- `GET/POST/PUT /api/maintenance/preventive` - Maintenance préventive
- `GET/POST /api/maintenance/logs` - Logs de maintenance

### 7. KPIService

**Fichier**: `src/app/core/services/kpi.service.ts`

**Endpoints Django**:
- `GET /api/kpi/categories` - Catégories KPI
- `GET/POST/PUT /api/kpi/indicators` - Indicateurs
- `GET/POST/PUT /api/kpi/monthly-data` - Données mensuelles
- `GET/POST/PUT /api/kpi/action-plans` - Plans d'action

### 8. LessonsService

**Fichier**: `src/app/core/services/lessons.service.ts`

**Endpoints Django**:
- `GET /api/lessons/categories` - Catégories de leçons
- `GET/POST/PUT/DELETE /api/lessons/lessons` - Leçons
- `GET/POST/DELETE /api/lessons/attachments` - Pièces jointes
- `GET/POST/PUT /api/lessons/actions` - Actions

## 🚀 Démarrage

### Backend Django

```bash
cd DMS-Production-Back-end

# Activer l'environnement virtuel (Pipenv)
pipenv shell

# Lancer les migrations
python manage.py migrate

# Créer un superuser (si nécessaire)
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver 8000
```

Le backend sera accessible sur `http://localhost:8000`

### Frontend Angular

```bash
cd DMS-Production-Front-end/sakai-ng

# Installer les dépendances (si nécessaire)
npm install

# Lancer le serveur de développement
ng serve

# Ou avec un port spécifique
ng serve --port 4200
```

Le frontend sera accessible sur `http://localhost:4200`

## 🔐 Workflow d'Authentification

### 1. Login

```typescript
// Dans le composant de login
login() {
  const credentials = {
    username: this.loginForm.value.username,
    password: this.loginForm.value.password
  };

  this.authService.login(credentials).subscribe({
    next: (response) => {
      // Tokens automatiquement stockés
      this.router.navigate(['/dashboard']);
    },
    error: (error) => {
      this.notificationService.error('Login failed', error.message);
    }
  });
}
```

### 2. Appels API Authentifiés

Tous les appels suivants incluront automatiquement le token JWT :

```typescript
// Le token est ajouté automatiquement par l'intercepteur
this.productionService.getProjects().subscribe(projects => {
  console.log(projects);
});
```

### 3. Refresh Token Automatique

Si le token expire (401), l'intercepteur :
1. Appelle automatiquement `/api/token/refresh/`
2. Stocke le nouveau token
3. Rejoue la requête originale

### 4. Logout

```typescript
logout() {
  this.authService.logout(); // Nettoie le localStorage et redirige
}
```

## 📊 Exemple Complet : Dashboard Component

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DashboardService } from '@core/services/dashboard.service';
import { KPI, ProductionLineStatus } from '@core/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  kpis: KPI[] = [];
  productionLines: ProductionLineStatus[] = [];
  isLoading = true;
  private refreshSubscription?: Subscription;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadDashboardData();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.refreshSubscription?.unsubscribe();
  }

  loadDashboardData() {
    this.isLoading = true;

    // Charger les KPIs
    this.dashboardService.getKPIs().subscribe({
      next: (kpis) => {
        this.kpis = kpis;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load KPIs', error);
        this.isLoading = false;
      }
    });

    // Charger les lignes de production
    this.dashboardService.getProductionLines().subscribe({
      next: (lines) => {
        this.productionLines = lines;
      },
      error: (error) => {
        console.error('Failed to load production lines', error);
      }
    });
  }

  startAutoRefresh() {
    // Rafraîchir toutes les 5 secondes
    this.refreshSubscription = interval(5000)
      .pipe(
        switchMap(() => this.dashboardService.getKPIs())
      )
      .subscribe(kpis => {
        this.kpis = kpis;
      });
  }
}
```

## 🧪 Test de la Connexion

### Vérifier que le Backend est Accessible

```bash
# Tester l'API Django
curl http://localhost:8000/api/

# Obtenir un token JWT
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Utiliser le token pour accéder à une ressource protégée
curl http://localhost:8000/api/dashboard/kpis \
  -H "Authorization: Bearer <votre-access-token>"
```

### Vérifier CORS

Si vous rencontrez des erreurs CORS, vérifiez `settings.py` du backend :

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
]
```

## 🐛 Dépannage

### Erreur 401 (Unauthorized)

- Vérifiez que vous êtes bien authentifié
- Vérifiez que le token n'a pas expiré
- Vérifiez que les endpoints Django sont protégés correctement

### Erreur CORS

- Vérifiez `CORS_ALLOWED_ORIGINS` dans `settings.py`
- Vérifiez que `corsheaders` est dans `INSTALLED_APPS`
- Vérifiez que le middleware CORS est activé

### Erreur 404 (Not Found)

- Vérifiez que l'endpoint existe dans le backend
- Vérifiez l'URL de l'API dans `environment.ts`
- Vérifiez les routes Django dans `urls.py`

### Token Non Envoyé

- Vérifiez que l'intercepteur est bien configuré dans `app.config.ts`
- Vérifiez que le token est bien stocké dans localStorage
- Vérifiez la console du navigateur pour les erreurs

## 📝 Notes Importantes

1. **Sécurité** : Ne jamais commit les tokens ou secrets dans le code
2. **Environment** : Utiliser des variables d'environnement pour les URLs
3. **Types** : Toujours typer les réponses API avec des interfaces TypeScript
4. **Error Handling** : Toujours gérer les erreurs avec try-catch ou subscribe error callback
5. **Loading States** : Afficher des indicateurs de chargement pendant les requêtes
6. **Unsubscribe** : Toujours se désabonner des Observables dans ngOnDestroy

## ✅ Checklist de Vérification

- [x] Backend Django tourne sur port 8000
- [x] Frontend Angular configuré pour port 8000
- [x] Service d'authentification créé
- [x] Intercepteurs JWT et erreurs configurés
- [x] Auth guard créé
- [x] Tous les services API créés
- [x] CORS configuré correctement dans Django
- [x] JWT configuré dans Django REST Framework

## 🎯 Prochaines Étapes

1. Créer un utilisateur dans Django admin
2. Tester le login depuis l'interface Angular
3. Vérifier que les tokens sont stockés
4. Tester les appels API authentifiés
5. Implémenter les composants qui utilisent les services

---

**Documentation créée le**: 2025-01-24
**Version**: 1.0.0
