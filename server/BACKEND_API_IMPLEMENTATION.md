# Backend API Implementation Guide

## Overview

This guide shows the exact API endpoints needed to support the new Character-Lesson relationship.

## Database Query Examples

### Get Character with its Lessons

```prisma
# Prisma query
const character = await prisma.character.findUnique({
  where: { slug: "marie-curie" },
  include: {
    lessons: {
      include: {
        lesson: true
      },
      orderBy: { order: "asc" }
    }
  }
});
```

**Response:**

```typescript
{
  id: "char_123",
  name: "Marie Curie",
  slug: "marie-curie",
  description: "...",
  imageUrl: "...",
  lessons: [
    {
      id: "charlesson_1",
      lessonId: "lesson_100",
      characterId: "char_123",
      order: 0,
      lesson: {
        id: "lesson_100",
        title: "Early Life",
        slug: "early-life",
        description: "..."
      }
    },
    {
      id: "charlesson_2",
      lessonId: "lesson_101",
      characterId: "char_123",
      order: 1,
      lesson: {
        id: "lesson_101",
        title: "Polonium Discovery",
        slug: "polonium-discovery",
        description: "..."
      }
    }
  ]
}
```

## API Endpoints

### 1. GET `/api/characters/:slug` (Public)

**Get character by slug with lessons**

**Implementation:**

```typescript
// server/api/characters.ts or routes/characters.ts

export async function getCharacter(slug: string) {
  const character = await prisma.character.findUnique({
    where: { slug },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      lessons: {
        include: {
          lesson: {
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              coverImage: true,
              xpReward: true,
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!character) {
    throw new Error("Character not found");
  }

  return {
    character: {
      ...character,
      lessons: character.lessons.map((cl) => ({
        id: cl.lesson.id,
        slug: cl.lesson.slug,
        title: cl.lesson.title,
        description: cl.lesson.description,
        coverImage: cl.lesson.coverImage,
        xpReward: cl.lesson.xpReward,
        order: cl.order,
      })),
    },
  };
}
```

### 2. GET `/api/admin/characters/:id` (Admin)

**Get character detail with lessons**

**Implementation:**

```typescript
export async function getAdminCharacter(characterId: string) {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      lessons: {
        include: {
          lesson: {
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              published: true,
              xpReward: true,
              _count: { select: { chapters: true, quizzes: true } },
            },
          },
        },
        orderBy: { order: "asc" },
      },
      translations: true,
    },
  });

  if (!character) {
    throw new Error("Character not found");
  }

  return {
    character: {
      ...character,
      lessons: character.lessons.map((cl) => ({
        id: cl.id,
        lessonId: cl.lessonId,
        characterId: cl.characterId,
        order: cl.order,
        lesson: cl.lesson,
        createdAt: cl.createdAt,
        updatedAt: cl.updatedAt,
      })),
    },
  };
}
```

### 3. GET `/api/admin/characters/:id/lessons` (Admin)

**Get all lessons for a character**

**Implementation:**

```typescript
export async function getCharacterLessons(characterId: string) {
  const characterLessons = await prisma.characterLesson.findMany({
    where: { characterId },
    include: {
      lesson: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          published: true,
          xpReward: true,
          _count: { select: { chapters: true, quizzes: true } },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  return {
    lessons: characterLessons,
  };
}
```

### 4. POST `/api/admin/characters/:id/lessons` (Admin)

**Assign a lesson to a character**

**Request Body:**

```typescript
{
  lessonId: string;
  order?: number;  // Optional, auto-calculated if not provided
}
```

**Implementation:**

```typescript
export async function assignLessonToCharacter(
  characterId: string,
  lessonId: string,
  order?: number,
) {
  // Verify character exists
  const character = await prisma.character.findUnique({
    where: { id: characterId },
  });
  if (!character) throw new Error("Character not found");

  // Verify lesson exists
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
  });
  if (!lesson) throw new Error("Lesson not found");

  // Calculate order if not provided
  let finalOrder = order ?? 0;
  if (order === undefined) {
    const maxOrder = await prisma.characterLesson.findFirst({
      where: { characterId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    finalOrder = (maxOrder?.order ?? -1) + 1;
  }

  // Create or update the relationship
  const characterLesson = await prisma.characterLesson.upsert({
    where: {
      lessonId_characterId: {
        lessonId,
        characterId,
      },
    },
    update: { order: finalOrder },
    create: {
      lessonId,
      characterId,
      order: finalOrder,
    },
    include: {
      lesson: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          published: true,
          xpReward: true,
          _count: { select: { chapters: true, quizzes: true } },
        },
      },
    },
  });

  return {
    lesson: {
      id: characterLesson.id,
      lessonId: characterLesson.lessonId,
      characterId: characterLesson.characterId,
      order: characterLesson.order,
      lesson: characterLesson.lesson,
      createdAt: characterLesson.createdAt,
      updatedAt: characterLesson.updatedAt,
    },
  };
}
```

### 5. PUT `/api/admin/characters/:id/lessons/:lessonId` (Admin)

**Update lesson order for a character**

**Request Body:**

```typescript
{
  order: number;
}
```

**Implementation:**

