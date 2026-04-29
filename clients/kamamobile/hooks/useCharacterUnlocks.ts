import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/auth/auth-context";
import {
  buildCharacterUnlockMap,
  getNextUnlockCharacter,
  getUnlockedCharacterIds,
  type CharacterUnlockState,
} from "@/lib/character-progress";
import type { Character, DashboardData } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "kama_character_unlocks_v1";

export function useCharacterUnlocks({
  characters,
  dashboard,
  totalXp,
}: {
  characters: Character[];
  dashboard: DashboardData | null;
  totalXp: number;
}) {
  const { user } = useAuth();
  const [persistedUnlockedIds, setPersistedUnlockedIds] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  const storageKey = `${STORAGE_KEY}:${user?.id ?? "guest"}`;

  useEffect(() => {
    let isMounted = true;

    async function loadPersistedUnlocks() {
      setIsReady(false);

      try {
        const rawValue = await AsyncStorage.getItem(storageKey);
        const nextIds = rawValue ? (JSON.parse(rawValue) as string[]) : [];

        if (isMounted) {
          setPersistedUnlockedIds(Array.isArray(nextIds) ? nextIds : []);
        }
      } catch {
        if (isMounted) {
          setPersistedUnlockedIds([]);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    void loadPersistedUnlocks();

    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  const statesById = useMemo(
    () =>
      buildCharacterUnlockMap({
        characters,
        dashboard,
        totalXp,
        persistedUnlockedIds,
      }),
    [characters, dashboard, persistedUnlockedIds, totalXp],
  );

  const unlockedIds = useMemo(
    () => new Set(getUnlockedCharacterIds(statesById)),
    [statesById],
  );

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const nextUnlockedIds = Array.from(unlockedIds);
    const currentSorted = [...persistedUnlockedIds].sort();
    const nextSorted = [...nextUnlockedIds].sort();

    if (JSON.stringify(currentSorted) === JSON.stringify(nextSorted)) {
      return;
    }

    setPersistedUnlockedIds(nextUnlockedIds);
    void AsyncStorage.setItem(storageKey, JSON.stringify(nextUnlockedIds));
  }, [isReady, persistedUnlockedIds, storageKey, unlockedIds]);

  const unlockedCharacters = useMemo(
    () => characters.filter((character) => unlockedIds.has(character.id)),
    [characters, unlockedIds],
  );
  const lockedCharacters = useMemo(
    () => characters.filter((character) => !unlockedIds.has(character.id)),
    [characters, unlockedIds],
  );
  const nextUnlockCharacter = useMemo(
    () => getNextUnlockCharacter(characters, statesById),
    [characters, statesById],
  );

  return {
    isReady,
    statesById,
    unlockedIds,
    unlockedCharacters,
    lockedCharacters,
    nextUnlockCharacter,
    getCharacterState: (characterId: string): CharacterUnlockState | undefined =>
      statesById[characterId],
  };
}
