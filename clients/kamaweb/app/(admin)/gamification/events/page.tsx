"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft, Trash2, Sparkles } from "lucide-react";
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
  DialogTrigger,
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

interface GameEvent {
  id: string;
  eventName: string;
  multiplier: number;
  durationHours: number;
  affectedSystem: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function SpecialEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  // Event creation state
  const [eventName, setEventName] = useState("");
  const [multiplier, setMultiplier] = useState(2);
  const [durationHours, setDurationHours] = useState(24);
  const [affectedSystem, setAffectedSystem] = useState("all");

  const token = getAdminToken();

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    if (!token) return;

    try {
      setLoadingEvents(true);
      const res = await fetch(`/api/v1/admin/gamification/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch events");

      const data = await res.json();
      setEvents(Array.isArray(data) ? data : data.events || []);
    } catch (err) {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }

  async function createEvent() {
    if (!token) return;

    try {
      setCreatingEvent(true);
      const res = await fetch(`/api/v1/admin/gamification/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventName,
          multiplier,
          durationHours,
          affectedSystem,
        }),
      });

      if (!res.ok) throw new Error("Failed to create event");

      toast.success(
        `Event "${eventName}" created with ${multiplier}x multiplier`,
      );

      // Reset form and close dialog
      setEventName("");
      setMultiplier(2);
      setDurationHours(24);
      setAffectedSystem("all");
      setEventDialogOpen(false);

      // Reload events
      await loadEvents();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create event",
      );
    } finally {
      setCreatingEvent(false);
    }
  }

  async function deleteEvent(eventId: string) {
    if (!token) return;

    try {
      const res = await fetch(`/api/v1/admin/gamification/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete event");

      toast.success("Event deleted successfully");
      await loadEvents();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete event",
      );
    }
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
        Back to Gamification
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-6 text-yellow-500" />
            <h1 className="text-3xl font-bold">Special Events</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Create temporary multiplier events to boost player engagement
          </p>
        </div>
      </div>

      {/* Create Event Button */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="size-4" />
            Create Event
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Special Event</DialogTitle>
            <DialogDescription>
              Create a temporary multiplier event for all players
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                placeholder="e.g., Double XP Weekend"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="multiplier">Multiplier</Label>
                <Input
                  id="multiplier"
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={multiplier.toString()}
                  onChange={(e) =>
                    setMultiplier(parseFloat(e.target.value) || 2)
                  }
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="720"
                  value={durationHours.toString()}
                  onChange={(e) =>
                    setDurationHours(parseInt(e.target.value) || 24)
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="system">Affects</Label>
              <Select value={affectedSystem} onValueChange={setAffectedSystem}>
                <SelectTrigger id="system">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hearts">Hearts</SelectItem>
                  <SelectItem value="xp">XP</SelectItem>
                  <SelectItem value="all">All Systems</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={createEvent}
              disabled={creatingEvent || !eventName}
              className="w-full"
            >
              {creatingEvent ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Events List */}
      <div className="space-y-4">
        {loadingEvents ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading events...</p>
            </CardContent>
          </Card>
        ) : events.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Active Events ({events.length})
              </h2>
            </div>
            <div className="grid gap-4">
              {events.map((event) => {
                const endsAt = new Date(event.endsAt);
                const now = new Date();
                const timeRemaining = Math.ceil(
                  (endsAt.getTime() - now.getTime()) / (1000 * 60 * 60),
                );

                return (
                  <Card
                    key={event.id}
                    className="border-l-4 border-l-yellow-500 bg-linear-to-br from-amber-50 to-orange-50"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base truncate">
                              {event.eventName}
                            </CardTitle>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 shrink-0">
                              ✓ Active
                            </span>
                          </div>
                          <CardDescription className="mt-1 text-xs">
                            {event.multiplier}x Multiplier •{" "}
                            {event.affectedSystem.charAt(0).toUpperCase() +
                              event.affectedSystem.slice(1)}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEvent(event.id)}
                          className="text-destructive hover:text-destructive ml-2"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="py-0">
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 text-xs">
                        <div className="bg-white rounded p-2 text-center">
                          <p className="text-muted-foreground text-xs">
                            Duration
                          </p>
                          <p className="font-semibold">
                            {event.durationHours}h
                          </p>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <p className="text-muted-foreground text-xs">
                            Time Left
                          </p>
                          <p className="font-semibold text-amber-600">
                            {timeRemaining > 0
                              ? `${timeRemaining}h`
                              : "Expired"}
                          </p>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <p className="text-muted-foreground text-xs">
                            Started
                          </p>
                          <p className="font-medium">
                            {new Date(event.startsAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </p>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <p className="text-muted-foreground text-xs">
                            Expires
                          </p>
                          <p className="font-medium text-amber-600">
                            {endsAt.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center space-y-3">
              <Sparkles className="size-12 text-gray-300 mx-auto" />
              <div>
                <p className="text-lg font-semibold">No active events</p>
                <p className="text-muted-foreground mt-1">
                  Create your first special event to boost player engagement!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Event Info Card */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">About Special Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">Multiplier Range:</span> 0.5x to 10x
            (50% to 1000% bonus)
          </p>
          <p>
            <span className="font-semibold">Max Duration:</span> 720 hours (30
            days)
          </p>
          <p>
            <span className="font-semibold">Multiplier Types:</span> Apply to
            Hearts, XP, or Both
          </p>
          <p>
            <span className="font-semibold">Stacking:</span> Multiple active
            events multiply together
          </p>
          <p>
            <span className="font-semibold">Auto-Expiration:</span> Events
            automatically expire when time runs out
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
