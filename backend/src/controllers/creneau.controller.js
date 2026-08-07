import * as serviceCreneau from "../services/creneau.service.js";

// GET /coaches/:id/creneaux?date=2026-07-15
// Récupère les créneaux d'un coach pour une date donnée
export const obtenirCreneauxCoach = async (requete, reponse, suite) => {
  try {
    const { id } = requete.params; // identifiant du coach dans l'URL
    const { date } = requete.query; // date dans les paramètres (?date=...)

    // Vérifie que la date est fournie
    if (!date) {
      return reponse.status(400).json({
        error: "La date est obligatoire (?date=YYYY-MM-DD)",
      });
    }

    const creneaux = await serviceCreneau.obtenirCreneauxCoach(id, date);

    reponse.status(200).json({
      total: creneaux.length,
      creneaux,
    });
  } catch (erreur) {
    suite(erreur);
  }
};

// POST /coaches/:id/creneaux
// Crée un nouveau créneau (coach connecté uniquement)
export const creerCreneau = async (requete, reponse, suite) => {
  try {
    const { id } = requete.params; // identifiant du coach dans l'URL
    const { date, periode } = requete.body; // date et période dans le body

    // Vérifie que les champs obligatoires sont présents
    if (!date || !periode) {
      return reponse.status(400).json({
        error: "La date et la période sont obligatoires",
      });
    }

    const creneau = await serviceCreneau.creerCreneau(id, date, periode);

    reponse.status(201).json({
      message: "Créneau créé avec succès",
      creneau,
    });
  } catch (erreur) {
    suite(erreur);
  }
};
