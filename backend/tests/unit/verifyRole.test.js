import { describe, it, expect, vi } from "vitest";
import verifyRole from "../../src/middleware/verifyRole.js";

describe("Middleware verifyRole", () => {
  it("TU-001 — doit rejeter avec 401 si aucun utilisateur n'est défini", () => {
    const req = {}; // pas de req.user — simule un oubli de verifyToken
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    verifyRole("coach")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Non authentifié" });
    expect(next).not.toHaveBeenCalled();
  });

  it("TU-002 — doit rejeter avec 403 si le rôle n'est pas autorisé", () => {
    const req = { user: { role: "sportif" } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    verifyRole("coach", "admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("TU-003 — doit laisser passer si le rôle est autorisé", () => {
    const req = { user: { role: "coach" } };
    const res = { status: vi.fn(), json: vi.fn() };
    const next = vi.fn();

    verifyRole("coach", "admin")(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
