# Dashboard Financier PWA

Application web progressive (PWA) de gestion des finances personnelles. Suivez votre patrimoine, votre budget mensuel, vos investissements et vos projets immobiliers depuis un seul tableau de bord, sans inscription ni serveur — toutes les données restent dans votre navigateur via `localStorage`.

Installable sur mobile et desktop comme une application native.

---

## Fonctionnalités

- **Tableau de bord mensuel** — revenus, charges fixes, dépenses, reste à vivre et capacité d'épargne recalculés en temps réel
- **Compte courant** — suivi du solde réel et projection de fin de mois
- **Virement automatique & rentrées exceptionnelles** — pris en compte dans le calcul du reste à vivre
- **Ratio d'endettement** — analyse automatique avec indicateur visuel et seuil bancaire 33 %
- **Score de santé financière** — badge synthétique (vert / jaune / orange / rouge)
- **Investissements** — PEA actions, portefeuille Crypto (prix en direct via CoinGecko), Natixis et Livret Carrefour
- **Comptes bancaires** — suivi multi-comptes avec intérêts estimés
- **Objectifs financiers** — création d'objectifs avec barre de progression
- **Simulateur d'épargne composée** — projection sur 40 ans avec jalons par décennie
- **Simulation d'achat** — impact immédiat sur le reste à vivre sans modifier les données
- **Projet immobilier** — calcul de mensualité, coût total du crédit et impact de l'apport
- **Archives mensuelles** — clôture de mois, historique et graphiques d'évolution du patrimoine
- **Alertes budget** — seuils configurables par catégorie de dépenses
- **Prélèvements à venir** — charges fixes prévues dans les 7 prochains jours
- **Recherche rapide** — accès instantané à n'importe quelle donnée du dashboard
- **Thème clair / sombre** — bascule en un clic, mémorisée

---

## Utilisation

### Ouverture locale

Ouvrez simplement `index.html` dans un navigateur moderne (Chrome, Firefox, Edge, Safari). Aucun serveur ni installation requise.

```
# Optionnel — serveur local pour activer le Service Worker PWA
npx serve .
# ou
python -m http.server 8080
```

### Installation PWA

Sur mobile : ouvrez l'URL dans Chrome ou Safari, puis utilisez **"Ajouter à l'écran d'accueil"**. L'app fonctionne hors ligne une fois installée.

### Sauvegarde

Utilisez les boutons **Exporter / Importer sauvegarde** pour sauvegarder vos données sous forme de fichier JSON ou les restaurer sur un autre appareil.

---

## Stack technique

| Technologie | Usage |
|---|---|
| HTML / CSS / JavaScript (vanilla) | Structure, style et logique applicative |
| [Chart.js](https://www.chartjs.org/) | Graphiques (patrimoine, reste à vivre, net worth, 6 mois, épargne) |
| [Font Awesome 6](https://fontawesome.com/) | Icônes |
| [Google Fonts](https://fonts.google.com/) — Lato, Poppins | Typographie |
| [CoinGecko API](https://www.coingecko.com/en/api) | Prix des crypto-monnaies en temps réel |
| `localStorage` | Persistance des données côté client |
| Service Worker (manifest.json) | PWA — installation et mode hors ligne |

---

## Screenshot

![Dashboard Financier PWA](screenshot.png)

> Remplacer `screenshot.png` par une capture d'écran réelle du dashboard.
