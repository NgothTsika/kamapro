import { Stack } from "expo-router";
import { AuthProvider } from "@/lib/auth/auth-context";
import { LocaleProvider } from "@/lib/auth/locale-context";
import "@/lib/i18n/config";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useEffect } from "react";
import "react-native-reanimated";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import {
  createRewardedAd,
  getRewardedAdTestId,
} from "@/lib/ads/google-mobile-ads";
import { AudioPreferencesProvider } from "@/lib/audio/audio-preferences-context";
import { ProfilePreferencesProvider } from "@/lib/profile/profile-preferences-context";
import { TabBarVisibilityProvider } from "@/components/navigation/tab-bar-visibility";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    void Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    }).catch(() => undefined);

    const testAdUnitId = getRewardedAdTestId();
    if (!testAdUnitId) {
      return;
    }

    const rewardedAd = createRewardedAd(testAdUnitId);
    if (!rewardedAd) {
      return;
    }

    rewardedAd.load();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <LocaleProvider>
        <AudioPreferencesProvider>
          <AuthProvider>
            <ProfilePreferencesProvider>
              <TabBarVisibilityProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="lessons"
                    options={{
                      presentation: "formSheet",
                      contentStyle: { backgroundColor: "transparent" },
                    }}
                  />
                </Stack>
                <StatusBar style="auto" />
              </TabBarVisibilityProvider>
            </ProfilePreferencesProvider>
          </AuthProvider>
        </AudioPreferencesProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
