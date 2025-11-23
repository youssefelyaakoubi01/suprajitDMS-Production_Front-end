# Écosystème DMS - Séparation et Contrôle d'Accès

## 🏢 Vue d'Ensemble de l'Écosystème

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DMS ECOSYSTEM                              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │    DMS-Auth (Central)     │
                    │  Authentification JWT     │
                    │  Gestion des Tokens       │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌──────────────┐          ┌──────────────┐        ┌──────────────┐
│     🏭       │          │      👥      │        │      📦      │
│DMS-Production│          │   DMS-RH     │        │ DMS-Inventory│
│              │          │              │        │              │
│ Monitoring   │          │ Employés     │        │ Stock        │
│ Production   │          │ Formations   │        │ Matériel     │
│ Downtime     │          │ Attendance   │        │ Locations    │
│              │          │              │        │              │
└──────────────┘          └──────────────┘        └──────────────┘
        │                         │                         │
        ▼                         ▼                         ▼
┌──────────────┐          ┌──────────────┐        ┌──────────────┐
│      ✅      │          │      🔧      │        │      📊      │
│ DMS-Quality  │          │DMS-Maintenance│       │   DMS-KPI    │
│              │          │              │        │              │
│ Défauts      │          │ Equipment    │        │ Indicateurs  │
│ Contrôle     │          │ Tickets      │        │ Reporting    │
│ Scrap        │          │ Planning     │        │ Analytics    │
│              │          │              │        │              │
└──────────────┘          └──────────────┘        └──────────────┘
```

## 📱 Applications DMS

### 🏭 DMS-Production (PHASE 1 - EN COURS)

**URL**: `https://production.dms.company.com`  
**Port Dev**: `4200`  
**Objectif**: Monitoring et gestion de la production en temps réel

**Modules**:
- ✅ Dashboard production temps réel
- ✅ Shift management
- ✅ Hourly production tracking
- ✅ Workstation & team assignment
- ✅ Downtime tracking
- ✅ Production reports

**Base de Données**:
- `HourlyProd_Table`
- `HourlyProdPN_table`
- `Output`
- `Downtime_Table`
- `DowntimeProblems_Table`
- `Workstation_Table`
- `Parts_Table`
- `Projects_Table`
- `ProdLine_Table`

---

### 👥 DMS-RH (PHASE 2)

**URL**: `https://hr.dms.company.com`  
**Port Dev**: `4201`  
**Objectif**: Gestion complète des ressources humaines

**Modules**:
- Gestion employés (CRUD)
- Formations et qualifications
- Matrice de compétences
- Attendance tracking
- Teams et affectations
- Transport et trajets
- Documents RH

**Base de Données**:
- `Employe_Table`
- `Formation_Table`
- `Qualification`
- `Attendance_Table`
- `Teams`
- `trajets`
- `stations`
- `TransportPlanning`

---

### 📦 DMS-Inventory (PHASE 3)

**URL**: `https://inventory.dms.company.com`  
**Port Dev**: `4202`  
**Objectif**: Gestion du stock et des matériaux

**Modules**:
- Catalogue parts (PN)
- Entrées/Sorties stock
- Gestion des batchs
- Locations et racks
- Inventaire physique
- Material request
- Historique mouvements

**Base de Données**:
- `PNLIST`
- `DATAENTRY`
- `PNLOCATION`
- `BATCH`
- `INVENTORYAREA`
- `INVENTORYTEAM`
- `MaterialRequest`
- `StorageType`

---

### ✅ DMS-Quality (PHASE 4)

**URL**: `https://quality.dms.company.com`  
**Port Dev**: `4203`  
**Objectif**: Contrôle qualité et gestion des défauts

**Modules**:
- Enregistrement défauts
- Defects list et codes
- Scrap tracking
- PPM calculation
- Pareto analysis
- Assembly & Pre-assembly defects
- Photos et documentation
- Quality reports

**Base de Données**:
- `Defect_Table`
- `DefectsList_Table`
- `Scrap_table`
- `AssemblyDefect`
- `PreAssemblyDefect`
- `BOM_Table` (pour scrap)

---

### 🔧 DMS-Maintenance (PHASE 5)

**URL**: `https://maintenance.dms.company.com`  
**Port Dev**: `4204`  
**Objectif**: Maintenance des équipements

