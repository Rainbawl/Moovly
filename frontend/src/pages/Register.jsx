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
      <div className="formulaire-register">
        <h1>MOOVLY</h1>
        <h2>Créer un compte</h2>
        <p>Rejoignez la communauté Moovly</p>

        {/* Affiche l'erreur si elle existe */}
        {erreur && <p className="message-erreur">{erreur}</p>}

        <form onSubmit={gererInscription}>
          {/* Choix du rôle */}
          <div className="choix-role">
            <div
              className={
                role === "sportif" ? "carte-role active" : "carte-role"
              }
              onClick={() => setRole("sportif")}
            >
              🏃 Sportif
            </div>
            <div
              className={role === "coach" ? "carte-role active" : "carte-role"}
              onClick={() => setRole("coach")}
            >
              🎯 Coach
            </div>
          </div>

          {/* Prénom et Nom sur la même ligne */}
          <div className="groupe-champs">
            <div>
              <label className="etiquette">Prénom</label>
              <input
                type="text"
                placeholder="Jean"
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
                placeholder="Dupont"
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
            placeholder="vous@email.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="champ-formulaire"
            required
          />

          <label className="etiquette">Mot de passe</label>
          <input
            type="password"
            placeholder="8 caractères minimum"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="champ-formulaire"
            required
          />

          <button type="submit" className="bouton-principal">
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
  );
}
export default Register;
