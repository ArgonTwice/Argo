# Argo 🚢
> Cap sur votre toison d'or.

![PWA](https://img.shields.io/badge/PWA-ready-blue)
![Vanilla JS](https://img.shields.io/badge/JS-Vanilla-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

## Présentation

Argo est une PWA de gestion financière personnelle 100 % côté client.
Elle centralise revenus, charges fixes, dépenses, investissements et simulation immobilière
dans une interface glassmorphism inspirée du thème "Cyber Blue".
Toutes les données restent locales — aucun serveur, aucune donnée envoyée.

![Argo Dashboard](screenshot.png)

## Fonctionnalités

- **Tableau de bord** — solde courant, reste à vivre, score santé financière
- **Budget** — charges fixes, dépenses perso, courses, alertes de seuil
- **Investissements** — PEA, Natixis, Carrefour, Crypto (prix live via CoinGecko), comptes bancaires
- **Immobilier** — simulation crédit, capacité d'emprunt, tableau d'amortissement
- **Objectifs** — objectifs financiers et objectifs de vie avec barre de progression
- **Archives** — clôture mensuelle, historique net worth, graphiques 6 mois
- **Multi-profils** — données isolées par profil, renommage inline
- **PWA** — installable Android & iOS, cache offline via Service Worker

## Stack technique

| Technologie | Usage |
|-------------|-------|
| HTML / CSS / JS vanilla | Interface et logique métier |
| Chart.js | Graphiques (doughnut, bar, line) |
| Font Awesome 6 | Icônes |
| CoinGecko API | Prix crypto en temps réel |
| localStorage | Persistance des données |
| Service Worker | Cache offline / PWA |

## Installation & lancement

```bash
git clone https://github.com/[username]/argo.git
cd argo
npx serve .
```

Ou simplement ouvrir `index.html` directement dans un navigateur moderne.

## Installation PWA

**Android** — Ouvrir dans Chrome → menu ⋮ → *Ajouter à l'écran d'accueil*

**iOS** — Ouvrir dans Safari → bouton Partager → *Sur l'écran d'accueil*

## Sauvegarde des données

Via le bouton **Exporter** (section Paramètres) : génère un fichier JSON téléchargeable.
**Importer** recharge ce fichier et restaure toutes les données instantanément.

## Structure du projet

```
argo/
├── index.html          # Point d'entrée, structure HTML complète
├── manifest.json       # Config PWA (nom, icônes, couleurs)
├── sw.js               # Service Worker — cache network-first
├── icon.svg            # Icône app
├── css/
│   ├── base.css        # Reset, variables CSS, typographie
│   ├── layout.css      # App shell, navigation, grilles
│   ├── components.css  # Boutons, inputs, cards, modals
│   ├── metrics.css     # Panels KPI, hero bar, score santé
│   ├── budget.css      # Section Mon Budget
│   ├── goals.css       # Objectifs financiers et de vie
│   ├── features.css    # Dashboard de vie, simulateurs
│   ├── theme.css       # Thème clair/sombre, overrides
│   ├── ui-v2.css       # Profils, upload, composants avancés
│   ├── fixes.css       # Correctifs cross-browser / mobile
│   ├── responsive.css  # Breakpoints 390px → desktop
│   └── splash.css      # Écran de démarrage animé
└── js/
    ├── app.js          # Point d'entrée, initializeApp()
    ├── utils.js        # Constantes, parseAmount, formatCurrency
    ├── storage.js      # save*, load*, backup export/import
    ├── budget.js       # Calculs budget, updateDashboard()
    ├── investments.js  # PEA, Natixis, Crypto, fetchCryptoPrices()
    ├── mortgage.js     # Simulation crédit immobilier
    ├── charts.js       # Création et mise à jour des graphiques
    ├── archives.js     # Clôture mensuelle, historique
    └── ui.js           # Navigation, thème, splash, render*
```

## Licence

MIT — voir [LICENSE](LICENSE)
