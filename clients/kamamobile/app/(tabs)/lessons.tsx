import { LessonCard } from "@/components/lesson";
import { getLessons, type LessonSummary } from "@/lib/api";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";

export default function LessonsScreen() {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);

  useEffect(() => {
    getLessons()
      .then((data) => setLessons(data))
      .catch(() => setLessons([]));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#0e0a06", paddingTop: 56, paddingHorizontal: 16 }}>
      <Text style={{ color: "white", fontSize: 24, fontWeight: "700" }}>Lessons</Text>
      <Text style={{ color: "#d0c2b0", marginTop: 6, marginBottom: 12 }}>
        Paladin-style learning journey from intro to quiz.
      </Text>

      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LessonCard lesson={item} onPress={() => router.push(`/lesson/${item.slug}`)} />
        )}
      />
    </View>
  );
}
