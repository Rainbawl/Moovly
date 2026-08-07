import * as depotDashboard from "../repositories/dashboard.repository.js";

// Récupère le planning complet du coach connecté
export const obtenirPlanningCoach = async (utilisateurId) => {
  const coach = await depotDashboard.trouverPlanningCoach(utilisateurId);

  if (!coach) {
    const erreur = new Error("Profil coach introuvable");
    erreur.status = 404;
    throw erreur;
  }

  // Formate les créneaux avec les réservations associées
  const creneaux = coach.creneaux.map((creneau) => ({
    id: creneau.id,
    date: creneau.date,
    periode: creneau.periode,
    horaire: creneau.periode === "matin" ? "8h00 - 12h00" : "14h00 - 18h00",
    statut: creneau.statut,
    reservations: creneau.reservations.map((reservation) => ({
      id: reservation.id,
      statut: reservation.statut,
      sportif: {
        nom: reservation.utilisateur.nom,
        prenom: reservation.utilisateur.prenom,
        email: reservation.utilisateur.email,
      },
    })),
  }));

  return {
    id: coach.id,
    est_valide: coach.est_valide,
    presentation: coach.presentation,
    tarif_horaire: coach.tarif_horaire,
    note_moyenne: coach.note_moyenne,
    creneaux,
  };
};

// Récupère les statistiques du coach connecté
export const obtenirStatistiquesCoach = async (utilisateurId) => {
  const statistiques =
    await depotDashboard.trouverStatistiquesCoach(utilisateurId);

  if (!statistiques) {
    const erreur = new Error("Profil coach introuvable");
    erreur.status = 404;
    throw erreur;
  }

  return statistiques;
};
