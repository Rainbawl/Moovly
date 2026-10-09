# Politique de sécurité — Moovly

## Mesures de sécurité implémentées

### Authentification — Vérifier l'identité de l'utilisateur

- **JWT (JSON Web Token)** — Access token de 15 minutes, stocké côté navigateur dans le `localStorage` ; refresh token de 7 jours, stocké dans un cookie `httpOnly` (inaccessible au JavaScript)
- **Renouvellement automatique** — un intercepteur Axios appelle `/auth/refresh` quand l'access token expire ; une erreur de connexion (`/auth/login`) ne déclenche pas ce mécanisme
- **Hachage bcrypt** — Tous les mots de passe sont hachés avec un coût de 10 rounds
- **Coach non validé** — la connexion est refusée tant qu'un administrateur n'a pas validé le compte

### Autorisation — Vérifier les droits de l'utilisateur

Chaque requête protégée passe trois barrières successives :

| Barrière       | Question posée              | Où                     | Réponse si refus |
| -------------- | --------------------------- | ---------------------- | ---------------- |
| 1 · Token      | Es-tu connecté ?            | middleware `verifyToken` | 401            |
| 2 · Rôle       | As-tu le bon profil ?       | middleware `verifyRole`  | 403            |
| 3 · Propriété  | Est-ce bien ta ressource ?  | services               | 403              |

La troisième barrière protège contre l'**IDOR** (changer un identifiant dans l'URL pour agir sur la ressource d'un autre) :

- un sportif ne peut **annuler** ou **modifier** que ses propres réservations ;
- un coach ne peut **répondre** qu'aux réservations de ses propres créneaux ;
- un coach ne peut **publier** des créneaux que sur son propre profil (l'admin peut pour tous) ;
- l'inscription refuse le rôle **admin**.

### Règles métier protégées côté serveur

- **Pas de double réservation** — la réservation se fait dans une transaction avec `SELECT … FOR UPDATE` sur la ligne du créneau (ADR-05) ; un créneau dont le statut n'est plus `disponible` est refusé (409)
- **Règle des 24 h** — une annulation à moins de 24 h de la séance est refusée (400)
- **Modification** — limitée aux créneaux du même coach (400 sinon), et réalisée en une seule transaction : si le nouveau créneau est pris, l'ancienne réservation est conservée
- Ces règles sont vérifiées dans le backend : masquer un bouton dans l'interface n'est jamais considéré comme une protection

### Protection des données

- **Mots de passe** — Jamais stockés en clair, jamais retournés dans les réponses API
- **Données sensibles** — Exclues des réponses (sélection explicite des champs)
- **Messages d'erreur génériques** — à la connexion, l'API répond « Identifiants invalides » que l'email existe ou non (l'interface affiche « Email ou mot de passe incorrect ») : on ne révèle pas quels comptes existent
- **CORS** — Configuré pour n'accepter que l'origine frontend autorisée (`CORS_ORIGIN`)
- **Requêtes SQL** — Prisma et `$queryRaw` en tagged template : les valeurs sont toujours paramétrées (pas d'injection SQL)

### Infrastructure

- **PostgreSQL** — Base de données isolée dans Docker
- **Secrets** — `.env` dans `.gitignore`, secrets de la CI dans GitHub Secrets ; aucun secret dans le code source
- **Branche `main` protégée** — fusion uniquement par pull request, avec CI (lint + tests) au vert
- **Dépendances** — auditées avec `npm audit` ; résultats et arbitrages dans le [rapport d'audit de sécurité](./audit-securite.md)

## Limites connues (dette consciente)

| Limite | Risque | Amélioration prévue |
| ------ | ------ | ------------------- |
| Access token dans le `localStorage` | Lisible par du JavaScript en cas de faille XSS (le refresh token, lui, reste en cookie `httpOnly`) | V2 : garder l'access token en mémoire |
| Pas de limitation des tentatives de connexion | Attaque par force brute sur les mots de passe | `express-rate-limit` est installé, à brancher sur `/auth/login` |
| Pas de longueur minimale de mot de passe | Mots de passe faibles acceptés | Ajouter une règle côté front et côté back |
| Verrou de 10 minutes (`verrouille_jusqua`) jamais atteint | Aucun : c'est le statut `en_attente` qui protège le créneau | Utile en V2 pour bloquer un créneau pendant un paiement |
| Pas de journalisation des événements de sécurité | Échecs de connexion et accès refusés non tracés | Logging structuré (voir [Exploitation](./Exploitation.md)) |

## Signalement de vulnérabilités

Si vous découvrez une vulnérabilité de sécurité, merci de la signaler à :

**Email :** afif-adm@moovly.fr

Merci de ne pas créer d'issue publique pour les problèmes de sécurité.

## Versions supportées

| Version | Supportée |
| ------- | --------- |
| 1.0.x   | ✅        |

## Données personnelles

Conformément au RGPD :

- **Minimisation** — seules les données utiles sont collectées : identité, email, ville, sport, historique de réservation
- Les mots de passe sont hachés et ne peuvent pas être récupérés
- Aucune donnée n'est partagée avec des tiers
- À venir en V2 : page de confidentialité, droit d'accès et de suppression des données
