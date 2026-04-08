import { apiRequest } from "@/lib/api/client";
import type { AuthResponse, UserProfile } from "@/lib/api/types";

export async function loginWithEmail(input: {
  email: string;
  password: string;
  language?: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/email", {
    method: "POST",
    body: input,
  });
}

export async function registerWithEmail(input: {
  username: string;
  email: string;
  password: string;
  language?: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export async function getMe(token: string): Promise<UserProfile> {
  const response = await apiRequest<{ user: UserProfile }>("/auth/me", { token });
  return response.user;
}

export async function logout(token: string): Promise<void> {
  await apiRequest<void>("/auth/logout", {
    method: "POST",
    token,
  });
}
