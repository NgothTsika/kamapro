import React from "react";
import { View, Text, FlatList } from "react-native";
import { Colors } from "@/constants/theme";
import { LessonProgressCard } from "./LessonProgressCard";
import type { LessonSummary } from "@/lib";

interface DiveRightBackSectionProps {
  lessons: LessonSummary[];
  colorScheme: "light" | "dark";
  onLessonPress?: (lessonId: string) => void;
}

export function DiveRightBackSection({
  lessons,
  colorScheme,
  onLessonPress,
}: DiveRightBackSectionProps) {
  const colors = Colors[colorScheme];

  if (lessons.length === 0) {
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
            marginBottom: 4,
          }}
        >
          Dive Right Back
        </Text>
        <Text
          style={{
            color: colors.accent,
            fontSize: 13,
            fontWeight: "400",
          }}
        >
          Continue your learning journey
        </Text>
      </View>

      <FlatList
        data={lessons.slice(0, 5)}
        keyExtractor={(item) => item.id}
        horizontal
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        renderItem={({ item }) => (
          <LessonProgressCard
            id={item.id}
            title={item.title}
            coverImage={item.coverImage}
            progress={0} // You may need to fetch this from user progress
            xpReward={item.xpReward}
            colorScheme={colorScheme}
            onPress={() => onLessonPress?.(item.id)}
          />
        )}
      />
    </View>
  );
}
