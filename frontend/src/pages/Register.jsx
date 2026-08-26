import "../styles/Register.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function Register() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [role, setRole] = useState("sportif"); // sportif par défaut
  const [erreur, setErreur] = useState("");
  const naviguer = useNavigate();

  const gererInscription = async (e) => {
    e.preventDefault();
    try {
      // Appel API avec toutes les données du formulaire
      await api.post("/auth/register", {
        nom,
        prenom,
        email,
        mot_de_passe: motDePasse,
        role,
      });
      // Si succès on redirige vers login
      naviguer("/login");
    } catch (error) {
      // Si erreur on affiche le message
      setErreur("Une erreur est survenue. Vérifiez vos informations.");
    }
  };
  return (
    <div className="page-register">
      {/* Navbar */}
      <nav className="register-navbar">
        <div className="register-logo" onClick={() => naviguer("/")}>
          <strong>MOOVLY</strong>
        </div>
        <button
          onClick={() => naviguer("/login")}
          style={{
            background: "transparent",
            color: "white",
            border: "1px solid #08e0ff",
            padding: "8px 20px",
            borderRadius: "30px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Se connecter
        </button>
      </nav>

      {/* Formulaire centré */}
      <div className="register-contenu">
        <div className="formulaire-register">
          <h1>MOOVLY</h1>
          <h2>Créer un compte</h2>
          <p>Rejoignez la communauté Moovly</p>

          {erreur && <p className="message-erreur">{erreur}</p>}

          <form onSubmit={gererInscription}>
            <div className="choix-role">
              <div
                className={
                  role === "sportif" ? "carte-role active" : "carte-role"
                }
                onClick={() => setRole("sportif")}
              >
                Sportif
              </div>
              <div
                className={
                  role === "coach" ? "carte-role active" : "carte-role"
                }
                onClick={() => setRole("coach")}
              >
                Coach
              </div>
            </div>

            <div className="groupe-champs">
              <div>
                <label className="etiquette">Prénom</label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="champ-formulaire"
                  required
                />
              </div>
              <div>
                <label className="etiquette">Nom</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="champ-formulaire"
                  required
                />
              </div>
            </div>

            <label className="etiquette">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="champ-formulaire"
              required
            />

            <label className="etiquette">Mot de passe</label>
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="champ-formulaire"
              required
            />

            <button type="submit" className="bouton-inscription">
              Créer mon compte
            </button>
          </form>

          <p className="lien-connexion">
            Déjà un compte ?{" "}
            <span onClick={() => naviguer("/login")} className="lien">
              Se connecter
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
export default Register;
