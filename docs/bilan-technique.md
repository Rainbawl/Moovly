# Bilan technique & dette consciente — Arc 3 Moovly

_Ce bilan a été rédigé à la fin de l'Arc 3 (septembre 2026). La [section 7](#7-mise-à-jour-doctobre-2026-préparation-de-la-soutenance) fait le point en octobre 2026 : chiffres à jour, nouvelles corrections et dette restante._

## 1. Inventaire honnête

### Terminé

| Élément                          | Détail                                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| CI GitHub Actions                | Fonctionnelle — lint + tests backend + build frontend, bloquante à chaque Pull Request (88 tests à la fin de l'Arc 3, 141 en octobre) |
| Protection de branche sur `main` | Active — fusion impossible si la CI échoue                                                                                  |
| Corrections ciblées S13          | 3 corrections réelles identifiées et corrigées (détail section 3)                                                           |
| ADR                              | 6 décisions documentées, vérifiées une à une contre le code réel                                                            |
| Audit de sécurité                | Réalisé sur backend et frontend (`npm audit`), documenté avec arbitrages                                                    |
| Documentation d'exploitation     | README, guide d'installation, politique de sécurité                                                                         |
| Scénario de démo                 | Parcours principal + cas d'erreur volontaire rédigés                                                                        |

### En cours

| Élément                                           | Détail                                                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Généralisation du workflow branche + Pull Request | Les premières corrections (S13) ont été poussées directement sur `main` ; le passage systématique par une branche dédiée n'a été pleinement adopté qu'en fin d'arc |
| Runbook d'exploitation                            | Existant, en cours de vérification finale par rapport aux 3 questions clés exigées                                                                                 |

### Abandonné (volontairement, hors périmètre de cet arc)

| Élément                                                           | Raison                                                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Déploiement continu (Railway)                                     | Non exigé par le CCP3 sur cet arc ; le temps disponible a été priorisé sur la CI, la sécurité et la documentation plutôt que sur l'infrastructure de mise en production (voir ADR-06)                         |
| Nettoyage automatique des créneaux verrouillés expirés (job cron) | Sans objet en V1 : le verrou n'a pas d'effet réel, c'est le statut du créneau qui le protège (voir section 2) ; à reconsidérer avec le paiement en V2 |

## 2. Dette technique consciente

| Dette                                                    | Description                                                                                                                                                  | Implication si non traitée                                                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vulnérabilité `mysql2` (dépendance transitive de Prisma) | Non corrigée car liée à une fonctionnalité MySQL que le projet n'utilise pas (PostgreSQL uniquement) ; la corriger imposerait un downgrade cassant de Prisma | Aucun risque réel identifié dans le contexte actuel ; à réévaluer si le projet change d'ORM ou de base de données                                                      |
| Verrou de 10 minutes sans effet réel                     | Le contrôle de `verrouille_jusqua` n'est jamais atteint : un créneau réservé passe au statut `en_attente`, déjà refusé avant ce contrôle (constat du rapport de couverture, octobre) | Aucun risque : c'est le statut qui protège le créneau ; le verrou servira en V2 pour bloquer un créneau pendant un paiement |
| Pas de déploiement en production                         | Le projet n'est accessible qu'en local                                                                                                                       | Un tiers ne peut pas tester l'application sans l'installer lui-même (documentation d'installation prévue à cet effet)                                                  |
| Adoption tardive du workflow branche + PR                | Une partie de l'historique Git ne suit pas encore cette pratique                                                                                             | Aucun impact sur le code lui-même ; c'est une évolution de méthode de travail plutôt qu'une dette sur le produit                                                       |

## 3. Les 3 corrections ciblées S13

| #   | Ce qui était cassé                                                                                                                                                                                                                   | Ce qui a été réparé                                                               | Ce qui pourrait casser encore                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `reservation.controller.js` : la fonction de modification de réservation contenait une erreur de syntaxe (accolade fermée trop tôt, bloc `catch` invalide, variable mal nommée), rendant la modification de réservation inutilisable | Fonction réécrite correctement, testée manuellement                               | Couvert depuis par des tests automatisés (TU-048 à TU-053, TI-051 à TI-058) ; la règle métier elle-même a été corrigée en octobre (section 7) |
| 2   | Le filtre `ville` était accepté par l'API (`GET /coaches?ville=...`) mais jamais appliqué à la requête réelle en base — un utilisateur filtrant par ville recevait silencieusement tous les coachs                                   | Filtre réellement appliqué sur le champ `ville` de l'utilisateur associé au coach | Vérifié depuis : le filtre par ville fonctionne (test End to End, scène 5)                                                                                                              |
| 3   | Les échecs de vérification de token et les échecs de connexion à la base de données n'étaient jamais journalisés côté serveur — aucune trace en cas de problème                                                                      | Ajout de `console.error` ciblés dans `verifyToken.js` et `index.js`               | Ces logs partent actuellement uniquement dans la console du serveur ; en production, un outil de centralisation des logs serait nécessaire pour les consulter facilement               |

## 4. Un moment difficile pendant l'Arc 3

La mise en place de la CI a pris beaucoup plus de temps que prévu. Plusieurs blocages successifs se sont enchaînés : un `package-lock.json` désynchronisé (côté backend puis côté frontend), des erreurs de lint non corrigées avant le premier push, une confusion sur la gestion des secrets JWT, puis la découverte tardive que la protection de branche configurée ne s'appliquait pas réellement (limite de GitHub sur un dépôt privé en compte gratuit).

Sur le moment, ça a généré beaucoup de frustration et de découragement — le sentiment de ne jamais y arriver, à chaque fois qu'un problème semblait résolu, un autre apparaissait juste derrière.

Ce qui a permis de ne pas lâcher, c'est une méthode plutôt qu'une motivation abstraite : à chaque blocage, revenir au tout début du problème, l'analyser calmement, chercher (documentation, web, IA), puis noter sur un bloc-notes l'avancée et ce qui n'était pas encore compris, pour y revenir plus tard si besoin. Cette façon de faire a permis d'avancer plus vite dans le code, et surtout de mieux comprendre chaque correction plutôt que de la subir.

## 5. Ce qui a été appris sur la phase de livraison

- Une CI qui "tourne" ne veut rien dire si elle n'est pas réellement bloquante — la configuration de la protection de branche fait partie intégrante de la CI, pas une option annexe
- Comparer deux versions d'un même fichier permet de détecter des bugs réels invisibles autrement (cas du filtre `ville`)
- La documentation d'une décision (ADR) doit être vérifiée contre le code réel, pas rédigée une fois puis oubliée — un ADR obsolète devient un risque à l'oral plutôt qu'un atout

## 6. Ce qui reste fragile, personnellement

Si tout était à refaire seule, sans accompagnement, ce qui resterait le plus difficile serait le code en lui-même, plus que la compréhension de ce à quoi il sert. Les étapes techniques mises en place pour la CI durant cet arc restent encore floues dans le détail de leur écriture, même si leur rôle et leur utilité sont bien compris. Il en va de même pour des notions comme le hachage, le CRUD, le JWT ou l'authentification : le principe et l'intérêt sont acquis, mais la capacité à les réécrire seule, sans support, reste à consolider.

## 7. Mise à jour d'octobre 2026 (préparation de la soutenance)

### Chiffres à jour

| Élément | Valeur |
| ------- | ------ |
| Tests backend | 141 (70 unitaires, 71 d'intégration) |
| Couverture | 100 % des fonctions, 97,19 % des lignes, 99,5 % des lignes des services |
| Test End to End | 1 parcours Playwright en 9 scènes, 35 vérifications (voir [scénario de démo](./scenario-demo.md)) |
| Accessibilité (Lighthouse) | 100 sur les 4 pages publiques, en mobile et en desktop (84 à 97 avant corrections) |
| SEO (Lighthouse) | 100 (83 avant corrections) |

### Corrections apportées (pull requests n° 5 à 10, puis statut terminée)

| # | Ce qui était cassé | Ce qui a été réparé |
| - | ------------------ | ------------------- |
| 1 | La modification d'une réservation acceptait un créneau d'un autre coach : changer de coach contournait la règle des 24 h. Et l'ancienne réservation était annulée avant la nouvelle : si le nouveau créneau était pris, le sportif perdait tout | Modification limitée au même coach (400 sinon) et réalisée en une seule transaction ; tests TU-052, TU-053, TI-057, TI-058, écrits d'abord en échec puis passés au vert |
| 2 | Un mauvais mot de passe renvoyait un 401 que l'intercepteur Axios prenait pour un token expiré : la page se rechargeait et le message d'erreur disparaissait | Les routes `/auth/` ne déclenchent plus le renouvellement du token |
| 3 | Une annulation refusée affichait un message générique au lieu de la règle des 24 h | Le tableau de bord affiche le message du serveur |
| 4 | Audit Lighthouse : champs sans étiquette, contraste insuffisant sur la carte blanche, ordre des titres, pas de meta description | Étiquettes reliées, couleurs corrigées, `h2`, `lang="fr"`, meta description, `robots.txt` |
| 5 | Le statut `terminee` existait dans le schéma mais n'était jamais attribué : une séance passée restait « confirmée » | Statut calculé à la lecture (`statutAffiche`) : une réservation confirmée dont la séance est finie est renvoyée `terminee`, pour le sportif et pour le coach ; tests TU-054 à TU-058 |

### Dette restante

| Dette | Implication |
| ----- | ----------- |
| Les tests d'intégration écrivent dans la base de développement | Elle se remplit de comptes de test : nettoyage manuel avant chaque démo ([procédure](./Exploitation.md#nettoyer-la-base-de-développement-avant-une-démo)) ; amélioration prévue : base de test séparée en local |
| Le test End to End est hors du dépôt et hors de la CI | Il ne protège pas automatiquement contre les régressions ; à intégrer au dépôt puis à la CI |
| Test TI-034 lent (planning d'un coach de près de 400 créneaux) | Peut dépasser le délai de 5 secondes quand toute la suite tourne |
| Nouvel audit `npm audit` (9 octobre) : 13 vulnérabilités backend, 2 frontend | Voir le [rapport d'audit](./audit-securite.md#9-nouvel-audit-du-9-octobre-2026) |
| Pas de limitation des tentatives de connexion, access token dans le `localStorage` | Voir les [limites connues](./securite.md#limites-connues-dette-consciente) |
