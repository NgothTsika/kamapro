import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
  FormField,
  PrimaryButton,
  SettingsScreenShell,
} from "@/components/profile/settings-ui";
import { useProfilePreferences } from "@/lib/profile/profile-preferences-context";

export default function ChangePasswordScreen() {
  const { updatePassword } = useProfilePreferences();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <SettingsScreenShell
      title="Change password"
      subtitle="Use a stronger password with at least eight characters."
    >
      <View style={styles.form}>
        <FormField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Current password"
          secureTextEntry
        />
        <FormField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
          secureTextEntry
        />
        <FormField
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          secureTextEntry
        />
      </View>

      <PrimaryButton
        label="Update password"
        onPress={() => {
          if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Missing fields", "Fill in all password fields.");
            return;
          }

          if (newPassword.length < 8) {
            Alert.alert(
              "Password too short",
              "Your new password needs at least 8 characters.",
            );
            return;
          }

          if (newPassword !== confirmPassword) {
            Alert.alert("Passwords do not match", "Confirm the same password.");
            return;
          }

          void updatePassword().then(() => {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            Alert.alert(
              "Password updated",
              "Your password update has been saved on this device.",
            );
          });
        }}
      />
    </SettingsScreenShell>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
});
