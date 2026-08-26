// Controller d'authentification
// Reçoit les requêtes HTTP, appelle le service, renvoie la réponse
// Ne contient aucune logique métier — uniquement req/res

import * as authService from "../services/auth.service.js";

// POST /auth/register
export const register = async (req, res, next) => {
  try {
    const { nom, prenom, email, mot_de_passe, role } = req.body;
    const user = await authService.register({
      nom,
      prenom,
      email,
      mot_de_passe,
      role: role || "sportif", // sportif par défaut si rôle non précisé
    });

    res.status(201).json({
      message: "Compte créé avec succès",
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    // Passe l'erreur au middleware de gestion d'erreurs global
    next(err);
  }
};

// POST /auth/login
export const login = async (req, res, next) => {
  try {
    const { email, mot_de_passe } = req.body;

    const { accessToken, refreshToken, user } = await authService.login(
      email,
      mot_de_passe,
    );

    // Refresh token stocké en cookie httpOnly — inaccessible depuis JavaScript
    // Protection contre les attaques XSS
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS en prod uniquement
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours en millisecondes
    });

    // Access token renvoyé dans le body — stocké en mémoire côté React
    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/logout
export const logout = async (req, res) => {
  // Supprime le cookie refresh token
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Déconnexion réussie" });
};
