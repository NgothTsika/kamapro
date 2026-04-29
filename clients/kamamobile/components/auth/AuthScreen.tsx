import { Link } from "expo-router";
import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const blueLogo = require("../../assets/KamaGame/Blue/android/playstore-icon.png");

type Field = {
  key: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
};

type AuthScreenProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  submitLabel: string;
  googleLabel: string;
  footerPrompt: string;
  footerLinkLabel: string;
  footerHref: "/(auth)/login" | "/(auth)/register";
  fields: Field[];
  error?: string | null;
  isLoading?: boolean;
  onSubmit: () => void;
  onGooglePress: () => void;
};

export function AuthScreen({
  eyebrow,
  title,
  subtitle,
  submitLabel,
  googleLabel,
  footerPrompt,
  footerLinkLabel,
  footerHref,
  fields,
  error,
  isLoading,
  onSubmit,
  onGooglePress,
}: AuthScreenProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: "100%", alignItems: "center", gap: 12 }}>
            <View style={styles.logoBadge}>
              <Image
                source={blueLogo}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.formCard}>
            {fields.map((field) => (
              <View key={field.key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{field.placeholder}</Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.onChangeText}
                  placeholder={field.placeholder}
                  placeholderTextColor="#8c7d70"
                  autoCapitalize={field.autoCapitalize ?? "none"}
                  secureTextEntry={field.secureTextEntry}
                  keyboardType={field.keyboardType}
                  style={styles.input}
                />
              </View>
            ))}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              onPress={onSubmit}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                isLoading && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? "Please wait..." : submitLabel}
              </Text>
            </Pressable>

            <View style={styles.separatorRow}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>OR</Text>
              <View style={styles.separatorLine} />
            </View>

            <Pressable
              onPress={onGooglePress}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.googleButton,
                pressed && styles.googleButtonPressed,
                isLoading && styles.buttonDisabled,
              ]}
            >
              <View style={styles.googleMark}>
                <Text style={styles.googleMarkText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>
                {isLoading ? "Please wait..." : googleLabel}
              </Text>
            </Pressable>

            <Text style={styles.footerText}>
              {footerPrompt}{" "}
              <Link href={footerHref} style={styles.footerLink}>
                {footerLinkLabel}
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: "#f7eddc",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 20,
  },
  backgroundOrbTop: {
    position: "absolute",
    top: -80,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#204c83",
    opacity: 0.14,
  },
  backgroundOrbBottom: {
    position: "absolute",
    bottom: -70,
    left: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#d69a4a",
    opacity: 0.16,
  },
  logoBadge: {
    width: 74,
    height: 74,
    overflow: "hidden",
    borderRadius: 32,
    backgroundColor: "#18375d",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  eyebrow: {
    color: "#f7d489",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
  },
  subtitle: {
    color: "#d7e2f2",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  tagText: {
    color: "#eff4fb",
    fontSize: 12,
    fontWeight: "800",
  },
  formCard: {
    borderRadius: 28,
    backgroundColor: "#fbf4e7",
    borderWidth: 1,
    borderColor: "#eadbc4",
    padding: 20,
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: "#21314f",
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d8cab6",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    color: "#21314f",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#b44a3e",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 20,
    backgroundColor: "#1d3f69",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonPressed: {
    backgroundColor: "#173352",
  },
  googleButton: {
    minHeight: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d8cab6",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  googleButtonPressed: {
    backgroundColor: "#f4ecdf",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  googleButtonText: {
    color: "#21314f",
    fontSize: 15,
    fontWeight: "800",
  },
  googleMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  googleMarkText: {
    color: "#1d3f69",
    fontSize: 14,
    fontWeight: "900",
  },
  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0d3c1",
  },
  separatorText: {
    color: "#8c7d70",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  footerText: {
    color: "#6a7588",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  footerLink: {
    color: "#1d3f69",
    fontWeight: "900",
  },
});
