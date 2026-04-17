import type { LessonSummary } from "@/lib";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { Pressable, Text, View } from "react-native";

export function LessonCard({
  lesson,
  onPress,
}: {
  lesson: LessonSummary;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <Text style={{ color: colors.primary, fontSize: 12 }}>Lesson</Text>
      <Text
        style={{
          color: colors.text,
          fontSize: 18,
          fontWeight: "700",
          marginTop: 2,
        }}
      >
        {lesson.title}
      </Text>
      <Text
        style={{ color: colors.textSecondary, marginTop: 6 }}
        numberOfLines={2}
      >
        {lesson.description ||
          lesson.hook ||
          "Discover an African story and test your wisdom."}
      </Text>
      <Text style={{ color: colors.textMuted, marginTop: 8 }}>
        XP reward: {lesson.xpReward ?? 0}
      </Text>
    </Pressable>
  );
}
