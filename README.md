# 🌿 Arti-AirLink — AgroVision

> Diagnostic végétal par drone, accessible depuis n'importe quelle caméra.

**Arti-AirLink** transforme un drone ordinaire (ou un smartphone) en outil de diagnostic agricole en temps réel. Analyse de santé des cultures, détection de stress, cartographie de mission et rapports exportables — sans hardware propriétaire, sans abonnement cloud.

🇧🇪 Belgique · 🇨🇩 RDC · Équipe Arti, Section Drone & Innovation

---

## 🚀 Accès rapide

| | Lien |
|---|---|
| **App terrain (PWA mobile)** | [artiairlink.netlify.app/app.html](https://artiairlink.netlify.app/app.html) |
| **Landing page investisseur** | [artiairlink.netlify.app/site.html](https://artiairlink.netlify.app/site.html) |

---

## 📱 L'app — AgroVision

Application Progressive Web App (PWA) installable sur Android et iPhone.  
Fonctionne hors ligne une fois chargée. Aucun app store requis.

### Fonctionnalités

- **Analyse VARI en temps réel** — Visible Atmospherically Resistant Index (Gitelson, 2002), meilleur indice disponible sur caméra RGB standard
- **11 cultures supportées** — profils scientifiques avec seuils, maladies et recommandations spécifiques
- **Analyse double (plante / fruit)** — pour tomate, banane, agrumes : VARI pour les feuilles, analyse de teinte pour les fruits
- **Missions terrain** — création, gestion, persistance locale (IndexedDB)
- **Cartographie de vol** — trajectoire lawnmower, points colorés par niveau de santé
- **Rapports exportables** — format TXT et CSV
- **DroidCam** — connexion iPhone comme webcam via le logiciel DroidCam

### Cultures supportées

| Culture | Indice | Maladies surveillées |
|---|---|---|
| 🌽 Maïs | VARI | Helminthosporiose, rouille commune, charbon |
| 🌿 Manioc | VARI | Mosaïque africaine (CMV), bacterial blight, brown streak |
| 🌾 Blé | VARI | Fusariose, rouille jaune, oïdium |
| 🌾 Riz | VARI | Blast/pyriculariose, bactériose, tungro |
| 🫘 Soja | VARI | Sclérotiniose, syndrome soudain (SDS) |
| ☕ Café | VARI | Rouille orangée (CLR), anthracnose |
| 🤍 Coton | VARI | Verticilliose, anthracnose, pucerons |
| 🍅 Tomate | VARI + Hue | Mildiou, alternaria, TYLCV |
| 🍌 Banane | VARI + Hue | Panama disease, sigatoka noire, BBTV |
| 🍊 Agrumes | VARI + Hue | Greening/HLB, tristeza, gommose |
| 🌱 Autre | VARI | — |

---

## 📁 Structure du projet

```
artiairlink/
├── app.html          — PWA mobile terrain (analyse, missions, carte, rapports)
├── site.html         — Landing page investisseur
├── manifest.json     — Config PWA (icône, thème, orientation)
├── service-worker.js — Cache hors ligne
├── netlify.toml      — Config déploiement Netlify
├── _headers          — Headers de sécurité HTTP
├── docs/
│   ├── BusinessPlan ArtiAirLink.xlsx
│   ├── Pitch ArtiAirLink Investisseur.pptx
│   ├── Guide Technique ArtiAirLink IMU PID Servo.pdf
│   └── Rapport ArtiAirLink V2 Professionnel.docx
├── rapports/         — Résultats des tests terrain
└── _archive/         — Anciennes versions (non versionné)
```

---

## 🔬 Approche scientifique

### Pourquoi VARI et pas NDVI ?

Le vrai NDVI nécessite un capteur **infrarouge (NIR)** absent sur les caméras standard.  
Le **VARI** (Visible Atmospherically Resistant Index) est le meilleur indice disponible sur caméra RGB :

```
VARI = (G − R) / (G + R − B)
```

Avantages par rapport au NGRDI simplifié `(G−R)/(G+R)` :
- Prend en compte le canal bleu → réduit l'effet atmosphérique
- Meilleure corrélation avec la teneur en chlorophylle
- Utilisé dans la recherche drone à faible coût (UAV RGB)

Source : Gitelson et al. (2002), *Remote Sensing of Environment*

### Analyse fruit (tomate, banane, agrumes)

Pour les cultures à fruits colorés, l'app détecte automatiquement si la caméra voit :
- Des **feuilles** → analyse VARI (santé végétale)
- Un **fruit coloré** → analyse de teinte HSL (maturité et état du fruit)

---

## 🛠️ Stack technique

- **Frontend** : HTML + CSS + Vanilla JS (aucun framework)
- **Stockage** : IndexedDB (missions, captures) + localStorage (préférences)
- **PWA** : Service Worker avec stratégie cache-first
- **Déploiement** : Netlify (auto-deploy via GitHub)
- **Analyse image** : Canvas API + pixel sampling + VARI/HSL

---

## 🗺️ Roadmap

- [x] PWA installable + service worker hors ligne
- [x] Moteur VARI crop-aware (11 cultures)
- [x] Analyse fruit/plante pour tomate, banane, agrumes
- [x] Missions terrain + cartographie lawnmower
- [x] Export CSV + TXT
- [x] Landing page investisseur
- [ ] Tests avec drone jouet (DJI Tello ou équivalent)
- [ ] Pilote terrain RDC — manioc et maïs
- [ ] Intégration capteur NIR (vrai NDVI)
- [ ] Modèle commercial — SaaS coopératives agricoles

---

## 📬 Contact

Investisseurs, partenaires agricoles, institutions de financement :  
**contact@artiairlink.be**

---

*Équipe Arti — Section Drone & Innovation · Belgique & RDC · 2026*
