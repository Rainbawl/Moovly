import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import bcrypt from "bcrypt";

const adaptateur = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: adaptateur });

async function main() {
  console.log(" Début du seed...");

  //   Utilisateurs
  const hashSportif = await bcrypt.hash(process.env.SEED_PASSWORD_SPORTIF, 10);
  const hashCoach = await bcrypt.hash(process.env.SEED_PASSWORD_COACH, 10);
  const hashAdmin = await bcrypt.hash(process.env.SEED_PASSWORD_ADMIN, 10);

  const bocar = await prisma.utilisateur.upsert({
    where: { email: "bocar@test.fr" },
    update: {
      mot_de_passe: hashSportif,
      ville: "Paris",
    },
    create: {
      nom: "Mané",
      prenom: "bocar",
      email: "bocar@test.fr",
      mot_de_passe: hashSportif,
      role: "sportif",
      ville: "Paris",
    },
  });
  console.log("✅ Sportif créé :", bocar.email);

  const camille = await prisma.utilisateur.upsert({
    where: { email: "camille@test.fr" },
    update: {
      mot_de_passe: hashCoach,
      ville: "Lyon",
    },
    create: {
      nom: "eponime",
      prenom: "camille",
      email: "camille@test.fr",
      mot_de_passe: hashCoach,
      role: "coach",
      ville: "Lyon",
    },
  });
  console.log("✅ Coach créé :", camille.email);

  const admin = await prisma.utilisateur.upsert({
    where: { email: "admin@moovly.fr" },
    update: {
      mot_de_passe: hashAdmin,
      ville: "Créteil",
    },
    create: {
      nom: "admin",
      prenom: "afif",
      email: "admin@moovly.fr",
      mot_de_passe: hashAdmin,
      role: "admin",
      ville: "Créteil",
    },
  });
  console.log("✅ Admin créé :", admin.email);

  //   Profil coach
  await prisma.coach.upsert({
    where: { utilisateur_id: camille.id },
    update: {
      statut_validation: "valide",
    },
    create: {
      utilisateur_id: camille.id,
      statut_validation: "valide", // Déjà validé par l'admin
      presentation: "Coach running et cardio depuis 8 ans",
      tarif_horaire: 35,
    },
  });
  console.log("✅ Profil coach validé");

  //   Sports
  const sports = ["Tennis", "Running", "Yoga", "Boxe", "Natation", "Football"];
  for (const nom of sports) {
    await prisma.sport.upsert({
      where: { id: sports.indexOf(nom) + 1 },
      update: {},
      create: { nom },
    });
  }
  console.log("✅ Sports créés :", sports.join(", "));

  console.log(" Seed terminé !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
