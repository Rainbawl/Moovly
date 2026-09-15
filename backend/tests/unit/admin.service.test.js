// Tests unitaires du Admin Service
// On teste la logique métier sans toucher à la vraie BDD
// Le repository est simulé avec des mocks (vi.fn())

import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";

// On simule le repository
vi.mock("../../src/repositories/admin.repository.js", () => ({
  trouverCoachsEnAttente: vi.fn(),
  validerCoach: vi.fn(),
  trouverTousLesSports: vi.fn(),
  creerSport: vi.fn(),
  obtenirStatistiques: vi.fn(),
}));

import * as depotAdmin from "../../src/repositories/admin.repository.js";
import * as serviceAdmin from "../../src/services/admin.service.js";

describe("Admin Service", () => {
  // Réinitialise les mocks avant chaque test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  //  obtenirCoachsEnAttente

  it("TU-034 — obtenirCoachsEnAttente : doit retourner la liste formatée", async () => {
    // Simule un coach en attente retourné par le repository
    depotAdmin.trouverCoachsEnAttente.mockResolvedValue([
      {
        id: 1,
        statut_validation: "en_attente",
        presentation: null,
        tarif_horaire: null,
        utilisateur: {
          nom: "Mané",
          prenom: "Bocar",
          email: "bocar@test.fr",
          date_creation: new Date(),
        },
        sports: [{ sport: { nom: "Tennis" } }],
      },
    ]);

    const coachs = await serviceAdmin.obtenirCoachsEnAttente();

    // Vérifie que le formatage est correct
    expect(coachs).toHaveLength(1);
    expect(coachs[0].nom).toBe("Mané");
    expect(coachs[0].sports).toContain("Tennis");
  });

  //  validerCoach ─

  it("TU-035 — validerCoach : doit retourner 404 si coach introuvable", async () => {
    // Simule que le repository ne trouve aucun coach
    depotAdmin.validerCoach.mockResolvedValue(null);

    await expect(serviceAdmin.validerCoach(999, true)).rejects.toThrow(
      "Coach introuvable",
    );
  });

  it("TU-036 — validerCoach : doit valider un coach avec succès", async () => {
    // Simule un coach validé
    depotAdmin.validerCoach.mockResolvedValue({
      id: 1,
      statut_validation: "valide",
    });

    const resultat = await serviceAdmin.validerCoach(1, true);

    // Vérifie le message de validation
    expect(resultat.message).toBe("Coach validé avec succès");
    expect(resultat.statut_validation).toBe("valide");
  });

  it("TU-037 — validerCoach : doit rejeter un coach avec le bon message", async () => {
    // Simule un coach rejeté (satut_validation = false)
    depotAdmin.validerCoach.mockResolvedValue({
      id: 1,
      statut_validation: "rejete",
    });

    const resultat = await serviceAdmin.validerCoach(1, false);

    // Vérifie que le message de rejet est correct
    expect(resultat.message).toBe("Coach rejeté");
    expect(resultat.statut_validation).toBe("rejete");
  });

  //  creerSport ─

  it("TU-038 — creerSport : doit rejeter si nom vide", async () => {
    // Teste avec une chaîne vide
    await expect(serviceAdmin.creerSport("")).rejects.toThrow(
      "Le nom du sport est obligatoire",
    );
  });

  it("TU-039 — creerSport : doit rejeter si nom est null", async () => {
    await expect(serviceAdmin.creerSport(null)).rejects.toThrow(
      "Le nom du sport est obligatoire",
    );
  });

  it("TU-040 — creerSport : doit rejeter si sport existe déjà (doublon P2002)", async () => {
    // Simule une erreur de doublon retournée par Prisma
    const erreurDoublon = new Error("Unique constraint failed");
    erreurDoublon.code = "P2002";
    depotAdmin.creerSport.mockRejectedValue(erreurDoublon);

    await expect(serviceAdmin.creerSport("Tennis")).rejects.toThrow(
      "Ce sport existe déjà",
    );
  });

  it("TU-041 — creerSport : doit créer un sport avec succès", async () => {
    // Simule la création réussie d'un sport
    depotAdmin.creerSport.mockResolvedValue({ id: 7, nom: "Padel" });

    const sport = await serviceAdmin.creerSport("Padel");

    expect(sport.nom).toBe("Padel");
  });

  //  obtenirStatistiques

  it("TU-042 — obtenirStatistiques : doit retourner les statistiques", async () => {
    // Simule les statistiques retournées par le repository
    depotAdmin.obtenirStatistiques.mockResolvedValue({
      totalUtilisateurs: 10,
      totalCoachs: 3,
      totalReservations: 25,
      coachsEnAttente: 2,
    });

    const stats = await serviceAdmin.obtenirStatistiques();

    expect(stats.totalUtilisateurs).toBe(10);
    expect(stats.coachsEnAttente).toBe(2);
  });
});