**Modules**:
- Tickets downtime machines
- Interventions techniques
- Planning maintenance préventive
- Historique pannes
- KPI maintenance (HP, temps ouverture)
- Gestion techniciens
- Pièces de rechange
- Zone management

**Base de Données**:
- `Downtime` (maintenance)
- `MaintUser`
- `MaintenanceKPI`
- `Table_Machines`
- `Process_Table`
- `Zone`
- `DowntimePPM_Table`
- `ParetoDT_Table`

---

### 📊 DMS-KPI (PHASE 6)

**URL**: `https://kpi.dms.company.com`  
**Port Dev**: `4205`  
**Objectif**: Indicateurs de performance et reporting avancé

**Modules**:
- Configuration KPIs
- Saisie mensuelle
- Tracking targets vs actual
- Action plans
- Process performance
- Department KPIs
- Charts et visualisations
- Exports avancés

**Base de Données**:
- `Indicators`
- `MonthlyInput`
- `Actions`
- `KPIAttendance`
- `KPIProcessOwner`
- `KPIActionPlan`
- `ConcernedProcessus`

---

### 📚 DMS-Lessons (PHASE 7)

**URL**: `https://lessons.dms.company.com`  
**Port Dev**: `4206`  
**Objectif**: Base de connaissances et lessons learned

**Modules**:
- Création lessons learned
- Catégorisation (Good/Bad practice)
- Photos et documents
- Actions correctives
- Tracking status
- Réactions et feedback
- Recherche et filtres

**Base de Données**:
- `Lessons`
- `LLActions`
- `React`

---

## 👥 Rôles et Accès par Application

### Matrice Globale des Accès

| Rôle | Production | RH | Inventory | Quality | Maintenance | KPI | Lessons |
|------|------------|----|-----------|---------| ------------|-----|---------|
| **OPERATOR** | ✅ Créer<br>📖 Lire | ❌ | ❌ | ✅ Signaler défauts | ✅ Signaler DT | ❌ | 📖 Lire |
| **LINE_LEADER** | ✅ Créer<br>✏️ Modifier (2h)<br>📖 Lire sa ligne<br>👥 Assigner équipe | ❌ | 📖 Lire stock | ✅ Gérer défauts | ✅ Tickets DT | 📖 Lire | 📖 Lire<br>✅ Créer |
| **TEAM_LEADER** | ✅ Créer<br>✏️ Modifier (4h)<br>📖 Lire équipe<br>👥 Gérer équipe<br>📤 Export | 📖 Voir équipe<br>✅ Attendance | 📖 Lire<br>✅ Request | ✅ Gérer qualité | ✅ Gérer tickets | 📖 Lire KPIs | ✅ Gérer LL |
| **PROD_SUPERVISOR** | ✅ Tous droits production<br>📖 Vue globale<br>📤 Rapports | 📖 Voir tous<br>✅ Affecter | 📖 Lire<br>✅ Gérer requests | ✅ Tous droits qualité | ✅ Coordination | 📖 KPIs production | ✅ Tous droits |
| **PROD_MANAGER** | ✅ Accès total<br>📊 Analytics | 📖 Vue globale<br>✅ Reporting | 📖 Vue globale<br>📤 Export | 📖 Vue globale<br>📊 Analytics | 📖 Vue globale | ✅ Tous KPIs<br>📊 Dashboard | ✅ Tous droits |
| **HR_MANAGER** | 📖 Lire | ✅ Accès total RH<br>👥 Gérer employés<br>📚 Formations<br>📊 Analytics | ❌ | ❌ | ❌ | 📖 KPIs RH | 📖 Lire |
| **INVENTORY_MANAGER** | 📖 Lire conso | ❌ | ✅ Accès total stock<br>📦 Gérer inventaire<br>📊 Analytics | ❌ | 📖 Pièces rechange | 📖 KPIs inventory | 📖 Lire |
| **QUALITY_MANAGER** | 📖 Données qualité | ❌ | 📖 Lire | ✅ Accès total qualité<br>📊 Analytics<br>✅ Config | ❌ | ✅ KPIs qualité | ✅ Créer LL qualité |
| **MAINTENANCE_MANAGER** | 📖 Downtime production | ❌ | 📖 Pièces | ❌ | ✅ Accès total maintenance<br>📊 Analytics<br>⚙️ Config | ✅ KPIs maintenance | ✅ Créer LL maintenance |
| **ADMIN** | ✅ Accès total | ✅ Accès total | ✅ Accès total | ✅ Accès total | ✅ Accès total | ✅ Accès total | ✅ Accès total |
| **SUPER_ADMIN** | ✅ Accès total<br>⚙️ Config système | ✅ Accès total<br>⚙️ Config | ✅ Accès total<br>⚙️ Config | ✅ Accès total<br>⚙️ Config | ✅ Accès total<br>⚙️ Config | ✅ Accès total<br>⚙️ Config | ✅ Accès total<br>⚙️ Config |

