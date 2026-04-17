import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 16,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 28,
              fontWeight: "800",
              letterSpacing: -0.5,
            }}
          >
            Create Account
          </Text>
          <Text
            style={{
              color: colors.accent,
              fontSize: 14,
              fontWeight: "500",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Join the journey of African legends
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Register Coming Soon
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: "500",
              lineHeight: 24,
            }}
          >
            Registration features are being prepared. Use the login screen to
            access your account.
          </Text>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
            marginTop: 32,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: "700",
              letterSpacing: -0.2,
            }}
          >
            Back to Login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
