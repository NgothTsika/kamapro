import { useAuth } from "@/lib/auth/auth-context";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

const blueLogo = require("../assets/KamaGame/Blue/android/playstore-icon.png");

export default function Index() {
  const { token, isBootstrapping } = useAuth();

  useEffect(() => {
    if (isBootstrapping) return;

    const timer = setTimeout(() => {
      if (token) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/(auth)/login");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [token, isBootstrapping]);

  return (
    <View style={styles.screen}>
      <View style={styles.sunGlow} />
      <View style={styles.blueGlow} />

      <View style={styles.container}>
        <View style={styles.logoShell}>
          <Image source={blueLogo} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.appName}>kama</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Mukozi.tech</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7eddc",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sunGlow: {
    position: "absolute",
    top: 80,
    right: -30,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#dd9a3f",
    opacity: 0.18,
  },
  blueGlow: {
    position: "absolute",
    bottom: 60,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#2a5a91",
    opacity: 0.16,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 16,
  },
  logoShell: {
    width: 122,
    height: 122,
    borderRadius: 32,
    backgroundColor: "#18375d",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#17304f",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  appName: {
    color: "#21314f",
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    alignItems: "center",
  },
  footerText: {
    color: "#637189",
    fontSize: 16,
    fontWeight: "600",
  },
});
