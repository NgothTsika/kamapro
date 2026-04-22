"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Plus,
  Trash2,
  WandSparkles,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAdminToken } from "@/lib/admin-auth";
import {
  getChapterWithSteps,
  createChapterStep,
  updateChapterStep,
  deleteChapterStep,
  reorderChapterSteps,
  updateAdminChapter,
} from "@/lib/kama-api";
import type {
  InteractiveChapter,
  ChapterStep,
  StepType,
} from "@/lib/kama-types";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

const STEP_TYPES: StepType[] = [
  "TEXT",
  "TEXT_AUDIO",
  "IMAGE_FULL",
  "POLL",
  "CHOICE",
  "QUIZ_QUESTION",
  "RECAP",
  "CONTINUE_BUTTON",
];

type ChoiceOptionDraft = {
  text: string;
  nextStepId: string;
};

type StepFormState = {
  type: StepType;
  order: string;
  mediaUrl: string;
  mediaType: "image" | "video" | "none";
  title: string;
  body: string;
  audioUrl: string;
  imageUrl: string;
  caption: string;
  description: string;
  question: string;
  prompt: string;
  explanation: string;
  buttonText: string;
  pointsText: string;
  optionsText: string;
  correctOption: string;
  choiceOptions: ChoiceOptionDraft[];
};

const STEP_TYPE_DETAILS: Record<
  StepType,
  {
    label: string;
    description: string;
    badgeClassName: string;
  }
