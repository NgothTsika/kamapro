import { View } from "react-native";

export function LessonProgressBar({
  value,
}: {
  value: number;
}) {
  const safeValue = Math.max(0, Math.min(1, value));

  return (
    <View
      style={{
        width: "100%",
        height: 10,
        borderRadius: 999,
        backgroundColor: "#2a1f14",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${safeValue * 100}%`,
          height: "100%",
          backgroundColor: "#f8d568",
        }}
      />
    </View>
  );
}
