"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminToken } from "@/lib/admin-auth";
import {
  getLessonCollections,
  getLessonCollection,
  createLessonCollection,
  updateLessonCollection,
  deleteLessonCollection,
  getAdminLessons,
} from "@/lib/kama-api";
import type { AdminLessonSummary } from "@/lib/kama-types";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";

interface Collection {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CollectionDetail extends Collection {
  lessons?: Array<{ id: string; title: string }>;
}

const emptyForm = {
  title: "",
  description: "" as string | undefined,
  coverImage: undefined as string | undefined,
  isPublic: true,
  lessonIds: [] as string[],
};

export default function CollectionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Collection[]>([]);
  const [allLessons, setAllLessons] = useState<AdminLessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CollectionDetail | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    collection: Collection | null;
  }>({
    open: false,
    collection: null,
  });

  const load = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      toast.error("No admin token found");
      return;
    }
    try {
      setLoading(true);
      setLoadingLessons(true);
      const collections = await getLessonCollections(token);
      const lessons = await getAdminLessons(token, "all");
      setRows(collections);
      setAllLessons(lessons);
    } catch (e) {
      console.error("Load error:", e);
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
      setLoadingLessons(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  async function openEdit(collection: Collection) {
    const token = getAdminToken();
    if (!token) return;
    try {
      const detail = await getLessonCollection(token, collection.id);
      setEditing(detail);
      setForm({
        title: detail.title,
        description: detail.description,
        coverImage: detail.coverImage,
        isPublic: detail.isPublic,
        lessonIds: detail.lessons?.map((lesson: { id: string }) => lesson.id) || [],
      });
      setOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load collection");
    }
  }

  async function onSubmit() {
    if (!form.title.trim()) {
      toast.error("Collection name is required");
      return;
    }

    if (form.lessonIds.length === 0) {
      toast.error("Please select at least one lesson");
      return;
    }

    const token = getAdminToken();
    if (!token) return;

    try {
      if (editing) {
        await updateLessonCollection(token, editing.id, {
          title: form.title.trim(),
          description: form.description ? form.description.trim() : undefined,
          coverImage: form.coverImage,
          isPublic: form.isPublic,
          lessonIds: form.lessonIds,
        });
        toast.success("Collection updated");
      } else {
        await createLessonCollection(token, {
          title: form.title.trim(),
          description: form.description ? form.description.trim() : undefined,
          coverImage: form.coverImage,
          isPublic: form.isPublic,
          lessonIds: form.lessonIds,
        });
        toast.success("Collection created");
      }
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operation failed");
    }
  }

  async function handleCoverImageChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === "string") {
          setForm((f) => ({ ...f, coverImage: result }));
          toast.success("Cover image selected");
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      toast.error("Failed to read image file");
    }
  }

  function handleCoverImageUrl(url: string) {
    if (!url.trim()) {
      setForm((f) => ({ ...f, coverImage: undefined }));
      return;
    }
    setForm((f) => ({ ...f, coverImage: url.trim() }));
    toast.success("Cover image URL set");
  }

  async function onDelete(collection: Collection) {
    const token = getAdminToken();
    if (!token) return;
    try {
      await deleteLessonCollection(token, collection.id);
      toast.success("Collection deleted");
      setDeleteDialog({ open: false, collection: null });
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
            <CardTitle>Collections</CardTitle>
            <CardDescription>
              Create curated collections of lessons for learning.
            </CardDescription>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New collection
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cover</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Public</TableHead>
              <TableHead className="text-right">Lessons</TableHead>
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
                <TableCell colSpan={6}>No collections yet.</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.coverImage ? (
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                        <img
                          src={row.coverImage}
                          alt={row.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {row.description || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.isPublic ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.itemCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <AlertDialog
                        open={
                          deleteDialog.open &&
                          deleteDialog.collection?.id === row.id
                        }
                        onOpenChange={(isOpen) => {
                          if (!isOpen) {
                            setDeleteDialog({ open: false, collection: null });
                          }
                        }}
                      >
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() =>
                            setDeleteDialog({ open: true, collection: row })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete collection?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will delete "{row.title}" and all its
                              associations. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => onDelete(row)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
            <DialogTitle>
              {editing ? "Edit collection" : "New collection"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the collection details and lessons."
                : "Create a new collection with a selection of lessons."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 overflow-y-auto flex-1">
            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Collection Details</h3>
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g., Kingdom Builders"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Describe this collection..."
                  className="min-h-20"
                />
              </div>
              <div className="grid gap-2">
                <Label>Cover Image (optional)</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="flex-1"
                      placeholder="Upload image file"
                    />
                    {form.coverImage && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setForm((f) => ({ ...f, coverImage: undefined }))
                        }
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-muted-foreground/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>
                  <Input
                    type="url"
                    placeholder="Or paste image URL..."
                    value={
                      form.coverImage && form.coverImage.startsWith("http")
                        ? form.coverImage
                        : ""
                    }
                    onChange={(e) => handleCoverImageUrl(e.target.value)}
                    onBlur={(e) => {
                      if (
                        e.target.value &&
                        !e.target.value.startsWith("http")
                      ) {
                        toast.error("Please enter a valid image URL");
                      }
                    }}
                  />
                </div>
                {form.coverImage && (
                  <div className="mt-2 relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                    <img
                      src={form.coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={() => {
                        toast.error("Failed to load image");
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="collection-public"
                  checked={form.isPublic}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, isPublic: checked === true }))
                  }
                />
                <Label htmlFor="collection-public">
                  Public collection for the mobile app
                </Label>
              </div>
            </div>

            {/* Lesson Selection */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold text-sm">
                Lessons ({form.lessonIds.length} selected)
              </h3>

              <div className="border rounded-lg p-3 max-h-75 overflow-y-auto space-y-2">
                {loadingLessons ? (
                  <div className="text-sm text-muted-foreground p-2">
                    Loading lessons...
                  </div>
                ) : allLessons.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">
                    No lessons available yet.
                  </div>
                ) : (
                  allLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted"
                    >
                      <Checkbox
                        id={`lesson-${lesson.id}`}
                        checked={form.lessonIds.includes(lesson.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setForm((f) => ({
                              ...f,
                              lessonIds: [...f.lessonIds, lesson.id],
                            }));
                          } else {
                            setForm((f) => ({
                              ...f,
                              lessonIds: f.lessonIds.filter(
                                (id) => id !== lesson.id,
                              ),
                            }));
                          }
                        }}
                      />
                      <label
                        htmlFor={`lesson-${lesson.id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {lesson.title}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={false}
            >
              Cancel
            </Button>
            <Button onClick={onSubmit}>
              {editing ? "Update" : "Create"} collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
