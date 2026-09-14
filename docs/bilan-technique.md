# Bilan technique & dette consciente — Arc 3 Moovly

## 1. Inventaire honnête

### Terminé

| Élément                          | Détail                                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| CI GitHub Actions                | Fonctionnelle — lint + tests (backend, 88 tests, 87,27 % de couverture) + build (frontend), bloquante à chaque Pull Request |
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
| Nettoyage automatique des créneaux verrouillés expirés (job cron) | Le mécanisme de verrouillage fonctionne sans ce nettoyage proactif (le verrou expiré est revérifié à la prochaine tentative) ; l'ajouter n'apportait pas de valeur suffisante par rapport au temps disponible |

## 2. Dette technique consciente

| Dette                                                    | Description                                                                                                                                                  | Implication si non traitée                                                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vulnérabilité `mysql2` (dépendance transitive de Prisma) | Non corrigée car liée à une fonctionnalité MySQL que le projet n'utilise pas (PostgreSQL uniquement) ; la corriger imposerait un downgrade cassant de Prisma | Aucun risque réel identifié dans le contexte actuel ; à réévaluer si le projet change d'ORM ou de base de données                                                      |
| Pas de nettoyage automatique des créneaux expirés        | Le verrou de 10 minutes n'est libéré qu'à la prochaine tentative de réservation sur ce créneau précis, jamais de façon proactive                             | Un créneau verrouillé sans nouvelle tentative reste marqué "en_attente" plus longtemps que nécessaire dans l'affichage, sans bloquer le fonctionnement réel du système |
| Pas de déploiement en production                         | Le projet n'est accessible qu'en local                                                                                                                       | Un tiers ne peut pas tester l'application sans l'installer lui-même (documentation d'installation prévue à cet effet)                                                  |
| Adoption tardive du workflow branche + PR                | Une partie de l'historique Git ne suit pas encore cette pratique                                                                                             | Aucun impact sur le code lui-même ; c'est une évolution de méthode de travail plutôt qu'une dette sur le produit                                                       |

## 3. Les 3 corrections ciblées S13

| #   | Ce qui était cassé                                                                                                                                                                                                                   | Ce qui a été réparé                                                               | Ce qui pourrait casser encore                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `reservation.controller.js` : la fonction de modification de réservation contenait une erreur de syntaxe (accolade fermée trop tôt, bloc `catch` invalide, variable mal nommée), rendant la modification de réservation inutilisable | Fonction réécrite correctement, testée manuellement                               | Toute nouvelle modification de ce fichier sans repasser par une revue pourrait réintroduire ce type d'erreur ; aucun test automatisé ne couvre spécifiquement cette fonction à ce jour |
| 2   | Le filtre `ville` était accepté par l'API (`GET /coaches?ville=...`) mais jamais appliqué à la requête réelle en base — un utilisateur filtrant par ville recevait silencieusement tous les coachs                                   | Filtre réellement appliqué sur le champ `ville` de l'utilisateur associé au coach | Le nom du champ en base a été supposé lors de la correction ; à vérifier une dernière fois contre le schéma Prisma réel                                                                |
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
