import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.ts";

const adaptateur = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: adaptateur });

// Récupère les créneaux d'un coach pour une date donnée
export const trouverCreneauxParCoachEtDate = async (coachId, date) => {
  return prisma.creneau.findMany({
    where: {
      coach_id: parseInt(coachId),
      date: new Date(date),
    },
    orderBy: {
      periode: "asc", // matin avant apres_midi
    },
  });
};

// Crée un nouveau créneau pour un coach
export const creerCreneau = async (coachId, date, periode) => {
  return prisma.creneau.create({
    data: {
      coach_id: parseInt(coachId),
      date: new Date(date),
      periode: periode,
      statut: "disponible",
    },
  });
};

// Récupère un créneau par son identifiant (utilisé pour la réservation)
export const trouverCreneauParId = async (identifiant) => {
  return prisma.creneau.findUnique({
    where: { id: parseInt(identifiant) },
  });
};
