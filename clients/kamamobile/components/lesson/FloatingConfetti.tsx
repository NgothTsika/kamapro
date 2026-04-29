import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const COLORS = ["#f8d568", "#58b874", "#ff8f66", "#7ca6ff", "#ffffff"];

function ConfettiPiece({
  index,
  color,
  left,
}: {
  index: number;
  color: string;
  left: number;
}) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withRepeat(
      withDelay(
        index * 120,
        withTiming(1, { duration: 2600, easing: Easing.linear }),
      ),
      -1,
      false,
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateY: progress.value * 440 - 40 },
      { translateX: Math.sin(progress.value * Math.PI * 2) * 16 },
      { rotate: `${progress.value * 720}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          backgroundColor: color,
          left,
        },
        style,
      ]}
    />
  );
}

export function FloatingConfetti() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 18 }).map((_, index) => (
        <ConfettiPiece
          key={`confetti-${index}`}
          index={index}
          color={COLORS[index % COLORS.length]}
          left={(width / 18) * index + 8}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: "absolute",
    top: 0,
    width: 10,
    height: 18,
    borderRadius: 4,
  },
});
