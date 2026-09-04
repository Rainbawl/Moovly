import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.ts";

const adaptateur = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: adaptateur });

// Récupère tous les coachs en attente de validation
export const trouverCoachsEnAttente = async () => {
  return prisma.coach.findMany({
    where: { est_valide: false },
    include: {
      utilisateur: {
        select: {
          nom: true,
          prenom: true,
          email: true,
          date_creation: true,
        },
      },
      sports: {
        include: { sport: true },
      },
    },
  });
};

// Valide ou rejette un coach
export const validerCoach = async (coachId, estValide) => {
  return prisma.coach.update({
    where: { id: parseInt(coachId) },
    data: { est_valide: estValide },
  });
};

// Récupère tous les sports
export const trouverTousLesSports = async () => {
  return prisma.sport.findMany({
    orderBy: { nom: "asc" },
  });
};

// Crée un nouveau sport
export const creerSport = async (nom) => {
  return prisma.sport.create({
    data: { nom },
  });
};

// Récupère les statistiques globales
export const obtenirStatistiques = async () => {
  const totalUtilisateurs = await prisma.utilisateur.count();
  const totalCoachs = await prisma.coach.count({ where: { est_valide: true } });
  const totalReservations = await prisma.reservation.count();
  const coachsEnAttente = await prisma.coach.count({
    where: { est_valide: false },
  });

  return {
    totalUtilisateurs,
    totalCoachs,
    totalReservations,
    coachsEnAttente,
  };
};
