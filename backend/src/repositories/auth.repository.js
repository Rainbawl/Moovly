import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Cherche un utilisateur par son email
export const findUserByEmail = async (email) => {
  return prisma.utilisateur.findUnique({ where: { email } });
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
export const createCoach = async (utilisateurId) => {
  return prisma.coach.create({
    data: {
      utilisateur_id: utilisateurId,
      est_valide: false,
    },
  });
};
