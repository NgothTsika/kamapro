"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { deleteAdminLesson, getAdminLessons } from "@/lib/kama-api";
import type { AdminLessonSummary } from "@/lib/kama-types";

export default function LessonsListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminLessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [published, setPublished] = useState<"all" | "true" | "false">("all");

  const load = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await getAdminLessons(token, published);
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load lessons");
    } finally {
      setLoading(false);
    }
  }, [published]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(row: AdminLessonSummary) {
    if (
      !confirm(
        `Delete lesson “${row.title}”? This removes chapters and quizzes.`,
      )
    )
      return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await deleteAdminLesson(token, row.id);
      toast.success("Lesson deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
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
            <CardTitle>Lessons</CardTitle>
            <CardDescription>
              Draft and publish content for the mobile app.
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect
            value={published}
            onChange={(e) => setPublished(e.target.value as typeof published)}
            className="min-w-35"
          >
            <NativeSelectOption value="all">All</NativeSelectOption>
            <NativeSelectOption value="true">Published</NativeSelectOption>
            <NativeSelectOption value="false">Draft</NativeSelectOption>
          </NativeSelect>
          <Button asChild>
            <Link href="/content/lessons/new">
              <Plus className="size-4" />
              New lesson
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Chapters</TableHead>
              <TableHead>Quizzes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>Loading...</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>No lessons match this filter.</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="w-12">
                    {row.coverImage ? (
                      <img
                        src={row.coverImage}
                        alt={row.title}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>{row.category?.name ?? "—"}</TableCell>
                  <TableCell>{row._count.chapters}</TableCell>
                  <TableCell>{row._count.quizzes}</TableCell>
                  <TableCell>
                    <Badge variant={row.published ? "default" : "secondary"}>
                      {row.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon-sm" asChild>
                        <Link href={`/content/lessons/${row.id}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => onDelete(row)}
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
  );
}
