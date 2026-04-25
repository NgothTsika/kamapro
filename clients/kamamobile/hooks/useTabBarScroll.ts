import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useTabBarVisibility } from "@/components/navigation/tab-bar-visibility";

export function useTabBarScroll() {
  const { handleScrollOffset, showTabBar } = useTabBarVisibility();

  useFocusEffect(
    useCallback(() => {
      showTabBar();
      return () => showTabBar();
    }, [showTabBar]),
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      handleScrollOffset(event.nativeEvent.contentOffset.y);
    },
    [handleScrollOffset],
  );

  return { onScroll };
}
