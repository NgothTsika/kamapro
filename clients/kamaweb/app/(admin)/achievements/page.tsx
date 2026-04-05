"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAdminToken } from "@/lib/admin-auth";
import {
  createAchievement,
  getAchievementsCatalog,
  updateAchievement,
  deleteAchievement,
} from "@/lib/kama-api";
import type { Achievement } from "@/lib/kama-types";

type FormState = {
  name: string;
  description: string;
  icon: string;
  xpRequired: string;
  streakRequired: string;
};

const initialForm: FormState = {
  name: "",
  description: "",
  icon: "",
  xpRequired: "",
  streakRequired: "",
};

export default function AchievementsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadAchievements(currentToken: string) {
    setLoading(true);
    try {
      const data = await getAchievementsCatalog(currentToken);
      setAchievements(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load achievements",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const currentToken = getAdminToken();
    if (!currentToken) return;

    setToken(currentToken);
    void loadAchievements(currentToken);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update existing achievement
        console.log("Updating achievement:", editingId, {
          name: form.name.trim(),
          description: form.description.trim(),
          icon: form.icon.trim() || undefined,
          xpRequired: form.xpRequired ? Number(form.xpRequired) : null,
          streakRequired: form.streakRequired
            ? Number(form.streakRequired)
            : null,
        });
        await updateAchievement(token, editingId, {
          name: form.name.trim(),
          description: form.description.trim(),
          icon: form.icon.trim() || undefined,
          xpRequired: form.xpRequired ? Number(form.xpRequired) : null,
          streakRequired: form.streakRequired
            ? Number(form.streakRequired)
            : null,
        });
        toast.success("Achievement updated");
        setEditingId(null);
      } else {
        // Create new achievement
        console.log("Creating achievement:", {
          name: form.name.trim(),
          description: form.description.trim(),
          icon: form.icon.trim() || undefined,
          xpRequired: form.xpRequired ? Number(form.xpRequired) : undefined,
          streakRequired: form.streakRequired
            ? Number(form.streakRequired)
            : undefined,
        });
        await createAchievement(token, {
          name: form.name.trim(),
          description: form.description.trim(),
          icon: form.icon.trim() || undefined,
          xpRequired: form.xpRequired ? Number(form.xpRequired) : undefined,
          streakRequired: form.streakRequired
            ? Number(form.streakRequired)
            : undefined,
        });
        toast.success("Achievement created");
      }
      setForm(initialForm);
      await loadAchievements(token);
    } catch (error) {
      console.error("Error saving achievement:", error);
      toast.error(
        error instanceof Error ? error.message : "Unable to save achievement",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function onEdit(achievement: Achievement) {
    setEditingId(achievement.id);
    setForm({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon || "",
      xpRequired: achievement.xpRequired?.toString() || "",
      streakRequired: achievement.streakRequired?.toString() || "",
    });
  }

  function onCancel() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function onDelete(achievementId: string) {
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setDeletingId(achievementId);
    try {
      console.log("Deleting achievement:", achievementId);
      await deleteAchievement(token, achievementId);
      toast.success("Achievement deleted");
      await loadAchievements(token);
    } catch (error) {
      console.error("Error deleting achievement:", error);
      toast.error(
        error instanceof Error ? error.message : "Unable to delete achievement",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? "Edit achievement" : "Create achievement"}
          </CardTitle>
          <CardDescription>
            {editingId
              ? "Update this achievement."
              : "Add rewards for learner progression."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              required
            />
            <Input
              placeholder="Icon URL (optional)"
              value={form.icon}
              onChange={(event) =>
                setForm((current) => ({ ...current, icon: event.target.value }))
              }
            />
            <Input
              type="number"
              placeholder="XP required"
              value={form.xpRequired}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  xpRequired: event.target.value,
                }))
              }
            />
            <Input
              type="number"
              placeholder="Streak required"
              value={form.streakRequired}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  streakRequired: event.target.value,
                }))
              }
            />
            <div className="flex gap-2">
              <Button className="flex-1" disabled={submitting}>
                {submitting
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                    ? "Update"
                    : "Create"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
          <CardDescription>
            Current achievements available in KamaGame.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : achievements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No achievements yet.
            </p>
          ) : (
            achievements.map((achievement) => (
              <div key={achievement.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-medium">{achievement.name}</p>
                  <div className="flex gap-1">
                    {achievement.xpRequired ? (
                      <Badge variant="outline">
                        XP {achievement.xpRequired}
                      </Badge>
                    ) : null}
                    {achievement.streakRequired ? (
                      <Badge variant="outline">
                        Streak {achievement.streakRequired}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {achievement.description}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(achievement)}
                    disabled={editingId !== null || deletingId !== null}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(achievement.id)}
                    disabled={
                      editingId !== null || deletingId === achievement.id
                    }
                  >
                    {deletingId === achievement.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
