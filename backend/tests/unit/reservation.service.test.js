import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/repositories/reservation.repository.js", () => ({
  creerReservation: vi.fn(),
  trouverReservationsParUtilisateur: vi.fn(),
  trouverReservationParId: vi.fn(),
  annulerReservation: vi.fn(),
}));

vi.mock("../../src/repositories/creneau.repository.js", () => ({
  trouverCreneauxParCoachEtDate: vi.fn(),
  creerCreneau: vi.fn(),
  trouverCreneauParId: vi.fn(),
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
    depotReservation.trouverReservationParId.mockResolvedValue({
      id: 1,
      utilisateur_id: 1,
      statut: "en_attente",
      creneau: {
        date: new Date(Date.now() + 2 * 60 * 60 * 1000), // dans 2h seulement
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
});
