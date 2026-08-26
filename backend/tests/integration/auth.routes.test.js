import "dotenv/config";
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/index.js";

// Mot de passe utilisé pour les comptes temporaires de test
const MOT_DE_PASSE_TEST = process.env.SEED_PASSWORD_SPORTIF;

describe("Auth Routes — Tests d'intégration", () => {
  // groupe de tests — inscription
  describe("POST /auth/register", () => {
    it("TI-001 — doit créer un compte sportif valide", async () => {
      const reponse = await request(app)
        .post("/auth/register")
        .send({
          nom: "Test",
          prenom: "Integration",
          email: `test.integration.${Date.now()}@test.fr`,
          mot_de_passe: MOT_DE_PASSE_TEST,
          role: "sportif",
        });
      expect(reponse.status).toBe(201);
      expect(reponse.body.message).toBe("Compte créé avec succès");
      expect(reponse.body.user.role).toBe("sportif");
    });

    it("TI-002 — doit rejeter un email déjà utilisé", async () => {
      const email = `doublon.${Date.now()}@test.fr`;
      await request(app).post("/auth/register").send({
        nom: "Test",
        prenom: "Doublon",
        email,
        mot_de_passe: MOT_DE_PASSE_TEST,
        role: "sportif",
      });
      const reponse = await request(app).post("/auth/register").send({
        nom: "Test",
        prenom: "Doublon",
        email,
        mot_de_passe: MOT_DE_PASSE_TEST,
        role: "sportif",
      });
      expect(reponse.status).toBe(409);
      expect(reponse.body.error).toBe("Email déjà utilisé");
    });

    it("TI-003 — doit rejeter si champs manquants", async () => {
      const reponse = await request(app)
        .post("/auth/register")
        .send({ email: "incomplet@test.fr" });
      expect(reponse.status).toBe(500);
    });
  });

  // groupe de tests — connexion
  describe("POST /auth/login", () => {
    it("TI-004 — doit connecter un utilisateur valide", async () => {
      const email = `login.${Date.now()}@test.fr`;
      await request(app).post("/auth/register").send({
        nom: "Login",
        prenom: "Test",
        email,
        mot_de_passe: MOT_DE_PASSE_TEST,
        role: "sportif",
      });
      const reponse = await request(app)
        .post("/auth/login")
        .send({ email, mot_de_passe: MOT_DE_PASSE_TEST });
      expect(reponse.status).toBe(200);
      expect(reponse.body.accessToken).toBeDefined();
      expect(reponse.body.user.email).toBe(email);
    });

    // vérification entre ce qu'on reçoit et ce qui est attendu
    it("TI-005 — doit rejeter un mauvais mot de passe", async () => {
      const reponse = await request(app)
        .post("/auth/login")
        .send({ email: "bocar@test.fr", mot_de_passe: "mauvaismdp" });
      expect(reponse.status).toBe(401);
      expect(reponse.body.error).toBe("Identifiants invalides");
    });

    // test seul, individuel, une checklist par exemple
    it("TI-006 — doit rejeter un email inexistant", async () => {
      const reponse = await request(app)
        .post("/auth/login")
        .send({ email: "inexistant@test.fr", mot_de_passe: MOT_DE_PASSE_TEST });
      expect(reponse.status).toBe(401);
      expect(reponse.body.error).toBe("Identifiants invalides");
    });
  });

  // groupe de tests — santé du serveur
  describe("GET /health", () => {
    it("TI-007 — doit retourner status ok", async () => {
      const reponse = await request(app).get("/health");
      expect(reponse.status).toBe(200);
      expect(reponse.body.status).toBe("ok");
    });
  });
});
