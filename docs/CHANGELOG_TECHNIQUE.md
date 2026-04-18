# Changelog Technique — AgroVision (app.html)
## ArtiAirLink · Section Drone & Innovation

> Ce fichier trace **chaque modification logicielle** apportée à AgroVision.
> Format : date décroissante, une entrée par session de développement.
> Toujours compléter ce fichier avant tout commit GitHub.

---

## [Phase 2A] — 18 Avril 2026
### Moteur Multi-Indices RGB (ExG, GRVI, GLI, TGI + sélecteur UI)

**Auteur :** Jonathan Ots + Claude Sonnet 4.6  
**Fichiers modifiés :** `app.html`  
**Lignes affectées :** CSS +~30 lignes, HTML +~25 lignes, JS +~100 lignes  
**Commit GitHub :** *(à effectuer)*

---

### A. Nouvelles Constantes JavaScript

#### `INDEX_DEF` (objet, lignes ~845–853)
Définition scientifique des 5 indices RGB implémentés. Chaque entrée contient :
- `label` : nom court affiché dans l'UI
- `full` : nom complet avec auteur et année (traçabilité scientifique)
- `thresholds` : seuils génériques `{ excellent, good, stress, severe }` normalisés dans [-1, +1]

```javascript
const INDEX_DEF = {
  VARI: { label:'VARI', full:'VARI · Gitelson 2002',             thresholds:{...} },
  ExG:  { label:'ExG',  full:'Excess Green · Woebbecke 1995',    thresholds:{...} },
  GRVI: { label:'GRVI', full:'Green-Red VI · Tucker 1979',       thresholds:{...} },
  GLI:  { label:'GLI',  full:'Green Leaf Index · Louhaichi 2001',thresholds:{...} },
  TGI:  { label:'TGI',  full:'Triangular Greenness · Hunt 2011', thresholds:{...} },
};
```

**Seuils retenus :**
| Indice | Excellent | Bon | Stress | Sévère |
|---|---|---|---|---|
| VARI | > 0.18 | > 0.08 | > 0.01 | > −0.05 |
| ExG | > 0.18 | > 0.09 | > 0.02 | > −0.03 |
| GRVI | > 0.16 | > 0.07 | > 0.01 | > −0.05 |
| GLI | > 0.16 | > 0.07 | > 0.01 | > −0.05 |
| TGI | > 0.12 | > 0.05 | > 0.01 | > −0.03 |

*Justification :* Tous les indices RGB sont normalisés dans [-1, +1]. Les seuils sont cohérents avec la végétation visible saine (valeurs positives > 0.10) vs sol nu ou stress (valeurs proches de 0 ou négatives). Source : Bendig et al. 2015, méta-analyse multi-indices.

---

#### `CROP_BEST_INDEX` (objet, lignes ~854–857)
Table d'auto-sélection de l'indice optimal par culture, basée sur les propriétés spectrales des feuilles :

```javascript
const CROP_BEST_INDEX = {
  mais:'GRVI',   // Feuilles linéaires — GRVI corrèle bien NDVI (Tucker 1979)
  manioc:'GLI',  // Grandes feuilles lobées — GLI stable sur feuilles larges
  ble:'TGI',     // Céréales — TGI = proxy chlorophylle (Hunt 2011)
  riz:'VARI',    // Riz submergé — VARI robuste aux reflets eau
  soja:'GRVI',   // Trifoliées — GRVI bien documenté légumineuses
  cafe:'TGI',    // Feuilles coriaces — TGI détecte carence chlorophylle
  coton:'VARI',  // Sol visible entre rangs — VARI résistant fond de sol
  tomate:'VARI', // → mode fruit si couleur détectée
  banane:'GLI',  // Très grandes feuilles — GLI optimal
  agrumes:'GRVI',// Feuilles cireuses — GRVI performant
  autre:'VARI',  // Défaut sûr, robuste
};
```

---

### B. Nouvelles Fonctions JavaScript

