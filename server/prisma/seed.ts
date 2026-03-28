import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const connectionString = `${process.env.DATABASE_URL ?? ""}`;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL for prisma seed.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting KamaGame seed...");

  // ==================== ADMIN USER ====================
  const adminEmail = "admin@kamagame.com";
  const adminPassword = "Admin@123456"; // CHANGE THIS IN PRODUCTION!
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
    },
    create: {
      email: adminEmail,
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  console.log(`✅ Admin user: ${adminEmail} (Password: ${adminPassword})`);

  // ==================== TOP LEVEL CONTENT ====================
  const category = await prisma.category.upsert({
    where: { slug: "ancient-africa" },
    update: {
      name: "Ancient Africa",
      description: "Learn African history through interactive lessons.",
    },
    create: {
      name: "Ancient Africa",
      slug: "ancient-africa",
      description: "Learn African history through interactive lessons.",
      order: 0,
    },
  });

  const topic = await prisma.topic.upsert({
    where: { slug: "african-civilizations" },
    update: {
      name: "African Civilizations",
      description: "Explore key civilizations and their legacies.",
    },
    create: {
      name: "African Civilizations",
      slug: "african-civilizations",
      description: "Explore key civilizations and their legacies.",
      parentId: null,
    },
  });

  const lessonSlug = "kama-intro-to-african-civilizations";
  const lesson = await prisma.lesson.upsert({
    where: { slug: lessonSlug },
    update: {
      title: "Intro: African Civilizations",
      description: "A short introduction to key African civilizations.",
      content:
        "## Welcome\n\nAfrica is home to civilizations with deep history, innovation, and cultural influence.\n",
      hook: "Start your journey into African history.",
      published: true,
      xpReward: 10,
      isPremium: false,
      categoryId: category.id,
      topicId: topic.id,
      order: 0,
    },
    create: {
      title: "Intro: African Civilizations",
      slug: lessonSlug,
      description: "A short introduction to key African civilizations.",
      content:
        "## Welcome\n\nAfrica is home to civilizations with deep history, innovation, and cultural influence.\n",
      hook: "Start your journey into African history.",
      published: true,
      xpReward: 10,
      isPremium: false,
      categoryId: category.id,
      topicId: topic.id,
      order: 0,
    },
  });

  // ==================== LESSON TRANSLATION ====================
  // There is no separate Language table in your schema; translations store language as a String.
  const lessonTranslationExisting = await prisma.lessonTranslation.findFirst({
    where: { lessonId: lesson.id, language: "en" },
    select: { id: true },
  });

  if (!lessonTranslationExisting) {
    await prisma.lessonTranslation.create({
      data: {
        lessonId: lesson.id,
        language: "en",
        title: "Intro: African Civilizations",
        description: "A short introduction to key African civilizations.",
        hook: lesson.hook ?? undefined,
        content: lesson.content,
      },
    });
  }

  // ==================== CHAPTERS + QUIZZES ====================
  const chapterCount = await prisma.chapter.count({
    where: { lessonId: lesson.id },
  });
  if (chapterCount === 0) {
    await prisma.chapter.createMany({
      data: [
        {
          lessonId: lesson.id,
          title: "Chapter 1: Origins",
          content:
            "African civilizations developed through diverse regions, trade, governance, and knowledge systems.",
          order: 0,
          mediaType: "none",
          mediaUrl: null,
          feedbackQuestion: null,
        },
        {
          lessonId: lesson.id,
          title: "Chapter 2: Legacy",
          content:
            "Their legacies include architecture, astronomy, metallurgy, writing, and storytelling.",
          order: 1,
          mediaType: "none",
          mediaUrl: null,
          feedbackQuestion: null,
        },
      ],
    });
  }

  const quizCount = await prisma.quiz.count({
    where: { lessonId: lesson.id },
  });
  if (quizCount === 0) {
    await prisma.quiz.create({
      data: {
        lessonId: lesson.id,
        question:
          "Which region is home to many early civilizations with deep historical influence?",
        options: ["Europe", "Africa", "Antarctica", "Oceania"],
        correctOption: 1,
        explanation:
          "Africa has been home to many civilizations with lasting cultural and intellectual legacies.",
        order: 0,
        heartLimit: 4,
        timeLimitSeconds: null,
        difficulty: "easy",
        isActive: true,
        tags: ["intro", "history"],
        topicId: topic.id,
      },
    });
  }

  // ==================== CHARACTER ====================
  const character = await prisma.character.upsert({
    where: { slug: "kama-the-historian" },
    update: {
      name: "Kama the Historian",
      description:
        "A fictional guide that helps players learn African history.",
      story:
        "Kama collects stories, facts, and legends from across the continent.",
      categoryId: category.id,
      unlockLessonId: lesson.id,
      rarityLevel: "common",
    },
    create: {
      name: "Kama the Historian",
      slug: "kama-the-historian",
      description:
        "A fictional guide that helps players learn African history.",
      story:
        "Kama collects stories, facts, and legends from across the continent.",
      imageUrl: null,
      inventionImage: null,
      categoryId: category.id,
      xpThreshold: null,
      rarityLevel: "common",
      unlockLessonId: lesson.id,
    },
  });

  const characterTranslationExisting =
    await prisma.characterTranslation.findFirst({
      where: { characterId: character.id, language: "en" },
      select: { id: true },
    });

  if (!characterTranslationExisting) {
    await prisma.characterTranslation.create({
      data: {
        characterId: character.id,
        language: "en",
        name: "Kama",
        description: "Your guide for African history.",
        story: "Kama learns and shares stories.",
      },
    });
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
