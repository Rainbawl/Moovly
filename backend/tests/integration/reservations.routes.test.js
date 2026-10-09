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

      // Un coach doit être validé par un admin avant de pouvoir se connecter
      const loginAdmin = await request(app).post("/auth/login").send({
        email: "admin@moovly.fr",
        mot_de_passe: process.env.SEED_PASSWORD_ADMIN,
      });
      const tokenAdmin = loginAdmin.body.accessToken;
      const coachsEnAttente = await request(app)
        .get("/admin/coaches")
        .set("Authorization", `Bearer ${tokenAdmin}`);
      const autreCoach = coachsEnAttente.body.coachs.find(
        (c) => c.email === emailAutreCoach,
      );
      await request(app)
        .put(`/admin/coaches/${autreCoach.id}/valider`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({ est_valide: true });

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
      // Les deux dates dont on a besoin : l'ancien créneau et le nouveau créneau
      let dateAncienCreneau;
      let dateNouveauCreneau;

      // La base garde les créneaux des lancements précédents.
      // On essaie donc plusieurs dates jusqu'à en trouver deux consécutives qui sont libres.
      for (let numeroEssai = 0; numeroEssai < 50; numeroEssai++) {
        // Date de départ : dans 9 ans + un nombre de jours qui change à chaque essai
        const jourAncien = new Date();
        jourAncien.setFullYear(jourAncien.getFullYear() + 9);
        jourAncien.setDate(
          jourAncien.getDate() + ((Date.now() + numeroEssai * 2) % 3650),
        );

        // Le lendemain
        const jourNouveau = new Date(jourAncien);
        jourNouveau.setDate(jourNouveau.getDate() + 1);

        // Format "AAAA-MM-JJ" attendu par l'API
        const texteDateAncienne = jourAncien.toISOString().split("T")[0];
        const texteDateNouvelle = jourNouveau.toISOString().split("T")[0];

        // Le coach crée un créneau le matin pour chacune des deux dates
        const reponseCreationAncien = await request(app)
          .post("/coaches/1/creneaux")
          .set("Authorization", `Bearer ${tokenCoach}`)
          .send({ date: texteDateAncienne, periode: "matin" });
        const reponseCreationNouveau = await request(app)
          .post("/coaches/1/creneaux")
          .set("Authorization", `Bearer ${tokenCoach}`)
          .send({ date: texteDateNouvelle, periode: "matin" });

        // 201 = créé : si les deux créneaux sont créés, on garde ces dates et on sort de la boucle
        if (
          reponseCreationAncien.status === 201 &&
          reponseCreationNouveau.status === 201
        ) {
          dateAncienCreneau = texteDateAncienne;
          dateNouveauCreneau = texteDateNouvelle;
          break;
        }
        // Sinon une des dates était déjà prise : on recommence avec d'autres dates
      }

      // On récupère les créneaux disponibles à chacune des deux dates
      const reponseCreneauxAncien = await request(app).get(
        `/coaches/1/creneaux?date=${dateAncienCreneau}`,
      );
      const ancienCreneau = reponseCreneauxAncien.body.creneaux.find(
        (creneau) => creneau.statut === "disponible",
      );

      const reponseCreneauxNouveau = await request(app).get(
        `/coaches/1/creneaux?date=${dateNouveauCreneau}`,
      );
      const nouveauCreneau = reponseCreneauxNouveau.body.creneaux.find(
        (creneau) => creneau.statut === "disponible",
      );

      // Le sportif réserve l'ancien créneau
      const reponseReservation = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ creneau_id: ancienCreneau.id });

      const identifiantReservation = reponseReservation.body.reservation.id;

      // Puis il modifie sa réservation pour passer sur le nouveau créneau
      const reponse = await request(app)
        .put(`/reservations/${identifiantReservation}`)
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ nouveau_creneau_id: nouveauCreneau.id });

      // Résultat attendu : 200, la réservation pointe vers le nouveau créneau, statut en attente
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

    // Crée un créneau disponible pour un coach, sur une date libre (la base garde
    // les créneaux des lancements précédents, on essaie donc plusieurs dates)
    const creerCreneauDisponible = async (token, coachId, anneesDecalage) => {
      for (let numeroEssai = 0; numeroEssai < 50; numeroEssai++) {
        const jour = new Date();
        jour.setFullYear(jour.getFullYear() + anneesDecalage);
        jour.setDate(jour.getDate() + ((Date.now() + numeroEssai * 7) % 3650));

        const reponseCreation = await request(app)
          .post(`/coaches/${coachId}/creneaux`)
          .set("Authorization", `Bearer ${token}`)
          .send({ date: jour.toISOString().split("T")[0], periode: "apres_midi" });

        if (reponseCreation.status === 201) {
          return reponseCreation.body.creneau.id;
        }
      }
      throw new Error("Aucune date libre trouvée pour créer un créneau");
    };

    // Retrouve une réservation dans l'historique du sportif connecté
    const trouverMaReservation = async (reservationId) => {
      const reponse = await request(app)
        .get("/reservations/mine")
        .set("Authorization", `Bearer ${tokenSportif}`);
      return reponse.body.reservations.find(
        (reservation) => reservation.id === reservationId,
      );
    };

    it("TI-057 — doit rejeter une modification vers le créneau d'un autre coach et conserver la réservation", async () => {
      // Le sportif réserve un créneau du coach 1
      const ancienCreneauId = await creerCreneauDisponible(tokenCoach, 1, 11);
      const reponseReservation = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ creneau_id: ancienCreneauId });
      const reservationId = reponseReservation.body.reservation.id;

      // Un créneau d'un autre coach (créé par l'admin, autorisé pour tous les coachs)
      const loginAdmin = await request(app).post("/auth/login").send({
        email: "admin@moovly.fr",
        mot_de_passe: process.env.SEED_PASSWORD_ADMIN,
      });
      const tokenAdmin = loginAdmin.body.accessToken;
      const listeCoachs = await request(app).get("/coaches");
      const autreCoach = listeCoachs.body.coachs.find((coach) => coach.id !== 1);
      const creneauAutreCoachId = await creerCreneauDisponible(
        tokenAdmin,
        autreCoach.id,
        11,
      );

      // Changer de coach par « modifier » contournerait la règle des 24h : refusé
      const reponse = await request(app)
        .put(`/reservations/${reservationId}`)
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ nouveau_creneau_id: creneauAutreCoachId });

      expect(reponse.status).toBe(400);
      const reservation = await trouverMaReservation(reservationId);
      expect(reservation.statut).toBe("en_attente");
    });

    it("TI-058 — doit conserver la réservation d'origine si le nouveau créneau est déjà pris", async () => {
      const ancienCreneauId = await creerCreneauDisponible(tokenCoach, 1, 12);
      const creneauPrisId = await creerCreneauDisponible(tokenCoach, 1, 12);

      const reponseReservation = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ creneau_id: ancienCreneauId });
      const reservationId = reponseReservation.body.reservation.id;

      // Le second créneau est réservé : il n'est plus disponible
      await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ creneau_id: creneauPrisId });

      const reponse = await request(app)
        .put(`/reservations/${reservationId}`)
        .set("Authorization", `Bearer ${tokenSportif}`)
        .send({ nouveau_creneau_id: creneauPrisId });

      // Tout ou rien : la modification échoue et l'ancienne réservation n'est pas annulée
      expect(reponse.status).toBe(409);
      const reservation = await trouverMaReservation(reservationId);
      expect(reservation.statut).toBe("en_attente");
    });
  });
});
