import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.ts";

const adaptateur = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: adaptateur });

// Récupère tous les coachs validés (les filtres sport/ville sont appliqués par le service)
export const trouverTousLesCoachs = async () => {
  return prisma.coach.findMany({
    where: {
      statut_validation: "valide",
    },
    include: {
      utilisateur: {
        select: {
          nom: true,
          prenom: true,
          email: true,
          ville: true,
        },
      },
      sports: {
        include: {
          sport: true,
        },
      },
    },
  });
};

// Récupère un coach par son identifiant
export const trouverCoachParId = async (identifiant) => {
  return prisma.coach.findUnique({
    where: { id: parseInt(identifiant) },
    include: {
      utilisateur: {
        select: {
          nom: true,
          prenom: true,
          email: true,
          ville: true,
        },
      },
      sports: {
        include: {
          sport: true,
        },
      },
    },
  });
};
