import { StyleSheet, Text, View } from "react-native";
import { SettingsScreenShell } from "@/components/profile/settings-ui";
import { storyTheme } from "@/components/ui/story-theme";

const PRIVACY_SECTIONS = [
  {
    title: "What we store",
    copy:
      "Your profile details, subscription state, notifications choices, ratings, and feedback can be stored locally so the experience stays personalized.",
  },
  {
    title: "How progress is used",
    copy:
      "Learning progress, streak activity, achievements, and unlocked characters are used to power the profile dashboard and recommendations.",
  },
  {
    title: "Support requests",
    copy:
      "When you contact support or submit feedback, the details you provide help the team resolve account issues and prioritize product improvements.",
  },
  {
    title: "Your controls",
    copy:
      "You can update personal information, change preferences, sign out, or request account deletion from the settings flow.",
  },
];

export default function PrivacyScreen() {
  return (
    <SettingsScreenShell
      title="Privacy policy"
      subtitle="A quick explanation of the information this app uses and why."
    >
      <View style={styles.list}>
        {PRIVACY_SECTIONS.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.title}>{section.title}</Text>
            <Text style={styles.copy}>{section.copy}</Text>
          </View>
        ))}
      </View>
    </SettingsScreenShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 24,
    backgroundColor: storyTheme.white,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 18,
    gap: 8,
  },
  title: {
    color: storyTheme.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  copy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 21,
  },
});
