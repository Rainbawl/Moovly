import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.ts";

const adaptateur = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: adaptateur });

// Réserve un créneau avec SELECT FOR UPDATE (ADR-05)
// Empêche les doubles réservations simultanées
export const creerReservation = async (utilisateurId, creneauId) => {
  return prisma.$transaction(async (transaction) => {
    // SELECT FOR UPDATE — verrouille la ligne en BDD
    // Si une autre requête essaie d'accéder à ce créneau en même temps
    // elle devra attendre que cette transaction soit terminée
    const creneaux = await transaction.$queryRaw`
      SELECT * FROM creneaux
      WHERE id = ${parseInt(creneauId)}
      FOR UPDATE
    `;
    const creneau = creneaux[0];

    // Vérifie que le créneau existe
    if (!creneau) {
      const erreur = new Error("Créneau introuvable");
      erreur.status = 404;
      throw erreur;
    }

    // Vérifie que le créneau est disponible
    if (creneau.statut !== "disponible") {
      const erreur = new Error("Ce créneau n'est plus disponible");
      erreur.status = 409;
      throw erreur;
    }

    // Vérifie que le verrou de 10 minutes n'est pas actif
    if (
      creneau.verrouille_jusqua &&
      new Date(creneau.verrouille_jusqua) > new Date()
    ) {
      const erreur = new Error(
        "Ce créneau est en cours de réservation, réessayez dans quelques minutes",
      );
      erreur.status = 409;
      throw erreur;
    }

    // Verrouille le créneau pendant 10 minutes
    await transaction.creneau.update({
      where: { id: parseInt(creneauId) },
      data: {
        statut: "en_attente",
        verrouille_jusqua: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Crée la réservation
    const reservation = await transaction.reservation.create({
      data: {
        utilisateur_id: parseInt(utilisateurId),
        creneau_id: parseInt(creneauId),
        statut: "en_attente",
      },
    });

    return reservation;
  });
};

// Récupère toutes les réservations d'un utilisateur
export const trouverReservationsParUtilisateur = async (utilisateurId) => {
  return prisma.reservation.findMany({
    where: { utilisateur_id: parseInt(utilisateurId) },
    include: {
      creneau: {
        include: {
          coach: {
            include: {
              utilisateur: {
                select: { nom: true, prenom: true },
              },
            },
          },
        },
      },
    },
    orderBy: { date_reservation: "desc" },
  });
};

// Récupère une réservation par son identifiant
export const trouverReservationParId = async (identifiant) => {
  return prisma.reservation.findUnique({
    where: { id: parseInt(identifiant) },
    include: { creneau: true },
  });
};

// Annule une réservation et libère le créneau
export const annulerReservation = async (identifiant) => {
  return prisma.$transaction(async (transaction) => {
    const reservation = await transaction.reservation.update({
      where: { id: parseInt(identifiant) },
      data: {
        statut: "annulee",
        date_annulation: new Date(),
      },
    });

    // Remet le créneau disponible
    await transaction.creneau.update({
      where: { id: reservation.creneau_id },
      data: {
        statut: "disponible",
        verrouille_jusqua: null,
      },
    });

    return reservation;
  });
};
