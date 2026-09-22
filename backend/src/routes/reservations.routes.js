import express from "express";
import * as controleurReservation from "../controllers/reservation.controller.js";
import verifyToken from "../middleware/verifyToken.js";
import verifyRole from "../middleware/verifyRole.js";

const routeur = express.Router();

// GET /reservations/mine : Historique du sportif connecté (protégée)
routeur.get(
  "/mine",
  verifyToken,
  verifyRole("sportif", "admin"),
  controleurReservation.obtenirMesReservations,
);

// POST /reservations : Créer une réservation (protégée pour le sportif uniquement)
routeur.post(
  "/",
  verifyToken,
  verifyRole("sportif"),
  controleurReservation.creerReservation,
);

// PUT /reservations/:id : Modifier une réservation
routeur.put(
  "/:id",
  verifyToken,
  verifyRole("sportif"),
  controleurReservation.modifierReservation,
);

// DELETE /reservations/:id : Annuler une réservation (protégée)
routeur.delete(
  "/:id",
  verifyToken,
  verifyRole("sportif", "admin"),
  controleurReservation.annulerReservation,
);

// PUT /reservations/:id/repondre : Le coach accepte ou refuse une réservation (protégée — coach uniquement)
routeur.put(
  "/:id/repondre",
  verifyToken,
  verifyRole("coach"),
  controleurReservation.repondreReservation,
);
export default routeur;
