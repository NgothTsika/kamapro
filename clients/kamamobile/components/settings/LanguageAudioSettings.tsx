import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Speech from "expo-speech";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/lib/auth/locale-context";
import {
  supportedLanguages,
  type SupportedLanguage,
} from "@/lib/i18n/config";
import {
  useAudioPreferences,
  type AudioPreferences,
} from "@/lib/audio/audio-preferences-context";
import { storyTheme } from "@/components/ui/story-theme";

interface LanguageAudioSettingsProps {
  visible: boolean;
  onClose: () => void;
  isNarrationPlaying?: boolean;
  isNarrationPaused?: boolean;
  onPauseNarration?: () => void;
  onResumeNarration?: () => void;
  onStopNarration?: () => void;
}

type SliderSettingProps = {
  iconLeft: React.ComponentProps<typeof MaterialIcons>["name"];
  iconRight: React.ComponentProps<typeof MaterialIcons>["name"];
  title: string;
  description: string;
  value: number;
  valueLabel: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function SliderSetting({
  iconLeft,
  iconRight,
  title,
  description,
  value,
  valueLabel,
  min = 0,
  max = 1,
  step = 0.05,
  onChange,
}: SliderSettingProps) {
  const updateValue = (next: number) => onChange(clamp(next, min, max));

  return (
    <View style={styles.sliderSection}>
      <View style={styles.sliderHeader}>
        <View style={styles.sliderCopy}>
          <Text style={styles.sliderTitle}>{title}</Text>
          <Text style={styles.sliderDescription}>{description}</Text>
        </View>
        <Text style={styles.sliderValue}>{valueLabel}</Text>
      </View>

      <View style={styles.sliderRow}>
        <Pressable
          hitSlop={8}
          onPress={() => updateValue(value - step)}
          style={styles.stepButton}
        >
          <MaterialIcons name={iconLeft} size={22} color={storyTheme.inkSoft} />
        </Pressable>

        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={value}
          onValueChange={updateValue}
          minimumTrackTintColor="#727b89"
          maximumTrackTintColor="#dfd7ca"
          thumbTintColor={storyTheme.white}
        />

        <Pressable
          hitSlop={8}
          onPress={() => updateValue(value + step)}
          style={styles.stepButton}
        >
          <MaterialIcons name={iconRight} size={22} color={storyTheme.inkSoft} />
        </Pressable>
      </View>
    </View>
  );
}

export function LanguageAudioSettings({
  visible,
  onClose,
  isNarrationPlaying = false,
  isNarrationPaused = false,
  onPauseNarration,
  onResumeNarration,
  onStopNarration,
}: LanguageAudioSettingsProps) {
  const { t } = useTranslation();
  const { currentLanguage, setLanguage, isInitialized } = useLocale();
  const { preferences, updatePreferences } = useAudioPreferences();
  const [voices, setVoices] = React.useState<Speech.Voice[]>([]);

  React.useEffect(() => {
    if (!visible) return;

    void Speech.getAvailableVoicesAsync()
      .then(setVoices)
      .catch(() => setVoices([]));
  }, [visible]);

  if (!isInitialized) {
    return null;
  }

  async function handleLanguageChange(language: SupportedLanguage) {
    await setLanguage(language);
  }

  async function patchPreferences(
    next: Partial<AudioPreferences>,
  ): Promise<void> {
    await updatePreferences(next);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons
                name="volume-up"
                size={30}
                color={storyTheme.navy}
              />
              <Text style={styles.headerTitle}>{t("settings.sounds")}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeIcon}>
              <MaterialIcons name="close" size={20} color={storyTheme.ink} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <View style={styles.playbackPanel}>
                <Pressable
                  style={[
                    styles.playbackButton,
                    (!isNarrationPlaying || isNarrationPaused) &&
                      styles.playbackButtonPrimary,
                  ]}
                  onPress={() => {
                    if (isNarrationPaused) {
                      onResumeNarration?.();
                      return;
                    }
                    onPauseNarration?.();
                  }}
                >
                  <MaterialIcons
                    name={isNarrationPaused ? "play-arrow" : "pause"}
                    size={22}
                    color={
                      !isNarrationPlaying || isNarrationPaused
                        ? storyTheme.white
                        : storyTheme.navy
                    }
                  />
                  <Text
                    style={[
                      styles.playbackButtonText,
                      (!isNarrationPlaying || isNarrationPaused) &&
                        styles.playbackButtonTextPrimary,
                    ]}
                  >
                    {isNarrationPaused ? t("audio.play") : t("audio.pause")}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.playbackIconButton}
                  onPress={onStopNarration}
                >
                  <MaterialIcons name="stop" size={22} color={storyTheme.navy} />
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
              <Text style={styles.sectionDescription}>
                {t("settings.languageDescription")}
              </Text>
              <View style={styles.languageRow}>
                {(Object.keys(supportedLanguages) as SupportedLanguage[]).map(
                  (language) => {
                    const isActive = currentLanguage === language;

                    return (
                      <Pressable
                        key={language}
                        onPress={() => void handleLanguageChange(language)}
                        style={[
                          styles.languagePill,
                          isActive && styles.languagePillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.languagePillText,
                            isActive && styles.languagePillTextActive,
                          ]}
                        >
                          {supportedLanguages[language].nativeName}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>
                    {t("settings.autoPlayNarration")}
                  </Text>
                  <Text style={styles.toggleDescription}>
                    {t("settings.autoPlayNarrationDescription")}
                  </Text>
                </View>
                <Switch
                  value={preferences.autoPlayNarration}
                  onValueChange={(value) =>
                    void patchPreferences({ autoPlayNarration: value })
                  }
                  trackColor={{
                    false: storyTheme.line,
                    true: `${storyTheme.mint}55`,
                  }}
                  thumbColor={
                    preferences.autoPlayNarration
                      ? storyTheme.white
                      : storyTheme.navy
                  }
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>
                    {t("settings.narrationEnabled")}
                  </Text>
                  <Text style={styles.toggleDescription}>
                    {t("settings.narrationEnabledDescription")}
                  </Text>
                </View>
                <Switch
                  value={preferences.narrationEnabled}
                  onValueChange={(value) =>
                    void patchPreferences({ narrationEnabled: value })
                  }
                  trackColor={{
                    false: storyTheme.line,
                    true: `${storyTheme.mint}55`,
                  }}
                  thumbColor={
                    preferences.narrationEnabled
                      ? storyTheme.white
                      : storyTheme.navy
                  }
                />
              </View>
            </View>

            <SliderSetting
              iconLeft="volume-off"
              iconRight="volume-up"
              title={t("settings.voicedNarration")}
              description={t("settings.voicedNarrationDescription")}
              value={preferences.narrationVolume}
              valueLabel={`${Math.round(preferences.narrationVolume * 100)}%`}
              onChange={(value) =>
                void patchPreferences({ narrationVolume: value })
              }
            />

            <SliderSetting
              iconLeft="directions-walk"
              iconRight="directions-run"
              title={t("settings.narrationSpeed")}
              description={t("settings.narrationSpeedDescription")}
              value={preferences.narrationSpeed}
              valueLabel={`${preferences.narrationSpeed.toFixed(1)}x`}
              min={0.5}
              max={2}
              step={0.1}
              onChange={(value) =>
                void patchPreferences({
                  narrationSpeed: Number(value.toFixed(1)),
                })
              }
            />

            <SliderSetting
              iconLeft="timer-off"
              iconRight="timer"
              title={t("settings.narrationDelay")}
              description={t("settings.narrationDelayDescription")}
              value={preferences.narrationStartDelaySeconds}
              valueLabel={`${preferences.narrationStartDelaySeconds.toFixed(1)}s`}
              min={0}
              max={5}
              step={0.5}
              onChange={(value) =>
                void patchPreferences({
                  narrationStartDelaySeconds: Number(value.toFixed(1)),
                })
              }
            />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("settings.aiVoice")}</Text>
              <Text style={styles.sectionDescription}>
                {t("settings.aiVoiceDescription")}
              </Text>
              <View style={styles.voiceList}>
                <Pressable
                  onPress={() =>
                    void patchPreferences({ narrationVoiceIdentifier: null })
                  }
                  style={[
                    styles.voicePill,
                    !preferences.narrationVoiceIdentifier &&
                      styles.voicePillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.voicePillText,
                      !preferences.narrationVoiceIdentifier &&
                        styles.voicePillTextActive,
                    ]}
                  >
                    {t("settings.systemVoice")}
                  </Text>
                </Pressable>
                {voices
                  .filter((voice) =>
                    voice.language
                      ?.toLowerCase()
                      .startsWith(currentLanguage.toLowerCase()),
                  )
                  .slice(0, 6)
                  .map((voice) => {
                    const active =
                      preferences.narrationVoiceIdentifier === voice.identifier;

                    return (
                      <Pressable
                        key={voice.identifier}
                        onPress={() =>
                          void patchPreferences({
                            narrationVoiceIdentifier: voice.identifier,
                          })
                        }
                        style={[
                          styles.voicePill,
                          active && styles.voicePillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.voicePillText,
                            active && styles.voicePillTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {voice.name}
                        </Text>
                      </Pressable>
                    );
                  })}
              </View>
            </View>

            <SliderSetting
              iconLeft="volume-mute"
              iconRight="graphic-eq"
              title={t("settings.soundEffects")}
              description={t("settings.soundEffectsDescription")}
              value={preferences.soundEffectsVolume}
              valueLabel={`${Math.round(preferences.soundEffectsVolume * 100)}%`}
              onChange={(value) =>
                void patchPreferences({ soundEffectsVolume: value })
              }
            />

            <SliderSetting
              iconLeft="music-off"
              iconRight="music-note"
              title={t("settings.backgroundMusic")}
              description={t("settings.backgroundMusicDescription")}
              value={preferences.backgroundMusicVolume}
              valueLabel={`${Math.round(
                preferences.backgroundMusicVolume * 100,
              )}%`}
              onChange={(value) =>
                void patchPreferences({ backgroundMusicVolume: value })
              }
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20, 17, 12, 0.42)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: "92%",
    maxHeight: "92%",
    backgroundColor: storyTheme.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 8,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    color: storyTheme.ink,
    fontSize: 28,
    fontWeight: "900",
  },
  closeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: storyTheme.paperSoft,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 24,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    color: storyTheme.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  sectionDescription: {
    color: storyTheme.inkSoft,
    fontSize: 15,
    lineHeight: 24,
  },
  languageRow: {
    flexDirection: "row",
    gap: 10,
  },
  languagePill: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: storyTheme.line,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: storyTheme.paperSoft,
  },
  languagePillActive: {
    backgroundColor: storyTheme.navy,
    borderColor: storyTheme.navy,
  },
  languagePillText: {
    color: storyTheme.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  languagePillTextActive: {
    color: storyTheme.white,
  },
  playbackPanel: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playbackButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: storyTheme.line,
    backgroundColor: storyTheme.paperSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  playbackButtonPrimary: {
    backgroundColor: storyTheme.navy,
    borderColor: storyTheme.navy,
  },
  playbackButtonText: {
    color: storyTheme.navy,
    fontSize: 16,
    fontWeight: "900",
  },
  playbackButtonTextPrimary: {
    color: storyTheme.white,
  },
  playbackIconButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: storyTheme.line,
    backgroundColor: storyTheme.paperSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleRow: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: storyTheme.line,
    backgroundColor: storyTheme.paperSoft,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  toggleCopy: {
    flex: 1,
    gap: 6,
  },
  toggleTitle: {
    color: storyTheme.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  toggleDescription: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 22,
  },
  sliderSection: {
    gap: 16,
  },
  sliderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  sliderCopy: {
    flex: 1,
    gap: 8,
  },
  sliderTitle: {
    color: storyTheme.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  sliderDescription: {
    color: storyTheme.inkSoft,
    fontSize: 15,
    lineHeight: 24,
  },
  sliderValue: {
    color: storyTheme.navy,
    fontSize: 18,
    fontWeight: "900",
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepButton: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  slider: {
    flex: 1,
    height: 44,
  },
  voiceList: {
    gap: 10,
  },
  voicePill: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: storyTheme.line,
    backgroundColor: storyTheme.paperSoft,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  voicePillActive: {
    backgroundColor: storyTheme.navy,
    borderColor: storyTheme.navy,
  },
  voicePillText: {
    color: storyTheme.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  voicePillTextActive: {
    color: storyTheme.white,
  },
});
