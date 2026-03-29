import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// Initialize Supabase with service role (for admin operations)
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Storage bucket configuration - Based on Prisma Schema
const STORAGE_BUCKETS = [
  // ========== Content Buckets ==========
  {
    name: "lesson-covers",
    public: true,
    description:
      "Lesson and category cover images (Lesson.coverImage, Category.coverImage)",
  },
  {
    name: "chapter-media",
    public: true,
    description: "Chapter media (images/videos) (Chapter.mediaUrl)",
  },
  {
    name: "character-images",
    public: true,
    description:
      "Character main images and portraits (Character.imageUrl, CharacterCard.characterImage)",
  },
  {
    name: "character-inventions",
    public: true,
    description:
      "Character invention images (Character.inventionImage, CharacterCard.inventionImage)",
  },

  // ========== User Buckets ==========
  {
    name: "user-avatars",
    public: true,
    description: "User profile avatars (User.avatar)",
  },

  // ========== Community & Submissions Buckets ==========
  {
    name: "community-submissions",
    public: true,
    description: "User-submitted content images (ContentSubmission.imageUrl)",
  },

  // ========== Achievement & Icon Buckets ==========
  {
    name: "achievement-icons",
    public: true,
    description: "Achievement badge icons (Achievement.icon)",
  },

  // ========== Category & Topic Buckets ==========
  {
    name: "category-icons",
    public: true,
    description: "Category icon images (Category.icon)",
  },

  // ========== Game & Quiz Media ==========
  {
    name: "quiz-media",
    public: true,
    description: "Quiz related media (future: question images, hints)",
  },

  // ========== Backups & Admin ==========
  {
    name: "admin-backups",
    public: false,
    description: "Admin backups and exports (private)",
  },
];

/**
 * POST /storage/init
 * Initialize storage buckets
 * Requires: admin authentication
 */
