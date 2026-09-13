# Scénario de démo — Soutenance Arc 3 Moovly

## 1. Informations générales

| Élément | Détail |
|---|---|
| Durée totale | 3 minutes maximum |
| Partie 1 | Parcours principal — environ 2 minutes |
| Partie 2 | Cas d'erreur volontaire — environ 1 minute |
| Environnement | Application lancée en local (backend + frontend) |

## 2. Préparation avant la démo

**1. Démarrer la base de données PostgreSQL (Docker)**

La base doit tourner avant le backend, sinon celui-ci ne pourra pas s'y connecter.
```
docker compose up -d
```

**2. Lancer le backend**

Démarre le serveur Express en local, sur le port configuré dans `.env` (par défaut 3001).
```
cd backend
npm run dev
```

**3. Appliquer les migrations si nécessaire**

À faire seulement si la base est neuve ou vient d'être recréée — applique le schéma Prisma sans recréer de nouvelles migrations.
```
npx prisma migrate deploy
```

**4. Charger les données de test (seed)**

Recrée les comptes de test (sportif, coach, admin) avec les mots de passe définis dans `.env`. Nécessaire à chaque fois que la base est vide.
```
npx prisma db seed
```

**5. Lancer le frontend**

Démarre le serveur de développement Vite, accessible par défaut sur `http://localhost:5173`.
```
cd frontend
npm run dev
```

**6. Vérifier les comptes disponibles**

Après le seed, ces comptes doivent exister et être utilisables pour la démo :

| Rôle | Email | Mot de passe |
|---|---|---|
| Sportif | bocar@test.fr | valeur de `SEED_PASSWORD_SPORTIF` dans `.env` |
| Coach | camille@test.fr | valeur de `SEED_PASSWORD_COACH` dans `.env` |
| Admin | admin@moovly.fr | valeur de `SEED_PASSWORD_ADMIN` dans `.env` |

**7. Ouvrir le navigateur**

Se rendre sur `http://localhost:5173` et vérifier que la page d'accueil charge bien la liste des coachs avant de commencer la démo.

## 3. Partie 1 — Parcours principal

| Étape | Écran de départ | Action effectuée | Résultat attendu | Appel API déclenché |
|---|---|---|---|---|
| 1 | Page d'accueil | Chargement de la page | La liste des coachs disponibles s'affiche | `GET /coaches` |
| 2 | Page d'accueil | Saisie d'un sport dans le champ de filtre (ex : "Tennis") | Seuls les coachs proposant ce sport restent affichés | `GET /coaches?sport=Tennis` |
| 3 | Page d'accueil | Saisie d'une ville dans le champ de filtre (ex : "Paris") | Seuls les coachs de cette ville restent affichés | `GET /coaches?sport=Tennis&ville=Paris` |
| 4 | Page d'accueil | Clic sur la carte d'un coach | Ouverture de la page de profil de ce coach | `GET /coaches/:id` |
| 5 | Page profil coach | Lecture des informations affichées | Nom, sports pratiqués, tarif horaire, présentation visibles | — |
| 6 | Page profil coach | Clic sur "Se connecter" (ou navigation vers la page de connexion) | Affichage du formulaire de connexion | — |
| 7 | Page de connexion | Saisie de l'email et du mot de passe du compte sportif de test | Connexion réussie, redirection | `POST /auth/login` |
| 8 | Page profil coach | Sélection d'une date dans le sélecteur de date | La liste des créneaux disponibles pour cette date s'affiche | `GET /coaches/:id/creneaux?date=...` |
| 9 | Page profil coach | Clic sur le bouton "Réserver" d'un créneau au statut "disponible" | Message de confirmation affiché | `POST /reservations` |
| 10 | Navigation vers le Dashboard | Clic sur le lien Dashboard | La réservation qui vient d'être faite apparaît dans la liste | `GET /reservations/mine` |

## 4. Partie 2 — Cas d'erreur démontré volontairement

**Titre du scénario : tentative de réservation sur un créneau déjà verrouillé**

| Étape | Action effectuée | Résultat attendu | Appel API déclenché |
|---|---|---|---|
| 1 | Réserver un créneau disponible (comme en partie 1, étape 9) | Le créneau passe au statut "en_attente" et se verrouille pour 10 minutes | `POST /reservations` → statut 201 |
| 2 | Tenter de réserver ce même créneau une seconde fois, avant l'expiration des 10 minutes | La demande est refusée | `POST /reservations` → statut 409 |
| 3 | Lire le message d'erreur affiché côté frontend | "Ce créneau est en cours de réservation, réessayez dans quelques minutes" | — |

## 5. Mécanisme technique du cas d'erreur

| Élément | Détail |
|---|---|
| Décision documentée | ADR-05 |
| Mécanisme de verrouillage | Transaction PostgreSQL avec `SELECT ... FOR UPDATE` sur la ligne du créneau |
| Durée du verrou | 10 minutes |
| Code d'erreur retourné | 409 (Conflict) |
| Limite connue | Le verrou expiré est revérifié seulement à la prochaine tentative de réservation sur ce créneau ; aucun nettoyage automatique périodique (pas de job cron) n'est en place |
