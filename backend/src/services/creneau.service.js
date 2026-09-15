import * as depotCreneau from "../repositories/creneau.repository.js";
import * as depotCoach from "../repositories/coach.repository.js";

// Récupère les créneaux d'un coach pour une date donnée
export const obtenirCreneauxCoach = async (coachId, date) => {
  // Vérifie que le coach existe
  const coach = await depotCoach.trouverCoachParId(coachId);
  if (!coach) {
    const erreur = new Error("Coach introuvable");
    erreur.status = 404;
    throw erreur;
  }

  const creneaux = await depotCreneau.trouverCreneauxParCoachEtDate(
    coachId,
    date,
  );

  // Formate les créneaux avec les heures déduites selon la période
  return creneaux.map((creneau) => ({
    id: creneau.id,
    date: creneau.date,
    periode: creneau.periode,
    horaire: creneau.periode === "matin" ? "8h00 - 12h00" : "14h00 - 18h00",
    statut: creneau.statut,
  }));
};

// Crée un nouveau créneau (réservé aux coachs validés)
export const creerCreneau = async (coachId, date, periode) => {
  // Vérifie que la période est valide
  const periodesValides = ["matin", "apres_midi"];
  if (!periodesValides.includes(periode)) {
    const erreur = new Error("Période invalide — choisir matin ou apres_midi");
    erreur.status = 400;
    throw erreur;
  }

  // Vérifie que le coach est validé
  const coach = await depotCoach.trouverCoachParId(coachId);
  if (!coach) {
    const erreur = new Error("Coach introuvable");
    erreur.status = 404;
    throw erreur;
  }
  if (coach.statut_validation !== "valide") {
    const erreur = new Error(
      "Votre compte coach n'est pas encore validé par un admin",
    );
    erreur.status = 403;
    throw erreur;
  }

  try {
    const creneau = await depotCreneau.creerCreneau(coachId, date, periode);
    return {
      id: creneau.id,
      date: creneau.date,
      periode: creneau.periode,
      horaire: creneau.periode === "matin" ? "8h00 - 12h00" : "14h00 - 18h00",
      statut: creneau.statut,
    };
  } catch (erreur) {
    // Gère la contrainte UNIQUE (coach_id, date, periode)
    if (erreur.code === "P2002") {
      const doublon = new Error(
        "Un créneau existe déjà pour cette date et cette période",
      );
      doublon.status = 409;
      throw doublon;
    }
    throw erreur;
  }
};
/*throw c'est le mot pour "lancer une erreur" en JavaScript.
Quand quelque chose se passe mal, au lieu de continuer le code, on "lance" une erreur qui va remonter jusqu'au middleware de gestion d'erreurs dans index.js qui va renvoyer la réponse au client.*/
