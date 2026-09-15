import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.ts";

const adaptateur = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: adaptateur });

// Récupère tous les coachs validés avec filtres optionnels sport/ville
export const trouverTousLesCoachs = async ({ sport, ville } = {}) => {
  return prisma.coach.findMany({
    where: {
      statut_validation: "valide",
      ...(sport && {
        sports: {
          some: {
            sport: {
              nom: { contains: sport, mode: "insensitive" },
            },
          },
        },
      }),
      ...(ville && {
        utilisateur: {
          ville: { contains: ville, mode: "insensitive" },
        },
      }),
    },
    include: {
      utilisateur: {
        select: {
          nom: true,
          prenom: true,
          email: true,
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
