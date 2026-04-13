import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { Pressable, Text, View, Image, ImageBackground } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface CategoryCardProps {
  id: string;
  name: string;
  coverImage?: string | null;
  lessonCount: number;
  characterCount: number;
  totalChapters: number;
  onPress: () => void;
}

export function CategoryCard({
  name,
  coverImage,
  lessonCount,
  characterCount,
  totalChapters,
  onPress,
}: CategoryCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // Create a gradient overlay color based on theme
  const overlayColor =
    colorScheme === "dark" ? "rgba(20, 15, 10, 0.4)" : "rgba(100, 80, 40, 0.3)";

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 300,
        height: 440,
        borderRadius: 16,
        overflow: "hidden",
        gap: 12,
        marginHorizontal: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Background Image with Overlay */}
      {coverImage ? (
        <ImageBackground
          source={{ uri: coverImage }}
          style={{
            flex: 1,
            width: "100%",
            height: "100%",
            justifyContent: "space-between",
            padding: 16,
          }}
          imageStyle={{ opacity: 0.6 }}
        >
          <View
            style={{ backgroundColor: overlayColor, flex: 1, borderRadius: 16 }}
          />
        </ImageBackground>
      ) : (
        <ImageBackground
          source={{ uri: "https://via.placeholder.com/280x320" }}
          style={{
            flex: 1,

            justifyContent: "space-between",
            padding: 1,
          }}
          imageStyle={{ opacity: 0.3 }}
        >
          <View
            style={{ backgroundColor: overlayColor, flex: 1, borderRadius: 16 }}
          />
        </ImageBackground>
      )}

      {/* Content Overlay - positioned absolutely */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          justifyContent: "space-between",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Top - Category Badge */}
        <View>
          <View
            style={{
              backgroundColor: "white",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                color: "#000",
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              {name.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Middle - Title */}
        <View style={{ gap: 12 }}>
          <Text
            style={{
              color: "white",
              fontSize: 28,
              fontWeight: "700",
              lineHeight: 32,
            }}
          >
            {name}
          </Text>
        </View>

        {/* Bottom - Stats and Button */}
        <View style={{ gap: 12 }}>
          {/* Stats */}
          <View style={{ gap: 8 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {lessonCount ?? 0}
              </Text>
              <Text
                style={{
                  color: colors.warning,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                {lessonCount === 1 ? "story" : "stories"}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {totalChapters ?? 0}
              </Text>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                {totalChapters === 1 ? "chapter" : "chapters"}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {characterCount ?? 0}
              </Text>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                {characterCount === 1 ? "character" : "characters"}
              </Text>
            </View>
          </View>

          {/* View Button */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text
              style={{
                color: colors.primary,
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              View
            </Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={18}
              color={colors.primary}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
