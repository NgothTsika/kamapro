"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, BookOpen, ArrowLeft, Pencil, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
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
import { getAdminToken } from "@/lib/admin-auth";
import {
  createAdminQuiz,
  deleteAdminQuiz,
  getAdminLesson,
  getAdminTopics,
  updateAdminQuiz,
  getAdminLessons,
  getAdminLessonQuizzes,
} from "@/lib/kama-api";
import type {
  AdminTopic,
  QuizAdmin,
  AdminLessonSummary,
  Chapter,
} from "@/lib/kama-types";

export default function QuizzesPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [lessons, setLessons] = useState<AdminLessonSummary[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [quizType, setQuizType] = useState<"lesson" | "topic">("lesson");

  const [quizOpen, setQuizOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [editingQuiz, setEditingQuiz] = useState<QuizAdmin | null>(null);
  const [lessonQuizzes, setLessonQuizzes] = useState<QuizAdmin[]>([]);
  const [managingLessonId, setManagingLessonId] = useState<string>("");
  const [selectedLessonChapters, setSelectedLessonChapters] = useState<
    Chapter[]
  >([]);

  const groupedLessonQuizzes = lessonQuizzes.reduce<
    Array<{ label: string; quizzes: QuizAdmin[] }>
  >((groups, quiz) => {
    const chapter = selectedLessonChapters.find((item) => item.id === quiz.chapterId);
    const label = chapter ? `${chapter.order}. ${chapter.title}` : "Lesson quiz";
    const existingGroup = groups.find((group) => group.label === label);

    if (existingGroup) {
      existingGroup.quizzes.push(quiz);
    } else {
      groups.push({ label, quizzes: [quiz] });
    }

    return groups;
  }, []);

  const load = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;
    setLoading(true);
    try {
      const [t, l] = await Promise.all([
        getAdminTopics(token),
        getAdminLessons(token),
      ]);
      setTopics(t);
      setLessons(l);
      if (t.length > 0 && !selectedTopic) {
        setSelectedTopic(t[0].id);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [selectedTopic]);

  useEffect(() => {
    void load();
  }, [load]);

  const lessonsByTopic = selectedTopic
    ? lessons.filter((l) => l.topic?.id === selectedTopic)
    : [];

  async function openNewQuiz(lessonId: string) {
    const token = getAdminToken();
    if (!token) return;

    try {
      const lesson = await getAdminLesson(token, lessonId);
      setSelectedLesson(lessonId);
      setSelectedLessonChapters(lesson.chapters);
      setEditingQuiz(null);
      setQuizOpen(true);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to load lesson quizzes",
      );
    }
  }

  async function openManageLessonQuizzes(lessonId: string) {
    const token = getAdminToken();
    if (!token) return;
    try {
      const [quizzes, lesson] = await Promise.all([
        getAdminLessonQuizzes(token, lessonId),
        getAdminLesson(token, lessonId),
      ]);
      setLessonQuizzes(quizzes);
      setSelectedLessonChapters(lesson.chapters);
      setManagingLessonId(lessonId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load quizzes");
    }
  }

  function closeManageView() {
    setManagingLessonId("");
    setLessonQuizzes([]);
  }

  function openEditQuiz(quiz: QuizAdmin) {
    setSelectedLesson(quiz.lessonId);
    setEditingQuiz(quiz);
    setQuizOpen(true);
  }

  async function saveQuiz(data: QuizFormData) {
    const token = getAdminToken();
    if (!token || !selectedLesson) return;

    try {
      const payload = {
        question: data.question.trim(),
        chapterId: data.chapterId || null,
        options: data.options,
        correctOption: data.correctOption,
        explanation: data.explanation.trim() || null,
        order: data.order,
        heartLimit: data.heartLimit,
        type: data.isPoll ? "poll" : data.type,
        optionImages:
          data.type === "image_choice"
            ? (data.optionImages ?? []).map((image) => image.trim())
            : null,
        difficulty: data.difficulty || null,
        timeLimitSeconds: data.timeLimitSeconds || null,
        questionAudioUrl: data.questionAudioUrl || null,
        isPoll: data.isPoll ?? false,
        pollDescription: data.pollDescription?.trim() || null,
      };

      if (editingQuiz) {
        await updateAdminQuiz(token, editingQuiz.id, payload);
        toast.success("Quiz updated");
      } else {
        await createAdminQuiz(token, selectedLesson, payload);
        toast.success("Quiz added");
      }
      setQuizOpen(false);
      await load();

      // Refresh manage view if it's open
      if (managingLessonId) {
        await openManageLessonQuizzes(managingLessonId);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Quiz save failed");
    }
  }

  async function deleteQuiz(quiz: QuizAdmin) {
    if (!confirm("Delete this quiz question?")) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await deleteAdminQuiz(token, quiz.id);
      toast.success("Quiz deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading quizzes…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.back()}
            title="Go back to content hub"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Quiz Management
            </h2>
            <p className="text-sm text-muted-foreground">
              Create and manage quizzes by type
            </p>
          </div>
        </div>
      </div>

      {/* Quiz Type Selector */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Quiz Type</Label>
          <NativeSelect
            value={quizType}
            onChange={(e) => setQuizType(e.target.value as "lesson" | "topic")}
          >
            <NativeSelectOption value="lesson">
              Lesson Quizzes (End of Lesson)
            </NativeSelectOption>
            <NativeSelectOption value="topic">
              Topic Quizzes (Quiz Mode - 1v1/Solo)
            </NativeSelectOption>
          </NativeSelect>
        </div>
        {quizType === "lesson" && (
          <div>
            <Label>Filter by Topic</Label>
            <NativeSelect
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <NativeSelectOption value="">All topics</NativeSelectOption>
              {topics.map((t) => (
                <NativeSelectOption key={t.id} value={t.id}>
                  {t.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}
      </div>

      {/* LESSON QUIZZES SECTION */}
      {quizType === "lesson" ? (
        <div className="space-y-4">
          {!selectedTopic ? (
            <p className="text-sm text-muted-foreground">
              Select a topic to view lessons
            </p>
          ) : lessonsByTopic.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No lessons in this topic
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lessonsByTopic.map((lesson) => (
                <Card key={lesson.id} className="flex flex-col">
                  <CardHeader className="flex-1">
                    <div className="flex items-start gap-2">
                      <BookOpen className="size-4 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-2">
                          {lesson.title}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {lesson._count.quizzes} quiz
                          {lesson._count.quizzes !== 1 ? "zes" : ""}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 flex-1 flex flex-col">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void openNewQuiz(lesson.id)}
                      className="w-full"
                    >
                      <Plus className="size-3 mr-1" />
                      Add Quiz
                    </Button>
                    <Button
                      variant={lesson._count.quizzes > 0 ? "default" : "ghost"}
                      size="sm"
                      disabled={lesson._count.quizzes === 0}
                      onClick={() => void openManageLessonQuizzes(lesson.id)}
                      className="w-full"
                    >
                      <Pencil className="size-3 mr-1" />
                      Manage ({lesson._count.quizzes})
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TOPIC QUIZZES SECTION */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Topic Quiz Banks</h3>
            <p className="text-xs text-muted-foreground">
              Quizzes available for solo/1v1 play
            </p>
          </div>

          {topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No topics available</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <Card key={topic.id} className="flex flex-col">
                  <CardHeader className="flex-1">
                    <CardTitle className="text-base">{topic.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Topic quiz bank
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Create quizzes for this topic that players can play in
                      quiz mode
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        toast.info(
                          "Topic quiz banks are not wired to a backend yet. Use lesson quiz management for now.",
                        )
                      }
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="size-3" />
                      Topic Quizzes Soon
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MANAGE LESSON QUIZZES VIEW */}
      {managingLessonId && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Manage Quizzes</CardTitle>
              <CardDescription>
                {lessons.find((l) => l.id === managingLessonId)?.title}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={closeManageView}
              title="Close manage view"
            >
              ✕
            </Button>
          </CardHeader>
          <CardContent>
            {lessonQuizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No quizzes found for this lesson
              </p>
            ) : (
              <div className="space-y-4">
                {groupedLessonQuizzes.map((group) => (
                  <div key={group.label} className="border rounded-lg overflow-hidden">
                    <div className="border-b bg-muted/40 px-4 py-3">
                      <p className="text-sm font-medium">{group.label}</p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Question</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Order</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.quizzes.map((quiz) => (
                          <TableRow key={quiz.id}>
                            <TableCell className="max-w-md">
                              <p className="truncate text-sm">{quiz.question}</p>
                            </TableCell>
                            <TableCell className="text-sm capitalize">
                              {quiz.type?.replace(/_/g, " ") || "N/A"}
                            </TableCell>
                            <TableCell className="text-sm">{quiz.order}</TableCell>
                            <TableCell className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditQuiz(quiz)}
                              >
                                <Pencil className="size-3" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      "Are you sure you want to delete this quiz?",
                                    )
                                  ) {
                                    return;
                                  }
                                  await deleteQuiz(quiz);
                                  await openManageLessonQuizzes(managingLessonId);
                                }}
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Button
                onClick={() => void openNewQuiz(managingLessonId)}
                className="w-full"
              >
                <Plus className="size-3 mr-2" />
                Add New Quiz to This Lesson
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Quiz Dialog */}
      <EnhancedQuizDialog
        open={quizOpen}
        onOpenChange={setQuizOpen}
        onSave={saveQuiz}
        initialData={
          editingQuiz
            ? {
                question: editingQuiz.question,
                chapterId: editingQuiz.chapterId || null,
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
                questionAudioUrl: editingQuiz.questionAudioUrl || undefined,
                isPoll: editingQuiz.isPoll || false,
                pollDescription: editingQuiz.pollDescription || undefined,
              }
            : undefined
        }
        title={editingQuiz ? "Edit Quiz" : "Create New Quiz"}
        lessonId={selectedLesson}
        chapters={selectedLessonChapters}
      />
    </div>
  );
}
