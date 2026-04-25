import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type TabBarVisibilityContextValue = {
  hidden: boolean;
  handleScrollOffset: (offsetY: number) => void;
  showTabBar: () => void;
};

const TabBarVisibilityContext =
  createContext<TabBarVisibilityContextValue | null>(null);

export function TabBarVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  const lastOffsetRef = useRef(0);

  const showTabBar = useCallback(() => {
    lastOffsetRef.current = 0;
    setHidden(false);
  }, []);

  const handleScrollOffset = useCallback((offsetY: number) => {
    const lastOffset = lastOffsetRef.current;
    const delta = offsetY - lastOffset;

    if (Math.abs(delta) < 14) return;

    if (offsetY <= 24) {
      setHidden(false);
      lastOffsetRef.current = offsetY;
      return;
    }

    if (delta > 0 && offsetY > 40) {
      setHidden(true);
    } else if (delta < 0) {
      setHidden(false);
    }

    lastOffsetRef.current = offsetY;
  }, []);

  const value = useMemo(
    () => ({
      hidden,
      handleScrollOffset,
      showTabBar,
    }),
    [handleScrollOffset, hidden, showTabBar],
  );

  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility() {
  const context = useContext(TabBarVisibilityContext);
  if (!context) {
    throw new Error("useTabBarVisibility must be used within TabBarVisibilityProvider");
  }
  return context;
}
