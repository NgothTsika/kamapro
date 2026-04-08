import { useAuth } from "@/lib/auth/auth-context";
import { Pressable, Text, View } from "react-native";

export default function ProfileScreen() {
  const { user, signOut, isLoading } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: "#121212", paddingTop: 56, paddingHorizontal: 16, gap: 12 }}>
      <Text style={{ color: "white", fontSize: 24, fontWeight: "700" }}>Profile</Text>

      <View style={{ backgroundColor: "#1f1f1f", borderRadius: 12, padding: 14, gap: 4 }}>
        <Text style={{ color: "white", fontWeight: "700" }}>{user?.username ?? "Guest"}</Text>
        <Text style={{ color: "#bdbdbd" }}>{user?.email ?? "No email"}</Text>
        <Text style={{ color: "#bdbdbd" }}>XP: {user?.xp ?? 0}</Text>
        <Text style={{ color: "#bdbdbd" }}>Streak: {user?.streak ?? 0}</Text>
      </View>

      <Pressable
        onPress={signOut}
        disabled={isLoading}
        style={{ backgroundColor: "#f8d568", borderRadius: 10, alignItems: "center", paddingVertical: 12 }}
      >
        <Text style={{ color: "#1a1a1a", fontWeight: "700" }}>{isLoading ? "Please wait..." : "Sign Out"}</Text>
      </Pressable>
    </View>
  );
}
