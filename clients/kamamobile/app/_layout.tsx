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
import {
  createRewardedAd,
  getRewardedAdTestId,
} from "@/lib/ads/google-mobile-ads";
import { AudioPreferencesProvider } from "@/lib/audio/audio-preferences-context";
import { ProfilePreferencesProvider } from "@/lib/profile/profile-preferences-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
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
              <Stack screenOptions={{ headerShown: false }} />
              <StatusBar style="auto" />
            </ProfilePreferencesProvider>
          </AuthProvider>
        </AudioPreferencesProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
