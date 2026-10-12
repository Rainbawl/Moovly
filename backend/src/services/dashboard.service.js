import * as depotDashboard from "../repositories/dashboard.repository.js";
import { statutAffiche } from "./reservation.service.js";

// Récupère le planning complet du coach connecté
export const obtenirPlanningCoach = async (utilisateurId) => {
  const coach = await depotDashboard.trouverPlanningCoach(utilisateurId);

  if (!coach) {
    const erreur = new Error("Profil coach introuvable");
    erreur.status = 404;
    throw erreur;
  }

  // Formate les créneaux avec les réservations associées.
  // Seules les réservations en cours (en attente ou confirmées) sont gardées :
  // une réservation refusée ou annulée a libéré le créneau, afficher le nom
  // du sportif sous un créneau « disponible » induirait le coach en erreur.
  const creneaux = coach.creneaux.map((creneau) => ({
    id: creneau.id,
    date: creneau.date,
    periode: creneau.periode,
    horaire: creneau.periode === "matin" ? "8h00 - 12h00" : "14h00 - 18h00",
    statut: creneau.statut,
    reservations: creneau.reservations
      .filter((reservation) => ["en_attente", "confirmee"].includes(reservation.statut))
      .map((reservation) => ({
      id: reservation.id,
      statut: statutAffiche(reservation, creneau),
      sportif: {
        nom: reservation.utilisateur.nom,
        prenom: reservation.utilisateur.prenom,
        email: reservation.utilisateur.email,
      },
    })),
  }));

  // Un créneau passé n'est gardé que s'il a eu une séance confirmée (affichée
  // « terminee ») : un créneau passé jamais réservé, ou une demande restée sans
  // réponse, ne sert plus à rien et allongeait inutilement le planning.
  const debutDuJour = new Date();
  debutDuJour.setHours(0, 0, 0, 0);
  const creneauxAffiches = creneaux.filter(
    (creneau) =>
      new Date(creneau.date) >= debutDuJour ||
      creneau.reservations.some((r) => ["confirmee", "terminee"].includes(r.statut)),
  );

  // Ordre d'affichage : d'abord les créneaux avec une demande à traiter,
  // puis les créneaux réservés, et les créneaux encore disponibles à la fin.
  // Dans chaque groupe : par date, le matin avant l'après-midi.
  const priorite = (creneau) => {
    if (creneau.reservations.some((r) => r.statut === "en_attente")) return 0;
    if (creneau.statut === "disponible") return 2;
    return 1;
  };
  creneauxAffiches.sort(
    (a, b) =>
      priorite(a) - priorite(b) ||
      new Date(a.date) - new Date(b.date) ||
      (a.periode === "matin" ? 0 : 1) - (b.periode === "matin" ? 0 : 1),
  );

  return {
    id: coach.id,
    statut_validation: coach.est_valide,
    presentation: coach.presentation,
    tarif_horaire: coach.tarif_horaire,
    note_moyenne: coach.note_moyenne,
    creneaux: creneauxAffiches,
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
