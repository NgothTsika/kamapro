import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
  FormField,
  PrimaryButton,
  SettingsScreenShell,
} from "@/components/profile/settings-ui";
import {
  type PersonalInfo,
  useProfilePreferences,
} from "@/lib/profile/profile-preferences-context";

export default function PersonalInfoScreen() {
  const { personalInfo, updatePersonalInfo } = useProfilePreferences();
  const [form, setForm] = useState<PersonalInfo>(personalInfo);

  useEffect(() => {
    setForm(personalInfo);
  }, [personalInfo]);

  return (
    <SettingsScreenShell
      title="Personal information"
      subtitle="Update your profile details. Your email is shown for reference only."
    >
      <View style={styles.form}>
        <FormField
          label="Full name"
          value={form.fullName}
          onChangeText={(value) => setForm((current) => ({ ...current, fullName: value }))}
          placeholder="Your full name"
        />
        <FormField
          label="Username"
          value={form.username}
          onChangeText={(value) => setForm((current) => ({ ...current, username: value }))}
          placeholder="Your username"
        />
        <FormField label="Email" value={form.email} editable={false} />
        <FormField
          label="Country"
          value={form.country}
          onChangeText={(value) => setForm((current) => ({ ...current, country: value }))}
          placeholder="Country"
        />
        <FormField
          label="Bio"
          value={form.bio}
          onChangeText={(value) => setForm((current) => ({ ...current, bio: value }))}
          placeholder="Tell us about your learning goal"
          multiline
        />
      </View>

      <PrimaryButton
        label="Save personal information"
        onPress={() => {
          void updatePersonalInfo(form).then(() => {
            Alert.alert("Saved", "Your personal information has been updated.");
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
