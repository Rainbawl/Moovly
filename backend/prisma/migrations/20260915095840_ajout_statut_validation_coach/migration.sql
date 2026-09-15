/*
  Warnings:

  - You are about to drop the column `est_valide` on the `coachs` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StatutValidation" AS ENUM ('en_attente', 'valide', 'rejete');

-- AlterTable
ALTER TABLE "coachs" DROP COLUMN "est_valide",
ADD COLUMN     "statut_validation" "StatutValidation" NOT NULL DEFAULT 'en_attente';