#### `selectIndex(idx)` (lignes ~860–871)
**Rôle :** Change l'indice actif, met à jour l'UI (pills + barres + label).  
**Appelée par :** boutons pills UI (onclick), `setActiveMission()` (auto)

```javascript
function selectIndex(idx) {
  S.selectedIndex = idx;
  // Met à jour les pills (active/inactive)
  // Met à jour les barres (ibr-active)
  // Met à jour le label "Primaire : XXX"
}
```

**Effets secondaires :** aucun — le render loop lit `S.selectedIndex` à chaque frame automatiquement.

---

#### `updateIndexBars(m)` (lignes ~873–887)
**Rôle :** Met à jour les 5 barres de progression dans l'UI avec les valeurs courantes.  
**Appelée par :** `updateAnalysisUI()` (à chaque frame du render loop)

**Logique de la barre :**
- Mapping : valeur dans [-0.6, +0.6] → largeur barre [2%, 98%]
- Couleur : vert (val ≥ 0.08) / orange (val ≥ 0.01) / rouge (val < 0.01)

```javascript
const pct = Math.max(2, Math.min(98, Math.round((val + 0.6) / 1.2 * 100)));
```

*Pourquoi [-0.6, +0.6] comme range d'affichage ?*  
Les valeurs pratiques sur végétation réelle se situent rarement en dehors de [-0.4, +0.5]. Un mapping sur [-0.6, +0.6] donne une barre lisible sans écrêtage excessif.

---

### C. Modifications de `computeMetrics(r, g, b, cropKey)`

**Avant :** Calculait uniquement VARI, retournait un résultat mono-indice.  
**Après :** Calcule 5 indices, utilise l'indice sélectionné par l'utilisateur comme indice primaire.

#### Nouvelles formules ajoutées

Toutes normalisées dans [-1, +1] :

```javascript
// Excess Green (Woebbecke et al., 1995)
const sum  = r + g + b || 1;  // garde-fou division par zéro
const exg  = Math.max(-1, Math.min(1, (2*g - r - b) / sum));

// Green-Red Vegetation Index (Tucker, 1979)
const grvi = (g + r) < 4 ? 0 : Math.max(-1, Math.min(1, (g - r) / (g + r)));

// Green Leaf Index (Louhaichi et al., 2001)
const gli  = (2*g + r + b) < 4 ? 0 : Math.max(-1, Math.min(1, (2*g - r - b) / (2*g + r + b)));

// Triangular Greenness Index (Hunt et al., 2011) — proxy chlorophylle
const tgi  = Math.max(-1, Math.min(1, (g - 0.39*r - 0.61*b) / 255));
```

**Décision de normalisation TGI :**  
Le TGI original de Hunt (2011) est en unités brutes (0–255). Division par 255 pour harmoniser avec les autres indices dans [-1, +1] et permettre un affichage sur la même échelle dans les barres.

**Note guard division par zéro :**  
`|| 1` sur `sum` (ExG) et `< 4` sur `(g+r)` (GRVI) et `(2g+r+b)` (GLI) évitent les NaN sur pixels noirs ou très sombres (zone non éclairée, hors champ).

#### Nouveau retour `allIndices`

```javascript
const allIndices = {
  VARI: +vari.toFixed(4), ExG: +exg.toFixed(4),
  GRVI: +grvi.toFixed(4), GLI: +gli.toFixed(4), TGI: +tgi.toFixed(4),
};
```

*Précision 4 décimales :* suffisant pour distinguer les zones de santé végétale (différences significatives à partir de ±0.01).

#### Logique de sélection d'indice primaire

```javascript
const activeIdx = (S.selectedIndex in allIndices) ? S.selectedIndex : 'VARI';
const idxDef    = INDEX_DEF[activeIdx] || INDEX_DEF.VARI;
// Seuils : spécifiques culture si VARI (existants), génériques si autre indice
const t = activeIdx === 'VARI' ? crop.thresholds : idxDef.thresholds;
```

