import * as depotReservation from "../repositories/reservation.repository.js";

// Crée une réservation pour un sportif
export const creerReservation = async (utilisateurId, creneauId) => {
  const reservation = await depotReservation.creerReservation(
    utilisateurId,
    creneauId,
  );
  return reservation;
};

// Récupère l'historique des réservations d'un sportif
export const obtenirMesReservations = async (utilisateurId) => {
  const reservations =
    await depotReservation.trouverReservationsParUtilisateur(utilisateurId);

  // Formate les données pour le frontend
  return reservations.map((reservation) => ({
    id: reservation.id,
    statut: reservation.statut,
    date_reservation: reservation.date_reservation,
    date_annulation: reservation.date_annulation,
    creneau: {
      id: reservation.creneau.id,
      date: reservation.creneau.date,
      periode: reservation.creneau.periode,
      horaire:
        reservation.creneau.periode === "matin"
          ? "8h00 - 12h00"
          : "14h00 - 18h00",
      coach: {
        id: reservation.creneau.coach.id,
        nom: reservation.creneau.coach.utilisateur.nom,
        prenom: reservation.creneau.coach.utilisateur.prenom,
      },
    },
  }));
};

// Annule une réservation (règle des 24h)
export const annulerReservation = async (reservationId, utilisateurId) => {
  // Vérifie que la réservation existe et appartient à cet utilisateur
  const reservation =
    await depotReservation.trouverReservationParId(reservationId);

  if (!reservation) {
    const erreur = new Error("Réservation introuvable");
    erreur.status = 404;
    throw erreur;
  }

  if (reservation.utilisateur_id !== parseInt(utilisateurId)) {
    const erreur = new Error("Vous ne pouvez pas annuler cette réservation");
    erreur.status = 403;
    throw erreur;
  }

  if (reservation.statut === "annulee") {
    const erreur = new Error("Cette réservation est déjà annulée");
    erreur.status = 400;
    throw erreur;
  }

  // Règle des 24h — on vérifie la date du créneau
  const dateCreneau = new Date(reservation.creneau.date);
  // Ajuste l'heure selon la période — matin = 8h, après-midi = 14h
  dateCreneau.setHours(
    reservation.creneau.periode === "matin" ? 8 : 14,
    0,
    0,
    0,
  );

  const maintenant = new Date();
  const differenceHeures = (dateCreneau - maintenant) / (1000 * 60 * 60);

  //Cas 1 : La séance est dans moins de 24h => la séance n'est pas encore passée, mais elle arrive dans moins de 24h"
  if (differenceHeures >= 0 && differenceHeures < 24) {
    const erreur = new Error(
      "Impossible d'annuler moins de 24h avant la séance",
    );
    erreur.status = 400;
    throw erreur;
  }
  return depotReservation.annulerReservation(reservationId);
};

// Modifie une réservation en la remplaçant par une nouvelle sur un autre créneau
// Pas de règle des 24h ici — modifier un horaire n'est pas abandonner le coach
export const modifierReservation = async (
  reservationId,
  utilisateurId,
  nouveauCreneauId,
) => {
  const reservation =
    await depotReservation.trouverReservationParId(reservationId);

  if (!reservation) {
    const erreur = new Error("Réservation introuvable");
    erreur.status = 404;
    throw erreur;
  }

  if (reservation.utilisateur_id !== parseInt(utilisateurId)) {
    const erreur = new Error("Vous ne pouvez pas modifier cette réservation");
    erreur.status = 403;
    throw erreur;
  }

  if (reservation.statut === "annulee") {
    const erreur = new Error("Cette réservation est déjà annulée");
    erreur.status = 400;
    throw erreur;
  }

  // Libère l'ancien créneau SANS passer par annulerReservation (donc sans règle des 24h)
  await depotReservation.annulerReservation(reservationId);

  // Réserve le nouveau créneau (avec le verrou anti-double-réservation habituel)
  const nouvelleReservation = await creerReservation(
    utilisateurId,
    nouveauCreneauId,
  );

  return nouvelleReservation;
};
