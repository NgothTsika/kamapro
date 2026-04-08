import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export function LessonCelebration({
  xpEarned,
  streak,
  lessonTitle,
  onContinue,
}: {
  xpEarned: number;
  streak: number;
  lessonTitle: string;
  onContinue: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 550 }), withTiming(1, { duration: 550 })),
      3,
      false,
    );
  }, [scale]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: "#0e0a06", padding: 24, justifyContent: "center" }}>
      <Animated.View style={[{ alignSelf: "center", marginBottom: 24 }, badgeStyle]}>
        <Text style={{ fontSize: 72, textAlign: "center" }}>🛡️</Text>
      </Animated.View>
      <Text style={{ color: "#f8d568", fontWeight: "800", fontSize: 28, textAlign: "center" }}>
        Quest complete!
      </Text>
      <Text style={{ color: "#d0c2b0", textAlign: "center", marginTop: 12, lineHeight: 22 }}>{lessonTitle}</Text>

      <View
        style={{
          marginTop: 28,
          flexDirection: "row",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#2a2218",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#f8d568",
          }}
        >
          <Text style={{ color: "#d0c2b0", fontSize: 12 }}>XP earned</Text>
          <Text style={{ color: "#f8d568", fontSize: 28, fontWeight: "800" }}>+{xpEarned}</Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: "#2a2218",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#c97a1a",
          }}
        >
          <Text style={{ color: "#d0c2b0", fontSize: 12 }}>Streak</Text>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>{streak} 🔥</Text>
        </View>
      </View>

      <Pressable
        onPress={onContinue}
        style={{
          marginTop: 36,
          backgroundColor: "#f8d568",
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#1a1a1a", fontWeight: "800", fontSize: 16 }}>Continue</Text>
      </Pressable>
    </View>
  );
}
