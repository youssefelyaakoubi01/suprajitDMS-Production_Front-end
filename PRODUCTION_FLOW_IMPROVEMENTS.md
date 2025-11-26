# Améliorations du Flux Production Entry

## 🎯 Problèmes Identifiés

### 1. Flux illogique pour Downtime
- **Problème actuel:** Le downtime (Step 4) vient AVANT le bouton "Save Production"
- **Impact:** L'utilisateur ne peut pas réellement créer de downtime avant d'avoir sauvegardé la production (le code vérifie `currentHourlyProductionId`)
- **Confusion:** Deux endroits pour saisir downtime (Step 4 + Dialog)

### 2. Manque de contexte temporel
- Impossible d'ajouter un downtime à une heure passée
- Pas de vue d'ensemble des downtimes par heure
- Hourly History table cachée en bas de page

### 3. Workflow ne reflète pas la réalité
- En production réelle, on travaille **heure par heure**
- On devrait pouvoir gérer plusieurs heures dans la même session
- Chaque heure peut avoir plusieurs downtimes

---

## ✅ PROPOSITION 1: Flux Linéaire avec Downtime Post-Production (RECOMMANDÉ)

### Nouveau flux proposé:

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Real-time Summary Cards (toujours visible en haut)      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📋 HOURLY PRODUCTION TRACKER                               │
│  Table avec toutes les heures du shift en cours             │
│  [Hour] [Time] [Output] [Target] [Eff%] [Downtime] [Actions]│
│    H1   06-07    52      53      98%      5min    [📝 ⏱️]   │
│    H2   07-08    -       53       -        -      [▶️ Start] │
│  Actions: 📝 Edit Production | ⏱️ Add Downtime              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 1: 🎯 Shift Setup (une seule fois par session)        │
│  - Shift, Date, Project, Production Line, Part Number       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 2: 👥 Team Assignment (une seule fois par shift)      │
│  - Scan employees                                            │
│  - Production actors (Line Leader, Quality, Maintenance)    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 3: ⏰ Select Hour to Record                           │
│  Dropdown: [Select Hour ▼] ou Auto-détection heure actuelle │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 4: 📦 Production Results (pour l'heure sélectionnée)  │
│  - Output: [___] / Target: 53                               │
│  - Scrap: [___] / Target: 5                                 │
│  - Efficiency: 98% | Scrap Rate: 2.5%                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 5: ✅ Review & Save Hourly Production                 │
│  Review summary + [💾 Save Production]                      │
└─────────────────────────────────────────────────────────────┘

  ↓ Après save production

┌─────────────────────────────────────────────────────────────┐
│  ✅ Production Saved! Hour H3 recorded successfully         │
│                                                              │
│  ⏱️ Add Downtime for this hour?                             │
│  [+ Add Downtime Ticket]  [⏭️ Continue to Next Hour]       │
└─────────────────────────────────────────────────────────────┘
```

### Avantages:
✅ **Flux linéaire et logique:** Setup → Team → Heure → Métriques → Save → Downtime (optionnel)
✅ **Downtime après production:** On ne peut créer de downtime qu'après avoir un ID de production
✅ **Pas de duplication:** Un seul formulaire de downtime (Dialog uniquement)
✅ **Hourly Tracker visible:** Vue d'ensemble des heures en haut
✅ **Multi-heures support:** Peut enregistrer plusieurs heures dans la même session

---

## ✅ PROPOSITION 2: Workflow Par Heure (Le Plus Réaliste)

### Concept: Chaque heure est un mini-workflow complet

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Real-time Summary Cards                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🎯 SHIFT SETUP (une fois par shift)                        │
│  Shift: Morning ☀️ | Date: 25/11/2025 | Project: SUPRAJIT  │
│  Line: Line 01 | Part: ABC-12345                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  👥 SHIFT TEAM (une fois par shift)                         │
│  Team Members: 12 assigned | Line Leader: John Doe          │
│  [View Team Details]                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⏰ HOURLY PRODUCTION TRACKER                               │
│                                                              │
│  Hour │ Time    │ Status      │ Output │ Target │ Eff% │ DT │ Actions        │
│  ─────┼─────────┼─────────────┼────────┼────────┼──────┼────┼────────────────│
│  H1   │ 06-07   │ ✅ Complete │   52   │   53   │ 98%  │ 5m │ [👁️ View] [⏱️] │
│  H2   │ 07-08   │ ✅ Complete │   48   │   53   │ 91%  │ 0m │ [👁️ View] [⏱️] │
│  H3   │ 08-09   │ ✅ Complete │   55   │   53   │ 104% │ 0m │ [👁️ View] [⏱️] │
│  H4   │ 09-10   │ 🟡 Current  │   --   │   53   │  --  │ -- │ [📝 Enter]     │
│  H5   │ 10-11   │ ⚪ Pending  │   --   │   53   │  --  │ -- │ [▶️ Start]     │
│  H6   │ 11-12   │ ⚪ Pending  │   --   │   53   │  --  │ -- │                │
│                                                              │
│  États: ⚪ Not Started | 🟡 In Progress | ✅ Completed       │
│  Actions:                                                    │
│   - 📝 Enter Production: Saisir output/scrap pour l'heure   │
│   - ⏱️ Add Downtime: Créer ticket downtime                  │
│   - 👁️ View: Voir détails de l'heure                        │
└─────────────────────────────────────────────────────────────┘

  ↓ Clic sur "Enter Production" pour H4 → Ouvre un panneau/modal

┌─────────────────────────────────────────────────────────────┐
│  📝 ENTER PRODUCTION - HOUR 4 (09:00 - 10:00)              │
│                                                              │
│  📦 Production Metrics:                                     │
│     Output:    [___] / Target: 53                           │
│     Scrap:     [___] / Target: 5                            │
│     Efficiency: --% | Scrap Rate: --%                       │
│                                                              │
│  ⏱️ Downtime (Optional):                                    │
│     [ ] This hour had downtime                              │
│     ├── Duration: [___] minutes                             │
│     ├── Problem: [Select problem ▼]                         │
│     └── Description: [____________]                         │
│                                                              │
│  [Cancel] [💾 Save Hour Production]                         │
└─────────────────────────────────────────────────────────────┘

  ↓ Après save → Retour à Hourly Tracker avec H4 = ✅ Complete
```

### Avantages:
✅ **Reflète le workflow réel:** On travaille heure par heure
✅ **Vue d'ensemble:** Toutes les heures du shift visibles
✅ **Flexibilité:** Peut saisir n'importe quelle heure (pas forcément dans l'ordre)
✅ **Downtime intégré:** Downtime dans le même formulaire que la production
✅ **État clair:** Visibilité immédiate des heures complètes/en cours/à faire
✅ **Multi-downtime:** Bouton séparé pour ajouter des downtimes supplémentaires

