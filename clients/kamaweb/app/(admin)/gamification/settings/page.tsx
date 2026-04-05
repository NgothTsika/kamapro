"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, ArrowLeft } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAdminToken } from "@/lib/admin-auth";
import { toast } from "sonner";

interface Config {
  hearts?: {
    maxHearts?: number;
    recoveryTimeMs?: number;
    premiumRecoveryTimeMs?: number;
  };
  streaks?: {
    checkInHours?: number;
    xpMultiplierFormula?: string;
    milestones?: number[];
  };
  characters?: {
    unlockXpThreshold?: number;
    purchaseXpCost?: number;
  };
  gamification?: {
    enabled?: boolean;
    eventMultiplier?: number;
  };
}

export default function GamificationSettings() {
  const router = useRouter();
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingSection, setUpdatingSection] = useState<string | null>(null);

  const token = getAdminToken();

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/gamification/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch config");

      const data = await res.json();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load config");
      toast.error("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  }

  async function updateConfig(section: string) {
    if (!token || !config) return;

    try {
      setUpdatingSection(section);
      const res = await fetch(`/api/v1/admin/gamification/config`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error("Failed to update config");

      toast.success(`${section} configuration updated successfully`);
      // Don't reload, just keep the updated state
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdatingSection(null);
    }
  }

  if (error && !config) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

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

      {/* Hearts Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Hearts System</CardTitle>
          <CardDescription>Configure heart mechanics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="maxHearts">Max Hearts</Label>
                  <Input
                    id="maxHearts"
                    type="number"
                    min="1"
                    max="10"
                    value={config?.hearts?.maxHearts || 5}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hearts: {
                          ...config?.hearts,
                          maxHearts: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="recoveryTime">Recovery Time (minutes)</Label>
                  <Input
                    id="recoveryTime"
                    type="number"
                    min="5"
                    value={(
                      (config?.hearts?.recoveryTimeMs || 3600000) / 60000
                    ).toFixed(0)}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hearts: {
                          ...config?.hearts,
                          recoveryTimeMs: parseInt(e.target.value) * 60000,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="premiumRecovery">
                    Premium Recovery (minutes)
                  </Label>
                  <Input
                    id="premiumRecovery"
                    type="number"
                    min="5"
                    value={(
                      (config?.hearts?.premiumRecoveryTimeMs || 1800000) / 60000
                    ).toFixed(0)}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hearts: {
                          ...config?.hearts,
                          premiumRecoveryTimeMs:
                            parseInt(e.target.value) * 60000,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <Button
                onClick={() => updateConfig("Hearts")}
                disabled={updatingSection === "Hearts"}
              >
                {updatingSection === "Hearts"
                  ? "Saving..."
                  : "Save Hearts Configuration"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Streaks Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Streaks System</CardTitle>
          <CardDescription>Configure streak mechanics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div>
                <Label htmlFor="checkInHours">Check-in Hours</Label>
                <Input
                  id="checkInHours"
                  type="number"
                  min="1"
                  value={config?.streaks?.checkInHours || 24}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      streaks: {
                        ...config?.streaks,
                        checkInHours: parseInt(e.target.value),
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Hours between required check-ins to maintain streak
                </p>
              </div>
              <div>
                <Label htmlFor="xpFormula">XP Multiplier Formula</Label>
                <Input
                  id="xpFormula"
                  value={config?.streaks?.xpMultiplierFormula || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      streaks: {
                        ...config?.streaks,
                        xpMultiplierFormula: e.target.value,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Example: 1 + (currentStreak / 100) for 1x to 2x multiplier
                </p>
              </div>
              <Button
                onClick={() => updateConfig("Streaks")}
                disabled={updatingSection === "Streaks"}
              >
                {updatingSection === "Streaks"
                  ? "Saving..."
                  : "Save Streaks Configuration"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Characters Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Characters System</CardTitle>
          <CardDescription>Configure character mechanics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="unlockThreshold">Unlock XP Threshold</Label>
                  <Input
                    id="unlockThreshold"
                    type="number"
                    min="0"
                    value={config?.characters?.unlockXpThreshold || 100}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        characters: {
                          ...config?.characters,
                          unlockXpThreshold: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="purchaseCost">Purchase XP Cost</Label>
                  <Input
                    id="purchaseCost"
                    type="number"
                    min="0"
                    value={config?.characters?.purchaseXpCost || 50}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        characters: {
                          ...config?.characters,
                          purchaseXpCost: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
              <Button
                onClick={() => updateConfig("Characters")}
                disabled={updatingSection === "Characters"}
              >
                {updatingSection === "Characters"
                  ? "Saving..."
                  : "Save Characters Configuration"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Special Events - Moved to Dedicated Page */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Special Events</CardTitle>
          <CardDescription>Manage temporary multiplier events</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Special Events management has been moved to its own dedicated page
            for better organization and easier access.
          </p>
          <Button asChild>
            <Link href="/gamification/events">Go to Special Events →</Link>
          </Button>
        </CardContent>
      </Card> */}
    </div>
  );
}
