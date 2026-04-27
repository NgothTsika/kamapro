import { Stack } from "expo-router";
import { AuthProvider } from "@/lib/auth/auth-context";
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
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
