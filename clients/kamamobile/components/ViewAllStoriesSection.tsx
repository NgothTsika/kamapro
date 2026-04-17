import React from "react";
import { View, Text, Pressable, ImageBackground } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

interface ViewAllStoriesSectionProps {
  colorScheme: "light" | "dark";
  onPress?: () => void;
}

export function ViewAllStoriesSection({
  colorScheme,
  onPress,
}: ViewAllStoriesSectionProps) {
  const colors = Colors[colorScheme];

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: colors.background,
          borderRadius: 16,
          overflow: "hidden",
          height: 160,
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
        }}
      >
        <MaterialCommunityIcons
          name="book-open-outline"
          color={colors.primary}
          size={48}
        />
        <View style={{ alignItems: "center", gap: 4 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: "700",
            }}
          >
            View All Stories
          </Text>
          <Text
            style={{
              color: colors.accent,
              fontSize: 13,
              fontWeight: "400",
            }}
          >
            Discover more collections
          </Text>
        </View>
        <View
          style={{
            marginTop: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor: colors.primary,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
            Browse All
          </Text>
          <MaterialCommunityIcons name="arrow-right" color="white" size={16} />
        </View>
      </Pressable>
    </View>
  );
}
