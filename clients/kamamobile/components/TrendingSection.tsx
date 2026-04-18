import React from "react";
import {
  View,
  Text,
  Pressable,
  ImageBackground,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import type { Character } from "@/lib";

interface TrendingSectionProps {
  character: Character;
  colorScheme: "light" | "dark";
  onPress?: () => void;
}

export function TrendingSection({
  character,
  colorScheme,
  onPress,
}: TrendingSectionProps) {
  const colors = Colors[colorScheme];
  const BACKGROUND_IMAGE = require("@/assets/images/background.png");

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

  return (
    <Pressable
      onPress={onPress}
      style={{ marginHorizontal: 16, marginBottom: 16 }}
    >
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={{
          width: "100%",
          height: 380,
          borderRadius: 16,
          overflow: "hidden",
          justifyContent: "space-between",
        }}
        imageStyle={{ opacity: 0.8 }}
      >
        {/* Header Section */}
        <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 24,
              fontWeight: "800",
              letterSpacing: -0.5,
            }}
          >
            Trending Right Now
          </Text>
        </View>

        {/* Character Image Section */}
        {character.imageUrl && (
          <ImageBackground
            source={{ uri: character.imageUrl }}
            style={{
              width: "100%",
              height: 220,
              justifyContent: "flex-end",
              alignItems: "center",
            }}
            imageStyle={{ opacity: 0.7 }}
          />
        )}

        {/* Bottom Info Card */}
        <View
          style={{
            backgroundColor: "white",
            marginHorizontal: 12,
            marginBottom: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#1f2937",
                fontSize: 16,
                fontWeight: "700",
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {character.name}
            </Text>
            <Text
              style={{
                color: "#6b7280",
                fontSize: 12,
                fontWeight: "500",
              }}
              numberOfLines={1}
            >
              {character.rarityLevel || "Character"}
            </Text>
          </View>

          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: getRarityColor(character.rarityLevel),
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              color="white"
              size={20}
            />
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}
