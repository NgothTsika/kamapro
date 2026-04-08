import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export function AnimatedLessonProgressBar({
  value,
  height = 10,
}: {
  value: number;
  height?: number;
}) {
  const safe = Math.max(0, Math.min(1, value));
  const widthPct = useSharedValue(safe * 100);

  useEffect(() => {
    widthPct.value = withSpring(safe * 100, { damping: 18, stiffness: 180 });
  }, [safe, widthPct]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthPct.value}%`,
  }));

  return (
    <View
      style={{
        width: "100%",
        height,
        borderRadius: 999,
        backgroundColor: "#2a1f14",
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          {
            height: "100%",
            backgroundColor: "#f8d568",
            borderRadius: 999,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}
