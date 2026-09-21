import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Cherche un utilisateur par son email
export const findUserByEmail = async (email) => {
  return prisma.utilisateur.findUnique({ where: { email } });
};

// Cherche un utilisateur par son id (utilisé pour le refresh token)
export const findUserById = async (id) => {
  return prisma.utilisateur.findUnique({ where: { id: parseInt(id) } });
};

// Crée un nouvel utilisateur en BDD
export const createUser = async (data) => {
  return prisma.utilisateur.create({
    data: {
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      mot_de_passe: data.mot_de_passe,
      role: data.role,
    },
  });
};

// Crée le profil coach lié à un utilisateur

export const createCoach = async (utilisateurId, infosCoach = {}) => {
  return prisma.coach.create({
    data: {
      utilisateur_id: utilisateurId,
      statut_validation: "en_attente",
      presentation: infosCoach.presentation || null,
      diplome: infosCoach.diplome || null,
      tarif_horaire: infosCoach.tarif_horaire || null,
    },
  });
};
