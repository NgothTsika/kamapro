"use client";

import { useCallback, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAdminToken } from "@/lib/admin-auth";
import { createAdminChapter, getAdminLesson } from "@/lib/kama-api";
import type { AdminLessonDetail } from "@/lib/kama-types";

export default function NewChapterPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<AdminLessonDetail | null>(null);
  const [form, setForm] = useState({
    title: "",
    order: "0",
    introText: "",
    introAudioUrl: "",
  });

  const loadLesson = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;

    try {
      const data = await getAdminLesson(token, lessonId);
      setLesson(data);
      const nextOrder = (data.chapters?.length || 0) + 1;
      setForm((f) => ({ ...f, order: String(nextOrder) }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load lesson");
    }
  }, [lessonId]);

  // Load lesson on mount
  useEffect(() => {
    loadLesson();
  }, [loadLesson]);

  async function handleCreate() {
    const token = getAdminToken();
    if (!token || !lesson) return;

    if (!form.title.trim()) {
      toast.error("Chapter title is required");
      return;
    }

    setLoading(true);
    try {
      const chapter = await createAdminChapter(token, lesson.id, {
        title: form.title.trim(),
        order: Number(form.order) || 0,
        content: "", // Will be filled with steps
        introText: form.introText.trim() || null,
        introAudioUrl: form.introAudioUrl.trim() || null,
        mediaType: null,
        mediaUrl: null,
      });
      toast.success("Chapter created");
      router.push(`/content/lessons/${lessonId}/chapters/${chapter.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Interactive Chapter</h1>
          <p className="text-muted-foreground">
            Create a new chapter for {lesson?.title}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chapter Details</CardTitle>
          <CardDescription>
            Enter the basic information for this chapter. You can add learning
            steps after creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Chapter Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Introduction to Kamapro"
            />
          </div>

          <div>
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="introText">Introduction Text</Label>
            <Textarea
              id="introText"
              value={form.introText}
              onChange={(e) =>
                setForm({ ...form, introText: e.target.value })
              }
              placeholder="Optional text shown before the first step"
              rows={5}
            />
          </div>

          <div>
            <Label htmlFor="introAudioUrl">Introduction Audio URL</Label>
            <Input
              id="introAudioUrl"
              value={form.introAudioUrl}
              onChange={(e) =>
                setForm({ ...form, introAudioUrl: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Chapter"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
