import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/dashboard.css";

function Dashboard() {
  const [reservations, setReservations] = useState([]);
  const [statistiques, setStatistiques] = useState(null);
  const [coachsEnAttente, setCoachsEnAttente] = useState([]);
  const [chargement, setChargement] = useState(true);
  const { utilisateur } = useAuth();
  const naviguer = useNavigate();

  const chargerReservations = async () => {
    // appel API : GET /reservations/mine
    try {
      const reponse = await api.get("/reservations/mine");
      setReservations(reponse.data.reservations);
    } catch (erreur) {
      console.error("Erreur lors du chargement des réservations :", erreur);
    } finally {
      setChargement(false);
    }
  };
  const chargerDonneesAdmin = async () => {
    // appel API : GET /admin/coaches (coachs en attente)
    // appel API : GET /admin/stats (statistiques)
    try {
      const reponseCoachs = await api.get("/admin/coaches");
      setCoachsEnAttente(reponseCoachs.data.coachs);
      const reponseStats = await api.get("/admin/stats");
      setStatistiques(reponseStats.data.statistiques);
    } catch (erreur) {
      console.error(
        "Erreur lors du chargement des données administratives :",
        erreur,
      );
    } finally {
      setChargement(false);
    }
  };
  const validerCoach = async (coachId, estValide) => {
    try {
      await api.put(`/admin/coaches/${coachId}/valider`, {
        est_valide: estValide,
      });
      chargerDonneesAdmin(); // recharger la liste apres validation
    } catch (erreur) {
      console.error("Erreur lors de la validation du coach :", erreur);
    }
  };
  // utilisateur?.role — optional chaining
  // Si utilisateur est null → ne plante pas, retourne undefined
  // Si utilisateur existe → retourne utilisateur.role

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (utilisateur?.role === "sportif") {
      chargerReservations();
    } else if (utilisateur?.role === "admin") {
      chargerDonneesAdmin();
    } else {
      setChargement(false);
    } /* eslint-enable react-hooks/set-state-in-effect */
  }, [utilisateur?.role]);

  return (
    <div className="page-dashboard">
      {/* En-tête avec nom et bouton déconnexion */}
      <Navbar cacherDashboard={true} />
      <main className="contenu-dashboard">
        {chargement && <p className="message-chargement">Chargement...</p>}

        {/*  Dashboard Sportif  */}
        {utilisateur?.role === "sportif" && (
          <div>
            <h2 className="titre-section">Mes réservations</h2>

            {reservations.length === 0 && !chargement && (
              <p className="message-vide">Aucune réservation pour le moment</p>
            )}

            <div className="liste-reservations">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="carte-reservation">
                  <div className="infos-reservation">
                    <h3>
                      {reservation.creneau.coach.prenom}{" "}
                      {reservation.creneau.coach.nom}
                    </h3>
                    <p>
                      {reservation.creneau.periode === "matin"
                        ? " Matin"
                        : " Après-midi"}
                      {" · "}
                      {reservation.creneau.horaire}
                    </p>
                    <p className="date-reservation">
                      {" "}
                      {new Date(reservation.creneau.date).toLocaleDateString(
                        "fr-FR",
                      )}
                    </p>
                  </div>
                  <span className={`badge-statut statut-${reservation.statut}`}>
                    {reservation.statut}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => naviguer("/")}
              className="bouton-retour-accueil"
            >
              Trouver un coach →
            </button>
          </div>
        )}

        {/*  Dashboard Admin  */}
        {utilisateur?.role === "admin" && (
          <div>
            <h2 className="titre-section">Administration</h2>

            {/* Statistiques */}
            {statistiques && (
              <div className="grille-statistiques">
                <div className="carte-statistique">
                  <div className="chiffre-stat">
                    {statistiques.totalUtilisateurs}
                  </div>
                  <div className="libelle-stat">Utilisateurs</div>
                </div>
                <div className="carte-statistique">
                  <div className="chiffre-stat">{statistiques.totalCoachs}</div>
                  <div className="libelle-stat">Coachs actifs</div>
                </div>
                <div className="carte-statistique">
                  <div className="chiffre-stat">
                    {statistiques.totalReservations}
                  </div>
                  <div className="libelle-stat">Réservations</div>
                </div>
                <div className="carte-statistique">
                  <div className="chiffre-stat">
                    {statistiques.coachsEnAttente}
                  </div>
                  <div className="libelle-stat">En attente</div>
                </div>
              </div>
            )}

            {/* Coachs en attente */}
            <h3 className="sous-titre-section">
              Coachs en attente de validation
            </h3>
            {coachsEnAttente.length === 0 && (
              <p className="message-vide">Aucun coach en attente</p>
            )}
            <div className="liste-coachs-attente">
              {coachsEnAttente.map((coach) => (
                <div key={coach.id} className="carte-coach-attente">
                  <div>
                    <h3>
                      {coach.prenom} {coach.nom}
                    </h3>
                    <p>{coach.email}</p>
                  </div>
                  <button
                    onClick={() => validerCoach(coach.id, true)}
                    className="bouton-valider"
                  >
                    ✓ Valider
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
export default Dashboard;
