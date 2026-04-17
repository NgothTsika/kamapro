import {
  getMe,
  loginWithEmail,
  loginWithGoogle,
  logout,
  registerWithEmail,
  type UserProfile,
} from "@/lib";
import { clearToken, loadToken, saveToken } from "@/lib/auth/token-storage";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Platform } from "react-native";

// Google OAuth Client IDs
const GOOGLE_CLIENT_IDS = {
  ios: "558389557921-q5ncmqk6v8tdlub0627pkp1bi0she93n.apps.googleusercontent.com",
  android:
    "558389557921-4m38u0474fi4naqql3sakmh2iri28h9m.apps.googleusercontent.com",
  web: "558389557921-ss8viikrjsfabtoct3cle0thi0iokst2.apps.googleusercontent.com",
};

type AuthContextValue = {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isBootstrapping: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const router = useRouter();

  const clientId =
    Platform.OS === "ios"
      ? GOOGLE_CLIENT_IDS.ios
      : Platform.OS === "android"
        ? GOOGLE_CLIENT_IDS.android
        : GOOGLE_CLIENT_IDS.web;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId,
    iosClientId: GOOGLE_CLIENT_IDS.ios,
    androidClientId: GOOGLE_CLIENT_IDS.android,
    webClientId: GOOGLE_CLIENT_IDS.web,
  });

  // Warm up browser
  useEffect(() => {
    WebBrowser.warmUpAsync();
  }, []);

  useEffect(() => {
    async function bootstrapAuth() {
      try {
        const storedToken = await loadToken();
        if (!storedToken) return;

        const me = await getMe(storedToken);
        setToken(storedToken);
        setUser(me);
      } catch {
        await clearToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrapAuth();
  }, []);

  async function signIn(email: string, password: string) {
    setIsLoading(true);
    try {
      const response = await loginWithEmail({ email, password });
      await saveToken(response.token);
      setToken(response.token);
      setUser(response.user);
      router.replace("/(tabs)/home");
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(username: string, email: string, password: string) {
    setIsLoading(true);
    try {
      const response = await registerWithEmail({ username, email, password });
      await saveToken(response.token);
      setToken(response.token);
      setUser(response.user);
      router.replace("/(tabs)/home");
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithGoogle() {
    setIsLoading(true);
    try {
      await promptAsync();
      if (response?.type === "success" && response.authentication) {
        const { idToken, accessToken } = response.authentication;
        if (!idToken || !accessToken) {
          throw new Error("Failed to get authentication tokens from Google");
        }

        const authResponse = await loginWithGoogle({
          idToken,
          accessToken,
        });

        await saveToken(authResponse.token);
        setToken(authResponse.token);
        setUser(authResponse.user);
        router.replace("/(tabs)/home");
      } else if (response?.type === "error") {
        throw new Error(
          response.error?.message || "Google authentication failed",
        );
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    setIsLoading(true);
    try {
      if (token) {
        await logout(token);
      }
    } finally {
      await clearToken();
      setToken(null);
      setUser(null);
      setIsLoading(false);
      router.replace("/(auth)/login");
    }
  }

  async function refreshMe() {
    if (!token) return;
    const response = await getMe(token);
    setUser(response);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isBootstrapping,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      refreshMe,
    }),
    [user, token, isLoading, isBootstrapping],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
