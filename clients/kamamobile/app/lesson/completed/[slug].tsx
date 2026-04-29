import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedBackdrop } from "@/components/lesson/AnimatedBackdrop";
import { FloatingConfetti } from "@/components/lesson/FloatingConfetti";
import { LessonCelebration } from "@/components/lesson/LessonCelebration";
import { getDashboard } from "@/lib/api";
import { loadToken } from "@/lib/auth/token-storage";

export default function LessonCompletedPage() {
  const router = useRouter();
  const { slug, lessonId, lessonTitle, xpEarned, streak, firstChapterId } =
    useLocalSearchParams<{
      slug: string;
      lessonId?: string;
      lessonTitle?: string;
      xpEarned?: string;
      streak?: string;
      firstChapterId?: string;
    }>();

  const parsedXp = Number(xpEarned ?? 0) || 0;
  const [currentStreak, setCurrentStreak] = useState(Number(streak ?? 0) || 0);

  useEffect(() => {
    void (async () => {
      const token = await loadToken();
      if (!token) return;

      try {
        const dashboard = await getDashboard(token);
        setCurrentStreak(dashboard.stats.currentStreak ?? 0);
      } catch {
        // Falling back to the route param keeps the celebration resilient offline.
      }
    })();
  }, []);

  const replayRoute = useMemo(() => {
    if (!firstChapterId) return null;
    return {
      pathname: "/chapter/[id]" as const,
      params: {
        id: firstChapterId,
        lessonId,
        lessonSlug: slug,
        lessonTitle,
        mode: "replay",
      },
    };
  }, [firstChapterId, lessonId, lessonTitle, slug]);

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <AnimatedBackdrop />
      <FloatingConfetti />

      <View style={styles.content}>
        <LessonCelebration
          xpEarned={parsedXp}
          streak={currentStreak}
          lessonTitle={lessonTitle || slug}
          onContinue={() => router.replace(`/lesson/${slug}`)}
        />

        <View style={styles.actionDock}>
          {replayRoute ? (
            <Pressable
              onPress={() => router.replace(replayRoute)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>Restart lesson</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => router.replace(`/lesson/${slug}`)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryText}>Back to lesson</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0e0a06",
  },
  content: {
    flex: 1,
  },
  actionDock: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
    gap: 12,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "800",
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#f8d568",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
