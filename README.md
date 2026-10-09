# 🏋️ Moovly

Application de réservation de coachs sportifs — Projet CDA Niveau 6

## 📋 Description

Moovly est une plateforme qui met en relation sportifs et coachs certifiés. Les sportifs peuvent trouver un coach selon leur discipline et leur ville, consulter ses créneaux disponibles et réserver une séance en quelques clics, sans risque de double réservation.

## ✨ Fonctionnalités (V1)

| Rôle    | Ce qu'il peut faire                                                                                                         |
| ------- | --------------------------------------------------------------------------------------------------------------------------- |
| Visiteur | Consulter les coachs (filtres sport et ville), voir un profil coach, s'inscrire, se connecter                              |
| Sportif | Réserver un créneau, modifier sa réservation (chez le même coach), l'annuler (jusqu'à 24 h avant), consulter son historique |
| Coach   | Publier ses créneaux (matin / après-midi), accepter ou refuser une demande, consulter son planning et ses statistiques      |
| Admin   | Valider ou rejeter un coach, créer un sport, consulter les statistiques globales                                            |

Un coach ne peut pas se connecter tant que son compte n'a pas été validé par un administrateur.

## 🛠️ Stack technique

**Frontend**

- React 19 + Vite
- React Router DOM
- Axios

**Backend**

- Node.js + Express 5
- Prisma 7 (ORM)
- PostgreSQL 16
- JWT (authentification)
- bcrypt (hachage des mots de passe)

**Tests**

- Vitest + Supertest
- 141 tests backend : 70 unitaires + 71 d'intégration (API + vraie base PostgreSQL)
- Couverture : 100 % des fonctions, 97,19 % des lignes (99,5 % des lignes de la logique métier)
- 1 parcours End to End Playwright (9 scènes), tenu pour l'instant hors du dépôt (voir [bilan technique](./docs/bilan-technique.md))

**Intégration continue**

- GitHub Actions : lint + tests (backend, avec un service PostgreSQL) et lint + build (frontend) à chaque pull request
- Branche `main` protégée : fusion impossible si la CI échoue

## 🏗️ Architecture

```
Route → Middleware → Controller → Service → Repository → Prisma → PostgreSQL
```

## 🚀 Installation

### Prérequis

- Node.js 18+
- Docker
- npm

### 1. Cloner le projet

```bash
git clone https://github.com/Rainbawl/Moovly.git
cd Moovly
```

### 2. Lancer la base de données

```bash
docker compose up -d
```

### 3. Configurer le backend

```bash
cd backend
npm install
```

Crée un fichier `.env` à la racine de `backend/` :

```env
DATABASE_URL="postgresql://moovly:VOTRE_MOT_DE_PASSE@localhost:5433/moovly"
SEED_PASSWORD_SPORTIF=VotreMotDePasse
SEED_PASSWORD_COACH=VotreMotDePasse
SEED_PASSWORD_ADMIN=VotreMotDePasse
JWT_SECRET=votre_secret_jwt
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=votre_secret_refresh
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

### 4. Migrer et peupler la base de données

```bash
npx prisma migrate dev
npx prisma db seed
```

### 5. Lancer le backend

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

### 6. Configurer et lancer le frontend

```bash
cd ../frontend
npm install
npm run dev
```

L'application démarre sur `http://localhost:5173`

## 🧪 Lancer les tests

```bash
cd backend
npm run test:coverage
```

Le rapport de couverture détaillé est généré dans `backend/coverage/index.html`.

⚠️ Les tests d'intégration écrivent dans la base configurée par `DATABASE_URL` : en local, ils ajoutent des comptes de test (`…<horodatage>@test.fr`) dans la base de développement. Voir [Exploitation](./docs/Exploitation.md) pour la nettoyer avant une démo.

## 🔌 Routes de l'API