```typescript
export async function updateCharacterLessonOrder(
  characterId: string,
  lessonId: string,
  order: number,
) {
  // Verify relationship exists
  const characterLesson = await prisma.characterLesson.findUnique({
    where: {
      lessonId_characterId: {
        lessonId,
        characterId,
      },
    },
  });
  if (!characterLesson) {
    throw new Error("Character lesson not found");
  }

  // Update order
  const updated = await prisma.characterLesson.update({
    where: {
      lessonId_characterId: {
        lessonId,
        characterId,
      },
    },
    data: { order },
    include: {
      lesson: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          published: true,
          xpReward: true,
          _count: { select: { chapters: true, quizzes: true } },
        },
      },
    },
  });

  return {
    lesson: {
      id: updated.id,
      lessonId: updated.lessonId,
      characterId: updated.characterId,
      order: updated.order,
      lesson: updated.lesson,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  };
}
```

### 6. DELETE `/api/admin/characters/:id/lessons/:lessonId` (Admin)

**Remove a lesson from a character**

**Implementation:**

```typescript
export async function removeCharacterLesson(
  characterId: string,
  lessonId: string,
) {
  // Delete the relationship
  const deleted = await prisma.characterLesson.delete({
    where: {
      lessonId_characterId: {
        lessonId,
        characterId,
      },
    },
  });

  if (!deleted) {
    throw new Error("Character lesson not found");
  }

  // Return 204 No Content or success message
  return { success: true };
}
```

## Express/Next.js Route Implementation

### Using Express (server/api/routes):

```typescript
// server/api/routes/characters.ts

import express from "express";
import { authenticateAdmin } from "./middleware/auth";
import {
  getCharacter,
  getAdminCharacter,
  getCharacterLessons,
  assignLessonToCharacter,
  updateCharacterLessonOrder,
  removeCharacterLesson,
} from "./handlers/character-lessons";

const router = express.Router();

// Public routes
router.get("/characters/:slug", async (req, res) => {
  try {
    const result = await getCharacter(req.params.slug);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Admin routes
router.use(authenticateAdmin);

router.get("/admin/characters/:id", async (req, res) => {
  try {
    const result = await getAdminCharacter(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/admin/characters/:id/lessons", async (req, res) => {
  try {
    const result = await getCharacterLessons(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/admin/characters/:id/lessons", async (req, res) => {
  try {
    const { lessonId, order } = req.body;
    const result = await assignLessonToCharacter(
      req.params.id,
      lessonId,
      order,
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/admin/characters/:id/lessons/:lessonId", async (req, res) => {
  try {
    const { order } = req.body;
    const result = await updateCharacterLessonOrder(
      req.params.id,
      req.params.lessonId,
      order,
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/admin/characters/:id/lessons/:lessonId", async (req, res) => {
  try {
    await removeCharacterLesson(req.params.id, req.params.lessonId);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
```

### Using Next.js API Routes (server/api/routes):

```typescript
// server/api/routes/admin/characters/[id]/lessons.ts

import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth";
import {
  getCharacterLessons,
  assignLessonToCharacter,
} from "@/lib/handlers/character-lessons";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1];
    await authenticateAdmin(token);

    const result = await getCharacterLessons(params.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1];
    await authenticateAdmin(token);

    const { lessonId, order } = await request.json();
    const result = await assignLessonToCharacter(params.id, lessonId, order);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 },
    );
  }
}
```

## Testing the APIs

### Test with cURL:

```bash
# Get character with lessons
curl http://localhost:3000/api/characters/marie-curie

# Get admin character with lessons
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/characters/char_123

# Get lessons for character
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/characters/char_123/lessons

# Assign lesson to character
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lessonId":"lesson_100","order":0}' \
  http://localhost:3000/api/admin/characters/char_123/lessons

# Update lesson order
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order":2}' \
  http://localhost:3000/api/admin/characters/char_123/lessons/lesson_100

# Remove lesson from character
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/characters/char_123/lessons/lesson_100
```

## Error Handling

**Common Errors:**

```typescript
// Character not found
{
  status: 404,
  error: "Character not found"
}

// Lesson not found
{
  status: 404,
  error: "Lesson not found"
}

// Character-Lesson relationship not found
{
  status: 404,
  error: "Character lesson not found"
}

// Invalid order number
{
  status: 400,
  error: "Invalid order value"
}

// Unauthorized
{
  status: 401,
  error: "Unauthorized"
}
```

## Response Format

All responses follow this format:

**Success (2xx):**

```typescript
{
  lesson: CharacterLessonAdmin  // or
  lessons: CharacterLessonAdmin[]
}
```

**Error (4xx/5xx):**

```typescript
{
  error: string;
}
```

## Order Management

The `order` field determines the sequence of lessons for a character:

- **Auto-calculate**: If not provided, set to max existing order + 1
- **Manual set**: Can be provided to insert in specific position
- **Reorder**: Update any lesson's order to change its position
- **Gap-safe**: Order doesn't need to be sequential (can be 0, 1, 5, 10)

**Auto-order example:**

```
Character has 0 lessons → Assign Lesson1 → order = 0
Character has 1 lesson → Assign Lesson2 → order = 1
Character has 2 lessons → Assign Lesson3 → order = 2
```

**Manual order example:**

```
POST /characters/id/lessons with order=1
→ Inserts between existing 0 and 1
→ Existing lesson at 1 stays (order field is per lesson, not sequential)
```
