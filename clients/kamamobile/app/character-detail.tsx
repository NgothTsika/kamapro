import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Pressable,
  useColorScheme,
  Share,
  ImageBackground,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColorScheme as useColorSchemeHook } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { getCharacterBySlug, type Character } from "@/lib";

const HEADER_IMAGE_HEIGHT = 450;
const BACKGROUND_IMAGE = require("@/assets/images/background.png");

interface CharacterDetail extends Character {
  story?: string;
  categories?: Array<{
    category: {
      id: string;
      slug: string;
      name: string;
    };
  }>;
  unlockLesson?: {
    id: string;
    slug: string;
  };
}

export default function CharacterDetailPage() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colorScheme = useColorSchemeHook() ?? "light";
  const palette = Colors[colorScheme];

  const [character, setCharacter] = useState<CharacterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Animated scroll setup
  const scrollY = useSharedValue(0);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    async function loadCharacter() {
      if (!slug) {
        setError("No character specified");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getCharacterBySlug(slug);
        setCharacter(data);
      } catch (err) {
        console.error("Failed to load character:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load character",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCharacter();
  }, [slug]);

  // Parallax animations
  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-HEADER_IMAGE_HEIGHT, 0, HEADER_IMAGE_HEIGHT],
          [-HEADER_IMAGE_HEIGHT / 2, 0, HEADER_IMAGE_HEIGHT * 0.75],
        ),
      },
      {
        scale: interpolate(
          scrollY.value,
          [-HEADER_IMAGE_HEIGHT, 0, HEADER_IMAGE_HEIGHT],
          [2, 1, 1],
        ),
      },
    ],
  }));

  const headerOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, HEADER_IMAGE_HEIGHT * 0.6, HEADER_IMAGE_HEIGHT],
      [0, 0.5, 1],
    ),
  }));

  const getRarityColor = (rarity?: string | null): string => {
    switch (rarity?.toLowerCase()) {
      case "common":
        return "#6b7280";
      case "uncommon":
        return "#10b981";
      case "rare":
        return "#3b82f6";
      case "epic":
        return "#8b5cf6";
      case "legendary":
        return "#f59e0b";
      default:
        return "#9ca3af";
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: palette.background }]}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !character) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: palette.background }]}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <MaterialCommunityIcons
            name="alert-circle"
            size={56}
            color={palette.accent}
          />
          <Text
            style={[
              styles.errorTitle,
              { color: palette.text, marginTop: 16, marginBottom: 8 },
            ]}
          >
            Oops!
          </Text>
          <Text
            style={[
              styles.errorText,
              { color: palette.textSecondary, marginBottom: 24 },
            ]}
          >
            {error || "Could not load character details"}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.retryButton,
              {
                backgroundColor: palette.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.retryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const dynamicStyles = getStyles(palette, isDark);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header Overlay */}
      <View style={dynamicStyles.headerOverlay} pointerEvents="box-none">
        <Animated.View
          style={[dynamicStyles.headerBackground, headerOpacity]}
        />
        <View style={dynamicStyles.headerContent}>
          <Pressable
            style={dynamicStyles.headerIconButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              size={24}
              name="chevron-left"
              color={palette.primary}
            />
          </Pressable>
          <View style={dynamicStyles.headerRightActions}>
            <Pressable
              style={dynamicStyles.headerIconButton}
              onPress={() => setIsFavorite((v) => !v)}
            >
              <MaterialCommunityIcons
                name={isFavorite ? "heart" : "heart-outline"}
                size={22}
                color={isFavorite ? "#FF3B30" : palette.text}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header Image with Parallax */}
        <View
          style={[
            dynamicStyles.imageContainer,
            { height: HEADER_IMAGE_HEIGHT },
          ]}
        >
          <Animated.Image
            source={
              character.imageUrl
                ? { uri: character.imageUrl }
                : BACKGROUND_IMAGE
            }
            style={[dynamicStyles.eventImage, imageAnimatedStyle]}
            resizeMode="cover"
          />
        </View>

        {/* Rounded Content Section */}
        <View style={dynamicStyles.contentWrapper}>
          <View style={dynamicStyles.content}>
            {/* Character Name */}
            <Text style={[dynamicStyles.title, { color: palette.text }]}>
              {character.name}
            </Text>

            {/* Rarity Badge */}
            {character.rarityLevel && (
              <View
                style={[
                  dynamicStyles.rarityBadge,
                  {
                    backgroundColor:
                      getRarityColor(character.rarityLevel) + "20",
                    borderColor: getRarityColor(character.rarityLevel),
                  },
                ]}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: getRarityColor(character.rarityLevel),
                    marginRight: 8,
                  }}
                />
                <Text
                  style={[
                    dynamicStyles.rarityText,
                    {
                      color: getRarityColor(character.rarityLevel),
                    },
                  ]}
                >
                  {character.rarityLevel.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Description */}
            {character.description && (
              <View style={dynamicStyles.descriptionSection}>
                <Text
                  style={[
                    dynamicStyles.description,
                    { color: palette.textSecondary },
                  ]}
                >
                  {character.description}
                </Text>
              </View>
            )}

            {/* Stats or Info Section */}
            {character.categories && character.categories.length > 0 && (
              <View style={dynamicStyles.statsSection}>
                <Text
                  style={[dynamicStyles.sectionTitle, { color: palette.text }]}
                >
                  Categories
                </Text>
                <View style={dynamicStyles.categoryGrid}>
                  {character.categories.map((cat) => (
                    <View
                      key={cat.category.id}
                      style={[
                        dynamicStyles.categoryBadge,
                        { backgroundColor: palette.cardBackground },
                      ]}
                    >
                      <Text
                        style={[
                          dynamicStyles.categoryText,
                          { color: palette.text },
                        ]}
                      >
                        {cat.category.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Story Section */}
            {character.story && (
              <View style={dynamicStyles.storySection}>
                <Text
                  style={[dynamicStyles.sectionTitle, { color: palette.text }]}
                >
                  The Story
                </Text>
                <View
                  style={[
                    dynamicStyles.storyBox,
                    {
                      backgroundColor: isDark
                        ? palette.cardBackground
                        : palette.background,
                      borderColor:
                        palette.border || palette.textSecondary + "30",
                    },
                  ]}
                >
                  <Text
                    style={[dynamicStyles.storyText, { color: palette.text }]}
                  >
                    {character.story}
                  </Text>
                </View>
              </View>
            )}

            {/* Unlock Lesson Button */}
            {character.unlockLesson && (
              <Pressable
                style={({ pressed }) => [
                  dynamicStyles.unlockButton,
                  {
                    backgroundColor: palette.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => {
                  console.log(
                    "Navigate to lesson:",
                    character.unlockLesson?.slug,
                  );
                }}
              >
                <MaterialCommunityIcons
                  name="book-open-page-variant"
                  size={20}
                  color="white"
                />
                <Text style={dynamicStyles.unlockButtonText}>
                  Unlock Lesson
                </Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={18}
                  color="white"
                />
              </Pressable>
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});

const getStyles = (palette: typeof Colors.light, isDark: boolean) =>
  StyleSheet.create({
    // Header
    imageContainer: {
      position: "relative",
      overflow: "hidden",
    },
    eventImage: {
      width: "100%",
      height: "100%",
    },
    imageGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },

    headerOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    headerBackground: {
      height: 90,
    },
    headerContent: {
      position: "absolute",
      top: 48,
      left: 0,
      right: 0,
      height: 42,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerRightActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerIconButton: {
      backgroundColor: "rgba(0,0,0,0.35)",
      padding: 8,
      borderRadius: 20,
    },

    // Content
    contentWrapper: {
      marginTop: -24,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -2 },
      elevation: 4,
    },
    content: {
      padding: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    rarityBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 20,
    },
    rarityText: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.5,
    },

    // Description
    descriptionSection: {
      marginBottom: 28,
    },
    description: {
      fontSize: 15,
      lineHeight: 24,
    },

    // Categories
    statsSection: {
      marginBottom: 28,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 12,
      letterSpacing: -0.3,
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    categoryBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: "600",
    },

    // Story
    storySection: {
      marginBottom: 28,
    },
    storyBox: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    storyText: {
      fontSize: 14,
      lineHeight: 22,
      fontWeight: "400",
    },

    // Button
    unlockButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: 12,
      gap: 8,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    unlockButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "700",
    },
  });
