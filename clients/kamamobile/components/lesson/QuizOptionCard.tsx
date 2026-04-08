import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

export function QuizOptionCard({
  label,
  imageUrl,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  imageUrl?: string | null;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        paddingVertical: imageUrl ? 10 : 12,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: selected ? "#f8d568" : "#3b2a1a",
        backgroundColor: selected ? "#3a2a12" : "#1b140e",
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {imageUrl ? (
        <View style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden" }}>
          <Image source={{ uri: imageUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        </View>
      ) : null}
      <Text style={{ color: "white", flex: 1 }}>{label}</Text>
    </Pressable>
  );
}
