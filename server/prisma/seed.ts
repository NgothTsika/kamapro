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
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@ngoth09";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: adminEmail,
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log(`✅ Admin user: ${adminEmail} (Password: ${adminPassword})`);

  // ==================== CATEGORIES ====================
  // Representative subset – expand as needed
  const categoriesData = [
    // Top-level
    {
      name: "Africa",
      slug: "africa",
      parentSlug: null,
      description: "The birthplace of humanity",
      order: 0,
    },
    {
      name: "Diaspora",
      slug: "diaspora",
      parentSlug: null,
      description: "African diaspora communities",
      order: 1,
    },
    {
      name: "Ancient Civilizations",
      slug: "ancient-civilizations",
      parentSlug: null,
      description: "Early African civilizations",
      order: 2,
    },
    {
      name: "Empires & Kingdoms",
      slug: "empires-kingdoms",
      parentSlug: null,
      description: "Medieval African empires",
      order: 3,
    },
    // Subcategories (example)
    {
      name: "West Africa",
      slug: "west-africa",
      parentSlug: "africa",
      description: "West African region",
      order: 0,
    },
    {
      name: "Ancient Egypt",
      slug: "ancient-egypt",
      parentSlug: "ancient-civilizations",
      description: "Egyptian civilization",
      order: 0,
    },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        order: cat.order,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        order: cat.order,
      },
    });
  }
  console.log(`✅ Created/updated ${categoriesData.length} categories`);

  const ancientCategory = await prisma.category.findUnique({
    where: { slug: "ancient-civilizations" },
  });
  if (!ancientCategory)
    throw new Error("Ancient civilizations category missing");

  // ==================== TOPIC ====================
  const topic = await prisma.topic.upsert({
    where: { slug: "african-history" },
    update: {},
    create: {
      name: "African History",
      slug: "african-history",
      description: "Explore the rich history of Africa",
    },
  });

  // ==================== MAIN LESSON ====================
  const lessonSlug = "intro-african-civilizations";
  const lesson = await prisma.lesson.upsert({
    where: { slug: lessonSlug },
    update: {
      title: "Introduction to African Civilizations",
      subtitle: "A journey through time",
      description: "Discover the great civilizations of Africa",
      hook: "Start your journey!",
      published: true,
      xpReward: 10,
      isPremium: false,
      categoryId: ancientCategory.id,
      topicId: topic.id,
      order: 0,
    },
    create: {
      title: "Introduction to African Civilizations",
      slug: lessonSlug,
      subtitle: "A journey through time",
      description: "Discover the great civilizations of Africa",
      hook: "Start your journey!",
      published: true,
      xpReward: 10,
      isPremium: false,
      categoryId: ancientCategory.id,
      topicId: topic.id,
      order: 0,
    },
  });

  // Lesson translation (optional)
  await prisma.lessonTranslation.upsert({
    where: { id: "dummy" }, // workaround – use findFirst logic
    update: {},
    create: {
      lessonId: lesson.id,
      language: "en",
      title: lesson.title,
      description: lesson.description || "",
      hook: lesson.hook || "",
    },
  });

  // ==================== CHAPTERS AND STEPS ====================
  const existingChapters = await prisma.chapter.findMany({
    where: { lessonId: lesson.id },
  });
  if (existingChapters.length === 0) {
    const chapter1 = await prisma.chapter.create({
      data: {
        lessonId: lesson.id,
        title: "The Nile Valley",
        introText:
          "The Nile River gave birth to one of the world's oldest civilizations.",
        order: 0,
        mediaType: "none",
      },
    });
    const chapter2 = await prisma.chapter.create({
      data: {
        lessonId: lesson.id,
        title: "West African Empires",
        introText:
          "Ghana, Mali, and Songhai – the gold trade and great leaders.",
        order: 1,
        mediaType: "none",
      },
    });

    await prisma.chapterStep.createMany({
      data: [
        {
          chapterId: chapter1.id,
          order: 0,
          type: "TEXT",
          content: {
            body: "Ancient Egypt and Nubia flourished along the Nile.",
          },
        },
        {
          chapterId: chapter1.id,
          order: 1,
          type: "CONTINUE_BUTTON",
          content: { label: "Next" },
        },
        {
          chapterId: chapter2.id,
          order: 0,
          type: "TEXT",
          content: {
            body: "Mansa Musa’s pilgrimage to Mecca showcased Mali's wealth.",
          },
        },
        {
          chapterId: chapter2.id,
          order: 1,
          type: "POLL",
          content: {
            question: "What interests you most?",
            options: [
              "Gold trade",
              "Timbuktu",
              "Islamic influence",
              "Art & architecture",
            ],
          },
        },
        {
          chapterId: chapter2.id,
          order: 2,
          type: "CONTINUE_BUTTON",
          content: { label: "Complete" },
        },
      ],
    });
    console.log("✅ Created chapters and steps");
  }

  // ==================== QUIZ ====================
  await prisma.quiz.upsert({
    where: { id: "dummy-quiz" }, // use findFirst
    update: {},
    create: {
      lessonId: lesson.id,
      question:
        "Which African empire was known for its wealth under Mansa Musa?",
      options: ["Ghana", "Mali", "Songhai", "Zimbabwe"],
      correctOption: 1,
      explanation: "Mali Empire, with Mansa Musa, was legendary for its gold.",
      order: 0,
      heartLimit: 4,
      difficulty: "easy",
      isActive: true,
      tags: ["history", "medieval"],
      topicId: topic.id,
    },
  });

  // ==================== CHARACTER ====================
  const character = await prisma.character.upsert({
    where: { slug: "kama-guide" },
    update: {},
    create: {
      name: "Kama",
      slug: "kama-guide",
      description: "Your wise guide through African history.",
      story: "Kama has traveled across centuries to collect stories.",
      rarityLevel: "common",
      entityType: "person",
      categories: { create: { categoryId: ancientCategory.id } },
    },
  });

  // Character translation
  await prisma.characterTranslation.upsert({
    where: { id: "dummy-char-trans" },
    update: {},
    create: {
      characterId: character.id,
      language: "en",
      name: "Kama",
      description: "Your guide",
      story: "Kama shares wisdom from the past.",
    },
  });

  // ==================== TEST USERS ====================
  const testUsers = [
    {
      email: "student1@kamagame.com",
      username: "student1",
      password: "Student123!",
      role: "USER",
    },
    {
      email: "student2@kamagame.com",
      username: "student2",
      password: "Student123!",
      role: "USER",
    },
    {
      email: "moderator@kamagame.com",
      username: "moderator",
      password: "Moderator123!",
      role: "MODERATOR",
    },
  ];

  for (const u of testUsers) {
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        username: u.username,
        passwordHash: hash,
        role: u.role as any,
        emailVerified: true,
      },
    });
  }
  console.log(`✅ Created ${testUsers.length} test users`);

  // ==================== ADDITIONAL LESSONS ====================
  const egyptCategory = await prisma.category.findUnique({
    where: { slug: "ancient-egypt" },
  });
  const moreLessons = [
    {
      title: "Ancient Egypt: Pyramids and Pharaohs",
      slug: "ancient-egypt-pyramids",
      subtitle: "Monuments of eternity",
      description: "Explore the wonders of ancient Egypt",
      content:
        "The pyramids of Giza, the Sphinx, and the pharaohs who built them.",
      hook: "Uncover the secrets of the pyramids",
      xpReward: 25,
      categoryId: egyptCategory?.id || ancientCategory.id,
      topicId: topic.id,
      published: true,
    },
    {
      title: "Mansa Musa and the Mali Empire",
      slug: "mansa-musa",
      subtitle: "The richest man in history",
      description: "The legendary pilgrimage of Mansa Musa",
      content: "Mansa Musa's hajj to Mecca put Mali on the world map.",
      hook: "Follow the golden trail",
      xpReward: 30,
      categoryId: ancientCategory.id,
      topicId: topic.id,
      published: true,
    },
  ];

  for (const ld of moreLessons) {
    await prisma.lesson.upsert({
      where: { slug: ld.slug },
      update: {},
      create: {
        title: ld.title,
        slug: ld.slug,
        subtitle: ld.subtitle,
        description: ld.description,
        hook: ld.hook,
        xpReward: ld.xpReward,
        categoryId: ld.categoryId,
        topicId: ld.topicId,
        published: ld.published,
      },
    });
  }
  console.log(`✅ Created ${moreLessons.length} additional lessons`);

  // ==================== ACHIEVEMENTS ====================
  const achievements = [
    {
      name: "First Step",
      description: "Complete your first lesson",
      xpRequired: 0,
    },
    { name: "Curious Mind", description: "Complete 5 lessons", xpRequired: 50 },
    { name: "History Buff", description: "Earn 200 XP", xpRequired: 200 },
  ];
  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { id: `dummy-${ach.name}` },
      update: {},
      create: {
        name: ach.name,
        description: ach.description,
        xpRequired: ach.xpRequired,
      },
    });
  }
  console.log(`✅ Created ${achievements.length} achievements`);

  // ==================== GAMIFICATION SETUP ====================
  const student1 = await prisma.user.findUnique({
    where: { email: "student1@kamagame.com" },
  });
  if (student1) {
    await prisma.userHearts.upsert({
      where: { userId: student1.id },
      update: {},
      create: { userId: student1.id, hearts: 5, maxHearts: 5 },
    });
    await prisma.userStreak.upsert({
      where: { userId: student1.id },
      update: {},
      create: {
        userId: student1.id,
        currentStreak: 3,
        longestStreak: 3,
        lastActivityAt: new Date(),
      },
    });
    await prisma.user.update({
      where: { id: student1.id },
      data: { xp: 120, streak: 3 },
    });
  }

  // ==================== DAILY CHALLENGES ====================
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.dailyChallenge.createMany({
    data: [
      {
        title: "Complete 1 lesson",
        challengeType: "lessons_completed",
        targetCount: 1,
        xpReward: 50,
        active: true,
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
      {
        title: "Answer 3 quiz questions",
        challengeType: "quiz_correct",
        targetCount: 3,
        xpReward: 30,
        active: true,
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    ],
  });

  // ==================== GAME CONFIG ====================
  await prisma.gameConfig.upsert({
    where: { id: "gamification" },
    update: {},
    create: {
      id: "gamification",
      heartsMaxHearts: 5,
      heartsRecoveryTimeMs: 3600000,
      streaksCheckInHours: 24,
      streaksXpMultiplierFormula: "1 + (streak/100)",
      streaksMilestones: [7, 30, 100],
      charactersUnlockXpThreshold: 100,
      gamificationEnabled: true,
    },
  });

  console.log("✨ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
