import {
  getCharacterCollections,
  getCategories,
  getDashboard,
  getTopics,
  getCharacters,
  type Category,
  type Character,
  type Topic,
  type CharacterCollection,
} from "@/lib/api";
import { getInProgressLessons } from "@/lib/api/progress";
import { useAuth } from "@/lib/auth/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Text,
  View,
  ScrollView,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CollectionCard } from "@/components/CollectionCard";
import { DiveRightBackSection } from "@/components/DiveRightBackSection";
import { ExploreByCategorySection } from "@/components/ExploreByCategorySection";
import { ViewAllStoriesSection } from "@/components/ViewAllStoriesSection";
import type { LessonProgressDetail } from "@/lib/api/progress";

export default function HomeScreen() {
  const { token, user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [hearts, setHearts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [collections, setCollections] = useState<CharacterCollection[]>([]);
  const [inProgressLessons, setInProgressLessons] = useState<
    LessonProgressDetail[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);

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
          // Provide mock data for development
          console.log(
            "Using mock collections data due to API error (this is temporary)",
          );
          setCollections([
            {
              id: "mock-1",
              name: "The Hundred Years' War",
              description:
                "England vs. France; a century of war, plague, and transformation",
              coverImage: null,
              order: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              characterCount: 3,
            },
            {
              id: "mock-2",
              name: "Napoleon Bonaparte",
              description: "The rise and fall of a military genius",
              coverImage: null,
              order: 2,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              characterCount: 2,
            },
            {
              id: "mock-3",
              name: "Gandhi",
              description: "The father of non-violent resistance",
              coverImage: null,
              order: 3,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              characterCount: 2,
            },
          ]);
        }

        try {
          console.log("Fetching categories...");
          const categoryItems = await getCategories();
          console.log("Categories fetched successfully:", categoryItems);
          setCategories(categoryItems);
        } catch (err) {
          console.error("Categories fetch failed:", err);
          // Continue with empty categories
          setCategories([]);
        }

        try {
          console.log("Fetching in progress lessons...");
          const progressLessons = await getInProgressLessons(token);
          console.log(
            "Progress lessons fetched successfully:",
            progressLessons,
          );
          setInProgressLessons(progressLessons.slice(0, 5));
        } catch (err) {
          console.error("Progress lessons fetch failed:", err);
          // Continue with empty lessons
          setInProgressLessons([]);
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

            {/* Section Title Helper */}
            {collections.length > 0 && (
              <View style={{ marginBottom: 8, paddingHorizontal: 16 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "700",
                    letterSpacing: -0.3,
                  }}
                >
                  Featured
                </Text>
              </View>
            )}

            {/* Section 1: First Collection */}
            {collections.length > 0 && (
              <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
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

            {/* Section 2: Dive Right Back (In Progress Lessons) */}
            {inProgressLessons.length > 0 && (
              <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "700",
                    letterSpacing: -0.3,
                    marginBottom: 12,
                  }}
                >
                  Dive Right Back In
                </Text>
                <DiveRightBackSection
                  lessons={inProgressLessons.map((progress) => ({
                    id: progress.lesson.id,
                    slug: progress.lesson.slug,
                    title: progress.lesson.title,
                    description: progress.lesson.description,
                    hook: progress.lesson.description,
                    coverImage: progress.lesson.coverImage,
                    xpReward: progress.lesson.xpReward,
                  }))}
                  colorScheme={colorScheme}
                  onLessonPress={(id) => {
                    console.log("View lesson:", id);
                  }}
                />
              </View>
            )}

            {/* Section 3: Additional Collections */}
            {collections.slice(1).length > 0 && (
              <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "700",
                    letterSpacing: -0.3,
                    marginBottom: 12,
                  }}
                >
                  Most Popular
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {collections.slice(1).map((collection, index) => (
                    <View
                      key={collection.id}
                      style={{
                        marginRight: index === collections.length - 2 ? 0 : 12,
                      }}
                    >
                      <View
                        style={{
                          width: 160,
                          height: 220,
                          borderRadius: 20,
                          backgroundColor: colors.card,
                          overflow: "hidden",
                          borderWidth: 1,
                          borderColor: colors.border,
                          shadowColor: colors.text,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.12,
                          shadowRadius: 12,
                          elevation: 5,
                        }}
                      >
                        {collection.coverImage ? (
                          <ImageBackground
                            source={{ uri: collection.coverImage }}
                            style={{ flex: 1, justifyContent: "flex-end" }}
                            imageStyle={{ borderRadius: 20 }}
                          >
                            <View
                              style={{
                                backgroundColor: "rgba(0, 0, 0, 0.6)",
                                paddingHorizontal: 12,
                                paddingVertical: 12,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#ffffff",
                                  fontSize: 13,
                                  fontWeight: "700",
                                  letterSpacing: -0.2,
                                }}
                                numberOfLines={2}
                              >
                                {collection.name}
                              </Text>
                            </View>
                          </ImageBackground>
                        ) : (
                          <View
                            style={{
                              flex: 1,
                              justifyContent: "center",
                              alignItems: "center",
                              backgroundColor: colors.surface,
                            }}
                          >
                            <MaterialCommunityIcons
                              name="book"
                              color={colors.accent}
                              size={40}
                            />
                            <Text
                              style={{
                                color: colors.text,
                                fontSize: 12,
                                fontWeight: "600",
                                marginTop: 8,
                                textAlign: "center",
                                paddingHorizontal: 8,
                              }}
                              numberOfLines={2}
                            >
                              {collection.name}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Section 4: Explore by Category */}
            {categories.length > 0 && (
              <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "700",
                    letterSpacing: -0.3,
                    marginBottom: 12,
                  }}
                >
                  Explore by Category
                </Text>
                <ExploreByCategorySection
                  categories={categories}
                  colorScheme={colorScheme}
                  onCategoryPress={(id) => {
                    console.log("View category:", id);
                  }}
                />
              </View>
            )}

            {/* Section 5: Trending */}
            {collections.length > 0 && (
              <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "700",
                    letterSpacing: -0.3,
                    marginBottom: 12,
                  }}
                >
                  Trending Right Now
                </Text>
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 20,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: colors.border,
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    elevation: 5,
                  }}
                >
                  {collections[0]?.coverImage ? (
                    <ImageBackground
                      source={{ uri: collections[0].coverImage }}
                      style={{ height: 300, justifyContent: "flex-end" }}
                      imageStyle={{ opacity: 0.4 }}
                    >
                      <View
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                          paddingHorizontal: 16,
                          paddingVertical: 16,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 13,
                            fontWeight: "600",
                            marginBottom: 6,
                          }}
                        >
                          The Life of an American Icon
                        </Text>
                        <Text
                          style={{
                            color: "#ffffff",
                            fontSize: 20,
                            fontWeight: "800",
                            letterSpacing: -0.3,
                          }}
                        >
                          {collections[0]?.name}
                        </Text>
                      </View>
                    </ImageBackground>
                  ) : (
                    <View
                      style={{
                        height: 300,
                        backgroundColor: colors.surface,
                        justifyContent: "flex-end",
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 13,
                          fontWeight: "600",
                          marginBottom: 6,
                        }}
                      >
                        Featured
                      </Text>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 20,
                          fontWeight: "800",
                          letterSpacing: -0.3,
                        }}
                      >
                        {collections[0]?.name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Section 6: View All Stories */}
            <View style={{ marginHorizontal: 16 }}>
              <ViewAllStoriesSection
                colorScheme={colorScheme}
                onPress={() => {
                  console.log("View all stories");
                }}
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
