import { Alert, Linking } from "react-native";
import {
  InfoCard,
  PrimaryButton,
  SecondaryButton,
  SettingsScreenShell,
} from "@/components/profile/settings-ui";

const SUPPORT_EMAIL = "support@kamapro.app";

export default function ContactScreen() {
  return (
    <SettingsScreenShell
      title="Contact us"
      subtitle="Reach the team directly for account help, bug follow-up, or partnership questions."
    >
      <InfoCard
        title="Email support"
        copy={SUPPORT_EMAIL}
        accent="#eef2f9"
      />
      <InfoCard
        title="Typical response"
        copy="We usually respond within 1 to 2 business days for account and product questions."
      />

      <PrimaryButton
        label="Email support"
        onPress={() => {
          void Linking.openURL(
            `mailto:${SUPPORT_EMAIL}?subject=Kama support request`,
          ).catch(() => {
            Alert.alert(
              "Email unavailable",
              `Send your message manually to ${SUPPORT_EMAIL}.`,
            );
          });
        }}
      />
      <SecondaryButton
        label="Copy support address"
        onPress={() => {
          Alert.alert("Support email", SUPPORT_EMAIL);
        }}
      />
    </SettingsScreenShell>
  );
}
