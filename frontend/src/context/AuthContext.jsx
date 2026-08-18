import { createContext, useContext, useState } from "react";

// 1. On crée le tableau d'affichage
const ContexteAuth = createContext();

// 2. Le composant qui enveloppe toute l'application
// "children" représente tout ce qui est à l'intérieur
export function FournisseurAuth({ children }) {
  // L'utilisateur connecté — null si personne n'est connecté
  const [utilisateur, setUtilisateur] = useState(null);

  // Appelée quand l'utilisateur se connecte avec succès
  // userData = { id, nom, prenom, email, role }
  // token = le JWT reçu du backend
  const connexion = (userData, token) => {
    setUtilisateur(userData);
    localStorage.setItem("accessToken", token);
  };

  // Appelée quand l'utilisateur clique sur "Se déconnecter"
  const deconnexion = () => {
    setUtilisateur(null);
    localStorage.removeItem("accessToken");
  };

  // Retourne true si quelqu'un est connecté, false sinon
  const estConnecte = () => utilisateur !== null;

  return (
    // 3. On met les données à disposition de toutes les pages
    <ContexteAuth.Provider
      value={{
        utilisateur, // les infos de l'utilisateur connecté
        connexion, // fonction pour se connecter
        deconnexion, // fonction pour se déconnecter
        estConnecte, // fonction pour vérifier si connecté
      }}
    >
      {children}
    </ContexteAuth.Provider>
  );
}

// 4. Hook personnalisé — permet d'utiliser le context facilement
// Dans n'importe quelle page on écrit juste : const { utilisateur } = useAuth()
export const useAuth = () => useContext(ContexteAuth);
