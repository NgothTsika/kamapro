import { type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  interpolate,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Pressable, StyleSheet, View } from "react-native";
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

  const visibleRoutes = props.state.routes.filter((route) => {
    const options = props.descriptors[route.key]?.options;
    return (options as { href?: unknown })?.href !== null;
  });

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
      <View style={styles.frostedBar}>
        {visibleRoutes.map((route) => {
          const descriptor = props.descriptors[route.key];
          const options = descriptor.options;
          const routeIndex = props.state.routes.findIndex(
            (item) => item.key === route.key,
          );
          const focused = props.state.index === routeIndex;
          const color = focused ? "#000000" : "rgba(16,16,16,0.56)";

          const onPress = () => {
            const event = props.navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              props.navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={({ pressed }) => [
                styles.tabButton,
                focused && styles.tabButtonActive,
                pressed && styles.tabButtonPressed,
              ]}
            >
              {options.tabBarIcon?.({
                focused,
                color,
                size: focused ? 24 : 22,
              })}
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: 34,
    right: 34,
    alignItems: "center",
  },
  frostedBar: {
    minWidth: 284,
    maxWidth: 360,
    width: "100%",
    height: 66,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(18,18,18,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    shadowColor: "#142011",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
  },
  tabButton: {
    width: 54,
    height: 50,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    width: 70,
    backgroundColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  tabButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.97 }],
  },
});
