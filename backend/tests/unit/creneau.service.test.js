import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/repositories/creneau.repository.js", () => ({
  trouverCreneauxParCoachEtDate: vi.fn(),
  creerCreneau: vi.fn(),
  trouverCreneauParId: vi.fn(),
}));

vi.mock("../../src/repositories/coach.repository.js", () => ({
  trouverCoachParId: vi.fn(),
  trouverTousLesCoachs: vi.fn(),
}));

import * as depotCreneau from "../../src/repositories/creneau.repository.js";
import * as depotCoach from "../../src/repositories/coach.repository.js";
import * as serviceCreneau from "../../src/services/creneau.service.js";

describe("Creneau Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── obtenirCreneauxCoach ──────────────────────────────────────
  it("TU-011 — obtenirCreneauxCoach : doit retourner 404 si coach introuvable", async () => {
    depotCoach.trouverCoachParId.mockResolvedValue(null);

    await expect(
      serviceCreneau.obtenirCreneauxCoach(999, "2026-08-10"),
    ).rejects.toThrow("Coach introuvable");
  });

  it("TU-012 — obtenirCreneauxCoach : doit retourner les créneaux avec horaires", async () => {
    depotCoach.trouverCoachParId.mockResolvedValue({ id: 1, est_valide: true });
    depotCreneau.trouverCreneauxParCoachEtDate.mockResolvedValue([
      { id: 1, date: "2026-08-10", periode: "matin", statut: "disponible" },
      {
        id: 2,
        date: "2026-08-10",
        periode: "apres_midi",
        statut: "disponible",
      },
    ]);

    const creneaux = await serviceCreneau.obtenirCreneauxCoach(1, "2026-08-10");

    expect(creneaux).toHaveLength(2);
    expect(creneaux[0].horaire).toBe("8h00 - 12h00");
    expect(creneaux[1].horaire).toBe("14h00 - 18h00");
  });

  // ── creerCreneau ─────────────────────────────────────────────
  it("TU-013 — creerCreneau : doit rejeter une période invalide", async () => {
    await expect(
      serviceCreneau.creerCreneau(1, "2026-08-10", "soir"),
    ).rejects.toThrow("Période invalide");
  });

  it("TU-014 — creerCreneau : doit rejeter si coach non validé", async () => {
    depotCoach.trouverCoachParId.mockResolvedValue({
      id: 1,
      est_valide: false,
    });

    await expect(
      serviceCreneau.creerCreneau(1, "2026-08-10", "matin"),
    ).rejects.toThrow("Votre compte coach n'est pas encore validé");
  });

  it("TU-015 — creerCreneau : doit créer un créneau matin avec succès", async () => {
    depotCoach.trouverCoachParId.mockResolvedValue({ id: 1, est_valide: true });
    depotCreneau.creerCreneau.mockResolvedValue({
      id: 1,
      date: "2026-08-10",
      periode: "matin",
      statut: "disponible",
    });

    const creneau = await serviceCreneau.creerCreneau(1, "2026-08-10", "matin");

    expect(creneau.periode).toBe("matin");
    expect(creneau.horaire).toBe("8h00 - 12h00");
    expect(creneau.statut).toBe("disponible");
  });

  it("TU-016 — creerCreneau : doit rejeter un doublon (même date + période)", async () => {
    depotCoach.trouverCoachParId.mockResolvedValue({ id: 1, est_valide: true });
    const erreurDoublon = new Error("Unique constraint failed");
    erreurDoublon.code = "P2002";
    depotCreneau.creerCreneau.mockRejectedValue(erreurDoublon);

    await expect(
      serviceCreneau.creerCreneau(1, "2026-08-10", "matin"),
    ).rejects.toThrow("Un créneau existe déjà");
  });
});
