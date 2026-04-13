import { useAuth } from "@/lib/auth/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { Pressable, Text, View } from "react-native";

export default function ProfileScreen() {
  const { user, signOut, isLoading } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 56,
        paddingHorizontal: 16,
        gap: 12,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: "700" }}>
        Profile
      </Text>

      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 14,
          gap: 4,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "700" }}>
          {user?.username ?? "Guest"}
        </Text>
        <Text style={{ color: colors.textSecondary }}>
          {user?.email ?? "No email"}
        </Text>
        <Text style={{ color: colors.textSecondary }}>XP: {user?.xp ?? 0}</Text>
        <Text style={{ color: colors.textSecondary }}>
          Streak: {user?.streak ?? 0}
        </Text>
      </View>

      <Pressable
        onPress={signOut}
        disabled={isLoading}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 10,
          alignItems: "center",
          paddingVertical: 12,
        }}
      >
        <Text style={{ color: colors.background, fontWeight: "700" }}>
          {isLoading ? "Please wait..." : "Sign Out"}
        </Text>
      </Pressable>
    </View>
  );
}
