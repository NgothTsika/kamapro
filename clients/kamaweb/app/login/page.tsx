"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { setAdminToken } from "@/lib/admin-auth";
import { ApiError, getMe } from "@/lib/kama-api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";
  const reason = searchParams.get("reason");

  const [method, setMethod] = useState<"email" | "token" | "google">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function authenticateWithToken(authToken: string) {
    try {
      console.log("Calling getMe with token..."); // Debug log
      const user = await getMe(authToken);
      console.log("getMe response:", user); // Debug log

      if (!["ADMIN", "MODERATOR"].includes(user.role)) {
        throw new Error("Your account does not have admin access.");
      }

      console.log("Setting admin token and redirecting..."); // Debug log
      setAdminToken(authToken);
      router.replace(nextPath);
    } catch (err) {
      console.error("Token authentication error:", err); // Debug log
      if (err instanceof ApiError) {
        throw new Error(err.message);
      }
      throw new Error("Unable to authenticate with this token.");
    }
  }

  async function onSubmitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Use Next.js API route proxy instead of calling backend directly to avoid CORS issues
      const response = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          language: "en",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Authentication failed");
      }

      const data = await response.json();
      console.log("Auth email response:", data); // Debug log

      if (!data.token) {
        throw new Error("No token received from server");
      }

      console.log(
        "Authenticating with token:",
        data.token.substring(0, 20) + "...",
      ); // Debug log
      await authenticateWithToken(data.token);
    } catch (err) {
      console.error("Email login error:", err); // Debug log
      setError(err instanceof Error ? err.message : "Unable to authenticate.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authenticateWithToken(token.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to authenticate.");
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    setError(null);
    setLoading(true);
    try {
      // This would use Google OAuth in production
      // For now, show a helpful message
      setError(
        "Google OAuth requires additional setup. Please use email/password instead.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="size-5" />
            <span className="text-sm font-medium">KamaGame Admin</span>
          </div>
          <CardTitle>Admin Sign In</CardTitle>
          <CardDescription>
            Sign in with your admin credentials to access the dashboard.
          </CardDescription>
          {reason ? (
            <p className="text-xs text-amber-600">
              {reason === "forbidden"
                ? "This account is not allowed in admin."
                : "Your previous session expired. Please sign in again."}
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          {/* Method Selector */}
          <div className="mb-4 flex gap-2 rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => {
                setMethod("email");
                setError(null);
              }}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                method === "email"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Mail className="mr-1 inline size-4" />
              Email
            </button>
            <button
              onClick={() => {
                setMethod("token");
                setError(null);
              }}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                method === "token"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Lock className="mr-1 inline size-4" />
              Token
            </button>
          </div>

          {/* Email/Password Form */}
          {method === "email" && (
            <form className="space-y-4" onSubmit={onSubmitEmail}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="admin@kamagame.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <Button
                className="w-full"
                disabled={loading || !email || !password}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {/* Token Form */}
          {method === "token" && (
            <form className="space-y-4" onSubmit={onSubmitToken}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bearer Token
                </label>
                <Input
                  placeholder="Paste your admin token..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <Button className="w-full" disabled={loading || !token}>
                {loading ? "Verifying..." : "Verify Token"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <div className="mb-2 flex items-center gap-2">
                <Shield className="size-5" />
                <span className="text-sm font-medium">KamaGame Admin</span>
              </div>
              <CardTitle>Admin Sign In</CardTitle>
              <CardDescription>Loading sign in...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
