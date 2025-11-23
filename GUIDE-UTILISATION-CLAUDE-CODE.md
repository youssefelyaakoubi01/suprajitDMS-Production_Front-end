# Guide d'Utilisation - CLAUDE.md avec Claude Code

## 🎯 Objectif
Le fichier `CLAUDE.md` contient toutes les instructions nécessaires pour que **Claude Code** génère votre application **DMS Production** complète avec:
- Angular v19
- PrimeNG v19
- Template Sakai
- Architecture complète
- Tous les composants UI/UX

## 📝 Comment Utiliser avec Claude Code

### Méthode 1: Copier-Coller Direct (Recommandé)

1. **Ouvrir Claude Code** (VS Code)
2. **Créer un nouveau dossier** pour votre projet:
   ```bash
   mkdir dms-production-app
   cd dms-production-app
   ```

3. **Placer le fichier CLAUDE.md** dans le dossier racine

4. **Ouvrir Claude Code** et taper:
   ```
   Lis le fichier CLAUDE.md et génère l'application complète DMS Production en suivant toutes les instructions. Commence par créer la structure de base, puis le dashboard, puis les autres modules.
   ```

5. **Claude Code va**:
   - Lire toutes les instructions
   - Créer la structure Angular
   - Installer les dépendances nécessaires
   - Générer tous les composants
   - Configurer le routing
   - Créer les services
   - Appliquer le thème personnalisé

### Méthode 2: Instructions Étape par Étape

Si vous voulez contrôler chaque étape, utilisez ces prompts dans l'ordre:

#### Étape 1: Setup Initial
```
Lis CLAUDE.md et crée la structure de base de l'application Angular avec:
- Configuration du projet Angular v19
- Installation de PrimeNG v19
- Structure des dossiers (core, shared, features, layout)
- Configuration du routing
- Setup des models TypeScript
```

#### Étape 2: Layout
```
Génère les composants de layout selon CLAUDE.md:
- app.layout.component (conteneur principal)
- app.sidebar.component (navigation latérale)
- app.topbar.component (header)
- Menu avec les 10 sections
- Thème personnalisé avec les couleurs définies
```

#### Étape 3: Dashboard
```
Crée le Dashboard component complet selon CLAUDE.md:
- 4 KPI cards (Output, Efficiency, Scrap, Downtime)
- Table des lignes de production
- Charts (Output/Hour et Downtime Analysis)
- Auto-refresh toutes les 5 secondes
- Service dashboard avec appels API
```

#### Étape 4: Production Monitoring
```
Génère le Production component selon CLAUDE.md:
- Formulaire shift information
- Section output tracking
- Team assignment avec table employés
- Downtime tracking
- Service production avec CRUD operations
```

#### Étape 5: Autres Modules
```
Crée les modules restants selon CLAUDE.md:
- Inventory (gestion stock)
- HR (employés et qualifications)
- Quality (défauts et contrôle qualité)
- Maintenance (tickets et downtime)
- KPI (indicateurs)
- Lessons Learned
```

## 🔧 Configuration Après Génération

### 1. Variables d'Environnement
Mettre à jour `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://votre-api-url/api'  // ⬅️ MODIFIER ICI
};
```

### 2. Lancer l'Application
```bash
npm install
ng serve
```

Ouvrir: `http://localhost:4200`

### 3. Vérifications
- ✅ La sidebar s'affiche avec les 10 sections
- ✅ Le dashboard charge les KPIs
- ✅ Les charts s'affichent
- ✅ La navigation fonctionne
- ✅ Le thème personnalisé est appliqué

## 📋 Structure Générée

```
dms-production-app/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/          # ✅ Tous les interfaces TypeScript
│   │   │   ├── services/        # ✅ Services API
│   │   │   ├── guards/          # ✅ Auth guards
│   │   │   └── interceptors/    # ✅ HTTP interceptors
│   │   ├── shared/              # ✅ Composants réutilisables
│   │   ├── features/
│   │   │   ├── dashboard/       # ✅ Dashboard complet
│   │   │   ├── production/      # ✅ Production monitoring
│   │   │   ├── inventory/       # ✅ Gestion inventory
│   │   │   ├── hr/              # ✅ RH et employés
│   │   │   ├── quality/         # ✅ Qualité et défauts
│   │   │   ├── maintenance/     # ✅ Maintenance
│   │   │   ├── kpi/             # ✅ KPIs et indicateurs
│   │   │   └── lessons/         # ✅ Lessons learned
│   │   ├── layout/              # ✅ Layout components
│   │   └── app-routing.module.ts
│   ├── assets/
│   │   └── layout/
│   │       └── styles/
│   │           └── custom-theme.scss  # ✅ Thème personnalisé
│   └── environments/
└── package.json
```

## 🎨 Personnalisation du Thème

Le fichier `custom-theme.scss` sera généré avec vos couleurs:
- Primary Blue: #2563EB
- Success Green: #10B981
- Warning Yellow: #F59E0B
- Danger Red: #EF4444

