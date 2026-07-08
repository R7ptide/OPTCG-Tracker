const range = (count: number, prefix: string): string[] =>
  Array.from({ length: count }, (_, i) => `${prefix}${String(i + 1).padStart(2, "0")}`);

export const MAIN_SETS = range(16, "OP");
export const EXTRA_BOOSTERS = range(4, "EB");
export const STARTER_DECKS = range(30, "ST");
export const PREMIUM_BOOSTERS = ["PRB01", "PRB02"] as const;

export type FilterKey = "colors" | "types" | "rarities";

export type FilterGroup = {
  key: FilterKey;
  label: string;
  options: readonly string[];
};

export const FILTER_GROUPS: readonly FilterGroup[] = [
  { key: "colors", label: "Color", options: ["Red", "Green", "Blue", "Purple", "Black", "Yellow"] },
  { key: "types", label: "Card Type", options: ["Leader", "Character", "Event", "Stage"] },
  { key: "rarities", label: "Rarity", options: ["C", "UC", "R", "SR", "SEC", "L", "SP", "TR"] },
];

export const RARITY_MAP: Record<string, string> = {
  C: "Common",
  UC: "Uncommon",
  R: "Rare",
  SR: "SuperRare",
  SEC: "SecretRare",
  L: "Leader",
  SP: "Special",
  TR: "TreasureRare",
};
