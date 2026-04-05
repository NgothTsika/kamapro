"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileUpload } from "@/components/file-upload";
import { getAdminToken } from "@/lib/admin-auth";
import {
  createAdminCharacter,
  deleteAdminCharacter,
  getAdminCategories,
  getAdminCharacters,
  getAdminLessons,
} from "@/lib/kama-api";
import type {
  AdminCategory,
  AdminCharacter,
  AdminLessonSummary,
} from "@/lib/kama-types";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  story: "",
  imageUrl: "",
  inventionImage: "",
  xpThreshold: "",
  rarityLevel: "",
  categoryIds: [] as string[],
  unlockLessonId: "",
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
};

export default function CharactersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminCharacter[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [lessons, setLessons] = useState<AdminLessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCharacter | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    character: AdminCharacter | null;
  }>({
    open: false,
    character: null,
  });
  const [form, setForm] = useState<{
    name: string;
    slug: string;
    description: string;
    story: string;
    imageUrl: string;
    inventionImage: string;
    xpThreshold: string;
    rarityLevel: string;
    categoryIds: string[];
    unlockLessonId: string;
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
  }>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;
    setLoading(true);
    try {
      const [chars, cats, less] = await Promise.all([
        getAdminCharacters(token),
        getAdminCategories(token),
        getAdminLessons(token, "all"),
      ]);
      setRows(chars);
      setCategories(cats);
      setLessons(less);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load characters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setForm(emptyForm);
    setOpen(true);
  }

  async function onSave() {
    const token = getAdminToken();
    if (!token) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim(),
        story: form.story.trim() || null,
        imageUrl: form.imageUrl.trim() || "",
        inventionImage: form.inventionImage.trim() || "",
        xpThreshold: form.xpThreshold.trim() ? Number(form.xpThreshold) : null,
        rarityLevel: form.rarityLevel.trim() || null,
        categoryIds: form.categoryIds,
        unlockLessonId: form.unlockLessonId || null,
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
      };
      await createAdminCharacter(token, payload);
      toast.success("Character created");
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: AdminCharacter) {
    if (!confirm(`Delete character “${row.name}”?`)) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await deleteAdminCharacter(token, row.id);
      toast.success("Character deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.back()}
            title="Go back to content"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <CardTitle>Characters</CardTitle>
            <CardDescription>
              Figures and collectibles unlocked through lessons.
            </CardDescription>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add character
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unlock lesson</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading...</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No characters yet.</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="w-12">
                    {row.imageUrl ? (
                      <img
                        src={row.imageUrl}
                        alt={row.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.slug}
                  </TableCell>
                  <TableCell>
                    {row.categories?.length > 0
                      ? row.categories.map((cc) => cc.category.name).join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell>{row.unlockLesson?.title ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon-sm" asChild>
                        <Link href={`/content/characters/${row.id}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() =>
                          setDeleteDialog({ open: true, character: row })
                        }
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>New character</DialogTitle>
            <DialogDescription>
              Create a new character with details, media, and metadata.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 overflow-y-auto flex-1">
            {/* Basic Information Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Basic Information</h3>
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Character name"
                />
              </div>
              <div className="grid gap-2">
                <Label>Slug (optional)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  placeholder="auto-generated if empty"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description *</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Brief summary"
                  className="min-h-20"
                />
              </div>
              <div className="grid gap-2">
                <Label>Story (optional)</Label>
                <Textarea
                  value={form.story}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, story: e.target.value }))
                  }
                  placeholder="Full biography or narrative"
                  className="min-h-20"
                />
              </div>
            </div>

            {/* Character Type & Metadata Section */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold text-sm">Character Profile</h3>

              {/* Entity Type Selector */}
              <div className="grid gap-2">
                <Label>Entity Type *</Label>
                <NativeSelect
                  value={form.entityType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setForm((f) => ({
                      ...f,
                      entityType: newType,
                      // Reset specific type when entity type changes
                      personType: newType === "person" ? f.personType : "",
                      placeType: newType === "place" ? f.placeType : "",
                      eventType: newType === "event" ? f.eventType : "",
                      traditionType:
                        newType === "tradition" ? f.traditionType : "",
                      conceptType: newType === "concept" ? f.conceptType : "",
                    }));
                  }}
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
                  <Label>Person Type *</Label>
                  <NativeSelect
                    value={form.personType}
                    onChange={(e) =>
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
                  <Label>Place Type *</Label>
                  <NativeSelect
                    value={form.placeType}
                    onChange={(e) =>
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
                  <Label>Event Type *</Label>
                  <NativeSelect
                    value={form.eventType}
                    onChange={(e) =>
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
                  <Label>Tradition Type *</Label>
                  <NativeSelect
                    value={form.traditionType}
                    onChange={(e) =>
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
                  <Label>Concept Type *</Label>
                  <NativeSelect
                    value={form.conceptType}
                    onChange={(e) =>
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

              {/* Show Years Only for Historical Types */}
              {["person", "place", "event", "tradition"].includes(
                form.entityType,
              ) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Start Year (optional)</Label>
                    <Input
                      type="number"
                      value={form.birthYear}
                      onChange={(e) =>
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
                      onChange={(e) =>
                        setForm((f) => ({ ...f, endYear: e.target.value }))
                      }
                      placeholder="Leave empty if ongoing"
                    />
                  </div>
                </div>
              )}

              {/* Country Field for Applicable Types */}
              {["person", "place", "event"].includes(form.entityType) && (
                <div className="grid gap-2">
                  <Label>Country (optional)</Label>
                  <Input
                    value={form.country}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, country: e.target.value }))
                    }
                    placeholder="e.g., USA, Ghana, Haiti"
                  />
                </div>
              )}

              {/* Achievements for People */}
              {form.entityType === "person" && (
                <div className="grid gap-2">
                  <Label>Achievements (optional)</Label>
                  <Textarea
                    value={form.achievements}
                    onChange={(e) =>
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
                      onChange={(e) =>
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
                    onChange={(e) =>
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
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        metadata: { ...f.metadata, genre: e.target.value },
                      }))
                    }
                    placeholder="e.g., Jazz, Classical"
                  />
                </div>
              )}

              {form.entityType === "person" &&
                ["activist", "leader"].includes(form.personType) && (
                  <div className="grid gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <Label className="font-semibold text-red-900">
                      Cause/Movement (optional)
                    </Label>
                    <Input
                      value={form.metadata?.cause || ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          metadata: { ...f.metadata, cause: e.target.value },
                        }))
                      }
                      placeholder="e.g., Civil Rights, Pan-Africanism"
                    />
                  </div>
                )}

              {form.entityType === "tradition" &&
                form.traditionType === "art_form" && (
                  <div className="grid gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Label className="font-semibold text-yellow-900">
                      Art Form Origin (optional)
                    </Label>
                    <Input
                      value={form.metadata?.origin || ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          metadata: { ...f.metadata, origin: e.target.value },
                        }))
                      }
                      placeholder="e.g., West Africa, African Diaspora"
                    />
                  </div>
                )}
            </div>

            {/* Organization & Media Section */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold text-sm">Organization</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Rarity</Label>
                  <NativeSelect
                    value={form.rarityLevel}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, rarityLevel: e.target.value }))
                    }
                    className="w-full min-w-0"
                  >
                    <NativeSelectOption value="">None</NativeSelectOption>
                    <NativeSelectOption value="common">
                      Common
                    </NativeSelectOption>
                    <NativeSelectOption value="uncommon">
                      Uncommon
                    </NativeSelectOption>
                    <NativeSelectOption value="rare">Rare</NativeSelectOption>
                    <NativeSelectOption value="epic">Epic</NativeSelectOption>
                    <NativeSelectOption value="legendary">
                      Legendary
                    </NativeSelectOption>
                  </NativeSelect>
                </div>
                <div className="grid gap-2">
                  <Label>XP threshold</Label>
                  <Input
                    type="number"
                    value={form.xpThreshold}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, xpThreshold: e.target.value }))
                    }
                    placeholder="Points to unlock"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Categories (select multiple)</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No categories available
                    </p>
                  ) : (
                    categories.map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`category-${c.id}`}
                          checked={form.categoryIds.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm((f) => ({
                                ...f,
                                categoryIds: [...f.categoryIds, c.id],
                              }));
                            } else {
                              setForm((f) => ({
                                ...f,
                                categoryIds: f.categoryIds.filter(
                                  (id) => id !== c.id,
                                ),
                              }));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label
                          htmlFor={`category-${c.id}`}
                          className="font-normal cursor-pointer"
                        >
                          {c.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Unlock via lesson</Label>
                <NativeSelect
                  value={form.unlockLessonId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unlockLessonId: e.target.value }))
                  }
                  className="w-full min-w-0"
                >
                  <NativeSelectOption value="">None</NativeSelectOption>
                  {lessons.map((l) => (
                    <NativeSelectOption key={l.id} value={l.id}>
                      {l.title}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>

            {/* Media Section */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold text-sm">Media</h3>
              <div className="grid gap-2">
                <Label>Portrait image</Label>
                <FileUpload
                  bucket="character-images"
                  folder="portraits"
                  accepts="image"
                  currentValue={form.imageUrl}
                  onUploadComplete={(url) => {
                    setForm((f) => ({ ...f, imageUrl: url }));
                  }}
                />
                <div className="text-sm text-gray-500 mt-2">
                  Or paste external URL:
                </div>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Invention/Related image</Label>
                <FileUpload
                  bucket="character-images"
                  folder="inventions"
                  accepts="image"
                  currentValue={form.inventionImage}
                  onUploadComplete={(url) => {
                    setForm((f) => ({ ...f, inventionImage: url }));
                  }}
                />
                <div className="text-sm text-gray-500 mt-2">
                  Or paste external URL:
                </div>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={form.inventionImage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, inventionImage: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void onSave()}
              disabled={saving || !form.name.trim() || !form.description.trim()}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Character</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteDialog.character?.name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog.character)
                  void onDelete(deleteDialog.character);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
