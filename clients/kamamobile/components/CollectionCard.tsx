import React from "react";
import { View, Text, Pressable, FlatList, ImageBackground } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { CharacterCard } from "./CharacterCard";
import type { CharacterCollection } from "@/lib";

interface CollectionCardProps {
  collection: CharacterCollection;
  colorScheme: "light" | "dark";
  onViewCollection?: (collectionId: string) => void;
  onCharacterPress?: (characterId: string) => void;
}

export function CollectionCard({
  collection,
  colorScheme,
  onViewCollection,
  onCharacterPress,
}: CollectionCardProps) {
  const colors = Colors[colorScheme];

  return (
    <View
      style={{
        backgroundColor: colors.backgroundSecondary,
      }}
    >
      {/* Header with title and description */}
      <View style={{ paddingHorizontal: 16, gap: 4, paddingVertical: 16 }}>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 18,
            fontWeight: "700",
          }}
          numberOfLines={2}
        >
          {collection.name}
        </Text>

        {collection.description && (
          <Text
            style={{
              color: colors.accent,
              fontSize: 13,
              fontWeight: "400",
            }}
            numberOfLines={2}
          >
            {collection.description}
          </Text>
        )}
      </View>

      {/* Characters carousel */}
      {collection.characters && collection.characters.length > 0 ? (
        <View>
          <FlatList
            data={collection.characters}
            keyExtractor={(item) => item.id}
            horizontal
            scrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            renderItem={({ item }) => (
              <CharacterCard
                id={item.id}
                name={item.name}
                imageUrl={item.imageUrl}
                rarityLevel={item.rarityLevel}
                colorScheme={colorScheme}
                onPress={() => onCharacterPress?.(item.id)}
              />
            )}
          />
        </View>
      ) : (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colors.surface,
            marginHorizontal: 16,
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            No characters in this collection yet
          </Text>
        </View>
      )}

      {/* View collection button */}
      <Pressable
        style={{
          marginTop: 12,
          marginHorizontal: 16,
          marginBottom: 16,
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: colors.primary,
          borderRadius: 12,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
        }}
        onPress={() => onViewCollection?.(collection.id)}
      >
        <Text
          style={{
            color: "white",
            fontSize: 14,
            fontWeight: "700",
          }}
        >
          View Collection
        </Text>
        <MaterialCommunityIcons name="arrow-right" color="white" size={16} />
      </Pressable>
    </View>
  );
}
