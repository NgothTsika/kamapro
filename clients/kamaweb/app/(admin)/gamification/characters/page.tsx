"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Unlock, ArrowLeft } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { getAdminToken } from "@/lib/admin-auth";
import { toast } from "sonner";

interface CharacterStat {
  characterId: string;
  characterName: string;
  rarityLevel: string;
  totalUnlocks: number;
  unlockPercentage: number;
  imageUrl: string;
}

interface CharactersData {
  data: CharacterStat[];
  totalCharacters: number;
  totalUnlocks: number;
  avgUnlocksPerCharacter: number;
}

export default function CharactersManagement() {
  const router = useRouter();
  const [characters, setCharacters] = useState<CharacterStat[]>([]);
  const [stats, setStats] = useState<CharactersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = getAdminToken();

  useEffect(() => {
    loadCharacters();
  }, []);

  async function loadCharacters() {
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/gamification/characters/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch characters");

      const data: CharactersData = await res.json();
      setCharacters(data.data);
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load characters",
      );
      toast.error("Failed to load characters data");
    } finally {
      setLoading(false);
    }
  }

  if (error && characters.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  const rarityColors: Record<string, string> = {
    common: "text-gray-500",
    uncommon: "text-green-500",
    rare: "text-blue-500",
    epic: "text-purple-500",
    legendary: "text-yellow-500",
  };

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

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Characters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalCharacters}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Unlocks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalUnlocks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg per Character
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.avgUnlocksPerCharacter.toFixed(1)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {characters[0]?.characterName || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Characters List */}
      <Card>
        <CardHeader>
          <CardTitle>Character Unlock Statistics</CardTitle>
          <CardDescription>
            Sorted by unlock count (most popular first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="space-y-6">
              {characters.map((char) => (
                <div
                  key={char.characterId}
                  className="space-y-2 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {char.imageUrl && (
                        <img
                          src={char.imageUrl}
                          alt={char.characterName}
                          className="size-10 rounded"
                        />
                      )}
                      <div>
                        <h4 className="font-semibold">{char.characterName}</h4>
                        <p
                          className={`text-xs font-medium ${
                            rarityColors[char.rarityLevel.toLowerCase()] ||
                            "text-gray-500"
                          }`}
                        >
                          {char.rarityLevel}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {char.totalUnlocks}
                        <span className="text-xs text-muted-foreground ml-1">
                          unlocks
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {char.unlockPercentage.toFixed(1)}% of users
                      </p>
                    </div>
                  </div>
                  <Progress value={char.unlockPercentage} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Character Table View */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed View</CardTitle>
          <CardDescription>
            Character unlock metrics in table format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Character</TableHead>
                  <TableHead>Rarity</TableHead>
                  <TableHead className="text-center">Unlocks</TableHead>
                  <TableHead className="text-center">% of Users</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {characters.map((char) => (
                  <TableRow key={char.characterId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {char.imageUrl && (
                          <img
                            src={char.imageUrl}
                            alt={char.characterName}
                            className="size-6 rounded"
                          />
                        )}
                        {char.characterName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          rarityColors[char.rarityLevel.toLowerCase()]
                        }`}
                      >
                        {char.rarityLevel}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {char.totalUnlocks}
                    </TableCell>
                    <TableCell className="text-center">
                      {char.unlockPercentage.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <div className="w-20 h-2 bg-muted rounded">
                        <div
                          className="h-full bg-primary rounded transition-all"
                          style={{
                            width: `${Math.min(100, char.unlockPercentage)}%`,
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
