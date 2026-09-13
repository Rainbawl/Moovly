# Runbook d'exploitation — Moovly

Ce document s'adresse à toute personne qui doit faire tourner, vérifier ou dépanner le projet techniquement (backend + frontend). Pour l'utilisation fonctionnelle du site une fois lancé, voir [GUIDE_UTILISATEUR.md](./GUIDE_UTILISATEUR.md).

## 1. Comment je démarre l'application ?

| #   | Étape                                                                                   | Commande                         |
| --- | --------------------------------------------------------------------------------------- | -------------------------------- |
| 1   | Démarrer la base de données PostgreSQL                                                  | `docker compose up -d`           |
| 2   | Installer les dépendances backend (première fois ou après un changement de dépendances) | `cd backend && npm install`      |
| 3   | Appliquer les migrations de base de données                                             | `npx prisma migrate deploy`      |
| 4   | Charger les données de test (si base vide)                                              | `npx prisma db seed`             |
| 5   | Démarrer le backend                                                                     | `npm run dev` (dans `backend/`)  |
| 6   | Installer les dépendances frontend (première fois)                                      | `cd frontend && npm install`     |
| 7   | Démarrer le frontend                                                                    | `npm run dev` (dans `frontend/`) |
| 8   | Accéder à l'application                                                                 | `http://localhost:5173`          |

Variables d'environnement nécessaires : voir `.env.example` dans `backend/` (copier en `.env` et renseigner les valeurs).

## 2. Comment je vérifie qu'elle fonctionne ?

| #   | Vérification                      | Comment faire                                                                                      | Résultat attendu                                            |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | Le backend répond                 | Ouvrir `http://localhost:3001/health` (ou l'endpoint de health-check du projet) dans un navigateur | Réponse JSON `{ "status": "ok", "db": "connected", ... }`   |
| 2   | La connexion à la base fonctionne | Vérifié automatiquement par l'endpoint de health-check ci-dessus                                   | `db: "connected"` dans la réponse                           |
| 3   | Le frontend charge correctement   | Ouvrir `http://localhost:5173`                                                                     | La page d'accueil affiche la liste des coachs sans erreur   |
| 4   | L'authentification fonctionne     | Se connecter avec un compte de test (voir seed)                                                    | Redirection réussie vers le tableau de bord                 |
| 5   | Les tests automatisés passent     | `npm run test` dans `backend/`                                                                     | Tous les tests passent (88 tests actuellement)              |
| 6   | La CI est verte                   | Consulter l'onglet Actions du dépôt GitHub                                                         | Les deux jobs (backend, frontend) affichent une coche verte |

## 3. Où je regarde si ça casse ?

| Symptôme                              | Où regarder                                                     | Détail                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Le backend ne démarre pas             | Console du terminal où `npm run dev` tourne                     | Message d'erreur affiché directement (souvent lié à `.env` manquant ou base de données non démarrée)                    |
| Erreur 500 sur une requête            | Console du serveur backend                                      | Un `console.error("[erreur non gérée]", err)` journalise chaque erreur interceptée par le gestionnaire d'erreurs global |
| Échec de connexion utilisateur        | Console du serveur backend                                      | Un `console.error` dans `verifyToken.js` journalise les échecs de vérification de token                                 |
| La base de données semble injoignable | Endpoint `/health` + console du serveur                         | Un `console.error` journalise les échecs de connexion à la base dans le health-check                                    |
| La CI échoue sur GitHub               | Onglet **Actions** du dépôt GitHub, cliquer sur le job en échec | Les logs détaillent l'étape exacte qui a échoué (installation, lint, tests, build)                                      |
| Le frontend affiche une page blanche  | Console du navigateur (F12 → Console)                           | Erreurs JavaScript ou requêtes API en échec visibles                                                                    |

## 4. Procédure d'incident : `npm ci` échoue en CI avec « Missing: X from lock file »

Cette procédure documente un incident réellement rencontré et résolu pendant l'Arc 3.

**Symptôme** : le job de CI échoue à l'étape d'installation des dépendances avec un message du type :

```
npm error `npm ci` can only install packages when your package.json and package-lock.json ... are in sync.
npm error Missing: @nom-du-package@version from lock file
```

**Cause** : le fichier `package-lock.json` versionné sur le dépôt n'est plus synchronisé avec le `package.json` — généralement après une installation locale de package qui n'a pas été recommitée correctement.

**Procédure de résolution, étape par étape :**

| #   | Action                                                              | Commande                                                                                  |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Se placer dans le dossier concerné (`backend/` ou `frontend/`)      | `cd backend`                                                                              |
| 2   | Supprimer le lock file et les dépendances installées localement     | `rm -rf node_modules package-lock.json`                                                   |
| 3   | Réinstaller proprement, régénérant un lock file cohérent            | `npm install`                                                                             |
| 4   | Vérifier que le lint et les tests passent en local avant de pousser | `npm run lint && npm run test`                                                            |
| 5   | Committer le nouveau lock file                                      | `git add package-lock.json` puis `git commit -m "fix: régénération du package-lock.json"` |
| 6   | Pousser et vérifier que la CI repasse au vert                       | `git push`, puis consulter l'onglet Actions                                               |

**Prévention** : toujours committer `package-lock.json` en même temps que toute modification de `package.json`, et éviter les installations locales de packages sans vérifier `git status` avant de pousser.
