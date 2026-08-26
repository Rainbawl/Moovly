import "dotenv/config";
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/index.js";

describe("Reservations Routes — Tests d'intégration", () => {
  let tokenSportif;
  let tokenCoach;

  beforeAll(async () => {
    const loginSportif = await request(app).post("/auth/login").send({
      email: "bocar@test.fr",
      mot_de_passe: process.env.SEED_PASSWORD_SPORTIF,
    });
    tokenSportif = loginSportif.body.accessToken;

    const loginCoach = await request(app).post("/auth/login").send({
      email: "camille@test.fr",
      mot_de_passe: process.env.SEED_PASSWORD_COACH,
    });
    tokenCoach = loginCoach.body.accessToken;

    // Crée un créneau disponible pour les tests
    await request(app)
      .post("/coaches/1/creneaux")
      .set("Authorization", `Bearer ${tokenCoach}`)
      .send({ date: "2026-10-01", periode: "matin" });
  });

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

    it("TI-024 — doit créer une réservation avec succès", async () => {
      // Date unique basée sur timestamp pour éviter les conflits
      const dateFuture = new Date();
      dateFuture.setFullYear(dateFuture.getFullYear() + 5);
      dateFuture.setMonth(0); // Janvier
      dateFuture.setDate(1);
      const date = dateFuture.toISOString().split("T")[0];

      // Crée un nouveau créneau
      const creneauCree = await request(app)
        .post("/coaches/1/creneaux")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ date, periode: "apres_midi" });

      // Si le créneau a été créé avec succès
      if (creneauCree.status === 201) {
        const creneauId = creneauCree.body.creneau.id;

        const reponse = await request(app)
          .post("/reservations")
          .set("Authorization", `Bearer ${tokenSportif}`)
          .send({ creneau_id: creneauId });

        expect(reponse.status).toBe(201);
        expect(reponse.body.reservation).toBeDefined();
      } else {
        // Créneau déjà existant — on récupère les créneaux disponibles
        const creneaux = await request(app).get(
          `/coaches/1/creneaux?date=${date}`,
        );
        const disponible = creneaux.body.creneaux?.find(
          (c) => c.statut === "disponible",
        );

        if (disponible) {
          const reponse = await request(app)
            .post("/reservations")
            .set("Authorization", `Bearer ${tokenSportif}`)
            .send({ creneau_id: disponible.id });
          expect(reponse.status).toBe(201);
        }
      }
    });
    it("TI-025 — doit rejeter si créneau inexistant", async () => {
      const reponse = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ creneau_id: 99999 });
      expect(reponse.status).toBe(404);
    });

    it("TI-026 — doit rejeter si créneau déjà réservé", async () => {
      const dateFuture = new Date();
      dateFuture.setFullYear(dateFuture.getFullYear() + 3);
      const date = dateFuture.toISOString().split("T")[0];

      await request(app)
        .post("/coaches/1/creneaux")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ date, periode: "apres_midi" });

      const creneaux = await request(app).get(
        `/coaches/1/creneaux?date=${date}`,
      );

      const creneauId = creneaux.body.creneaux[0].id;

      await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ creneau_id: creneauId });

      const reponse = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ creneau_id: creneauId });

      expect(reponse.status).toBe(409);
    });
  });

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

    it("TI-027 — doit annuler une réservation existante", async () => {
      const dateFuture = new Date();
      dateFuture.setFullYear(dateFuture.getFullYear() + 4);
      const date = dateFuture.toISOString().split("T")[0];

      await request(app)
        .post("/coaches/1/creneaux")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ date, periode: "matin" });

      const creneaux = await request(app).get(
        `/coaches/1/creneaux?date=${date}`,
      );

      const creneauId = creneaux.body.creneaux[0].id;

      const reservation = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ creneau_id: creneauId });

      const reservationId = reservation.body.reservation.id;

      const reponse = await request(app)
        .delete(`/reservations/${reservationId}`)
        .set("Authorization", `Bearer ${tokenSportif}`);

      expect(reponse.status).toBe(200);
      expect(reponse.body.message).toBe("Réservation annulée avec succès");
    });
  });
});
