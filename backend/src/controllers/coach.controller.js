import * as serviceCoach from "../services/coach.service.js";

// GET /coaches — Liste des coachs avec filtres optionnels
export const obtenirTousLesCoachs = async (requete, reponse, suite) => {
  try {
    // Récupère les filtres depuis l'URL (?sport=Tennis&ville=Paris)
    const { sport, ville } = requete.query;

    const coachs = await serviceCoach.obtenirTousLesCoachs({ sport, ville });

    reponse.status(200).json({
      total: coachs.length,
      coachs,
    });
  } catch (erreur) {
    suite(erreur);
  }
};

// GET /coaches/:id — Profil d'un coach
export const obtenirCoachParId = async (requete, reponse, suite) => {
  try {
    // Récupère l'id depuis l'URL (/coaches/1)
    const { id } = requete.params;

    const coach = await serviceCoach.obtenirCoachParId(id);

    reponse.status(200).json({ coach });
  } catch (erreur) {
    suite(erreur);
  }
};
//suite : passe l'erreur au middleware de gestion d'erreurs
