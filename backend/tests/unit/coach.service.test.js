import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/repositories/coach.repository.js", () => ({
  trouverTousLesCoachs: vi.fn(),
  trouverCoachParId: vi.fn(),
}));

import * as depotCoach from "../../src/repositories/coach.repository.js";
import * as serviceCoach from "../../src/services/coach.service.js";

describe("Coach Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── obtenirTousLesCoachs ──────────────────────────────────────
  it("TU-025 — obtenirTousLesCoachs : doit retourner tableau vide si aucun coach", async () => {
    depotCoach.trouverTousLesCoachs.mockResolvedValue([]);

    const coachs = await serviceCoach.obtenirTousLesCoachs({});

    expect(coachs).toHaveLength(0);
  });

  it("TU-026 — obtenirTousLesCoachs : doit retourner les coachs formatés", async () => {
    depotCoach.trouverTousLesCoachs.mockResolvedValue([
      {
        id: 1,
        presentation: "Coach running",
        tarif_horaire: 35,
        note_moyenne: 4.9,
        utilisateur: {
          nom: "Lebrun",
          prenom: "Thomas",
          email: "thomas@test.fr",
        },
        sports: [{ sport: { nom: "Running" } }, { sport: { nom: "Tennis" } }],
      },
    ]);

    const coachs = await serviceCoach.obtenirTousLesCoachs({});

    expect(coachs).toHaveLength(1);
    expect(coachs[0].nom).toBe("Lebrun");
    expect(coachs[0].sports).toContain("Running");
    expect(coachs[0].sports).toContain("Tennis");
  });

  // ── obtenirCoachParId ─────────────────────────────────────────
  it("TU-027 — obtenirCoachParId : doit retourner 404 si coach introuvable", async () => {
    depotCoach.trouverCoachParId.mockResolvedValue(null);

    await expect(serviceCoach.obtenirCoachParId(999)).rejects.toThrow(
      "Coach introuvable",
    );
  });

  it("TU-028 — obtenirCoachParId : doit retourner le profil complet du coach", async () => {
    depotCoach.trouverCoachParId.mockResolvedValue({
      id: 1,
      presentation: "Coach running",
      tarif_horaire: 35,
      note_moyenne: 4.9,
      est_valide: true,
      utilisateur: {
        nom: "Lebrun",
        prenom: "Thomas",
        email: "thomas@test.fr",
      },
      sports: [{ sport: { nom: "Running" } }],
    });

    const coach = await serviceCoach.obtenirCoachParId(1);

    expect(coach.id).toBe(1);
    expect(coach.nom).toBe("Lebrun");
    expect(coach.est_valide).toBe(true);
    expect(coach.sports).toContain("Running");
  });
});
