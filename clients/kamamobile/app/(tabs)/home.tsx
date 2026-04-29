import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { storyTheme } from "@/components/ui/story-theme";
import { useRewardedHeartRecovery } from "@/hooks/useRewardedHeartRecovery";
import { useTabBarScroll } from "@/hooks/useTabBarScroll";
import { useAuth } from "@/lib/auth/auth-context";
import {
  type Character,
  getDashboard,
  getInProgressLessons,
  getLessons,
  type DashboardData,
  type LessonProgressDetail,
  type LessonSummary,
} from "@/lib";

type ActiveModal = "hearts" | null;

function truncateDisplayName(name?: string | null, limit: number = 16) {
  if (!name) {
    return "Explorer";
  }

  return name.length > limit ? `${name.slice(0, limit - 1)}...` : name;
}

function formatDuration(ms?: number | null) {
  if (!ms || ms <= 0) {
    return "Ready now";
  }

  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

function SectionHeader({
  eyebrow,
  title,
  copy,
}: {
  eyebrow?: string;
  title: string;
  copy: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCopy}>{copy}</Text>
    </View>
  );
}

function HeaderMetricChip({
  icon,
  label,
  value,
  accent,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.metricChip,
        { borderColor: `${accent}55` },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.metricIconWrap, { borderColor: accent }]}>
        <MaterialIcons name={icon} size={20} color={accent} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
    </Pressable>
  );
}

function LessonCard({
  lesson,
  label,
  cta,
  progressText,
  onPress,
}: {
  lesson: {
    title: string;
    coverImage?: string | null;
    description?: string | null;
    xpReward?: number;
  };
  label: string;
  cta: string;
  progressText: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.lessonCard, pressed && styles.pressed]}
    >
      <ImageBackground
        source={lesson.coverImage ? { uri: lesson.coverImage } : undefined}
        style={styles.lessonCardHero}
        imageStyle={styles.lessonCardImage}
      >
        <View style={styles.lessonShade} />
        <View style={styles.lessonTopRow}>
          <Text style={styles.lessonBadge}>{label}</Text>
          <Text style={styles.lessonProgressText}>{progressText}</Text>
        </View>
      </ImageBackground>
      <View style={styles.lessonBody}>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.lessonDescription} numberOfLines={3}>
          {lesson.description ||
            "Jump back into a scene-driven lesson and keep your learning momentum alive."}
        </Text>
        <View style={styles.lessonMetaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>{lesson.xpReward ?? 0} XP</Text>
          </View>
          <Text style={styles.lessonCTA}>{cta}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function ContinueLessonRailCard({
  lesson,
  progressText,
  onPress,
}: {
  lesson: LessonProgressDetail["lesson"];
  progressText: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.continueCard, pressed && styles.pressed]}
    >
      <ImageBackground
        source={lesson.coverImage ? { uri: lesson.coverImage } : undefined}
        style={styles.continueCardHero}
        imageStyle={styles.continueCardImage}
      >
        <View style={styles.continueCardShade} />
        <Text style={styles.continueCardBadge}>In Progress</Text>
      </ImageBackground>
      <View style={styles.continueCardBody}>
        <Text style={styles.continueCardTitle} numberOfLines={2}>
          {lesson.title}
        </Text>
        <Text style={styles.continueCardMeta}>{progressText}</Text>
      </View>
    </Pressable>
  );
}

function LegendSpotlight({
  character,
  badge,
  subtitle,
  onPress,
}: {
  character: Character;
  badge: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.spotlightCard, pressed && styles.pressed]}
    >
      <ImageBackground
        source={character.imageUrl ? { uri: character.imageUrl } : undefined}
        style={styles.spotlightImage}
        imageStyle={styles.spotlightImageStyle}
      >
        <View style={styles.spotlightShade} />
        <View style={styles.spotlightBadge}>
          <Text style={styles.spotlightBadgeText}>{badge}</Text>
        </View>
        <View style={styles.spotlightFooter}>
          <Text style={styles.spotlightTitle}>{character.name}</Text>
          <Text style={styles.spotlightSubtitle}>{subtitle}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

// Removed CollectionRail component - replaced with direct lesson display