**Compatibilité backward :**  
Si `S.selectedIndex` est invalide (ex: valeur corrompue), fallback automatique sur VARI. Les cultures fruits (tomate, banane, agrumes) utilisent toujours Hue HSL en mode fruit — ce comportement est inchangé.

---

### D. Nouveau Champ dans l'Objet `S` (State)

```javascript
selectedIndex: 'VARI',  // Valeur par défaut au démarrage
```

Ajouté dans l'objet global `S` (lignes ~600–606).

---

### E. Modifications `updateAnalysisUI(m)`

**Ajout :** appel à `updateIndexBars(m)` juste avant `syncHomeMetrics()`.  
Aucune autre modification — les autres champs du résultat (`ndvi`, `indexUsed`, `indexSub`, etc.) sont inchangés dans leur usage.

---

### F. Modifications `captureReading()`

**Ajout dans l'objet `entry` :**
```javascript
allIndices: m.allIndices,      // Les 5 valeurs au moment de la capture
selectedIndex: S.selectedIndex, // L'indice qui était actif
```

**Pourquoi persister `selectedIndex` par capture ?**  
Permet de reconstruire l'analyse post-session sans ambiguïté : on sait quel indice a généré le score de santé à ce moment précis.

---

### G. Modifications `setActiveMission(id)`

**Avant :**
```javascript
if (m) { S.activeMission = m; LS.set(...); refreshMissionList(); ... }
```

**Après :** Ajout de l'auto-sélection d'indice optimal :
```javascript
selectIndex(CROP_BEST_INDEX[m.cropKey] || 'VARI');
```

**Comportement :** Lorsque l'utilisateur active une mission, l'indice le plus adapté à la culture est automatiquement sélectionné. L'utilisateur peut toujours le changer manuellement via les pills.

---

### H. Modifications `buildReportText()`

Ajout d'une section **"Indices RGB comparatifs"** dans le rapport texte :

```
── Indices RGB comparatifs ──
VARI : 0.2341  (Visible Atmospherically Resistant)
ExG  : 0.1832  (Excess Green)
GRVI : 0.1654  (Green-Red Vegetation Index)
GLI  : 0.1701  (Green Leaf Index)
TGI  : 0.0923  (Triangular Greenness Index)
```

Remplacement de la ligne `NDVI` par `Indice actif` + `Valeur` pour refléter que le rapport inclut l'indice sélectionné, pas forcément NDVI.

---

### I. Modifications `exportCSV()`

**Header avant :**
```
Heure,Mission,Site,Culture,Couleur,Hex,NDVI,Santé%,...
```

**Header après :**
```
Heure,Mission,Site,Culture,Couleur,Hex,Indice,Valeur,VARI,ExG,GRVI,GLI,TGI,Santé%,...
```

