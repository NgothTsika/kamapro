import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export function AnimatedBackdrop() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const orbA = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(pulse.value, [0, 1], [-12, 18]) },
      { translateY: interpolate(pulse.value, [0, 1], [0, -24]) },
      { scale: interpolate(pulse.value, [0, 1], [1, 1.14]) },
    ],
    opacity: interpolate(pulse.value, [0, 1], [0.72, 0.92]),
  }));

  const orbB = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(pulse.value, [0, 1], [14, -22]) },
      { translateY: interpolate(pulse.value, [0, 1], [0, 20]) },
      { scale: interpolate(pulse.value, [0, 1], [1.08, 0.92]) },
    ],
    opacity: interpolate(pulse.value, [0, 1], [0.4, 0.7]),
  }));

  const orbC = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(pulse.value, [0, 1], [0, 12]) },
      { translateY: interpolate(pulse.value, [0, 1], [10, -16]) },
      { scale: interpolate(pulse.value, [0, 1], [0.92, 1.1]) },
    ],
    opacity: interpolate(pulse.value, [0, 1], [0.28, 0.5]),
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />
      <Animated.View style={[styles.orb, styles.orbA, orbA]} />
      <Animated.View style={[styles.orb, styles.orbB, orbB]} />
      <Animated.View style={[styles.orb, styles.orbC, orbC]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#20051d",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbA: {
    top: -40,
    right: -20,
    width: 220,
    height: 220,
    backgroundColor: "rgba(240, 168, 74, 0.24)",
  },
  orbB: {
    bottom: 120,
    left: -30,
    width: 260,
    height: 260,
    backgroundColor: "rgba(88, 184, 116, 0.20)",
  },
  orbC: {
    top: "34%",
    alignSelf: "center",
    width: 180,
    height: 180,
    backgroundColor: "rgba(116, 146, 244, 0.16)",
  },
});
