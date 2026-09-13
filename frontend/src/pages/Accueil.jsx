// Page d'accueil Moovly
// Affiche le hero, les features et la grille de coachs dynamique depuis le backend
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/accueil.css";

function Accueil() {
  const [coachs, setCoachs] = useState([]);
  const [filtreSport, setFiltreSport] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const naviguer = useNavigate();

  // Charge les coachs au démarrage
  const chargerCoachs = async (sport = "") => {
    try {
      setChargement(true);
      setErreur("");
      const reponse = await api.get(
        `/coaches${sport ? `?sport=${sport}` : ""}`,
      );
      setCoachs(reponse.data.coachs);
    } catch {
      setErreur("Impossible de charger les coachs");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerCoachs();
  }, []);

  const gererRecherche = (e) => {
    const valeur = e.target.value;
    setFiltreSport(valeur);
    chargerCoachs(valeur);
  };

  return (
    <div className="page-accueil">
      {/*  Navbar  */}
      <Navbar cacherAccueil={true} cacherDashboard={true} />

      {/*  Hero  */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <p className="eyebrow">SPORT · PERFORMANCE · BIEN-ÊTRE</p>
            <h1>
              Trouvez votre
              <span> coach idéal</span>
            </h1>
            <p className="hero-description">
              Des coachs certifiés disponibles près de chez vous. Réservez votre
              créneau matin ou après-midi en quelques clics.
            </p>
            <button
              onClick={() =>
                document
                  .getElementById("coachs")
                  .scrollIntoView({ behavior: "smooth" })
              }
              className="btn btn-primary btn-large"
            >
              Voir les coachs
            </button>
          </div>
        </div>
      </section>

      {/*  Features  */}
      <section className="features">
        <div className="features-grid">
          <div className="feature">
            <div className="feature-texte">
              <h3>Coachs certifiés</h3>
              <p>Professionnels validés par notre équipe</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-texte">
              <h3>Réservation simple</h3>
              <p>Créneau matin ou après-midi</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-texte">
              <h3>Résultats garantis</h3>
              <p>Suivi personnalisé et progressif</p>
            </div>
          </div>
        </div>
      </section>

      {/*  Section coachs  */}
      <section className="section-coachs" id="coachs">
        <div className="entete-section">
          <h2>Nos coachs disponibles</h2>
          <input
            type="text"
            placeholder="Filtrer par sport..."
            value={filtreSport}
            onChange={gererRecherche}
            className="champ-recherche"
          />
        </div>

        {/* Messages */}
        {chargement && (
          <p className="message-chargement">Chargement des coachs...</p>
        )}
        {erreur && <p className="message-erreur">{erreur}</p>}
        {!chargement && coachs.length === 0 && (
          <p className="message-vide">Aucun coach trouvé</p>
        )}

        {/* Grille des coachs */}
        <div className="grille-coachs">
          {coachs.map((coach) => (
            <div
              key={coach.id}
              className="carte-coach"
              onClick={() => naviguer(`/coaches/${coach.id}`)}
            >
              <div className="avatar-coach">
                {coach.prenom[0]}
                {coach.nom[0]}
              </div>
              <h3>
                {coach.prenom} {coach.nom}
              </h3>
              <div className="sports-coach">
                {coach.sports.length > 0 ? (
                  coach.sports.map((sport, index) => (
                    <span key={index} className="badge-sport">
                      {sport}
                    </span>
                  ))
                ) : (
                  <span className="texte-sans-sport">
                    Aucun sport renseigné
                  </span>
                )}
              </div>
              {coach.tarif_horaire && (
                <p className="tarif-coach">{coach.tarif_horaire}€ / séance</p>
              )}
              <button className="bouton-voir-profil">Voir le profil →</button>
            </div>
          ))}
        </div>
      </section>

      {/*  Footer  */}
      <footer className="footer">
        <div>
          <img src="/Moovly.png" alt="Moovly" className="footer-logo-image" />
          <p>Votre partenaire sportif</p>
        </div>
        <p>© 2026 Moovly. Tous droits réservés.</p>
      </footer>
    </div>
  );
}

export default Accueil;