| Méthode | Route                          | Accès              | Rôle                                         |
| ------- | ------------------------------ | ------------------ | -------------------------------------------- |
| POST    | `/auth/register`               | Public             | Inscription (sportif ou coach)               |
| POST    | `/auth/login`                  | Public             | Connexion (access token + cookie refresh)    |
| POST    | `/auth/refresh`                | Cookie refresh     | Nouvel access token                          |
| POST    | `/auth/logout`                 | Connecté           | Déconnexion                                  |
| GET     | `/coaches`                     | Public             | Liste des coachs validés (`?sport=&ville=`)  |
| GET     | `/coaches/:id`                 | Public             | Profil d'un coach                            |
| GET     | `/coaches/:id/creneaux`        | Public             | Créneaux d'un coach (`?date=`)               |
| POST    | `/coaches/:id/creneaux`        | Coach, admin       | Publier un créneau                           |
| GET     | `/reservations/mine`           | Sportif, admin     | Historique de mes réservations               |
| POST    | `/reservations`                | Sportif            | Réserver un créneau                          |
| PUT     | `/reservations/:id`            | Sportif            | Changer de créneau chez le même coach        |
| DELETE  | `/reservations/:id`            | Sportif, admin     | Annuler (refusé à moins de 24 h)             |
| PUT     | `/reservations/:id/repondre`   | Coach              | Accepter ou refuser une demande              |
| GET     | `/dashboard/coach`             | Coach              | Planning du coach                            |
| GET     | `/dashboard/coach/stats`       | Coach              | Statistiques du coach                        |
| GET     | `/admin/coaches`               | Admin              | Coachs en attente de validation              |
| PUT     | `/admin/coaches/:id/valider`   | Admin              | Valider ou rejeter un coach                  |
| GET     | `/admin/sports`                | Admin              | Liste des sports                             |
| POST    | `/admin/sports`                | Admin              | Créer un sport                               |
| GET     | `/admin/stats`                 | Admin              | Statistiques globales                        |
| GET     | `/health`                      | Public             | État de l'API et de la base                  |

## 👤 Comptes de test

| Rôle    | Email              | Description                                           |
| ------- | ------------------ | ----------------------------------------------------- |
| Sportif | bocar@test.fr      | Peut réserver des créneaux                            |
| Coach   | camille@test.fr    | Compte déjà validé, peut créer des créneaux           |
| Admin   | afif-adm@moovly.fr | Peut valider les coachs et consulter les statistiques |

_(mots de passe définis dans le `.env` local, non versionnés)_

## 📁 Structure du projet

```
Moovly/
├── .github/workflows/    → intégration continue (GitHub Actions)
├── backend/
│   ├── prisma/           → schéma, migrations et seed
│   ├── src/
│   │   ├── controllers/  → reçoivent les requêtes
│   │   ├── services/     → logique métier
│   │   ├── repositories/ → accès base de données
│   │   ├── routes/       → définition des endpoints
│   │   └── middleware/   → authentification et rôles
│   └── tests/
│       ├── unit/         → tests unitaires
│       └── integration/  → tests d'intégration
├── frontend/
│   └── src/
│       ├── pages/        → pages de l'application
│       ├── context/      → gestion de l'authentification
│       └── services/     → appels API
├── docs/                 → documentation (voir ci-dessous)
└── docker-compose.yml
```

## 📖 Documentation

- [Guide d'utilisation](./docs/Guide_utilisateur.md) — parcours détaillé par rôle (sportif, coach, admin)
- [Sécurité](./docs/securite.md) — mesures de sécurité mises en place et limites connues
- [Rapport d'audit de sécurité](./docs/audit-securite.md) — résultats de `npm audit` et arbitrages
- [Exploitation](./docs/Exploitation.md) — variables d'environnement, endpoint `/health`, diagnostic, nettoyage de la base
- [Runbook](./docs/runbook.md) — démarrer, vérifier, dépanner
- [Scénario de démo](./docs/scenario-demo.md) — déroulé de la démonstration
- [Bilan technique](./docs/bilan-technique.md) — inventaire, dette consciente, corrections

## 📄 Licence

Projet réalisé dans le cadre du titre professionnel Concepteur Développeur d'Applications (CDA Niveau 6 — RNCP TP-01281).
