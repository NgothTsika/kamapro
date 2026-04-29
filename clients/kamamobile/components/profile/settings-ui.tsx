import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { storyTheme } from "@/components/ui/story-theme";

export function SettingsScreenShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerCard}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons
              name="arrow-back-ios-new"
              size={18}
              color={storyTheme.ink}
            />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle ? <Text style={styles.headerCopy}>{subtitle}</Text> : null}
          </View>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export function SettingsRow({
  icon,
  title,
  detail,
  value,
  onPress,
  danger,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  detail?: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowLead}>
        <View
          style={[
            styles.rowIcon,
            danger && { backgroundColor: "rgba(197, 59, 59, 0.12)" },
          ]}
        >
          <MaterialIcons
            name={icon}
            size={18}
            color={danger ? "#c53b3b" : storyTheme.navy}
          />
        </View>
        <View style={styles.rowTextWrap}>
          <Text style={[styles.rowTitle, danger && { color: "#8f1e1e" }]}>
            {title}
          </Text>
          {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
        </View>
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={storyTheme.inkSoft}
        />
      </View>
    </Pressable>
  );
}

export function ToggleRow({
  icon,
  title,
  detail,
  value,
  onValueChange,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  detail?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLead}>
        <View style={styles.rowIcon}>
          <MaterialIcons name={icon} size={18} color={storyTheme.navy} />
        </View>
        <View style={styles.rowTextWrap}>
          <Text style={styles.rowTitle}>{title}</Text>
          {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#d8cdbd", true: `${storyTheme.mint}88` }}
        thumbColor={value ? storyTheme.mint : storyTheme.white}
      />
    </View>
  );
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  editable = true,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  editable?: boolean;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8f8779"
        editable={editable}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && styles.primaryButtonPressed,
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function InfoCard({
  title,
  copy,
  accent = storyTheme.paperSoft,
}: {
  title: string;
  copy: string;
  accent?: string;
}) {
  return (
    <View style={[styles.infoCard, { backgroundColor: accent }]}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoCopy}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: storyTheme.paper,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 18,
  },
  headerCard: {
    borderRadius: 28,
    backgroundColor: storyTheme.paperSoft,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 18,
    gap: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: storyTheme.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: {
    gap: 6,
  },
  headerTitle: {
    color: storyTheme.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },
  headerCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: storyTheme.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  sectionCard: {
    backgroundColor: storyTheme.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: storyTheme.line,
    overflow: "hidden",
  },
  row: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e7d8",
  },
  rowLead: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eef2f9",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextWrap: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: storyTheme.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  rowDetail: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rowValue: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: storyTheme.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  input: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: storyTheme.line,
    backgroundColor: storyTheme.white,
    color: storyTheme.ink,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 120,
    paddingTop: 14,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: storyTheme.navy,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primaryButtonPressed: {
    backgroundColor: storyTheme.navyPressed,
  },
  primaryButtonText: {
    color: storyTheme.white,
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: storyTheme.paperSoft,
    borderWidth: 1,
    borderColor: storyTheme.line,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: storyTheme.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  infoCard: {
    borderRadius: 24,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: storyTheme.line,
  },
  infoTitle: {
    color: storyTheme.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  infoCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  pressed: {
    opacity: 0.88,
  },
});
