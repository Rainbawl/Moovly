# 📖 Guide d'utilisation — Moovly

Ce guide décrit le parcours de chaque rôle une fois l'application lancée (voir [README.md](../README.md) pour l'installation).

## 🏃 Parcours Sportif

### S'inscrire

1. Depuis la page d'accueil, cliquer sur **« S'inscrire »**
2. Choisir le rôle **Sportif** (sélectionné par défaut)
3. Renseigner prénom, nom, email et mot de passe
4. Valider — redirection vers la page de connexion ; le compte est utilisable immédiatement

### Trouver et réserver un coach

1. Depuis l'accueil, cliquer sur **« Voir les coachs »**
2. Filtrer la liste par **sport** et/ou par **ville**
3. Cliquer sur un coach pour consulter son profil : présentation, tarif, sports pratiqués
4. Choisir une date — les créneaux du coach s'affichent (matin 8h–12h, après-midi 14h–18h)
5. Cliquer sur **« Réserver »** sur un créneau disponible (un créneau déjà pris n'a pas de bouton « Réserver »)
6. Si le sportif n'est pas connecté, le clic renvoie vers la page de connexion
7. Un message de confirmation s'affiche ; la réservation apparaît dans le tableau de bord avec le statut **en attente**, jusqu'à la réponse du coach

### Modifier une réservation

1. Depuis le tableau de bord, cliquer sur **« Modifier »**
2. Choisir un nouveau créneau **chez le même coach** puis cliquer sur **« Réserver »**
3. La modification n'est pas soumise à la règle des 24 h : on change d'horaire sans quitter le coach
4. Pour changer de coach, il faut **annuler** la réservation puis réserver chez l'autre coach (la règle des 24 h s'applique alors)
5. Si le nouveau créneau vient d'être pris, la modification est refusée et **l'ancienne réservation est conservée**

### Annuler une réservation

1. Depuis le tableau de bord, cliquer sur **« Annuler »**
2. L'annulation est possible **jusqu'à 24 h avant la séance** ; en deçà, le message « Impossible d'annuler moins de 24h avant la séance » s'affiche et la réservation est conservée
3. Une fois annulée, le créneau redevient disponible pour les autres sportifs

### Consulter son historique

1. Le tableau de bord affiche les réservations en cours (en attente, confirmées)
2. Le lien **« Voir l'historique »** affiche aussi les réservations annulées et refusées

## 🎯 Parcours Coach

### Créer son compte

1. S'inscrire en choisissant le rôle **Coach**
2. Renseigner en plus le diplôme, une présentation et le tarif horaire
3. ⚠️ Le compte n'est pas actif immédiatement : la connexion est refusée tant qu'un administrateur ne l'a pas validé

### Publier ses créneaux

1. Une fois le compte validé, se connecter
2. Depuis le tableau de bord, choisir une date et une période (matin ou après-midi), puis **« Ajouter le créneau »**
3. Un coach ne peut pas publier deux fois le même créneau (même date, même période)

### Répondre aux demandes

1. Les demandes des sportifs apparaissent dans le planning, sous le créneau concerné
2. **Accepter** : la réservation passe à « confirmée » et le créneau devient « réservé »
3. **Refuser** : la réservation passe à « refusée » et le créneau redevient disponible

## 🛡️ Parcours Administrateur

### Valider un coach

1. Se connecter avec le compte admin
2. Le tableau de bord affiche les coachs en attente de validation, avec leur diplôme, leur présentation et leur tarif
3. **Valider** (le coach devient visible et peut se connecter) ou **Rejeter**

### Superviser la plateforme

1. Consulter les statistiques globales : utilisateurs, coachs actifs, réservations, coachs en attente
2. Créer de nouveaux sports dans la section **« Gestion des sports »**

---

## 🔄 Statuts d'une réservation

| Statut       | Signification                                                |
| ------------ | ------------------------------------------------------------ |
| `en_attente` | Réservation créée, en attente de la réponse du coach         |
| `confirmee`  | Acceptée par le coach                                        |
| `refusee`    | Refusée par le coach                                         |
| `annulee`    | Annulée par le sportif, ou remplacée lors d'une modification |
| `terminee`   | Séance confirmée et passée (après 12h pour le matin, 18h pour l'après-midi) |

## 🔄 Statuts d'un créneau

| Statut       | Signification                                         |
| ------------ | ----------------------------------------------------- |
| `disponible` | Le créneau peut être réservé                          |
| `en_attente` | Une demande de réservation attend la réponse du coach |
| `reserve`    | La réservation a été acceptée par le coach            |
