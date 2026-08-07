import * as serviceDashboard from "../services/dashboard.service.js";

// GET /dashboard/coach — Planning du coach connecté
export const obtenirPlanningCoach = async (requete, reponse, suite) => {
  try {
    // L'id de l'utilisateur connecté vient de verifyToken
    const utilisateurId = requete.user.id;

    const planning = await serviceDashboard.obtenirPlanningCoach(utilisateurId);

    reponse.status(200).json({ planning });
  } catch (erreur) {
    suite(erreur);
  }
};

// GET /dashboard/coach/stats — Statistiques du coach connecté
export const obtenirStatistiquesCoach = async (requete, reponse, suite) => {
  try {
    const utilisateurId = requete.user.id;

    const statistiques =
      await serviceDashboard.obtenirStatistiquesCoach(utilisateurId);

    reponse.status(200).json({ statistiques });
  } catch (erreur) {
    suite(erreur);
  }
};
