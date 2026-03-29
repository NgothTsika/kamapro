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
  const adminPassword = "Admin@ngoth09"; // CHANGE THIS IN PRODUCTION!
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

  // ==================== CATEGORIES ====================
  // Seeds comprehensive categories from seedNote.txt

  const categoriesData = [
    // ========== TOP LEVEL CATEGORIES ==========
    {
      name: "Africa",
      slug: "africa",
      parentSlug: null,
      description:
        "The birthplace of humanity, home to diverse cultures, ancient kingdoms, and modern nations.",
      order: 0,
    },
    {
      name: "Diaspora",
      slug: "diaspora",
      parentSlug: null,
      description:
        "Communities of African descent across the Americas, Caribbean, Europe, and beyond.",
      order: 1,
    },
    {
      name: "Ancient Civilizations",
      slug: "ancient-civilizations",
      parentSlug: null,
      description: "Early African civilizations that shaped human history.",
      order: 2,
    },
    {
      name: "Empires & Kingdoms",
      slug: "empires-kingdoms",
      parentSlug: null,
      description:
        "Medieval and early modern African empires that dominated trade, culture, and politics.",
      order: 3,
    },
    {
      name: "Colonial Era",
      slug: "colonial-era",
      parentSlug: null,
      description:
        "European colonization, resistance, and the transatlantic slave trade.",
      order: 4,
    },
    {
      name: "Independence & Modern",
      slug: "independence-modern",
      parentSlug: null,
      description: "Decolonization, nation-building, and contemporary Africa.",
      order: 5,
    },
    {
      name: "Culture",
      slug: "culture",
      parentSlug: null,
      description:
        "Art, music, literature, and traditions of African and Black peoples.",
      order: 6,
    },
    {
      name: "Science & Innovation",
      slug: "science-innovation",
      parentSlug: null,
      description:
        "Contributions of African and Black people to science, technology, and invention.",
      order: 7,
    },
    {
      name: "Warriors & Leaders",
      slug: "warriors-leaders",
      parentSlug: null,
      description: "Military leaders, monarchs, and political visionaries.",
      order: 8,
    },
    {
      name: "Activists & Civil Rights",
      slug: "activists-civil-rights",
      parentSlug: null,
      description: "Campaigners for equality and justice.",
      order: 9,
    },
    {
      name: "Religion & Spirituality",
      slug: "religion-spirituality",
      parentSlug: null,
      description: "Belief systems, rituals, and spiritual traditions.",
      order: 10,
    },
    {
      name: "Figures by Profession",
      slug: "figures-by-profession",
      parentSlug: null,
      description: "Categorization by fields of achievement.",
      order: 11,
    },
    {
      name: "Women in History",
      slug: "women-in-history",
      parentSlug: null,
      description: "Queens, activists, and pioneering women.",
      order: 12,
    },
    {
      name: "Trade & Economics",
      slug: "trade-economics",
      parentSlug: null,
      description: "Salt, gold, commerce, and economic systems.",
      order: 13,
    },
    {
      name: "Prehistory",
      slug: "prehistory",
      parentSlug: null,
      description: "Human origins and early African societies.",
      order: 14,
    },

    // ========== AFRICA SUBCATEGORIES ==========
    {
      name: "West Africa",
      slug: "west-africa",
      parentSlug: "africa",
      description:
        "Region known for powerful empires (Ghana, Mali, Songhai), vibrant cultures, and the transatlantic slave trade.",
      order: 0,
    },
    {
      name: "East Africa",
      slug: "east-africa",
      parentSlug: "africa",
      description:
        "Cradle of humanity, Swahili coast, Great Lakes kingdoms, and ancient Aksum.",
      order: 1,
    },
    {
      name: "Central Africa",
      slug: "central-africa",
      parentSlug: "africa",
      description:
        "Rainforest kingdoms (Kongo, Luba, Lunda), diverse ethnic groups, and colonial history.",
      order: 2,
    },
    {
      name: "Southern Africa",
      slug: "southern-africa",
      parentSlug: "africa",
      description:
        "Great Zimbabwe, Zulu Kingdom, Ndebele, San people, and the struggle against apartheid.",
      order: 3,
    },
    {
      name: "North Africa",
      slug: "north-africa",
      parentSlug: "africa",
      description:
        "Ancient Egypt, Carthage, Numidia, Amazigh (Berber) cultures, and Islamic empires.",
      order: 4,
    },

    // ========== DIASPORA SUBCATEGORIES ==========
    {
      name: "Caribbean",
      slug: "caribbean",
      parentSlug: "diaspora",
      description:
        "Maroon societies, Haitian Revolution, reggae, carnival, and African retentions.",
      order: 0,
    },
    {
      name: "North America",
      slug: "north-america",
      parentSlug: "diaspora",
      description:
        "African American history, Civil Rights Movement, Harlem Renaissance, Black culture in USA and Canada.",
      order: 1,
    },
    {
      name: "South America",
      slug: "south-america",
      parentSlug: "diaspora",
      description:
        "Afro-Brazilian quilombos, Afro-Colombian communities, candomblé, and capoeira.",
      order: 2,
    },
    {
      name: "Europe",
      slug: "europe",
      parentSlug: "diaspora",
      description:
        "Black communities in the UK, France, Germany, and the African presence in Europe since Roman times.",
      order: 3,
    },

    // ========== ANCIENT CIVILIZATIONS SUBCATEGORIES ==========
    {
      name: "Ancient Egypt",
      slug: "ancient-egypt",
      parentSlug: "ancient-civilizations",
      description:
        "Pharaohs, pyramids, hieroglyphs, and the Nile Valley civilization.",
      order: 0,
    },
    {
      name: "Kingdom of Kush",
      slug: "kingdom-of-kush",
      parentSlug: "ancient-civilizations",
      description:
        "Nubian kingdom that ruled Egypt as the 25th Dynasty, known for pyramids at Meroë.",
      order: 1,
    },
    {
      name: "Nok Culture",
      slug: "nok-culture",
      parentSlug: "ancient-civilizations",
      description:
        "West Africa's earliest known civilization (c. 1500 BCE – 500 CE), famous for terracotta sculptures.",
      order: 2,
    },
    {
      name: "Kingdom of Aksum",
      slug: "kingdom-of-aksum",
      parentSlug: "ancient-civilizations",
      description:
        "Ethiopian empire that controlled Red Sea trade, adopted Christianity early.",
      order: 3,
    },
    {
      name: "Great Zimbabwe",
      slug: "great-zimbabwe",
      parentSlug: "ancient-civilizations",
      description:
        "Stone city and trade empire in southern Africa (c. 1000–1450 CE).",
      order: 4,
    },

    // ========== EMPIRES & KINGDOMS SUBCATEGORIES ==========
    {
      name: "Ghana Empire",
      slug: "ghana-empire",
      parentSlug: "empires-kingdoms",
      description:
        "Wagadou Empire (c. 300–1200 CE), center of gold and salt trade.",
      order: 0,
    },
    {
      name: "Mali Empire",
      slug: "mali-empire",
      parentSlug: "empires-kingdoms",
      description: "Famous for Mansa Musa, Timbuktu, and trans-Saharan trade.",
      order: 1,
    },
    {
      name: "Songhai Empire",
      slug: "songhai-empire",
      parentSlug: "empires-kingdoms",
      description: "Largest West African empire under Askia the Great.",
      order: 2,
    },
    {
      name: "Benin Kingdom",
      slug: "benin-kingdom",
      parentSlug: "empires-kingdoms",
      description: "Famed for bronze casting and the Oba's court (Nigeria).",
      order: 3,
    },
    {
      name: "Kongo Kingdom",
      slug: "kongo-kingdom",
      parentSlug: "empires-kingdoms",
      description:
        "Central African kingdom that embraced Christianity and resisted Portuguese colonization.",
      order: 4,
    },
    {
      name: "Zulu Kingdom",
      slug: "zulu-kingdom",
      parentSlug: "empires-kingdoms",
      description:
        "Southern African kingdom under Shaka, known for military innovation.",
      order: 5,
    },

    // ========== COLONIAL ERA SUBCATEGORIES ==========
    {
      name: "Transatlantic Slave Trade",
      slug: "slave-trade",
      parentSlug: "colonial-era",
      description:
        "The forced migration of millions of Africans, Middle Passage, and its lasting impact.",
      order: 0,
    },
    {
      name: "Resistance Movements",
      slug: "resistance-movements",
      parentSlug: "colonial-era",
      description:
        "Slave revolts, anti-colonial wars, and leaders like Queen Nzinga, Samori Touré.",
      order: 1,
    },

    // ========== INDEPENDENCE & MODERN SUBCATEGORIES ==========
    {
      name: "Independence Movements",
      slug: "independence-movements",
      parentSlug: "independence-modern",
      description:
        "Struggles for freedom from colonial rule (Ghana, Kenya, Algeria, etc.).",
      order: 0,
    },
    {
      name: "Pan-Africanism",
      slug: "pan-africanism",
      parentSlug: "independence-modern",
      description:
        "Philosophy and movement for African unity, figures like Kwame Nkrumah, W.E.B. Du Bois.",
      order: 1,
    },

    // ========== CULTURE SUBCATEGORIES ==========
    {
      name: "Art & Architecture",
      slug: "art-architecture",
      parentSlug: "culture",
      description:
        "From ancient Nok terracottas to modern African art, and architectural marvels.",
      order: 0,
    },
    {
      name: "Music & Dance",
      slug: "music-dance",
      parentSlug: "culture",
      description:
        "Jazz, blues, Afrobeat, reggae, hip-hop, and traditional rhythms.",
      order: 1,
    },
    {
      name: "Literature & Poetry",
      slug: "literature-poetry",
      parentSlug: "culture",
      description:
        "Oral traditions, Negritude, African novel, and contemporary writers.",
      order: 2,
    },
    {
      name: "Fashion & Textiles",
      slug: "fashion-textiles",
      parentSlug: "culture",
      description:
        "Kente cloth, Ankara, adire, and global Black fashion icons.",
      order: 3,
    },

    // ========== SCIENCE & INNOVATION SUBCATEGORIES ==========
    {
      name: "Ancient Innovations",
      slug: "ancient-innovations",
      parentSlug: "science-innovation",
      description:
        "Mathematics, medicine, metallurgy, and astronomy in ancient Africa.",
      order: 0,
    },
    {
      name: "Modern Inventors",
      slug: "modern-inventors",
      parentSlug: "science-innovation",
      description:
        "Black inventors from Garrett Morgan to modern tech pioneers.",
      order: 1,
    },
    {
      name: "Medicine & Health",
      slug: "medicine-health",
      parentSlug: "science-innovation",
      description:
        "Traditional healers, modern medical breakthroughs, and public health leaders.",
      order: 2,
    },

    // ========== WARRIORS & LEADERS SUBCATEGORIES ==========
    {
      name: "Military Leaders",
      slug: "military-leaders",
      parentSlug: "warriors-leaders",
      description:
        "Shaka Zulu, Queen Amina, Hannibal, and other strategic minds.",
      order: 0,
    },
    {
      name: "Political Leaders",
      slug: "political-leaders",
      parentSlug: "warriors-leaders",
      description: "Presidents, prime ministers, and independence fighters.",
      order: 1,
    },

    // ========== ACTIVISTS & CIVIL RIGHTS SUBCATEGORIES ==========
    {
      name: "Civil Rights Movement (USA)",
      slug: "civil-rights-usa",
      parentSlug: "activists-civil-rights",
      description:
        "Martin Luther King Jr., Rosa Parks, and the struggle for racial equality.",
      order: 0,
    },
    {
      name: "Anti-Apartheid Movement",
      slug: "anti-apartheid",
      parentSlug: "activists-civil-rights",
      description:
        "Nelson Mandela, Steve Biko, and the fight against apartheid in South Africa.",
      order: 1,
    },
    {
      name: "Black Lives Matter",
      slug: "black-lives-matter",
      parentSlug: "activists-civil-rights",
      description: "Contemporary movement for racial justice.",
      order: 2,
    },

    // ========== RELIGION & SPIRITUALITY SUBCATEGORIES ==========
    {
      name: "African Traditional Religions",
      slug: "african-traditional-religions",
      parentSlug: "religion-spirituality",
      description: "Yoruba, Akan, Vodun, and other indigenous faiths.",
      order: 0,
    },
    {
      name: "Islam in Africa",
      slug: "islam-africa",
      parentSlug: "religion-spirituality",
      description:
        "Spread of Islam across the continent and its cultural impact.",
      order: 1,
    },
    {
      name: "Christianity in Africa",
      slug: "christianity-africa",
      parentSlug: "religion-spirituality",
      description:
        "Ancient Ethiopian Orthodox, colonial missions, and modern African churches.",
      order: 2,
    },
    {
      name: "Diaspora Religions",
      slug: "diaspora-religions",
      parentSlug: "religion-spirituality",
      description:
        "Vodou, Santería, Candomblé, and other syncretic traditions.",
      order: 3,
    },

    // ========== FIGURES BY PROFESSION SUBCATEGORIES ==========
    {
      name: "Writers & Philosophers",
      slug: "writers-philosophers",
      parentSlug: "figures-by-profession",
      description: "Chinua Achebe, Toni Morrison, Frantz Fanon, etc.",
      order: 0,
    },
    {
      name: "Artists & Musicians",
      slug: "artists-musicians",
      parentSlug: "figures-by-profession",
      description: "Visual artists, composers, and performers.",
      order: 1,
    },
    {
      name: "Athletes",
      slug: "athletes",
      parentSlug: "figures-by-profession",
      description: "Olympic champions, boxers, and sports pioneers.",
      order: 2,
    },
    {
      name: "Scientists & Inventors",
      slug: "scientists-inventors",
      parentSlug: "figures-by-profession",
      description: "Researchers, engineers, and innovators.",
      order: 3,
    },
  ];

  // Create or update all categories
  for (const catData of categoriesData) {
    await prisma.category.upsert({
      where: { slug: catData.slug },
      update: {
        name: catData.name,
        description: catData.description,
        order: catData.order,
      },
      create: {
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        order: catData.order,
      },
    });
  }

  console.log(`✅ Created/updated ${categoriesData.length} categories`);

  // Get the main category for default content
  const category = await prisma.category.findUnique({
    where: { slug: "ancient-civilizations" },
  });

  if (!category) {
    throw new Error("Failed to create ancient-civilizations category");
  }

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
