import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

const MIN_NARRATION_START_DELAY_MS = 2000;

export const storyColors = {
  ink: "#21314f",
  inkMuted: "#5f6781",
  paper: "#f6eddc",
  paperSoft: "#fbf4e7",
  navy: "#263b5e",
  navyPressed: "#1d2f4e",
  navyMuted: "#aab3c0",
  sandLine: "#eadbc4",
  mint: "#58b874",
  white: "#ffffff",
  accent: "#f3a35c",
  shadow: "#190a20",
};

export function getParagraphs(...values: unknown[]): string[] {
  const readString = (value: unknown): string[] => {
    if (typeof value === "string") return value.split(/\n{2,}/);
    if (!value || typeof value !== "object") return [];

    const record = value as Record<string, unknown>;
    return [
      record.text,
      record.body,
      record.paragraph,
      record.content,
      record.value,
      record.description,
    ].flatMap(readString);
  };

  return values
    .flatMap((value) => {
      if (typeof value === "string") return readString(value);
      if (Array.isArray(value)) {
        return value.flatMap(readString);
      }
      if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        return [
          record.paragraphSlides,
          record.paragraphs,
          record.slides,
          record.items,
          record.text,
        ].flatMap(readString);
      }
      return [];
    })
    .map((item) => item.trim())
    .filter(Boolean);
}

