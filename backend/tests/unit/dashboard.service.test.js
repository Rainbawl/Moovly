// Tests unitaires du Dashboard Service
// On teste la logique métier sans toucher à la vraie BDD
// Le repository est simulé avec des mocks (vi.fn())

import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";

// On simule le repository — pas de vraie BDD dans les tests unitaires
vi.mock("../../src/repositories/dashboard.repository.js", () => ({
  trouverPlanningCoach: vi.fn(),
  trouverStatistiquesCoach: vi.fn(),
}));

import * as depotDashboard from "../../src/repositories/dashboard.repository.js";
import * as serviceDashboard from "../../src/services/dashboard.service.js";

describe("Dashboard Service", () => {
  // Réinitialise les mocks avant chaque test pour éviter les interférences
  beforeEach(() => {
    vi.clearAllMocks();
  });

  //  obtenirPlanningCoach

  // Teste le cas où le coach n'existe pas en BDD
  it("TU-029 — obtenirPlanningCoach : doit retourner 404 si coach introuvable", async () => {
    // Simule que le repository ne trouve aucun coach
    depotDashboard.trouverPlanningCoach.mockResolvedValue(null);

    // On s'attend à ce que le service lance une erreur 404
    await expect(serviceDashboard.obtenirPlanningCoach(999)).rejects.toThrow(
      "Profil coach introuvable",
    );
  });

  // Teste le formatage correct des créneaux matin
  it("TU-030 — obtenirPlanningCoach : doit retourner le planning formaté", async () => {
    // Simule un coach avec un créneau matin et une réservation
    depotDashboard.trouverPlanningCoach.mockResolvedValue({
      id: 1,
      est_valide: true,
      presentation: "Coach running",
      tarif_horaire: 35,
      note_moyenne: 4.5,
      creneaux: [
        {
          id: 1,
          date: new Date("2026-08-25"),
          periode: "matin",
          statut: "disponible",
          reservations: [
            {
              id: 1,
              statut: "en_attente",
              utilisateur: {
                nom: "Mané",
                prenom: "Bocar",
                email: "bocar@test.fr",
              },
            },
          ],
        },
      ],
    });

    const planning = await serviceDashboard.obtenirPlanningCoach(1);

    // Vérifie que le planning est bien formaté
    expect(planning.id).toBe(1);
    expect(planning.creneaux).toHaveLength(1);
    // Vérifie que l'horaire matin est correct
    expect(planning.creneaux[0].horaire).toBe("8h00 - 12h00");
    // Vérifie que les infos du sportif sont bien incluses
    expect(planning.creneaux[0].reservations[0].sportif.nom).toBe("Mané");
  });

  // Teste que l'horaire après-midi est correctement calculé
  it("TU-031 — obtenirPlanningCoach : créneau après-midi doit avoir le bon horaire", async () => {
    depotDashboard.trouverPlanningCoach.mockResolvedValue({
      id: 1,
      est_valide: true,
      presentation: null,
      tarif_horaire: null,
      note_moyenne: null,
      creneaux: [
        {
          id: 2,
          date: new Date("2026-08-25"),
          periode: "apres_midi",
          statut: "disponible",
          reservations: [],
        },
      ],
    });

    const planning = await serviceDashboard.obtenirPlanningCoach(1);
    // Vérifie que l'horaire après-midi est correct
    expect(planning.creneaux[0].horaire).toBe("14h00 - 18h00");
  });

  //  obtenir Statistiques Coach

  // Teste le cas où le coach n'a pas de profil
  it("TU-032 — obtenirStatistiquesCoach : doit retourner 404 si coach introuvable", async () => {
    // Simule que le repository ne trouve aucun coach
    depotDashboard.trouverStatistiquesCoach.mockResolvedValue(null);

    // On s'attend à ce que le service lance une erreur 404
    await expect(
      serviceDashboard.obtenirStatistiquesCoach(999),
    ).rejects.toThrow("Profil coach introuvable");
  });

  // Teste que les statistiques sont bien retournées
  it("TU-033 — obtenirStatistiquesCoach : doit retourner les statistiques", async () => {
    // Simule des statistiques retournées par le repository
    depotDashboard.trouverStatistiquesCoach.mockResolvedValue({
      totalCreneaux: 5,
      totalReservations: 3,
      creneauxDisponibles: 2,
    });

    const stats = await serviceDashboard.obtenirStatistiquesCoach(1);

    // Vérifie que les statistiques sont correctes
    expect(stats.totalCreneaux).toBe(5);
    expect(stats.totalReservations).toBe(3);
    expect(stats.creneauxDisponibles).toBe(2);
  });
});
