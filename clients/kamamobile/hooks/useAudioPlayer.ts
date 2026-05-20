import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import * as Speech from "expo-speech";
import { useLocale } from "@/lib/auth/locale-context";
import { useAudioPreferences } from "@/lib/audio/audio-preferences-context";

export interface AudioSettings {
  rate: number;
  enabled: boolean;
  autoPlay: boolean;
  narrationVolume: number;
  startDelaySeconds: number;
  voiceIdentifier: string | null;
  soundEffectsVolume: number;
  backgroundMusicVolume: number;
}

export interface AudioPlayState {
  isPlaying: boolean;
  isPaused: boolean;
  duration: number;
  currentPosition: number;
  isSpeaking: boolean;
}

export function useAudioPlayer() {
  const { currentLanguage } = useLocale();
  const { preferences, updatePreferences } = useAudioPreferences();
  const [playState, setPlayState] = useState<AudioPlayState>({
    isPlaying: false,
    isPaused: false,
    duration: 0,
    currentPosition: 0,
    isSpeaking: false,
  });
  const [error, setError] = useState<string | null>(null);

  const currentTextRef = useRef<string>("");
  const currentOnCompleteRef = useRef<(() => void) | undefined>(undefined);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bestVoiceCacheRef = useRef<Record<string, string | null>>({});
  const activeSpeechIdRef = useRef(0);
  const restartSpeechRef = useRef(false);

  const settings: AudioSettings = useMemo(
    () => ({
      rate: preferences.narrationSpeed,
      enabled: preferences.narrationEnabled,
      autoPlay: preferences.autoPlayNarration,
      narrationVolume: preferences.narrationVolume,
      startDelaySeconds: preferences.narrationStartDelaySeconds,
      voiceIdentifier: preferences.narrationVoiceIdentifier,
      soundEffectsVolume: preferences.soundEffectsVolume,
      backgroundMusicVolume: preferences.backgroundMusicVolume,
    }),
    [
      preferences.autoPlayNarration,
      preferences.backgroundMusicVolume,
      preferences.narrationEnabled,
      preferences.narrationSpeed,
      preferences.narrationStartDelaySeconds,
      preferences.narrationVoiceIdentifier,
      preferences.narrationVolume,
      preferences.soundEffectsVolume,
    ],
  );
  const settingsRef = useRef<AudioSettings>(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Language to locale mapping for TTS
  const getLocaleForLanguage = useCallback((lang: string): string => {
    const localeMap: Record<string, string> = {
      en: "en-US",
      fr: "fr-FR",
      es: "es-ES",
      de: "de-DE",
      it: "it-IT",
      pt: "pt-BR",
    };
    return localeMap[lang] || "en-US";
  }, []);

  const estimateDuration = useCallback((text: string, rate: number): number => {
    // Rough estimation: average speaking rate is 150 words per minute
    // At rate 1.0 = 150 wpm, so we adjust based on rate
    const words = text.split(/\s+/).length;
    const baseRate = 150;
    const adjustedRate = baseRate * rate;
    const minutes = words / adjustedRate;
    return Math.ceil(minutes * 60 * 1000); // Convert to milliseconds
  }, []);

  const getBestInstalledVoice = useCallback(
    async (locale: string): Promise<string | undefined> => {
      const preferredVoice = settingsRef.current?.voiceIdentifier;
      if (preferredVoice) return preferredVoice;

      const cached = bestVoiceCacheRef.current[locale];
      if (cached !== undefined) return cached ?? undefined;

      try {
        const voices = await Speech.getAvailableVoicesAsync();
        const localeLower = locale.toLowerCase();
        const languageLower = localeLower.split("-")[0];
        const matchingVoices = voices.filter((voice) => {
          const voiceLanguage = voice.language?.toLowerCase() ?? "";
          return (
            voiceLanguage === localeLower ||
            voiceLanguage.startsWith(`${languageLower}-`)
          );
        });

        const scoreVoice = (voice: Speech.Voice) => {
          const name = voice.name.toLowerCase();
          const identifier = voice.identifier.toLowerCase();
          const quality = String(voice.quality).toLowerCase();
          const isEnhanced =
            quality === "enhanced" ||
            quality === "premium" ||
            identifier.includes("premium") ||
            identifier.includes("enhanced") ||
            identifier.includes("neural");
          const isExactLocale = voice.language?.toLowerCase() === localeLower;
          const isNaturalName =
            name.includes("siri") ||
            name.includes("samantha") ||
            name.includes("ava") ||
            name.includes("nicky") ||
            name.includes("aaron") ||
            name.includes("joelle") ||
            name.includes("allison") ||
            name.includes("susan") ||
            name.includes("victoria") ||
            name.includes("daniel") ||
            name.includes("serena") ||
            name.includes("karen") ||
            name.includes("tom") ||
            name.includes("moira") ||
            name.includes("amelie") ||
            name.includes("thomas") ||
            name.includes("audrey") ||
            name.includes("aurelie");
          const isCompact =
            name.includes("compact") ||
            identifier.includes("compact") ||
            identifier.includes("eloquence");
          const isNovelty =
            name.includes("novelty") ||
            name.includes("robot") ||
            name.includes("whisper") ||
            name.includes("zarvox") ||
            identifier.includes("novelty");

          return (
            (isExactLocale ? 40 : 0) +
            (isEnhanced ? 45 : 0) +
            (isNaturalName ? 20 : 0) -
            (isCompact ? 40 : 0) -
            (isNovelty ? 80 : 0)
          );
        };

        const bestVoice =
          matchingVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ??
          null;

        bestVoiceCacheRef.current[locale] = bestVoice?.identifier ?? null;
        return bestVoice?.identifier;
      } catch {
        bestVoiceCacheRef.current[locale] = null;
        return undefined;
      }
    },
    [],
  );

  const speak = useCallback(
    async (text: string, onComplete?: () => void) => {
      const activeSettings = settingsRef.current;

      if (!activeSettings.enabled) {
        onComplete?.();
        return;
      }

      try {
        await Speech.stop().catch(() => undefined);
        setError(null);
        currentTextRef.current = text;
        currentOnCompleteRef.current = onComplete;
        setPlayState((prev) => ({
          ...prev,
          isPlaying: true,
          isPaused: false,
          isSpeaking: true,
          duration: estimateDuration(text, activeSettings.rate),
          currentPosition: 0,
        }));

        // Start position update interval
        if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);

        updateIntervalRef.current = setInterval(() => {
          setPlayState((prev) => {
            const newPosition = prev.currentPosition + 100;
            if (newPosition >= prev.duration) {
              return {
                ...prev,
                currentPosition: prev.duration,
              };
            }
            return {
              ...prev,
              currentPosition: newPosition,
            };
          });
        }, 100);

        const locale = getLocaleForLanguage(currentLanguage);
        const voice = await getBestInstalledVoice(locale);

        const speechId = activeSpeechIdRef.current + 1;
        activeSpeechIdRef.current = speechId;

        Speech.speak(text, {
          language: locale,
          pitch: 1,
          rate: activeSettings.rate,
          volume: activeSettings.narrationVolume,
          voice,
          onDone: () => {
            if (activeSpeechIdRef.current !== speechId) return;

            if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
            setPlayState((prev) => ({
              ...prev,
              isPlaying: false,
              isPaused: false,
              isSpeaking: false,
              currentPosition: prev.duration,
            }));
            onComplete?.();
          },
          onError: (error) => {
            if (activeSpeechIdRef.current !== speechId) return;

            console.error("TTS Error:", error);
            setError(error?.message || "Audio playback failed");
            if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
            setPlayState((prev) => ({
              ...prev,
              isPlaying: false,
              isPaused: false,
              isSpeaking: false,
            }));
          },
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setPlayState((prev) => ({
          ...prev,
          isPlaying: false,
          isPaused: false,
          isSpeaking: false,
        }));
      }
    },
    [
      currentLanguage,
      getLocaleForLanguage,
      getBestInstalledVoice,
      estimateDuration,
    ],
  );

  const pause = useCallback(async () => {
    await Speech.pause().catch(async () => {
      await Speech.stop();
    });
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    setPlayState((prev) => ({
      ...prev,
      isPlaying: true,
      isPaused: true,
      isSpeaking: false,
    }));
  }, []);

  const resume = useCallback(async () => {
    if (!currentTextRef.current) return;

    await speak(currentTextRef.current, currentOnCompleteRef.current);
    setPlayState((prev) => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      isSpeaking: true,
    }));
  }, [speak]);

  const stop = useCallback(() => {
    activeSpeechIdRef.current += 1;
    void Speech.stop();
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    setPlayState({
      isPlaying: false,
      isPaused: false,
      isSpeaking: false,
      duration: 0,
      currentPosition: 0,
    });
    currentTextRef.current = "";
    currentOnCompleteRef.current = undefined;
  }, []);

  useEffect(() => {
    if (!playState.isPlaying || playState.isPaused || !currentTextRef.current) {
      return;
    }

    if (!settings.enabled) {
      const onComplete = currentOnCompleteRef.current;
      stop();
      onComplete?.();
      return;
    }

    if (restartSpeechRef.current) return;
    restartSpeechRef.current = true;
    activeSpeechIdRef.current += 1;

    void Speech.stop()
      .catch(() => undefined)
      .finally(() => {
        restartSpeechRef.current = false;
        if (!currentTextRef.current) return;
        void speak(currentTextRef.current, currentOnCompleteRef.current);
      });
  }, [
    currentLanguage,
    playState.isPaused,
    playState.isPlaying,
    settings.enabled,
    settings.narrationVolume,
    settings.rate,
    settings.voiceIdentifier,
    speak,
    stop,
  ]);

  const updateSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    const nextPreferences = Object.fromEntries(
      Object.entries({
        narrationSpeed: newSettings.rate,
        narrationEnabled: newSettings.enabled,
        autoPlayNarration: newSettings.autoPlay,
        narrationVolume: newSettings.narrationVolume,
        narrationStartDelaySeconds: newSettings.startDelaySeconds,
        narrationVoiceIdentifier: newSettings.voiceIdentifier,
        soundEffectsVolume: newSettings.soundEffectsVolume,
        backgroundMusicVolume: newSettings.backgroundMusicVolume,
      }).filter(([, value]) => value !== undefined),
    );

    void updatePreferences(nextPreferences);
  }, [updatePreferences]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
      void Speech.stop();
    };
  }, []);

  return {
    playState,
    settings,
    error,
    speak,
    pause,
    resume,
    stop,
    updateSettings,
    estimateDuration,
  };
}
