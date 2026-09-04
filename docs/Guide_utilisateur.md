# 📖 Guide d'utilisation — Moovly

Ce guide décrit le parcours de chaque rôle une fois l'application lancée (voir [README.md](./README.md) pour l'installation).

## 🏃 Parcours Sportif

### S'inscrire

1. Depuis la page d'accueil, cliquer sur **« S'inscrire »**
2. Choisir le rôle **Sportif**
3. Renseigner prénom, nom, email et mot de passe (8 caractères minimum)
4. Valider — redirection automatique vers la page de connexion

### Trouver et réserver un coach

1. Se connecter avec son compte sportif
2. Depuis l'accueil, parcourir la liste des coachs disponibles ou filtrer par discipline sportive
3. Cliquer sur un coach pour consulter son profil : présentation, tarif, sports pratiqués
4. Sélectionner une date dans le calendrier — les créneaux disponibles (matin / après-midi) s'affichent
5. Cliquer sur **« Réserver »** sur le créneau souhaité
6. Un message de confirmation s'affiche ; la réservation apparaît avec le statut **en_attente**

### Consulter et annuler ses réservations

1. Depuis le tableau de bord (**Dashboard**), la liste de toutes les réservations passées et à venir s'affiche, avec leur statut
2. Une réservation peut être annulée depuis cette liste — le créneau redevient alors disponible pour d'autres sportifs

## 🎯 Parcours Coach

### Créer son compte

1. S'inscrire en choisissant le rôle **Coach**
2. ⚠️ Le compte n'est pas actif immédiatement : il doit être validé par un administrateur avant de pouvoir créer des créneaux

### Gérer ses créneaux

1. Une fois le compte validé, se connecter
2. Depuis le tableau de bord coach, créer un créneau en choisissant une date et une période (matin 8h–12h ou après-midi 14h–18h)
3. Consulter le planning des créneaux créés et leur statut (disponible, en attente, réservé)

## 🛡️ Parcours Administrateur

### Valider un coach

1. Se connecter avec le compte admin
2. Le tableau de bord affiche la liste des coachs en attente de validation
3. Valider ou rejeter chaque profil

### Superviser la plateforme

1. Consulter les statistiques globales : nombre total d'utilisateurs, de coachs actifs, de réservations, de coachs en attente
2. Gérer la liste des disciplines sportives disponibles (ajout de nouveaux sports)

---

## 🔄 Statuts d'une réservation

| Statut       | Signification                                        |
| ------------ | ---------------------------------------------------- |
| `en_attente` | Réservation créée, créneau temporairement verrouillé |
| `confirmee`  | Réservation validée                                  |
| `annulee`    | Réservation annulée par le sportif ou l'admin        |
| `terminee`   | Séance passée                                        |

## 🔄 Statuts d'un créneau

| Statut Signification

| `disponible` | Le créneau peut être réservé |
| `en_attente` | Le créneau est temporairement verrouillé (réservation en cours, 10 minutes) |
| `reserve` | Le créneau est réservé |
