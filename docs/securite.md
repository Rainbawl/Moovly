# Politique de sécurité — Moovly

## Mesures de sécurité implémentées

### Authentification — Vérifier l'identité de l'utilisateur

- **JWT (JSON Web Token)** — Access token (15 min) + Refresh token (7 jours) httpOnly
- **Hachage bcrypt** — Tous les mots de passe sont hachés avec un salt de 10 rounds
- **Connexion sécurisée** — Vérification email + mot de passe avant génération du token

### Autorisation — Vérifier les droits de l'utilisateur

- **Contrôle des rôles** — Middleware `verifyRole` sur toutes les routes sensibles
- **Trois niveaux de droits** — sportif, coach, admin, chacun avec des permissions différentes
- **Vérification du propriétaire** — un sportif ne peut annuler que ses propres réservations

### Protection des données

- **Mots de passe** — Jamais stockés en clair, jamais retournés dans les réponses API
- **Données sensibles** — Exclues des réponses (select explicite des champs)
- **CORS** — Configuré pour n'accepter que l'origine frontend autorisée
- **Variables d'environnement** — Aucun secret en clair dans le code source

### Protection contre les attaques

- **SELECT FOR UPDATE** — Prévention des doubles réservations simultanées (ADR-05)
- **Verrou 10 minutes** — Protection contre les réservations concurrentes
- **Validation des entrées** — Vérification des champs obligatoires côté backend
- **Gestion des erreurs** — Messages d'erreur génériques (pas de fuite d'information)

### Infrastructure

- **PostgreSQL** — Base de données isolée dans Docker
- **Variables d'environnement** — `.env` dans `.gitignore`
- - **Dépendances** — Auditées avec `npm audit` (backend + frontend). Frontend : 0 vulnérabilité. Backend : 4 vulnérabilités restantes, toutes liées à des dépendances optionnelles de Prisma pour MySQL (non utilisé dans ce projet, qui fonctionne exclusivement en PostgreSQL) — corriger nécessiterait un downgrade cassant de Prisma pour un risque non exploitable dans notre contexte. Voir le rapport d'audit de sécurité complet pour le détail.

## Signalement de vulnérabilités

Si vous découvrez une vulnérabilité de sécurité, merci de la signaler à :

**Email :** admin@moovly.fr

Merci de ne pas créer d'issue publique pour les problèmes de sécurité.

## Versions supportées

| Version | Supportée |
| ------- | --------- |
| 1.0.x   | ✅        |

## Données personnelles

Conformément au RGPD :

- Les mots de passe sont hachés et ne peuvent pas être récupérés
- Les données utilisateurs sont stockées de manière sécurisée
- Aucune donnée n'est partagée avec des tiers
