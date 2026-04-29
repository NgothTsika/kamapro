import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import {
  FormField,
  PrimaryButton,
  SettingsScreenShell,
} from "@/components/profile/settings-ui";
import { storyTheme } from "@/components/ui/story-theme";
import { useProfilePreferences } from "@/lib/profile/profile-preferences-context";

export default function RateUsScreen() {
  const { appRating, appReview, saveAppRating } = useProfilePreferences();
  const [rating, setRating] = useState(appRating || 5);
  const [review, setReview] = useState(appReview);

  return (
    <SettingsScreenShell
      title="Rate us"
      subtitle="Tell us how the profile, lessons, and learning flow feel."
    >
      <View style={styles.ratingCard}>
        <Text style={styles.ratingTitle}>Your rating</Text>
        <View style={styles.starRow}>
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1;
            const active = value <= rating;

            return (
              <Pressable
                key={value}
                onPress={() => setRating(value)}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <MaterialIcons
                  name={active ? "star" : "star-border"}
                  size={38}
                  color={active ? storyTheme.gold : "#c8bfaf"}
                />
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.ratingCopy}>
          {rating >= 4
            ? "Strong. Tell us what feels best."
            : "Useful signal. Tell us what should improve next."}
        </Text>
      </View>

      <FormField
        label="Review"
        value={review}
        onChangeText={setReview}
        placeholder="Share a short review"
        multiline
      />

      <PrimaryButton
        label="Save rating"
        onPress={() => {
          void saveAppRating(rating, review).then(() => {
            Alert.alert("Thanks", "Your rating and review have been saved.");
          });
        }}
      />
    </SettingsScreenShell>
  );
}

const styles = StyleSheet.create({
  ratingCard: {
    borderRadius: 26,
    backgroundColor: storyTheme.white,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 18,
    gap: 12,
  },
  ratingTitle: {
    color: storyTheme.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  starRow: {
    flexDirection: "row",
    gap: 8,
  },
  ratingCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.85,
  },
});
