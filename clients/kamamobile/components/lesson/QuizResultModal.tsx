import { Modal, Pressable, Text, View } from "react-native";

export type QuizResultVariant = "correct" | "incorrect" | "retry" | "poll" | "failed";

export function QuizResultModal({
  visible,
  variant,
  title,
  message,
  explanation,
  heartsRemaining,
  onContinue,
}: {
  visible: boolean;
  variant: QuizResultVariant;
  title: string;
  message: string;
  explanation?: string | null;
  heartsRemaining?: number;
  onContinue: () => void;
}) {
  const accent =
    variant === "correct"
      ? "#4a7c4e"
      : variant === "poll"
        ? "#5a4a2a"
        : variant === "failed"
          ? "#7a2d2d"
          : "#7a5a1a";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.65)",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: "#1b140e",
            borderRadius: 20,
            padding: 22,
            borderWidth: 2,
            borderColor: accent,
          }}
        >
          <Text style={{ color: "#f8d568", fontSize: 14, fontWeight: "700" }}>{title}</Text>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "800", marginTop: 8 }}>{message}</Text>
          {explanation ? (
            <Text style={{ color: "#d0c2b0", marginTop: 12, lineHeight: 22 }}>{explanation}</Text>
          ) : null}
          {typeof heartsRemaining === "number" ? (
            <Text style={{ color: "#ffdede", marginTop: 10 }}>❤️ Hearts left on this question: {heartsRemaining}</Text>
          ) : null}
          <Pressable
            onPress={onContinue}
            style={{
              marginTop: 20,
              backgroundColor: "#f8d568",
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#1a1a1a", fontWeight: "800" }}>
              {variant === "incorrect" || variant === "retry" ? "Try again" : "Continue"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
