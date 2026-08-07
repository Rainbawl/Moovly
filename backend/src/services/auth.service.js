// Service d'authentification
// Contient toute la logique métier liée à l'auth
// Ne touche pas à req/res — uniquement la logique pure

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as authRepository from "../repositories/auth.repository.js";

// Hash le mot de passe avec bcrypt (10 rounds = bon compromis sécurité/performance)
export const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

// Compare un mot de passe en clair avec son hash bcrypt
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Génère un access token JWT — expire dans 15 minutes
// Contient : id utilisateur + rôle (pour verifyRole)
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }, // 15m
  );
};

// Génère un refresh token JWT — expire dans 7 jours
// Contient uniquement l'id (moins d'infos = plus sécurisé)
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }, // 7d
  );
};

// Inscription d'un nouvel utilisateur
export const register = async (data) => {
  // Vérifie si l'email est déjà utilisé
  const existingUser = await authRepository.findUserByEmail(data.email);
  if (existingUser) {
    const error = new Error("Email déjà utilisé");
    error.status = 409;
    throw error;
  }

  // Hash le mot de passe avant de le stocker — jamais en clair en BDD
  const hashedPassword = await hashPassword(data.mot_de_passe);

  // Crée l'utilisateur en BDD
  const user = await authRepository.createUser({
    ...data,
    mot_de_passe: hashedPassword,
  });

  // Si c'est un coach, crée aussi le profil coach (est_valide=false par défaut)
  // Le coach devra être validé par un admin avant de pouvoir créer des créneaux
  if (data.role === "coach") {
    await authRepository.createCoach(user.id);
  }

  return user;
};

// Connexion d'un utilisateur existant
export const login = async (email, password) => {
  // Cherche l'utilisateur par email
  const user = await authRepository.findUserByEmail(email);

  // Message générique intentionnel — ne révèle pas si l'email existe
  // Protège contre les attaques d'énumération d'emails
  if (!user) {
    const error = new Error("Identifiants invalides");
    error.status = 401;
    throw error;
  }

  // Vérifie le mot de passe
  const isValid = await comparePassword(password, user.mot_de_passe);
  if (!isValid) {
    const error = new Error("Identifiants invalides");
    error.status = 401;
    throw error;
  }

  // Génère les deux tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { accessToken, refreshToken, user };
};