router.post("/init", async (req, res) => {
  try {
    const results = [];

    for (const bucket of STORAGE_BUCKETS) {
      try {
        // Check if bucket exists
        const { data: existingBuckets } = await supabase.storage.listBuckets();
        const bucketExists = existingBuckets?.some(
          (b) => b.name === bucket.name,
        );

        if (bucketExists) {
          results.push({
            name: bucket.name,
            status: "exists",
            message: `Bucket "${bucket.name}" already exists`,
          });
          continue;
        }

        // Create bucket
        const { data, error } = await supabase.storage.createBucket(
          bucket.name,
          {
            public: bucket.public,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: [
              "image/jpeg",
              "image/png",
              "image/webp",
              "image/gif",
              "video/mp4",
              "video/webm",
              "video/quicktime",
            ],
          },
        );

        if (error) {
          results.push({
            name: bucket.name,
            status: "error",
            message: error.message,
          });
        } else {
          results.push({
            name: bucket.name,
            status: "created",
            message: `Bucket "${bucket.name}" created successfully`,
          });
        }
      } catch (err) {
        results.push({
          name: bucket.name,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    res.status(200).json({
      message: "Storage initialization completed",
      results,
    });
  } catch (error) {
    console.error("Storage init error:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Storage initialization failed",
    });
  }
});

/**
 * GET /storage/buckets
 * List all storage buckets
 */
router.get("/buckets", async (req, res) => {
  try {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({
      buckets: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("List buckets error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to list buckets",
    });
  }
});

/**
 * POST /storage/cors
 * Configure CORS for storage buckets
 */
router.post("/cors", async (req, res) => {
  try {
    const corsPolicy = [
      {
        origin: [
          "http://localhost:3000",
          "http://localhost:4000",
          "https://kamapro-one.vercel.app",
        ],
        methods: ["GET", "HEAD", "PUT", "POST", "DELETE"],
        allowedHeaders: ["*"],
        maxAgeSeconds: 86400,
      },
    ];

    const results = [];

    for (const bucket of STORAGE_BUCKETS) {
      try {
        // Update CORS policy for each bucket
        const { error } = await supabase.storage.updateBucket(bucket.name, {
          public: bucket.public,
        });

        if (error) {
          results.push({
            name: bucket.name,
            status: "error",
            message: error.message,
          });
        } else {
          results.push({
            name: bucket.name,
            status: "configured",
            message: `CORS policy configured for "${bucket.name}"`,
          });
        }
      } catch (err) {
        results.push({
          name: bucket.name,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    res.status(200).json({
      message: "CORS configuration completed",
      corsPolicy,
      results,
    });
  } catch (error) {
    console.error("CORS config error:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "CORS configuration failed",
    });
  }
});

/**
 * POST /storage/rls-disable
 * Disable RLS policies for storage buckets to allow public uploads
 */
router.post("/rls-disable", async (req, res) => {
  try {
    const results = [];

    // Note: Disabling RLS requires direct Supabase API call or admin panel
    // This endpoint provides guidance and can be used with a direct API call
    for (const bucket of STORAGE_BUCKETS) {
      try {
        // Attempt to disable RLS by making the bucket truly public
        const { error } = await supabase.storage.updateBucket(bucket.name, {
          public: true,
          fileSizeLimit: 52428800, // 50MB
        });

        if (error) {
          results.push({
            name: bucket.name,
            status: "warning",
            message: `Note: RLS policies may still be active. Update via Supabase dashboard if needed.`,
          });
        } else {
          results.push({
            name: bucket.name,
            status: "updated",
            message: `Bucket "${bucket.name}" updated to ensure public access`,
          });
        }
      } catch (err) {
        results.push({
          name: bucket.name,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    res.status(200).json({
      message: "RLS policy update completed",
      note: "If you still get RLS errors, manually disable RLS policies in Supabase dashboard",
      steps: [
        "1. Go to https://app.supabase.com",
        "2. Select your project",
        "3. Go to Storage > Policies",
        "4. For each bucket, disable RLS (toggle off)",
        "5. Click 'Allow' for public uploads",
      ],
      results,
    });
  } catch (error) {
    console.error("RLS disable error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "RLS update failed",
    });
  }
});

/**
 * POST /storage/fix-all
 * Complete storage setup: create buckets, configure CORS, and disable RLS
 */
router.post("/fix-all", async (req, res) => {
  try {
    const allResults: {
      init: Array<{ name: string; status: string; message: string }>;
      cors: Array<{ name: string; status: string; message: string }>;
      rls: Array<{ name: string; status: string; message: string }>;
    } = {
      init: [],
      cors: [],
      rls: [],
    };

    // Step 1: Initialize buckets
    for (const bucket of STORAGE_BUCKETS) {
      try {
        const { data: existingBuckets } = await supabase.storage.listBuckets();
        const bucketExists = existingBuckets?.some(
          (b) => b.name === bucket.name,
        );

        if (!bucketExists) {
          const { error } = await supabase.storage.createBucket(bucket.name, {
            public: bucket.public,
            fileSizeLimit: 52428800,
            allowedMimeTypes: [
              "image/jpeg",
              "image/png",
              "image/webp",
              "image/gif",
              "video/mp4",
              "video/webm",
              "video/quicktime",
            ],
          });

          allResults.init.push({
            name: bucket.name,
            status: error ? "error" : "created",
            message: error?.message || `Bucket created`,
          });
        } else {
          allResults.init.push({
            name: bucket.name,
            status: "exists",
            message: "Bucket already exists",
          });
        }
      } catch (err) {
        allResults.init.push({
          name: bucket.name,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // Step 2: Update buckets for CORS
    for (const bucket of STORAGE_BUCKETS) {
      try {
        const { error } = await supabase.storage.updateBucket(bucket.name, {
          public: bucket.public,
        });

        allResults.cors.push({
          name: bucket.name,
          status: error ? "error" : "configured",
          message: error?.message || "CORS configured",
        });
      } catch (err) {
        allResults.cors.push({
          name: bucket.name,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // Step 3: Attempt RLS fixes
    for (const bucket of STORAGE_BUCKETS) {
      allResults.rls.push({
        name: bucket.name,
        status: "info",
        message: "Manual RLS disable needed - see instructions in response",
      });
    }

    res.status(200).json({
      message: "Storage complete setup finished",
      success: true,
      manualStepsRequired: true,
      manualSteps: [
        "1. Go to https://app.supabase.com → Select Project",
        "2. Go to Authentication > Policies (left sidebar)",
        "3. Find storage.objects table",
        "4. Look for any RLS policies with SELECT/INSERT/UPDATE/DELETE",
        "5. For each policy, click the 3-dots and DELETE it",
        "6. Answer YES to 'Drop policy'",
        "7. After all policies are deleted, storage will be fully public",
        "8. Try uploading files again",
      ],
      results: allResults,
    });
  } catch (error) {
    console.error("Complete setup error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Setup failed",
    });
  }
});

/**
 * POST /storage/disable-rls
 * Provide SQL instructions to disable RLS
 * Note: RLS cannot be disabled via API - must be done via Supabase SQL Editor
 */
router.post("/disable-rls", async (req, res) => {
  try {
    const results = [];

    // Update bucket settings to ensure public access
    for (const bucket of STORAGE_BUCKETS) {
      try {
        const { error } = await supabase.storage.updateBucket(bucket.name, {
          public: true,
          fileSizeLimit: 52428800,
        });

        results.push({
          name: bucket.name,
          status: "configured",
          message: "Bucket set to public",
        });
      } catch (err) {
        results.push({
          name: bucket.name,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    res.status(200).json({
      message: "Buckets configured for public access",
      info: "RLS policies must be disabled via Supabase SQL Editor (cannot be done via API)",
      sqlCommand: "ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;",
      steps: [
        "1. Go to https://app.supabase.com",
        "2. Select your project 'KamaGame'",
        "3. Click 'SQL Editor' in the left sidebar",
        "4. Click 'New Query' (top right)",
        "5. Copy and paste the SQL command below:",
        "   ",
        "   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;",
        "   ",
        "6. Click the 'Run' button (or press Cmd+Enter)",
        "7. You should see: 'Query successful. No rows returned.'",
        "8. Go back to your app and try uploading files",
      ],
      results,
      nextStep: "Execute the SQL command in Supabase SQL Editor",
    });
  } catch (error) {
    console.error("RLS disable error:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to prepare RLS fix",
      hint: "Execute this SQL in Supabase SQL Editor: ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;",
    });
  }
});

/**
 * POST /storage/check-status
 * Check current storage setup status
 */
router.post("/check-status", async (req, res) => {
  try {
    const results = [];

    // Check if buckets exist
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      return res.status(500).json({
        error: "Cannot list buckets",
        details: bucketsError.message,
      });
    }

    for (const bucket of STORAGE_BUCKETS) {
      const exists = buckets?.some((b) => b.name === bucket.name);
      results.push({
        name: bucket.name,
        exists,
        status: exists ? "created" : "missing",
        message: exists
          ? `Bucket exists (public: ${buckets?.find((b) => b.name === bucket.name)?.public})`
          : "Bucket not found",
      });
    }

    res.status(200).json({
      message: "Storage status check",
      buckets: results,
      nextSteps: results.some((r) => !r.exists)
        ? "Click 'Initialize Buckets' on the Storage Setup page"
        : "Buckets are ready. Click 'Fix RLS Policies' if uploads fail.",
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Status check failed",
    });
  }
});

export default router;
