import { LessonCard } from "@/components/lesson";
import { getLessons, type LessonSummary } from "@/lib";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";

export default function LessonsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [lessons, setLessons] = useState<LessonSummary[]>([]);

  useEffect(() => {
    getLessons()
      .then((data) => setLessons(data))
      .catch(() => setLessons([]));
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 56,
        paddingHorizontal: 16,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: "700" }}>
        Lessons
      </Text>
      <Text
        style={{ color: colors.textSecondary, marginTop: 6, marginBottom: 12 }}
      >
        Paladin-style learning journey from intro to quiz.
      </Text>

      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LessonCard
            lesson={item}
            onPress={() => router.push(`/lesson/${item.slug}`)}
          />
        )}
      />
    </View>
  );
}
