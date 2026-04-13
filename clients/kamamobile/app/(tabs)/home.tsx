import {
  getCharacters,
  getCategories,
  getDashboard,
  getTopics,
  type Category,
  type Character,
  type Topic,
} from "@/lib/api";
import { useAuth } from "@/lib/auth/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  Text,
  View,
  Pressable,
  ImageBackground,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CategoryCard } from "@/components/CategoryCard";

export default function HomeScreen() {
  const { token, user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [hearts, setHearts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function load() {
      if (!token) {
        console.log("No token, skipping home data load");
        return;
      }
      try {
        console.log("Starting to fetch home data...");
        const categoryItems = await getCategories();
        if (categoryItems && categoryItems.length > 0) {
          console.log("First category:", categoryItems[0]);
        }
        const [dashboard, topicItems, characterItems] = await Promise.all([
          getDashboard(token),
          getTopics(),
          getCharacters(),
        ]);
        setHearts(dashboard.hearts.hearts);
        setStreak(dashboard.streak.currentStreak);
        setTopics(topicItems.slice(0, 8));
        setCharacters(characterItems.slice(0, 8));
        setCategories(categoryItems);
        console.log("State updated with fetched data");
      } catch (error) {
        console.error("Error loading home data:", error);
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
        data={[{ id: "main" }]} // Dummy data for main scrollable list
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={() => (
          <View style={{ paddingBottom: 20 }}>
            {/* Header Section */}
            <View
              style={{
                paddingHorizontal: 16,
                gap: 6,
                marginBottom: 20,
                marginTop: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 24,
                    fontWeight: "700",
                  }}
                >
                  Hello, {headerName}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 6,
                      alignItems: "center",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="heart"
                      color={colors.heart}
                      size={20}
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
                    }}
                  >
                    <MaterialCommunityIcons
                      name="fire"
                      color={colors.fire}
                      size={20}
                    />
                    <Text style={{ color: colors.text, fontWeight: "600" }}>
                      {streak}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={{ color: colors.accent }}>
                Wisdom of African legends lives here.
              </Text>
            </View>

            {/* Categories Section */}
            <View>
              <View
                style={{
                  flexDirection: "column",
                  paddingHorizontal: 16,
                  gap: 4,
                  marginBottom: 15,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 20,
                    fontWeight: "700",
                  }}
                >
                  Explore.
                </Text>
              </View>

              <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                horizontal
                scrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                renderItem={({ item }) => (
                  <CategoryCard
                    id={item.id}
                    name={item.name}
                    coverImage={item.coverImage}
                    lessonCount={item.lessonCount}
                    characterCount={item.characterCount}
                    totalChapters={item.totalChapters}
                    onPress={() => {
                      // Navigate to category detail page when available
                    }}
                  />
                )}
              />
            </View>

            {/* Most Popular Characters Section */}
            <View style={{ marginTop: 24 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "700",
                  paddingHorizontal: 16,
                  marginBottom: 12,
                }}
              >
                Most Popular Characters
              </Text>

              <FlatList
                data={characters}
                keyExtractor={(item) => item.id}
                horizontal
                scrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                renderItem={({ item }) => (
                  <Pressable
                    style={{
                      width: 120,
                      borderRadius: 12,
                      overflow: "hidden",
                      gap: 8,
                    }}
                  >
                    <ImageBackground
                      source={{
                        uri:
                          item.imageUrl ||
                          "https://via.placeholder.com/120x140",
                      }}
                      style={{
                        width: "100%",
                        height: 140,
                        justifyContent: "flex-end",
                      }}
                      imageStyle={{ opacity: 0.8 }}
                    >
                      <View
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                          padding: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontSize: 13,
                            fontWeight: "700",
                            textAlign: "center",
                          }}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                      </View>
                    </ImageBackground>
                  </Pressable>
                )}
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
