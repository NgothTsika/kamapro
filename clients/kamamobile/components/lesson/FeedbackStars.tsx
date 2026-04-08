import { Pressable, Text, View } from "react-native";

export function FeedbackStars({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginVertical: 8 }}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Pressable key={value} onPress={() => onChange(value)}>
          <Text style={{ fontSize: 28 }}>{value <= rating ? "⭐" : "☆"}</Text>
        </Pressable>
      ))}
    </View>
  );
}
