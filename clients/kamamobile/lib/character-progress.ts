import type { Character, DashboardData } from "@/lib/api";

export type CharacterUnlockSource =
  | "server"
  | "xp"
  | "persisted"
  | "default";

export type CharacterUnlockState = {
  characterId: string;
  isUnlocked: boolean;
  source: CharacterUnlockSource | null;
  unlockedAt: string | null;
  xpThreshold: number | null;
  xpRemaining: number | null;
  unlockLessonSlug: string | null;
  unlockLabel: string;
  unlockDetail: string;
};

type BuildCharacterUnlockMapInput = {
  characters: Character[];
  dashboard: DashboardData | null;
  totalXp: number;
  persistedUnlockedIds?: Iterable<string>;
};

function toTitleCase(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function buildCharacterUnlockMap({
  characters,
  dashboard,
  totalXp,
  persistedUnlockedIds = [],
}: BuildCharacterUnlockMapInput): Record<string, CharacterUnlockState> {
  const progressById = new Map(
    (dashboard?.characters ?? []).map((item) => [item.characterId, item]),
  );
  const persistedSet = new Set(persistedUnlockedIds);

  return Object.fromEntries(
    characters.map((character) => {
      const serverProgress = progressById.get(character.id);
      const xpThreshold =
        typeof character.xpThreshold === "number" ? character.xpThreshold : null;
      const unlockLessonSlug = character.unlockLesson?.slug ?? null;
      const hasNoRequirements = xpThreshold == null && unlockLessonSlug == null;
      const unlockedByServer = serverProgress?.isUnlocked === true;
      const unlockedByXp = xpThreshold != null && totalXp >= xpThreshold;
      const unlockedByPersisted = persistedSet.has(character.id);
      const isUnlocked =
        unlockedByServer ||
        unlockedByPersisted ||
        unlockedByXp ||
        hasNoRequirements;

      let source: CharacterUnlockSource | null = null;
      if (unlockedByServer) {
        source = "server";
      } else if (unlockedByPersisted) {
        source = "persisted";
      } else if (unlockedByXp) {
        source = "xp";
      } else if (hasNoRequirements) {
        source = "default";
      }

      const xpRemaining =
        xpThreshold != null ? Math.max(xpThreshold - totalXp, 0) : null;
      const unlockLabel = isUnlocked
        ? "Unlocked"
        : xpRemaining != null && xpRemaining > 0
          ? `${xpRemaining} XP left`
          : unlockLessonSlug
            ? "Lesson gate"
            : "Keep learning";
      const unlockDetail = isUnlocked
        ? xpThreshold != null
          ? `Unlocked at ${xpThreshold} XP`
          : "Available in your collection"
        : xpRemaining != null && xpRemaining > 0
          ? `Reach ${xpThreshold} XP to unlock this character.`
          : unlockLessonSlug
            ? `Finish ${toTitleCase(unlockLessonSlug)} to complete the unlock path.`
            : "Keep completing lessons and quizzes to unlock this card.";

      return [
        character.id,
        {
          characterId: character.id,
          isUnlocked,
          source,
          unlockedAt: serverProgress?.unlockedAt ?? null,
          xpThreshold,
          xpRemaining,
          unlockLessonSlug,
          unlockLabel,
          unlockDetail,
        } satisfies CharacterUnlockState,
      ];
    }),
  );
}

export function getUnlockedCharacterIds(
  states: Record<string, CharacterUnlockState>,
) {
  return Object.values(states)
    .filter((state) => state.isUnlocked)
    .map((state) => state.characterId);
}

export function getNextUnlockCharacter(
  characters: Character[],
  states: Record<string, CharacterUnlockState>,
) {
  return [...characters]
    .filter((character) => !states[character.id]?.isUnlocked)
    .sort((left, right) => {
      const leftRemaining = states[left.id]?.xpRemaining ?? Number.MAX_SAFE_INTEGER;
      const rightRemaining =
        states[right.id]?.xpRemaining ?? Number.MAX_SAFE_INTEGER;
      return leftRemaining - rightRemaining;
    })[0] ?? null;
}
