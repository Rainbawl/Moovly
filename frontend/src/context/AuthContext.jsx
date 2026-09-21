import { createContext, useContext, useState } from "react";

// 1. On crée le tableau d'affichage
const ContexteAuth = createContext();

// 2. Le composant qui enveloppe toute l'application
// "children" représente tout ce qui est à l'intérieur
export function FournisseurAuth({ children }) {
  // L'utilisateur connecté — null si personne n'est connecté
  // Au démarrage, on essaie de relire l'utilisateur déjà sauvegardé (survit à un rechargement de page)
  const [utilisateur, setUtilisateur] = useState(() => {
    const utilisateurSauvegarde = localStorage.getItem("utilisateur");
    return utilisateurSauvegarde ? JSON.parse(utilisateurSauvegarde) : null;
  });

  // Appelée quand l'utilisateur se connecte avec succès
  // userData = { id, nom, prenom, email, role }
  // token = le JWT reçu du backend
  const connexion = (userData, token) => {
    setUtilisateur(userData);
    localStorage.setItem("accessToken", token);
    localStorage.setItem("utilisateur", JSON.stringify(userData)); // sauvegarde aussi l'utilisateur
  };

  // Appelée quand l'utilisateur clique sur "Se déconnecter"
  const deconnexion = () => {
    setUtilisateur(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("utilisateur"); // nettoie aussi l'utilisateur sauvegardé
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
// eslint-disable-next-line react-refresh/only-export-components -- Context + hook colocalisés intentionnellement
export const useAuth = () => useContext(ContexteAuth);