Pour modifier les couleurs, éditez les variables CSS dans:
`src/assets/layout/styles/theme/custom-theme.scss`

## 🔗 API Backend

Le code généré attend ces endpoints:

### Dashboard
- GET `/api/dashboard/kpis`
- GET `/api/dashboard/production-lines`
- GET `/api/dashboard/output-hour`
- GET `/api/dashboard/downtime-analysis`

### Production
- GET `/api/production/hourly`
- POST `/api/production/hourly`
- GET `/api/production/parts`
- GET `/api/production/projects`

### Downtime
- GET `/api/downtime`
- POST `/api/downtime`
- GET `/api/downtime/problems`

### Employees
- GET `/api/employees`
- POST `/api/employees/{id}/assign`

*(Liste complète dans CLAUDE.md)*

## 📊 Composants PrimeNG Utilisés

- ✅ `p-table` - Tables de données
- ✅ `p-card` - Cartes de contenu
- ✅ `p-chart` - Graphiques
- ✅ `p-dropdown` - Sélections
- ✅ `p-calendar` - Dates
- ✅ `p-inputNumber` - Nombres
- ✅ `p-button` - Boutons
- ✅ `p-dialog` - Modales
- ✅ `p-toast` - Notifications
- ✅ `p-tag` - Badges
- ✅ `p-autoComplete` - Recherche
- ✅ Et 15+ autres composants

## ⚡ Fonctionnalités Clés Générées

### Dashboard
- ✅ 4 KPI cards avec statuts colorés
- ✅ Liste des lignes de production en temps réel
- ✅ Charts Output/Hour
- ✅ Charts Downtime Analysis
- ✅ Auto-refresh toutes les 5 secondes
- ✅ Loading states
- ✅ Error handling

### Production
- ✅ Sélection shift/date/project/part
- ✅ Tracking output hourly
- ✅ Assignment équipe/workstation
- ✅ Photos employés
- ✅ Création tickets downtime
- ✅ Métriques en temps réel

### Inventory
- ✅ Liste des parts avec stock
- ✅ Entrée/sortie de stock
- ✅ Gestion des locations
- ✅ Scan barcode

### Quality
- ✅ Enregistrement défauts
- ✅ Charts Pareto
- ✅ Taux de scrap
- ✅ PPM tracking

### Et tous les autres modules...

## 🐛 Troubleshooting

### Problème: "Cannot find module 'primeng/...'"
**Solution**: 
```bash
npm install primeng@19 primeicons primeflex
```

### Problème: "Chart.js not found"
**Solution**: 
```bash
npm install chart.js
```

### Problème: Styles ne s'appliquent pas
**Solution**: Vérifier dans `angular.json` que les styles sont bien importés:
```json
"styles": [
  "node_modules/primeng/resources/themes/lara-light-blue/theme.css",
  "node_modules/primeng/resources/primeng.min.css",
  "node_modules/primeicons/primeicons.css",
  "node_modules/primeflex/primeflex.css",
  "src/assets/layout/styles/custom-theme.scss",
  "src/styles.scss"
]
```

### Problème: API calls échouent
**Solution**: Vérifier que `apiUrl` est correct dans `environment.ts`

## 📱 Responsive Design

L'application est responsive grâce à PrimeFlex:
- **Desktop**: Sidebar expanded (256px)
- **Laptop**: Sidebar expanded
- **Tablet**: Sidebar collapsed (80px)
- **Mobile**: Sidebar drawer

## 🔐 Authentification

Le code inclut:
- ✅ Auth guard sur les routes
- ✅ Auth interceptor pour JWT
- ✅ Auth service avec login/logout
- ✅ Stockage sécurisé du token

À configurer selon votre backend.

## 📦 Déploiement

### Development
```bash
ng serve
```

### Production Build
```bash
ng build --configuration production
```

Les fichiers seront dans `dist/dms-production-app/`

### Docker (optionnel)
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/dms-production-app /usr/share/nginx/html
EXPOSE 80
```

## 🎓 Prochaines Étapes

1. ✅ Générer l'application avec Claude Code
2. ✅ Configurer l'URL de votre API
3. ✅ Tester chaque module
4. ✅ Personnaliser les couleurs si nécessaire
5. ✅ Ajouter vos propres fonctionnalités
6. ✅ Connecter à votre backend
7. ✅ Déployer en production

## 💡 Conseils

- **Commencez par le Dashboard** pour valider que tout fonctionne
- **Testez l'auto-refresh** pour le monitoring temps réel
- **Vérifiez les appels API** avec les DevTools
- **Personnalisez progressivement** selon vos besoins
- **Documentez vos modifications** pour l'équipe

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez que toutes les dépendances sont installées
2. Consultez les logs dans la console
3. Vérifiez la documentation PrimeNG: https://primeng.org
4. Vérifiez la documentation Angular: https://angular.io

---

**Bon développement! 🚀**

*Ce guide vous permet de générer une application DMS Production complète, moderne et prête pour la production en utilisant Claude Code et le fichier CLAUDE.md.*
