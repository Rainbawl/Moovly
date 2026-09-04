# 🏋️ Moovly

Application de réservation de coachs sportifs — Projet CDA Niveau 6

## 📋 Description

Moovly est une plateforme qui met en relation sportifs et coachs certifiés. Les sportifs peuvent trouver un coach selon leur discipline, consulter ses créneaux disponibles et réserver une séance en quelques clics.

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

- Vitest
- Supertest
- 88 tests — 95,18 % de couverture

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
docker-compose up -d
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

## 👤 Comptes de test

| Rôle    | Email           | Description                                           |
| ------- | --------------- | ----------------------------------------------------- |
| Sportif | bocar@test.fr   | Peut réserver des créneaux                            |
| Coach   | camille@test.fr | Compte déjà validé, peut créer des créneaux           |
| Admin   | admin@moovly.fr | Peut valider les coachs et consulter les statistiques |

_(mots de passe définis dans le `.env` local, non versionnés)_

## 📁 Structure du projet

```
Moovly/
├── backend/
│   ├── prisma/           → schéma et migrations BDD
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
├── docs/
│   ├── guide-utilisateur.md  → parcours détaillé par rôle
│   ├── securite.md            → mesures de sécurité mises en place
│   └── exploitation.md        → variables d'env, /health, diagnostic
└── docker-compose.yml
```

## 📖 Documentation

- [Guide d'utilisation](./docs/Guide_utilisateur.md) — parcours détaillé par rôle (sportif, coach, admin)
- [Sécurité](./docs/securite.md) — mesures de sécurité mises en place
- [Exploitation](./docs/Exploitation.md) — variables d'environnement, endpoint `/health`, procédures de diagnostic

## 📄 Licence

Projet réalisé dans le cadre du titre professionnel Concepteur Développeur d'Applications (CDA Niveau 6 — RNCP TP-01281).
