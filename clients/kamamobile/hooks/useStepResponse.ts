import { useState } from "react";
import { kama } from "../lib/kama-api";

export function useStepResponse() {
  const [loading, setLoading] = useState(false);

  async function submitResponse(data: {
    lessonId: string;
    chapterId: string;
    stepId: string;
    type: "poll" | "choice" | "quiz";
    selectedOption: number;
    chosenStepId?: string;
  }) {
    try {
      setLoading(true);
      await kama.respondToStep(data);
    } catch (err) {
      console.error("Failed to submit response:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { submitResponse, loading };
}
