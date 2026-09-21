import axios from "axios";

// On crée une instance Axios avec l'URL de base du backend
// Toutes les requêtes partiront de http://localhost:3001
const api = axios.create({
  baseURL: "http://localhost:3001",

  // withCredentials permet d'envoyer et recevoir les cookies
  // C'est nécessaire pour le refresh token httpOnly
  withCredentials: true,
});

// Intercepteur de requête
// Avant chaque requête envoyée au backend, on ajoute automatiquement le token JWT
// Au lieu d'écrire le token manuellement dans chaque page
api.interceptors.request.use((config) => {
  // Récupère le token stocké
  const token = localStorage.getItem("accessToken");

  // Si le token existe, on l'ajoute dans le header Authorization
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Intercepteur de réponse
// Si une requête échoue avec 401 (token expiré), on tente de le rafraîchir automatiquement
api.interceptors.response.use(
  (reponse) => reponse, // car si tout va bien on ne touche à rien
  async (erreur) => {
    const requeteOriginale = erreur.config;
    // Si l'erreur est un 401 ET qu'on n'a pas déjà essayé de rafraîchir pour cette requête
    if (erreur.response?.status === 401 && !requeteOriginale.retry) {
      requeteOriginale.retry = true; // marque qu'on a déjà tenté, pour éviter une boucle infinie
      try {
        // Appelle la route refresh (le cookie refreshToken part automatiquement)
        const reponseRefresh = await axios.post(
          "http://localhost:3001/auth/refresh",
          {},
          { withCredentials: true },
        );

        const nouveauToken = reponseRefresh.data.accessToken;

        // Sauvegarde le nouveau token
        localStorage.setItem("accessToken", nouveauToken);

        // Met à jour le header de la requête originale avec le nouveau token
        requeteOriginale.headers.Authorization = `Bearer ${nouveauToken}`;

        // Relance la requête originale, cette fois avec le nouveau token
        return api(requeteOriginale);
      } catch {
        // Si le refresh échoue aussi (refresh token expiré après 7 jours) → déconnexion forcée
        localStorage.removeItem("accessToken");
        localStorage.removeItem("utilisateur");
        window.location.href = "/login";
      }
    }
    return Promise.reject(erreur);
  },
);
export default api;
