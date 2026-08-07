import * as depotReservation from "../repositories/reservation.repository.js";
import * as depotCreneau from "../repositories/creneau.repository.js";

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
  const maintenant = new Date();
  const differenceHeures = (dateCreneau - maintenant) / (1000 * 60 * 60);

  if (differenceHeures < 24) {
    const erreur = new Error(
      "Impossible d'annuler moins de 24h avant la séance",
    );
    erreur.status = 400;
    throw erreur;
  }

  return depotReservation.annulerReservation(reservationId);
};
