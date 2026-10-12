import * as depotCoach from "../repositories/coach.repository.js";

// Met un texte sous une forme comparable : sans accents, sans majuscules,
// sans espaces au début et à la fin ("  Créteil " devient "creteil")
export const normaliser = (texte = "") =>
  texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// Vrai si le filtre est vide, ou si l'une des valeurs commence par la recherche
// (ou l'un de ses mots : « etienne » trouve « Saint-Étienne »).
// On ne cherche pas la lettre n'importe où : « l » ne doit pas trouver « Football ».
const correspond = (valeurs, filtre) => {
  const recherche = normaliser(filtre);
  if (!recherche) return true;
  return valeurs.some((valeur) => {
    const texte = normaliser(valeur ?? "");
    return (
      texte.startsWith(recherche) ||
      texte.split(/[\s'-]+/).some((mot) => mot.startsWith(recherche))
    );
  });
};

// Récupère la liste des coachs avec filtres optionnels sport et ville
export const obtenirTousLesCoachs = async ({ sport, ville } = {}) => {
  const coachs = await depotCoach.trouverTousLesCoachs();

  if (!coachs || coachs.length === 0) {
    return [];
  }

  // Filtre sans tenir compte des accents, des majuscules ni des espaces
  const coachsFiltres = coachs.filter(
    (coach) =>
      correspond(
        coach.sports.map((s) => s.sport.nom),
        sport,
      ) && correspond([coach.utilisateur.ville], ville),
  );

  // Formate les données avant de les renvoyer au controller
  return coachsFiltres.map((coach) => ({
    id: coach.id,
    presentation: coach.presentation,
    tarif_horaire: coach.tarif_horaire,
    note_moyenne: coach.note_moyenne,
    statut_validation: coach.statut_validation,
    nom: coach.utilisateur.nom,
    prenom: coach.utilisateur.prenom,
    ville: coach.utilisateur.ville,
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
    statut_validation: coach.statut_validation,
    nom: coach.utilisateur.nom,
    prenom: coach.utilisateur.prenom,
    email: coach.utilisateur.email,
    sports: coach.sports.map((s) => s.sport.nom),
  };
};
