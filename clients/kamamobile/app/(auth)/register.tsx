import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function RegisterScreen() {
  const { signUp, signInWithGoogle, isLoading } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setError(null);
    try {
      await signUp(username.trim(), email.trim(), password);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Unable to create account.");
      }
    }
  }

  async function handleGoogleSignUp() {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError((e as Error).message || "Google sign up failed.");
      }
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 24,
        justifyContent: "center",
        gap: 14,
      }}
    >
      <Text style={{ fontSize: 28, color: colors.text, fontWeight: "700" }}>
        Create account
      </Text>
      <Text style={{ color: colors.textSecondary }}>
        Start your adventure with Kama Mobile.
      </Text>

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        style={{
          backgroundColor: colors.card,
          color: colors.text,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          backgroundColor: colors.card,
          color: colors.text,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        style={{
          backgroundColor: colors.card,
          color: colors.text,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      />

      {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}

      <Pressable
        onPress={handleRegister}
        disabled={isLoading}
        style={{
          backgroundColor: colors.primary,
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.background, fontWeight: "700" }}>
          {isLoading ? "Creating..." : "Create Account"}
        </Text>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>OR</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      <Pressable
        onPress={handleGoogleSignUp}
        disabled={isLoading}
        style={{
          backgroundColor: colors.primary,
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Text style={{ color: colors.background, fontWeight: "700" }}>
          {isLoading ? "Creating..." : "Sign up with Google"}
        </Text>
      </Pressable>

      <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
        Already have an account?{" "}
        <Link href="/(auth)/login" style={{ color: colors.primary }}>
          Sign in
        </Link>
      </Text>
    </View>
  );
}