export function StoryTitleBlock({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string | null;
  title?: string | null;
  subtitle?: string | null;
}) {
  return (
    <View style={styles.titleBlock}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function StoryParagraphs({ paragraphs }: { paragraphs: string[] }) {
  return (
    <View style={styles.paragraphGroup}>
      {paragraphs.map((paragraph, index) => (
        <Text key={`${paragraph}-${index}`} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

export function StoryParagraphSlider({
  slides,
  onStateChange,
  readingEnabled = true,
  pauseAudioSignal = 0,
  resumeAudioSignal = 0,
  stopAudioSignal = 0,
  startDelayMs,
}: {
  slides?: unknown;
  onStateChange?: (state: { hasSlides: boolean; completed: boolean }) => void;
  readingEnabled?: boolean;
  pauseAudioSignal?: number;
  resumeAudioSignal?: number;
  stopAudioSignal?: number;
  startDelayMs?: number;
}) {
  const paragraphs = useMemo(() => getParagraphs(slides), [slides]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const { speak, pause, resume, stop, settings } = useAudioPlayer();
  const slideKey = paragraphs.join("|");
  const effectiveStartDelayMs = Math.max(
    MIN_NARRATION_START_DELAY_MS,
    startDelayMs ?? settings.startDelaySeconds * 1000,
  );
  const advanceTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  function clearAdvanceTimeout() {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }

  useEffect(() => {
    stop();
    clearAdvanceTimeout();
    setActiveIndex(0);
    setCompleted(paragraphs.length === 0);
  }, [paragraphs.length, slideKey, stop]);

  useEffect(() => {
    onStateChange?.({
      hasSlides: paragraphs.length > 0,
      completed: paragraphs.length === 0 || completed,
    });
  }, [completed, onStateChange, paragraphs.length]);

  useEffect(() => {
    if (!readingEnabled || paragraphs.length === 0 || completed) return;

    const activeParagraph = paragraphs[activeIndex];
    if (!activeParagraph) return;

    clearAdvanceTimeout();

    // Always read paragraph slides (regardless of autoPlay setting)
    // Paragraph slides with video should prioritize text-to-speech
    if (!settings.enabled) {
      // If TTS is disabled, just show text for a calculated reading time
      const readingMs = Math.max(
        2400,
        activeParagraph.split(/\s+/).length * 420,
      );

      advanceTimeoutRef.current = setTimeout(() => {
        if (activeIndex >= paragraphs.length - 1) {
          setCompleted(true);
          return;
        }

        setActiveIndex((value) => Math.min(value + 1, paragraphs.length - 1));
      }, readingMs + 2500);

      return () => clearAdvanceTimeout();
    }

    // TTS is enabled, read the paragraph
    const startTimeout = setTimeout(
      () => {
        void speak(activeParagraph, () => {
          advanceTimeoutRef.current = setTimeout(() => {
            if (activeIndex >= paragraphs.length - 1) {
              setCompleted(true);
              return;
            }

            setActiveIndex((value) =>
              Math.min(value + 1, paragraphs.length - 1),
            );
          }, 2500);
        });
      },
      effectiveStartDelayMs,
    );

    return () => {
      clearTimeout(startTimeout);
      clearAdvanceTimeout();
    };
  }, [
    activeIndex,
    completed,
    paragraphs,
    readingEnabled,
    settings.enabled,
    effectiveStartDelayMs,
    speak,
  ]);

  useEffect(() => {
    if (pauseAudioSignal === 0) return;
    clearAdvanceTimeout();
    void pause();
  }, [pause, pauseAudioSignal]);

  useEffect(() => {
    if (resumeAudioSignal === 0) return;
    void resume();
  }, [resume, resumeAudioSignal]);

  useEffect(() => {
    if (stopAudioSignal === 0) return;
    clearAdvanceTimeout();
    stop();
    setCompleted(true);
  }, [stop, stopAudioSignal]);

  if (paragraphs.length === 0) return null;

  const activeParagraph =
    paragraphs[Math.min(activeIndex, paragraphs.length - 1)];

  return (
    <View style={styles.slideShell}>
      <View style={styles.slideCard}>
        <Animated.Text
          key={`${activeIndex}-${activeParagraph}`}
          entering={FadeIn.duration(360)}
          exiting={FadeOut.duration(180)}
          style={styles.slideText}
        >
          {activeParagraph}
        </Animated.Text>
        <View style={styles.slideFooter}>
          <View style={styles.slideDots}>
            {paragraphs.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.slideDot,
                  index === activeIndex && styles.slideDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

export function StoryPrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        (disabled || loading) && styles.primaryButtonDisabled,
        pressed && !disabled && !loading && styles.primaryButtonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={storyColors.white} />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function StoryOptionButton({
  label,
  hint,
  selected,
  onPress,
  dark,
  disabled,
}: {
  label: string;
  hint?: string | null;
  selected?: boolean;
  onPress: () => void;
  dark?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.optionButton,
        dark && styles.optionButtonDark,
        selected &&
          (dark
            ? styles.optionButtonDarkSelected
            : styles.optionButtonSelected),
        disabled && styles.optionButtonDisabled,
        pressed && !disabled && styles.optionButtonPressed,
      ]}
    >
      <Text
        style={[
          styles.optionLabel,
          dark && styles.optionLabelDark,
          selected && styles.optionLabelSelected,
        ]}
      >
        {label}
      </Text>
      {hint ? (
        <Text
          style={[
            styles.optionHint,
            dark && styles.optionHintDark,
            selected && styles.optionHintSelected,
          ]}
        >
          {hint}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function StoryBadge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: {
    gap: 8,
    marginBottom: 18,
  },
  eyebrow: {
    color: "#d67d37",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    color: storyColors.ink,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 28,
  },
  subtitle: {
    color: storyColors.inkMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  paragraphGroup: {
    gap: 16,
  },
  paragraph: {
    color: storyColors.ink,
    fontSize: 16,
    lineHeight: 30,
    fontWeight: "500",
  },
  slideShell: {
    gap: 10,
  },
  slideCard: {
    minHeight: 188,
    justifyContent: "space-between",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: storyColors.sandLine,
    backgroundColor: storyColors.paperSoft,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  slideText: {
    color: storyColors.ink,
    fontSize: 16,
    lineHeight: 28,
    fontWeight: "600",
  },
  slideFooter: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slideDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  slideDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#d8ccb9",
  },
  slideDotActive: {
    width: 18,
    backgroundColor: storyColors.accent,
  },
  primaryButton: {
    backgroundColor: storyColors.navy,
    borderRadius: 20,
    minHeight: 56,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    shadowColor: storyColors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  primaryButtonDisabled: {
    backgroundColor: storyColors.navyMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonPressed: {
    backgroundColor: storyColors.navyPressed,
  },
  primaryButtonText: {
    color: storyColors.white,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  optionButton: {
    backgroundColor: storyColors.white,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#e8e8ec",
    shadowColor: storyColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    gap: 4,
  },
  optionButtonDark: {
    backgroundColor: storyColors.navy,
    borderColor: "#31476d",
  },
  optionButtonSelected: {
    borderColor: "#44a3e8",
    borderWidth: 2,
  },
  optionButtonDarkSelected: {
    borderColor: "#5bc0ff",
    borderWidth: 2,
  },
  optionButtonDisabled: {
    opacity: 0.6,
  },
  optionButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  optionLabel: {
    color: storyColors.ink,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },
  optionLabelDark: {
    color: storyColors.white,
  },
  optionLabelSelected: {
    color: storyColors.white,
  },
  optionHint: {
    color: storyColors.inkMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  optionHintDark: {
    color: "#dbe6f5",
  },
  optionHintSelected: {
    color: "#bfe5ff",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#fff3e2",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ffd09b",
    marginBottom: 14,
  },
  badgeText: {
    color: "#d67d37",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
