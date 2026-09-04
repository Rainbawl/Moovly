import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css";

function Navbar({ cacherAccueil, cacherDashboard }) {
  const naviguer = useNavigate();
  const { utilisateur, estConnecte, deconnexion } = useAuth();

  return (
    <nav className="navbar-globale">
      <div className="navbar-logo" onClick={() => naviguer("/")}>
        <img src="/Moovly.png" alt="Moovly" className="navbar-logo-image" />
      </div>
      <div className="navbar-liens">
        {!cacherAccueil && (
          <span onClick={() => naviguer("/")} className="navbar-lien">
            Accueil
          </span>
        )}
        {estConnecte() && !cacherDashboard && (
          <span onClick={() => naviguer("/dashboard")} className="navbar-lien">
            Dashboard
          </span>
        )}
      </div>
      <div className="navbar-actions">
        {estConnecte() ? (
          <>
            <span className="navbar-bonjour">
              Bonjour {utilisateur?.prenom}
            </span>
            <button onClick={deconnexion} className="navbar-bouton-outline">
              Se déconnecter
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => naviguer("/login")}
              className="navbar-bouton-outline"
            >
              Se connecter
            </button>
            <button
              onClick={() => naviguer("/register")}
              className="navbar-bouton-primary"
            >
              S'inscrire
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
