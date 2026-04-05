"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
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
  createAdminTopic,
  deleteAdminTopic,
  getAdminTopics,
  updateAdminTopic,
} from "@/lib/kama-api";
import type { AdminTopic } from "@/lib/kama-types";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  coverImage: "",
  parentId: "",
};

export default function TopicsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTopic | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    topic: AdminTopic | null;
  }>({
    open: false,
    topic: null,
  });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await getAdminTopics(token);
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load topics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(row: AdminTopic) {
    setEditing(row);
    setForm({
      name: row.name,
      slug: row.slug,
      description: row.description ?? "",
      coverImage: row.coverImage ?? "",
      parentId: row.parentId ?? "",
    });
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
        description: form.description.trim() || null,
        coverImage: form.coverImage.trim() || null,
        parentId: form.parentId ? form.parentId : null,
      };
      if (editing) {
        await updateAdminTopic(token, editing.id, payload);
        toast.success("Topic updated");
      } else {
        await createAdminTopic(token, payload);
        toast.success("Topic created");
      }
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: AdminTopic) {
    if (!confirm(`Delete topic “${row.name}”?`)) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await deleteAdminTopic(token, row.id);
      toast.success("Topic deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const parentOptions = rows.filter((r) => r.id !== editing?.id);

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
            <CardTitle>Topics</CardTitle>
            <CardDescription>
              Optional hierarchy for lessons and quiz pools.
            </CardDescription>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add topic
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>Loading...</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>No topics yet.</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const parent = rows.find((r) => r.id === row.parentId);
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.coverImage ? (
                        <img
                          src={row.coverImage}
                          alt={row.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          —
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.slug}
                    </TableCell>
                    <TableCell>{parent?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() =>
                            setDeleteDialog({ open: true, topic: row })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit topic" : "New topic"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="top-name">Name</Label>
              <Input
                id="top-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="top-slug">Slug (optional)</Label>
              <Input
                id="top-slug"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Parent topic</Label>
              <NativeSelect
                value={form.parentId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parentId: e.target.value }))
                }
                className="w-full min-w-0"
              >
                <NativeSelectOption value="">None</NativeSelectOption>
                {parentOptions.map((p) => (
                  <NativeSelectOption key={p.id} value={p.id}>
                    {p.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="top-desc">Description</Label>
              <Textarea
                id="top-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="top-cover">Cover image</Label>
              <FileUpload
                bucket="lesson-covers"
                folder="topics"
                accepts="image"
                currentValue={form.coverImage}
                onUploadComplete={(url) => {
                  setForm((f) => ({ ...f, coverImage: url }));
                }}
              />
              <div className="text-sm text-gray-500 mt-2">
                Or paste external URL:
              </div>
              <Input
                placeholder="https://example.com/image.jpg"
                value={form.coverImage}
                onChange={(e) =>
                  setForm((f) => ({ ...f, coverImage: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void onSave()}
              disabled={saving || !form.name.trim()}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
