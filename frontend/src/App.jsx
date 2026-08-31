import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FournisseurAuth, useAuth } from "./context/AuthContext";

// Import des pages
import Accueil from "./pages/Accueil";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfilCoach from "./pages/ProfilCoach";
import Dashboard from "./pages/Dashboard";

// Composant qui protège une route
// Si l'utilisateur n'est pas connecté → redirige vers /login
function RouteProtegee({ children }) {
  const { estConnecte } = useAuth();

  if (!estConnecte()) {
    // Redirige vers login si pas connecté
    return <Navigate to="/login" />;
  }

  // Sinon affiche la page demandée
  return children;
}

// Composant qui redirige si déjà connecté
// Si l'utilisateur EST connecté et va sur /login ou /register → redirige vers /dashboard
function RoutePublique({ children }) {
  const { estConnecte } = useAuth();

  if (estConnecte()) {
    // Redirige vers dashboard si déjà connecté
    return <Navigate to="/dashboard" />;
  }

  // Sinon affiche la page demandée (login ou register)
  return children;
}

// Composant principal
function App() {
  return (
    // BrowserRouter — active la navigation entre pages
    <BrowserRouter>
      {/* FournisseurAuth — rend le context disponible partout */}
      <FournisseurAuth>
        <Routes>
          {/* Routes publiques — accessibles sans connexion */}
          <Route path="/" element={<Accueil />} />

          {/* RoutePublique — redirige vers /dashboard si déjà connecté */}
          <Route
            path="/login"
            element={
              <RoutePublique>
                <Login />
              </RoutePublique>
            }
          />
          <Route
            path="/register"
            element={
              <RoutePublique>
                <Register />
              </RoutePublique>
            }
          />

          <Route path="/coaches/:id" element={<ProfilCoach />} />

          {/* Route protégée — nécessite d'être connecté */}
          <Route
            path="/dashboard"
            element={
              <RouteProtegee>
                <Dashboard />
              </RouteProtegee>
            }
          />
        </Routes>
      </FournisseurAuth>
    </BrowserRouter>
  );
}

export default App;
