import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import bcrypt from "bcrypt";

const adaptateur = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: adaptateur });

async function main() {
  console.log("🌱 Début du seed...");

  //   Utilisateurs
  const hashSportif = await bcrypt.hash("password123", 10);
  const hashCoach = await bcrypt.hash("password123", 10);
  const hashAdmin = await bcrypt.hash("admin123", 10);

  const jean = await prisma.utilisateur.upsert({
    where: { email: "jean@test.fr" },
    update: {},
    create: {
      nom: "Dupont",
      prenom: "Jean",
      email: "jean@test.fr",
      mot_de_passe: hashSportif,
      role: "sportif",
    },
  });
  console.log("✅ Sportif créé :", jean.email);

  const thomas = await prisma.utilisateur.upsert({
    where: { email: "thomas@test.fr" },
    update: {},
    create: {
      nom: "Lebrun",
      prenom: "Thomas",
      email: "thomas@test.fr",
      mot_de_passe: hashCoach,
      role: "coach",
    },
  });
  console.log("✅ Coach créé :", thomas.email);

  const admin = await prisma.utilisateur.upsert({
    where: { email: "admin@moovly.fr" },
    update: {},
    create: {
      nom: "Admin",
      prenom: "Moovly",
      email: "admin@moovly.fr",
      mot_de_passe: hashAdmin,
      role: "admin",
    },
  });
  console.log("✅ Admin créé :", admin.email);

  //   Profil coach
  const coachProfil = await prisma.coach.upsert({
    where: { utilisateur_id: thomas.id },
    update: {},
    create: {
      utilisateur_id: thomas.id,
      est_valide: true, // Déjà validé par l'admin
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

  console.log("🎉 Seed terminé !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
