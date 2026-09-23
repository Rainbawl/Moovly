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
  const [erreur, setErreur] = useState("");
  const [afficherHistorique, setAfficherHistorique] = useState(false);
  const [planningCoach, setPlanningCoach] = useState(null);
  const [statistiquesCoach, setStatistiquesCoach] = useState(null);
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

  const annulerReservation = async (reservationId) => {
    try {
      await api.delete(`/reservations/${reservationId}`);
      chargerReservations(); //recharge la liste apres annultation
    } catch {
      setErreur("Impossible d'annuler cette réservation");
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

  const chargerPlanningCoach = async () => {
    // appel API : GET /dashboard/coach
    try {
      const reponse = await api.get("/dashboard/coach");
      setPlanningCoach(reponse.data.planning);
    } catch (erreur) {
      console.error("Erreur lors du chargement du planning :", erreur);
    } finally {
      setChargement(false);
    }
  };

  const chargerStatistiquesCoach = async () => {
    // appel API : GET /dashboard/coach/stats
    try {
      const reponse = await api.get("/dashboard/coach/stats");
      setStatistiquesCoach(reponse.data.statistiques);
    } catch (erreur) {
      console.error("Erreur lors du chargement des statistiques :", erreur);
    }
  };

  const repondreReservation = async (reservationId, accepter) => {
    try {
      await api.put(`/reservations/${reservationId}/repondre`, { accepter });
      chargerPlanningCoach(); // recharge le planning pour refléter le changement
      chargerStatistiquesCoach();
    } catch (erreur) {
      console.error("Erreur lors de la réponse à la réservation :", erreur);
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
    if (utilisateur?.role === "sportif") {
      chargerReservations();
    } else if (utilisateur?.role === "admin") {
      chargerDonneesAdmin();
    } else if (utilisateur?.role === "coach") {
      chargerPlanningCoach();
      chargerStatistiquesCoach();
    } else {
      setChargement(false);
    }
  }, [utilisateur?.role]);

  const reservationsAffichees = afficherHistorique
    ? reservations
    : reservations.filter(
        (r) => r.statut !== "annulee" && r.statut !== "refusee",
      );

  const estPassee = (dateCreneau) => new Date(dateCreneau) < new Date();

  return (
    <div className="page-dashboard">
      {/* En-tête avec nom et bouton déconnexion */}
      <Navbar cacherDashboard={true} />
      <main className="contenu-dashboard">
        {chargement && <p className="message-chargement">Chargement...</p>}
        {erreur && <p className="message-erreur">{erreur}</p>}

        {/*  Dashboard Sportif  */}
        {utilisateur?.role === "sportif" && (
          <div>
            <h2 className="titre-section">Mes réservations</h2>
            {reservations.length === 0 && !chargement && (
              <p className="message-vide">Aucune réservation pour le moment</p>
            )}

            <div className="liste-reservations">
              {reservationsAffichees.map((reservation) => (
                <div
                  key={reservation.id}
                  className={`carte-reservation ${estPassee(reservation.creneau.date) ? "carte-passee" : ""}`}
                >
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
                    {reservation.statut !== "annulee" &&
                      reservation.statut !== "refusee" &&
                      !estPassee(reservation.creneau.date) && (
                        <>
                          <button
                            onClick={() =>
                              naviguer(
                                `/coaches/${reservation.creneau.coach.id}?modifier=${reservation.id}`,
                              )
                            }
                            className="bouton-modifier"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => annulerReservation(reservation.id)}
                            className="bouton-annuler"
                          >
                            Annuler
                          </button>
                        </>
                      )}
                  </div>
                  <span className={`badge-statut statut-${reservation.statut}`}>
                    {reservation.statut.replace("_", " ")}
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
            <button
              onClick={() => setAfficherHistorique(!afficherHistorique)}
              className="lien-historique"
            >
              {afficherHistorique
                ? "Masquer l'historique"
                : "Voir l'historique"}
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
                  <div className="infos-coach-attente">
                    <h3>
                      {coach.prenom} {coach.nom}
                    </h3>

                    <div className="ligne-info-coach">
                      <span className="label-info-coach">Email</span>
                      <span>{coach.email}</span>
                    </div>

                    {coach.diplome && (
                      <div className="ligne-info-coach">
                        <span className="label-info-coach">Diplôme</span>
                        <span>{coach.diplome}</span>
                      </div>
                    )}

                    {coach.presentation && (
                      <div className="ligne-info-coach">
                        <span className="label-info-coach">Présentation</span>
                        <span>{coach.presentation}</span>
                      </div>
                    )}

                    {coach.tarif_horaire && (
                      <div className="ligne-info-coach">
                        <span className="label-info-coach">Tarif</span>
                        <span>{coach.tarif_horaire}€ / séance</span>
                      </div>
                    )}

                    {coach.sports.length > 0 && (
                      <div className="ligne-info-coach">
                        <span className="label-info-coach">Sports</span>
                        <div className="sports-coach-attente">
                          {coach.sports.map((sport, index) => (
                            <span key={index} className="badge-sport">
                              {sport}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="actions-coach-attente">
                    <button
                      onClick={() => validerCoach(coach.id, true)}
                      className="bouton-valider"
                    >
                      ✓ Valider
                    </button>
                    <button
                      onClick={() => validerCoach(coach.id, false)}
                      className="bouton-rejeter"
                    >
                      ✗ Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/*  Dashboard Coach  */}
        {utilisateur?.role === "coach" && (
          <div>
            <h2 className="titre-section">Mon espace coach</h2>

            {/* Statistiques */}
            {statistiquesCoach && (
              <div className="grille-statistiques">
                <div className="carte-statistique">
                  <div className="chiffre-stat">
                    {statistiquesCoach.totalCreneaux}
                  </div>
                  <div className="libelle-stat">Créneaux créés</div>
                </div>
                <div className="carte-statistique">
                  <div className="chiffre-stat">
                    {statistiquesCoach.totalReservations}
                  </div>
                  <div className="libelle-stat">Réservations</div>
                </div>
                <div className="carte-statistique">
                  <div className="chiffre-stat">
                    {statistiquesCoach.creneauxDisponibles}
                  </div>
                  <div className="libelle-stat">Disponibles</div>
                </div>
              </div>
            )}

            {/* Planning */}
            <h3 className="sous-titre-section">Mon planning</h3>

            {planningCoach?.creneaux.length === 0 && (
              <p className="message-vide">Aucun créneau créé pour le moment</p>
            )}
            <div className="liste-planning-coach">
              {planningCoach?.creneaux.map((creneau) => (
                <div key={creneau.id} className="carte-creneau-planning">
                  <div className="infos-creneau-planning">
                    <span className="periode-creneau">
                      {creneau.periode === "matin" ? "Matin" : "Après-midi"}
                    </span>
                    <span className="horaire-creneau">{creneau.horaire}</span>
                    <span className="date-creneau-planning">
                      {new Date(creneau.date).toLocaleDateString("fr-FR")}
                    </span>
                    <span className={`statut-creneau statut-${creneau.statut}`}>
                      {creneau.statut.replace("_", " ")}
                    </span>
                  </div>
                  {creneau.reservations.filter((r) => r.statut !== "annulee")
                    .length > 0 && (
                    <div className="sportif-creneau">
                      {creneau.reservations
                        .filter((r) => r.statut !== "annulee")
                        .map((reservation) => (
                          <div
                            key={reservation.id}
                            className="ligne-sportif-creneau"
                          >
                            <p>
                              {reservation.sportif.prenom}{" "}
                              {reservation.sportif.nom}
                            </p>
                            {reservation.statut === "en_attente" && (
                              <div className="actions-reservation-coach">
                                <button
                                  onClick={() =>
                                    repondreReservation(reservation.id, true)
                                  }
                                  className="bouton-valider"
                                >
                                  Accepter
                                </button>
                                <button
                                  onClick={() =>
                                    repondreReservation(reservation.id, false)
                                  }
                                  className="bouton-rejeter"
                                >
                                  Refuser
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
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
