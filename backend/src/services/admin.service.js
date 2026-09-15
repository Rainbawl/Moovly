import * as depotAdmin from "../repositories/admin.repository.js";

// Récupère les coachs en attente de validation
export const obtenirCoachsEnAttente = async () => {
  const coachs = await depotAdmin.trouverCoachsEnAttente();

  return coachs.map((coach) => ({
    id: coach.id,
    statut_validation: coach.statut_validation,
    presentation: coach.presentation,
    tarif_horaire: coach.tarif_horaire,
    nom: coach.utilisateur.nom,
    prenom: coach.utilisateur.prenom,
    email: coach.utilisateur.email,
    date_inscription: coach.utilisateur.date_creation,
    sports: coach.sports.map((s) => s.sport.nom),
  }));
};

// Valide ou rejette un coach
export const validerCoach = async (coachId, estValide) => {
  const coach = await depotAdmin.validerCoach(coachId, estValide);

  if (!coach) {
    const erreur = new Error("Coach introuvable");
    erreur.status = 404;
    throw erreur;
  }

  return {
    id: coach.id,
    statut_validation: coach.statut_validation,
    message: estValide ? "Coach validé avec succès" : "Coach rejeté",
  };
};

// Récupère tous les sports
export const obtenirTousLesSports = async () => {
  return depotAdmin.trouverTousLesSports();
};

// Crée un nouveau sport
export const creerSport = async (nom) => {
  if (!nom || nom.trim() === "") {
    const erreur = new Error("Le nom du sport est obligatoire");
    erreur.status = 400;
    throw erreur;
  }

  try {
    return await depotAdmin.creerSport(nom.trim());
  } catch (erreur) {
    // Gère le doublon de sport
    if (erreur.code === "P2002") {
      const doublon = new Error("Ce sport existe déjà");
      doublon.status = 409;
      throw doublon;
    }
    throw erreur;
  }
};

// Récupère les statistiques globales
export const obtenirStatistiques = async () => {
  return depotAdmin.obtenirStatistiques();
};
