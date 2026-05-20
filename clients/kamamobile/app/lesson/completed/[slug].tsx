import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import Confetti from "react-native-confetti";
import { getDashboard } from "@/lib/api";
import { loadToken } from "@/lib/auth/token-storage";
import { getLessonBySlug } from "@/lib";
import { useLocale } from "@/lib/auth/locale-context";
// import { useLessonEffects } from "@/hooks/useLessonEffects";

export default function LessonCompletedPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLanguage } = useLocale();
  // const { playEffect } = useLessonEffects();
  const confettiRef = React.useRef<any>(null);
  const songSoundRef = React.useRef<Audio.Sound | null>(null);
  const {
    slug,
    lessonId,
    lessonTitle,
    lessonCoverImage,
    xpEarned,
    streak,
    firstChapterId,
  } = useLocalSearchParams<{
    slug: string;
    lessonId?: string;
    lessonTitle?: string;
    lessonCoverImage?: string;
    xpEarned?: string;
    streak?: string;
    firstChapterId?: string;
  }>();

  const parsedXp = Number(xpEarned ?? 0) || 0;
  const [currentStreak, setCurrentStreak] = useState(Number(streak ?? 0) || 0);
  const [resolvedTitle, setResolvedTitle] = useState(lessonTitle || slug);
  const [resolvedCoverImage, setResolvedCoverImage] = useState<
    string | null | undefined
  >(lessonCoverImage);

  useEffect(
    () => {
      // void playEffect("complete");

      // Play quiz completion song
      const playCompletionSong = async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require("@/assets/SongEffects/Quiz_complet.mp3"),
            { shouldPlay: true, volume: 0.8 },
          );
          songSoundRef.current = sound;
        } catch (error) {
          console.error("Error playing completion song:", error);
        }
      };

      void playCompletionSong();
      const confettiTimers = [120, 450].map((delay) =>
        setTimeout(() => {
          if (
            confettiRef.current &&
            typeof confettiRef.current.startConfetti === "function"
          ) {
            confettiRef.current.startConfetti();
          }
        }, delay),
      );

      // Cleanup
      return () => {
        confettiTimers.forEach(clearTimeout);
        if (songSoundRef.current) {
          void songSoundRef.current.unloadAsync();
          songSoundRef.current = null;
        }
      };
    },
    [
      /* playEffect */
    ],
  );

  useEffect(() => {
    void (async () => {
      const token = await loadToken();
      if (!token) return;

      try {
        const dashboard = await getDashboard(token);
        setCurrentStreak(dashboard.stats.currentStreak ?? 0);
      } catch {
        // Route params keep the celebration resilient offline.
      }
    })();
  }, []);

  useEffect(() => {
    if (!slug || typeof slug !== "string") return;

    void getLessonBySlug(slug, currentLanguage)
      .then((lesson) => {
        setResolvedTitle(lesson.title || lessonTitle || slug);
        setResolvedCoverImage((value) => value ?? lesson.coverImage);
      })
      .catch(() => undefined);
  }, [currentLanguage, lessonTitle, slug]);

  const replayRoute = useMemo(() => {
    if (!firstChapterId) return null;
    return {
      pathname: "/chapter/[id]" as const,
      params: {
        id: firstChapterId,
        lessonId,
        lessonSlug: slug,
        lessonTitle: resolvedTitle,
        lessonCoverImage: resolvedCoverImage ?? undefined,
        mode: "replay",
      },
    };
  }, [firstChapterId, lessonId, resolvedCoverImage, resolvedTitle, slug]);

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {resolvedCoverImage ? (
        <Image
          source={{ uri: resolvedCoverImage }}
          style={styles.coverImage}
          contentFit="cover"
        />
      ) : null}
      <View style={styles.scrim} />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 22,
          },
        ]}
      >
        <View style={styles.heroBlock}>
          <View style={styles.iconBadge}>
            <MaterialIcons name="auto-awesome" size={24} color="#23160a" />
          </View>
          <Text style={styles.kicker}>Lesson complete</Text>
          <Text style={styles.title}>{resolvedTitle}</Text>
          <Text style={styles.copy}>
            Strong finish. Your progress is saved and the next story is ready
            when you are.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{parsedXp}</Text>
            <Text style={styles.statLabel}>XP earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
        </View>

        <View style={styles.actionDock}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(`/lesson/${slug}`);
              }
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryText}>Continue</Text>
          </Pressable>

          <Pressable
            disabled={!replayRoute}
            onPress={() => replayRoute && router.replace(replayRoute)}
            style={[
              styles.secondaryButton,
              !replayRoute && styles.secondaryButtonDisabled,
            ]}
          >
            <Text style={styles.secondaryText}>Restart lesson</Text>
          </Pressable>
        </View>
      </View>

      <View pointerEvents="none" style={styles.confettiLayer}>
        <Confetti ref={confettiRef} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#140b1c",
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11, 9, 18, 0.58)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: "space-between",
  },
  heroBlock: {
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#f8d568",
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    color: "#f8d568",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "900",
    textAlign: "center",
  },
  copy: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 16,
    lineHeight: 25,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: 340,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },
  statLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  actionDock: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: "#f8d568",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#23160a",
    fontSize: 17,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonDisabled: {
    opacity: 0.55,
  },
  secondaryText: {
    color: "#1b2238",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
});
