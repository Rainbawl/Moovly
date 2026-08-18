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

export default api;
