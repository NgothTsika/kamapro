import { useAuth } from "@/lib/auth/auth-context";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

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
    }, 1200);

    return () => clearTimeout(timer);
  }, [token, isBootstrapping]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#121212",
        gap: 14,
      }}
    >
      <Text style={{ fontSize: 36 }}>🛡️</Text>
      <Text style={{ color: "white", fontSize: 28, fontWeight: "700" }}>
        Kama Mobile
      </Text>
      <Text style={{ color: "#d9d9d9" }}>African stories. Legendary minds.</Text>
      <ActivityIndicator color="#f8d568" />
    </View>
  );
}
