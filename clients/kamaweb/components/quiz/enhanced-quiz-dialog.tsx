"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/file-upload";
import { Trash2, Plus } from "lucide-react";

export type QuizType =
  | "true_false"
  | "multiple_choice"
  | "image_choice"
  | "poll";

export interface QuizFormData {
  question: string;
  chapterId?: string | null;
  type: QuizType;
  options: string[];
  optionImages?: string[];
  correctOption: number | null;
  explanation: string;
  order: number;
  heartLimit: number;
  difficulty?: "easy" | "medium" | "hard";
  timeLimitSeconds?: number;
  questionAudioUrl?: string | null; // NEW
  isPoll?: boolean; // NEW
  pollDescription?: string | null; // NEW
}

interface EnhancedQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: QuizFormData) => Promise<void>;
  initialData?: Partial<QuizFormData>;
  title?: string;
  lessonId: string;
  chapters?: Array<{ id: string; title: string; order: number }>;
}

export function EnhancedQuizDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
  title = "New quiz question",
  lessonId,
  chapters = [],
}: EnhancedQuizDialogProps) {
  const [saving, setSaving] = useState(false);
  const [quizType, setQuizType] = useState<QuizType>(
    (initialData?.type as QuizType) || "multiple_choice",
  );
  const [form, setForm] = useState<QuizFormData>({
    question: "",
    chapterId: null,
    type: "multiple_choice",
    options: ["", ""],
    optionImages: [],
    correctOption: 0,
    explanation: "",
    order: 0,
    heartLimit: 4,
    difficulty: "medium",
    timeLimitSeconds: undefined,
    questionAudioUrl: null,
    isPoll: false,
    pollDescription: null,
  });

  // Update form when initialData changes
  useEffect(() => {
    if (!open) return;

    const newType = (initialData?.type as QuizType) || "multiple_choice";
    const isPoll = initialData?.isPoll || newType === "poll";

    setQuizType(newType);
    setForm({
      question: initialData?.question || "",
      chapterId: initialData?.chapterId || null,
      type: newType,
      options:
        newType === "true_false"
          ? ["True", "False"]
          : newType === "image_choice"
            ? (initialData?.options?.length
                ? initialData.options
                : ["", ""]).slice(
                0,
                Math.max(2, initialData?.optionImages?.length || 2),
              )
            : (initialData?.options ?? ["", ""]),
      optionImages:
        newType === "image_choice"
          ? (initialData?.optionImages?.length
              ? initialData.optionImages
              : ["", ""]).slice(
              0,
              Math.max(2, initialData?.options?.length || 2),
            )
          : [],
      correctOption: isPoll ? null : (initialData?.correctOption ?? 0),
      explanation: initialData?.explanation || "",
      order: initialData?.order || 0,
      heartLimit: initialData?.heartLimit || 4,
      difficulty: initialData?.difficulty || "medium",
      timeLimitSeconds: initialData?.timeLimitSeconds,
      questionAudioUrl: initialData?.questionAudioUrl || null,
      isPoll,
      pollDescription: initialData?.pollDescription || null,
    });
  }, [initialData, open]);

  const handleTypeChange = (newType: QuizType) => {
    const nextIsPoll = newType === "poll";
    setQuizType(newType);
    setForm((f) => ({
      ...f,
      type: newType,
      isPoll: nextIsPoll,
      options:
        newType === "true_false"
          ? ["True", "False"]
          : newType === "image_choice"
            ? (f.options?.length ? f.options : ["", ""]).slice(
                0,
                Math.max(2, f.optionImages?.length || 2),
              )
            : f.options || ["", ""],
      optionImages:
        newType === "image_choice"
          ? (f.optionImages?.length ? f.optionImages : ["", ""]).slice(
              0,
              Math.max(2, f.options?.length || 2),
            )
          : [],
      correctOption: nextIsPoll ? null : (f.correctOption ?? 0),
    }));
  };

  const addOption = () => {
    setForm((f) => ({
      ...f,
      options: [...f.options, ""],
    }));
  };

  const removeOption = (index: number) => {
    setForm((f) => ({
      ...f,
      options: f.options.filter((_, i) => i !== index),
      correctOption:
        f.correctOption === index
          ? 0
          : f.correctOption !== null && f.correctOption > index
            ? f.correctOption - 1
            : f.correctOption,
    }));
  };

  const updateOption = (index: number, value: string) => {
    setForm((f) => ({
      ...f,
      options: f.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  const updateOptionImage = (index: number, url: string) => {
    setForm((f) => ({
      ...f,
      optionImages: (f.optionImages || []).map((img, i) =>
        i === index ? url : img,
      ),
    }));
  };

  const handleSave = async () => {
    const isPoll = form.isPoll || quizType === "poll";

    if (!form.question.trim()) {
      alert("Question is required");
      return;
    }

    if (form.options.length < 2) {
      alert("At least 2 options are required");
      return;
    }

    if (quizType === "image_choice") {
      const imageCount = form.optionImages?.length || 0;
      if (imageCount < 2) {
        alert("Add at least 2 image options");
        return;
      }

      if (imageCount !== form.options.length) {
        alert("Each image option needs a matching label");
        return;
      }

      if (form.optionImages?.some((image) => !image.trim())) {
        alert("All image options must include an image");
        return;
      }
    }

    if (quizType !== "true_false" && form.options.some((opt) => !opt.trim())) {
      alert("All options must be filled");
      return;
    }

    if (
      form.correctOption !== null &&
      form.correctOption >= form.options.length
    ) {
      alert("Correct option index is out of range");
      return;
    }

    if (!isPoll && form.correctOption === null) {
      alert("Quizzes require a correct answer");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...form,
        type: quizType,
        isPoll,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save quiz:", error);
      alert(
        error instanceof Error ? error.message : "Failed to save quiz question",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Create a new quiz question with flexible answer formats
          </DialogDescription>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t">
            <Switch
              id="isPoll"
              checked={form.isPoll || false}
              onCheckedChange={(v) =>
                setForm((f) => ({
                  ...f,
                  isPoll: v,
                  correctOption: v ? null : 0,
                  type: v ? "poll" : (f.type === "poll" ? "multiple_choice" : f.type),
                }))
              }
            />
            <Label htmlFor="isPoll" className="cursor-pointer">
              This is a poll (not a scored quiz)
            </Label>
          </div>
          {chapters.length > 0 ? (
            <div className="grid gap-2 mt-4">
              <Label htmlFor="quizChapter">Attach to chapter</Label>
              <NativeSelect
                value={form.chapterId ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    chapterId: e.target.value || null,
                  }))
                }
              >
                <NativeSelectOption value="">
                  Lesson-level quiz
                </NativeSelectOption>
                {chapters.map((chapter) => (
                  <NativeSelectOption key={chapter.id} value={chapter.id}>
                    {chapter.order}. {chapter.title}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          ) : null}
        </DialogHeader>

        <Tabs
          value={quizType}
          onValueChange={(v) => handleTypeChange(v as QuizType)}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="true_false">True/False</TabsTrigger>
            <TabsTrigger value="multiple_choice">MPL Choice</TabsTrigger>
            <TabsTrigger value="image_choice">Image</TabsTrigger>
            <TabsTrigger value="poll">Poll</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="true_false" className="grid gap-4 p-4">
              <div className="grid gap-2">
                <Label>Question</Label>
                <Textarea
                  value={form.question}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, question: e.target.value }))
                  }
                  placeholder="Ask a true/false question..."
                  className="min-h-20"
                />
              </div>

              <div className="grid gap-2">
                <Label>Correct Answer</Label>
                <NativeSelect
                  value={String(form.correctOption)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      correctOption: Number(e.target.value),
                    }))
                  }
                >
                  <NativeSelectOption value="0">True</NativeSelectOption>
                  <NativeSelectOption value="1">False</NativeSelectOption>
                </NativeSelect>
              </div>

              <QuestionsCommonFields form={form} setForm={setForm} />
            </TabsContent>

            <TabsContent value="multiple_choice" className="grid gap-4 p-4">
              <div className="grid gap-2">
                <Label>Question</Label>
                <Textarea
                  value={form.question}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, question: e.target.value }))
                  }
                  placeholder="Ask your question..."
                  className="min-h-20"
                />
              </div>

              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label>Answer Options</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addOption}
                    disabled={form.options.length >= 6}
                  >
                    <Plus className="size-4 mr-1" />
                    Add option
                  </Button>
                </div>

                <div className="grid gap-3">
                  {form.options.map((option, idx) => (
                    <div key={idx} className="flex gap-2 items-end">
                      <div className="flex-1 grid gap-1">
                        <Label className="text-xs">Option {idx + 1}</Label>
                        <Input
                          value={option}
                          onChange={(e) => updateOption(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant={
                          form.correctOption === idx ? "default" : "outline"
                        }
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            correctOption: idx,
                          }))
                        }
                        title={
                          form.correctOption === idx
                            ? "This is the correct answer"
                            : "Mark as correct"
                        }
                        style={{ display: form.isPoll ? "none" : undefined }}
                      >
                        {form.correctOption === idx ? "✓" : "○"}
                      </Button>
                      {form.options.length > 2 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeOption(idx)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <QuestionsCommonFields form={form} setForm={setForm} />
            </TabsContent>

            <TabsContent value="image_choice" className="grid gap-4 p-4">
              <div className="grid gap-2">
                <Label>Question</Label>
                <Textarea
                  value={form.question}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, question: e.target.value }))
                  }
                  placeholder="Ask your question..."
                  className="min-h-20"
                />
              </div>

              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label>Image Options (max 4)</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        options: [...f.options, ""],
                        optionImages: [...(f.optionImages || []), ""],
                      }));
                    }}
                    disabled={(form.optionImages?.length || 0) >= 4}
                  >
                    <Plus className="size-4 mr-1" />
                    Add image
                  </Button>
                </div>

                <div className="grid gap-4">
                  {(form.optionImages || []).map((image, idx) => (
                    <div key={idx} className="border rounded-lg p-4 grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label>Option {idx + 1} Image</Label>
                        <Button
                          size="sm"
                          variant={
                            form.correctOption === idx ? "default" : "outline"
                          }
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              correctOption: idx,
                            }))
                          }
                          title={
                            form.correctOption === idx
                              ? "This is the correct answer"
                              : "Mark as correct"
                          }
                        >
                          {form.correctOption === idx ? "✓ Correct" : "Mark"}
                        </Button>
                      </div>

                      <div className="grid gap-1">
                        <Label className="text-xs">Option {idx + 1} Label</Label>
                        <Input
                          value={form.options[idx] || ""}
                          onChange={(e) => updateOption(idx, e.target.value)}
                          placeholder={`Label for image ${idx + 1}`}
                        />
                      </div>

                      <FileUpload
                        bucket="quiz-media"
                        folder={lessonId}
                        accepts="image"
                        currentValue={image}
                        onUploadComplete={(url) => updateOptionImage(idx, url)}
                      />
                      <div className="text-sm text-gray-500 mt-2">
                        Or paste external URL:
                      </div>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={image}
                        onChange={(e) => updateOptionImage(idx, e.target.value)}
                      />

                      {image && (
                        <div className="relative w-full h-32 bg-muted rounded border">
                          <img
                            src={image}
                            alt={`Option ${idx + 1}`}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      )}

                      {(form.optionImages?.length || 0) > 2 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              options: f.options.filter((_, i) => i !== idx),
                              optionImages: (f.optionImages || []).filter(
                                (_, i) => i !== idx,
                              ),
                              correctOption:
                                f.correctOption === idx
                                  ? 0
                                  : f.correctOption !== null &&
                                      f.correctOption > idx
                                    ? f.correctOption - 1
                                    : f.correctOption,
                            }));
                          }}
                        >
                          <Trash2 className="size-4 mr-1" />
                          Remove image
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <QuestionsCommonFields form={form} setForm={setForm} />
            </TabsContent>

            <TabsContent value="poll" className="grid gap-4 p-4">
              <div className="grid gap-2">
                <Label>Poll Question</Label>
                <Textarea
                  value={form.question}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, question: e.target.value }))
                  }
                  placeholder="What do you think about...?"
                  className="min-h-20"
                />
              </div>

              <div className="grid gap-2">
                <Label>Poll Description (optional)</Label>
                <Textarea
                  value={form.pollDescription || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pollDescription: e.target.value || null,
                    }))
                  }
                  placeholder="Additional context or guidance for respondents..."
                  className="min-h-16"
                />
              </div>

              <div className="grid gap-2">
                <Label>Answer Options</Label>
                <div className="space-y-2">
                  {form.options.map((option, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder={`Option ${idx + 1}`}
                        value={option}
                        onChange={(e) => updateOption(idx, e.target.value)}
                      />
                      {form.options.length > 2 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeOption(idx)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="size-4 mr-1" />
                    Add option
                  </Button>
                </div>
              </div>

              <QuestionsCommonFields form={form} setForm={setForm} />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuestionsCommonFields({
  form,
  setForm,
}: {
  form: QuizFormData;
  setForm: (
    update: QuizFormData | ((prev: QuizFormData) => QuizFormData),
  ) => void;
}) {
  return (
    <div className="grid gap-4 border-t pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Difficulty</Label>
          <NativeSelect
            value={form.difficulty}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                difficulty: e.target.value as "easy" | "medium" | "hard",
              }))
            }
          >
            <NativeSelectOption value="easy">Easy</NativeSelectOption>
            <NativeSelectOption value="medium">Medium</NativeSelectOption>
            <NativeSelectOption value="hard">Hard</NativeSelectOption>
          </NativeSelect>
        </div>

        {!form.isPoll && (
          <div className="grid gap-2">
            <Label>Heart Limit</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={form.heartLimit}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  heartLimit: Number(e.target.value) || 4,
                }))
              }
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Time Limit (seconds, optional)</Label>
          <Input
            type="number"
            min="0"
            value={form.timeLimitSeconds || ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                timeLimitSeconds: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              }))
            }
            placeholder="No limit"
          />
        </div>

        <div className="grid gap-2">
          <Label>Order</Label>
          <Input
            type="number"
            min="0"
            value={form.order}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                order: Number(e.target.value) || 0,
              }))
            }
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Question Audio URL (optional)</Label>
        <Input
          placeholder="https://..."
          value={form.questionAudioUrl || ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              questionAudioUrl: e.target.value || null,
            }))
          }
        />
      </div>

      {!form.isPoll && (
        <div className="grid gap-2">
          <Label>Explanation</Label>
          <Textarea
            value={form.explanation}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                explanation: e.target.value,
              }))
            }
            placeholder="Why is this the correct answer?"
            className="min-h-20"
          />
        </div>
      )}
    </div>
  );
}
