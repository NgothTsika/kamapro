import Constants from "expo-constants";
import { Alert, StyleSheet, Text } from "react-native";
import {
  SettingsRow,
  SettingsScreenShell,
  SettingsSection,
  ToggleRow,
} from "@/components/profile/settings-ui";
import { storyTheme } from "@/components/ui/story-theme";
import { useAuth } from "@/lib/auth/auth-context";
import { useProfilePreferences } from "@/lib/profile/profile-preferences-context";
import { useRouter } from "expo-router";

export default function SettingsIndexScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { subscriptionTier, contentPreferences, updateContentPreferences } =
    useProfilePreferences();
  const appVersion =
    Constants.expoConfig?.version || Constants.nativeAppVersion || "1.0.0";

  return (
    <SettingsScreenShell
      title="Settings"
      subtitle="Subscription, content preferences, account updates, support, and legal details."
    >
      <SettingsSection title="Account">
        <SettingsRow
          icon="badge"
          title="Personal information"
          detail="Update your profile details. Email stays read only."
          onPress={() => router.push("/settings/personal-info")}
        />
        <SettingsRow
          icon="password"
          title="Change password"
          detail="Set a fresh password for this account."
          onPress={() => router.push("/settings/change-password")}
        />
      </SettingsSection>

      <SettingsSection title="Content">
        <ToggleRow
          icon="notifications-active"
          title="Notifications"
          detail="Practice reminders and progress updates."
          value={contentPreferences.notificationsEnabled}
          onValueChange={(next) => {
            void updateContentPreferences({ notificationsEnabled: next });
          }}
        />
        <ToggleRow
          icon="mark-email-read"
          title="Email subscription"
          detail="Receive tips, news, and feature launches."
          value={contentPreferences.emailSubscriptionEnabled}
          onValueChange={(next) => {
            void updateContentPreferences({ emailSubscriptionEnabled: next });
          }}
        />
      </SettingsSection>

      <SettingsSection title="Support">
        <SettingsRow
          icon="star-rate"
          title="Rate us"
          detail="Leave a rating and a short review."
          onPress={() => router.push("/settings/rate-us")}
        />
        <SettingsRow
          icon="chat-bubble"
          title="Feedback to share"
          detail="Report a bug, share feedback, or suggest a feature."
          onPress={() => router.push("/settings/feedback")}
        />
        <SettingsRow
          icon="support-agent"
          title="Contact us"
          detail="Reach support directly from the app."
          onPress={() => router.push("/settings/contact")}
        />
      </SettingsSection>

      <SettingsSection title="Legal">
        <SettingsRow
          icon="gavel"
          title="Terms of service"
          detail="Read the rules for using Kama."
          onPress={() => router.push("/settings/terms")}
        />
        <SettingsRow
          icon="policy"
          title="Privacy policy"
          detail="See how account and usage data are handled."
          onPress={() => router.push("/settings/privacy")}
        />
      </SettingsSection>

      <SettingsSection title="Subscription">
        <SettingsRow
          icon="workspace-premium"
          title="My subscription"
          detail="Compare Free and Pro, then purchase or restore."
          value={subscriptionTier === "pro" ? "Pro" : "Free"}
          onPress={() => router.push("/settings/subscription")}
        />
      </SettingsSection>

      <SettingsSection title="Account actions">
        <SettingsRow
          icon="logout"
          title="Sign out"
          detail="Sign out on this device."
          danger
          onPress={() => {
            Alert.alert("Sign out", "Do you want to sign out now?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign out",
                style: "destructive",
                onPress: () => {
                  void signOut();
                },
              },
            ]);
          }}
        />
        <SettingsRow
          icon="delete-forever"
          title="Delete account"
          detail="Review what happens before confirming."
          danger
          onPress={() => router.push("/settings/delete-account")}
        />
      </SettingsSection>

      <Text style={styles.versionText}>App version {appVersion}</Text>
    </SettingsScreenShell>
  );
}

const styles = StyleSheet.create({
  versionText: {
    textAlign: "center",
    color: storyTheme.inkSoft,
    fontSize: 13,
    lineHeight: 18,
    paddingBottom: 8,
  },
});
