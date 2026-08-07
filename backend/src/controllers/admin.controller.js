import * as serviceAdmin from "../services/admin.service.js";

// GET /admin/coaches — Liste des coachs en attente de validation
export const obtenirCoachsEnAttente = async (requete, reponse, suite) => {
  try {
    const coachs = await serviceAdmin.obtenirCoachsEnAttente();
    reponse.status(200).json({
      total: coachs.length,
      coachs,
    });
  } catch (erreur) {
    suite(erreur);
  }
};

// PUT /admin/coaches/:id/valider — Valider ou rejeter un coach
export const validerCoach = async (requete, reponse, suite) => {
  try {
    const { id } = requete.params;
    const { est_valide } = requete.body;

    if (est_valide === undefined) {
      return reponse.status(400).json({
        error: "Le champ est_valide est obligatoire (true ou false)",
      });
    }

    const resultat = await serviceAdmin.validerCoach(id, est_valide);

    reponse.status(200).json(resultat);
  } catch (erreur) {
    suite(erreur);
  }
};

// GET /admin/sports — Liste des sports
export const obtenirTousLesSports = async (requete, reponse, suite) => {
  try {
    const sports = await serviceAdmin.obtenirTousLesSports();
    reponse.status(200).json({
      total: sports.length,
      sports,
    });
  } catch (erreur) {
    suite(erreur);
  }
};

// POST /admin/sports — Ajouter un sport
export const creerSport = async (requete, reponse, suite) => {
  try {
    const { nom } = requete.body;

    const sport = await serviceAdmin.creerSport(nom);

    reponse.status(201).json({
      message: "Sport créé avec succès",
      sport,
    });
  } catch (erreur) {
    suite(erreur);
  }
};

// GET /admin/stats — Statistiques globales
export const obtenirStatistiques = async (requete, reponse, suite) => {
  try {
    const statistiques = await serviceAdmin.obtenirStatistiques();
    reponse.status(200).json({ statistiques });
  } catch (erreur) {
    suite(erreur);
  }
};
