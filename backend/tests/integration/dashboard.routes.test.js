import "dotenv/config";
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/index.js";

describe("Dashboard Routes — Tests d'intégration", () => {
  let tokenCoach;
  let tokenSportif;
  let tokenAdmin;

  beforeAll(async () => {
    // Connexion coach
    const loginCoach = await request(app)
      .post("/auth/login")
      .send({ email: "thomas@test.fr", mot_de_passe: "password123" });
    tokenCoach = loginCoach.body.accessToken;

    // Connexion sportif
    const loginSportif = await request(app)
      .post("/auth/login")
      .send({ email: "jean@test.fr", mot_de_passe: "password123" });
    tokenSportif = loginSportif.body.accessToken;

    // Connexion admin
    const loginAdmin = await request(app)
      .post("/auth/login")
      .send({ email: "admin@moovly.fr", mot_de_passe: "admin123" });
    tokenAdmin = loginAdmin.body.accessToken;
  });

  // ── GET /dashboard/coach ──────────────────────────────────────
  describe("GET /dashboard/coach", () => {
    it("TI-034 — doit retourner le planning du coach connecté", async () => {
      const reponse = await request(app)
        .get("/dashboard/coach")
        .set("Authorization", `Bearer ${tokenCoach}`);

      expect(reponse.status).toBe(200);
      expect(reponse.body.planning).toBeDefined();
      expect(Array.isArray(reponse.body.planning.creneaux)).toBe(true);
    });

    it("TI-035 — doit rejeter si non connecté", async () => {
      const reponse = await request(app).get("/dashboard/coach");

      expect(reponse.status).toBe(401);
    });

    it("TI-036 — doit rejeter si rôle sportif", async () => {
      const reponse = await request(app)
        .get("/dashboard/coach")
        .set("Authorization", `Bearer ${tokenSportif}`);

      expect(reponse.status).toBe(403);
    });
  });

  // ── GET /dashboard/coach/stats ────────────────────────────────
  describe("GET /dashboard/coach/stats", () => {
    it("TI-037 — doit retourner les statistiques du coach", async () => {
      const reponse = await request(app)
        .get("/dashboard/coach/stats")
        .set("Authorization", `Bearer ${tokenCoach}`);

      expect(reponse.status).toBe(200);
      expect(reponse.body.statistiques.totalCreneaux).toBeDefined();
      expect(reponse.body.statistiques.totalReservations).toBeDefined();
      expect(reponse.body.statistiques.creneauxDisponibles).toBeDefined();
    });

    it("TI-038 — doit rejeter si rôle admin", async () => {
      const reponse = await request(app)
        .get("/dashboard/coach/stats")
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(reponse.status).toBe(403);
    });
  });
});