---

## ✅ PROPOSITION 3: Amélioration Minimale (Quick Fix)

Si on veut garder le flux actuel mais l'améliorer rapidement:

### Changements:
1. **Supprimer Step 4 Downtime du formulaire principal**
2. **Déplacer Hourly History Table après Step 1** (plus visible)
3. **Ajouter colonne "Downtime" dans Hourly History Table**
4. **Ajouter bouton "⏱️ Add Downtime" sur chaque ligne d'historique**
5. **Garder uniquement le Dialog pour créer downtime**
6. **Après save production → Message: "Production saved! Add downtime for this hour?"**

### Nouveau flux:
```
1. Summary Cards
2. STEP 1: Shift Setup
3. 📋 HOURLY HISTORY TABLE (avec bouton Add Downtime par ligne)
4. STEP 2: Team Assignment
5. STEP 3: Production Results
6. STEP 4: Review & Save
   ↓
7. Message post-save: "Add downtime?" → Ouvre Dialog si oui
```

### Avantages:
✅ **Changement minimal** (juste réorganiser + supprimer Step 4)
✅ **Résout le problème principal** (downtime après save)
✅ **Garde la structure actuelle**

---

## 🎯 Recommandation Finale

**Je recommande la PROPOSITION 2 (Workflow Par Heure)** car:

