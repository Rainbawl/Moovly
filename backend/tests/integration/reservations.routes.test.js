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
      const dateFuture = new Date();
      dateFuture.setFullYear(dateFuture.getFullYear() + 5);
      dateFuture.setMonth(0);
      dateFuture.setDate(1);
      const date = dateFuture.toISOString().split("T")[0];

      const creneauCree = await request(app)
        .post("/coaches/1/creneaux")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ date, periode: "apres_midi" });

      if (creneauCree.status === 201) {
        const creneauId = creneauCree.body.creneau.id;

        const reponse = await request(app)
          .post("/reservations")
          .set("Authorization", `Bearer ${tokenSportif}`)
          .send({ creneau_id: creneauId });

        expect(reponse.status).toBe(201);
        expect(reponse.body.reservation).toBeDefined();
      } else {
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

    it("TI-028 — doit rejeter si le sportif tente d'annuler la réservation d'un autre (IDOR)", async () => {
      const dateFuture = new Date();
      dateFuture.setFullYear(dateFuture.getFullYear() + 7);
      dateFuture.setDate(dateFuture.getDate() + (Date.now() % 3650));
      const date = dateFuture.toISOString().split("T")[0];

      const creneauCree = await request(app)
        .post("/coaches/1/creneaux")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ date, periode: "matin" });

      if (creneauCree.status !== 201) {
        throw new Error(
          `Échec création créneau: ${JSON.stringify(creneauCree.body)}`,
        );
      }

      const creneaux = await request(app).get(
        `/coaches/1/creneaux?date=${date}`,
      );
      const creneauId = creneaux.body.creneaux[0].id;

      const reservation = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ creneau_id: creneauId });

      console.log(
        "Résultat réservation:",
        reservation.status,
        reservation.body,
      );

      const emailAutre = `autre.sportif.${Date.now()}@test.fr`;
      await request(app).post("/auth/register").send({
        nom: "Autre",
        prenom: "Sportif",
        email: emailAutre,
        mot_de_passe: process.env.SEED_PASSWORD_SPORTIF,
        role: "sportif",
      });
      const loginAutre = await request(app).post("/auth/login").send({
        email: emailAutre,
        mot_de_passe: process.env.SEED_PASSWORD_SPORTIF,
      });
      const tokenAutre = loginAutre.body.accessToken;

      const reponse = await request(app)
        .delete(`/reservations/${reservation.body.reservation.id}`)
        .set("Authorization", `Bearer ${tokenAutre}`);

      expect(reponse.status).toBe(403);
    });
  });

  describe("PUT /reservations/:id/repondre", () => {
    it("TI-044 — doit rejeter si non connecté", async () => {
      const reponse = await request(app)
        .put("/reservations/1/repondre")
        .send({ accepter: true });
      expect(reponse.status).toBe(401);
    });

    it("TI-045 — doit rejeter si un sportif tente de répondre", async () => {
      const reponse = await request(app)
        .put("/reservations/1/repondre")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ accepter: true });
      expect(reponse.status).toBe(403);
    });

    it("TI-046 — doit rejeter si le champ accepter est manquant", async () => {
      const reponse = await request(app)
        .put("/reservations/1/repondre")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({});
      expect(reponse.status).toBe(400);
      expect(reponse.body.error).toBeDefined();
    });

    it("TI-047 — doit rejeter si la réservation est introuvable", async () => {
      const reponse = await request(app)
        .put("/reservations/999999/repondre")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ accepter: true });
      expect(reponse.status).toBe(404);
    });

    it("TI-048 — doit accepter une réservation en attente avec succès", async () => {
      const dateFuture = new Date();
      dateFuture.setFullYear(dateFuture.getFullYear() + 6);
      dateFuture.setDate(dateFuture.getDate() + (Date.now() % 3650));
      const date = dateFuture.toISOString().split("T")[0];

      await request(app)
        .post("/coaches/1/creneaux")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ date, periode: "matin" });

      const creneaux = await request(app).get(
        `/coaches/1/creneaux?date=${date}`,
      );
      const disponible = creneaux.body.creneaux.find(
        (c) => c.statut === "disponible",
      );
      const creneauId = disponible.id;

      const reservation = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ creneau_id: creneauId });

      const reservationId = reservation.body.reservation.id;

      const reponse = await request(app)
        .put(`/reservations/${reservationId}/repondre`)
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ accepter: true });

      expect(reponse.status).toBe(200);
      expect(reponse.body.reservation.statut).toBe("confirmee");
    });

    it("TI-049 — doit refuser une réservation en attente avec succès", async () => {
      const dateFuture = new Date();
      dateFuture.setFullYear(dateFuture.getFullYear() + 6);
      dateFuture.setDate(dateFuture.getDate() + (Date.now() % 3650));
      const date = dateFuture.toISOString().split("T")[0];

      await request(app)
        .post("/coaches/1/creneaux")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ date, periode: "apres_midi" });

      const creneaux = await request(app).get(
        `/coaches/1/creneaux?date=${date}`,
      );
      const disponible = creneaux.body.creneaux.find(
        (c) => c.statut === "disponible",
      );
      const creneauId = disponible.id;

      const reservation = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ creneau_id: creneauId });

      const reservationId = reservation.body.reservation.id;

      const reponse = await request(app)
        .put(`/reservations/${reservationId}/repondre`)
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ accepter: false });

      expect(reponse.status).toBe(200);
      expect(reponse.body.reservation.statut).toBe("refusee");
    });

    it("TI-050 — doit rejeter si un autre coach tente de répondre (IDOR)", async () => {
      // Crée un deuxième coach, distinct de celui utilisé pour créer le créneau
      const emailAutreCoach = `autre.coach.${Date.now()}@test.fr`;
      await request(app)
        .post("/auth/register")
        .send({
          nom: `AutreCoach${Date.now()}`,
          prenom: "Test",
          email: emailAutreCoach,
          mot_de_passe: process.env.SEED_PASSWORD_COACH,
          role: "coach",
        });
      const loginAutreCoach = await request(app).post("/auth/login").send({
        email: emailAutreCoach,
        mot_de_passe: process.env.SEED_PASSWORD_COACH,
      });
      const tokenAutreCoach = loginAutreCoach.body.accessToken;

      const dateFuture = new Date();
      dateFuture.setFullYear(dateFuture.getFullYear() + 6);
      dateFuture.setDate(dateFuture.getDate() + (Date.now() % 3650));
      const date = dateFuture.toISOString().split("T")[0];

      await request(app)
        .post("/coaches/1/creneaux")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ date, periode: "matin" });

      const creneaux = await request(app).get(
        `/coaches/1/creneaux?date=${date}`,
      );
      const disponible = creneaux.body.creneaux.find(
        (c) => c.statut === "disponible",
      );
      const creneauId = disponible.id;

      const reservation = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ creneau_id: creneauId });

      const reservationId = reservation.body.reservation.id;

      const reponse = await request(app)
        .put(`/reservations/${reservationId}/repondre`)
        .set("Authorization", `Bearer ${tokenAutreCoach}`)
        .send({ accepter: true });

      expect(reponse.status).toBe(403);
    });
  });

  describe("PUT /reservations/:id", () => {
    it("TI-051 — doit rejeter si non connecté", async () => {
      const reponse = await request(app)
        .put("/reservations/1")
        .send({ nouveau_creneau_id: 2 });
      expect(reponse.status).toBe(401);
    });

    it("TI-052 — doit rejeter si nouveau_creneau_id manquant", async () => {
      const reponse = await request(app)
        .put("/reservations/1")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({});
      expect(reponse.status).toBe(400);
      expect(reponse.body.error).toBeDefined();
    });

    it("TI-053 — doit rejeter si un coach tente de modifier une réservation", async () => {
      const reponse = await request(app)
        .put("/reservations/1")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ nouveau_creneau_id: 2 });
      expect(reponse.status).toBe(403);
    });

    it("TI-054 — doit rejeter si la réservation est introuvable", async () => {
      const reponse = await request(app)
        .put("/reservations/999999")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ nouveau_creneau_id: 2 });
      expect(reponse.status).toBe(404);
    });

    it("TI-055 — doit modifier une réservation avec succès (nouveau créneau)", async () => {
      const dateInitiale = new Date();
      dateInitiale.setFullYear(dateInitiale.getFullYear() + 9);
      dateInitiale.setDate(dateInitiale.getDate() + (Date.now() % 3650));
      const dateInitialeStr = dateInitiale.toISOString().split("T")[0];

      const dateNouvelle = new Date(dateInitiale);
      dateNouvelle.setDate(dateNouvelle.getDate() + 1);
      const dateNouvelleStr = dateNouvelle.toISOString().split("T")[0];

      await request(app)
        .post("/coaches/1/creneaux")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ date: dateInitialeStr, periode: "matin" });

      await request(app)
        .post("/coaches/1/creneaux")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ date: dateNouvelleStr, periode: "matin" });

      const creneauxInitiaux = await request(app).get(
        `/coaches/1/creneaux?date=${dateInitialeStr}`,
      );
      const creneauInitial = creneauxInitiaux.body.creneaux.find(
        (c) => c.statut === "disponible",
      );

      const creneauxNouveaux = await request(app).get(
        `/coaches/1/creneaux?date=${dateNouvelleStr}`,
      );
      const nouveauCreneau = creneauxNouveaux.body.creneaux.find(
        (c) => c.statut === "disponible",
      );

      const reservation = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ creneau_id: creneauInitial.id });

      const reservationId = reservation.body.reservation.id;

      const reponse = await request(app)
        .put(`/reservations/${reservationId}`)
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ nouveau_creneau_id: nouveauCreneau.id });

      expect(reponse.status).toBe(200);
      expect(reponse.body.reservation.creneau_id).toBe(nouveauCreneau.id);
      expect(reponse.body.reservation.statut).toBe("en_attente");
    });

    it("TI-056 — doit rejeter si un sportif tente de modifier la réservation d'un autre (IDOR)", async () => {
      const dateFuture = new Date();
      dateFuture.setFullYear(dateFuture.getFullYear() + 10);
      dateFuture.setDate(dateFuture.getDate() + (Date.now() % 3650));
      const date = dateFuture.toISOString().split("T")[0];

      await request(app)
        .post("/coaches/1/creneaux")
        .set("Authorization", `Bearer ${tokenCoach}`)
        .send({ date, periode: "apres_midi" });

      const creneaux = await request(app).get(
        `/coaches/1/creneaux?date=${date}`,
      );
      const disponible = creneaux.body.creneaux.find(
        (c) => c.statut === "disponible",
      );
      const creneauId = disponible.id;

      const reservation = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ creneau_id: creneauId });

      const emailAutre = `autre.modif.${Date.now()}@test.fr`;
      await request(app).post("/auth/register").send({
        nom: "Autre",
        prenom: "Sportif",
        email: emailAutre,
        mot_de_passe: process.env.SEED_PASSWORD_SPORTIF,
        role: "sportif",
      });
      const loginAutre = await request(app).post("/auth/login").send({
        email: emailAutre,
        mot_de_passe: process.env.SEED_PASSWORD_SPORTIF,
      });
      const tokenAutre = loginAutre.body.accessToken;

      const reponse = await request(app)
        .put(`/reservations/${reservation.body.reservation.id}`)
        .set("Authorization", `Bearer ${tokenAutre}`)
        .send({ nouveau_creneau_id: creneauId });

      expect(reponse.status).toBe(403);
    });
  });
});
