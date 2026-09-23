import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/repositories/creneau.repository.js", () => ({
  trouverCreneauxParCoachEtDate: vi.fn(),
  creerCreneau: vi.fn(),
  trouverCreneauParId: vi.fn(),
}));

vi.mock("../../src/repositories/reservation.repository.js", () => ({
  creerReservation: vi.fn(),
  trouverReservationsParUtilisateur: vi.fn(),
  trouverReservationParId: vi.fn(),
  annulerReservation: vi.fn(),
  changerStatutReservation: vi.fn(),
}));

import * as depotReservation from "../../src/repositories/reservation.repository.js";
import * as serviceReservation from "../../src/services/reservation.service.js";

describe("Reservation Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── creerReservation ──────────────────────────────────────────
  it("TU-017 — creerReservation : doit créer une réservation avec succès", async () => {
    depotReservation.creerReservation.mockResolvedValue({
      id: 1,
      utilisateur_id: 1,
      creneau_id: 1,
      statut: "en_attente",
    });

    const reservation = await serviceReservation.creerReservation(1, 1);

    expect(reservation.statut).toBe("en_attente");
    expect(depotReservation.creerReservation).toHaveBeenCalledWith(1, 1);
  });

  // ── obtenirMesReservations ────────────────────────────────────
  it("TU-018 — obtenirMesReservations : doit retourner les réservations formatées", async () => {
    depotReservation.trouverReservationsParUtilisateur.mockResolvedValue([
      {
        id: 1,
        statut: "en_attente",
        date_reservation: new Date(),
        date_annulation: null,
        creneau: {
          id: 1,
          date: new Date("2026-08-10"),
          periode: "matin",
          coach: {
            utilisateur: { nom: "Lebrun", prenom: "Thomas" },
          },
        },
      },
    ]);

    const reservations = await serviceReservation.obtenirMesReservations(1);

    expect(reservations).toHaveLength(1);
    expect(reservations[0].creneau.horaire).toBe("8h00 - 12h00");
    expect(reservations[0].creneau.coach.nom).toBe("Lebrun");
  });

  it("TU-019 — obtenirMesReservations : doit retourner tableau vide si aucune réservation", async () => {
    depotReservation.trouverReservationsParUtilisateur.mockResolvedValue([]);

    const reservations = await serviceReservation.obtenirMesReservations(1);

    expect(reservations).toHaveLength(0);
  });

  // ── annulerReservation ────────────────────────────────────────
  it("TU-020 — annulerReservation : doit rejeter si réservation introuvable", async () => {
    depotReservation.trouverReservationParId.mockResolvedValue(null);

    await expect(serviceReservation.annulerReservation(999, 1)).rejects.toThrow(
      "Réservation introuvable",
    );
  });

  it("TU-021 — annulerReservation : doit rejeter si réservation appartient à un autre utilisateur", async () => {
    depotReservation.trouverReservationParId.mockResolvedValue({
      id: 1,
      utilisateur_id: 2, // appartient à l'utilisateur 2
      statut: "en_attente",
      creneau: { date: new Date(Date.now() + 48 * 60 * 60 * 1000) },
    });

    await expect(
      serviceReservation.annulerReservation(1, 1), // utilisateur 1 essaie d'annuler
    ).rejects.toThrow("Vous ne pouvez pas annuler cette réservation");
  });

  it("TU-022 — annulerReservation : doit rejeter si moins de 24h avant la séance", async () => {
    // On construit une date de créneau qui sera fixée à 8h (matin) par le service
    const maintenant = new Date();
    const dateCreneauTest = new Date(maintenant);
    dateCreneauTest.setHours(8, 0, 0, 0);

    // Si 8h ce matin est déjà passé, on vise demain matin à la place
    if (dateCreneauTest <= maintenant) {
      dateCreneauTest.setDate(dateCreneauTest.getDate() + 1);
    }

    depotReservation.trouverReservationParId.mockResolvedValue({
      id: 1,
      utilisateur_id: 1,
      statut: "en_attente",
      creneau: {
        date: dateCreneauTest,
        periode: "matin",
      },
    });

    await expect(serviceReservation.annulerReservation(1, 1)).rejects.toThrow(
      "Impossible d'annuler moins de 24h avant la séance",
    );
  });
  it("TU-023 — annulerReservation : doit annuler si plus de 24h avant", async () => {
    depotReservation.trouverReservationParId.mockResolvedValue({
      id: 1,
      utilisateur_id: 1,
      statut: "en_attente",
      creneau: {
        date: new Date(Date.now() + 48 * 60 * 60 * 1000), // dans 48h
      },
    });

    depotReservation.annulerReservation.mockResolvedValue({
      id: 1,
      statut: "annulee",
    });

    const reservation = await serviceReservation.annulerReservation(1, 1);

    expect(reservation.statut).toBe("annulee");
  });

  it("TU-024 — annulerReservation : doit rejeter si déjà annulée", async () => {
    depotReservation.trouverReservationParId.mockResolvedValue({
      id: 1,
      utilisateur_id: 1,
      statut: "annulee", // déjà annulée
      creneau: {
        date: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    await expect(serviceReservation.annulerReservation(1, 1)).rejects.toThrow(
      "Cette réservation est déjà annulée",
    );
  });

  //  repondreReservation
  it("TU-043 — repondreReservation : doit rejeter si réservation introuvable", async () => {
    depotReservation.trouverReservationParId.mockResolvedValue(null);

    await expect(
      serviceReservation.repondreReservation(999, 1, true),
    ).rejects.toThrow("Réservation introuvable");
  });

  it("TU-044 — repondreReservation : doit rejeter si le coach n'est pas propriétaire du créneau", async () => {
    depotReservation.trouverReservationParId.mockResolvedValue({
      id: 1,
      statut: "en_attente",
      creneau: {
        coach: { utilisateur_id: 2 }, // appartient au coach 2
      },
    });

    await expect(
      serviceReservation.repondreReservation(1, 1, true), // coach 1 essaie de répondre
    ).rejects.toThrow("Vous ne pouvez pas répondre à cette réservation");
  });

  it("TU-045 — repondreReservation : doit rejeter si la réservation a déjà été traitée", async () => {
    depotReservation.trouverReservationParId.mockResolvedValue({
      id: 1,
      statut: "confirmee", // déjà traitée
      creneau: {
        coach: { utilisateur_id: 1 },
      },
    });

    await expect(
      serviceReservation.repondreReservation(1, 1, true),
    ).rejects.toThrow("Cette réservation a déjà été traitée");
  });

  it("TU-046 — repondreReservation : doit accepter la réservation (statut confirmee)", async () => {
    depotReservation.trouverReservationParId.mockResolvedValue({
      id: 1,
      statut: "en_attente",
      creneau: {
        coach: { utilisateur_id: 1 },
      },
    });

    depotReservation.changerStatutReservation.mockResolvedValue({
      id: 1,
      statut: "confirmee",
    });

    const reservation = await serviceReservation.repondreReservation(
      1,
      1,
      true,
    );

    expect(reservation.statut).toBe("confirmee");
    expect(depotReservation.changerStatutReservation).toHaveBeenCalledWith(
      1,
      "confirmee",
    );
  });

  it("TU-047 — repondreReservation : doit refuser la réservation (statut refusee)", async () => {
    depotReservation.trouverReservationParId.mockResolvedValue({
      id: 1,
      statut: "en_attente",
      creneau: {
        coach: { utilisateur_id: 1 },
      },
    });

    depotReservation.changerStatutReservation.mockResolvedValue({
      id: 1,
      statut: "refusee",
    });

    const reservation = await serviceReservation.repondreReservation(
      1,
      1,
      false,
    );

    expect(reservation.statut).toBe("refusee");
    expect(depotReservation.changerStatutReservation).toHaveBeenCalledWith(
      1,
      "refusee",
    );
  });

  // ── modifierReservation ───────────────────────────────────────
  it("TU-048 — modifierReservation : doit rejeter si réservation introuvable", async () => {
    depotReservation.trouverReservationParId.mockResolvedValue(null);

    await expect(
      serviceReservation.modifierReservation(999, 1, 2),
    ).rejects.toThrow("Réservation introuvable");
  });

  it("TU-049 — modifierReservation : doit rejeter si réservation appartient à un autre utilisateur", async () => {
    depotReservation.trouverReservationParId.mockResolvedValue({
      id: 1,
      utilisateur_id: 2, // appartient à l'utilisateur 2
      statut: "en_attente",
    });

    await expect(
      serviceReservation.modifierReservation(1, 1, 2), // utilisateur 1 essaie de modifier
    ).rejects.toThrow("Vous ne pouvez pas modifier cette réservation");
  });

  it("TU-050 — modifierReservation : doit rejeter si la réservation est déjà annulée", async () => {
    depotReservation.trouverReservationParId.mockResolvedValue({
      id: 1,
      utilisateur_id: 1,
      statut: "annulee",
    });

    await expect(
      serviceReservation.modifierReservation(1, 1, 2),
    ).rejects.toThrow("Cette réservation est déjà annulée");
  });

  it("TU-051 — modifierReservation : doit libérer l'ancien créneau et créer la nouvelle réservation", async () => {
    depotReservation.trouverReservationParId.mockResolvedValue({
      id: 1,
      utilisateur_id: 1,
      statut: "en_attente",
    });

    depotReservation.annulerReservation.mockResolvedValue({
      id: 1,
      statut: "annulee",
    });

    depotReservation.creerReservation.mockResolvedValue({
      id: 2,
      utilisateur_id: 1,
      creneau_id: 5,
      statut: "en_attente",
    });

    const nouvelleReservation = await serviceReservation.modifierReservation(
      1,
      1,
      5,
    );

    expect(depotReservation.annulerReservation).toHaveBeenCalledWith(1);
    expect(depotReservation.creerReservation).toHaveBeenCalledWith(1, 5);
    expect(nouvelleReservation.creneau_id).toBe(5);
    expect(nouvelleReservation.id).toBe(2);
  });
});
