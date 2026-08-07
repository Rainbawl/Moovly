import express from "express";
import * as controleurCoach from "../controllers/coach.controller.js";

const routeur = express.Router();

// GET /coaches — Liste des coachs (public — sans connexion)
routeur.get("/", controleurCoach.obtenirTousLesCoachs);

// GET /coaches/:id — Profil d'un coach (public — sans connexion)
routeur.get("/:id", controleurCoach.obtenirCoachParId);

export default routeur;
