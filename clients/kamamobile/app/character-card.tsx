import { MaterialIcons } from "@expo/vector-icons";
import { CharacterShowcaseCard } from "@/components/profile/character-showcase-card";
import { storyTheme } from "@/components/ui/story-theme";
import { useCharacterUnlocks } from "@/hooks/useCharacterUnlocks";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getCharacterBySlug,
  getDashboard,
  type Character,
  type DashboardData,
} from "@/lib";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface CharacterDetail extends Character {
  story?: string;
}

export default function CharacterCardPage() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { token, user } = useAuth();
  const [character, setCharacter] = useState<CharacterDetail | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [side, setSide] = useState<"front" | "back">("front");
  const flip = useSharedValue(0);

  useEffect(() => {
    async function loadCharacter() {
      if (!slug) {
        setError("No character specified");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [detail, nextDashboard] = await Promise.all([
          getCharacterBySlug(slug),
          token ? getDashboard(token).catch(() => null) : Promise.resolve(null),
        ]);
        setCharacter(detail as CharacterDetail);
        setDashboard(nextDashboard);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load character card",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCharacter();
  }, [slug, token]);

  const totalXp = dashboard?.stats?.totalXpEarned ?? user?.xp ?? 0;
  const { statesById } = useCharacterUnlocks({
    characters: character ? [character] : [],
    dashboard,
    totalXp,
  });
  const unlockState = character ? statesById[character.id] : undefined;
  const isUnlocked = unlockState?.isUnlocked ?? false;

  useEffect(() => {
    flip.value = withTiming(side === "back" ? 1 : 0, { duration: 360 });
  }, [flip, side]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` },
    ],
    opacity: interpolate(flip.value, [0, 0.5, 1], [1, 0, 0]),
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(flip.value, [0, 1], [-180, 0])}deg` },
    ],
    opacity: interpolate(flip.value, [0, 0.5, 1], [0, 0, 1]),
  }));

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={storyTheme.mint} />
      </SafeAreaView>
    );
  }

  if (error || !character || !unlockState) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not open character card</Text>
          <Text style={styles.errorCopy}>
            {error || "This card is not available right now."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isUnlocked) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Card still locked</Text>
          <Text style={styles.errorCopy}>{unlockState.unlockDetail}</Text>
          <Pressable
            onPress={() => router.replace(`/character-detail?slug=${character.slug}`)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Open character details</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.topIcon}>
            <MaterialIcons
              name="arrow-back-ios-new"
              size={18}
              color={storyTheme.ink}
            />
          </Pressable>
          <Text style={styles.topTitle}>Character Card</Text>
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.headerCard}>
          <Text style={styles.headerEyebrow}>Unlocked card</Text>
          <Text style={styles.headerTitle}>{character.name}</Text>
          <Text style={styles.headerCopy}>
            Tap the card or switch the tabs to see the front and back.
          </Text>
        </View>

        <View style={styles.sideTabs}>
          <Pressable
            onPress={() => setSide("front")}
            style={[styles.sideTab, side === "front" && styles.sideTabActive]}
          >
            <Text
              style={[
                styles.sideTabText,
                side === "front" && styles.sideTabTextActive,
              ]}
            >
              Front
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSide("back")}
            style={[styles.sideTab, side === "back" && styles.sideTabActive]}
          >
            <Text
              style={[
                styles.sideTabText,
                side === "back" && styles.sideTabTextActive,
              ]}
            >
              Back
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() =>
            setSide((current) => (current === "front" ? "back" : "front"))
          }
          style={styles.cardStage}
        >
          <Animated.View style={[styles.cardFace, frontStyle]}>
            <CharacterShowcaseCard character={character} side="front" />
          </Animated.View>
          <Animated.View style={[styles.cardFace, styles.cardFaceBack, backStyle]}>
            <CharacterShowcaseCard character={character} side="back" />
          </Animated.View>
        </Pressable>

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => router.push(`/character-detail?slug=${character.slug}`)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Open character details</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: storyTheme.paper,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: storyTheme.paper,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 18,
    alignItems: "center",
  },
  topBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: storyTheme.white,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    color: storyTheme.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  topSpacer: {
    width: 40,
  },
  headerCard: {
    width: "100%",
    borderRadius: 28,
    backgroundColor: storyTheme.paperSoft,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 18,
    gap: 8,
  },
  headerEyebrow: {
    color: storyTheme.amber,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  headerTitle: {
    color: storyTheme.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },
  headerCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  sideTabs: {
    flexDirection: "row",
    gap: 12,
  },
  sideTab: {
    minWidth: 120,
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: storyTheme.white,
    borderWidth: 1,
    borderColor: storyTheme.line,
  },
  sideTabActive: {
    backgroundColor: storyTheme.navy,
    borderColor: storyTheme.navy,
  },
  sideTabText: {
    color: storyTheme.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  sideTabTextActive: {
    color: storyTheme.white,
  },
  cardStage: {
    width: 260,
    height: 420,
  },
  cardFace: {
    position: "absolute",
    top: 0,
    left: 0,
    backfaceVisibility: "hidden",
  },
  cardFaceBack: {
    backfaceVisibility: "hidden",
  },
  actionRow: {
    width: "100%",
  },
  errorCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    backgroundColor: storyTheme.white,
    padding: 22,
    gap: 10,
  },
  errorTitle: {
    color: storyTheme.ink,
    fontSize: 24,
    fontWeight: "900",
  },
  errorCopy: {
    color: storyTheme.inkSoft,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: storyTheme.navy,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: storyTheme.white,
    fontSize: 15,
    fontWeight: "900",
  },
});
