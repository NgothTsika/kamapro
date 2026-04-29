import { StyleSheet, Text, View } from "react-native";
import { SettingsScreenShell } from "@/components/profile/settings-ui";
import { storyTheme } from "@/components/ui/story-theme";

const TERMS_SECTIONS = [
  {
    title: "Using Kama",
    copy:
      "Use the app for lawful personal learning. Keep your account information accurate and do not misuse lessons, quizzes, or community features.",
  },
  {
    title: "Subscriptions and access",
    copy:
      "Free access includes core learning features. Pro access unlocks premium benefits described in the subscription screen and renews based on the plan you choose.",
  },
  {
    title: "Content and progress",
    copy:
      "Lesson progress, streaks, ratings, and feedback may be stored so your learning experience stays consistent across sessions on this device.",
  },
  {
    title: "Account actions",
    copy:
      "You can sign out at any time. Deletion requests remove local access from this device and may require support follow-up when server-side data is involved.",
  },
];

export default function TermsScreen() {
  return (
    <SettingsScreenShell
      title="Terms of service"
      subtitle="A plain-language summary of how this app should be used."
    >
      <View style={styles.list}>
        {TERMS_SECTIONS.map((section) => (
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
