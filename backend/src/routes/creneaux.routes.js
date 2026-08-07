import express from "express";
import * as controleurCreneau from "../controllers/creneau.controller.js";
import verifyToken from "../middleware/verifyToken.js";
import verifyRole from "../middleware/verifyRole.js";

const routeur = express.Router({ mergeParams: true });
// mergeParams: true — permet de récupérer :id du coach depuis la route parente /coaches/:id/creneaux

// GET /coaches/:id/creneaux?date=2026-07-15
// Public — tout le monde peut voir les créneaux d'un coach
routeur.get("/", controleurCreneau.obtenirCreneauxCoach);

// POST /coaches/:id/creneaux
// Protégé — uniquement le coach connecté peut créer un créneau
routeur.post(
  "/",
  verifyToken,
  verifyRole("coach", "admin"),
  controleurCreneau.creerCreneau,
);

export default routeur;
