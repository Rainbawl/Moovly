import "../styles/login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const naviguer = useNavigate();
  const { connexion } = useAuth();

  const gererConnexion = async (e) => {
    e.preventDefault();
    console.log("Dans gerer connexion");
    try {
      //Appel au backend (appel API + redirection)
      const reponse = await api.post("/auth/login", {
        email,
        mot_de_passe: motDePasse,
      });
      console.log("Apres post", reponse);

      // Si succès alors on stocke le token puis on redirige
      connexion(reponse.data.user, reponse.data.accessToken);
      naviguer("/dashboard");
    } catch (err) {
      console.log(err);
      //Si erreur, on affiche alors le message
      setErreur("Email ou mot de passe incorrect");
    }
  };
  return (
    <div className="page-login">
      {/* Navbar */}
      <nav className="login-navbar">
        <div className="login-logo" onClick={() => naviguer("/")}>
          <img src="/Moovly.png" alt="Moovly" className="logo-image" />
        </div>
        <button onClick={() => naviguer("/register")} className="bouton-navbar">
          S'inscrire
        </button>
      </nav>

      {/* Formulaire centré */}
      <div className="login-contenu">
        <div className="formulaire-login">
          <img src="/Moovly.png" alt="Moovly" className="logo-image-carte" />
          <h2>Bon retour</h2>
          <p>Connectez-vous à votre espace</p>

          {erreur && <p className="message-erreur">{erreur}</p>}

          <form onSubmit={gererConnexion}>
            <label className="etiquette">Email</label>
            <input
              type="email"
              placeholder="vous@email.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="champ-formulaire"
            />

            <label className="etiquette">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="champ-formulaire"
            />

            <button type="submit" className="bouton-connexion">
              Se connecter
            </button>
          </form>

          <p className="lien-inscription">
            Pas encore de compte ?{" "}
            <span onClick={() => naviguer("/register")} className="lien">
              S'inscrire
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
