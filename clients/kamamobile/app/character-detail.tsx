import { getRarityColor, storyTheme } from "@/components/ui/story-theme";
import { useHeartsState } from "@/hooks/useHeartsState";
import { useRewardedHeartRecovery } from "@/hooks/useRewardedHeartRecovery";
import { getCharacterBySlug, type Character } from "@/lib";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";

const HERO_HEIGHT = 430;

interface CharacterDetail extends Character {
  story?: string;
  categories?: Array<{
    category: {
      id: string;
      slug: string;
      name: string;
    };
  }>;
}

type BlockedLesson = {
  slug: string;
  title: string;
};

function openLesson(
  navigation: ReturnType<typeof useRouter>,
  slug: string,
  title: string,
) {
  navigation.push({
    pathname: "/lesson/[slug]",
    params: {
      slug,
      lessonTitle: title,
    },
  });
}

export default function CharacterDetailPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [character, setCharacter] = useState<CharacterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockedLesson, setBlockedLesson] = useState<BlockedLesson | null>(null);
  const { hearts, hasHearts, setHearts } = useHeartsState();
  const {
    error: rewardedHeartError,
    isAdReady,
    isLoadingAd,
    isClaimingHeart,
    restoreOneHeartWithAd,
  } = useRewardedHeartRecovery();
  const scrollY = useSharedValue(0);

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
        const data = await getCharacterBySlug(slug);
        setCharacter(data as CharacterDetail);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load character",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCharacter();
  }, [slug]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroImageStyle = useAnimatedStyle(() => {
    const pullDown = Math.min(scrollY.value, 0);

    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [-HERO_HEIGHT, 0, HERO_HEIGHT],
            [-HERO_HEIGHT * 0.2, 0, HERO_HEIGHT * 0.12],
          ),
        },
        {
          scale: interpolate(pullDown, [-HERO_HEIGHT, 0], [1.28, 1]),
        },
      ],
    };
  });

  const overlayHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HERO_HEIGHT * 0.42], [0, 1]),
  }));

  const headerTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [HERO_HEIGHT * 0.18, HERO_HEIGHT * 0.42],
      [0, 1],
    ),
  }));

  const titleLiftStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 180], [0, -18]),
      },
    ],
    opacity: interpolate(scrollY.value, [0, 220], [1, 0.2]),
  }));

  async function handleRewardedHeartRestore() {
    if (!blockedLesson) {
      return;
    }

    try {
      const updatedHearts = await restoreOneHeartWithAd();
      setHearts(updatedHearts);
      const nextLesson = blockedLesson;
      setBlockedLesson(null);
      openLesson(router, nextLesson.slug, nextLesson.title);
    } catch (restoreError) {
      Alert.alert(
        "Heart not restored",
        restoreError instanceof Error
          ? restoreError.message
          : "We couldn't restore your heart right now.",
      );
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={storyTheme.mint} />
      </SafeAreaView>
    );
  }

  if (error || !character) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not open legend</Text>
          <Text style={styles.errorCopy}>
            {error || "The character details are not available right now."}
          </Text>
          <Pressable onPress={router.back} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const rarityColor = getRarityColor(character.rarityLevel);
  const timeline = [character.birthYear, character.endYear]
    .filter((value): value is number => value != null)
    .join(" - ");
  const detailPairs = [
    {
      label: "Type",
      value:
        character.personType ||
        character.placeType ||
        character.eventType ||
        character.traditionType ||
        character.conceptType ||
        character.entityType ||
        null,
    },
    { label: "Country", value: character.country || null },
    { label: "Timeline", value: timeline || null },
    {
      label: "Unlock XP",
      value:
        character.xpThreshold != null ? `${character.xpThreshold} XP` : null,
    },
  ].filter((item) => item.value);
  const achievements = Array.isArray(character.achievements)
    ? character.achievements.filter(Boolean)
    : [];
  const metadataEntries = Object.entries(character.metadata ?? {}).filter(
    ([, value]) =>
      value !== null && value !== undefined && `${value}`.trim().length > 0,
  );
  const sortedLessons = [...(character.lessons ?? [])].sort(
    (a, b) => a.order - b.order,
  );
  const heroHeight = HERO_HEIGHT + insets.top + 32;

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      <View style={[styles.heroBackdrop, { height: heroHeight }]}>
        <Animated.Image
          source={character.imageUrl ? { uri: character.imageUrl } : undefined}
          style={[styles.heroImage, heroImageStyle]}
          resizeMode="cover"
        />
        <View style={styles.heroShade} />
      </View>

      <View style={styles.topBar} pointerEvents="box-none">
        <Animated.View style={[styles.topBarGlass, overlayHeaderStyle]} />
        <View style={[styles.topBarContent, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={router.back} style={styles.topIcon}>
            <Text style={styles.topIconText}>
              <MaterialIcons name="arrow-back-ios-new" size={18} />
            </Text>
          </Pressable>
          <Animated.Text style={[styles.topBarTitle, headerTitleStyle]}>
            {character.name}
          </Animated.Text>
          <View style={styles.topIconPlaceholder} />
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.heroWrap, { height: heroHeight }]}>
          <Animated.View style={[styles.heroFooter, titleLiftStyle]}>
            <View
              style={[
                styles.rarityPill,
                {
                  backgroundColor: `${rarityColor}22`,
                  borderColor: rarityColor,
                },
              ]}
            >
              <Text style={[styles.rarityText, { color: rarityColor }]}>
                {character.rarityLevel ?? "Legend"}
              </Text>
            </View>
            <Text style={styles.heroTitle}>{character.name}</Text>
            {character.description ? (
              <Text style={styles.heroCopy}>{character.description}</Text>
            ) : null}
          </Animated.View>
        </View>

        <View style={styles.body}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionEyebrow}>Overview</Text>
            <Text style={styles.sectionTitle}>Why this figure matters</Text>
            <Text style={styles.sectionCopy}>
              {character.story ||
                character.description ||
                "This figure stands at the center of a larger story in the app."}
            </Text>
          </View>

          {/* {detailPairs.length > 0 ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionEyebrow}>Profile</Text>
              <Text style={styles.sectionTitle}>At a glance</Text>
              <View style={styles.factGrid}>
                {detailPairs.map((item) => (
                  <View key={item.label} style={styles.factCard}>
                    <Text style={styles.factLabel}>{item.label}</Text>
                    <Text style={styles.factValue}>
                      {String(item.value).replace(/_/g, " ")}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {character.categories && character.categories.length > 0 ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionEyebrow}>Categories</Text>
              <Text style={styles.sectionTitle}>Where this legend belongs</Text>
              <View style={styles.chipWrap}>
                {character.categories.map((cat) => (
                  <View key={cat.category.id} style={styles.chip}>
                    <Text style={styles.chipText}>{cat.category.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null} */}

          {/* {achievements.length > 0 ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionEyebrow}>Achievements</Text>
              <Text style={styles.sectionTitle}>Legacy and impact</Text>
              <View style={styles.bulletList}>
                {achievements.map((achievement) => (
                  <View key={achievement} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{achievement}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {metadataEntries.length > 0 ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionEyebrow}>Details</Text>
              <Text style={styles.sectionTitle}>More to discover</Text>
              <View style={styles.factStack}>
                {metadataEntries.map(([key, value]) => (
                  <View key={key} style={styles.factRow}>
                    <Text style={styles.factRowLabel}>
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (letter) => letter.toUpperCase())}
                    </Text>
                    <Text style={styles.factRowValue}>{String(value)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null} */}

          {sortedLessons.length > 0 ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionEyebrow}>Stories</Text>
              <Text style={styles.sectionTitle}>
                Learn the incroyable stories of this legend
              </Text>
              <View style={styles.lessonList}>
                {sortedLessons.map((lesson) => (
                  <Pressable
                    key={lesson.id}
                    onPress={() => {
                      if (!hasHearts) {
                        setBlockedLesson({
                          slug: lesson.slug,
                          title: lesson.title,
                        });
                        return;
                      }
                      openLesson(router, lesson.slug, lesson.title);
                    }}
                    style={({ pressed }) => [
                      styles.lessonRow,
                      pressed && styles.pressed,
                    ]}
                  >
                    {/* <View style={styles.lessonIndex}>
                      <Text style={styles.lessonIndexText}>{lesson.order}</Text>
                    </View> */}
                    <View style={styles.lessonBody}>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      {lesson.description ? (
                        <Text style={styles.lessonCopy} numberOfLines={2}>
                          {lesson.description}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.lessonArrow}>›</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </Animated.ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(blockedLesson)}
        onRequestClose={() => setBlockedLesson(null)}
      >
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>No hearts left</Text>
            <Text style={styles.modalCopy}>
              {blockedLesson
                ? `You need at least one heart to open "${blockedLesson.title}".`
                : "You need at least one heart to open this lesson."}
            </Text>
            <Text style={styles.modalMeta}>
              {hearts?.nextRecoveryAt
                ? `Next heart: ${new Date(hearts.nextRecoveryAt).toLocaleTimeString()}`
                : "Wait for recovery before starting the next lesson."}
            </Text>
            <Text style={styles.rewardCopy}>
              Watch a rewarded video to restore 1 heart instantly.
            </Text>
            {rewardedHeartError ? (
              <Text style={styles.rewardError}>{rewardedHeartError}</Text>
            ) : null}
            <Pressable
              onPress={() => {
                void handleRewardedHeartRestore();
              }}
              disabled={!isAdReady || isLoadingAd || isClaimingHeart}
              style={({ pressed }) => [
                styles.rewardButton,
                (!isAdReady || isLoadingAd || isClaimingHeart) &&
                  styles.rewardButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              {isLoadingAd || isClaimingHeart ? (
                <ActivityIndicator color={storyTheme.white} />
              ) : (
                <Text style={styles.rewardButtonText}>
                  {isAdReady ? "Watch Ad For 1 Heart" : "Loading Reward Ad..."}
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => setBlockedLesson(null)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: storyTheme.paper,
  },
  heroBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    backgroundColor: storyTheme.paper,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: storyTheme.paper,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(18, 25, 34, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    backgroundColor: storyTheme.white,
    padding: 22,
    gap: 10,
  },
  modalTitle: {
    color: storyTheme.ink,
    fontSize: 24,
    fontWeight: "900",
  },
  modalCopy: {
    color: storyTheme.ink,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  modalMeta: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  rewardCopy: {
    color: storyTheme.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  rewardError: {
    color: "#B42318",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  rewardButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: storyTheme.navy,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  rewardButtonDisabled: {
    opacity: 0.6,
  },
  rewardButtonText: {
    color: storyTheme.white,
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: storyTheme.line,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: storyTheme.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  topBarGlass: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: storyTheme.paper,
    borderBottomWidth: 1,
    borderBottomColor: storyTheme.line,
  },
  topBarContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: storyTheme.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  topIconText: {
    color: storyTheme.white,
    fontSize: 24,
    lineHeight: 24,
    fontWeight: "700",
  },
  topBarTitle: {
    color: storyTheme.ink,
    fontSize: 16,
    fontWeight: "900",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  topIconPlaceholder: {
    width: 36,
    height: 36,
  },
  content: {
    paddingBottom: 36,
  },
  heroWrap: {
    justifyContent: "flex-end",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "rgba(38, 4, 31, 0.34)",
  },
  heroFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 5,
  },
  rarityPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: storyTheme.white,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: storyTheme.white,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "900",
    maxWidth: "85%",
  },
  heroCopy: {
    color: "#efe4f1",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },
  body: {
    marginTop: -26,
    backgroundColor: storyTheme.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 20,
  },
  sectionCard: {
    marginHorizontal: 16,
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 20,
    gap: 10,
  },
  sectionEyebrow: {
    color: storyTheme.amber,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: storyTheme.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  sectionCopy: {
    color: storyTheme.ink,
    fontSize: 15,
    lineHeight: 27,
    fontWeight: "500",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  chip: {
    backgroundColor: storyTheme.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: storyTheme.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: storyTheme.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  factGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  factCard: {
    minWidth: "47%",
    flexGrow: 1,
    backgroundColor: storyTheme.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 14,
    gap: 4,
  },
  factLabel: {
    color: storyTheme.inkSoft,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  factValue: {
    color: storyTheme.ink,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  bulletList: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: storyTheme.amber,
    marginTop: 9,
  },
  bulletText: {
    flex: 1,
    color: storyTheme.ink,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },
  factStack: {
    gap: 12,
  },
  factRow: {
    backgroundColor: storyTheme.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 14,
    gap: 4,
  },
  factRowLabel: {
    color: storyTheme.inkSoft,
    fontSize: 12,
    fontWeight: "800",
  },
  factRowValue: {
    color: storyTheme.ink,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },
  lessonList: {
    gap: 12,
    marginTop: 4,
  },
  lessonRow: {
    backgroundColor: storyTheme.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lessonIndex: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff4dd",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f1d6ac",
  },
  lessonIndexText: {
    color: "#b8773f",
    fontSize: 13,
    fontWeight: "900",
  },
  lessonBody: {
    flex: 1,
    gap: 3,
  },
  lessonTitle: {
    color: storyTheme.ink,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "800",
  },
  lessonCopy: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
  lessonArrow: {
    color: storyTheme.navy,
    fontSize: 28,
    lineHeight: 28,
    fontWeight: "700",
  },
  errorCard: {
    width: "100%",
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 20,
    gap: 12,
    alignItems: "center",
  },
  errorTitle: {
    color: storyTheme.ink,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  errorCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: storyTheme.navy,
    borderRadius: 20,
    minHeight: 56,
    minWidth: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: storyTheme.white,
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.94,
  },
});