Ajout de 7 colonnes : `Indice` (actif), `Valeur` (de l'indice actif), `VARI`, `ExG`, `GRVI`, `GLI`, `TGI`.  
**Rétrocompatibilité :** Les captures existantes (avant cette version) auront des cellules vides pour les nouvelles colonnes — comportement correct en CSV.

---

### J. Nouvelles Classes CSS

| Classe | Utilité |
|---|---|
| `.idx-selector` | Conteneur flex des 5 pills |
| `.idx-pill` | Bouton pill indice (inactif) |
| `.idx-pill.active` | Bouton pill indice actif (vert foncé) |
| `.idx-bars` | Grille des 5 barres comparatives |
| `.idx-bar-row` | Ligne individuelle d'une barre |
| `.idx-bar-row.ibr-active` | Barre de l'indice primaire (opacité 100%) |
| `.ibr-label` | Label de l'indice (ex: "VARI") |
| `.ibr-track` | Track de la barre (fond gris) |
| `.ibr-fill` | Remplissage de la barre (dynamique) |
| `.ibr-fill.idx-warn` | Couleur orange (stress léger) |
| `.ibr-fill.idx-bad` | Couleur rouge (stress sévère/critique) |
| `.ibr-val` | Valeur numérique droite de la barre |

---

### K. Nouveau Bloc HTML dans `screen-analyze`

Inséré entre le `<div class="card">` de la caméra et le `<div class="health-block">`.

Structure :
```
card (padding:14px)
├── header : "Indices végétaux RGB" + label indice actif
├── idx-selector : 5 boutons pills [VARI][ExG][GRVI][GLI][TGI]
└── idx-bars : 5 lignes barre
    ├── VARI : label + track + fill + valeur
    ├── ExG  : ...
    ├── GRVI : ...
    ├── GLI  : ...
    └── TGI  : ...
```

---

### L. Tests à Effectuer

- [ ] Vérifier que les barres se mettent à jour en temps réel avec une source vidéo active
- [ ] Vérifier que cliquer sur "ExG" met bien ExG en indice primaire (barre en surbrillance + score santé recalculé)
- [ ] Vérifier l'auto-sélection : créer mission Blé → TGI doit être auto-sélectionné
- [ ] Vérifier l'auto-sélection : créer mission Manioc → GLI doit être auto-sélectionné
- [ ] Vérifier que le rapport texte inclut bien les 5 valeurs d'indices
- [ ] Vérifier que l'export CSV a bien 7 colonnes de plus
- [ ] Tester mode fruit : tomate → l'indice actif reste Hue (mode fruit non affecté)
- [ ] Tester sur pixel noir (r=g=b=0) → pas de NaN dans les valeurs
- [ ] Tester sur pixel blanc (r=g=b=255) → ExG ≈ 0.33, VARI ≈ 0, TGI ≈ 0

---

## [Phase 1] — 18 Avril 2026 (déjà documenté)
### Fondations PWA — Terminé

| Composant | Fichier | Statut |
|---|---|---|
| PWA Manifest | `manifest.json` | ✅ Icône verte, thème #234d32 |
| Service Worker v3 | `service-worker.js` | ✅ Network-first, offline fallback |
| Moteur VARI crop-aware | `app.html` | ✅ 11 cultures, seuils spécifiques |
| Analyse fruit/plante | `app.html` | ✅ VARI + Hue HSL (tomate, banane, agrumes) |
| Interface 7 écrans | `app.html` | ✅ Accueil, Missions, Caméra, Analyse, Carte, Rapport, Historique |
| Landing page investisseur | `site.html` | ✅ Hero, problème, solution, roadmap, équipe |
| Déploiement | Netlify + GitHub | ✅ Auto-deploy depuis main |
| Documentation | `README.md` | ✅ |

---

## Roadmap des Versions Futures

### [Phase 2B] — Prévue Mai 2026
- TensorFlow.js + MobileNetV3 : détection maladies offline
- 15 classes prioritaires (RDC + Belgique)
- Grad-CAM heatmap pour explainabilité

### [Phase 2C] — Prévue Juin 2026
- Leaflet.js cartographie interactive
- GeoJSON zones + krigeage simple
- Carte de prescription (seuillage par zone)

### [Phase 2D] — Prévue Juillet 2026
- jsPDF rapport exportable
- Web Share API (partage WhatsApp, email)
- Mode RDC offline : tuiles OSM pré-cachées

### [Phase 3] — Prévue Sept–Déc 2026
- Support capteur multispectral (DJI Mavic 3M)
- NDVI, NDRE, GNDVI, SAVI temps réel
- WebODM API orthomosaïque
- Extension dataset maladies RDC

### [Phase 4] — Prévue 2027
- Backend Node.js + PostgreSQL + PostGIS
- Dashboard web SaaS
- API publique REST
- Intégration Open-Meteo + Copernicus
- Multi-tenant

---

*Changelog maintenu par l'équipe ArtiAirLink · AgroVision*  
*Contact : jonathan.ots1@gmail.com*
