"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, RotateCcw, Gift, Zap, ArrowLeft } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { getAdminToken } from "@/lib/admin-auth";
import {
  getStreaksData,
  resetUserStreak,
  awardStreakXp,
  freezeUserStreak,
} from "@/lib/kama-api";
import { toast } from "sonner";

interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  freezesRemaining: number;
  lastActivityAt: string | null;
  user: {
    id: string;
    username: string;
  };
}

interface StreaksData {
  data: UserStreak[];
  total: number;
  limit: number;
  offset: number;
}

export default function StreaksManagement() {
  const router = useRouter();
  const [streaks, setStreaks] = useState<UserStreak[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operating, setOperating] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [xpAmount, setXpAmount] = useState(100);
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState<
    "reset" | "award" | "freeze" | null
  >(null);

  const token = getAdminToken();

  useEffect(() => {
    loadStreaks();
  }, [offset, limit]);

  async function loadStreaks() {
    if (!token) return;

    try {
      setLoading(true);
      const data = await getStreaksData(
        token,
        limit,
        offset,
        "current",
        "desc",
      );
      setStreaks(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load streaks");
      toast.error("Failed to load streaks data");
    } finally {
      setLoading(false);
    }
  }

  async function performAction() {
    if (!token || !selectedUserId || !actionType) return;

    try {
      setOperating(selectedUserId);

      switch (actionType) {
        case "reset":
          await resetUserStreak(token, selectedUserId);
          break;
        case "award":
          await awardStreakXp(
            token,
            selectedUserId,
            parseInt(xpAmount as any),
            reason,
          );
          break;
        case "freeze":
          await freezeUserStreak(token, selectedUserId);
          break;
      }

      const actionNames = {
        reset: "Reset streak",
        award: "Awarded XP",
        freeze: "Frozen streak",
      };

      toast.success(`${actionNames[actionType]} for ${selectedUserId}`);
      loadStreaks();
      setSelectedUserId(null);
      setActionType(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setOperating(null);
    }
  }

  if (error && streaks.length === 0) {
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
      <div className="grid gap-4 md:grid-cols-3">
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
              Active Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {streaks.filter((s) => s.currentStreak > 0).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Max Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.max(...streaks.map((s) => s.longestStreak), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Streaks Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Streaks</CardTitle>
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
                      <TableHead className="text-center">Current</TableHead>
                      <TableHead className="text-center">Longest</TableHead>
                      <TableHead className="text-center">Freezes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {streaks.map((s) => (
                      <TableRow key={s.userId}>
                        <TableCell className="font-medium">
                          {s.user.username}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1">
                            <Flame className="size-3" />
                            {s.currentStreak}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {s.longestStreak}
                        </TableCell>
                        <TableCell className="text-center">
                          {s.freezesRemaining}/3
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Dialog
                              open={
                                selectedUserId === s.userId &&
                                actionType === "reset"
                              }
                              onOpenChange={(open) => {
                                if (!open) {
                                  setSelectedUserId(null);
                                  setActionType(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUserId(s.userId);
                                    setActionType("reset");
                                  }}
                                  disabled={operating !== null}
                                >
                                  <RotateCcw className="size-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reset Streak</DialogTitle>
                                  <DialogDescription>
                                    Reset {s.user.username}'s streak to 0
                                  </DialogDescription>
                                </DialogHeader>
                                <Button
                                  variant="destructive"
                                  onClick={performAction}
                                  disabled={operating === s.userId}
                                  className="w-full"
                                >
                                  {operating === s.userId
                                    ? "Resetting..."
                                    : "Confirm Reset"}
                                </Button>
                              </DialogContent>
                            </Dialog>

                            <Dialog
                              open={
                                selectedUserId === s.userId &&
                                actionType === "award"
                              }
                              onOpenChange={(open) => {
                                if (!open) {
                                  setSelectedUserId(null);
                                  setActionType(null);
                                  setXpAmount(100);
                                  setReason("");
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUserId(s.userId);
                                    setActionType("award");
                                  }}
                                  disabled={operating !== null}
                                >
                                  <Gift className="size-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Award XP</DialogTitle>
                                  <DialogDescription>
                                    Award bonus XP to {s.user.username}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="xp-amount">XP Amount</Label>
                                    <Input
                                      id="xp-amount"
                                      type="number"
                                      min="1"
                                      max="10000"
                                      value={xpAmount}
                                      onChange={(e) =>
                                        setXpAmount(
                                          parseInt(e.target.value) || 1,
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="reason">Reason</Label>
                                    <Textarea
                                      id="reason"
                                      placeholder="Why are you awarding this XP?"
                                      value={reason}
                                      onChange={(e) =>
                                        setReason(e.target.value)
                                      }
                                    />
                                  </div>
                                  <Button
                                    onClick={performAction}
                                    disabled={operating === s.userId || !reason}
                                    className="w-full"
                                  >
                                    {operating === s.userId
                                      ? "Awarding..."
                                      : "Award XP"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog
                              open={
                                selectedUserId === s.userId &&
                                actionType === "freeze"
                              }
                              onOpenChange={(open) => {
                                if (!open) {
                                  setSelectedUserId(null);
                                  setActionType(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUserId(s.userId);
                                    setActionType("freeze");
                                  }}
                                  disabled={
                                    operating !== null ||
                                    s.freezesRemaining === 0
                                  }
                                >
                                  <Zap className="size-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Freeze Streak</DialogTitle>
                                  <DialogDescription>
                                    Give {s.user.username} a streak freeze
                                  </DialogDescription>
                                </DialogHeader>
                                <p className="text-sm">
                                  Freezes remaining: {s.freezesRemaining}/3
                                </p>
                                <Button
                                  onClick={performAction}
                                  disabled={operating === s.userId}
                                  className="w-full"
                                >
                                  {operating === s.userId
                                    ? "Freezing..."
                                    : "Confirm Freeze"}
                                </Button>
                              </DialogContent>
                            </Dialog>
                          </div>
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