> = {
  TEXT: {
    label: "Story Step",
    description: "Narrative card with title and text.",
    badgeClassName:
      "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100",
  },
  TEXT_AUDIO: {
    label: "Story + Audio",
    description: "Narrative card with synced narration.",
    badgeClassName:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-100",
  },
  IMAGE_FULL: {
    label: "Image Step",
    description: "Full image slide with optional caption.",
    badgeClassName:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  },
  POLL: {
    label: "Poll Question",
    description: "Audience-style vote with multiple options.",
    badgeClassName:
      "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  },
  CHOICE: {
    label: "Interactive Choice",
    description: "Decision point with optional branching.",
    badgeClassName:
      "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-100",
  },
  QUIZ_QUESTION: {
    label: "Quiz Checkpoint",
    description: "Knowledge check with correct answer feedback.",
    badgeClassName:
      "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-100",
  },
  RECAP: {
    label: "Recap",
    description: "Key takeaways before the quiz or ending.",
    badgeClassName:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-100",
  },
  CONTINUE_BUTTON: {
    label: "Continue Screen",
    description: "Simple CTA to move the learner forward.",
    badgeClassName:
      "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-100",
  },
};

const STEP_TEMPLATES: Array<{
  type: StepType;
  label: string;
  description: string;
}> = [
  {
    type: "TEXT",
    label: "Add story step",
    description: "Body text for the next scene or explanation.",
  },
  {
    type: "POLL",
    label: "Add poll",
    description: "Ask a reflection question in the middle of the chapter.",
  },
  {
    type: "RECAP",
    label: "Add recap",
    description: "Summarize what the learner should remember.",
  },
  {
    type: "QUIZ_QUESTION",
    label: "Add quiz",
    description: "Finish with a proper knowledge check.",
  },
];

function createDefaultStepForm(
  type: StepType = "TEXT",
  order = 0,
): StepFormState {
  return {
    type,
    order: String(order),
    mediaUrl: "",
    mediaType: type === "IMAGE_FULL" ? "image" : "none",
    title: "",
    body: "",
    audioUrl: "",
    imageUrl: "",
    caption: "",
    description: "",
    question: "",
    prompt: "",
    explanation: "",
    buttonText: "Continue",
    pointsText: "",
    optionsText: "",
    correctOption: "0",
    choiceOptions: [
      { text: "", nextStepId: "" },
      { text: "", nextStepId: "" },
    ],
  };
}

function trimLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toStepForm(step: ChapterStep): StepFormState {
  const base = createDefaultStepForm(step.type, step.order);
  const content = step.content ?? {};

  if (step.type === "TEXT") {
    return {
      ...base,
      title: String(content.title ?? ""),
      body: String(content.body ?? ""),
    };
  }

  if (step.type === "TEXT_AUDIO") {
    const audioUrl = String(step.mediaUrl ?? content.audioUrl ?? "");
    return {
      ...base,
      title: String(content.title ?? ""),
      body: String(content.body ?? ""),
      audioUrl,
      mediaUrl: audioUrl,
    };
  }

  if (step.type === "IMAGE_FULL") {
    const imageUrl = String(step.mediaUrl ?? content.imageUrl ?? "");
    return {
      ...base,
      imageUrl,
      mediaUrl: imageUrl,
      mediaType: "image",
      caption: String(content.caption ?? ""),
      description: String(content.description ?? ""),
    };
  }

  if (step.type === "POLL") {
    return {
      ...base,
      question: String(content.question ?? ""),
      optionsText: Array.isArray(content.options)
        ? content.options.join("\n")
        : "",
    };
  }

  if (step.type === "CHOICE") {
    const choiceOptions = Array.isArray(content.options)
      ? content.options.map((option) => ({
          text: String(option?.text ?? ""),
          nextStepId: String(option?.nextStepId ?? ""),
        }))
      : base.choiceOptions;

    return {
      ...base,
      prompt: String(content.prompt ?? ""),
      choiceOptions:
        choiceOptions.length > 0 ? choiceOptions : base.choiceOptions,
    };
  }

  if (step.type === "QUIZ_QUESTION") {
    return {
      ...base,
      question: String(content.question ?? ""),
      optionsText: Array.isArray(content.options)
        ? content.options.join("\n")
        : "",
      correctOption: String(content.correctOption ?? 0),
      explanation: String(content.explanation ?? ""),
    };
  }

  if (step.type === "RECAP") {
    return {
      ...base,
      pointsText: Array.isArray(content.points) ? content.points.join("\n") : "",
    };
  }

  if (step.type === "CONTINUE_BUTTON") {
    return {
      ...base,
      buttonText: String(content.text ?? "Continue"),
    };
  }

  return base;
}

function getNextStepOrder(steps: ChapterStep[] = []) {
  if (steps.length === 0) return 0;
  return Math.max(...steps.map((step) => step.order)) + 1;
}

function getStepPreview(step: ChapterStep) {
  const content = step.content ?? {};

  switch (step.type) {
    case "TEXT":
    case "TEXT_AUDIO":
      return String(content.title || content.body || "Story content");
    case "IMAGE_FULL":
      return String(content.caption || content.description || "Image slide");
    case "POLL":
      return String(content.question || "Poll question");
    case "CHOICE":
      return String(content.prompt || "Interactive choice");
    case "QUIZ_QUESTION":
      return String(content.question || "Quiz question");
    case "RECAP":
      return Array.isArray(content.points) && content.points.length > 0
        ? `${content.points.length} recap point${
            content.points.length === 1 ? "" : "s"
          }`
        : "Recap step";
    case "CONTINUE_BUTTON":
      return String(content.text || "Continue");
    default:
      return "Step";
  }
}

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export default function ChapterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;
  const chapterId = params.chapterId as string;

  const [chapter, setChapter] = useState<InteractiveChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);

  const [chapterForm, setChapterForm] = useState({
    title: "",
    introText: "",
    introAudioUrl: "",
    order: "0",
  });

  const [stepOpen, setStepOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ChapterStep | null>(null);
  const [stepForm, setStepForm] = useState<StepFormState>(createDefaultStepForm());

  const orderedSteps = useMemo(
    () => [...(chapter?.steps ?? [])].sort((a, b) => a.order - b.order),
    [chapter?.steps],
  );

  const load = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;

    try {
      const data = await getChapterWithSteps(token, chapterId);
      setChapter(data);
      setChapterForm({
        title: data.title,
        introText: data.introText || "",
        introAudioUrl: data.introAudioUrl || "",
        order: String(data.order),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load chapter");
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveChapterDetails() {
    const token = getAdminToken();
    if (!token || !chapter) return;

    setSaving(true);
    try {
      await updateAdminChapter(token, chapter.id, {
        title: chapterForm.title,
        introText: chapterForm.introText || null,
        introAudioUrl: chapterForm.introAudioUrl || null,
        order: Number(chapterForm.order) || 0,
      });
      toast.success("Chapter updated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  function openNewStep(type: StepType = "TEXT") {
    setEditingStep(null);
    setStepForm(createDefaultStepForm(type, getNextStepOrder(orderedSteps)));
    setStepOpen(true);
  }

  function openEditStep(step: ChapterStep) {
    setEditingStep(step);
    setStepForm(toStepForm(step));
    setStepOpen(true);
  }

  async function removeStep(stepId: string) {
    if (!confirm("Delete this step?")) return;

    const token = getAdminToken();
    if (!token) return;

    try {
      await deleteChapterStep(token, lessonId, chapterId, stepId);
      toast.success("Step deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function moveStep(stepId: string, direction: "up" | "down") {
    if (!chapter || reordering) return;

    const currentIndex = orderedSteps.findIndex((step) => step.id === stepId);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= orderedSteps.length) return;

    const reordered = moveArrayItem(orderedSteps, currentIndex, targetIndex);
    const token = getAdminToken();
    if (!token) return;

    setReordering(true);
    try {
      await reorderChapterSteps(
        token,
        lessonId,
        chapter.id,
        reordered.map((step) => step.id),
      );
      toast.success("Chapter flow updated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reorder failed");
    } finally {
      setReordering(false);
    }
  }

  function addChoiceOption() {
    setStepForm((current) => ({
      ...current,
      choiceOptions: [...current.choiceOptions, { text: "", nextStepId: "" }],
    }));
  }

  function updateChoiceOption(
    index: number,
    field: keyof ChoiceOptionDraft,
    value: string,
  ) {
    setStepForm((current) => ({
      ...current,
      choiceOptions: current.choiceOptions.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: value } : option,
      ),
    }));
  }

  function removeChoiceOption(index: number) {
    setStepForm((current) => ({
      ...current,
      choiceOptions:
        current.choiceOptions.length <= 2
          ? current.choiceOptions
          : current.choiceOptions.filter((_, optionIndex) => optionIndex !== index),
    }));
  }

  function buildStepPayload() {
    const order = Number(stepForm.order);
    if (!Number.isFinite(order) || order < 0) {
      throw new Error("Step order must be 0 or greater");
    }

    if (stepForm.type === "TEXT") {
      if (!stepForm.body.trim()) {
        throw new Error("Story steps need body text");
      }

      return {
        order,
        type: stepForm.type,
        content: {
          ...(stepForm.title.trim() ? { title: stepForm.title.trim() } : {}),
          body: stepForm.body.trim(),
        },
        mediaUrl: undefined,
        mediaType: "none" as const,
      };
    }

    if (stepForm.type === "TEXT_AUDIO") {
      if (!stepForm.body.trim()) {
        throw new Error("Narrated steps need body text");
      }
      if (!stepForm.audioUrl.trim()) {
        throw new Error("Narrated steps need an audio URL");
      }

      const audioUrl = stepForm.audioUrl.trim();
      return {
        order,
        type: stepForm.type,
        content: {
          ...(stepForm.title.trim() ? { title: stepForm.title.trim() } : {}),
          body: stepForm.body.trim(),
          audioUrl,
        },
        mediaUrl: audioUrl,
        mediaType: "none" as const,
      };
    }

    if (stepForm.type === "IMAGE_FULL") {
      const imageUrl = stepForm.imageUrl.trim();
      if (!imageUrl) {
        throw new Error("Image steps need an image URL");
      }

      return {
        order,
        type: stepForm.type,
        content: {
          imageUrl,
          ...(stepForm.caption.trim() ? { caption: stepForm.caption.trim() } : {}),
          ...(stepForm.description.trim()
            ? { description: stepForm.description.trim() }
            : {}),
        },
        mediaUrl: imageUrl,
        mediaType: "image" as const,
      };
    }

    if (stepForm.type === "POLL") {
      const options = trimLines(stepForm.optionsText);
      if (!stepForm.question.trim()) {
        throw new Error("Poll steps need a question");
      }
      if (options.length < 2) {
        throw new Error("Poll steps need at least 2 options");
      }

      return {
        order,
        type: stepForm.type,
        content: {
          question: stepForm.question.trim(),
          options,
        },
        mediaUrl: undefined,
        mediaType: "none" as const,
      };
    }

    if (stepForm.type === "CHOICE") {
      const options = stepForm.choiceOptions
        .map((option) => ({
          text: option.text.trim(),
          nextStepId: option.nextStepId.trim(),
        }))
        .filter((option) => option.text);

      if (!stepForm.prompt.trim()) {
        throw new Error("Choice steps need a prompt");
      }
      if (options.length < 2) {
        throw new Error("Choice steps need at least 2 options");
      }

      return {
        order,
        type: stepForm.type,
        content: {
          prompt: stepForm.prompt.trim(),
          options: options.map((option) => ({
            text: option.text,
            ...(option.nextStepId ? { nextStepId: option.nextStepId } : {}),
          })),
        },
        mediaUrl: undefined,
        mediaType: "none" as const,
      };
    }

    if (stepForm.type === "QUIZ_QUESTION") {
      const options = trimLines(stepForm.optionsText);
      const correctOption = Number(stepForm.correctOption);
      if (!stepForm.question.trim()) {
        throw new Error("Quiz steps need a question");
      }
      if (options.length < 2) {
        throw new Error("Quiz steps need at least 2 answers");
      }
      if (
        !Number.isInteger(correctOption) ||
        correctOption < 0 ||
        correctOption >= options.length
      ) {
        throw new Error("Correct answer index must match one of the quiz options");
      }

      return {
        order,
        type: stepForm.type,
        content: {
          question: stepForm.question.trim(),
          options,
          correctOption,
          ...(stepForm.explanation.trim()
            ? { explanation: stepForm.explanation.trim() }
            : {}),
        },
        mediaUrl: undefined,
        mediaType: "none" as const,
      };
    }

    if (stepForm.type === "RECAP") {
      const points = trimLines(stepForm.pointsText);
      if (points.length === 0) {
        throw new Error("Recap steps need at least one point");
      }

      return {
        order,
        type: stepForm.type,
        content: { points },
        mediaUrl: undefined,
        mediaType: "none" as const,
      };
    }

    return {
      order,
      type: stepForm.type,
      content: {
        ...(stepForm.buttonText.trim() ? { text: stepForm.buttonText.trim() } : {}),
      },
      mediaUrl: undefined,
      mediaType: "none" as const,
    };
  }

  async function saveStep() {
    const token = getAdminToken();
    if (!token || !chapter) return;

    try {
      const payload = buildStepPayload();

      if (editingStep) {
        await updateChapterStep(token, lessonId, chapter.id, editingStep.id, payload);
        toast.success("Step updated");
      } else {
        await createChapterStep(token, lessonId, chapter.id, payload);
        toast.success("Step added");
      }
      setStepOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading chapter...</p>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Chapter not found</p>
      </div>
    );
  }

  const stepTypeMeta = STEP_TYPE_DETAILS[stepForm.type];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{chapter.title}</h1>
          <p className="text-muted-foreground">
            Build the full chapter journey: intro, story beats, interactions,
            recap, and quiz.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chapter Details</CardTitle>
          <CardDescription>
            These fields power the chapter intro before the learner enters the
            step-by-step flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={chapterForm.title}
                onChange={(e) =>
                  setChapterForm({ ...chapterForm, title: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="introText">Introduction Text</Label>
              <Textarea
                id="introText"
                value={chapterForm.introText}
                onChange={(e) =>
                  setChapterForm({ ...chapterForm, introText: e.target.value })
                }
                placeholder="This is the intro screen before the first chapter step."
                rows={5}
              />
            </div>

            <div>
              <Label htmlFor="introAudio">Introduction Audio URL</Label>
              <Input
                id="introAudio"
                value={chapterForm.introAudioUrl}
                onChange={(e) =>
                  setChapterForm({
                    ...chapterForm,
                    introAudioUrl: e.target.value,
                  })
                }
                placeholder="Optional intro narration"
              />
            </div>

            <div>
              <Label htmlFor="order">Chapter Order</Label>
              <Input
                id="order"
                type="number"
                value={chapterForm.order}
                onChange={(e) =>
                  setChapterForm({ ...chapterForm, order: e.target.value })
                }
              />
            </div>
          </div>

          <Button onClick={saveChapterDetails} disabled={saving}>
            {saving ? "Saving..." : "Save Chapter Details"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chapter Flow</CardTitle>
          <CardDescription>
            Add unlimited steps and arrange them in the exact learning sequence
            you want.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-4">
            {STEP_TEMPLATES.map((template) => (
              <button
                key={template.label}
                type="button"
                onClick={() => openNewStep(template.type)}
                className="rounded-lg border bg-background p-4 text-left transition hover:border-primary hover:shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <WandSparkles className="h-4 w-4 text-primary" />
                  {template.label}
                </div>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
            <div>
              <p className="font-medium">Need a different step type?</p>
              <p className="text-sm text-muted-foreground">
                You can also add image, audio, choice, or continue screens.
              </p>
            </div>
            <Button onClick={() => openNewStep()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Any Step
            </Button>
          </div>

          {!orderedSteps.length ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
              No steps yet. Start with a story step, then add polls, recap, and
              quiz screens to complete the chapter.
            </div>
          ) : (
            <div className="space-y-3">
              {orderedSteps.map((step, index) => {
                const meta = STEP_TYPE_DETAILS[step.type];
                return (
                  <div
                    key={step.id}
                    className="rounded-xl border bg-card p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Step {index + 1}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badgeClassName}`}
                          >
                            {meta.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            stored order: {step.order}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{getStepPreview(step)}</p>
                          <p className="text-sm text-muted-foreground">
                            {meta.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveStep(step.id, "up")}
                          disabled={index === 0 || reordering}
                        >
                          <ArrowUp className="mr-1 h-4 w-4" />
                          Up
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveStep(step.id, "down")}
                          disabled={index === orderedSteps.length - 1 || reordering}
                        >
                          <ArrowDown className="mr-1 h-4 w-4" />
                          Down
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditStep(step)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeStep(step.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={stepOpen} onOpenChange={setStepOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStep ? "Edit Step" : "Add Step"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="stepType">Step Type</Label>
                <NativeSelect
                  id="stepType"
                  value={stepForm.type}
                  onChange={(e) =>
                    setStepForm((current) => {
                      const nextType = e.target.value as StepType;
                      return {
                        ...createDefaultStepForm(nextType, Number(current.order) || 0),
                        order: current.order,
                      };
                    })
                  }
                >
                  {STEP_TYPES.map((type) => (
                    <NativeSelectOption key={type} value={type}>
                      {STEP_TYPE_DETAILS[type].label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <p className="mt-2 text-xs text-muted-foreground">
                  {stepTypeMeta.description}
                </p>
              </div>

              <div>
                <Label htmlFor="stepOrder">Step Order</Label>
                <Input
                  id="stepOrder"
                  type="number"
                  value={stepForm.order}
                  onChange={(e) =>
                    setStepForm((current) => ({
                      ...current,
                      order: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {stepForm.type === "TEXT" && (
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="textTitle">Card Title</Label>
                  <Input
                    id="textTitle"
                    value={stepForm.title}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Optional heading for this story step"
                  />
                </div>
                <div>
                  <Label htmlFor="textBody">Body Text</Label>
                  <Textarea
                    id="textBody"
                    value={stepForm.body}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        body: e.target.value,
                      }))
                    }
                    placeholder="Write the story beat or explanation for this step."
                    rows={8}
                  />
                </div>
              </div>
            )}

            {stepForm.type === "TEXT_AUDIO" && (
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="audioTitle">Card Title</Label>
                  <Input
                    id="audioTitle"
                    value={stepForm.title}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Optional heading for this narrated step"
                  />
                </div>
                <div>
                  <Label htmlFor="audioBody">Body Text</Label>
                  <Textarea
                    id="audioBody"
                    value={stepForm.body}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        body: e.target.value,
                      }))
                    }
                    placeholder="Narrated content for this step."
                    rows={8}
                  />
                </div>
                <div>
                  <Label htmlFor="audioUrl">Audio URL</Label>
                  <Input
                    id="audioUrl"
                    value={stepForm.audioUrl}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        audioUrl: e.target.value,
                        mediaUrl: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}

            {stepForm.type === "IMAGE_FULL" && (
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={stepForm.imageUrl}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        imageUrl: e.target.value,
                        mediaUrl: e.target.value,
                        mediaType: "image",
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="imageCaption">Caption</Label>
                  <Input
                    id="imageCaption"
                    value={stepForm.caption}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        caption: e.target.value,
                      }))
                    }
                    placeholder="Short label shown under the image"
                  />
                </div>
                <div>
                  <Label htmlFor="imageDescription">Description</Label>
                  <Textarea
                    id="imageDescription"
                    value={stepForm.description}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Optional explanatory text for this image step"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {stepForm.type === "POLL" && (
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="pollQuestion">Poll Question</Label>
                  <Textarea
                    id="pollQuestion"
                    value={stepForm.question}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        question: e.target.value,
                      }))
                    }
                    placeholder="Ask the learner what they think before continuing."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="pollOptions">Options</Label>
                  <Textarea
                    id="pollOptions"
                    value={stepForm.optionsText}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        optionsText: e.target.value,
                      }))
                    }
                    placeholder={"Option 1\nOption 2\nOption 3"}
                    rows={6}
                  />
                </div>
              </div>
            )}

            {stepForm.type === "CHOICE" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="choicePrompt">Choice Prompt</Label>
                  <Textarea
                    id="choicePrompt"
                    value={stepForm.prompt}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        prompt: e.target.value,
                      }))
                    }
                    placeholder="What decision should the learner make?"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Choice Options</Label>
                    <Button variant="outline" size="sm" onClick={addChoiceOption}>
                      <Plus className="mr-1 h-4 w-4" />
                      Add option
                    </Button>
                  </div>

                  {stepForm.choiceOptions.map((option, index) => (
                    <div
                      key={`${index}-${option.nextStepId}`}
                      className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1fr_auto]"
                    >
                      <div>
                        <Label htmlFor={`choice-text-${index}`}>
                          Option {index + 1}
                        </Label>
                        <Input
                          id={`choice-text-${index}`}
                          value={option.text}
                          onChange={(e) =>
                            updateChoiceOption(index, "text", e.target.value)
                          }
                          placeholder="What the learner taps"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`choice-next-${index}`}>
                          Next Step ID
                        </Label>
                        <Input
                          id={`choice-next-${index}`}
                          value={option.nextStepId}
                          onChange={(e) =>
                            updateChoiceOption(index, "nextStepId", e.target.value)
                          }
                          placeholder="Optional branch target"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeChoiceOption(index)}
                          disabled={stepForm.choiceOptions.length <= 2}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stepForm.type === "QUIZ_QUESTION" && (
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="quizQuestion">Quiz Question</Label>
                  <Textarea
                    id="quizQuestion"
                    value={stepForm.question}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        question: e.target.value,
                      }))
                    }
                    placeholder="Ask a final checkpoint question."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="quizOptions">Answer Options</Label>
                  <Textarea
                    id="quizOptions"
                    value={stepForm.optionsText}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        optionsText: e.target.value,
                      }))
                    }
                    placeholder={"Correct answer\nDistractor 1\nDistractor 2"}
                    rows={6}
                  />
                </div>
                <div>
                  <Label htmlFor="correctOption">Correct Option Index</Label>
                  <Input
                    id="correctOption"
                    type="number"
                    min="0"
                    value={stepForm.correctOption}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        correctOption: e.target.value,
                      }))
                    }
                    placeholder="0 for first option, 1 for second..."
                  />
                </div>
                <div>
                  <Label htmlFor="quizExplanation">Feedback Explanation</Label>
                  <Textarea
                    id="quizExplanation"
                    value={stepForm.explanation}
                    onChange={(e) =>
                      setStepForm((current) => ({
                        ...current,
                        explanation: e.target.value,
                      }))
                    }
                    placeholder="Explain why the correct answer is right."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {stepForm.type === "RECAP" && (
              <div>
                <Label htmlFor="recapPoints">Recap Points</Label>
                <Textarea
                  id="recapPoints"
                  value={stepForm.pointsText}
                  onChange={(e) =>
                    setStepForm((current) => ({
                      ...current,
                      pointsText: e.target.value,
                    }))
                  }
                  placeholder={"Key takeaway 1\nKey takeaway 2\nKey takeaway 3"}
                  rows={7}
                />
              </div>
            )}

            {stepForm.type === "CONTINUE_BUTTON" && (
              <div>
                <Label htmlFor="buttonText">Button Label</Label>
                <Input
                  id="buttonText"
                  value={stepForm.buttonText}
                  onChange={(e) =>
                    setStepForm((current) => ({
                      ...current,
                      buttonText: e.target.value,
                    }))
                  }
                  placeholder="Continue"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStepOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveStep}>
              {editingStep ? "Update Step" : "Add Step"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
