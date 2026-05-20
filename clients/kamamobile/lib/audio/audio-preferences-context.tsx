import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type AudioPreferences = {
  narrationEnabled: boolean;
  autoPlayNarration: boolean;
  narrationVolume: number;
  narrationSpeed: number;
  narrationStartDelaySeconds: number;
  narrationVoiceIdentifier: string | null;
  soundEffectsVolume: number;
  backgroundMusicVolume: number;
};

type AudioPreferencesContextValue = {
  preferences: AudioPreferences;
  isInitialized: boolean;
  updatePreferences: (next: Partial<AudioPreferences>) => Promise<void>;
};

const AUDIO_PREFERENCES_STORAGE_KEY = "kama_audio_preferences";

export const defaultAudioPreferences: AudioPreferences = {
  narrationEnabled: true,
  autoPlayNarration: true,
  narrationVolume: 1,
  narrationSpeed: 1,
  narrationStartDelaySeconds: 2,
  narrationVoiceIdentifier: null,
  soundEffectsVolume: 0.4,
  backgroundMusicVolume: 0.25,
};

const AudioPreferencesContext =
  createContext<AudioPreferencesContextValue | null>(null);

export function AudioPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<AudioPreferences>(
    defaultAudioPreferences,
  );
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initializePreferences() {
      try {
        const storedValue = await AsyncStorage.getItem(
          AUDIO_PREFERENCES_STORAGE_KEY,
        );

        if (!storedValue) {
          setIsInitialized(true);
          return;
        }

        const parsed = JSON.parse(storedValue) as Partial<AudioPreferences>;
        setPreferences((current) => ({
          ...current,
          ...parsed,
        }));
      } catch (error) {
        console.error("Failed to load audio preferences:", error);
      } finally {
        setIsInitialized(true);
      }
    }

    void initializePreferences();
  }, []);

  async function updatePreferences(next: Partial<AudioPreferences>) {
    let merged: AudioPreferences = defaultAudioPreferences;

    setPreferences((current) => {
      merged = {
        ...current,
        ...next,
      };

      return merged;
    });

    try {
      await AsyncStorage.setItem(
        AUDIO_PREFERENCES_STORAGE_KEY,
        JSON.stringify(merged),
      );
    } catch (error) {
      console.error("Failed to save audio preferences:", error);
    }
  }

  return (
    <AudioPreferencesContext.Provider
      value={{
        preferences,
        isInitialized,
        updatePreferences,
      }}
    >
      {children}
    </AudioPreferencesContext.Provider>
  );
}

export function useAudioPreferences() {
  const context = useContext(AudioPreferencesContext);

  if (!context) {
    throw new Error(
      "useAudioPreferences must be used within AudioPreferencesProvider",
    );
  }

  return context;
}
