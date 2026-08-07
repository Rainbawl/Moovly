import express from "express";
import * as controleurAdmin from "../controllers/admin.controller.js";
import verifyToken from "../middleware/verifyToken.js";
import verifyRole from "../middleware/verifyRole.js";

const routeur = express.Router();

// Toutes les routes admin nécessitent d'être connecté ET d'avoir le rôle admin
routeur.use(verifyToken);
routeur.use(verifyRole("admin"));

// GET /admin/coaches — Liste des coachs en attente de validation
routeur.get("/coaches", controleurAdmin.obtenirCoachsEnAttente);

// PUT /admin/coaches/:id/valider — Valider ou rejeter un coach
routeur.put("/coaches/:id/valider", controleurAdmin.validerCoach);

// GET /admin/sports — Liste des sports
routeur.get("/sports", controleurAdmin.obtenirTousLesSports);

// POST /admin/sports — Ajouter un nouveau sport
routeur.post("/sports", controleurAdmin.creerSport);

// GET /admin/stats — Statistiques globales
routeur.get("/stats", controleurAdmin.obtenirStatistiques);

export default routeur;
