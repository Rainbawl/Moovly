// Middleware de vérification du JWT
// Appliqué sur toutes les routes protégées
// Vérifie que le token est présent, valide et non expiré

import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  // Récupère le token depuis le header Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // Pas de token → non authentifié
  if (!token) {
    return res.status(401).json({ error: "Token manquant" });
  }

  try {
    // Vérifie la signature et l'expiration du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ajoute les infos de l'utilisateur à la requête
    // Disponibles dans les controllers via req.user
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
};

export default verifyToken;
