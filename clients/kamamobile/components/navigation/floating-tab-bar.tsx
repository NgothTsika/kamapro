import {
  BottomTabBar,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  interpolate,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native";
import { useEffect } from "react";
import { useTabBarVisibility } from "./tab-bar-visibility";

export function FloatingTabBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { hidden } = useTabBarVisibility();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(hidden ? 1 : 0, {
      stiffness: 280,
    });
  }, [hidden, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0.84]),
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [0, 118]),
      },
      {
        scale: interpolate(progress.value, [0, 1], [1, 0.96]),
      },
    ],
  }));

  return (
    <Animated.View
      pointerEvents={hidden ? "none" : "auto"}
      style={[
        styles.shell,
        {
          bottom: Math.max(insets.bottom, 10),
        },
        animatedStyle,
      ]}
    >
      <BottomTabBar {...props} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: 16,
    right: 16,
  },
});
