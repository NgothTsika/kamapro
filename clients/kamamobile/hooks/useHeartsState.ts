import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AppState } from "react-native";
import { getHearts, type HeartState } from "@/lib/api";
import { loadToken } from "@/lib/auth/token-storage";

export function useHeartsState() {
  const [hearts, setHearts] = useState<HeartState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await loadToken();
      if (!token) {
        setHearts(null);
        return null;
      }

      const nextHearts = await getHearts(token);
      setHearts(nextHearts);
      return nextHearts;
    } catch (error) {
      console.error("Failed to refresh hearts:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refresh();
      }
    });

    return () => subscription.remove();
  }, [refresh]);

  return {
    hearts,
    loading,
    refresh,
    setHearts,
    hasHearts: hearts ? hearts.hearts > 0 : true,
  };
}
