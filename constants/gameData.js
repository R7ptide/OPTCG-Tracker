export const MAIN_SETS = Array.from(
  { length: 16 },
  (_, i) => `OP${String(i + 1).padStart(2, "0")}`,
);
export const EXTRA_BOOSTERS = Array.from(
  { length: 4 },
  (_, i) => `EB${String(i + 1).padStart(2, "0")}`,
);
export const PREMIUM_BOOSTERS = ["PRB01", "PRB02"];

export const RARITY_MAP = {
  C: "Common",
  UC: "Uncommon",
  R: "Rare",
  SR: "SuperRare",
  SEC: "SecretRare",
  L: "Leader",
  SP: "Special",
  TR: "TreasureRare",
};
