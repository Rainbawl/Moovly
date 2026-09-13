// Point d'entrée de l'API Moovly
// Configure Express avec les middlewares globaux et les routes

import "dotenv/config"; // Charge les variables d'environnement en premier
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import "dotenv/config"; // Charge les variables d'environnement en premier
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import coachesRoutes from "./routes/coaches.routes.js";
import creneauxRoutes from "./routes/creneaux.routes.js";
import reservationsRoutes from "./routes/reservations.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();
const adaptateur = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: adaptateur });

//  Middlewares globaux
// Permet de lire le JSON dans le body des requêtes
app.use(express.json());

// Autorise les requêtes cross-origin depuis le frontend React
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true, // Nécessaire pour les cookies httpOnly (refresh token)
  }),
);

//  Health check
// Route de vérification que l'API est bien démarrée
// Utilisée par Railway pour le health check en production
app.get("/health", async (req, res) => {
  const debut = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latence = Date.now() - debut;

    if (latence > 1000) {
      return res
        .status(503)
        .json({ status: "degraded", db: "connected", dbLatencyMs: latence });
    }

    res
      .status(200)
      .json({ status: "ok", db: "connected", dbLatencyMs: latence });
  } catch (erreur) {
    console.error(
      "[health-check] Base de données injoignable :",
      erreur.message,
    );
    res.status(503).json({ status: "degraded", db: "unreachable" });
  }
});

//  Routes
app.use("/auth", authRoutes); // POST /auth/register, /auth/login, /auth/logout
app.use("/coaches", coachesRoutes); // GET /coaches, GET /coaches/:id
app.use("/coaches/:id/creneaux", creneauxRoutes); // GET /coaches/:id/creneaux, POST /coaches/:id/creneaux
app.use("/reservations", reservationsRoutes); // GET /reservations/mine, POST /reservations, DELETE /reservations/:id
app.use("/admin", adminRoutes); // Routes admin protégées
app.use("/dashboard", dashboardRoutes); // GET /dashboard/coach, GET /dashboard/coach/stats

//  Gestion des erreurs globale
// Intercepte toutes les erreurs passées via next(err) dans les controllers
// eslint-disable-next-line no-unused-vars -- Express exige 4 paramètres pour reconnaître un error-handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.message || "Erreur interne du serveur",
  });
});

//  Démarrage du serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Moovly API démarrée sur le port ${PORT}`);
});

export default app;

/* index.js/routes/controller/service/repository=> Bdd*/
