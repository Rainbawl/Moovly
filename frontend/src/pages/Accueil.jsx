// Page d'accueil — première page visible par le visiteur
// Affiche la liste des coachs disponibles avec filtre par sport
// Accessible sans connexion (route publique)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/accueil.css";

function Accueil() {
  // Liste de tous les coachs récupérés depuis le backend
  const [coachs, setCoachs] = useState([]);

  // Valeur du champ de recherche saisie par l'utilisateur
  const [filtreSport, setFiltreSport] = useState("");

  // true pendant que les données se chargent — affiche "Chargement..."
  const [chargement, setChargement] = useState(true);

  // Message d'erreur si l'appel API échoue
  const [erreur, setErreur] = useState("");

  // Hook de navigation — permet de changer de page sans recharger le navigateur
  const naviguer = useNavigate();

  // Fonction qui appelle le backend pour récupérer la liste des coachs
  // Paramètre optionnel "sport" pour filtrer par discipline
  const chargerCoachs = async (sport = "") => {
    try {
      setChargement(true);
      setErreur("");

      // Appel API — si un sport est fourni on ajoute le filtre dans l'URL
      // Exemple : /coaches ou /coaches?sport=Tennis
      const reponse = await api.get(
        `/coaches${sport ? `?sport=${sport}` : ""}`,
      );

      // Met à jour la liste des coachs avec la réponse du backend
      setCoachs(reponse.data.coachs);
    } catch (err) {
      // En cas d'erreur réseau ou serveur
      setErreur("Impossible de charger les coachs. Vérifiez votre connexion.");
    } finally {
      // Dans tous les cas — succès ou erreur — on arrête le chargement
      setChargement(false);
    }
  };

  // useEffect — s'exécute une seule fois au chargement de la page
  // Le [] vide signifie "ne s'exécute qu'au montage du composant"
  useEffect(() => {
    chargerCoachs();
  }, []);

  // Appelée à chaque frappe dans la barre de recherche
  // Met à jour le filtre ET relance la recherche côté backend
  const gererRecherche = (e) => {
    const valeur = e.target.value;
    setFiltreSport(valeur);
    chargerCoachs(valeur);
  };

  return (
    <div className="page-accueil">
      {/*  En-tête de la page  */}
      <header className="entete-accueil">
        <h1>MOOVLY</h1>
        <p>Trouvez votre coach sportif idéal</p>

        {/* Boutons de navigation vers login et inscription */}
        <div className="groupe-boutons-entete">
          <button
            onClick={() => naviguer("/login")}
            className="bouton-secondaire"
          >
            Se connecter
          </button>
          <button
            onClick={() => naviguer("/register")}
            className="bouton-principal"
          >
            S'inscrire
          </button>
        </div>
      </header>

      {/*  Barre de recherche  */}
      <div className="barre-recherche">
        <input
          type="text"
          placeholder="Rechercher par sport (Tennis, Running, Yoga...)"
          value={filtreSport}
          onChange={gererRecherche}
          className="champ-recherche"
        />
      </div>

      {/*  Zone principale  */}
      <main className="zone-principale">
        {/* Affiche "Chargement..." pendant la récupération des données */}
        {chargement && (
          <p className="message-chargement">Chargement des coachs...</p>
        )}

        {/* Affiche le message d'erreur si la requête a échoué */}
        {erreur && <p className="message-erreur">{erreur}</p>}

        {/* Affiche un message si aucun coach n'est trouvé */}
        {!chargement && coachs.length === 0 && (
          <p className="message-vide">Aucun coach trouvé pour ce sport</p>
        )}

        {/*  Grille des cartes coachs  */}
        <div className="grille-coachs">
          {coachs.map((coach) => (
            // key={coach.id} — obligatoire en React pour identifier chaque élément
            // onClick — navigue vers le profil du coach quand on clique sur la carte
            <div
              key={coach.id}
              className="carte-coach"
              onClick={() => naviguer(`/coaches/${coach.id}`)}
            >
              {/* Avatar avec les initiales du prénom et du nom */}
              <div className="avatar-coach">
                {coach.prenom[0]}
                {coach.nom[0]}
              </div>

              {/* Nom complet du coach */}
              <h3>
                {coach.prenom} {coach.nom}
              </h3>

              {/* Liste des sports pratiqués par le coach */}
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

              {/* Tarif — affiché uniquement s'il est renseigné */}
              {coach.tarif_horaire && (
                <p className="tarif-coach">{coach.tarif_horaire}€ / séance</p>
              )}

              {/* Note moyenne — affichée uniquement si elle existe */}
              {coach.note_moyenne && (
                <p className="note-coach">★ {coach.note_moyenne}</p>
              )}

              {/* Bouton pour accéder au profil complet */}
              <button className="bouton-voir-profil">Voir le profil →</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Accueil;
