import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Audio } from "expo-av";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { AnimatedBackdrop } from "@/components/lesson/AnimatedBackdrop";
import { useAudioPreferences } from "@/lib/audio/audio-preferences-context";

const AUTO_START_DELAY = 4000; // Start quiz after 4 seconds
const quizBackground = require("../../../assets/images/quiz-background.png");

export default function QuizIntroPage() {
  const router = useRouter();
  const {
    id,
    lessonId,
    lessonSlug,
    lessonTitle,
    lessonCoverImage,
    chapterCoverImage,
    mode,
  } = useLocalSearchParams<{
    id: string;
    lessonId: string;
    lessonSlug?: string;
    lessonTitle?: string;
    lessonCoverImage?: string;
    chapterCoverImage?: string;
    mode?: string;
  }>();
  const { preferences } = useAudioPreferences();
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    let openingSound: Audio.Sound | null = null;

    Audio.Sound.createAsync(
      require("../../../assets/SongEffects/opening_quiz.mp3"),
      { shouldPlay: true, volume: 0.8 * preferences.soundEffectsVolume },
    )
      .then(({ sound }) => {
        openingSound = sound;
      })
      .catch(() => undefined);

    // Start scale animation
    scaleValue.value = withTiming(1.05, {
      duration: AUTO_START_DELAY,
      easing: Easing.linear,
    });

    const timeout = setTimeout(() => {
      router.replace({
        pathname: "/chapter/quiz/[id]",
        params: {
          id,
          lessonId,
          lessonSlug,
          lessonTitle,
          lessonCoverImage,
          chapterCoverImage,
          mode,
        },
      });
    }, AUTO_START_DELAY);

    return () => {
      clearTimeout(timeout);
      void openingSound?.unloadAsync().catch(() => undefined);
    };
  }, [
    chapterCoverImage,
    id,
    lessonId,
    lessonSlug,
    lessonTitle,
    lessonCoverImage,
    mode,
    preferences.soundEffectsVolume,
    router,
    scaleValue,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      {/* Background Image with Scale Animation */}
      <Animated.View style={[styles.backgroundContainer, animatedStyle]}>
        <AnimatedBackdrop />
        <Image
          source={quizBackground}
          style={styles.backgroundImage}
          contentFit="cover"
        />
        <View style={styles.overlay} />
      </Animated.View>

      {/* Quiz Time Text */}
      <View style={styles.content}>
        <Text style={styles.quizTimeText}>Quiz</Text>
        <Text style={styles.quizTimeText}>Time</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundFallback: {
    backgroundColor: "#3d0d35",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  quizTimeText: {
    fontSize: 56,
    fontWeight: "900",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
    textAlign: "center",
  },
});
