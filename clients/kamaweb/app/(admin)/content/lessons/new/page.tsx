"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/file-upload";
import { getAdminToken } from "@/lib/admin-auth";
import {
  createAdminLesson,
  getAdminCategories,
  getAdminTopics,
  getAdminCharacters,
} from "@/lib/kama-api";
import type {
  AdminCategory,
  AdminTopic,
  AdminCharacter,
} from "@/lib/kama-types";

export default function NewLessonPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [characters, setCharacters] = useState<AdminCharacter[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    content: "",
    hook: "",
    coverImage: "",
    xpReward: "10",
    order: "0",
    published: false,
    isPremium: false,
    categoryId: "",
    topicId: "",
    characterIds: [] as string[],
    titleAudioUrl: "", // NEW
    hookAudioUrl: "", // NEW
    contentAudioUrl: "", // NEW
    deepDiveAudioUrl: "", // NEW
  });

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    void Promise.all([
      getAdminCategories(token),
      getAdminTopics(token),
      getAdminCharacters(token),
    ])
      .then(([c, t, ch]) => {
        setCategories(c);
        setTopics(t);
        setCharacters(ch);
      })
      .catch(() => toast.error("Failed to load categories/topics/characters"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) return;
    setSaving(true);
    try {
      const lesson = await createAdminLesson(token, {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || null,
        content: form.content,
        hook: form.hook.trim() || null,
        coverImage: form.coverImage.trim() || "",
        xpReward: Number(form.xpReward) || 10,
        order: Number(form.order) || 0,
        published: form.published,
        isPremium: form.isPremium,
        categoryId: form.categoryId || null,
        topicId: form.topicId || null,
        characterIds: form.characterIds,
        titleAudioUrl: form.titleAudioUrl.trim() || null, // NEW
        hookAudioUrl: form.hookAudioUrl.trim() || null, // NEW
        contentAudioUrl: form.contentAudioUrl.trim() || null, // NEW
        deepDiveAudioUrl: form.deepDiveAudioUrl.trim() || null, // NEW
      });
      toast.success("Lesson created");
      router.replace(`/content/lessons/${lesson.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not create lesson",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.back()}
            title="Go back to lessons"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <CardTitle>New lesson</CardTitle>
            <CardDescription>
              You can add chapters and quizzes after saving. Slug is generated
              from the title if left empty.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug (optional)</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="grid gap-2">
              <Label>Topic</Label>
              <NativeSelect
                value={form.topicId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, topicId: e.target.value }))
                }
                className="w-full min-w-0"
              >
                <NativeSelectOption value="">None</NativeSelectOption>
                {topics.map((t) => (
                  <NativeSelectOption key={t.id} value={t.id}>
                    {t.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Related Characters (optional)</Label>
            <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
              {characters.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No characters available
                </p>
              ) : (
                characters.map((ch) => (
                  <div key={ch.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`char-${ch.id}`}
                      checked={form.characterIds.includes(ch.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm((f) => ({
                            ...f,
                            characterIds: [...f.characterIds, ch.id],
                          }));
                        } else {
                          setForm((f) => ({
                            ...f,
                            characterIds: f.characterIds.filter(
                              (id) => id !== ch.id,
                            ),
                          }));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <label
                      htmlFor={`char-${ch.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {ch.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Short description</Label>
            <Textarea
              id="desc"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hook">Hook</Label>
            <Input
              id="hook"
              value={form.hook}
              onChange={(e) => setForm((f) => ({ ...f, hook: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="titleAudio">Title Audio URL (optional)</Label>
            <Input
              id="titleAudio"
              placeholder="https://..."
              value={form.titleAudioUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, titleAudioUrl: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hookAudio">Hook Audio URL (optional)</Label>
            <Input
              id="hookAudio"
              placeholder="https://..."
              value={form.hookAudioUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, hookAudioUrl: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contentAudio">Content Audio URL (optional)</Label>
            <Input
              id="contentAudio"
              placeholder="https://..."
              value={form.contentAudioUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, contentAudioUrl: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deepDiveAudio">
              Deep Dive Audio URL (optional)
            </Label>
            <Input
              id="deepDiveAudio"
              placeholder="https://..."
              value={form.deepDiveAudioUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, deepDiveAudioUrl: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Body</Label>
            <Textarea
              id="content"
              className="min-h-40"
              value={form.content}
              onChange={(e) =>
                setForm((f) => ({ ...f, content: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cover">Cover image</Label>
            <FileUpload
              bucket="lesson-covers"
              folder="new"
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="xp">XP reward</Label>
              <Input
                id="xp"
                type="number"
                value={form.xpReward}
                onChange={(e) =>
                  setForm((f) => ({ ...f, xpReward: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, order: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="pub"
                checked={form.published}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, published: v }))
                }
              />
              <Label htmlFor="pub">Published</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="prem"
                checked={form.isPremium}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isPremium: v }))
                }
              />
              <Label htmlFor="prem">Premium</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create lesson"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
