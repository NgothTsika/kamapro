import { apiRequest } from "@/lib/api/client";
import type { ApiEnvelope, DashboardData, HeartState, StreakState } from "@/lib/api/types";

export async function getHearts(token: string): Promise<HeartState> {
  const response = await apiRequest<ApiEnvelope<HeartState>>("/gamification/hearts", {
    token,
  });
  return response.data;
}

export async function getStreak(token: string): Promise<StreakState> {
  const response = await apiRequest<ApiEnvelope<StreakState>>(
    "/gamification/streaks",
    { token },
  );
  return response.data;
}

export async function getDashboard(token: string): Promise<DashboardData> {
  const response = await apiRequest<ApiEnvelope<DashboardData>>(
    "/gamification/dashboard",
    { token },
  );
  return response.data;
}
