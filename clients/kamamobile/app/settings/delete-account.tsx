import { Alert, StyleSheet, Text, View } from "react-native";
import {
  InfoCard,
  PrimaryButton,
  SecondaryButton,
  SettingsScreenShell,
} from "@/components/profile/settings-ui";
import { storyTheme } from "@/components/ui/story-theme";
import { useAuth } from "@/lib/auth/auth-context";
import { useProfilePreferences } from "@/lib/profile/profile-preferences-context";

export default function DeleteAccountScreen() {
  const { signOut } = useAuth();
  const { requestDeleteAccount } = useProfilePreferences();

  return (
    <SettingsScreenShell
      title="Delete account"
      subtitle="Review the consequences before confirming account deletion."
    >
      <InfoCard
        title="What happens next"
        copy="This marks a deletion request on this device and signs you out immediately. Server-side deletion may still require support review."
        accent="#fff0ef"
      />

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>Before you continue</Text>
        <Text style={styles.warningCopy}>
          You may lose local access to your profile details, ratings, feedback
          history, and subscription view until you sign back in.
        </Text>
      </View>

      <PrimaryButton
        label="Delete account"
        onPress={() => {
          Alert.alert(
            "Delete account",
            "Do you want to record a delete-account request and sign out now?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete account",
                style: "destructive",
                onPress: () => {
                  void requestDeleteAccount().then(() => {
                    void signOut();
                  });
                },
              },
            ],
          );
        }}
      />
      <SecondaryButton
        label="Keep account"
        onPress={() => {
          Alert.alert("Account kept", "No deletion request was submitted.");
        }}
      />
    </SettingsScreenShell>
  );
}

const styles = StyleSheet.create({
  warningCard: {
    borderRadius: 24,
    backgroundColor: storyTheme.white,
    borderWidth: 1,
    borderColor: "#f1c9c5",
    padding: 18,
    gap: 8,
  },
  warningTitle: {
    color: "#8f1e1e",
    fontSize: 18,
    fontWeight: "900",
  },
  warningCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 21,
  },
});
