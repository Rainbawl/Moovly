# Rapport d'audit de sécurité — Moovly

_Ce rapport est écrit pour être compris par une personne qui découvre le projet, sans connaissances techniques préalables._

## 1. C'est quoi un audit de sécurité, et pourquoi on en fait un ?

Notre projet utilise des centaines de petits bouts de code écrits par d'autres personnes (des "dépendances" ou "librairies") — par exemple pour gérer les mots de passe, envoyer des emails, ou construire les pages web. Ces bouts de code sont parfois mis à jour parce qu'on y découvre des failles de sécurité (des façons de les détourner pour faire du mal).

Un **audit de sécurité**, c'est simplement : on demande à un outil automatique (`npm audit`) de vérifier, parmi tous les bouts de code qu'on utilise, lesquels ont une faille connue et publiée. Ensuite, pour chaque faille trouvée, on décide : on la corrige, ou on explique pourquoi elle ne nous concerne pas vraiment.

## 2. Ce qu'on a trouvé

On a passé cet outil sur les deux parties du projet : la partie "backend" (le serveur, qui gère les données) et la partie "frontend" (ce que l'utilisateur voit dans son navigateur).

**Côté serveur (backend)** : 8 failles trouvées, dont 6 considérées comme sérieuses.
**Côté navigateur (frontend)** : 2 failles sérieuses trouvées, sur un seul outil (`react-router`, qui gère la navigation entre les pages).

## 3. Ce qu'on a corrigé

Pour la grande majorité de ces failles (5 sur 6 côté serveur, et celle du frontend), la correction est simple : il existe une nouvelle version du bout de code concerné qui n'a plus le problème, et l'installer ne casse rien dans notre projet. On a donc simplement mis à jour ces librairies.

Concrètement, ça concernait des outils qui servent à : valider des adresses web, valider des formulaires, envoyer des emails, et gérer la navigation entre les pages. Aucun de ces correctifs n'a changé le comportement de l'application.

## 4. La faille qu'on n'a PAS corrigée — et pourquoi c'est un choix assumé, pas un oubli

Une des failles trouvées concerne un outil appelé `mysql2`. Ça sert à se connecter à un type de base de données appelé MySQL.

**Sauf que notre projet n'utilise pas MySQL.** On utilise PostgreSQL, un autre type de base de données. Cet outil `mysql2` est installé "par précaution" par Prisma (l'outil qu'on utilise pour parler à notre base de données), au cas où un projet en aurait besoin — mais notre code ne s'en sert jamais.

Autrement dit : la faille existe dans un outil présent sur l'étagère, mais qu'on n'utilise jamais dans la cuisine. Le risque réel pour notre application est donc nul.

La corriger quand même obligerait à revenir à une version beaucoup plus ancienne de Prisma, ce qui casserait potentiellement d'autres parties du projet — pour supprimer un risque qui n'existe pas chez nous. On a donc choisi de ne pas le faire, et on le note ici clairement plutôt que de le cacher : c'est ce qu'on appelle une **dette technique consciente**. Si un jour on utilise MySQL, ou qu'on met à jour Prisma pour d'autres raisons, on revérifiera ce point.

## 5. Comment on protège les mots de passe et les connexions des utilisateurs

Au-delà des outils externes, on a vérifié notre propre code pour deux problèmes classiques et bien connus en sécurité :

- **Les mots de passe ne sont jamais stockés "en clair".** Quand quelqu'un s'inscrit, son mot de passe est transformé par un calcul à sens unique (impossible à inverser) avant d'être enregistré. Même quelqu'un qui accéderait à notre base de données ne verrait jamais le vrai mot de passe des utilisateurs.
- **On ne donne pas d'indice à quelqu'un qui essaierait de deviner des comptes existants.** Si on tape un mauvais email OU un bon email avec un mauvais mot de passe, le message d'erreur est exactement le même ("identifiants invalides"). Si on avait affiché des messages différents ("cet email n'existe pas" vs "mot de passe incorrect"), une personne malveillante aurait pu s'en servir pour deviner quels emails sont inscrits chez nous.
- **Les "clés d'accès" (tokens) qu'on donne à un utilisateur connecté expirent vite** (15 minutes pour l'accès courant). Même si une de ces clés était volée, elle ne serait utilisable que peu de temps.

## 6. Où sont rangés les mots de passe et clés secrètes du projet lui-même

Le projet a lui-même besoin de quelques secrets pour fonctionner (une clé pour fabriquer les tokens de connexion, par exemple). Ces secrets ne sont **jamais écrits dans le code** ni publiés sur GitHub — ils sont rangés à part, dans un fichier local jamais partagé, et dans un coffre-fort intégré à GitHub pour les tests automatiques.

## 7. Accès au dépôt du projet

- Le dépôt est **public** — choix fait volontairement pour permettre l'application gratuite de la protection de branche (lint + tests bloquants) sur GitHub, cette fonctionnalité n'étant pas disponible gratuitement sur un dépôt privé. Aucune donnée sensible n'est exposée par ce choix : les secrets (JWT, mots de passe) ne sont jamais commités, uniquement gérés via `.env` (local) et GitHub Secrets (CI). Seule la propriétaire du dépôt (moi) dispose des droits d'écriture directs ; toute contribution externe devrait passer par une pull request.

## 8. En résumé

| Question simple                           | Réponse                                                    |
| ----------------------------------------- | ---------------------------------------------------------- |
| A-t-on vérifié les outils qu'on utilise ? | Oui, avec `npm audit`                                      |
| Combien de failles trouvées ?             | 8 côté serveur, 2 côté navigateur                          |
| Combien corrigées ?                       | 6 sur 8                                                    |
| Pourquoi une n'a pas été corrigée ?       | Elle concerne un outil (MySQL) qu'on n'utilise pas du tout |
| Les mots de passe sont-ils protégés ?     | Oui, jamais stockés en clair                               |
| Les secrets du projet sont-ils exposés ?  | Non, jamais dans le code ni sur GitHub                     |