1. ✅ C'est le plus proche de la réalité terrain
2. ✅ Les opérateurs travaillent heure par heure
3. ✅ Vue d'ensemble complète du shift
4. ✅ Downtime bien intégré au contexte
5. ✅ Peut gérer plusieurs heures dans une session
6. ✅ États clairs (Not Started, In Progress, Completed)

**Mais si le temps manque:** Implémenter **PROPOSITION 3** (Quick Fix) pour résoudre rapidement les problèmes critiques.

---

## 📝 Détails d'Implémentation - PROPOSITION 2

### Structure de données:

```typescript
interface HourlyProductionState {
  hour: number;
  timeRange: string; // "09:00 - 10:00"
  status: 'not_started' | 'in_progress' | 'completed';
  output: number | null;
  target: number;
  efficiency: number | null;
  scrap: number | null;
  downtimes: Downtime[]; // Array de downtimes
  totalDowntime: number; // Somme des durées
  hourlyProductionId: number | null; // ID après save
}

interface ShiftProductionSession {
  shift: Shift;
  date: Date;
  project: Project;
  line: ProductionLine;
  part: Part;
  team: EmployeeWithAssignment[];
  actors: {
    lineLeader: string;
    qualityAgent: string;
    maintenanceTech: string;
    pqc: string;
  };
  hours: HourlyProductionState[]; // 8 heures pour un shift normal
}
```

### Workflow TypeScript:

```typescript
// 1. Setup Shift (une fois)
setupShift(shift, date, project, line, part) {
  this.session = {
    shift, date, project, line, part,
    team: [],
    actors: {},
    hours: this.generateShiftHours(shift) // Génère 8 HourlyProductionState
  };
}

// 2. Assign Team (une fois)
assignTeam(employees, actors) {
  this.session.team = employees;
  this.session.actors = actors;
}

// 3. Enter Production for specific hour
enterHourProduction(hourIndex: number) {
  this.selectedHour = this.session.hours[hourIndex];
  this.showHourProductionDialog = true;
}

// 4. Save Hour Production
saveHourProduction(hourIndex: number, output: number, scrap: number, downtime?: Downtime) {
  const hour = this.session.hours[hourIndex];

  // Save to backend
  this.productionService.saveHourlyProduction({
    ...this.session,
    hour: hour.hour,
    output, scrap
  }).subscribe(response => {
    hour.hourlyProductionId = response.id;
    hour.output = output;
    hour.scrap = scrap;
    hour.efficiency = (output / hour.target) * 100;
    hour.status = 'completed';

    // Si downtime inclus
    if (downtime) {
      this.addDowntimeToHour(hourIndex, downtime);
    }
  });
}

// 5. Add Downtime to existing hour
addDowntimeToHour(hourIndex: number, downtime: Downtime) {
  const hour = this.session.hours[hourIndex];

  if (!hour.hourlyProductionId) {
    this.messageService.add({
      severity: 'warn',
      detail: 'Please save production for this hour first'
    });
    return;
  }

  this.productionService.saveDowntime({
    ...downtime,
    Id_HourlyProd: hour.hourlyProductionId
  }).subscribe(() => {
    hour.downtimes.push(downtime);
    hour.totalDowntime = hour.downtimes.reduce((sum, dt) => sum + dt.Total_Downtime, 0);
  });
}
```

### UI Components:

```
production-workflow.component.ts        // Composant principal
├── shift-setup-card.component.ts       // Step 1: Setup
├── team-assignment-card.component.ts   // Step 2: Team
├── hourly-tracker-table.component.ts   // Table principale
└── hour-production-dialog.component.ts // Dialog pour saisie heure
```

---

## 🚀 Plan d'Action

### Phase 1: Quick Fixes (1-2 heures)
- [ ] Supprimer Step 4 Downtime du formulaire principal
- [ ] Déplacer Hourly History après Step 1
- [ ] Garder uniquement Dialog pour downtime
- [ ] Ajouter message post-save: "Add downtime?"

