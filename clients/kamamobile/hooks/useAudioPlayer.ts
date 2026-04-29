import { useState, useCallback, useRef, useEffect } from "react";
import * as Speech from "expo-speech";
import { useLocale } from "@/lib/auth/locale-context";
import { useAudioPreferences } from "@/lib/audio/audio-preferences-context";

export interface AudioSettings {
  rate: number;
  enabled: boolean;
  autoPlay: boolean;
  narrationVolume: number;
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
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const settings: AudioSettings = {
    rate: preferences.narrationSpeed,
    enabled: preferences.narrationEnabled,
    autoPlay: preferences.autoPlayNarration,
    narrationVolume: preferences.narrationVolume,
    soundEffectsVolume: preferences.soundEffectsVolume,
    backgroundMusicVolume: preferences.backgroundMusicVolume,
  };

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

  const speak = useCallback(
    async (text: string, onComplete?: () => void) => {
      if (!settings.enabled) {
        onComplete?.();
        return;
      }

      try {
        setError(null);
        currentTextRef.current = text;
        setPlayState((prev) => ({
          ...prev,
          isPlaying: true,
          isPaused: false,
          isSpeaking: true,
          duration: estimateDuration(text, settings.rate),
          currentPosition: 0,
        }));

        // Start position update interval
        if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);

        updateIntervalRef.current = setInterval(() => {
          setPlayState((prev) => {
            const newPosition = prev.currentPosition + 100;
            if (newPosition >= prev.duration) {
              if (updateIntervalRef.current) {
                clearInterval(updateIntervalRef.current);
              }
              updateIntervalRef.current = null;
              onComplete?.();
              return {
                ...prev,
                isPlaying: false,
                isPaused: false,
                isSpeaking: false,
                currentPosition: prev.duration,
              };
            }
            return {
              ...prev,
              currentPosition: newPosition,
            };
          });
        }, 100);

        Speech.speak(text, {
          language: getLocaleForLanguage(currentLanguage),
          pitch: 1,
          rate: settings.rate,
          volume: settings.narrationVolume,
          onDone: () => {
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
    [settings, currentLanguage, getLocaleForLanguage, estimateDuration],
  );

  const pause = useCallback(() => {
    void Speech.stop();
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    setPlayState((prev) => ({
      ...prev,
      isPlaying: false,
      isPaused: true,
      isSpeaking: false,
    }));
  }, []);

  const resume = useCallback(() => {
    if (currentTextRef.current) {
      speak(currentTextRef.current);
    }
  }, [speak]);

  const stop = useCallback(() => {
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
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    const nextPreferences = Object.fromEntries(
      Object.entries({
        narrationSpeed: newSettings.rate,
        narrationEnabled: newSettings.enabled,
        autoPlayNarration: newSettings.autoPlay,
        narrationVolume: newSettings.narrationVolume,
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
