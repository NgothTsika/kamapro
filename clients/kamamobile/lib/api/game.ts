import { apiRequest } from "@/lib/api/client";
import type { MatchSummary } from "@/lib/api/types";

export async function quickPlayMatch(input: {
  token: string;
  quizPool: string[];
  topicId?: string;
  maxRounds?: number;
}): Promise<{ isNew: boolean; match: MatchSummary }> {
  const { token, ...body } = input;
  return apiRequest<{ isNew: boolean; match: MatchSummary }>(
    "/game/matches/quickplay",
    {
      method: "POST",
      token,
      body,
    },
  );
}
