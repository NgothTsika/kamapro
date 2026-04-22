"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  getAdminLesson,
  getChapterWithSteps,
  deleteChapterStep,
  deleteAdminChapter,
} from "@/lib/kama-api";
import type { AdminLessonDetail, InteractiveChapter } from "@/lib/kama-types";

export default function ChaptersPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<AdminLessonDetail | null>(null);
  const [chapters, setChapters] = useState<InteractiveChapter[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;

    try {
      const data = await getAdminLesson(token, lessonId);
      setLesson(data);

      // Load chapters with their steps
      if (data.chapters && data.chapters.length > 0) {
        const chaptersWithSteps = await Promise.all(
          data.chapters.map((ch: any) =>
            getChapterWithSteps(token, ch.id).catch(() => ch),
          ),
        );
        setChapters(chaptersWithSteps);
      } else {
        setChapters([]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load lesson");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteChapter(chapterId: string, title: string) {
    if (!confirm(`Delete chapter "${title}" and all its steps?`)) return;

    const token = getAdminToken();
    if (!token) return;

    try {
      // Delete all steps first
      const chapter = chapters.find((c) => c.id === chapterId);
      if (chapter && chapter.steps) {
        for (const step of chapter.steps) {
          await deleteChapterStep(token, lessonId, chapterId, step.id);
        }
      }

      await deleteAdminChapter(token, chapterId);
      toast.success("Chapter deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading chapters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {lesson?.title} - Interactive Chapters
            </h1>
            <p className="text-muted-foreground">
              Manage chapters and their learning steps
            </p>
          </div>
        </div>
        <Button
          onClick={() =>
            router.push(`/content/lessons/${lessonId}/chapters/new`)
          }
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Chapter
        </Button>
      </div>

      {chapters.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No chapters yet. Create your first chapter to add interactive
            learning steps.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Chapters</CardTitle>
            <CardDescription>
              {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-25">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapters.map((chapter) => (
                  <TableRow key={chapter.id}>
                    <TableCell className="font-medium">
                      {chapter.order}
                    </TableCell>
                    <TableCell>{chapter.title}</TableCell>
                    <TableCell>{chapter.steps?.length || 0} steps</TableCell>
                    <TableCell>
                      {new Date(chapter.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/content/lessons/${lessonId}/chapters/${chapter.id}`,
                          )
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteChapter(chapter.id, chapter.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
