import React from "react";
import { View, Text, FlatList } from "react-native";
import { Colors } from "@/constants/theme";
import { CategoryCard } from "./CategoryCard";
import type { Category } from "@/lib/api/types";

interface ExploreByCategorySectionProps {
  categories: Category[];
  colorScheme: "light" | "dark";
  onCategoryPress?: (categoryId: string) => void;
}

export function ExploreByCategorySection({
  categories,
  colorScheme,
  onCategoryPress,
}: ExploreByCategorySectionProps) {
  const colors = Colors[colorScheme];

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: 24, gap: 12 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 20,
            fontWeight: "700",
          }}
        >
          Explore.
        </Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        horizontal
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        renderItem={({ item }) => (
          <CategoryCard
            id={item.id}
            name={item.name}
            coverImage={item.coverImage}
            lessonCount={item.lessonCount}
            characterCount={item.characterCount}
            totalChapters={item.totalChapters}
            onPress={() => onCategoryPress?.(item.id)}
          />
        )}
      />
    </View>
  );
}
