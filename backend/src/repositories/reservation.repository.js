import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.ts";

const adaptateur = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: adaptateur });

// Réserve un créneau avec SELECT FOR UPDATE (ADR-05)
// Empêche les doubles réservations simultanées
export const creerReservation = async (utilisateurId, creneauId) => {
  return prisma.$transaction(async (transaction) => {
    const creneaux = await transaction.$queryRaw`
      SELECT * FROM creneaux
      WHERE id = ${parseInt(creneauId)}
      FOR UPDATE
    `;
    const creneau = creneaux[0];

    if (!creneau) {
      const erreur = new Error("Créneau introuvable");
      erreur.status = 404;
      throw erreur;
    }

    if (creneau.statut !== "disponible") {
      const erreur = new Error("Ce créneau n'est plus disponible");
      erreur.status = 409;
      throw erreur;
    }

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

    await transaction.creneau.update({
      where: { id: parseInt(creneauId) },
      data: {
        statut: "en_attente",
        verrouille_jusqua: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

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
    include: {
      creneau: {
        include: {
          coach: true,
        },
      },
    },
  });
};

// Annule une réservation, libère le créneau
export const annulerReservation = async (identifiant) => {
  return prisma.$transaction(async (transaction) => {
    const reservation = await transaction.reservation.update({
      where: { id: parseInt(identifiant) },
      data: {
        statut: "annulee",
        date_annulation: new Date(),
      },
    });

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

// Change le statut d'une réservation (utilisé par le coach : accepter/refuser)
export const changerStatutReservation = async (
  reservationId,
  nouveauStatut,
) => {
  return prisma.$transaction(async (transaction) => {
    const reservation = await transaction.reservation.update({
      where: { id: parseInt(reservationId) },
      data: { statut: nouveauStatut },
    });

    // Si refusée, on libère le créneau pour qu'il redevienne disponible
    if (nouveauStatut === "refusee") {
      await transaction.creneau.update({
        where: { id: reservation.creneau_id },
        data: { statut: "disponible", verrouille_jusqua: null },
      });
    } else if (nouveauStatut === "confirmee") {
      await transaction.creneau.update({
        where: { id: reservation.creneau_id },
        data: { statut: "reserve" },
      });
    }

    return reservation;
  });
};