function LegendLibraryCard({
  character,
  badge,
  detail,
  onPress,
}: {
  character: Character;
  badge: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.libraryCard, pressed && styles.pressed]}
    >
      <ImageBackground
        source={character.imageUrl ? { uri: character.imageUrl } : undefined}
        style={styles.libraryImage}
        imageStyle={styles.libraryImageStyle}
      >
        <View style={styles.libraryShade} />
        <View style={styles.libraryBadge}>
          <Text style={styles.libraryBadgeText}>{badge}</Text>
        </View>
      </ImageBackground>
      <View style={styles.libraryBody}>
        <Text style={styles.libraryTitle}>{character.name}</Text>
        <Text style={styles.libraryDetail} numberOfLines={3}>
          {detail}
        </Text>
      </View>
    </Pressable>
  );
}

// Commented out - will be replaced with new component
// function LegendLibraryCard() { ... }

function BrowseLegendsCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.browseLegendsCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.browseLegendsIcon}>
        <MaterialIcons name="auto-stories" size={24} color={storyTheme.white} />
      </View>
      <View style={styles.browseLegendsBody}>
        <Text style={styles.browseLegendsTitle}>Browse all legends</Text>
        <Text style={styles.browseLegendsCopy}>
          Open the full character archive on its own page instead of loading
          every legend directly on home.
        </Text>
      </View>
      <MaterialIcons
        name="arrow-forward-ios"
        size={16}
        color={storyTheme.white}
      />
    </Pressable>
  );
}

