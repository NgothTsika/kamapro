/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,

    backgroundSecondary: "#0e0a06",
    surface: "#17110c",
    surfaceAlt: "#1d1510",
    card: "#1d1510",
    cardBackground: "#17110c",

    // Text colors
    textG: "#ffffff",
    textSecondary: "#d0c2b0",
    textTertiary: "#907f69",
    textMuted: "#8f7f6a",

    // Accent colors
    primary: "#f8d568", // Gold/Yellow
    accent: "#d8c3a5", // Beige

    // Status colors
    error: "#ff6b6b",
    success: "#51cf66",
    warning: "#ff9500",
    info: "#4dabf7",

    // Border colors
    border: "#3a2b1f",
    borderLight: "#7a4a12",
    borderRed: "#7a2d2d",

    // Specific component colors
    heart: "#ff6b6b",
    fire: "#ff9500",

    // Background variants
    bgRed: "#5a1f1f",
    bgBrown: "#4a2b05",
    bgPrimary: "#0e0a06",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,

    // Background colors
    backgroundSecondary: "#ffffff",
    surface: "#f8f8f8",
    surfaceAlt: "#f0f0f0",
    card: "#f5f5f5",
    cardBackground: "#f8f8f8",

    // Text colors
    textG: "#1a1a1a",
    textSecondary: "#555555",
    textTertiary: "#888888",
    textMuted: "#aaaaaa",

    // Accent colors
    primary: "#f8d568", // Gold/Yellow
    accent: "#d8c3a5", // Beige

    // Status colors
    error: "#ff6b6b",
    success: "#51cf66",
    warning: "#ff9500",
    info: "#4dabf7",

    // Border colors
    border: "#e0e0e0",
    borderLight: "#f0f0f0",
    borderRed: "#ffcccc",

    // Specific component colors
    heart: "#ff6b6b",
    fire: "#ff9500",

    // Background variants
    bgRed: "#fff0f0",
    bgBrown: "#fff8f0",
    bgPrimary: "#ffffff",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
