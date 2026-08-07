import * as serviceReservation from "../services/reservation.service.js";

// POST /reservations — Créer une réservation
export const creerReservation = async (requete, reponse, suite) => {
  try {
    // L'utilisateur connecté vient de req.user (mis par verifyToken)
    const utilisateurId = requete.user.id;
    const { creneau_id } = requete.body;

    if (!creneau_id) {
      return reponse.status(400).json({
        error: "L'identifiant du créneau est obligatoire",
      });
    }

    const reservation = await serviceReservation.creerReservation(
      utilisateurId,
      creneau_id,
    );

    reponse.status(201).json({
      message: "Réservation créée avec succès",
      reservation,
    });
  } catch (erreur) {
    suite(erreur);
  }
};

// GET /reservations/mine — Historique du sportif connecté
export const obtenirMesReservations = async (requete, reponse, suite) => {
  try {
    // L'utilisateur connecté vient de req.user (mis par verifyToken)
    const utilisateurId = requete.user.id;

    const reservations =
      await serviceReservation.obtenirMesReservations(utilisateurId);

    reponse.status(200).json({
      total: reservations.length,
      reservations,
    });
  } catch (erreur) {
    suite(erreur);
  }
};

// DELETE /reservations/:id — Annuler une réservation
export const annulerReservation = async (requete, reponse, suite) => {
  try {
    const { id } = requete.params;
    const utilisateurId = requete.user.id;

    const reservation = await serviceReservation.annulerReservation(
      id,
      utilisateurId,
    );

    reponse.status(200).json({
      message: "Réservation annulée avec succès",
      reservation,
    });
  } catch (erreur) {
    suite(erreur);
  }
};