### Légende
- ✅ Accès complet (CRUD)
- 📖 Lecture seule
- ✏️ Modification limitée
- 📤 Export autorisé
- 📊 Dashboards et analytics
- 👥 Gestion d'équipe
- ⚙️ Configuration système
- ❌ Pas d'accès

## 🔐 Système d'Authentification Centralisé

### DMS-Auth Service

**Service Central** qui gère l'authentification pour toutes les applications:

```
┌────────────────────────────────────────┐
│         DMS-Auth Service               │
│                                        │
│  • Login / Logout                     │
│  • JWT Token generation               │
│  • Refresh token                      │
│  • User roles & permissions           │
│  • Single Sign-On (SSO)               │
│  • Session management                 │
│                                        │
└────────────────────────────────────────┘
              │
              │ JWT Token
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌─────────┐       ┌─────────┐
│  App 1  │  ...  │  App N  │
│ Verify  │       │ Verify  │
│ Token   │       │ Token   │
└─────────┘       └─────────┘
```

### JWT Payload Structure

```json
{
  "sub": "12345",
  "username": "john.doe",
  "name": "John Doe",
  "roles": [
    "LINE_LEADER",
    "OPERATOR"
  ],
  "permissions": [
    {
      "resource": "production",
      "actions": ["view", "create", "update"]
    },
    {
      "resource": "team",
      "actions": ["view", "update"]
    }
  ],
  "department": "Production",
  "lineId": 1,
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Flow d'Authentification

```
1. User → Login Page (any DMS app)
   ↓
2. Credentials → DMS-Auth Service
   ↓
3. Validate credentials + Get user roles
   ↓
4. Generate JWT Token (15 min)
   Generate Refresh Token (7 days)
   ↓
5. Return tokens to app
   ↓
6. App stores tokens (localStorage)
   ↓
7. Each API call includes JWT in header:
   Authorization: Bearer <token>
   ↓
8. Backend validates token
   Checks permissions
   Returns data (filtered by role)
```

## 🚀 Ordre de Développement Recommandé

### Phase 1: DMS-Production (4-6 semaines) ⭐ PRIORITÉ
**Développeurs**: 2-3  
**Objectif**: Application fonctionnelle pour le monitoring production

**Semaine 1-2**:
- ✅ Auth system complet (JWT, guards, interceptors)
- ✅ Layout et navigation
- ✅ Dashboard temps réel
- ✅ Login et gestion de session

**Semaine 3-4**:
- ✅ Production tracking complet
- ✅ Shift management
- ✅ Team assignment
- ✅ Downtime tracking

**Semaine 5-6**:
- ✅ Reports
- ✅ Tests et optimisations
- ✅ Déploiement production
- ✅ Formation utilisateurs

---

### Phase 2: DMS-RH (3-4 semaines)
**Développeurs**: 2  
**Objectif**: Gestion complète RH

**Modules**:
- Employés CRUD
- Formations et qualifications
- Attendance
- Teams et transport

---

### Phase 3: DMS-Inventory (3-4 semaines)
**Développeurs**: 2  
**Objectif**: Gestion stock

**Modules**:
- Parts catalog
- Stock movements
- Inventory physical
- Material requests

---

### Phase 4: DMS-Quality (3 semaines)
**Développeurs**: 2  
**Objectif**: Contrôle qualité

**Modules**:
- Defects tracking
- Scrap management
- PPM calculation
- Quality reports

---

### Phase 5: DMS-Maintenance (3 semaines)
**Développeurs**: 1-2  
**Objectif**: Maintenance équipements

**Modules**:
- Tickets downtime
- Interventions
- Preventive maintenance
- KPI maintenance

---

### Phase 6: DMS-KPI (2-3 semaines)
**Développeurs**: 1-2  
**Objectif**: Reporting avancé

**Modules**:
- KPI configuration
- Monthly input
- Action plans
- Analytics dashboards

---

## 🌐 Architecture Technique

### Déploiement

```
┌─────────────────────────────────────────────────┐
│              Load Balancer / Nginx              │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   DMS-Prod   │ │   DMS-RH     │ │  DMS-Inv     │
│  :4200       │ │   :4201      │ │  :4202       │
└──────────────┘ └──────────────┘ └──────────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
                      ▼
              ┌──────────────┐
              │  Backend API │
              │  :5000       │
              └──────────────┘
                      │
                      ▼
              ┌──────────────┐
              │  SQL Server  │
              │  Database    │
              └──────────────┘
