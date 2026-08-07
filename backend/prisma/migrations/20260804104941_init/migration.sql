-- CreateEnum
CREATE TYPE "Role" AS ENUM ('sportif', 'coach', 'admin');

-- CreateEnum
CREATE TYPE "Periode" AS ENUM ('matin', 'apres_midi');

-- CreateEnum
CREATE TYPE "StatutCreneau" AS ENUM ('disponible', 'en_attente', 'reserve', 'annule');

-- CreateEnum
CREATE TYPE "StatutReservation" AS ENUM ('en_attente', 'confirmee', 'annulee', 'terminee');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mot_de_passe" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'sportif',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coachs" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "presentation" TEXT,
    "tarif_horaire" DECIMAL(8,2),
    "est_valide" BOOLEAN NOT NULL DEFAULT false,
    "note_moyenne" DECIMAL(3,2),
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coachs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,

    CONSTRAINT "sports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coachs_sports" (
    "coach_id" INTEGER NOT NULL,
    "sport_id" INTEGER NOT NULL,

    CONSTRAINT "coachs_sports_pkey" PRIMARY KEY ("coach_id","sport_id")
);

-- CreateTable
CREATE TABLE "creneaux" (
    "id" SERIAL NOT NULL,
    "coach_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "periode" "Periode" NOT NULL,
    "statut" "StatutCreneau" NOT NULL DEFAULT 'disponible',
    "verrouille_jusqua" TIMESTAMP(3),

    CONSTRAINT "creneaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "creneau_id" INTEGER NOT NULL,
    "statut" "StatutReservation" NOT NULL DEFAULT 'en_attente',
    "date_reservation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_annulation" TIMESTAMP(3),

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "coachs_utilisateur_id_key" ON "coachs"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "creneaux_coach_id_date_periode_key" ON "creneaux"("coach_id", "date", "periode");

-- AddForeignKey
ALTER TABLE "coachs" ADD CONSTRAINT "coachs_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coachs_sports" ADD CONSTRAINT "coachs_sports_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coachs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coachs_sports" ADD CONSTRAINT "coachs_sports_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creneaux" ADD CONSTRAINT "creneaux_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coachs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_creneau_id_fkey" FOREIGN KEY ("creneau_id") REFERENCES "creneaux"("id") ON DELETE CASCADE ON UPDATE CASCADE;
