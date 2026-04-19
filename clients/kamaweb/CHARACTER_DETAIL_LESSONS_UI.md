# Character Detail Page - Lessons Management UI

## Overview

The character detail page (`[characterId]/page.tsx`) needs to be updated to:

1. Display lessons assigned to the character
2. Allow adding/removing lessons
3. Allow reordering lessons

## Current State

- Characters can have an `unlockLessonId` (legacy field)
- This is a single lesson per character
- Need to add support for multiple lessons per character

## New UI Structure

### Lessons Tab

Add a new tab or section in the character detail page:

```tsx
<Tabs>
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="translations">Translations</TabsTrigger>
    <TabsTrigger value="lessons">Lessons</TabsTrigger> {/* NEW */}
  </TabsList>

  <TabsContent value="lessons">{/* Lessons management UI */}</TabsContent>
</Tabs>
```

### Lessons Section UI

```tsx
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <h3 className="font-semibold">Stories for this Character</h3>
    <Button onClick={() => setAssignDialog(true)}>
      <Plus className="size-4" />
      Assign Lesson
    </Button>
  </div>

  {/* Empty state */}
  {characterLessons.length === 0 && (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        <p className="text-center text-muted-foreground text-sm">
          No lessons assigned yet. Click "Assign Lesson" to add one.
        </p>
      </CardContent>
    </Card>
  )}

  {/* Lessons list */}
  {characterLessons.length > 0 && (
    <div className="space-y-2">
      {characterLessons.map((cl, idx) => (
        <Card key={cl.id} className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <span className="text-sm font-semibold">{idx + 1}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium">{cl.lesson.title}</p>
              <p className="text-xs text-muted-foreground">
                {cl.lesson.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Reorder buttons */}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={idx === 0}
              onClick={() => reorderLesson(idx, idx - 1)}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={idx === characterLessons.length - 1}
              onClick={() => reorderLesson(idx, idx + 1)}
            >
              <ArrowDown className="size-4" />
            </Button>
            {/* Delete button */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeLesson(cl.id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )}
</div>
```

### Assign Lesson Dialog

```tsx
<Dialog open={assignDialog} onOpenChange={setAssignDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Assign Lesson to {character.name}</DialogTitle>
      <DialogDescription>
        Select a lesson to assign to this character
      </DialogDescription>
    </DialogHeader>

    <div className="grid gap-4">
      <NativeSelect
        value={selectedLessonId}
        onChange={(e) => setSelectedLessonId(e.target.value)}
      >
        <NativeSelectOption value="">Select a lesson...</NativeSelectOption>
        {availableLessons.map((l) => (
          <NativeSelectOption key={l.id} value={l.id}>
            {l.title}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      <div className="grid gap-2">
        <Label>Order (optional)</Label>
        <Input
          type="number"
          value={lessonOrder}
          onChange={(e) => setLessonOrder(Number(e.target.value))}
          placeholder="0"
          min="0"
        />
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setAssignDialog(false)}>
        Cancel
      </Button>
      <Button onClick={assignLesson} disabled={!selectedLessonId}>
        Assign Lesson
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## State Management

```tsx
const [characterLessons, setCharacterLessons] = useState<
  CharacterLessonAdmin[]
>([]);
const [assignDialog, setAssignDialog] = useState(false);
const [selectedLessonId, setSelectedLessonId] = useState("");
const [lessonOrder, setLessonOrder] = useState(0);

// Load character lessons on mount
useEffect(() => {
  const token = getAdminToken();
  if (!token || !characterId) return;

  getCharacterLessons(token, characterId)
    .then(setCharacterLessons)
    .catch((e) => toast.error(e.message));
}, [characterId]);
```

## API Calls

```tsx
// Load lessons for character
async function loadCharacterLessons() {
  const token = getAdminToken();
  if (!token) return;
  try {
    const lessons = await getCharacterLessons(token, characterId);
    setCharacterLessons(lessons);
  } catch (e) {
    toast.error("Failed to load lessons");
  }
}

// Assign lesson to character
async function assignLesson() {
  const token = getAdminToken();
  if (!token || !selectedLessonId) return;
  try {
    const newLesson = await assignLessonToCharacter(token, characterId, {
      lessonId: selectedLessonId,
      order: characterLessons.length + Number(lessonOrder || 0),
    });
    setCharacterLessons([...characterLessons, newLesson]);
    setAssignDialog(false);
    toast.success("Lesson assigned");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Failed to assign lesson");
  }
}

// Remove lesson from character
async function removeLesson(characterLessonId: string) {
  if (!confirm("Remove this lesson from the character?")) return;
  const token = getAdminToken();
  if (!token) return;
  try {
    const cl = characterLessons.find((l) => l.id === characterLessonId);
    if (!cl) return;

    await removeCharacterLesson(token, characterId, cl.lessonId);
    setCharacterLessons(
      characterLessons.filter((l) => l.id !== characterLessonId),
    );
    toast.success("Lesson removed");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Failed to remove lesson");
  }
}

// Reorder lessons
async function reorderLesson(fromIdx: number, toIdx: number) {
  const token = getAdminToken();
  if (!token) return;

  const newOrder = characterLessons[toIdx];
  const lesson = characterLessons[fromIdx];

  // Swap in UI first
  const updated = [...characterLessons];
  [updated[fromIdx], updated[toIdx]] = [updated[toIdx], updated[fromIdx]];
  setCharacterLessons(updated);

  // Update on server
  try {
    await updateCharacterLessonOrder(
      token,
      characterId,
      lesson.lessonId,
      toIdx,
    );
    await updateCharacterLessonOrder(
      token,
      characterId,
      newOrder.lessonId,
      fromIdx,
    );
    toast.success("Lesson order updated");
  } catch (e) {
    // Revert on error
    setCharacterLessons(characterLessons);
    toast.error("Failed to update order");
  }
}
```

## Imports Needed

```tsx
import {
  getCharacterLessons,
  assignLessonToCharacter,
  removeCharacterLesson,
  updateCharacterLessonOrder,
} from "@/lib/kama-api";
import type { CharacterLessonAdmin } from "@/lib/kama-types";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
```

## Integration Steps

1. ✅ Update `kama-types.ts` - Add `CharacterLessonAdmin` type
2. ✅ Update `kama-api.ts` - Add API functions
3. 🔲 Update `[characterId]/page.tsx`:
   - Add imports for new API functions and types
   - Add state for character lessons
   - Add "Lessons" tab/section
   - Implement assign dialog
   - Implement remove/reorder functionality
4. 🔲 Test end-to-end flow

## Backward Compatibility

The `unlockLessonId` field remains in:

- Character creation form (kept for legacy)
- Character update form (kept for legacy)
- Database schema (kept for legacy)

However, the new character-lesson relationship takes precedence. If a character has lessons assigned via `CharacterLesson`, those are displayed to users on the mobile app instead of the single `unlockLessonId`.

## Notes

- Lessons are ordered by the `order` field in `CharacterLesson`
- When assigning a new lesson, the order is auto-set to current length
- Users can manually reorder via UI
- Deletion only removes the character-lesson relationship, not the lesson itself
