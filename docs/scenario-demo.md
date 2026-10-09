# Scénario de démo — Soutenance Moovly

## 1. Informations générales

| Élément | Détail |
|---|---|
| Durée | Environ 7 minutes |
| Déroulé | 9 scènes : le parcours complet d'une réservation, avec trois cas d'erreur volontaires |
| Environnement | Application lancée en local (backend + frontend) |
| Vidéo de secours | Le même déroulé est rejoué et filmé automatiquement par un script Playwright, avec un bandeau qui annonce chaque scène |

## 2. Préparation avant la démo

**1. Démarrer la base de données PostgreSQL (Docker)**

```
docker compose up -d
```

**2. Nettoyer la base de développement**

Les tests d'intégration y ajoutent des comptes de test qui encombrent l'accueil et le tableau de bord admin. Voir [Exploitation](./Exploitation.md#nettoyer-la-base-de-développement-avant-une-démo). Ne pas relancer les tests d'intégration entre le nettoyage et la démo.

**3. Lancer le backend**

```
cd backend
npm run dev
```

**4. Lancer le frontend**

```
cd frontend
npm run dev
```

**5. Vérifier les comptes disponibles**

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | afif-adm@moovly.fr | valeur de `SEED_PASSWORD_ADMIN` dans `.env` |
| Sportif (seed) | bocar@test.fr | valeur de `SEED_PASSWORD_SPORTIF` dans `.env` |
| Coach (seed) | camille@test.fr | valeur de `SEED_PASSWORD_COACH` dans `.env` |

La démo crée elle-même un sportif (André Martin) et une coach (Sophie Durand). Le script supprime ces deux comptes au début de chaque prise, pour pouvoir les recréer.

**6. Lancer la démo après 8 h**

La scène 7 réserve un créneau « demain matin », qui doit commencer dans moins de 24 h pour que l'annulation soit refusée.

## 3. Le déroulé

| Scène | Action | Résultat attendu | Appel API |
|---|---|---|---|
| 1 | Un sportif s'inscrit puis se connecte | Accès immédiat à son tableau de bord, vide | `POST /auth/register`, `POST /auth/login` |
| 2 | Une coach s'inscrit (diplôme, présentation, tarif) puis essaie de se connecter | Connexion refusée : compte en attente de validation | `POST /auth/register`, `POST /auth/login` → 403 |
| 3a | L'admin tape un **mauvais mot de passe** (volontaire) | Message générique « Email ou mot de passe incorrect », qui reste affiché | `POST /auth/login` → 401 |
| 3b | L'admin se connecte et valide la coach | La carte de la coach disparaît de la liste d'attente | `PUT /admin/coaches/:id/valider` |
| 4 | La coach se connecte et publie 3 créneaux | Les créneaux apparaissent dans son planning, « disponible » | `POST /coaches/:id/creneaux` |
| 5 | Le sportif filtre par sport et par ville, ouvre le profil, réserve un matin | Réservation « en attente » dans son tableau de bord | `GET /coaches?sport=&ville=`, `POST /reservations` → 201 |
| 6 | Il **modifie** sa réservation vers l'après-midi, chez la même coach | Réservation déplacée, toujours « en attente » | `PUT /reservations/:id` |
| 7a | Il revient sur le profil de la coach | Le créneau pris n'a plus de bouton « Réserver » | `GET /coaches/:id/creneaux` |
| 7b | Il réserve **demain matin** puis essaie d'**annuler** | Refus : « Impossible d'annuler moins de 24h avant la séance » ; la réservation reste | `DELETE /reservations/:id` → 400 |
| 8 | La coach **accepte** la demande de l'après-midi et **refuse** celle de demain | Réservation confirmée ; le créneau refusé redevient disponible | `PUT /reservations/:id/repondre` |
| 9 | Le sportif ouvre son tableau de bord puis l'historique | Séance « confirmée » ; l'historique montre la réservation modifiée (annulée) et la refusée | `GET /reservations/mine` |

## 4. Les trois cas d'erreur volontaires

| Cas | Ce qu'il démontre | Où c'est garanti |
|---|---|---|
| Mauvais mot de passe (3a) | On ne révèle pas si l'email existe : même message dans tous les cas | Service d'authentification : « Identifiants invalides » |
| Créneau déjà pris (7a) | Un créneau n'est réservable qu'une seule fois | Transaction `SELECT … FOR UPDATE` + statut du créneau (ADR-05) ; l'API refuse aussi en 409 si on contourne l'interface |
| Annulation à moins de 24 h (7b) | Le coach ne perd pas son créneau à la dernière minute | Service de réservation : contrôle de la date avant annulation |

## 5. Enregistrer la vidéo de secours

Le script `demo-moovly.spec.js` (Playwright) rejoue les 9 scènes et vérifie 35 points (statuts, messages, redirections). Il sert à la fois de vidéo de secours et de test End to End.

```
npx playwright test demo-moovly.spec.js
```

Ne pas toucher à la fenêtre Chrome pendant l'enregistrement : elle se ferme seule à la fin. La vidéo est enregistrée dans le dossier `videos/`. La vitesse se règle avec la constante `RALENTI` en haut du script.

Limite connue : ce script est encore tenu hors du dépôt et n'est pas exécuté par la CI (voir [bilan technique](./bilan-technique.md)).
