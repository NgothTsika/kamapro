import React, { useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Text,
  Modal,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { storyTheme } from "./story-theme";
import type { AudioSettings, AudioPlayState } from "@/hooks/useAudioPlayer";
import Slider from "@react-native-community/slider";

interface AudioPlayerProps {
  playState: AudioPlayState;
  settings: AudioSettings;
  onPlay: (text: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSettingsChange: (settings: Partial<AudioSettings>) => void;
  contentText?: string;
}

export function AudioPlayer({
  playState,
  settings,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSettingsChange,
  contentText,
}: AudioPlayerProps) {
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);

  const progress =
    playState.duration > 0 ? playState.currentPosition / playState.duration : 0;

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handlePlayPress = () => {
    if (playState.isPlaying) {
      onPause();
    } else if (playState.isPaused) {
      onResume();
    } else if (contentText) {
      onPlay(contentText);
    }
  };

  return (
    <>
      <View style={styles.playerContainer}>
        <View style={styles.playerHeader}>
          <Text style={styles.playerTitle}>{t("audio.reading")}</Text>
          <Pressable onPress={onStop} hitSlop={8}>
            <MaterialIcons name="close" size={20} color={storyTheme.ink} />
          </Pressable>
        </View>

        <View style={styles.progressSection}>
          <Slider
            style={styles.slider}
            value={progress}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor={storyTheme.mint}
            maximumTrackTintColor={storyTheme.line}
            disabled={!playState.isPlaying && !playState.isPaused}
          />
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>
              {formatTime(playState.currentPosition)}
            </Text>
            <Text style={styles.timeText}>{formatTime(playState.duration)}</Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <Pressable
            onPress={handlePlayPress}
            disabled={!contentText}
            style={({ pressed }) => [
              styles.controlButton,
              !contentText && styles.controlButtonDisabled,
              pressed && styles.controlButtonPressed,
            ]}
          >
            <MaterialIcons
              name={
                playState.isPlaying
                  ? "pause-circle"
                  : playState.isPaused
                    ? "play-circle"
                    : "play-circle"
              }
              size={32}
              color={contentText ? storyTheme.mint : storyTheme.line}
            />
          </Pressable>

          <Pressable
            onPress={() => setShowSettings(true)}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}
          >
            <MaterialIcons name="settings" size={20} color={storyTheme.navy} />
          </Pressable>

          <Pressable
            onPress={() =>
              onSettingsChange({
                enabled: !settings.enabled,
              })
            }
            style={({ pressed }) => [
              styles.toggleButton,
              settings.enabled && styles.toggleButtonActive,
              pressed && styles.toggleButtonPressed,
            ]}
          >
            <MaterialIcons
              name={settings.enabled ? "volume-up" : "volume-off"}
              size={20}
              color={settings.enabled ? storyTheme.mint : storyTheme.line}
            />
          </Pressable>
        </View>
      </View>

      <Modal visible={showSettings} transparent animationType="fade">
        <View style={styles.settingsBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowSettings(false)}
          />
          <View style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>{t("settings.audioSettings")}</Text>
              <Pressable
                onPress={() => setShowSettings(false)}
                hitSlop={8}
              >
                <MaterialIcons name="close" size={20} color={storyTheme.ink} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.settingsContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.settingItem}>
                <View style={styles.settingLabel}>
                  <Text style={styles.settingLabelText}>
                    {t("settings.speechRate")}
                  </Text>
                  <Text style={styles.settingValue}>{settings.rate.toFixed(1)}x</Text>
                </View>
                <Slider
                  style={styles.settingSlider}
                  value={settings.rate}
                  minimumValue={0.5}
                  maximumValue={2}
                  step={0.1}
                  onValueChange={(value: number) =>
                    onSettingsChange({ rate: value })
                  }
                  minimumTrackTintColor={storyTheme.mint}
                  maximumTrackTintColor={storyTheme.line}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>0.5x</Text>
                  <Text style={styles.sliderLabel}>1.0x</Text>
                  <Text style={styles.sliderLabel}>2.0x</Text>
                </View>
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLabel}>
                  <Text style={styles.settingLabelText}>
                    {t("settings.voicedNarration")}
                  </Text>
                  <Text style={styles.settingValue}>
                    {Math.round(settings.narrationVolume * 100)}%
                  </Text>
                </View>
                <Slider
                  style={styles.settingSlider}
                  value={settings.narrationVolume}
                  minimumValue={0}
                  maximumValue={1}
                  step={0.1}
                  onValueChange={(value: number) =>
                    onSettingsChange({ narrationVolume: value })
                  }
                  minimumTrackTintColor={storyTheme.mint}
                  maximumTrackTintColor={storyTheme.line}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>0%</Text>
                  <Text style={styles.sliderLabel}>50%</Text>
                  <Text style={styles.sliderLabel}>100%</Text>
                </View>
              </View>

              <Pressable
                onPress={() =>
                  onSettingsChange({
                    enabled: !settings.enabled,
                  })
                }
                style={({ pressed }) => [
                  styles.toggleSetting,
                  settings.enabled && styles.toggleSettingActive,
                  pressed && styles.toggleSettingPressed,
                ]}
              >
                <MaterialIcons
                  name={settings.enabled ? "check-circle" : "radio-button-unchecked"}
                  size={24}
                  color={settings.enabled ? storyTheme.mint : storyTheme.line}
                />
                <Text style={styles.toggleSettingText}>
                  {t("settings.textToSpeech")}: {settings.enabled ? t("settings.enabled") : t("settings.disabled")}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  playerContainer: {
    backgroundColor: storyTheme.paperSoft,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopColor: storyTheme.line,
    borderLeftColor: storyTheme.line,
    borderRightColor: storyTheme.line,
    gap: 12,
  },
  playerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: storyTheme.ink,
  },
  progressSection: {
    gap: 8,
  },
  slider: {
    height: 40,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 12,
    color: storyTheme.inkSoft,
    fontWeight: "600",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  controlButton: {
    padding: 8,
  },
  controlButtonDisabled: {
    opacity: 0.4,
  },
  controlButtonPressed: {
    opacity: 0.7,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff8ea",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButtonPressed: {
    opacity: 0.7,
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: storyTheme.paperSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: storyTheme.line,
  },
  toggleButtonActive: {
    backgroundColor: "#eef9f1",
    borderColor: storyTheme.mint,
  },
  toggleButtonPressed: {
    opacity: 0.7,
  },
  settingsBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.42)",
    justifyContent: "flex-end",
  },
  settingsCard: {
    backgroundColor: storyTheme.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: "80%",
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: storyTheme.ink,
  },
  settingsContent: {
    gap: 16,
  },
  settingItem: {
    gap: 8,
  },
  settingLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabelText: {
    fontSize: 14,
    fontWeight: "700",
    color: storyTheme.ink,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: "800",
    color: storyTheme.mint,
  },
  settingSlider: {
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: {
    fontSize: 11,
    color: storyTheme.inkSoft,
    fontWeight: "600",
  },
  toggleSetting: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: storyTheme.paperSoft,
    marginTop: 8,
  },
  toggleSettingActive: {
    backgroundColor: "#eef9f1",
  },
  toggleSettingPressed: {
    opacity: 0.7,
  },
  toggleSettingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: storyTheme.ink,
  },
});
