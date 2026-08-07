import "dotenv/config";
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/index.js";

describe("Reservations Routes — Tests d'intégration", () => {
  let tokenSportif;
  let tokenCoach;

  beforeAll(async () => {
    // Connexion sportif
    const loginSportif = await request(app)
      .post("/auth/login")
      .send({ email: "jean@test.fr", mot_de_passe: "password123" });
    tokenSportif = loginSportif.body.accessToken;

    // Connexion coach
    const loginCoach = await request(app)
      .post("/auth/login")
      .send({ email: "thomas@test.fr", mot_de_passe: "password123" });
    tokenCoach = loginCoach.body.accessToken;

    // Crée un créneau disponible pour les tests
    await request(app)
      .post("/coaches/1/creneaux")
      .set("Authorization", `Bearer ${tokenCoach}`)
      .send({ date: "2026-10-01", periode: "matin" });
  });

  // ── GET /reservations/mine ────────────────────────────────────
  describe("GET /reservations/mine", () => {
    it("TI-017 — doit retourner l'historique du sportif connecté", async () => {
      const reponse = await request(app)
        .get("/reservations/mine")
        .set("Authorization", `Bearer ${tokenSportif}`);

      expect(reponse.status).toBe(200);
      expect(Array.isArray(reponse.body.reservations)).toBe(true);
    });

    it("TI-018 — doit rejeter si non connecté", async () => {
      const reponse = await request(app).get("/reservations/mine");

      expect(reponse.status).toBe(401);
    });
  });

  // ── POST /reservations ────────────────────────────────────────
  describe("POST /reservations", () => {
    it("TI-019 — doit rejeter si creneau_id manquant", async () => {
      const reponse = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({});

      expect(reponse.status).toBe(400);
      expect(reponse.body.error).toBeDefined();
    });

    it("TI-020 — doit rejeter si non connecté", async () => {
      const reponse = await request(app)
        .post("/reservations")
        .send({ creneau_id: 1 });

      expect(reponse.status).toBe(401);
    });

    it("TI-021 — doit rejeter si rôle coach essaie de réserver", async () => {
      const reponse = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ creneau_id: 1 });

      expect(reponse.status).toBe(403);
    });
  });

  // ── DELETE /reservations/:id ──────────────────────────────────
  describe("DELETE /reservations/:id", () => {
    it("TI-022 — doit rejeter si non connecté", async () => {
      const reponse = await request(app).delete("/reservations/1");

      expect(reponse.status).toBe(401);
    });

    it("TI-023 — doit rejeter si réservation introuvable", async () => {
      const reponse = await request(app)
        .delete("/reservations/999")
        .set("Authorization", `Bearer ${tokenSportif}`);

      expect(reponse.status).toBe(404);
    });
  });
});
