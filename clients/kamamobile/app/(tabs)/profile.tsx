import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CharacterCollectorCard } from "@/components/profile/character-collector-card";
import { useTabBarScroll } from "@/hooks/useTabBarScroll";
import { useCharacterUnlocks } from "@/hooks/useCharacterUnlocks";
import { useAuth } from "@/lib/auth/auth-context";
import { useProfilePreferences } from "@/lib/profile/profile-preferences-context";
import {
  getCharacters,
  getDashboard,
  getInProgressLessons,
  getLessons,
  type Character,
  type DashboardData,
  type LessonProgressDetail,
  type LessonSummary,
} from "@/lib";
import {
  buildDerivedBadges,
  formatCompactNumber,
  formatMemberSince,
  getDisplayName,
  getInitials,
} from "@/lib/profile-insights";
import { storyTheme } from "@/components/ui/story-theme";

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={[styles.statTile, { borderColor: `${accent}22` }]}>
      <Text style={[styles.statTileValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  detail,
  accent,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  detail: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        { borderColor: `${accent}26` },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${accent}16` }]}>
        <MaterialIcons name={icon} size={18} color={accent} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDetail}>{detail}</Text>
    </Pressable>
  );
}

function BadgePreviewCard({
  title,
  detail,
  icon,
  accent,
  unlocked,
}: {
  title: string;
  detail: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  accent: string;
  unlocked: boolean;
}) {
  return (
    <View
      style={[
        styles.achievementCard,
        !unlocked && styles.achievementCardLocked,
        { borderColor: `${accent}28` },
      ]}
    >
      <View style={styles.badgePreviewHeader}>
        <View
          style={[
            styles.badgePreviewIcon,
            { backgroundColor: unlocked ? `${accent}16` : "#f1ece2" },
          ]}
        >
          <MaterialIcons
            name={icon}
            size={18}
            color={unlocked ? accent : storyTheme.inkSoft}
          />
        </View>
        <Text style={styles.badgeProgressText}>
          {unlocked ? "Unlocked" : "In progress"}
        </Text>
      </View>
      <Text style={styles.achievementTitle}>{title}</Text>
      <Text style={styles.achievementDetail}>{detail}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { onScroll } = useTabBarScroll();
  const { token, user } = useAuth();
  const {
    personalInfo,
    subscriptionTier,
    isReady: preferencesReady,
  } = useProfilePreferences();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [inProgressLessons, setInProgressLessons] = useState<
    LessonProgressDetail[]
  >([]);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh?: boolean) => {
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [nextDashboard, allCharacters, progressLessons, allLessons] =
          await Promise.all([
            getDashboard(token).catch(() => null),
            getCharacters().catch(() => [] as Character[]),
            getInProgressLessons(token).catch(
              () => [] as LessonProgressDetail[],
            ),
            getLessons().catch(() => [] as LessonSummary[]),
          ]);

        setDashboard(nextDashboard);
        setCharacters(allCharacters);
        setInProgressLessons(progressLessons);
        setLessons(allLessons);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  const resolvedName =
    personalInfo.fullName.trim() ||
    personalInfo.username.trim() ||
    user?.username ||
    null;
  const displayName = getDisplayName(resolvedName, 24);
  const initials = getInitials(resolvedName);
  const streak = dashboard?.streak?.currentStreak ?? user?.streak ?? 0;
  const totalXp = dashboard?.stats?.totalXpEarned ?? user?.xp ?? 0;
  const totalLessons = dashboard?.stats?.totalLessonsCompleted ?? 0;
  const totalQuizzes = dashboard?.stats?.totalQuizzesCompleted ?? 0;
  const totalCheckIns = dashboard?.stats?.totalCheckIns ?? 0;
  const {
    unlockedIds,
    statesById,
    lockedCharacters,
    isReady: unlocksReady,
  } = useCharacterUnlocks({
    characters,
    dashboard,
    totalXp,
  });
  const characterPreview = useMemo(
    () =>
      [...characters]
        .sort((left, right) => {
          const leftUnlocked = unlockedIds.has(left.id) ? 0 : 1;
          const rightUnlocked = unlockedIds.has(right.id) ? 0 : 1;
          return leftUnlocked - rightUnlocked;
        })
        .slice(0, 6),
    [characters, unlockedIds],
  );
  const unlockedCount = characters.length - lockedCharacters.length;
  const lockedCount = lockedCharacters.length;
  const badges = useMemo(() => buildDerivedBadges(dashboard), [dashboard]);
  const unlockedBadgeCount = badges.filter((badge) => badge.unlocked).length;
  const continueLesson = inProgressLessons[0]?.lesson ?? null;
  const suggestedLesson = continueLesson ?? lessons[0] ?? null;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void load(true);
            }}
            tintColor={storyTheme.mint}
          />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Pressable
              onPress={() => router.push("/settings")}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons name="settings" size={20} color={storyTheme.ink} />
            </Pressable>
          </View>

          <View style={styles.heroBody}>
            <Text style={styles.eyebrow}>Profile</Text>
            <Text style={styles.heroTitle}>{displayName}</Text>
            <Text style={styles.heroMeta}>
              {personalInfo.email || user?.email || "No email on file"}
            </Text>
          </View>

          <View style={styles.profileDetailRow}>
            <View style={styles.profileDetailCard}>
              <Text style={styles.profileDetailLabel}>Member since</Text>
              <Text style={styles.profileDetailValue}>
                {formatMemberSince(user?.createdAt)}
              </Text>
            </View>
            <View style={styles.profileDetailCard}>
              <Text style={styles.profileDetailLabel}>Plan</Text>
              <Text style={styles.profileDetailValue}>
                {subscriptionTier === "pro" ? "Kama Pro" : "Kama Free"}
              </Text>
            </View>
          </View>
        </View>

        {loading || !preferencesReady || !unlocksReady ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={storyTheme.mint} />
            <Text style={styles.loadingText}>
              Building your updated profile...
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overall Progress</Text>
            <Text style={styles.sectionCopy}>
              Your key learning metrics stay visible at a glance.
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <StatTile
              label="XP earned"
              value={formatCompactNumber(totalXp)}
              accent={storyTheme.plum}
            />
            <StatTile
              label="Lessons"
              value={`${totalLessons}`}
              accent={storyTheme.navy}
            />
            <StatTile
              label="Quizzes"
              value={`${totalQuizzes}`}
              accent={storyTheme.mint}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderFlex}>
              <Text style={styles.sectionTitle}>Characters</Text>
              <Text style={styles.sectionCopy}>
                Track what is unlocked now and what still needs progress.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/profile/characters")}
              style={({ pressed }) => [
                styles.inlineButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.inlineButtonText}>See all</Text>
              <MaterialIcons
                name="chevron-right"
                size={18}
                color={storyTheme.navy}
              />
            </Pressable>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillValue}>{unlockedCount}</Text>
              <Text style={styles.summaryPillLabel}>Unlocked</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillValue}>{lockedCount}</Text>
              <Text style={styles.summaryPillLabel}>Locked</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previewRail}
          >
            {characterPreview.map((character) => {
              const unlockState = statesById[character.id];
              if (!unlockState) {
                return null;
              }

              return (
                <CharacterCollectorCard
                  key={character.id}
                  character={character}
                  unlockState={unlockState}
                  compact
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
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderFlex}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <Text style={styles.sectionCopy}>
                The next milestones stay visible without taking over the page.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/profile/achievements")}
              style={({ pressed }) => [
                styles.inlineButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.inlineButtonText}>See all</Text>
              <MaterialIcons
                name="chevron-right"
                size={18}
                color={storyTheme.navy}
              />
            </Pressable>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillValue}>{unlockedBadgeCount}</Text>
              <Text style={styles.summaryPillLabel}>Unlocked</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillValue}>
                {badges.length - unlockedBadgeCount}
              </Text>
              <Text style={styles.summaryPillLabel}>To earn</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previewRail}
          >
            {badges.map((badge) => (
              <BadgePreviewCard
                key={badge.id}
                title={badge.title}
                detail={badge.detail}
                icon={badge.icon as keyof typeof MaterialIcons.glyphMap}
                accent={badge.accent}
                unlocked={badge.unlocked}
              />
            ))}
          </ScrollView>
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 42,
    gap: 18,
  },
  heroCard: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: "#f0e3cf",
    gap: 16,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarWrap: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: storyTheme.plum,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#17091c",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  avatarText: {
    color: storyTheme.white,
    fontSize: 26,
    fontWeight: "900",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: storyTheme.white,
  },
  heroBody: {
    gap: 6,
  },
  eyebrow: {
    color: storyTheme.amber,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: storyTheme.ink,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },
  heroMeta: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  profileDetailRow: {
    flexDirection: "row",
    gap: 10,
  },
  profileDetailCard: {
    flex: 1,
    backgroundColor: storyTheme.white,
    borderRadius: 20,
    padding: 14,
    gap: 6,
  },
  profileDetailLabel: {
    color: storyTheme.inkSoft,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  profileDetailValue: {
    color: storyTheme.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  heroBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: storyTheme.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  heroBadgeText: {
    color: storyTheme.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: storyTheme.white,
    borderRadius: 22,
    padding: 14,
    gap: 8,
    borderWidth: 1,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    color: storyTheme.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  actionDetail: {
    color: storyTheme.inkSoft,
    fontSize: 12,
    lineHeight: 17,
  },
  loadingCard: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 24,
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: storyTheme.inkSoft,
    fontSize: 14,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
  },
  sectionHeaderFlex: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    color: storyTheme.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },
  sectionCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  inlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#e9eef7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inlineButtonText: {
    color: storyTheme.navy,
    fontSize: 13,
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statTile: {
    width: "48.5%",
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    gap: 8,
  },
  statTileValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
  },
  statTileLabel: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  summaryPillValue: {
    color: storyTheme.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  summaryPillLabel: {
    color: storyTheme.inkSoft,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  previewRail: {
    gap: 16,
    paddingRight: 20,
  },
  achievementCard: {
    width: 220,
    minHeight: 148,
    borderRadius: 24,
    backgroundColor: storyTheme.white,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  achievementCardLocked: {
    opacity: 0.78,
  },
  badgePreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgePreviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeProgressText: {
    color: storyTheme.inkSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  achievementTitle: {
    color: storyTheme.ink,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },
  achievementDetail: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  focusCard: {
    backgroundColor: storyTheme.blush,
    borderRadius: 28,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: "#f3e0bb",
  },
  focusEyebrow: {
    color: storyTheme.amber,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  focusTitle: {
    color: storyTheme.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  focusCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  primaryButton: {
    backgroundColor: storyTheme.navy,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonPressed: {
    backgroundColor: storyTheme.navyPressed,
  },
  primaryButtonText: {
    color: storyTheme.white,
    fontSize: 15,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
