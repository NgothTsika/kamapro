import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth/auth-context";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function RegisterScreen() {
  const { signUp, signInWithGoogle, isLoading } = useAuth();
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
        backgroundColor: "#121212",
        padding: 24,
        justifyContent: "center",
        gap: 14,
      }}
    >
      <Text style={{ fontSize: 28, color: "white", fontWeight: "700" }}>
        Create account
      </Text>
      <Text style={{ color: "#bdbdbd" }}>
        Start your adventure with Kama Mobile.
      </Text>

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        placeholderTextColor="#8a8a8a"
        autoCapitalize="none"
        style={{
          backgroundColor: "#1f1f1f",
          color: "white",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#8a8a8a"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          backgroundColor: "#1f1f1f",
          color: "white",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#8a8a8a"
        secureTextEntry
        style={{
          backgroundColor: "#1f1f1f",
          color: "white",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      />

      {error ? <Text style={{ color: "#ff7f7f" }}>{error}</Text> : null}

      <Pressable
        onPress={handleRegister}
        disabled={isLoading}
        style={{
          backgroundColor: "#f8d568",
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#1a1a1a", fontWeight: "700" }}>
          {isLoading ? "Creating..." : "Create Account"}
        </Text>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: "#404040" }} />
        <Text style={{ color: "#8a8a8a", fontSize: 12 }}>OR</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: "#404040" }} />
      </View>

      <Pressable
        onPress={handleGoogleSignUp}
        disabled={isLoading}
        style={{
          backgroundColor: "#ffffff",
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Text style={{ color: "#1a1a1a", fontWeight: "700" }}>
          {isLoading ? "Creating..." : "Sign up with Google"}
        </Text>
      </Pressable>

      <Text style={{ color: "#d0d0d0", textAlign: "center" }}>
        Already have an account?{" "}
        <Link href="/(auth)/login" style={{ color: "#f8d568" }}>
          Sign in
        </Link>
      </Text>
    </View>
  );
}
