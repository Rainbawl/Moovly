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
          date: new Date("2030-08-26"),
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
          date: new Date("2030-08-26"),
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

  // Teste qu'une séance confirmée déjà passée apparaît terminée dans le planning
  it("TU-058 — obtenirPlanningCoach : une réservation confirmée passée est renvoyée terminee", async () => {
    depotDashboard.trouverPlanningCoach.mockResolvedValue({
      id: 1,
      est_valide: true,
      creneaux: [
        {
          id: 1,
          date: new Date("2026-01-05"), // séance passée
          periode: "matin",
          statut: "reserve",
          reservations: [
            {
              id: 1,
              statut: "confirmee",
              utilisateur: { nom: "Mané", prenom: "Bocar", email: "bocar@test.fr" },
            },
          ],
        },
      ],
    });

    const planning = await serviceDashboard.obtenirPlanningCoach(1);

    expect(planning.creneaux[0].reservations[0].statut).toBe("terminee");
  });

  // Teste l'ordre : demandes à traiter d'abord, créneaux disponibles à la fin
  it("TU-064 — obtenirPlanningCoach : les demandes en attente d'abord, les créneaux disponibles à la fin", async () => {
    const sportif = { nom: "Mané", prenom: "Bocar", email: "bocar@test.fr" };
    depotDashboard.trouverPlanningCoach.mockResolvedValue({
      id: 1,
      creneaux: [
        // Ordre du repository : par date
        { id: 1, date: new Date("2030-03-01"), periode: "matin", statut: "disponible", reservations: [] },
        { id: 2, date: new Date("2030-03-02"), periode: "matin", statut: "reserve", reservations: [{ id: 10, statut: "confirmee", utilisateur: sportif }] },
        { id: 3, date: new Date("2030-03-03"), periode: "apres_midi", statut: "en_attente", reservations: [{ id: 11, statut: "en_attente", utilisateur: sportif }] },
        { id: 4, date: new Date("2030-03-03"), periode: "matin", statut: "en_attente", reservations: [{ id: 12, statut: "en_attente", utilisateur: sportif }] },
        { id: 5, date: new Date("2030-03-04"), periode: "matin", statut: "disponible", reservations: [] },
      ],
    });

    const planning = await serviceDashboard.obtenirPlanningCoach(1);

    // 4 et 3 : demandes (matin avant après-midi) · 2 : réservé · 1 et 5 : disponibles
    expect(planning.creneaux.map((c) => c.id)).toEqual([4, 3, 2, 1, 5]);
  });

  // Teste qu'une réservation refusée ou annulée n'apparaît plus sous un créneau libéré
  it("TU-068 — obtenirPlanningCoach : les réservations refusées et annulées ne sont pas affichées", async () => {
    const sportif = { nom: "Mané", prenom: "Bocar", email: "bocar@test.fr" };
    depotDashboard.trouverPlanningCoach.mockResolvedValue({
      id: 1,
      creneaux: [
        {
          id: 1,
          date: new Date("2047-10-21"),
          periode: "matin",
          statut: "disponible",
          reservations: [
            { id: 10, statut: "refusee", utilisateur: sportif },
            { id: 11, statut: "annulee", utilisateur: sportif },
            { id: 12, statut: "en_attente", utilisateur: sportif },
          ],
        },
      ],
    });

    const planning = await serviceDashboard.obtenirPlanningCoach(1);

    expect(planning.creneaux[0].reservations.map((r) => r.id)).toEqual([12]);
  });

  // Teste que les créneaux passés sans séance confirmée sont masqués
  it("TU-069 — obtenirPlanningCoach : un créneau passé n'est gardé que s'il a eu une séance confirmée", async () => {
    const sportif = { nom: "Mané", prenom: "Bocar", email: "bocar@test.fr" };
    const hier = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const demain = new Date(Date.now() + 24 * 60 * 60 * 1000);
    depotDashboard.trouverPlanningCoach.mockResolvedValue({
      id: 1,
      creneaux: [
        { id: 1, date: hier, periode: "matin", statut: "disponible", reservations: [] }, // jamais réservé
        { id: 2, date: hier, periode: "apres_midi", statut: "en_attente", reservations: [{ id: 20, statut: "en_attente", utilisateur: sportif }] }, // demande sans réponse
        { id: 3, date: new Date("2026-01-05"), periode: "matin", statut: "reserve", reservations: [{ id: 30, statut: "confirmee", utilisateur: sportif }] }, // séance faite
        { id: 4, date: demain, periode: "matin", statut: "disponible", reservations: [] }, // à venir
      ],
    });

    const planning = await serviceDashboard.obtenirPlanningCoach(1);

    // 3 : séance passée affichée « terminee » · 4 : créneau à venir · 1 et 2 masqués
    expect(planning.creneaux.map((c) => c.id)).toEqual([3, 4]);
    expect(planning.creneaux[0].reservations[0].statut).toBe("terminee");
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