### Phase 2: Refonte Complète (1 journée)
- [ ] Implémenter ShiftProductionSession model
- [ ] Créer Hourly Tracker Table component
- [ ] Créer Hour Production Dialog component
- [ ] Implémenter états (not_started, in_progress, completed)
- [ ] Gérer multi-downtimes par heure
- [ ] Tests et validation

---

## 📸 Mockups Conceptuels

### Hourly Tracker Table (Proposition 2):

```
┌────────────────────────────────────────────────────────────────────┐
│ ⏰ HOURLY PRODUCTION TRACKER - MORNING SHIFT                      │
│ Project: SUPRAJIT | Line: Line 01 | Part: ABC-123                 │
├────────────────────────────────────────────────────────────────────┤
│ Hour │ Time    │ Status      │ Output│ Tgt │ Eff  │ Scrap│ DT   │ Actions         │
│──────┼─────────┼─────────────┼───────┼─────┼──────┼──────┼──────┼─────────────────│
│ 🔵 H1│ 06-07   │ ✅ Complete │   52  │  53 │ 98%  │   2  │  5m  │ [👁️][📝][⏱️]  │
│ 🔵 H2│ 07-08   │ ✅ Complete │   48  │  53 │ 91%  │   3  │  0m  │ [👁️][📝][⏱️]  │
│ 🔵 H3│ 08-09   │ ✅ Complete │   55  │  53 │ 104% │   1  │  0m  │ [👁️][📝][⏱️]  │
│ 🟡 H4│ 09-10   │ 🟡 Current  │   --  │  53 │  --  │  --  │  --  │ [📝 Enter]      │
│ ⚪ H5│ 10-11   │ ⚪ Pending  │   --  │  53 │  --  │  --  │  --  │ [▶️ Start]      │
│ ⚪ H6│ 11-12   │ ⚪ Pending  │   --  │  53 │  --  │  --  │  --  │                 │
│ ⚪ H7│ 12-13   │ ⚪ Pending  │   --  │  53 │  --  │  --  │  --  │                 │
│ ⚪ H8│ 13-14   │ ⚪ Pending  │   --  │  53 │  --  │  --  │  --  │                 │
├────────────────────────────────────────────────────────────────────┤
│ Shift Total: 155 / 424 (37%) | 6 pieces scrap | 5 min downtime    │
└────────────────────────────────────────────────────────────────────┘

Actions:
- 👁️ View: Affiche détails de l'heure
- 📝 Enter/Edit: Ouvre dialog pour saisir/modifier production
- ⏱️ Add Downtime: Ouvre dialog downtime
- ▶️ Start: Marque l'heure comme "In Progress"
```

### Hour Production Dialog:

```
┌─────────────────────────────────────────────────────────┐
│ 📝 ENTER PRODUCTION - HOUR 4                           │
│ Time: 09:00 - 10:00 | Morning Shift | 25/11/2025       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 📦 Production Metrics                                   │
│                                                          │
│   Output:                 Scrap:                        │
│   ┌─────┐ / 53           ┌─────┐ / 5                   │
│   │  52 │                │  2  │                        │
│   └─────┘                └─────┘                        │
│                                                          │
│   Efficiency: 98%        Scrap Rate: 2.5%               │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ ⏱️ Downtime (Optional)                                  │
│                                                          │
│   ☐ This hour had downtime                              │
│                                                          │
│   When checked:                                          │
│   Duration:     [___10___] minutes                      │
│   Problem:      [Mechanical Issue ▼]                    │
│   Description:  [___________________________]           │
│                 [___________________________]           │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│              [Cancel] [💾 Save Hour Production]         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Conclusion

Le flux actuel a des problèmes d'organisation logique, notamment:
1. Downtime avant production save (impossible techniquement)
2. Duplication de formulaires
3. Manque de contexte temporel

**Solution recommandée:** Implémenter la Proposition 2 (Workflow Par Heure) qui reflète fidèlement le travail terrain et résout tous les problèmes identifiés.

**Alternative rapide:** Proposition 3 (Quick Fix) pour corriger les bugs critiques en quelques heures.
