import "dotenv/config";
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/index.js";

describe("Admin Routes — Tests d'intégration", () => {
  let tokenAdmin;
  let tokenSportif;

  beforeAll(async () => {
    const loginAdmin = await request(app).post("/auth/login").send({
      email: "admin@moovly.fr",
      mot_de_passe: process.env.SEED_PASSWORD_ADMIN,
    });
    tokenAdmin = loginAdmin.body.accessToken;

    const loginSportif = await request(app).post("/auth/login").send({
      email: "bocar@test.fr",
      mot_de_passe: process.env.SEED_PASSWORD_SPORTIF,
    });
    tokenSportif = loginSportif.body.accessToken;
  });

  describe("GET /admin/coaches", () => {
    it("TI-034 — doit retourner la liste des coachs en attente", async () => {
      const reponse = await request(app)
        .get("/admin/coaches")
        .set("Authorization", `Bearer ${tokenAdmin}`);
      expect(reponse.status).toBe(200);
      expect(Array.isArray(reponse.body.coachs)).toBe(true);
    });

    it("TI-035 — doit rejeter si non admin", async () => {
      const reponse = await request(app)
        .get("/admin/coaches")
        .set("Authorization", `Bearer ${tokenSportif}`);
      expect(reponse.status).toBe(403);
    });

    it("TI-036 — doit rejeter si non connecté", async () => {
      const reponse = await request(app).get("/admin/coaches");
      expect(reponse.status).toBe(401);
    });
  });

  describe("GET /admin/sports", () => {
    it("TI-037 — doit retourner la liste des sports", async () => {
      const reponse = await request(app)
        .get("/admin/sports")
        .set("Authorization", `Bearer ${tokenAdmin}`);
      expect(reponse.status).toBe(200);
      expect(reponse.body.total).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(reponse.body.sports)).toBe(true);
    });
  });

  describe("POST /admin/sports", () => {
    it("TI-038 — doit créer un nouveau sport", async () => {
      const reponse = await request(app)
        .post("/admin/sports")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({ nom: `Sport Test ${Date.now()}` });
      expect(reponse.status).toBe(201);
      expect(reponse.body.message).toBe("Sport créé avec succès");
    });

    it("TI-039 — doit rejeter si nom manquant", async () => {
      const reponse = await request(app)
        .post("/admin/sports")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({});
      expect(reponse.status).toBe(400);
    });

    it("TI-040 — doit rejeter si non admin", async () => {
      const reponse = await request(app)
        .post("/admin/sports")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ nom: "Football" });
      expect(reponse.status).toBe(403);
    });
  });

  describe("GET /admin/stats", () => {
    it("TI-041 — doit retourner les statistiques globales", async () => {
      const reponse = await request(app)
        .get("/admin/stats")
        .set("Authorization", `Bearer ${tokenAdmin}`);
      expect(reponse.status).toBe(200);
      expect(reponse.body.statistiques.totalUtilisateurs).toBeDefined();
      expect(reponse.body.statistiques.totalCoachs).toBeDefined();
      expect(reponse.body.statistiques.totalReservations).toBeDefined();
    });
  });

  describe("PUT /admin/coaches/:id/valider", () => {
    it("TI-042 — doit valider un coach", async () => {
      const register = await request(app)
        .post("/auth/register")
        .send({
          nom: "Test",
          prenom: "Coach",
          email: `coach.test.${Date.now()}@test.fr`,
          mot_de_passe: process.env.SEED_PASSWORD_COACH,
          role: "coach",
        });

      const coaches = await request(app)
        .get("/admin/coaches")
        .set("Authorization", `Bearer ${tokenAdmin}`);

      const coach = coaches.body.coachs.find(
        (c) => c.email === register.body.user.email,
      );

      const reponse = await request(app)
        .put(`/admin/coaches/${coach.id}/valider`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({ est_valide: true });

      expect(reponse.status).toBe(200);
      expect(reponse.body.statut_validation).toBe("valide");
    });

    it("TI-043 — doit rejeter si est_valide manquant", async () => {
      const reponse = await request(app)
        .put("/admin/coaches/1/valider")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({});
      expect(reponse.status).toBe(400);
    });
  });

  it("TI-044 — doit retourner 404 si le coach à valider est introuvable", async () => {
    const reponse = await request(app)
      .put("/admin/coaches/999999/valider")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ est_valide: true });

    expect(reponse.status).toBe(404);
    expect(reponse.body.error).toBe("Coach introuvable");
  });
});
