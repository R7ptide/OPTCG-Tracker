// How the bracketed keywords in card effect text are drawn, e.g. [Blocker].
// Anything not listed here (card names like [Sanji]) stays plain text.
export type KeywordShape = "square" | "rounded";

export type KeywordStyle = {
  shape: KeywordShape;
  background: string;
  text: string;
  // Only the black chips need an outline, so they stay visible on dark.
  border?: string;
};

const BLUE: Omit<KeywordStyle, "shape"> = {
  background: "#2563eb",
  text: "#ffffff",
};
const ORANGE: Omit<KeywordStyle, "shape"> = {
  background: "#ea580c",
  text: "#ffffff",
};
const RED: Omit<KeywordStyle, "shape"> = {
  background: "#dc2626",
  text: "#ffffff",
};
const YELLOW: Omit<KeywordStyle, "shape"> = {
  background: "#facc15",
  text: "#111111",
};
const BLACK: Omit<KeywordStyle, "shape"> = {
  background: "#111111",
  text: "#ffffff",
  border: "#6b6b6b",
};

const square = (color: Omit<KeywordStyle, "shape">): KeywordStyle => ({
  shape: "square",
  ...color,
});

export const KEYWORD_STYLES: Record<string, KeywordStyle> = {
  // Timing: blue
  "Activate: Main": square(BLUE),
  "When Attacking": square(BLUE),
  "On K.O.": square(BLUE),
  "On Play": square(BLUE),
  "End of Your Turn": square(BLUE),
  Main: square(BLUE),
  "Opponent's Turn": square(BLUE),
  "Your Turn": square(BLUE),
  "On Block": square(BLUE),
  "On Your Opponent's Attack": square(BLUE),

  // Abilities: orange
  Blocker: square(ORANGE),
  Banish: square(ORANGE),
  "Double Attack": square(ORANGE),
  Rush: square(ORANGE),
  "Rush: Character": square(ORANGE),
  Unblockable: square(ORANGE),

  // Others
  Trigger: square(YELLOW),
  Counter: square(RED),
  "Once Per Turn": { shape: "rounded", ...RED },
};

// "DON!! x1", "DON!! x2" and "DON!! -1" are one family, black squares.
const DON_PATTERN = /^DON!! [x\-−–]\s?\d+$/;

export const getKeywordStyle = (keyword: string): KeywordStyle | null => {
  if (DON_PATTERN.test(keyword)) return square(BLACK);
  return KEYWORD_STYLES[keyword] ?? null;
};
