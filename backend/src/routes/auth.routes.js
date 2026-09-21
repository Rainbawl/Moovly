// Routes d'authentification
// Définit les URLs et applique les middlewares sur chaque route
// Route → Middleware → Controller

import express from "express";
import * as authController from "../controllers/auth.controller.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// POST /auth/register — Inscription sportif ou coach (public)
router.post("/register", authController.register);

// POST /auth/login — Connexion avec email/mdp (public)
router.post("/login", authController.login);

// POST /auth/logout — Déconnexion (protégée — JWT requis)
router.post("/logout", verifyToken, authController.logout);

// POST /auth/refresh — Régénère un access token à partir du refresh token (cookie)
router.post("/refresh", authController.refresh);

export default router;
