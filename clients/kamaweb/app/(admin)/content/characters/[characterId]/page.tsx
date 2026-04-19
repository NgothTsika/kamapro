"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminToken } from "@/lib/admin-auth";
import {
  assignLessonToCharacter,
  createCharacterTranslation,
  deleteAdminCharacter,
  deleteCharacterTranslation,
  getAdminCategories,
  getAdminCharacter,
  getAdminLessons,
  getCharacterLessons,
  removeCharacterLesson,
  updateAdminCharacter,
  updateCharacterLessonOrder,
  updateCharacterTranslation,
} from "@/lib/kama-api";
import type {
  AdminCategory,
  AdminCharacterDetail,
  AdminLessonSummary,
  CharacterLessonAdmin,
  CharacterTranslationAdmin,
} from "@/lib/kama-types";

export default function CharacterEditorPage() {
  const params = useParams();
  const characterId = params.characterId as string;
  const router = useRouter();

  const [character, setCharacter] = useState<AdminCharacterDetail | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [lessons, setLessons] = useState<AdminLessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    slug: string;
    description: string;
    story: string;
    imageUrl: string;
    inventionImage: string;
    xpThreshold: string;
    rarityLevel: string;
    categoryId: string;
    entityType: string;
    personType: string;
    placeType: string;
    eventType: string;
    traditionType: string;
    conceptType: string;
    birthYear: string;
    endYear: string;
    country: string;
    achievements: string;
    metadata: Record<string, any>;
  }>({
    name: "",
    slug: "",
    description: "",
    story: "",
    imageUrl: "",
    inventionImage: "",
    xpThreshold: "",
    rarityLevel: "",
    categoryId: "",
    entityType: "person",
    personType: "inventor",
    placeType: "city",
    eventType: "war",
    traditionType: "holiday",
    conceptType: "movement",
    birthYear: "",
    endYear: "",
    country: "",
    achievements: "",
    metadata: {},
  });

  const [trOpen, setTrOpen] = useState(false);
  const [editingTr, setEditingTr] = useState<CharacterTranslationAdmin | null>(
    null,
  );
  const [trForm, setTrForm] = useState({
    language: "",
    name: "",
    description: "",
    story: "",
  });

  // Lessons management state
  const [characterLessons, setCharacterLessons] = useState<
    CharacterLessonAdmin[]
  >([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [lessonsLoading, setLessonsLoading] = useState(false);

  const load = useCallback(async () => {
    const token = getAdminToken();
    if (!token || !characterId) return;
    setLoading(true);
    try {
      const [c, cats, less, charLess] = await Promise.all([
        getAdminCharacter(token, characterId),
        getAdminCategories(token),
        getAdminLessons(token, "all"),
        getCharacterLessons(token, characterId),
      ]);
      setCharacter(c);
      setCategories(cats);
      setLessons(less);
      setCharacterLessons(charLess);
      setForm({
        name: c.name,
        slug: c.slug,
        description: c.description,
        story: c.story ?? "",
        imageUrl: c.imageUrl ?? "",
        inventionImage: c.inventionImage ?? "",
        xpThreshold: c.xpThreshold != null ? String(c.xpThreshold) : "",
        rarityLevel: c.rarityLevel ?? "",
        categoryId: c.categories?.[0]?.category?.id ?? "",
        entityType: c.entityType ?? "person",
        personType: c.personType ?? "inventor",
        placeType: c.placeType ?? "city",
        eventType: c.eventType ?? "war",
        traditionType: c.traditionType ?? "holiday",
        conceptType: c.conceptType ?? "movement",
        birthYear: c.birthYear != null ? String(c.birthYear) : "",
        endYear: c.endYear != null ? String(c.endYear) : "",
        country: c.country ?? "",
        achievements: Array.isArray(c.achievements)
          ? c.achievements.join(", ")
          : "",
        metadata: (c.metadata as Record<string, any>) ?? {},
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load character");
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSaveDetails() {
    const token = getAdminToken();
    if (!token || !character) return;
    setSaving(true);
    try {
      await updateAdminCharacter(token, character.id, {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim(),
        story: form.story.trim() || null,
        imageUrl: form.imageUrl.trim() || "",
        inventionImage: form.inventionImage.trim() || "",
        xpThreshold: form.xpThreshold.trim() ? Number(form.xpThreshold) : null,
        rarityLevel: form.rarityLevel.trim() || null,
        categoryId: form.categoryId || null,
        entityType: form.entityType || "person",
        personType: form.entityType === "person" ? form.personType : null,
        placeType: form.entityType === "place" ? form.placeType : null,
        eventType: form.entityType === "event" ? form.eventType : null,
        traditionType:
          form.entityType === "tradition" ? form.traditionType : null,
        conceptType: form.entityType === "concept" ? form.conceptType : null,
        birthYear: form.birthYear.trim() ? Number(form.birthYear) : null,
        endYear: form.endYear.trim() ? Number(form.endYear) : null,
        country: form.country.trim() || null,
        achievements: form.achievements.trim()
          ? form.achievements
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
        metadata: form.metadata || {},
      });
      toast.success("Character saved");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Lessons management functions
  async function assignLesson() {
    const token = getAdminToken();
    if (!token || !character || !selectedLessonId) {
      toast.error("Missing required data");
      return;
    }
    setLessonsLoading(true);
    try {
      await assignLessonToCharacter(token, character.id, {
        lessonId: selectedLessonId,
      });
      toast.success("Lesson assigned");
      setAssignDialogOpen(false);
      setSelectedLessonId("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to assign lesson");
    } finally {
      setLessonsLoading(false);
    }
  }

  async function removeLesson(charLessonId: string) {
    if (!confirm("Remove this lesson from the character?")) return;
    const token = getAdminToken();
    if (!token || !character) return;
    setLessonsLoading(true);
    try {
      await removeCharacterLesson(token, character.id, charLessonId);
      toast.success("Lesson removed");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove lesson");
    } finally {
      setLessonsLoading(false);
    }
  }

  async function reorderLesson(charLessonId: string, newOrder: number) {
    const token = getAdminToken();
    if (!token || !character) return;
    setLessonsLoading(true);
    try {
      await updateCharacterLessonOrder(
        token,
        character.id,
        charLessonId,
        newOrder,
      );
      toast.success("Lesson order updated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update order");
    } finally {
      setLessonsLoading(false);
    }
  }

  function openNewTr() {
    setEditingTr(null);
    setTrForm({ language: "", name: "", description: "", story: "" });
    setTrOpen(true);
  }

  function openEditTr(t: CharacterTranslationAdmin) {
    setEditingTr(t);
    setTrForm({
      language: t.language,
      name: t.name,
      description: t.description,
      story: t.story ?? "",
    });
    setTrOpen(true);
  }

  async function saveTr() {
    const token = getAdminToken();
    if (!token || !character) return;
    const payload = {
      language: trForm.language.trim(),
      name: trForm.name.trim(),
      description: trForm.description.trim(),
      story: trForm.story.trim() || null,
    };
    if (!payload.language || !payload.name || !payload.description) {
      toast.error("Language, name and description are required");
      return;
    }
    try {
      if (editingTr) {
        await updateCharacterTranslation(token, editingTr.id, payload);
        toast.success("Translation updated");
      } else {
        await createCharacterTranslation(token, character.id, payload);
        toast.success("Translation created");
      }
      setTrOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function removeTr(t: CharacterTranslationAdmin) {
    if (!confirm(`Delete ${t.language} translation?`)) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await deleteCharacterTranslation(token, t.id);
      toast.success("Translation deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function removeCharacter() {
    if (!character) return;
    if (!confirm(`Delete character “${character.name}”?`)) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await deleteAdminCharacter(token, character.id);
      toast.success("Character deleted");
      router.replace("/content/characters");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading || !character) {
    return <p className="text-sm text-muted-foreground">Loading character…</p>;
  }

  const translations = character.translations ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.back()}
            title="Go back to characters"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{character.name}</h2>
            <p className="text-sm text-muted-foreground">
              Slug: {character.slug}
            </p>
          </div>
        </div>
        <Button variant="destructive" onClick={() => void removeCharacter()}>
          Delete character
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="lessons">
            Lessons ({characterLessons.length})
          </TabsTrigger>
          <TabsTrigger value="translations">
            Translations ({translations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Default language copy shown in the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Story</Label>
                <Textarea
                  value={form.story}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, story: e.target.value }))
                  }
                />
              </div>

              <hr className="my-2" />
              <h3 className="font-semibold text-sm">Character Details</h3>

              <div className="grid gap-2">
                <Label>Entity Type</Label>
                <NativeSelect
                  value={form.entityType}
                  onChange={(e: any) =>
                    setForm((f) => ({ ...f, entityType: e.target.value }))
                  }
                  className="w-full min-w-0"
                >
                  <NativeSelectOption value="person">Person</NativeSelectOption>
                  <NativeSelectOption value="place">Place</NativeSelectOption>
                  <NativeSelectOption value="event">Event</NativeSelectOption>
                  <NativeSelectOption value="tradition">
                    Tradition
                  </NativeSelectOption>
                  <NativeSelectOption value="concept">
                    Concept
                  </NativeSelectOption>
                </NativeSelect>
              </div>

              {/* Person Type Selector */}
              {form.entityType === "person" && (
                <div className="grid gap-2">
                  <Label>Person Type</Label>
                  <NativeSelect
                    value={form.personType}
                    onChange={(e: any) =>
                      setForm((f) => ({ ...f, personType: e.target.value }))
                    }
                    className="w-full min-w-0"
                  >
                    <NativeSelectOption value="inventor">
                      Inventor
                    </NativeSelectOption>
                    <NativeSelectOption value="doctor">
                      Doctor
                    </NativeSelectOption>
                    <NativeSelectOption value="singer">
                      Singer
                    </NativeSelectOption>
                    <NativeSelectOption value="artist">
                      Artist
                    </NativeSelectOption>
                    <NativeSelectOption value="scientist">
                      Scientist
                    </NativeSelectOption>
                    <NativeSelectOption value="philosopher">
                      Philosopher
                    </NativeSelectOption>
                    <NativeSelectOption value="athlete">
                      Athlete
                    </NativeSelectOption>
                    <NativeSelectOption value="activist">
                      Activist
                    </NativeSelectOption>
                    <NativeSelectOption value="leader">
                      Leader
                    </NativeSelectOption>
                  </NativeSelect>
                </div>
              )}

              {/* Place Type Selector */}
              {form.entityType === "place" && (
                <div className="grid gap-2">
                  <Label>Place Type</Label>
                  <NativeSelect
                    value={form.placeType}
                    onChange={(e: any) =>
                      setForm((f) => ({ ...f, placeType: e.target.value }))
                    }
                    className="w-full min-w-0"
                  >
                    <NativeSelectOption value="city">City</NativeSelectOption>
                    <NativeSelectOption value="country">
                      Country
                    </NativeSelectOption>
                    <NativeSelectOption value="region">
                      Region
                    </NativeSelectOption>
                    <NativeSelectOption value="monument">
                      Monument
                    </NativeSelectOption>
                    <NativeSelectOption value="institution">
                      Institution
                    </NativeSelectOption>
                  </NativeSelect>
                </div>
              )}

              {/* Event Type Selector */}
              {form.entityType === "event" && (
                <div className="grid gap-2">
                  <Label>Event Type</Label>
                  <NativeSelect
                    value={form.eventType}
                    onChange={(e: any) =>
                      setForm((f) => ({ ...f, eventType: e.target.value }))
                    }
                    className="w-full min-w-0"
                  >
                    <NativeSelectOption value="war">War</NativeSelectOption>
                    <NativeSelectOption value="revolution">
                      Revolution
                    </NativeSelectOption>
                    <NativeSelectOption value="discovery">
                      Discovery
                    </NativeSelectOption>
                    <NativeSelectOption value="cultural_event">
                      Cultural Event
                    </NativeSelectOption>
                    <NativeSelectOption value="natural_disaster">
                      Natural Disaster
                    </NativeSelectOption>
                  </NativeSelect>
                </div>
              )}

              {/* Tradition Type Selector */}
              {form.entityType === "tradition" && (
                <div className="grid gap-2">
                  <Label>Tradition Type</Label>
                  <NativeSelect
                    value={form.traditionType}
                    onChange={(e: any) =>
                      setForm((f) => ({ ...f, traditionType: e.target.value }))
                    }
                    className="w-full min-w-0"
                  >
                    <NativeSelectOption value="holiday">
                      Holiday
                    </NativeSelectOption>
                    <NativeSelectOption value="ritual">
                      Ritual
                    </NativeSelectOption>
                    <NativeSelectOption value="art_form">
                      Art Form
                    </NativeSelectOption>
                    <NativeSelectOption value="belief_system">
                      Belief System
                    </NativeSelectOption>
                    <NativeSelectOption value="festival">
                      Festival
                    </NativeSelectOption>
                  </NativeSelect>
                </div>
              )}

              {/* Concept Type Selector */}
              {form.entityType === "concept" && (
                <div className="grid gap-2">
                  <Label>Concept Type</Label>
                  <NativeSelect
                    value={form.conceptType}
                    onChange={(e: any) =>
                      setForm((f) => ({ ...f, conceptType: e.target.value }))
                    }
                    className="w-full min-w-0"
                  >
                    <NativeSelectOption value="movement">
                      Movement
                    </NativeSelectOption>
                    <NativeSelectOption value="philosophy">
                      Philosophy
                    </NativeSelectOption>
                    <NativeSelectOption value="technology">
                      Technology
                    </NativeSelectOption>
                    <NativeSelectOption value="culture">
                      Culture
                    </NativeSelectOption>
                  </NativeSelect>
                </div>
              )}

              {/* Years for applicable types */}
              {["person", "place", "event", "tradition"].includes(
                form.entityType,
              ) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Start Year (optional)</Label>
                    <Input
                      type="number"
                      value={form.birthYear}
                      onChange={(e: any) =>
                        setForm((f) => ({ ...f, birthYear: e.target.value }))
                      }
                      placeholder="e.g., 1847"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>End Year (optional)</Label>
                    <Input
                      type="number"
                      value={form.endYear}
                      onChange={(e: any) =>
                        setForm((f) => ({ ...f, endYear: e.target.value }))
                      }
                      placeholder="Leave empty if ongoing"
                    />
                  </div>
                </div>
              )}

              {/* Country for applicable types */}
              {["person", "place", "event"].includes(form.entityType) && (
                <div className="grid gap-2">
                  <Label>Country (optional)</Label>
                  <Input
                    value={form.country}
                    onChange={(e: any) =>
                      setForm((f) => ({ ...f, country: e.target.value }))
                    }
                    placeholder="e.g., USA, Ghana, Haiti"
                  />
                </div>
              )}

              {/* Achievements for people */}
              {form.entityType === "person" && (
                <div className="grid gap-2">
                  <Label>Achievements (optional)</Label>
                  <Textarea
                    value={form.achievements}
                    onChange={(e: any) =>
                      setForm((f) => ({ ...f, achievements: e.target.value }))
                    }
                    placeholder="Comma-separated list"
                    className="min-h-16"
                  />
                </div>
              )}

              {/* Type-Specific Metadata Fields */}
              {form.entityType === "person" &&
                form.personType === "inventor" && (
                  <div className="grid gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Label className="font-semibold text-blue-900">
                      Invention Name (optional)
                    </Label>
                    <Input
                      value={form.metadata?.invention || ""}
                      onChange={(e: any) =>
                        setForm((f) => ({
                          ...f,
                          metadata: {
                            ...f.metadata,
                            invention: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g., Light Bulb"
                    />
                  </div>
                )}

              {form.entityType === "person" && form.personType === "doctor" && (
                <div className="grid gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Label className="font-semibold text-green-900">
                    Medical Specialty (optional)
                  </Label>
                  <Input
                    value={form.metadata?.specialty || ""}
                    onChange={(e: any) =>
                      setForm((f) => ({
                        ...f,
                        metadata: { ...f.metadata, specialty: e.target.value },
                      }))
                    }
                    placeholder="e.g., Vaccine Development"
                  />
                </div>
              )}

              {form.entityType === "person" && form.personType === "singer" && (
                <div className="grid gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Label className="font-semibold text-purple-900">
                    Music Genre (optional)
                  </Label>
                  <Input
                    value={form.metadata?.genre || ""}
                    onChange={(e: any) =>
                      setForm((f) => ({
                        ...f,
                        metadata: { ...f.metadata, genre: e.target.value },
                      }))
                    }
                    placeholder="e.g., Jazz, Classical"
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Rarity</Label>
                  <Input
                    value={form.rarityLevel}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, rarityLevel: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>XP threshold</Label>
                  <Input
                    type="number"
                    value={form.xpThreshold}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, xpThreshold: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Portrait image URL</Label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Invention image URL</Label>
                <Input
                  value={form.inventionImage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, inventionImage: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <NativeSelect
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryId: e.target.value }))
                  }
                  className="w-full min-w-0"
                >
                  <NativeSelectOption value="">None</NativeSelectOption>
                  {categories.map((c) => (
                    <NativeSelectOption key={c.id} value={c.id}>
                      {c.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <Button onClick={() => void onSaveDetails()} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Character Stories</CardTitle>
                <CardDescription>
                  Lessons assigned to this character, ordered for progression.
                </CardDescription>
              </div>
              <Button
                onClick={() => setAssignDialogOpen(true)}
                disabled={lessonsLoading}
              >
                <Plus className="size-4" />
                Assign lesson
              </Button>
            </CardHeader>
            <CardContent>
              {characterLessons.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No lessons assigned yet. Click "Assign lesson" to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {characterLessons
                    .sort((a, b) => a.order - b.order)
                    .map((charLesson, index) => (
                      <div
                        key={charLesson.id}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/20 text-primary font-medium text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {charLesson.lesson.title}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {charLesson.lesson.description || "No description"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              void reorderLesson(
                                charLesson.id,
                                charLesson.order - 1,
                              )
                            }
                            disabled={lessonsLoading || index === 0}
                            title="Move up"
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              void reorderLesson(
                                charLesson.id,
                                charLesson.order + 1,
                              )
                            }
                            disabled={
                              lessonsLoading ||
                              index === characterLessons.length - 1
                            }
                            title="Move down"
                          >
                            <ArrowDown className="size-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => void removeLesson(charLesson.id)}
                            disabled={lessonsLoading}
                            title="Remove lesson"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="translations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Localized fields</CardTitle>
                <CardDescription>
                  Name, description, and story per language.
                </CardDescription>
              </div>
              <Button onClick={openNewTr}>
                <Plus className="size-4" />
                Add translation
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Language</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {translations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>No translations yet.</TableCell>
                    </TableRow>
                  ) : (
                    translations.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          {t.language}
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {t.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditTr(t)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon-sm"
                              onClick={() => removeTr(t)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign lesson to character</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Select lesson</Label>
              <NativeSelect
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full min-w-0"
              >
                <NativeSelectOption value="">
                  Choose a lesson...
                </NativeSelectOption>
                {lessons
                  .filter(
                    (l) => !characterLessons.some((cl) => cl.lessonId === l.id),
                  )
                  .map((l) => (
                    <NativeSelectOption key={l.id} value={l.id}>
                      {l.title}
                    </NativeSelectOption>
                  ))}
              </NativeSelect>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void assignLesson()}
              disabled={lessonsLoading || !selectedLessonId}
            >
              {lessonsLoading ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={trOpen} onOpenChange={setTrOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingTr ? "Edit translation" : "New translation"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 overflow-y-auto flex-1">
            <div className="grid gap-2">
              <Label>Language code</Label>
              <Input
                value={trForm.language}
                onChange={(e) =>
                  setTrForm((f) => ({ ...f, language: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={trForm.name}
                onChange={(e) =>
                  setTrForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={trForm.description}
                onChange={(e) =>
                  setTrForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Story</Label>
              <Textarea
                value={trForm.story}
                onChange={(e) =>
                  setTrForm((f) => ({ ...f, story: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setTrOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveTr()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
