import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import {
  FormField,
  PrimaryButton,
  SettingsScreenShell,
} from "@/components/profile/settings-ui";
import { storyTheme } from "@/components/ui/story-theme";
import {
  type FeedbackCategory,
  useProfilePreferences,
} from "@/lib/profile/profile-preferences-context";

const FEEDBACK_OPTIONS: Array<{
  id: FeedbackCategory;
  label: string;
}> = [
  { id: "bug", label: "Report a bug" },
  { id: "feedback", label: "Share feedback" },
  { id: "feature", label: "Suggest a feature" },
];

export default function FeedbackScreen() {
  const { feedbackEntries, submitFeedback } = useProfilePreferences();
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const latestEntries = useMemo(() => feedbackEntries.slice(0, 3), [feedbackEntries]);

  return (
    <SettingsScreenShell
      title="Feedback to share"
      subtitle="Send a bug report, a product note, or the feature you want next."
    >
      <View style={styles.categoryRow}>
        {FEEDBACK_OPTIONS.map((option) => {
          const active = option.id === category;

          return (
            <Pressable
              key={option.id}
              onPress={() => setCategory(option.id)}
              style={[
                styles.categoryPill,
                active && styles.categoryPillActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  active && styles.categoryPillTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.form}>
        <FormField
          label="Subject"
          value={subject}
          onChangeText={setSubject}
          placeholder="Short title"
        />
        <FormField
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder="What happened, what you expected, or what you want built"
          multiline
        />
      </View>

      <PrimaryButton
        label="Send feedback"
        onPress={() => {
          if (!subject.trim() || !message.trim()) {
            Alert.alert("Missing details", "Add both a subject and a message.");
            return;
          }

          void submitFeedback({
            category,
            subject: subject.trim(),
            message: message.trim(),
          }).then(() => {
            setSubject("");
            setMessage("");
            Alert.alert("Feedback saved", "Your message has been recorded.");
          });
        }}
      />

      {latestEntries.length > 0 ? (
        <View style={styles.history}>
          <Text style={styles.historyTitle}>Recent submissions</Text>
          {latestEntries.map((entry) => (
            <View key={entry.id} style={styles.historyCard}>
              <Text style={styles.historyLabel}>
                {FEEDBACK_OPTIONS.find((option) => option.id === entry.category)?.label}
              </Text>
              <Text style={styles.historySubject}>{entry.subject}</Text>
              <Text style={styles.historyMessage}>{entry.message}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </SettingsScreenShell>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryPill: {
    borderRadius: 999,
    backgroundColor: storyTheme.white,
    borderWidth: 1,
    borderColor: storyTheme.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryPillActive: {
    backgroundColor: storyTheme.navy,
    borderColor: storyTheme.navy,
  },
  categoryPillText: {
    color: storyTheme.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  categoryPillTextActive: {
    color: storyTheme.white,
  },
  form: {
    gap: 14,
  },
  history: {
    gap: 12,
  },
  historyTitle: {
    color: storyTheme.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  historyCard: {
    borderRadius: 22,
    backgroundColor: storyTheme.white,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 16,
    gap: 6,
  },
  historyLabel: {
    color: storyTheme.amber,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  historySubject: {
    color: storyTheme.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  historyMessage: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
});
