import {
  getCharacterCollections,
  getCategories,
  getDashboard,
  getInProgressLessons,
  type Category,
  type Character,
  type Topic,
  type CharacterCollection,
  type LessonProgressDetail,
} from "@/lib";
import { useAuth } from "@/lib/auth/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CollectionCard } from "@/components/CollectionCard";

export default function HomeScreen() {
  const { token, user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [hearts, setHearts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [collections, setCollections] = useState<CharacterCollection[]>([]);

  useEffect(() => {
    async function load() {
      if (!token) {
        console.log("No token, skipping home data load");
        return;
      }
      try {
        console.log("Starting to fetch home data...");

        // Fetch data sequentially with better error tracking
        try {
          console.log("Fetching dashboard...");
          const dashboardData = await getDashboard(token);
          console.log("Dashboard fetched successfully:", dashboardData);
          setHearts(dashboardData.hearts.hearts);
          setStreak(dashboardData.streak.currentStreak);
        } catch (err) {
          console.error("Dashboard fetch failed:", err);
          // Continue with default values
          setHearts(0);
          setStreak(0);
        }

        try {
          console.log("Fetching character collections...");
          const collectionItems = await getCharacterCollections();
          console.log("Collections fetched successfully:", collectionItems);
          setCollections(collectionItems);
        } catch (err) {
          console.error("Collections fetch failed:", err);
          // Continue with empty collections - don't use mock data
          setCollections([]);
        }
        console.log("State updated with fetched data");
      } catch (error) {
        console.error("Unexpected error loading home data:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
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
            {collections.length > 0 && (
              <View>
                <CollectionCard
                  collection={collections[0]}
                  colorScheme={colorScheme}
                  onViewCollection={(id) => {
                    console.log("View collection:", id);
                  }}
                  onCharacterPress={(id) => {
                    console.log("View character:", id);
                  }}
                />
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}
