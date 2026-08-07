import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/index.js";

describe("Auth Routes — Tests d'intégration", () => {
  // ── POST /auth/register ───────────────────────────────────────
  describe("POST /auth/register", () => {
    it("TI-001 — doit créer un compte sportif valide", async () => {
      const reponse = await request(app)
        .post("/auth/register")
        .send({
          nom: "Test",
          prenom: "Integration",
          email: `test.integration.${Date.now()}@test.fr`,
          mot_de_passe: "password123",
          role: "sportif",
        });

      expect(reponse.status).toBe(201);
      expect(reponse.body.message).toBe("Compte créé avec succès");
      expect(reponse.body.user.role).toBe("sportif");
    });

    it("TI-002 — doit rejeter un email déjà utilisé", async () => {
      const email = `doublon.${Date.now()}@test.fr`;

      // Premier inscription
      await request(app).post("/auth/register").send({
        nom: "Test",
        prenom: "Doublon",
        email,
        mot_de_passe: "password123",
        role: "sportif",
      });

      // Deuxième inscription avec le même email
      const reponse = await request(app).post("/auth/register").send({
        nom: "Test",
        prenom: "Doublon",
        email,
        mot_de_passe: "password123",
        role: "sportif",
      });

      expect(reponse.status).toBe(409);
      expect(reponse.body.error).toBe("Email déjà utilisé");
    });

    it("TI-003 — doit rejeter si champs manquants", async () => {
      const reponse = await request(app).post("/auth/register").send({
        email: "incomplet@test.fr",
        // nom, prenom, mot_de_passe manquants
      });

      expect(reponse.status).toBe(500);
    });
  });

  // ── POST /auth/login ──────────────────────────────────────────
  describe("POST /auth/login", () => {
    it("TI-004 — doit connecter un utilisateur valide", async () => {
      const email = `login.${Date.now()}@test.fr`;

      // Crée d'abord un compte
      await request(app).post("/auth/register").send({
        nom: "Login",
        prenom: "Test",
        email,
        mot_de_passe: "password123",
        role: "sportif",
      });

      // Connexion
      const reponse = await request(app)
        .post("/auth/login")
        .send({ email, mot_de_passe: "password123" });

      expect(reponse.status).toBe(200);
      expect(reponse.body.accessToken).toBeDefined();
      expect(reponse.body.user.email).toBe(email);
    });

    it("TI-005 — doit rejeter un mauvais mot de passe", async () => {
      const reponse = await request(app).post("/auth/login").send({
        email: "jean@test.fr",
        mot_de_passe: "mauvaismdp",
      });

      expect(reponse.status).toBe(401);
      expect(reponse.body.error).toBe("Identifiants invalides");
    });

    it("TI-006 — doit rejeter un email inexistant", async () => {
      const reponse = await request(app).post("/auth/login").send({
        email: "inexistant@test.fr",
        mot_de_passe: "password123",
      });

      expect(reponse.status).toBe(401);
      expect(reponse.body.error).toBe("Identifiants invalides");
    });
  });

  // ── GET /health ───────────────────────────────────────────────
  describe("GET /health", () => {
    it("TI-007 — doit retourner status ok", async () => {
      const reponse = await request(app).get("/health");

      expect(reponse.status).toBe(200);
      expect(reponse.body.status).toBe("ok");
    });
  });
});
