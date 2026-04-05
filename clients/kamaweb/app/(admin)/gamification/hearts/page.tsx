"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, RefreshCw, RotateCcw, ArrowLeft } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminToken } from "@/lib/admin-auth";
import { toast } from "sonner";

interface UserHearts {
  userId: string;
  hearts: number;
  maxHearts: number;
  configuredMaxHearts?: number;
  lastHeartLossAt: string | null;
  nextRecoveryAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
}

interface HeartsData {
  data: UserHearts[];
  total: number;
  limit: number;
  offset: number;
  configuredMaxHearts?: number;
}

export default function HeartsManagement() {
  const router = useRouter();
  const [hearts, setHearts] = useState<UserHearts[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [restoreAmount, setRestoreAmount] = useState(5);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [configuredMaxHearts, setConfiguredMaxHearts] = useState<number | null>(
    null,
  );

  const token = getAdminToken();

  useEffect(() => {
    loadHearts();
  }, [offset, limit]);

  async function loadHearts() {
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(
        `/api/v1/admin/gamification/hearts?limit=${limit}&offset=${offset}&sortBy=hearts&order=desc`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Failed to fetch hearts");

      const data: HeartsData = await res.json();
      setHearts(data.data);
      setTotal(data.total);
      if (data.configuredMaxHearts) {
        setConfiguredMaxHearts(data.configuredMaxHearts);
        setRestoreAmount(data.configuredMaxHearts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hearts");
      toast.error("Failed to load hearts data");
    } finally {
      setLoading(false);
    }
  }

  async function restoreUserHearts(userId: string, amount: number) {
    if (!token) return;

    try {
      setRestoring(userId);
      const res = await fetch(
        `/api/v1/admin/gamification/hearts/${userId}/restore`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ hearts: amount }),
        },
      );

      if (!res.ok) throw new Error("Failed to restore hearts");

      toast.success(`Restored ${amount} hearts for ${userId}`);
      loadHearts();
      setSelectedUserId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore");
    } finally {
      setRestoring(null);
    }
  }

  async function bulkRestoreAll() {
    if (!token) return;

    try {
      setRestoring("all");
      const res = await fetch(`/api/v1/admin/gamification/hearts/restore-all`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hearts: configuredMaxHearts ?? 5 }),
      });

      if (!res.ok) throw new Error("Failed to bulk restore");

      const result = await res.json();
      toast.success(`Restored hearts for ${result.usersUpdated} users`);
      loadHearts();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to bulk restore",
      );
    } finally {
      setRestoring(null);
    }
  }

  async function syncAllHeartsWithSettings() {
    if (!token) return;

    try {
      setRestoring("sync");
      const res = await fetch(`/api/v1/admin/gamification/hearts/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to sync hearts");

      const result = await res.json();
      toast.success(
        `Synced ${result.totalUsersUpdated} users with gamification settings`,
      );
      loadHearts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sync hearts");
    } finally {
      setRestoring(null);
    }
  }

  if (error && hearts.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  const pages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Max Hearts Setting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {configuredMaxHearts ?? (
                <span className="text-sm text-muted-foreground">
                  Loading...
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Full Hearts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {configuredMaxHearts
                ? hearts.filter((h) => h.hearts === configuredMaxHearts).length
                : hearts.filter((h) => h.hearts === h.maxHearts).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">No Hearts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {hearts.filter((h) => h.hearts === 0).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage user hearts and recovery{" "}
            {configuredMaxHearts && `(Max: ${configuredMaxHearts})`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={bulkRestoreAll}
            disabled={restoring !== null}
            className="gap-2"
          >
            <RotateCcw className="size-4" />
            {restoring === "all"
              ? "Restoring..."
              : `Restore All to ${configuredMaxHearts ?? 5} Hearts`}
          </Button>
          <Button
            onClick={syncAllHeartsWithSettings}
            disabled={restoring !== null}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            {restoring === "sync"
              ? "Syncing..."
              : "Sync All Hearts with Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Hearts Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Hearts</CardTitle>
          <CardDescription>
            Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}{" "}
            users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="text-center">Hearts</TableHead>
                      <TableHead className="text-center">Max</TableHead>
                      <TableHead>Next Recovery</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hearts.map((h) => (
                      <TableRow key={h.userId}>
                        <TableCell className="font-medium">
                          {h.user.username}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1">
                            <Heart className="size-3" />
                            {h.hearts}/{configuredMaxHearts ?? h.maxHearts}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {configuredMaxHearts ?? h.maxHearts}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(h.nextRecoveryAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog
                            open={selectedUserId === h.userId}
                            onOpenChange={(open) => {
                              if (!open) setSelectedUserId(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUserId(h.userId)}
                                disabled={restoring !== null}
                              >
                                <RefreshCw className="size-3 mr-1" />
                                Restore
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Restore Hearts</DialogTitle>
                                <DialogDescription>
                                  Restore hearts for {h.user.username}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="restore-amount">
                                    Hearts to restore (Max:{" "}
                                    {configuredMaxHearts ?? h.maxHearts})
                                  </Label>
                                  <Input
                                    id="restore-amount"
                                    type="number"
                                    min="1"
                                    max={configuredMaxHearts ?? 10}
                                    value={restoreAmount}
                                    onChange={(e) =>
                                      setRestoreAmount(
                                        Math.min(
                                          configuredMaxHearts ?? 10,
                                          parseInt(e.target.value) || 1,
                                        ),
                                      )
                                    }
                                  />
                                </div>
                                <Button
                                  onClick={() =>
                                    restoreUserHearts(h.userId, restoreAmount)
                                  }
                                  disabled={restoring === h.userId}
                                  className="w-full"
                                >
                                  {restoring === h.userId
                                    ? "Restoring..."
                                    : "Confirm Restore"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset + limit >= total}
                    onClick={() => setOffset(offset + limit)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
