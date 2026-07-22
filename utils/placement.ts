export type PlacementParseResult =
  | { ok: true; value: number | null }
  | { ok: false };

// Empty input means "no placement set" (ok, value: null).
// Anything else must be a positive integer (1, 2, 3...) — no zero, negatives, or decimals.
export const parsePlacementInput = (input: string): PlacementParseResult => {
  const trimmed = input.trim();
  if (!trimmed) return { ok: true, value: null };

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) return { ok: false };

  return { ok: true, value: parsed };
};
