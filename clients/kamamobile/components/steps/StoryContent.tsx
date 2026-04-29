import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { storyTheme } from "@/components/ui/story-theme";

interface ChapterContent {
  chapterId: string;
  title: string;
  paragraphs: string[];
  audioEnabled?: boolean;
}

interface StoryContentProps {
  chapter: ChapterContent;
  onChapterComplete?: () => void;
}

/**
 * StoryContent Component
 *
 * Displays chapter text with optional text-to-speech audio playback
 * Supports multi-language with i18next
 * Follows Paladin-style UI/UX patterns
 */
export function StoryContent({ chapter, onChapterComplete }: StoryContentProps) {
  const { t } = useTranslation();
  const {
    playState,
    settings,
    error,
    speak,
    pause,
    resume,
    stop,
    updateSettings,
  } = useAudioPlayer();

  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Combine all paragraphs for audio
  const fullText = chapter.paragraphs.join("\n\n");

  // Calculate reading progress based on audio position
  useEffect(() => {
    if (playState.duration > 0) {
      setReadingProgress(playState.currentPosition / playState.duration);
    }
  }, [playState.currentPosition, playState.duration]);

  const handleStartAudio = () => {
    setShowAudioPlayer(true);
    speak(fullText);
  };

  const handlePauseAudio = () => {
    pause();
  };

  const handleResumeAudio = () => {
    resume();
  };

  const handleStopAudio = () => {
    stop();
    setShowAudioPlayer(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Chapter Header */}
        <View style={styles.header}>
          <Text style={styles.chapterLabel}>{t("story.chapter")}</Text>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
        </View>

        {/* Reading Progress Bar */}
        {showAudioPlayer && (
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${readingProgress * 100}%` },
              ]}
            />
          </View>
        )}

        {/* Audio Controls */}
        <View style={styles.audioControlsBar}>
          <Pressable
            onPress={handleStartAudio}
            disabled={playState.isPlaying}
            style={({ pressed }) => [
              styles.audioButton,
              playState.isPlaying && styles.audioButtonActive,
              pressed && styles.audioButtonPressed,
            ]}
          >
            <MaterialIcons
              name={playState.isPlaying ? "pause" : "play-arrow"}
              size={18}
              color={playState.isPlaying ? storyTheme.mint : storyTheme.navy}
            />
            <Text style={styles.audioButtonText}>
              {playState.isPlaying
                ? t("audio.pause")
                : t("audio.play")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowAudioPlayer(!showAudioPlayer)}
            style={({ pressed }) => [
              styles.settingsButton,
              showAudioPlayer && styles.settingsButtonActive,
              pressed && styles.settingsButtonPressed,
            ]}
          >
            <MaterialIcons
              name="settings"
              size={18}
              color={showAudioPlayer ? storyTheme.mint : storyTheme.navy}
            />
          </Pressable>
        </View>

        {/* Chapter Content - Paragraphs */}
        <View style={styles.contentSection}>
          {chapter.paragraphs.map((paragraph, index) => (
            <Text
              key={`${chapter.chapterId}-${index}`}
              style={styles.paragraph}
            >
              {paragraph}
            </Text>
          ))}
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={16} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            onPress={onChapterComplete}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>{t("story.continue")}</Text>
            <MaterialIcons
              name="arrow-forward"
              size={18}
              color={storyTheme.white}
            />
          </Pressable>
        </View>
      </ScrollView>

      {/* Audio Player Bottom Sheet */}
      {showAudioPlayer && (
        <AudioPlayer
          playState={playState}
          settings={settings}
          onPlay={handleStartAudio}
          onPause={handlePauseAudio}
          onResume={handleResumeAudio}
          onStop={handleStopAudio}
          onSettingsChange={updateSettings}
          contentText={fullText}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: storyTheme.paper,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  chapterLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: storyTheme.amber,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  chapterTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: storyTheme.ink,
    lineHeight: 36,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: storyTheme.line,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: storyTheme.mint,
    borderRadius: 2,
  },
  audioControlsBar: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  audioButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: storyTheme.line,
    backgroundColor: storyTheme.paperSoft,
  },
  audioButtonActive: {
    backgroundColor: "#eef9f1",
    borderColor: storyTheme.mint,
  },
  audioButtonPressed: {
    opacity: 0.7,
  },
  audioButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: storyTheme.navy,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: storyTheme.paperSoft,
    borderWidth: 1,
    borderColor: storyTheme.line,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButtonActive: {
    backgroundColor: "#eef9f1",
    borderColor: storyTheme.mint,
  },
  settingsButtonPressed: {
    opacity: 0.7,
  },
  contentSection: {
    gap: 16,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: storyTheme.ink,
    fontWeight: "500",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff0ed",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#efbaa9",
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#b25740",
    fontWeight: "600",
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: storyTheme.navy,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: storyTheme.white,
  },
});
