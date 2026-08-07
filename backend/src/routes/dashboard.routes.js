import express from "express";
import * as controleurDashboard from "../controllers/dashboard.controller.js";
import verifyToken from "../middleware/verifyToken.js";
import verifyRole from "../middleware/verifyRole.js";

const routeur = express.Router();

// GET /dashboard/coach — Planning du coach connecté (protégée — coach uniquement)
routeur.get(
  "/coach",
  verifyToken,
  verifyRole("coach"),
  controleurDashboard.obtenirPlanningCoach,
);

// GET /dashboard/coach/stats — Statistiques du coach connecté
routeur.get(
  "/coach/stats",
  verifyToken,
  verifyRole("coach"),
  controleurDashboard.obtenirStatistiquesCoach,
);

export default routeur;
