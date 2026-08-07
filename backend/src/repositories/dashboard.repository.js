import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.ts";

const adaptateur = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: adaptateur });

// Récupère le planning du coach connecté (ses créneaux + réservations)
export const trouverPlanningCoach = async (utilisateurId) => {
  return prisma.coach.findUnique({
    where: { utilisateur_id: parseInt(utilisateurId) },
    include: {
      creneaux: {
        include: {
          reservations: {
            include: {
              utilisateur: {
                select: {
                  nom: true,
                  prenom: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { date: "asc" },
      },
    },
  });
};

// Récupère les statistiques du coach connecté
export const trouverStatistiquesCoach = async (utilisateurId) => {
  const coach = await prisma.coach.findUnique({
    where: { utilisateur_id: parseInt(utilisateurId) },
  });

  if (!coach) return null;

  const totalCreneaux = await prisma.creneau.count({
    where: { coach_id: coach.id },
  });

  const totalReservations = await prisma.reservation.count({
    where: {
      creneau: { coach_id: coach.id },
    },
  });

  const creneauxDisponibles = await prisma.creneau.count({
    where: {
      coach_id: coach.id,
      statut: "disponible",
    },
  });

  return {
    totalCreneaux,
    totalReservations,
    creneauxDisponibles,
  };
};
