import * as depotCoach from "../repositories/coach.repository.js";

// Récupère la liste des coachs avec filtres optionnels
export const obtenirTousLesCoachs = async (filtres) => {
  const coachs = await depotCoach.trouverTousLesCoachs(filtres);

  if (!coachs || coachs.length === 0) {
    return [];
  }

  // Formate les données avant de les renvoyer au controller
  return coachs.map((coach) => ({
    id: coach.id,
    presentation: coach.presentation,
    tarif_horaire: coach.tarif_horaire,
    note_moyenne: coach.note_moyenne,
    nom: coach.utilisateur.nom,
    prenom: coach.utilisateur.prenom,
    sports: coach.sports.map((s) => s.sport.nom),
  }));
};

// Récupère un coach par son identifiant
export const obtenirCoachParId = async (identifiant) => {
  const coach = await depotCoach.trouverCoachParId(identifiant);

  if (!coach) {
    const erreur = new Error("Coach introuvable");
    erreur.status = 404;
    throw erreur;
  }

  return {
    id: coach.id,
    presentation: coach.presentation,
    tarif_horaire: coach.tarif_horaire,
    note_moyenne: coach.note_moyenne,
    est_valide: coach.est_valide,
    nom: coach.utilisateur.nom,
    prenom: coach.utilisateur.prenom,
    email: coach.utilisateur.email,
    sports: coach.sports.map((s) => s.sport.nom),
  };
};
