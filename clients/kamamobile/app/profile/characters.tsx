import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CharacterCollectorCard } from "@/components/profile/character-collector-card";
import { SettingsScreenShell } from "@/components/profile/settings-ui";
import { storyTheme } from "@/components/ui/story-theme";
import { useCharacterUnlocks } from "@/hooks/useCharacterUnlocks";
import { useAuth } from "@/lib/auth/auth-context";
import { getCharacters, getDashboard, type Character, type DashboardData } from "@/lib";

export default function CharactersScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    const [allCharacters, nextDashboard] = await Promise.all([
      getCharacters().catch(() => [] as Character[]),
      token ? getDashboard(token).catch(() => null) : Promise.resolve(null),
    ]);

    setCharacters(allCharacters);
    setDashboard(nextDashboard);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const totalXp = dashboard?.stats?.totalXpEarned ?? 0;
  const { unlockedIds, statesById, lockedCharacters } = useCharacterUnlocks({
    characters,
    dashboard,
    totalXp,
  });
  const sortedCharacters = useMemo(
    () =>
      [...characters].sort((left, right) => {
        const leftWeight = unlockedIds.has(left.id) ? 0 : 1;
        const rightWeight = unlockedIds.has(right.id) ? 0 : 1;
        return leftWeight - rightWeight;
      }),
    [characters, unlockedIds],
  );

  return (
    <SettingsScreenShell
      title="Characters"
      subtitle="Every unlocked and locked legend in one place."
    >
      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>
          {Array.from(unlockedIds).length}/{characters.length}
        </Text>
        <Text style={styles.summaryCopy}>
          {lockedCharacters.length} still on your unlock path
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {sortedCharacters.map((character) => {
          const unlockState = statesById[character.id];
          if (!unlockState) {
            return null;
          }

          return (
            <CharacterCollectorCard
              key={character.id}
              character={character}
              unlockState={unlockState}
              onPress={() =>
                router.push(
                  unlockState.isUnlocked
                    ? `/character-card?slug=${character.slug}`
                    : `/character-detail?slug=${character.slug}`,
                )
              }
            />
          );
        })}
      </ScrollView>
    </SettingsScreenShell>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: 26,
    backgroundColor: storyTheme.plum,
    padding: 20,
    gap: 6,
  },
  summaryValue: {
    color: storyTheme.white,
    fontSize: 34,
    fontWeight: "900",
  },
  summaryCopy: {
    color: "#e9d8ee",
    fontSize: 14,
    lineHeight: 21,
  },
  list: {
    gap: 18,
    alignItems: "center",
  },
});
