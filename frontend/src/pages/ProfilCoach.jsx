import "../styles/ProfilCoach.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function ProfilCoach() {
  const { id } = useParams();
  // Récupère l'id depuis l'URL — ex: /coaches/1 → id = "1"
  const [coach, setCoach] = useState(null); // coach = null car on n'a pas encore chargé le profil, Après l'appel API → coach = { id:1, nom:'Lebrun', ... }
  const [creneaux, setCreneaux] = useState([]); //creneaux = [] car la liste est vide au départ, Après l'appel API → creneaux = [{ id:1, periode:'matin' }, ...]
  const [dateSelectionnee, setDateSelectionnee] = useState("");
  const [chargement, setChargement] = useState(true); //chargement = true car dès que la page s'ouvre on charge les données, Après chargement → chargement = false
  const [erreur, setErreur] = useState("");
  const [messageSucces, setMessageSucces] = useState("");
  const naviguer = useNavigate();
  const { estConnecte } = useAuth();

  const chargerCoach = async (date) => {
    console.log("Date envoyée :", date);
    try {
      // appel API pour récupérer le profil du coach
      // hint : api.get(`/coaches/${id}`)
      const reponseCoach = await api.get(`/coaches/${id}`);
      setCoach(reponseCoach.data.coach);
      // Charge les créneaux SEULEMENT si une date est sélectionnée
      if (dateSelectionnee) {
        const reponseCreneaux = await api.get(
          `/coaches/${id}/creneaux?date=${dateSelectionnee}`,
        );
        setCreneaux(reponseCreneaux.data.creneaux);
      }
    } catch (error) {
      setErreur("Impossible de charger le profil");
    } finally {
      setChargement(false);
    }
  };

  const reserverCreneau = async (creneauId) => {
    // 1. vérifie si connecté
    if (!estConnecte()) {
      naviguer("/login");
      return;
    }
    setErreur("");

    try {
      // 2. appel API
      await api.post("/reservations", { creneau_id: creneauId });
      // 3. si succès
      setMessageSucces("🎉 Réservation confirmée !");
    } catch (error) {
      // 4. si erreur
      setErreur("Impossible de réserver ce créneau");
    }
  };

  // Fonction séparée pour charger uniquement les créneaux
  const chargerCreneaux = async (date) => {
    try {
      const reponseCreneaux = await api.get(
        `/coaches/${id}/creneaux?date=${date}`,
      );
      setCreneaux(reponseCreneaux.data.creneaux);
    } catch (error) {
      console.log("Erreur créneaux", error);
    }
  };

  useEffect(() => {
    chargerCoach();
  }, []);
  // Deuxième useEffect — recharge les créneaux quand la date change
  useEffect(() => {
    if (dateSelectionnee) {
      chargerCoach();
    }
  }, [dateSelectionnee]);
  return (
    <div className="page-profil-coach">
      {/* Bouton retour */}
      <button onClick={() => naviguer("/")} className="bouton-retour">
        ← Retour aux coachs
      </button>

      {/* Messages */}
      {chargement && <p className="message-chargement">Chargement...</p>}
      {erreur && <p className="message-erreur">{erreur}</p>}
      {messageSucces && <p className="message-succes">{messageSucces}</p>}

      {/* Profil du coach */}
      {coach && (
        <div className="carte-profil-coach">
          {/* En-tête coach */}
          <div className="entete-coach">
            <div className="avatar-grand">
              {coach.prenom[0]}
              {coach.nom[0]}
            </div>
            <div className="infos-coach">
              <h1>
                {coach.prenom} {coach.nom}
              </h1>
              {coach.sports.length > 0 && (
                <div className="sports-coach">
                  {coach.sports.map((sport, index) => (
                    <span key={index} className="badge-sport">
                      {sport}
                    </span>
                  ))}
                </div>
              )}
              {coach.tarif_horaire && (
                <p className="tarif-coach">{coach.tarif_horaire}€ / séance</p>
              )}
              {coach.note_moyenne && (
                <p className="note-coach">★ {coach.note_moyenne}</p>
              )}
            </div>
          </div>

          {/* Présentation */}
          {coach.presentation && (
            <div className="presentation-coach">
              <h2>À propos</h2>
              <p>{coach.presentation}</p>
            </div>
          )}

          {/* Sélection de date */}
          <div className="section-creneaux">
            <h2>Créneaux disponibles</h2>
            <div className="selecteur-date">
              <label className="etiquette">Choisir une date</label>
              <input
                type="date"
                value={dateSelectionnee}
                onChange={(e) => {
                  setDateSelectionnee(e.target.value);
                  chargerCoach();
                }}
                className="champ-formulaire"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Liste des créneaux */}
            {dateSelectionnee && creneaux.length === 0 && (
              <p className="message-vide">
                Aucun créneau disponible pour cette date
              </p>
            )}

            <div className="liste-creneaux">
              {creneaux.map((creneau) => (
                <div key={creneau.id} className="carte-creneau">
                  <div className="infos-creneau">
                    <span className="periode-creneau">
                      {creneau.periode === "matin"
                        ? "🌅 Matin"
                        : "🌇 Après-midi"}
                    </span>
                    <span className="horaire-creneau">{creneau.horaire}</span>
                    <span className={`statut-creneau statut-${creneau.statut}`}>
                      {creneau.statut}
                    </span>
                  </div>

                  {creneau.statut === "disponible" && (
                    <button
                      onClick={() => reserverCreneau(creneau.id)}
                      className="bouton-reserver"
                    >
                      Réserver
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ProfilCoach;