```

### Environnements

**Development**:
- DMS-Production: `http://localhost:4200`
- DMS-RH: `http://localhost:4201`
- DMS-Inventory: `http://localhost:4202`
- API: `http://localhost:5000`

**Staging**:
- DMS-Production: `https://prod-staging.dms.company.com`
- DMS-RH: `https://hr-staging.dms.company.com`
- DMS-Inventory: `https://inv-staging.dms.company.com`
- API: `https://api-staging.dms.company.com`

**Production**:
- DMS-Production: `https://production.dms.company.com`
- DMS-RH: `https://hr.dms.company.com`
- DMS-Inventory: `https://inventory.dms.company.com`
- API: `https://api.dms.company.com`

## 📊 Communication Entre Applications

### Cas 1: DMS-Production → DMS-RH
**Besoin**: Voir les infos employé assigné  
**Solution**: API call cross-app via JWT partagé

```typescript
// Dans DMS-Production
this.http.get('https://api.dms.company.com/hr/employees/123', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### Cas 2: DMS-Production → DMS-Inventory
**Besoin**: Vérifier stock matériel  
**Solution**: API call pour lecture seule

### Cas 3: DMS-Quality → DMS-Production
**Besoin**: Lier défauts à production  
**Solution**: Shared IDs (Id_HourlyProd, Id_Part)

## 💾 Partage de Données

### Tables Partagées (Read-Only pour certaines apps)

| Table | Propriétaire | Lecture | Écriture |
|-------|--------------|---------|----------|
| `Employe_Table` | DMS-RH | Toutes apps | DMS-RH uniquement |
| `Parts_Table` | DMS-Production | Toutes apps | DMS-Production, DMS-Inventory |
| `Projects_Table` | DMS-Production | Toutes apps | DMS-Production uniquement |
| `Defect_Table` | DMS-Quality | Production, Quality | DMS-Quality uniquement |
| `Downtime_Table` | DMS-Maintenance | Production, Maintenance | Les deux |

### APIs Partagées

```
GET  /api/shared/employees          # Liste employés (DMS-RH)
GET  /api/shared/parts               # Liste parts (DMS-Production)
GET  /api/shared/projects            # Liste projets (DMS-Production)
GET  /api/shared/workstations        # Liste postes (DMS-Production)
```

## 📝 Commande Claude Code pour DMS-Production

```bash
# Dans un nouveau dossier
mkdir dms-production
cd dms-production

# Placer le fichier CLAUDE-DMS-PRODUCTION.md

# Ouvrir Claude Code et taper:
```

```
Génère l'application DMS-Production complète selon CLAUDE-DMS-PRODUCTION.md.

C'est la PREMIÈRE application d'un écosystème DMS modulaire.
Les autres apps (RH, Inventory, Quality, etc.) seront développées séparément.

FOCUS sur:
1. Système d'authentification JWT robuste
2. Role-Based Access Control (RBAC) complet
3. 6 rôles: OPERATOR, LINE_LEADER, TEAM_LEADER, PROD_SUPERVISOR, PROD_MANAGER, ADMIN
4. Permissions granulaires par fonctionnalité
5. Dashboard temps réel avec filtrage par rôle
6. Production tracking avec permissions conditionnelles
7. Guards et interceptors
8. Directives hasPermission et hasRole

Technologies: Angular v19 + PrimeNG v19 + JWT + RBAC

Génère tout le code prêt à déployer.
```

---

**Cette séparation modulaire permet un développement agile, un déploiement indépendant et une sécurité renforcée pour chaque domaine métier du système DMS.** 🚀
