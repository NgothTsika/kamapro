import { ApiError } from "@/lib";
import { useAuth } from "@/lib/auth/auth-context";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { useState } from "react";

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
    <AuthScreen
      eyebrow="Join Kama"
      title="Start your journey"
      subtitle="Create your learning passport and explore story-first lessons built around Africa's legends and voices."
      submitLabel="Create Account"
      googleLabel="Sign up with Google"
      footerPrompt="Already have an account?"
      footerLinkLabel="Sign in"
      footerHref="/(auth)/login"
      fields={[
        {
          key: "username",
          value: username,
          onChangeText: setUsername,
          placeholder: "Username",
        },
        {
          key: "email",
          value: email,
          onChangeText: setEmail,
          placeholder: "Email",
          keyboardType: "email-address",
        },
        {
          key: "password",
          value: password,
          onChangeText: setPassword,
          placeholder: "Password",
          secureTextEntry: true,
        },
      ]}
      error={error}
      isLoading={isLoading}
      onSubmit={handleRegister}
      onGooglePress={handleGoogleSignUp}
    />
  );
}
