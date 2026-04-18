import { useAuth } from "@/lib/auth/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  getDashboard,
  getCharacterCollections,
  getCharacterCollection,
  getCharacters,
  type CharacterCollection,
  type Character,
} from "@/lib";
import { CollectionCard } from "@/components/CollectionCard";
import { CharacterCard } from "@/components/CharacterCard";
import { TrendingSection } from "@/components/TrendingSection";
import { NewCharacterSection } from "@/components/NewCharacterSection";
import { ViewAllCharactersSection } from "@/components/ViewAllCharactersSection";

export default function HomeScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [hearts, setHearts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [collections, setCollections] = useState<CharacterCollection[]>([]);
  const [trendingCharacters, setTrendingCharacters] = useState<Character[]>([]);
  const [newCharacters, setNewCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);

  type FlatListItem =
    | { type: "collection"; data: CharacterCollection }
    | { type: "trending"; sectionIndex: number }
    | { type: "new"; sectionIndex: number }
    | { type: "viewAll" }
    | { type: "empty" };

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

        // Fetch character collections and sort by order
        try {
          const allCollections = await getCharacterCollections();
          const sortedCollections = allCollections.sort(
            (a, b) => a.order - b.order,
          );

          // Fetch full details (including characters) for each collection
          const collectionsWithCharacters = await Promise.all(
            sortedCollections.map(async (collection) => {
              try {
                return await getCharacterCollection(collection.id);
              } catch (err) {
                console.warn(
                  `Failed to load characters for collection ${collection.id}:`,
                  err,
                );
                // Return collection without characters if detail fetch fails
                return collection;
              }
            }),
          );

          setCollections(collectionsWithCharacters);
          console.log(
            "Collections loaded with characters:",
            collectionsWithCharacters,
          );
        } catch (err) {
          console.error("Failed to load collections:", err);
          setCollections([]);
        }

        // Fetch trending characters (first 10 characters)
        try {
          const allCharacters = await getCharacters();
          setTrendingCharacters(allCharacters.slice(0, 10));
          // New characters are the latest ones (reverse order, last 10 added)
          setNewCharacters(allCharacters.slice(-10).reverse());
          console.log(
            "Trending characters loaded:",
            allCharacters.slice(0, 10),
          );
          console.log(
            "New characters loaded:",
            allCharacters.slice(-10).reverse(),
          );
        } catch (err) {
          console.error("Failed to load trending/new characters:", err);
          setTrendingCharacters([]);
          setNewCharacters([]);
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

  // Build structured data: new character, collection[0], trending character, collection[1-5], view all
  const flatListData = useMemo(() => {
    if (collections.length === 0) {
      return [{ type: "empty" as const }];
    }

    const data: FlatListItem[] = [];

    // Section 1: New Character
    if (newCharacters.length > 0) {
      data.push({ type: "new", sectionIndex: 0 });
    }

    // Section 2: Collection [0]
    if (collections.length > 0) {
      data.push({ type: "collection", data: collections[0] });
    }

    // Section 3: Trending Character
    if (trendingCharacters.length > 0) {
      data.push({ type: "trending", sectionIndex: 0 });
    }

    // Sections 4-8: Collections [1-5] (max 5 collections total)
    const maxCollections = Math.min(collections.length, 6);
    for (let i = 1; i < maxCollections; i++) {
      data.push({ type: "collection", data: collections[i] });
    }

    // Last Section: View All Characters
    data.push({ type: "viewAll" });

    return data;
  }, [collections, trendingCharacters, newCharacters]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <FlatList<FlatListItem>
        data={flatListData}
        keyExtractor={(item, index) => {
          if (item.type === "collection") {
            return `collection-${item.data.id}`;
          }
          if (item.type === "trending") {
            return `trending-${item.sectionIndex}`;
          }
          if (item.type === "new") {
            return `new-${item.sectionIndex}`;
          }
          if (item.type === "viewAll") {
            return "viewAll";
          }
          return "empty";
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={collections.length > 0}
        ListHeaderComponent={
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

            {/* Collections Section Header */}
          </View>
        }
        renderItem={({ item }) => {
          // Show empty state if no collections
          if (item.type === "empty") {
            return (
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 24,
                  alignItems: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="inbox-multiple"
                  color={colors.accent}
                  size={48}
                />
                <Text
                  style={{
                    color: colors.accent,
                    fontSize: 14,
                    fontWeight: "500",
                    marginTop: 12,
                  }}
                >
                  No collections available yet
                </Text>
              </View>
            );
          }

          // Show new characters section
          if (item.type === "new") {
            const character = newCharacters[item.sectionIndex];

            if (!character) {
              return null;
            }

            return (
              <NewCharacterSection
                character={character}
                colorScheme={colorScheme}
                onPress={() => {
                  console.log("View new character:", character.slug);
                  router.push(`/character-detail?slug=${character.slug}`);
                }}
              />
            );
          }
          // Show trending characters section
          if (item.type === "trending") {
            const character = trendingCharacters[item.sectionIndex];

            if (!character) {
              return null;
            }

            return (
              <TrendingSection
                character={character}
                colorScheme={colorScheme}
                onPress={() => {
                  console.log("View trending character:", character.slug);
                  router.push(`/character-detail?slug=${character.slug}`);
                }}
              />
            );
          }

          // Render collection card
          if (item.type === "collection") {
            const collection = item.data;
            return (
              <View style={{ marginBottom: 16 }}>
                <CollectionCard
                  collection={collection}
                  colorScheme={colorScheme}
                  onViewCollection={() => {
                    console.log("View collection:", collection.id);
                    // Navigation to collection detail can be added when route exists
                  }}
                  onCharacterPress={(character) => {
                    console.log("View character:", character.slug);
                    router.push(`/character-detail?slug=${character.slug}`);
                  }}
                />
              </View>
            );
          }

          // Show view all characters section
          if (item.type === "viewAll") {
            return (
              <ViewAllCharactersSection
                characters={trendingCharacters}
                colorScheme={colorScheme}
                totalCount={trendingCharacters.length + newCharacters.length}
                onPress={(character) => {
                  console.log("View character:", character.slug);
                  router.push(`/character-detail?slug=${character.slug}`);
                }}
              />
            );
          }

          return null;
        }}
      />
    </SafeAreaView>
  );
}
