"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Zap } from "lucide-react";
import {
  EnhancedQuizDialog,
  type QuizFormData,
  type QuizType,
} from "@/components/quiz/enhanced-quiz-dialog";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  createLessonTranslation,
  createAdminChapter,
  createAdminQuiz,
  createQuizTranslation,
  deleteAdminChapter,
  deleteAdminLesson,
  deleteLessonTranslation,
  deleteAdminQuiz,
  deleteQuizTranslation,
  getAdminCategories,
  getAdminLesson,
  getLessonTranslations,
  getAdminTopics,
  getQuizTranslations,
  updateLessonTranslation,
  updateAdminChapter,
  updateAdminLesson,
  updateAdminQuiz,
  updateQuizTranslation,
  getAdminCharacters,
} from "@/lib/kama-api";
import type {
  AdminCategory,
  AdminLessonDetail,
  AdminTopic,
  Chapter,
  LessonTranslationAdmin,
  QuizAdmin,
  QuizTranslationAdmin,
  AdminCharacter,
} from "@/lib/kama-types";

export default function EditLessonPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const router = useRouter();

  const [lesson, setLesson] = useState<AdminLessonDetail | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [characters, setCharacters] = useState<AdminCharacter[]>([]);
  const [loading, setLoading] = useState(true);
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
    deepDiveContent: "",
    titleAudioUrl: "",
    hookAudioUrl: "",
    contentAudioUrl: "",
    deepDiveAudioUrl: "",
    characterIds: [] as string[],
  });

  const [chapterOpen, setChapterOpen] = useState(false);
  const [chapterForm, setChapterForm] = useState({
    title: "",
    content: "",
    order: "0",
    mediaType: "",
    mediaUrl: "",
  });
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  const [quizOpen, setQuizOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizAdmin | null>(null);
  const [translations, setTranslations] = useState<LessonTranslationAdmin[]>(
    [],
  );
  const [translationOpen, setTranslationOpen] = useState(false);
  const [editingTranslation, setEditingTranslation] =
    useState<LessonTranslationAdmin | null>(null);
  const [translationForm, setTranslationForm] = useState({
    language: "",
    title: "",
    description: "",
    content: "",
    hook: "",
    deepDiveContent: "",
  });

  const [quizTrManageOpen, setQuizTrManageOpen] = useState(false);
  const [quizForTr, setQuizForTr] = useState<QuizAdmin | null>(null);
  const [quizTrList, setQuizTrList] = useState<QuizTranslationAdmin[]>([]);
  const [quizTrListLoading, setQuizTrListLoading] = useState(false);
  const [quizTrFormOpen, setQuizTrFormOpen] = useState(false);
  const [editingQuizTr, setEditingQuizTr] =
    useState<QuizTranslationAdmin | null>(null);
  const [quizTrForm, setQuizTrForm] = useState({
    language: "",
    question: "",
    options: "",
    explanation: "",
  });

  const load = useCallback(async () => {
    const token = getAdminToken();
    if (!token || !lessonId) return;
    setLoading(true);
    try {
      const [l, c, t, tr, ch] = await Promise.all([
        getAdminLesson(token, lessonId),
        getAdminCategories(token),
        getAdminTopics(token),
        getLessonTranslations(token, lessonId),
        getAdminCharacters(token),
      ]);
      setLesson(l);
      setCategories(c);
      setTopics(t);
      setTranslations(tr);
      setCharacters(ch);
      setForm({
        title: l.title,
        slug: l.slug,
        description: l.description ?? "",
        content: l.content,
        hook: l.hook ?? "",
        coverImage: l.coverImage ?? "",
        xpReward: String(l.xpReward),
        order: String(l.order),
        published: l.published,
        isPremium: l.isPremium,
        categoryId: l.categoryId ?? "",
        topicId: l.topicId ?? "",
        deepDiveContent: l.deepDiveContent ?? "",
        titleAudioUrl: l.titleAudioUrl ?? "",
        hookAudioUrl: l.hookAudioUrl ?? "",
        contentAudioUrl: l.contentAudioUrl ?? "",
        deepDiveAudioUrl: l.deepDiveAudioUrl ?? "",
        characterIds: l.relatedCharacters?.map((rc) => rc.character.id) ?? [],
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load lesson");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSaveDetails() {
    const token = getAdminToken();
    if (!token || !lesson) return;
    setSaving(true);
    try {
      await updateAdminLesson(token, lesson.id, {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || null,
        content: form.content,
        hook: form.hook.trim() || null,
        coverImage: form.coverImage.trim() || "",
        xpReward: Number(form.xpReward) || 0,
        order: Number(form.order) || 0,
        published: form.published,
        isPremium: form.isPremium,
        categoryId: form.categoryId || null,
        topicId: form.topicId || null,
        deepDiveContent: form.deepDiveContent.trim() || null,
        titleAudioUrl: form.titleAudioUrl.trim() || null,
        hookAudioUrl: form.hookAudioUrl.trim() || null,
        contentAudioUrl: form.contentAudioUrl.trim() || null,
        deepDiveAudioUrl: form.deepDiveAudioUrl.trim() || null,
        characterIds: form.characterIds,
      });
      toast.success("Lesson saved");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function openNewChapter() {
    setEditingChapter(null);
    setChapterForm({
      title: "",
      content: "",
      order: "0",
      mediaType: "",
      mediaUrl: "",
    });
    setChapterOpen(true);
  }

  function openEditChapter(ch: Chapter) {
    setEditingChapter(ch);
    setChapterForm({
      title: ch.title,
      content: ch.content,
      order: String(ch.order),
      mediaType: ch.mediaType ?? "",
      mediaUrl: ch.mediaUrl ?? "",
    });
    setChapterOpen(true);
  }

  async function saveChapter() {
    const token = getAdminToken();
    if (!token || !lesson) return;
    try {
      if (editingChapter) {
        await updateAdminChapter(token, editingChapter.id, {
          title: chapterForm.title.trim(),
          content: chapterForm.content,
          order: Number(chapterForm.order) || 0,
          mediaType: chapterForm.mediaType || null,
          mediaUrl: chapterForm.mediaUrl.trim() || null,
        });
        toast.success("Chapter updated");
      } else {
        await createAdminChapter(token, lesson.id, {
          title: chapterForm.title.trim(),
          content: chapterForm.content,
          order: Number(chapterForm.order) || 0,
          mediaType: chapterForm.mediaType || null,
          mediaUrl: chapterForm.mediaUrl.trim() || null,
        });
        toast.success("Chapter added");
      }
      setChapterOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chapter save failed");
    }
  }

  async function removeChapter(ch: Chapter) {
    if (!confirm(`Delete chapter “${ch.title}”?`)) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await deleteAdminChapter(token, ch.id);
      toast.success("Chapter deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  function openNewQuiz() {
    setEditingQuiz(null);
    setQuizOpen(true);
  }

  function openEditQuiz(q: QuizAdmin) {
    setEditingQuiz(q);
    setQuizOpen(true);
  }

  async function saveQuiz(data: QuizFormData) {
    const token = getAdminToken();
    if (!token || !lesson) return;

    try {
      const payload = {
        question: data.question.trim(),
        options: data.options,
        correctOption: data.correctOption,
        explanation: data.explanation.trim() || null,
        order: data.order,
        heartLimit: data.heartLimit,
        type: data.type,
        optionImages: data.optionImages || null,
        difficulty: data.difficulty || null,
        timeLimitSeconds: data.timeLimitSeconds || null,
      };

      if (editingQuiz) {
        await updateAdminQuiz(token, editingQuiz.id, payload);
        toast.success("Quiz updated");
      } else {
        await createAdminQuiz(token, lesson.id, payload);
        toast.success("Quiz added");
      }
      setQuizOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Quiz save failed");
    }
  }

  async function removeQuiz(q: QuizAdmin) {
    if (!confirm("Delete this quiz question?")) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await deleteAdminQuiz(token, q.id);
      toast.success("Quiz deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  function openNewTranslation() {
    setEditingTranslation(null);
    setTranslationForm({
      language: "",
      title: "",
      description: "",
      content: "",
      hook: "",
      deepDiveContent: "",
    });
    setTranslationOpen(true);
  }

  function openEditTranslation(t: LessonTranslationAdmin) {
    setEditingTranslation(t);
    setTranslationForm({
      language: t.language,
      title: t.title,
      description: t.description ?? "",
      content: t.content,
      hook: t.hook ?? "",
      deepDiveContent: t.deepDiveContent ?? "",
    });
    setTranslationOpen(true);
  }

  async function saveTranslation() {
    const token = getAdminToken();
    if (!token || !lesson) return;

    const payload = {
      language: translationForm.language.trim(),
      title: translationForm.title.trim(),
      description: translationForm.description.trim() || null,
      content: translationForm.content,
      hook: translationForm.hook.trim() || null,
      deepDiveContent: translationForm.deepDiveContent.trim() || null,
    };
    if (!payload.language || !payload.title || !payload.content.trim()) {
      toast.error("Language, title and content are required");
      return;
    }

    try {
      if (editingTranslation) {
        await updateLessonTranslation(token, editingTranslation.id, payload);
        toast.success("Translation updated");
      } else {
        await createLessonTranslation(token, lesson.id, payload);
        toast.success("Translation created");
      }
      setTranslationOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Translation save failed");
    }
  }

  async function removeTranslation(t: LessonTranslationAdmin) {
    if (!confirm(`Delete ${t.language} translation?`)) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await deleteLessonTranslation(token, t.id);
      toast.success("Translation deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  // Quiz Translation Handlers
  async function loadQuizTranslations() {
    if (!quizForTr) return;
    const token = getAdminToken();
    if (!token) return;
    setQuizTrListLoading(true);
    try {
      const trList = await getQuizTranslations(token, quizForTr.id);
      setQuizTrList(trList);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to load translations",
      );
    } finally {
      setQuizTrListLoading(false);
    }
  }

  function openNewQuizTranslation() {
    setEditingQuizTr(null);
    setQuizTrForm({
      language: "",
      question: "",
      options: "",
      explanation: "",
    });
    setQuizTrFormOpen(true);
  }

  function openEditQuizTranslation(t: QuizTranslationAdmin) {
    setEditingQuizTr(t);
    setQuizTrForm({
      language: t.language,
      question: t.question,
      options: t.options.join("\n"),
      explanation: t.explanation ?? "",
    });
    setQuizTrFormOpen(true);
  }

  async function saveQuizTranslation() {
    const token = getAdminToken();
    if (!token || !quizForTr) return;

    const options = quizTrForm.options
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (options.length !== quizForTr.options.length) {
      toast.error(
        `Enter exactly ${quizForTr.options.length} options (one per line), matching the base quiz.`,
      );
      return;
    }

    const payload = {
      language: quizTrForm.language.trim(),
      question: quizTrForm.question.trim(),
      options,
      explanation: quizTrForm.explanation.trim() || null,
    };

    if (!payload.language || !payload.question || options.length === 0) {
      toast.error("Language, question and options are required");
      return;
    }

    try {
      if (editingQuizTr) {
        await updateQuizTranslation(token, editingQuizTr.id, payload);
        toast.success("Quiz translation updated");
      } else {
        await createQuizTranslation(token, quizForTr.id, payload);
        toast.success("Quiz translation created");
      }
      setQuizTrFormOpen(false);
      await loadQuizTranslations();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function removeQuizTranslation(t: QuizTranslationAdmin) {
    if (!confirm(`Delete ${t.language} translation?`)) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await deleteQuizTranslation(token, t.id);
      toast.success("Quiz translation deleted");
      await loadQuizTranslations();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function deleteLesson() {
    if (!lesson) return;
    if (!confirm(`Delete lesson “${lesson.title}”?`)) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await deleteAdminLesson(token, lesson.id);
      toast.success("Lesson deleted");
      router.replace("/content/lessons");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading || !lesson) {
    return <p className="text-sm text-muted-foreground">Loading lesson…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
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
            <h2 className="text-lg font-semibold">{lesson.title}</h2>
            <p className="text-sm text-muted-foreground">Slug: {lesson.slug}</p>
          </div>
        </div>
        <Button variant="destructive" onClick={() => void deleteLesson()}>
          Delete lesson
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="chapters">
            Chapters ({lesson.chapters.length})
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            Quizzes ({lesson.quizzes.length})
          </TabsTrigger>
          <TabsTrigger value="translations">
            Translations ({translations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lesson body</CardTitle>
              <CardDescription>
                Shown in the app when the lesson is opened.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
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
                <Label htmlFor="desc">Description</Label>
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hook: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Body</Label>
                <Textarea
                  id="content"
                  className="min-h-48"
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
                  folder={lesson.id}
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
              <div className="grid gap-2">
                <Label htmlFor="deep">Deep dive (optional)</Label>
                <Textarea
                  id="deep"
                  value={form.deepDiveContent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deepDiveContent: e.target.value }))
                  }
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-4">
                  Audio Narration (optional)
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="titleAudio">Title Audio URL</Label>
                    <Input
                      id="titleAudio"
                      placeholder="https://..."
                      value={form.titleAudioUrl}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          titleAudioUrl: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hookAudio">Hook Audio URL</Label>
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
                    <Label htmlFor="contentAudio">Content Audio URL</Label>
                    <Input
                      id="contentAudio"
                      placeholder="https://..."
                      value={form.contentAudioUrl}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          contentAudioUrl: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deepDiveAudio">Deep Dive Audio URL</Label>
                    <Input
                      id="deepDiveAudio"
                      placeholder="https://..."
                      value={form.deepDiveAudioUrl}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          deepDiveAudioUrl: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-semibold block mb-3">
                  Related Characters (optional)
                </Label>
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
              <Button onClick={() => void onSaveDetails()} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chapters">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Chapters</CardTitle>
                <CardDescription>
                  Ordered segments inside this lesson.
                </CardDescription>
              </div>
              <Button onClick={openNewChapter}>
                <Plus className="size-4" />
                Add chapter
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lesson.chapters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>No chapters yet.</TableCell>
                    </TableRow>
                  ) : (
                    lesson.chapters.map((ch) => (
                      <TableRow key={ch.id}>
                        <TableCell>{ch.title}</TableCell>
                        <TableCell>{ch.order}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditChapter(ch)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon-sm"
                              onClick={() => removeChapter(ch)}
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

        <TabsContent value="quizzes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Quizzes</CardTitle>
                <CardDescription>
                  Multiple choice questions linked to this lesson.
                </CardDescription>
              </div>
              <Button onClick={openNewQuiz}>
                <Plus className="size-4" />
                Add quiz
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lesson.quizzes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>No quizzes yet.</TableCell>
                    </TableRow>
                  ) : (
                    lesson.quizzes.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="max-w-md truncate">
                          {q.question}
                        </TableCell>
                        <TableCell>{q.order}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditQuiz(q)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon-sm"
                              onClick={() => removeQuiz(q)}
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
        <TabsContent value="translations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Translations</CardTitle>
                <CardDescription>
                  Localized lesson content by language code.
                </CardDescription>
              </div>
              <Button onClick={openNewTranslation}>
                <Plus className="size-4" />
                Add translation
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Language</TableHead>
                    <TableHead>Title</TableHead>
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
                          {t.title}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditTranslation(t)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon-sm"
                              onClick={() => removeTranslation(t)}
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

      <Dialog open={chapterOpen} onOpenChange={setChapterOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingChapter ? "Edit chapter" : "New chapter"}
            </DialogTitle>
            <DialogDescription>
              {editingChapter
                ? "Update the chapter information below."
                : "Create a new chapter with the information below."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 overflow-y-auto flex-1">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                value={chapterForm.title}
                onChange={(e) =>
                  setChapterForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Content</Label>
              <Textarea
                className="min-h-32"
                value={chapterForm.content}
                onChange={(e) =>
                  setChapterForm((f) => ({ ...f, content: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Order</Label>
              <Input
                type="number"
                value={chapterForm.order}
                onChange={(e) =>
                  setChapterForm((f) => ({ ...f, order: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Media type (image, video, none)</Label>
              <NativeSelect
                value={chapterForm.mediaType}
                onChange={(e) =>
                  setChapterForm((f) => ({ ...f, mediaType: e.target.value }))
                }
              >
                <NativeSelectOption value="">None</NativeSelectOption>
                <NativeSelectOption value="image">Image</NativeSelectOption>
                <NativeSelectOption value="video">Video</NativeSelectOption>
              </NativeSelect>
            </div>
            {chapterForm.mediaType && (
              <div className="grid gap-2">
                <Label>
                  {chapterForm.mediaType === "image"
                    ? "Upload Image"
                    : "Upload Video"}
                </Label>
                <FileUpload
                  bucket="chapter-media"
                  folder={lesson.id}
                  accepts={
                    chapterForm.mediaType === "image" ? "image" : "video"
                  }
                  currentValue={chapterForm.mediaUrl}
                  onUploadComplete={(url) => {
                    setChapterForm((f) => ({ ...f, mediaUrl: url }));
                  }}
                />
                <div className="text-sm text-gray-500 mt-2">
                  Or paste external URL:
                </div>
                <Input
                  placeholder={
                    chapterForm.mediaType === "image"
                      ? "https://example.com/image.jpg"
                      : "https://example.com/video.mp4"
                  }
                  value={chapterForm.mediaUrl}
                  onChange={(e) =>
                    setChapterForm((f) => ({ ...f, mediaUrl: e.target.value }))
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setChapterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveChapter()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EnhancedQuizDialog
        open={quizOpen}
        onOpenChange={setQuizOpen}
        onSave={saveQuiz}
        initialData={
          editingQuiz
            ? {
                question: editingQuiz.question,
                type: (editingQuiz.type as QuizType) || "multiple_choice",
                options: editingQuiz.options,
                optionImages: editingQuiz.optionImages || undefined,
                correctOption: editingQuiz.correctOption,
                explanation: editingQuiz.explanation || "",
                order: editingQuiz.order,
                heartLimit: editingQuiz.heartLimit,
                difficulty: editingQuiz.difficulty as
                  | "easy"
                  | "medium"
                  | "hard"
                  | null as "easy" | "medium" | "hard" | undefined,
                timeLimitSeconds: editingQuiz.timeLimitSeconds || undefined,
              }
            : undefined
        }
        title={editingQuiz ? "Edit Quiz" : "Create New Quiz"}
        lessonId={lesson.id}
      />

      <Dialog open={translationOpen} onOpenChange={setTranslationOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingTranslation ? "Edit translation" : "New translation"}
            </DialogTitle>
            <DialogDescription>
              {editingTranslation
                ? "Update the lesson translation below."
                : "Create a new lesson translation for a different language."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 overflow-y-auto flex-1">
            <div className="grid gap-2">
              <Label>Language code</Label>
              <Input
                placeholder="en, fr, sw..."
                value={translationForm.language}
                onChange={(e) =>
                  setTranslationForm((f) => ({
                    ...f,
                    language: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                value={translationForm.title}
                onChange={(e) =>
                  setTranslationForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={translationForm.description}
                onChange={(e) =>
                  setTranslationForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Hook</Label>
              <Input
                value={translationForm.hook}
                onChange={(e) =>
                  setTranslationForm((f) => ({ ...f, hook: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Content</Label>
              <Textarea
                className="min-h-32"
                value={translationForm.content}
                onChange={(e) =>
                  setTranslationForm((f) => ({ ...f, content: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Deep dive content</Label>
              <Textarea
                value={translationForm.deepDiveContent}
                onChange={(e) =>
                  setTranslationForm((f) => ({
                    ...f,
                    deepDiveContent: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setTranslationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveTranslation()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={quizTrManageOpen}
        onOpenChange={(o) => {
          setQuizTrManageOpen(o);
          if (!o) {
            setQuizForTr(null);
            setQuizTrList([]);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz translations</DialogTitle>
            <DialogDescription>
              {quizForTr ? (
                <span className="line-clamp-2">{quizForTr.question}</span>
              ) : (
                "Select a quiz to manage its translations"
              )}
            </DialogDescription>
          </DialogHeader>
          {quizTrListLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={openNewQuizTranslation}
                  disabled={!quizForTr}
                >
                  <Plus className="size-4" />
                  Add translation
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Language</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizTrList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2}>No translations yet.</TableCell>
                    </TableRow>
                  ) : (
                    quizTrList.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          {t.language}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditQuizTranslation(t)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon-sm"
                              onClick={() => void removeQuizTranslation(t)}
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
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={quizTrFormOpen} onOpenChange={setQuizTrFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingQuizTr ? "Edit quiz translation" : "New quiz translation"}
            </DialogTitle>
            <DialogDescription>
              {quizForTr
                ? `Provide ${quizForTr.options.length} options (one per line), matching the base quiz.`
                : "Select a quiz to create translations"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 overflow-y-auto flex-1">
            <div className="grid gap-2">
              <Label>Language code</Label>
              <Input
                placeholder="en, fr, sw..."
                value={quizTrForm.language}
                onChange={(e) =>
                  setQuizTrForm((f) => ({ ...f, language: e.target.value }))
                }
                disabled={!!editingQuizTr}
              />
            </div>
            <div className="grid gap-2">
              <Label>Question</Label>
              <Textarea
                value={quizTrForm.question}
                onChange={(e) =>
                  setQuizTrForm((f) => ({ ...f, question: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Options (one per line)</Label>
              <Textarea
                className="min-h-28 font-mono text-sm"
                value={quizTrForm.options}
                onChange={(e) =>
                  setQuizTrForm((f) => ({ ...f, options: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Explanation</Label>
              <Textarea
                value={quizTrForm.explanation}
                onChange={(e) =>
                  setQuizTrForm((f) => ({ ...f, explanation: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setQuizTrFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveQuizTranslation()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
