# Schema Update Guide - Character & Lesson Relationship

## Overview

The schema has been updated to enforce that **Lessons belong to Characters**, not the other way around.

### New Architecture

**Before:**

```
Character ←→ Lesson (Many-to-Many via LessonCharacter)
- Lessons were independent
- Could have multiple characters
- Unclear ownership
```

**After:**

```
Character → Lesson (One-to-Many via CharacterLesson)
- Each Lesson is tied to ONE Character
- Character is the parent entity
- Each CharacterLesson has: lessonId, characterId, order
```

## Schema Changes

### New Model: CharacterLesson

```prisma
model CharacterLesson {
  id          String   @id @default(cuid())
  lessonId    String   @unique         // One lesson per character
  characterId String
  order       Int      @default(0)     // Order of lessons for a character
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  lesson    Lesson    @relation("CharacterLessons", fields: [lessonId], references: [id], onDelete: Cascade)
  character Character @relation("LessonsByCharacter", fields: [characterId], references: [id], onDelete: Cascade)

  @@unique([lessonId, characterId])
  @@index([characterId])
  @@index([lessonId])
}
```

### Updated Character Model

```prisma
model Character {
  // ... existing fields ...

  // Lessons belonging to this character (One character has many lessons/stories)
  lessons CharacterLesson[] @relation("LessonsByCharacter")
}
```

### Updated Lesson Model

```prisma
model Lesson {
  // ... existing fields ...

  relatedCharacters CharacterLesson? @relation("CharacterLessons")
  // Can have ONE character through the CharacterLesson junction
}
```

## UI/UX Flow

### Mobile (kamamobile)

1. Home page → Browse characters
2. Select character → Character detail page
3. View character info + lesson(s) for that character
4. Button to "Start Lesson" → Opens the story/lesson for that character

### Web Admin (kamaweb)

1. Characters page → Shows all characters
2. Click character → Character detail page
3. **New:** Tab or section showing "Lessons" for this character
4. Can assign lessons to characters from here
5. Can manage lesson order per character

## API Changes Required

### GET /api/admin/characters/:id

**Response now includes:**

```typescript
{
  id: string;
  name: string;
  // ... other fields ...
  lessons: Array<{
    id: string; // CharacterLesson.id
    lessonId: string;
    lesson: {
      id: string;
      title: string;
      slug: string;
      description?: string;
    };
    order: number;
  }>;
}
```

### POST /api/admin/characters/:id/lessons

**Create character lesson relationship**

```typescript
{
  lessonId: string;
  order?: number;
}
```

### PUT /api/admin/characters/:id/lessons/:lessonId

**Update lesson order**

```typescript
{
  order: number;
}
```

### DELETE /api/admin/characters/:id/lessons/:lessonId

**Remove lesson from character**

### GET /api/admin/characters/:id/lessons

**Get lessons for a character**

```typescript
[
  {
    id: string;
    lessonId: string;
    lesson: AdminLessonSummary;
    order: number;
  }
]
```

## TypeScript Types Update

### New Type: CharacterLessonAdmin

```typescript
export type CharacterLessonAdmin = {
  id: string;
  lessonId: string;
  characterId: string;
  order: number;
  lesson: AdminLessonSummary;
  createdAt: string;
  updatedAt: string;
};
```

### Updated AdminCharacter

```typescript
export type AdminCharacter = {
  // ... existing fields ...
  lessons: CharacterLessonAdmin[]; // NEW
};
```

### Updated AdminCharacterDetail

```typescript
export type AdminCharacterDetail = AdminCharacter & {
  lessons: CharacterLessonAdmin[]; // NEW
  translations: CharacterTranslationAdmin[];
};
```

## Database Migration

Run this migration to apply the schema changes:

```bash
npx prisma migrate dev --name character_lessons_relationship
```

This will:

1. Create the new `CharacterLesson` table
2. Update Character and Lesson relations
3. Drop the old `LessonCharacter` many-to-many table (if exists)

## Implementation Checklist

### Backend (server/)

- [ ] Update Prisma schema
- [ ] Run migration
- [ ] Update API endpoints:
  - [ ] GET /api/admin/characters/:id (add lessons)
  - [ ] POST /api/admin/characters/:id/lessons
  - [ ] PUT /api/admin/characters/:id/lessons/:lessonId
  - [ ] DELETE /api/admin/characters/:id/lessons/:lessonId
  - [ ] GET /api/admin/lessons (mark as belonging to character)

### Frontend - kamaweb

- [ ] Update types in kama-types.ts
- [ ] Update API calls in kama-api.ts
- [ ] Update character detail page:
  - [ ] Add "Lessons" tab/section
  - [ ] Show lessons assigned to character
  - [ ] Add button to assign lesson
  - [ ] Add drag-to-reorder lessons
  - [ ] Add delete lesson from character

### Frontend - kamamobile

- [ ] Update types
- [ ] Update character detail page:
  - [ ] Show lessons for character
  - [ ] Update button to "Start Lesson(s)"
  - [ ] Show multiple lessons if present

## Example: Assigning Lessons to Characters

### In kamaweb Admin:

1. Go to Characters page
2. Click on a character
3. Go to "Lessons" tab
4. Click "Assign Lesson"
5. Select from available lessons
6. Set order (1st, 2nd, 3rd, etc.)
7. Save

### Result:

- Lesson is now "owned" by this character
- Users must unlock character first
- Then can access character's lessons/stories
- Lessons show character progression

## Benefits

✅ Clear ownership: Each lesson belongs to one character
✅ Better organization: Group related lessons by character
✅ Simplified flow: Character → Lesson(s) → Story
✅ Easier progression: Unlock character → unlock their stories
✅ Admin friendly: Manage lessons from character page
✅ User friendly: See lessons in character detail view
