import { useAuth } from "@/lib/auth/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getDashboard } from "@/lib";

export default function HomeScreen() {
  const { token, user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [hearts, setHearts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token) {
        console.log("No token, skipping home data load");
        return;
      }

      try {
        setLoading(true);
        console.log("Starting to fetch home data...");

        // Fetch dashboard
        try {
          const dashboardData = await getDashboard(token);
          setHearts(dashboardData.hearts.hearts);
          setStreak(dashboardData.streak.currentStreak);
        } catch (err) {
          setHearts(0);
          setStreak(0);
        }
        console.log("Home data load complete");
      } catch (error) {
        console.error("Unexpected error loading home data:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  const headerName = useMemo(
    () => user?.username ?? "Explorer",
    [user?.username],
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <FlatList
        data={[{ id: "main" }]}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={() => (
          <View style={{ paddingBottom: 20 }}>
            {/* Header Section with Stats */}
            <View
              style={{
                paddingHorizontal: 16,
                gap: 12,
                marginBottom: 24,
                marginTop: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 22,
                      fontWeight: "800",
                      letterSpacing: -0.5,
                    }}
                  >
                    Hello, {headerName}
                  </Text>
                  <Text
                    style={{
                      color: colors.accent,
                      fontSize: 13,
                      fontWeight: "500",
                      marginTop: 4,
                    }}
                  >
                    Wisdom of African legends
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 6,
                      alignItems: "center",
                      paddingVertical: 8,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="heart"
                      color={colors.heart}
                      size={18}
                    />
                    <Text style={{ color: colors.text, fontWeight: "600" }}>
                      {hearts}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 6,
                      alignItems: "center",
                      paddingVertical: 8,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="fire"
                      color={colors.fire}
                      size={18}
                    />
                    <Text style={{ color: colors.text, fontWeight: "600" }}>
                      {streak}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Section 1: Featured Collection */}
          </View>
        )}
      />
    </SafeAreaView>
  );
}
