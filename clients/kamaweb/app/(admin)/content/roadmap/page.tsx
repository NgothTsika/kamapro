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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  createRoadmapLevel,
  deleteRoadmapLevel,
  getAdminLessons,
  getRoadmapLevels,
  updateRoadmapLevel,
} from "@/lib/kama-api";
import type { AdminLessonSummary, AdminRoadmapLevel } from "@/lib/kama-types";

const emptyForm = {
  title: "",
  description: "",
  symbol: "Adinkra",
  color: "#2f6f4e",
  order: 0,
  isPublished: true,
  lessonIds: [] as string[],
};

export default function RoadmapPage() {
  const router = useRouter();
  const [levels, setLevels] = useState<AdminRoadmapLevel[]>([]);
  const [lessons, setLessons] = useState<AdminLessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRoadmapLevel | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      toast.error("No admin token found");
      return;
    }
    try {
      setLoading(true);
      const [nextLevels, nextLessons] = await Promise.all([
        getRoadmapLevels(token),
        getAdminLessons(token, "all"),
      ]);
      setLevels(nextLevels);
      setLessons(nextLessons);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, order: levels.length });
    setOpen(true);
  }

  function openEdit(level: AdminRoadmapLevel) {
    setEditing(level);
    setForm({
      title: level.title,
      description: level.description ?? "",
      symbol: level.symbol ?? "",
      color: level.color ?? "#2f6f4e",
      order: level.order,
      isPublished: level.isPublished,
      lessonIds: level.lessons.map((lesson) => lesson.id),
    });
    setOpen(true);
  }

  async function onSubmit() {
    if (!form.title.trim()) {
      toast.error("Level title is required");
      return;
    }
    if (form.lessonIds.length === 0) {
      toast.error("Add at least one lesson to this level");
      return;
    }
    const token = getAdminToken();
    if (!token) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      symbol: form.symbol.trim() || null,
      color: form.color.trim() || null,
      order: Number(form.order) || 0,
      isPublished: form.isPublished,
      lessonIds: form.lessonIds,
    };

    try {
      if (editing) {
        await updateRoadmapLevel(token, editing.id, payload);
        toast.success("Roadmap level updated");
      } else {
        await createRoadmapLevel(token, payload);
        toast.success("Roadmap level created");
      }
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    }
  }

  async function onDelete(level: AdminRoadmapLevel) {
    const token = getAdminToken();
    if (!token) return;
    try {
      await deleteRoadmapLevel(token, level.id);
      toast.success("Roadmap level deleted");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  function toggleLesson(lessonId: string) {
    setForm((current) => ({
      ...current,
      lessonIds: current.lessonIds.includes(lessonId)
        ? current.lessonIds.filter((id) => id !== lessonId)
        : [...current.lessonIds, lessonId],
    }));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <CardTitle>Learning roadmap</CardTitle>
            <CardDescription>
              Build Duolingo-style levels and add lessons to each level.
            </CardDescription>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New level
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Lessons</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading roadmap...</TableCell>
              </TableRow>
            ) : levels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No roadmap levels yet.</TableCell>
              </TableRow>
            ) : (
              levels.map((level) => (
                <TableRow key={level.id}>
                  <TableCell>{level.order}</TableCell>
                  <TableCell>
                    <div className="font-medium">{level.title}</div>
                    <div className="text-muted-foreground line-clamp-1 text-sm">
                      {level.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className="inline-flex rounded px-2 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: level.color ?? "#2f6f4e" }}
                    >
                      {level.symbol || "Symbol"}
                    </span>
                  </TableCell>
                  <TableCell>{level.lessonCount}</TableCell>
                  <TableCell>
                    {level.isPublished ? "Published" : "Draft"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(level)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void onDelete(level)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit level" : "Create level"}</DialogTitle>
            <DialogDescription>
              Choose the level identity, order, and the lessons learners should
              complete inside it.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="symbol">African symbol label</Label>
                <Input
                  id="symbol"
                  value={form.symbol}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      symbol: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={form.color}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      color: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={form.order}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      order: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.isPublished}
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    isPublished: Boolean(checked),
                  }))
                }
              />
              Published
            </label>

            <div className="grid gap-2">
              <Label>Lessons in this level</Label>
              <div className="grid max-h-72 gap-2 overflow-y-auto rounded-md border p-3">
                {lessons.map((lesson) => (
                  <label
                    key={lesson.id}
                    className="flex items-start gap-3 rounded-md p-2 hover:bg-muted"
                  >
                    <Checkbox
                      checked={form.lessonIds.includes(lesson.id)}
                      onCheckedChange={() => toggleLesson(lesson.id)}
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        {lesson.title}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {lesson.published ? "Published" : "Draft"} -{" "}
                        {lesson.xpReward} XP
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void onSubmit()}>
              {editing ? "Save changes" : "Create level"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
