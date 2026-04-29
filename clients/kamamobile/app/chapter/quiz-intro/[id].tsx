import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { AnimatedBackdrop } from "@/components/lesson/AnimatedBackdrop";
import { useLessonEffects } from "@/hooks/useLessonEffects";

const START_SECONDS = 3;

export default function QuizIntroPage() {
  const router = useRouter();
  const { id, lessonId, lessonSlug, lessonTitle, mode } =
    useLocalSearchParams<{
      id: string;
      lessonId: string;
      lessonSlug?: string;
      lessonTitle?: string;
      mode?: string;
    }>();
  const [countdown, setCountdown] = useState(START_SECONDS);
  const [paused, setPaused] = useState(false);
  const { playEffect } = useLessonEffects();

  const nextRoute = useMemo(
    () => ({
      pathname: "/chapter/quiz/[id]" as const,
      params: {
        id,
        lessonId,
        lessonSlug,
        lessonTitle,
        mode,
      },
    }),
    [id, lessonId, lessonSlug, lessonTitle, mode],
  );

  useEffect(() => {
    void playEffect("quiz");
  }, [playEffect]);

  useEffect(() => {
    if (paused) return;

    if (countdown <= 0) {
      router.replace(nextRoute);
      return;
    }

    const timeout = setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [countdown, nextRoute, paused, router]);

  return (
    <SafeAreaView style={styles.screen}>
      <AnimatedBackdrop />

      <View style={styles.shell}>
        <View style={styles.badge}>
          <MaterialIcons name="auto-awesome" size={18} color="#f8d568" />
          <Text style={styles.badgeText}>Quiz transition</Text>
        </View>

        <Text style={styles.title}>Quiz Time</Text>
        <Text style={styles.copy}>
          {lessonTitle
            ? `You finished the story beat for ${lessonTitle}. Take a breath and get ready to lock it in.`
            : "You finished the story beat. Take a breath and get ready to lock it in."}
        </Text>

        <View style={styles.countdownRing}>
          <Text style={styles.countdownValue}>{countdown}</Text>
          <Text style={styles.countdownLabel}>
            {paused ? "Paused here" : "Starting quiz"}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              setPaused((value) => !value);
              void playEffect("pause");
            }}
            style={[styles.secondaryButton, paused && styles.secondaryButtonOn]}
          >
            <MaterialIcons
              name={paused ? "play-arrow" : "pause"}
              size={18}
              color="#1b2238"
            />
            <Text style={styles.secondaryText}>
              {paused ? "Resume timer" : "Pause timer"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace(nextRoute)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryText}>Start quiz now</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#20051d",
  },
  shell: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  badgeText: {
    color: "#f6e7b9",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    marginTop: 26,
    color: "#ffffff",
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "900",
    textAlign: "center",
  },
  copy: {
    marginTop: 14,
    color: "#e6dae8",
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: 340,
  },
  countdownRing: {
    marginTop: 36,
    width: 198,
    height: 198,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 2,
    borderColor: "rgba(248, 213, 104, 0.55)",
    shadowColor: "#f8d568",
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  countdownValue: {
    color: "#f8d568",
    fontSize: 72,
    lineHeight: 80,
    fontWeight: "900",
  },
  countdownLabel: {
    marginTop: 6,
    color: "#f5e4f6",
    fontSize: 14,
    fontWeight: "700",
  },
  actions: {
    marginTop: 32,
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#f8d568",
    borderRadius: 22,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  primaryText: {
    color: "#22160a",
    fontSize: 17,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  secondaryButtonOn: {
    backgroundColor: "#d7f3dd",
  },
  secondaryText: {
    color: "#1b2238",
    fontSize: 15,
    fontWeight: "800",
  },
});
