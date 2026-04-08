/**
 * Server stores quiz `options` and `optionImages` as Json — normalize for UI.
 */

export function normalizeStringList(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (typeof x === "string" ? x : x != null ? String(x) : ""))
      .filter((s) => s.length > 0);
  }
  if (typeof raw === "object") {
    const entries = Object.entries(raw as Record<string, unknown>);
    entries.sort(([a], [b]) => Number(a) - Number(b));
    return entries
      .map(([, v]) => (typeof v === "string" ? v : v != null ? String(v) : ""))
      .filter((s) => s.length > 0);
  }
  return [];
}

export function normalizeOptionImages(raw: unknown, optionCount: number): (string | null)[] {
  const list = normalizeStringList(raw);
  const out: (string | null)[] = [];
  for (let i = 0; i < optionCount; i += 1) {
    out.push(list[i] ?? null);
  }
  return out;
}

export type QuizTypeName =
  | "multiple_choice"
  | "true_false"
  | "image_choice"
  | "poll"
  | string;

export function normalizeQuizType(raw: unknown): QuizTypeName {
  if (typeof raw === "string" && raw.length > 0) return raw as QuizTypeName;
  return "multiple_choice";
}

/** Options for true/false when DB has empty or legacy shapes. */
export function defaultTrueFalseOptions(existing: string[]): string[] {
  if (existing.length >= 2) return existing;
  return ["True", "False"];
}
