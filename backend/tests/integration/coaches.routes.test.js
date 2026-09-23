import "dotenv/config";
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/index.js";

describe("Coaches Routes — Tests d'intégration", () => {
  let tokenCoach;
  let tokenSportif;

  // beforeAll — se connecte une seule fois avant tous les tests
  beforeAll(async () => {
    const loginCoach = await request(app).post("/auth/login").send({
      email: "camille@test.fr",
      mot_de_passe: process.env.SEED_PASSWORD_COACH,
    });
    tokenCoach = loginCoach.body.accessToken;

    const loginSportif = await request(app).post("/auth/login").send({
      email: "bocar@test.fr",
      mot_de_passe: process.env.SEED_PASSWORD_SPORTIF,
    });
    tokenSportif = loginSportif.body.accessToken;
  });

  describe("GET /coaches", () => {
    it("TI-008 — doit retourner la liste des coachs validés", async () => {
      const reponse = await request(app).get("/coaches");
      expect(reponse.status).toBe(200);
      expect(reponse.body.total).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(reponse.body.coachs)).toBe(true);
    });

    it("TI-009 — doit filtrer par sport", async () => {
      const reponse = await request(app).get("/coaches?sport=Tennis");
      expect(reponse.status).toBe(200);
      expect(Array.isArray(reponse.body.coachs)).toBe(true);
    });
  });

  describe("GET /coaches/:id", () => {
    it("TI-010 — doit retourner le profil d'un coach", async () => {
      const reponse = await request(app).get("/coaches/1");
      expect(reponse.status).toBe(200);
      expect(reponse.body.coach).toBeDefined();
      expect(reponse.body.coach.id).toBe(1);
    });

    it("TI-011 — doit retourner 404 si coach introuvable", async () => {
      const reponse = await request(app).get("/coaches/999");
      expect(reponse.status).toBe(404);
      expect(reponse.body.error).toBe("Coach introuvable");
    });
  });

  describe("GET /coaches/:id/creneaux", () => {
    it("TI-012 — doit retourner les créneaux d'un coach pour une date", async () => {
      const reponse = await request(app).get(
        "/coaches/1/creneaux?date=2026-08-10",
      );
      expect(reponse.status).toBe(200);
      expect(Array.isArray(reponse.body.creneaux)).toBe(true);
    });

    it("TI-013 — doit retourner 400 si date manquante", async () => {
      const reponse = await request(app).get("/coaches/1/creneaux");
      expect(reponse.status).toBe(400);
    });
  });

  describe("POST /coaches/:id/creneaux", () => {
    it("TI-014 — doit créer un créneau après-midi pour le coach", async () => {
      const dateFuture = new Date();
      dateFuture.setFullYear(dateFuture.getFullYear() + 1);
      dateFuture.setMonth(Math.floor(Math.random() * 12));
      dateFuture.setDate(Math.floor(Math.random() * 28) + 1);
      const date = dateFuture.toISOString().split("T")[0];

      const reponse = await request(app)
        .post("/coaches/1/creneaux")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ date, periode: "apres_midi" });

      expect(reponse.status).toBe(201);
      expect(reponse.body.creneau.periode).toBe("apres_midi");
      expect(reponse.body.creneau.horaire).toBe("14h00 - 18h00");
    });

    it("TI-015 — doit rejeter si non connecté", async () => {
      const reponse = await request(app)
        .post("/coaches/1/creneaux")
        .send({ date: "2026-09-02", periode: "matin" });
      expect(reponse.status).toBe(401);
    });

    it("TI-016 — doit rejeter si rôle sportif", async () => {
      const reponse = await request(app)
        .post("/coaches/1/creneaux")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ date: "2026-09-02", periode: "matin" });
      expect(reponse.status).toBe(403);
    });

    it("TI-017 — doit retourner 404 si coach introuvable (liste créneaux)", async () => {
      const reponse = await request(app).get(
        "/coaches/999999/creneaux?date=2026-08-10",
      );
      expect(reponse.status).toBe(404);
      expect(reponse.body.error).toBe("Coach introuvable");
    });

    it("TI-018 — doit retourner 404 si coach introuvable (création créneau)", async () => {
      const reponse = await request(app)
        .post("/coaches/999999/creneaux")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ date: "2026-09-02", periode: "matin" });
      expect(reponse.status).toBe(404);
      expect(reponse.body.error).toBe("Coach introuvable");
    });

    it("TI-019 — doit rejeter si le token est invalide", async () => {
      const reponse = await request(app)
        .post("/coaches/1/creneaux")
        .set("Authorization", "Bearer un.faux.token")
        .send({ date: "2026-09-02", periode: "matin" });
      expect(reponse.status).toBe(401);
      expect(reponse.body.error).toBe("Token invalide ou expiré");
    });
  });

  it("TI-020 — doit rejeter si date ou période manquante", async () => {
    const reponse = await request(app)
      .post("/coaches/1/creneaux")
      .set("Authorization", `Bearer ${tokenCoach}`)
      .send({ date: "2026-09-02" }); // période manquante
    expect(reponse.status).toBe(400);
    expect(reponse.body.error).toBe("La date et la période sont obligatoires");
  });
});