function MetricModal({
  visible,
  title,
  subtitle,
  icon,
  accent,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  accent: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <ScrollView
          scrollEnabled={false}
          style={styles.modalCard}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View
              style={[styles.modalIconWrap, { backgroundColor: `${accent}18` }]}
            >
              <MaterialIcons name={icon} size={22} color={accent} />
            </View>
            <View style={styles.modalHeading}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSubtitle}>{subtitle}</Text>
            </View>
          </View>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { onScroll } = useTabBarScroll();
  const { token, user } = useAuth();
  const {
    error: rewardedHeartError,
    isAdReady,
    isLoadingAd,
    isClaimingHeart,
    restoreOneHeartWithAd,
  } = useRewardedHeartRecovery();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [inProgressLessons, setInProgressLessons] = useState<
    LessonProgressDetail[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

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
        const [nextDashboard, allLessons, progressLessons] = await Promise.all([
          getDashboard(token).catch(() => null),
          getLessons().catch(() => [] as LessonSummary[]),
          getInProgressLessons(token).catch(() => [] as LessonProgressDetail[]),
        ]);

        setDashboard(nextDashboard);
        setLessons(allLessons);
        setInProgressLessons(progressLessons);
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

  const displayName = useMemo(
    () => truncateDisplayName(user?.username ?? null),
    [user?.username],
  );
  const hearts = dashboard?.hearts?.hearts ?? 0;
  const maxHearts = dashboard?.hearts?.maxHearts ?? 5;
  const streak = dashboard?.streak?.currentStreak ?? user?.streak ?? 0;
  const continueLesson = inProgressLessons[0] ?? null;
  const fallbackLesson = lessons[0] ?? null;
  const recommendedLessons = useMemo(
    () =>
      lessons
        .filter((lesson) => lesson.id !== continueLesson?.lesson.id)
        .slice(0, 3),
    [continueLesson?.lesson.id, lessons],
  );
  const progressLabel = continueLesson
    ? `Chapter ${continueLesson.chapter.order}`
    : "Fresh story";
  const heartStatusCopy = dashboard?.hearts?.isPremium
    ? "Unlimited access is active."
    : hearts >= maxHearts
      ? "You are fully charged for your next session."
      : dashboard?.hearts?.willRecover
        ? `Next heart in ${formatDuration(dashboard.hearts.timeUntilNextHeartMs)}.`
        : "You can restore a heart with a rewarded ad.";
  const handleRestoreHeart = useCallback(async () => {
    try {
      const updatedHearts = await restoreOneHeartWithAd();
      setDashboard((current) =>
        current
          ? {
              ...current,
              hearts: updatedHearts,
            }
          : current,
      );
      Alert.alert("Heart restored", "You earned 1 more heart. Keep learning.");
      setActiveModal(null);
    } catch (error) {
      Alert.alert(
        "Ad unavailable",
        error instanceof Error
          ? error.message
          : "We could not restore a heart right now.",
      );
    }
  }, [restoreOneHeartWithAd]);

  const handleProCTA = useCallback(() => {
    Alert.alert(
      "Kama Pro",
      "Connect this button to your future subscription screen for unlimited hearts, extra streak protection, and premium learning perks.",
    );
  }, []);

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
        <View style={styles.headerRow}>
          <View style={styles.headerIdentity}>
            <Text style={styles.headerEyebrow}>Welcome back</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Hello, {displayName}
            </Text>
          </View>

          <View style={styles.headerMetricsRow}>
            <HeaderMetricChip
              icon="favorite"
              label="Hearts"
              value={`${hearts}`}
              accent="#ff6b6b"
              onPress={() => setActiveModal("hearts")}
            />
            <HeaderMetricChip
              icon="local-fire-department"
              label="Streak"
              value=""
              accent={streak > 0 ? storyTheme.mint : "#c0c0c0"}
              onPress={() => router.push("/streak")}
            />
          </View>
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.heroIdentity}>
            <Text style={styles.heroEyebrow}>Today on Kama</Text>
            <Text style={styles.heroTitle}>
              {continueLesson
                ? "Your next lesson step is ready"
                : "A story world is waiting for you"}
            </Text>
            <Text style={styles.heroCopy}>
              {continueLesson
                ? "Jump back into your active lesson, protect your streak, and unlock more legends as you go."
                : "Start a lesson, build momentum, and shape a home page that responds to your activity."}
            </Text>
          </View>

          <View style={styles.heroInsightRow}>
            <View style={styles.insightPill}>
              <MaterialIcons
                name="menu-book"
                size={16}
                color={storyTheme.plum}
              />
              <Text style={styles.insightPillText}>
                {continueLesson
                  ? `Continue ${continueLesson.lesson.title}`
                  : "Start a new story lesson today"}
              </Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={storyTheme.mint} />
            <Text style={styles.loadingText}>
              Curating your personal learning world...
            </Text>
          </View>
        ) : null}

        {continueLesson || fallbackLesson ? (
          <View style={styles.sectionBlock}>
            <SectionHeader
              eyebrow="Continue"
              title={
                continueLesson
                  ? "Continue your lessons"
                  : "Start your next journey"
              }
              copy={
                continueLesson
                  ? "Your lesson progress lives here so you can jump back in without searching."
                  : "No lesson is in progress yet. Here is the strongest story to start with."
              }
            />
            {inProgressLessons.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.continueRail}
              >
                {inProgressLessons.slice(0, 6).map((item) => (
                  <ContinueLessonRailCard
                    key={item.id}
                    lesson={item.lesson}
                    progressText={`Chapter ${item.chapter.order}`}
                    onPress={() => router.push(`/lesson/${item.lesson.slug}`)}
                  />
                ))}
              </ScrollView>
            ) : fallbackLesson ? (
              <LessonCard
                lesson={fallbackLesson}
                label="Featured"
                cta="Open Lesson"
                progressText={progressLabel}
                onPress={() => router.push(`/lesson/${fallbackLesson.slug}`)}
              />
            ) : null}
          </View>
        ) : null}

        {continueLesson ? (
          <View style={styles.sectionBlock}>
            <LessonCard
              lesson={continueLesson.lesson}
              label="Ready now"
              cta="Resume Lesson"
              progressText={progressLabel}
              onPress={() =>
                router.push(`/lesson/${continueLesson.lesson.slug}`)
              }
            />
          </View>
        ) : null}

        {recommendedLessons.length > 0 ? (
          <View style={styles.sectionBlock}>
            <SectionHeader
              eyebrow="Story Feed"
              title="High-value lessons for today"
              copy="A tighter row of lessons gives you more ways to continue without overwhelming the home page."
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.lessonRail}
            >
              {recommendedLessons.map((lesson) => (
                <Pressable
                  key={lesson.id}
                  onPress={() => router.push(`/lesson/${lesson.slug}`)}
                  style={({ pressed }) => [
                    styles.storyFeedCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <ImageBackground
                    source={
                      lesson.coverImage ? { uri: lesson.coverImage } : undefined
                    }
                    style={styles.storyFeedHero}
                    imageStyle={styles.storyFeedImage}
                  >
                    <View style={styles.storyFeedShade} />
                  </ImageBackground>
                  <View style={styles.storyFeedBody}>
                    <Text style={styles.storyFeedTitle}>{lesson.title}</Text>
                    <Text style={styles.storyFeedCopy} numberOfLines={3}>
                      {lesson.hook ||
                        lesson.description ||
                        "A chaptered story lesson designed to keep your momentum steady."}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {lessons.length > 0 ? (
          <View style={styles.sectionBlock}>
            <SectionHeader
              eyebrow="Library"
              title="All lessons"
              copy="Browse all available lessons and continue your learning journey."
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.lessonRail}
            >
              {lessons.map((lesson) => (
                <Pressable
                  key={lesson.id}
                  onPress={() => router.push(`/lesson/${lesson.slug}`)}
                  style={({ pressed }) => [
                    styles.storyFeedCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <ImageBackground
                    source={
                      lesson.coverImage ? { uri: lesson.coverImage } : undefined
                    }
                    style={styles.storyFeedHero}
                    imageStyle={styles.storyFeedImage}
                  >
                    <View style={styles.storyFeedShade} />
                  </ImageBackground>
                  <View style={styles.storyFeedBody}>
                    <Text style={styles.storyFeedTitle}>{lesson.title}</Text>
                    <Text style={styles.storyFeedCopy} numberOfLines={3}>
                      {lesson.hook ||
                        lesson.description ||
                        "A chaptered story lesson designed to keep your momentum steady."}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <MetricModal
        visible={activeModal === "hearts"}
        title={`${hearts}/${maxHearts} hearts`}
        subtitle={heartStatusCopy}
        icon="favorite"
        accent="#ff6b6b"
        onClose={() => setActiveModal(null)}
      >
        <View style={styles.modalBody}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Heart status</Text>
            <Text style={styles.infoCardCopy}>
              {dashboard?.hearts?.isPremium
                ? "Premium users skip the wait and keep learning without heart limits."
                : hearts === 0
                  ? "You are out of hearts. The fastest recovery path is a rewarded ad or waiting for the next refill."
                  : hearts < maxHearts
                    ? "You still have energy to learn, and you can top up when needed."
                    : "You are fully stocked. This is a great time to chain a lesson and a quiz."}
            </Text>
          </View>

          <View style={styles.modalStatsRow}>
            <View style={styles.modalStat}>
              <Text style={styles.modalStatValue}>
                {formatDuration(dashboard?.hearts?.timeUntilNextHeartMs)}
              </Text>
              <Text style={styles.modalStatLabel}>Next refill</Text>
            </View>
          </View>

          {!dashboard?.hearts?.isPremium ? (
            <Pressable
              onPress={() => {
                void handleRestoreHeart();
              }}
              disabled={
                !isAdReady ||
                isLoadingAd ||
                isClaimingHeart ||
                hearts >= maxHearts
              }
              style={({ pressed }) => [
                styles.primaryAction,
                (!isAdReady ||
                  isLoadingAd ||
                  isClaimingHeart ||
                  hearts >= maxHearts) &&
                  styles.actionDisabled,
                pressed && styles.primaryActionPressed,
              ]}
            >
              <Text style={styles.primaryActionText}>
                {isClaimingHeart
                  ? "Restoring heart..."
                  : isLoadingAd
                    ? "Preparing ad..."
                    : hearts >= maxHearts
                      ? "Hearts already full"
                      : "Watch ad for 1 heart"}
              </Text>
            </Pressable>
          ) : null}

          <Pressable style={styles.secondaryAction} onPress={handleProCTA}>
            <Text style={styles.secondaryActionText}>
              Get unlimited hearts with Pro
            </Text>
          </Pressable>

          {rewardedHeartError ? (
            <Text style={styles.helperText}>{rewardedHeartError}</Text>
          ) : null}
        </View>
      </MetricModal>
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
    paddingBottom: 40,
    gap: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerIdentity: {
    flex: 1,
    gap: 4,
  },
  headerEyebrow: {
    color: storyTheme.amber,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: storyTheme.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  headerMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroPanel: {
    backgroundColor: storyTheme.plum,
    borderRadius: 30,
    padding: 22,
    gap: 18,
  },
  heroIdentity: {
    gap: 8,
  },
  heroEyebrow: {
    color: "#f5d78f",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: storyTheme.white,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },
  heroCopy: {
    color: "#f2e8f1",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
  },
  metricChip: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  metricIconWrap: {
    width: 40,
    height: 40,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
  metricCopy: {
    flex: 1,
    marginLeft: 8,
  },
  metricValue: {
    color: storyTheme.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  metricLabel: {
    color: storyTheme.inkSoft,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  heroInsightRow: {
    gap: 10,
  },
  insightPill: {
    flexDirection: "row",
    alignItems: "center",
  },
  insightPillText: {
    flex: 1,
    color: storyTheme.plum,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
  },
  loadingCard: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionBlock: {
    gap: 14,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionEyebrow: {
    color: storyTheme.amber,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  sectionTitle: {
    color: storyTheme.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  sectionCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  lessonCard: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: storyTheme.line,
  },
  lessonCardHero: {
    height: 206,
    padding: 16,
    justifyContent: "space-between",
    backgroundColor: storyTheme.plumDark,
  },
  lessonCardImage: {
    resizeMode: "cover",
  },
  lessonShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26, 6, 23, 0.34)",
  },
  lessonTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  lessonBadge: {
    color: storyTheme.amber,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  lessonProgressText: {
    color: storyTheme.white,
    fontSize: 12,
    fontWeight: "800",
  },
  lessonBody: {
    padding: 18,
    gap: 8,
  },
  lessonTitle: {
    color: storyTheme.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  lessonDescription: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 23,
    fontWeight: "600",
  },
  lessonMetaRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaPill: {
    backgroundColor: "#fff4dd",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#f5d7a5",
  },
  metaPillText: {
    color: "#bf7430",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  lessonCTA: {
    color: storyTheme.navy,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  continueRail: {
    gap: 14,
    paddingRight: 8,
  },
  continueCard: {
    width: 238,
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: storyTheme.line,
  },
  continueCardHero: {
    height: 132,
    justifyContent: "flex-start",
    padding: 12,
    backgroundColor: storyTheme.plumDark,
  },
  continueCardImage: {
    resizeMode: "cover",
  },
  continueCardShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31, 5, 28, 0.28)",
  },
  continueCardBadge: {
    alignSelf: "flex-start",
    color: storyTheme.amber,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  continueCardBody: {
    padding: 14,
    gap: 6,
  },
  continueCardTitle: {
    color: storyTheme.ink,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
  },
  continueCardMeta: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  pulseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  pulseCard: {
    width: "48%",
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: storyTheme.line,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 4,
  },
  pulseValue: {
    color: storyTheme.ink,
    fontSize: 26,
    fontWeight: "900",
  },
  pulseLabel: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  strategyCard: {
    backgroundColor: "#fff8ea",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#f2ddaf",
    gap: 6,
  },
  strategyTitle: {
    color: storyTheme.amber,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  strategyCopy: {
    color: storyTheme.ink,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "700",
  },
  spotlightCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: storyTheme.plumDark,
  },
  spotlightImage: {
    height: 300,
    justifyContent: "space-between",
    padding: 16,
  },
  spotlightImageStyle: {
    resizeMode: "cover",
  },
  spotlightShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31, 5, 28, 0.32)",
  },
  spotlightBadge: {
    alignSelf: "flex-start",
    backgroundColor: storyTheme.paper,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  spotlightBadgeText: {
    color: storyTheme.amber,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  spotlightFooter: {
    backgroundColor: storyTheme.paper,
    borderRadius: 24,
    padding: 16,
    gap: 4,
  },
  spotlightTitle: {
    color: storyTheme.ink,
    fontSize: 24,
    fontWeight: "900",
  },
  spotlightSubtitle: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    fontWeight: "700",
  },
  risingRail: {
    gap: 14,
    paddingRight: 8,
  },
  lessonRail: {
    gap: 14,
    paddingRight: 8,
  },
  storyFeedCard: {
    width: 254,
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: storyTheme.line,
  },
  storyFeedHero: {
    height: 150,
    backgroundColor: storyTheme.plumDark,
  },
  storyFeedImage: {
    resizeMode: "cover",
  },
  storyFeedShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31, 5, 28, 0.22)",
  },
  storyFeedBody: {
    padding: 16,
    gap: 8,
  },
  storyFeedTitle: {
    color: storyTheme.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
  },
  storyFeedCopy: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "600",
  },
  collectionsStack: {
    gap: 14,
  },
  collectionPanel: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: storyTheme.line,
    paddingVertical: 18,
  },
  collectionEyebrow: {
    color: storyTheme.amber,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    paddingHorizontal: 18,
  },
  collectionTitle: {
    color: storyTheme.ink,
    fontSize: 22,
    fontWeight: "900",
    paddingHorizontal: 18,
    marginTop: 8,
  },
  collectionDescription: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
    paddingHorizontal: 18,
    marginTop: 6,
  },
  collectionRail: {
    paddingHorizontal: 18,
    paddingTop: 16,
    gap: 12,
  },
  collectionLegendCard: {
    width: 134,
    gap: 10,
  },
  collectionLegendImage: {
    height: 156,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: storyTheme.plumDark,
  },
  collectionLegendImageStyle: {
    resizeMode: "cover",
  },
  collectionLegendShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31, 5, 28, 0.18)",
  },
  collectionLegendName: {
    color: storyTheme.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  libraryCard: {
    width: 278,
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: storyTheme.line,
  },
  libraryImage: {
    height: 200,
    justifyContent: "flex-start",
    padding: 14,
    backgroundColor: storyTheme.plumDark,
  },
  libraryImageStyle: {
    resizeMode: "cover",
  },
  libraryShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31, 5, 28, 0.22)",
  },
  libraryBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  libraryBadgeText: {
    color: storyTheme.amber,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  libraryBody: {
    padding: 16,
    gap: 8,
  },
  libraryTitle: {
    color: storyTheme.ink,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
  },
  libraryDetail: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  browseLegendsCard: {
    backgroundColor: storyTheme.navy,
    borderRadius: 26,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  browseLegendsIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  browseLegendsBody: {
    flex: 1,
    gap: 4,
  },
  browseLegendsTitle: {
    color: storyTheme.white,
    fontSize: 20,
    fontWeight: "900",
  },
  browseLegendsCopy: {
    color: "#d9e4f3",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.2)",
    justifyContent: "flex-end",
    padding: 0,
  },
  modalCard: {
    backgroundColor: storyTheme.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 16,
    width: "100%",
    maxHeight: "70%",
  },
  modalContent: {
    gap: 16,
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#dac7b3",
  },
  modalHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  modalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeading: {
    flex: 1,
    gap: 3,
  },
  modalTitle: {
    color: storyTheme.ink,
    fontSize: 24,
    fontWeight: "900",
  },
  modalSubtitle: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  modalBody: {
    gap: 14,
  },
  infoCard: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 16,
    gap: 6,
  },
  infoCardTitle: {
    color: storyTheme.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  infoCardCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  modalStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalStat: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#fff8ea",
    borderWidth: 1,
    borderColor: "#f2ddaf",
    padding: 16,
    gap: 4,
  },
  modalStatValue: {
    color: storyTheme.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  modalStatLabel: {
    color: storyTheme.inkSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  primaryAction: {
    backgroundColor: storyTheme.navy,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  primaryActionPressed: {
    backgroundColor: storyTheme.navyPressed,
  },
  primaryActionText: {
    color: storyTheme.white,
    fontSize: 14,
    fontWeight: "900",
  },
  secondaryAction: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: storyTheme.line,
    backgroundColor: storyTheme.paperSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  secondaryActionText: {
    color: storyTheme.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  actionDisabled: {
    opacity: 0.55,
  },
  helperText: {
    color: storyTheme.inkSoft,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  milestoneCard: {
    backgroundColor: "#fff8ea",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f2ddaf",
    padding: 16,
    gap: 6,
  },
  milestoneTitle: {
    color: storyTheme.amber,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  milestoneCopy: {
    color: storyTheme.ink,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.94,
  },
});
