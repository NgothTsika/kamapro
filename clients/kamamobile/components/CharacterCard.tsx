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

interface CharacterCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
  rarityLevel?: string | null;
  colorScheme: "light" | "dark";
  onPress?: () => void;
}

export function CharacterCard({
  id,
  name,
  imageUrl,
  rarityLevel,
  colorScheme,
  onPress,
}: CharacterCardProps) {
  const colors = Colors[colorScheme];

  const getRarityColor = (rarity?: string | null): string => {
    switch (rarity?.toLowerCase()) {
      case "common":
        return "#6b7280"; // gray
      case "uncommon":
        return "#10b981"; // emerald
      case "rare":
        return "#3b82f6"; // blue
      case "epic":
        return "#8b5cf6"; // purple
      case "legendary":
        return "#f59e0b"; // amber
      default:
        return "#9ca3af"; // default gray
    }
  };

  return (
    <Pressable
      style={{
        width: 110,
        borderRadius: 12,
        overflow: "hidden",
        gap: 8,
      }}
      onPress={onPress}
    >
      <ImageBackground
        source={{
          uri: imageUrl || "https://via.placeholder.com/110x130",
        }}
        style={{
          width: "100%",
          height: 130,
          justifyContent: "flex-end",
        }}
        imageStyle={{ opacity: 0.85 }}
      >
        {/* Dark overlay */}
        <View
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            paddingBottom: 8,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 12,
              fontWeight: "700",
              textAlign: "center",
              paddingHorizontal: 4,
            }}
            numberOfLines={2}
          >
            {name}
          </Text>
        </View>
      </ImageBackground>

      {/* Rarity indicator */}
      {rarityLevel && (
        <View
          style={{
            height: 3,
            backgroundColor: getRarityColor(rarityLevel),
            borderRadius: 2,
          }}
        />
      )}
    </Pressable>
  );
}
