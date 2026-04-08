import { getMe, loginWithEmail, logout, registerWithEmail, type UserProfile } from "@/lib/api";
import { clearToken, loadToken, saveToken } from "@/lib/auth/token-storage";
import { useRouter } from "expo-router";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthContextValue = {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isBootstrapping: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
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
