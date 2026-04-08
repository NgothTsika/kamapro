import type { LessonSummary } from "@/lib/api";
import { Pressable, Text, View } from "react-native";

export function LessonCard({
  lesson,
  onPress,
}: {
  lesson: LessonSummary;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#1b140e",
        borderColor: "#3b2a1a",
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <Text style={{ color: "#f8d568", fontSize: 12 }}>Lesson</Text>
      <Text style={{ color: "white", fontSize: 18, fontWeight: "700", marginTop: 2 }}>
        {lesson.title}
      </Text>
      <Text style={{ color: "#cfbea8", marginTop: 6 }} numberOfLines={2}>
        {lesson.description || lesson.hook || "Discover an African story and test your wisdom."}
      </Text>
      <Text style={{ color: "#8e7b64", marginTop: 8 }}>XP reward: {lesson.xpReward ?? 0}</Text>
    </Pressable>
  );
}
