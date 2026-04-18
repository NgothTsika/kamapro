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

interface NewCharacterSectionProps {
  character: Character;
  colorScheme: "light" | "dark";
  onPress?: () => void;
}

export function NewCharacterSection({
  character,
  colorScheme,
  onPress,
}: NewCharacterSectionProps) {
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

  const rarityColor = getRarityColor(character.rarityLevel);

  return (
    <Pressable
      onPress={onPress}
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={{
          width: "100%",
          height: 280,
          justifyContent: "space-between",
          backgroundColor: rarityColor,
        }}
        imageStyle={{ opacity: 0.6 }}
      >
        {/* Header Badge */}
        <View style={{ paddingTop: 16, paddingHorizontal: 16 }}>
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                color: rarityColor,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.5,
              }}
            >
              NEW CHARACTER
            </Text>
          </View>
        </View>

        {/* Character Image */}
        {character.imageUrl && (
          <ImageBackground
            source={{ uri: character.imageUrl }}
            style={{
              width: "100%",
              height: 140,
              justifyContent: "center",
              alignItems: "center",
            }}
            imageStyle={{ opacity: 0.75 }}
          />
        )}

        {/* Bottom Info Section */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "800",
              marginBottom: 4,
            }}
            numberOfLines={2}
          >
            {character.name}
          </Text>

          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <MaterialCommunityIcons name="star" color={rarityColor} size={16} />
            <Text
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              {character.rarityLevel || "Character"}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}
