import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";

// On simule le repository pour ne pas toucher la vraie BDD
vi.mock("../../src/repositories/auth.repository.js", () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  createCoach: vi.fn(),
}));

import * as authRepository from "../../src/repositories/auth.repository.js";
import * as authService from "../../src/services/auth.service.js";

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Réinitialise les mocks avant chaque test
  });

  //  hashPassword
  it("TU-001 — hashPassword : doit hasher le mot de passe", async () => {
    const motDePasse = "pass320";
    const hash = await authService.hashPassword(motDePasse);

    // Le hash doit être différent du mot de passe original
    expect(hash).not.toBe(motDePasse);
    // Le hash bcrypt commence toujours par $2b$
    expect(hash).toMatch(/^\$2b\$/);
  });

  it("TU-002 — comparePassword : doit valider un mot de passe correct", async () => {
    const motDePasse = "pass635";
    const hash = await authService.hashPassword(motDePasse);
    const resultat = await authService.comparePassword(motDePasse, hash);

    expect(resultat).toBe(true);
  });

  it("TU-003 — comparePassword : doit rejeter un mot de passe incorrect", async () => {
    const hash = await authService.hashPassword("password123");
    const resultat = await authService.comparePassword("mauvaismdp", hash);

    expect(resultat).toBe(false);
  });

  //  generateAccessToken ─
  it("TU-004 — generateAccessToken : doit générer un token JWT valide", async () => {
    const utilisateur = { id: 1, role: "sportif" };
    const token = authService.generateAccessToken(utilisateur);

    // Un JWT a toujours 3 parties séparées par des points
    expect(token.split(".")).toHaveLength(3);
  });

  //  register ─
  it("TU-005 — register : doit rejeter un email déjà utilisé", async () => {
    // Simule qu'un utilisateur existe déjà avec cet email
    authRepository.findUserByEmail.mockResolvedValue({
      id: 1,
      email: "jean@test.fr",
    });

    await expect(
      authService.register({
        nom: "Dupont",
        prenom: "Jean",
        email: "jean@test.fr",
        mot_de_passe: "password123",
        role: "sportif",
      }),
    ).rejects.toThrow("Email déjà utilisé");
  });

  it("TU-006 — register : doit créer un sportif avec succès", async () => {
    // Simule qu'aucun utilisateur n'existe avec cet email
    authRepository.findUserByEmail.mockResolvedValue(null);
    authRepository.createUser.mockResolvedValue({
      id: 1,
      nom: "Dupont",
      prenom: "Jean",
      email: "jean@test.fr",
      role: "sportif",
    });

    const utilisateur = await authService.register({
      nom: "Dupont",
      prenom: "Jean",
      email: "jean@test.fr",
      mot_de_passe: "pass635",
      role: "sportif",
    });

    expect(utilisateur.email).toBe("jean@test.fr");
    expect(utilisateur.role).toBe("sportif");
    // Vérifie que createCoach n'a PAS été appelé pour un sportif
    expect(authRepository.createCoach).not.toHaveBeenCalled();
  });

  it("TU-007 — register : doit créer un profil coach si rôle coach", async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);
    authRepository.createUser.mockResolvedValue({
      id: 2,
      email: "thomas@test.fr",
      role: "coach",
    });
    authRepository.createCoach.mockResolvedValue({ id: 1, utilisateur_id: 2 });

    await authService.register({
      nom: "Lebrun",
      prenom: "Thomas",
      email: "thomas@test.fr",
      mot_de_passe: "pass940",
      role: "coach",
    });

    // Vérifie que createCoach A été appelé pour un coach
    expect(authRepository.createCoach).toHaveBeenCalledWith(2, {
      presentation: undefined,
      diplome: undefined,
      tarif_horaire: undefined,
    });
  });

  //  login
  it("TU-008 — login : doit rejeter un email inexistant", async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);

    await expect(
      authService.login("inconnu@test.fr", "password123"),
    ).rejects.toThrow("Identifiants invalides");
  });

  it("TU-009 — login : doit rejeter un mauvais mot de passe", async () => {
    const hash = await authService.hashPassword("password123");
    authRepository.findUserByEmail.mockResolvedValue({
      id: 1,
      email: "jean@test.fr",
      mot_de_passe: hash,
      role: "sportif",
    });

    await expect(
      authService.login("jean@test.fr", "mauvaismdp"),
    ).rejects.toThrow("Identifiants invalides");
  });

  it("TU-010 — login : doit retourner un token JWT si connexion valide", async () => {
    const hash = await authService.hashPassword("password123");
    authRepository.findUserByEmail.mockResolvedValue({
      id: 1,
      email: "jean@test.fr",
      mot_de_passe: hash,
      role: "sportif",
    });

    const resultat = await authService.login("jean@test.fr", "password123");

    expect(resultat.accessToken).toBeDefined();
    expect(resultat.user.email).toBe("jean@test.fr");
  });
});
