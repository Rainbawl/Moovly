// Middleware de vérification du rôle
// Utilisé après verifyToken pour restreindre l'accès selon le rôle
// Exemple : verifyRole('admin') ou verifyRole('coach', 'admin')

const verifyRole = (...roles) => {
  return (req, res, next) => {
    // Vérifie que verifyToken a bien été appelé avant
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    // Vérifie que le rôle de l'utilisateur est dans la liste autorisée
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    next();
  };
};

export default verifyRole;
