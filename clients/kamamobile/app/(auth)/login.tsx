import { ApiError } from "@/lib";
import { useAuth } from "@/lib/auth/auth-context";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { useState } from "react";

export default function LoginScreen() {
  const { signIn, signInWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Unable to sign in.");
      }
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError((e as Error).message || "Google sign in failed.");
      }
    }
  }

  return (
    <AuthScreen
      eyebrow="Welcome Back"
      title="Return to the story"
      subtitle="Pick up where you left off and keep discovering African legends, history, and culture."
      submitLabel="Sign In"
      googleLabel="Continue with Google"
      footerPrompt="New here?"
      footerLinkLabel="Create an account"
      footerHref="/(auth)/register"
      fields={[
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
      onSubmit={handleLogin}
      onGooglePress={handleGoogleLogin}
    />
  );
}
