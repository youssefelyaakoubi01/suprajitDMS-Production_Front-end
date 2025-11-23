# 🚀 GUIDE RAPIDE - Génération DMS avec Claude Code

## 📦 Fichiers Disponibles

### 1. **CLAUDE-DMS-PRODUCTION.md** ⭐ UTILISEZ CE FICHIER
[Télécharger](computer:///mnt/user-data/outputs/CLAUDE-DMS-PRODUCTION.md)

**C'est le fichier PRINCIPAL à donner à Claude Code pour générer DMS-Production**

✅ Application séparée et autonome  
✅ Système d'authentification JWT complet  
✅ 6 rôles utilisateurs avec permissions granulaires  
✅ Dashboard avec filtrage par rôle  
✅ Production tracking avec contrôle d'accès  
✅ Angular v19 + PrimeNG v19  
✅ Prêt pour la production  

---

### 2. **DMS-ECOSYSTEM-SEPARATION.md** 📖 RÉFÉRENCE
[Télécharger](computer:///mnt/user-data/outputs/DMS-ECOSYSTEM-SEPARATION.md)

Document expliquant:
- Séparation des 7 applications DMS
- Matrice complète des rôles et accès
- Architecture multi-applications
- Ordre de développement recommandé
- Communication entre applications

---

### 3. **CLAUDE.md** 📚 VERSION COMPLÈTE (Alternative)
[Télécharger](computer:///mnt/user-data/outputs/CLAUDE.md)

Version monolithique avec toutes les fonctionnalités dans une seule app.  
⚠️ Utiliser seulement si vous ne voulez PAS séparer les applications.

---

## 🎯 Comment Utiliser avec Claude Code

### Option 1: Application Séparée DMS-Production (RECOMMANDÉ) ⭐

```bash
# 1. Créer le dossier projet
mkdir dms-production
cd dms-production

# 2. Placer le fichier
# Copier CLAUDE-DMS-PRODUCTION.md dans le dossier

# 3. Ouvrir Claude Code (VS Code)
code .

# 4. Dans Claude Code, taper:
```

**Prompt à donner**:
```
Génère l'application DMS-Production complète selon le fichier CLAUDE-DMS-PRODUCTION.md.

CONTEXTE:
- C'est la première application d'un écosystème DMS modulaire
- Les autres apps (RH, Inventory, Quality, Maintenance, KPI) seront séparées
- Focus sur le monitoring de production en temps réel

PRIORITÉS:
1. Système d'authentification JWT complet
2. Role-Based Access Control (RBAC) avec 6 rôles
3. Dashboard temps réel avec auto-refresh
4. Production tracking (shift, output, downtime)
5. Team assignment (LINE_LEADER+)
6. Permissions conditionnelles sur chaque fonctionnalité
7. Guards, interceptors, directives hasPermission/hasRole

RÔLES À IMPLÉMENTER:
- OPERATOR (créer production, créer tickets DT)
- LINE_LEADER (+ modifier 2h, assigner équipe)
- TEAM_LEADER (+ modifier 4h, exporter)
- PRODUCTION_SUPERVISOR (+ modifier shift, vue globale)
- PRODUCTION_MANAGER (tout + analytics)
- ADMIN (configuration système)

TECH STACK:
- Angular v19
- PrimeNG v19
- JWT Authentication
- Role-Based Access Control
- Guards et Interceptors
- TypeScript strict

Commence par l'authentification et les guards, puis le dashboard, puis la production.
Génère tout le code prêt à être compilé et déployé.
```

---

### Option 2: Application Monolithique (Alternative)

Si vous préférez tout dans une seule app:

```bash
mkdir dms-app
cd dms-app
# Placer CLAUDE.md
```

**Prompt**: 
```
Lis le fichier CLAUDE.md et génère l'application complète avec tous les modules.
Utilise Angular v19 + PrimeNG v19 + template Sakai.
```

---

## 👥 Rôles et Permissions - Résumé Rapide

### Opérateur (OPERATOR)
✅ Voir dashboard (sa ligne)  
✅ Créer production  
✅ Créer tickets downtime  
❌ Modifier, supprimer  
❌ Assigner équipe  

### Chef d'Équipe (LINE_LEADER)
✅ Tout de l'opérateur  
✅ Modifier production (2h max)  
✅ Assigner/retirer employés  
✅ Gérer tickets downtime  
✅ Voir rapports (sa ligne)  

### Team Leader (TEAM_LEADER)
✅ Tout du Line Leader  
✅ Modifier production (4h max)  
✅ Vue multi-lignes (son équipe)  
✅ Exporter données  

### Superviseur Production (PROD_SUPERVISOR)
✅ Vue globale toutes lignes  
✅ Modifier shift complet  
✅ Supprimer données  
✅ Tous les rapports  

### Manager Production (PROD_MANAGER)
✅ Accès total  
✅ Analytics avancés  
✅ Configuration  

### Administrateur (ADMIN)
✅ Tout  
✅ Gestion utilisateurs  
✅ Configuration système  

---

## 📊 Ce Qui Sera Généré

```
dms-production/
├── src/app/
│   ├── core/
│   │   ├── models/
│   │   │   ├── user.model.ts          ✅ User, Role, Permission
│   │   │   ├── production.model.ts    ✅ HourlyProd, Output, Part
│   │   │   └── downtime.model.ts      ✅ Downtime, Problems
│   │   ├── services/
│   │   │   ├── auth.service.ts        ✅ Login, JWT, Session
│   │   │   ├── permission.service.ts  ✅ Vérif permissions
│   │   │   └── api.service.ts         ✅ HTTP base
│   │   ├── guards/
│   │   │   ├── auth.guard.ts          ✅ Protection routes
│   │   │   └── role.guard.ts          ✅ Vérif rôles
│   │   └── interceptors/
│   │       ├── auth.interceptor.ts    ✅ Ajout JWT token
│   │       └── error.interceptor.ts   ✅ Gestion erreurs
│   │
│   ├── shared/
│   │   ├── directives/
│   │   │   ├── has-permission.directive.ts  ✅ *appHasPermission
│   │   │   └── has-role.directive.ts        ✅ *appHasRole
│   │   └── components/
│   │       └── unauthorized/                ✅ Page 403
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   └── login/                 ✅ Login component
│   │   ├── dashboard/
│   │   │   ├── dashboard.component    ✅ KPIs + Charts
│   │   │   └── dashboard.service      ✅ Filtrage par rôle
│   │   ├── production/
│   │   │   ├── production.component   ✅ Tracking + Team
│   │   │   └── production.service     ✅ CRUD avec permissions
│   │   └── reports/                   ✅ Rapports (TL+)
│   │
│   └── layout/
│       ├── app.sidebar.component      ✅ Navigation
│       └── app.topbar.component       ✅ User menu + Logout
│
└── package.json
```

---

## 🔐 Fonctionnalités Clés Générées

### ✅ Authentification
- Login avec username/password
- JWT token (15 min)
- Refresh token (7 jours)
- Logout
- Session persistante

### ✅ Contrôle d'Accès
- Guards sur routes (auth + rôle)
- Interceptor JWT automatique
- Directive `*appHasPermission`
- Directive `*appHasRole`
- Filtrage données par rôle

### ✅ Dashboard
- 4 KPI cards (Output, Efficiency, Scrap, Downtime)
- Table production lines (filtrée par rôle)
- Charts Output/Hour et Downtime
- Auto-refresh 5 secondes
- Bouton Export (TL+)

### ✅ Production Tracking
- Formulaire shift/date/project/part
- Saisie output (tous)
- Modification output (avec restriction temps)
- Suppression output (SUPERVISOR+)
- Assignment équipe (LINE_LEADER+)
- Photos employés
- Qualifications visibles

### ✅ Downtime Tracking
- Création ticket (tous)
- Modification ticket (créateur ou LL+)
- Clôture ticket (LL+)
- Liste filtrable
- Temps d'intervention

### ✅ Reports
- Shift report (TL+)
- Daily report (TL+)
- Export Excel/PDF (TL+)

---

## ⚡ Démarrage Rapide

```bash
# Après génération par Claude Code

# 1. Installer dépendances
npm install

# 2. Configuration API
# Éditer src/environments/environment.ts
# Modifier apiUrl vers votre backend

# 3. Lancer l'app
ng serve

# 4. Ouvrir navigateur
http://localhost:4200

# 5. Se connecter avec un utilisateur test
```

---

## 🎨 Personnalisation

### Changer les Couleurs
Fichier: `src/assets/layout/styles/theme/custom-theme.scss`
```scss
:root {
  --primary-color: #2563EB;      // ⬅️ Changer ici
  --success-color: #10B981;
  --warning-color: #F59E0B;
  --danger-color: #EF4444;
}
```

### Ajouter un Rôle
1. `src/app/core/models/user.model.ts` → Ajouter dans `UserRole` enum
2. `src/app/core/models/permissions.model.ts` → Définir permissions
3. `src/app/core/guards/role.guard.ts` → Ajouter dans matrice
4. Backend → Ajouter dans table `UserRoles`

### Ajouter une Fonctionnalité
1. Créer model dans `core/models/`
2. Créer service dans `core/services/`
3. Créer component dans `features/`
4. Ajouter route dans `app-routing.module.ts`
5. Ajouter permissions dans `permission.service.ts`

---

## 📞 Prochaines Étapes

### Après DMS-Production

1. **Phase 2**: DMS-RH (3-4 semaines)
   - Gestion employés complète
   - Formations et qualifications
   - Attendance tracking

2. **Phase 3**: DMS-Inventory (3-4 semaines)
   - Catalogue parts
   - Stock movements
   - Inventaire physique

3. **Phase 4**: DMS-Quality (3 semaines)
   - Defects tracking
   - Scrap management
   - Quality reports

4. **Phases suivantes**: Maintenance, KPI, Lessons

Chaque application sera générée avec la même structure:
- Auth centralisée (JWT)
- Rôles spécifiques au domaine
- Architecture Angular + PrimeNG
- Design cohérent

---

## 💡 Conseils

✅ **Commencez par DMS-Production** - C'est le cœur du système  
✅ **Testez l'authentification en premier** - Base de tout  
✅ **Vérifiez les permissions** - Créez des users de test pour chaque rôle  
✅ **Documentez les changements** - Pour faciliter la maintenance  
✅ **Formez les utilisateurs** - Sur les rôles et permissions  

---

## 📚 Documentation Complète

- **CLAUDE-DMS-PRODUCTION.md**: Instructions détaillées pour Claude Code
- **DMS-ECOSYSTEM-SEPARATION.md**: Architecture complète de l'écosystème
- **CLAUDE.md**: Version monolithique (alternative)
- **DMS-UI-Design-Specification.md**: Spécifications design
- **DMS-Visual-Component-Guide.md**: Guide visuel composants

---

**Vous êtes prêt à générer votre application DMS-Production avec Claude Code ! 🚀**

Utilisez **CLAUDE-DMS-PRODUCTION.md** avec le prompt fourni ci-dessus.
