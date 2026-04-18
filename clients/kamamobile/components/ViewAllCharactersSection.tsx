import React from "react";
import {
  View,
  Text,
  Pressable,
  ImageBackground,
  StyleSheet,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import type { Character } from "@/lib";

interface ViewAllCharactersSectionProps {
  characters: Character[];
  colorScheme: "light" | "dark";
  onPress?: (character: Character) => void;
  totalCount?: number;
}

export function ViewAllCharactersSection({
  characters,
  colorScheme,
  onPress,
  totalCount = 100,
}: ViewAllCharactersSectionProps) {
  const colors = Colors[colorScheme];

  // Take only first 3 characters for preview
  const previewCharacters = characters.slice(0, 3);

  return (
    <Pressable
      onPress={() => {
        // Show first character when clicking view all
        if (characters.length > 0) {
          onPress?.(characters[0]);
        }
      }}
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Left Section - Text */}
      <View style={{ flex: 1, marginBottom: 16 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 24,
            fontWeight: "800",
            letterSpacing: -0.5,
            marginBottom: 8,
          }}
        >
          View all characters
        </Text>
        <Text
          style={{
            color: colors.accent,
            fontSize: 14,
            fontWeight: "500",
            lineHeight: 20,
          }}
        >
          Over {totalCount.toLocaleString()}+ characters{"\n"}to discover
        </Text>
      </View>

      {/* Right Section - Character Images */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          height: 100,
        }}
      >
        {previewCharacters.map((character, index) => (
          <View
            key={character.id}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              overflow: "hidden",
              borderWidth: 3,
              borderColor: colors.background,
              marginLeft: index > 0 ? -20 : 0,
              zIndex: previewCharacters.length - index,
              backgroundColor: colors.background,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {character.imageUrl ? (
              <ImageBackground
                source={{ uri: character.imageUrl }}
                style={{
                  width: "100%",
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                imageStyle={{ borderRadius: 40 }}
              />
            ) : (
              <MaterialCommunityIcons
                name="account-circle"
                color={colors.accent}
                size={40}
              />
            )}
          </View>
        ))}
      </View>

      {/* Bottom Action */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <MaterialCommunityIcons
          name="arrow-right"
          color={colors.accent}
          size={20}
        />
        <Text
          style={{
            color: colors.accent,
            fontSize: 16,
            fontWeight: "700",
            letterSpacing: 0.5,
          }}
        >
          View
        </Text>
      </View>
    </Pressable>
  );
}
