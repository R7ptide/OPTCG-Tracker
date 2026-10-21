export type GameDataSets = {
  mainSets: string[];
  extraBoosters: string[];
  starterDecks: string[];
  premiumBoosters: string[];
};

export type PacksJson = Record<
  string,
  { title_parts?: { label?: string | null } }
>;

const SET_PATTERN = /(OP|EB|ST|PRB)-?(\d+)/g;

const byNumber = (a: string, b: string): number =>
  Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, ""));

// Builds the set lists from punk-records' packs.json. Labels are usually a
// single set ("OP-01"), but some packs carry two ("OP14-EB04"), so every
// match in a label counts. Packs without a label (promos, "other product")
// are skipped.
export const parseSets = (packs: PacksJson): GameDataSets => {
  const ids = new Set<string>();

  for (const pack of Object.values(packs)) {
    const label = pack.title_parts?.label;
    if (!label) continue;
    for (const [, prefix, num] of label.matchAll(SET_PATTERN)) {
      ids.add(`${prefix}${num.padStart(2, "0")}`);
    }
  }

  const withPrefix = (prefix: string): string[] =>
    [...ids].filter((id) => id.startsWith(prefix)).sort(byNumber);

  return {
    mainSets: withPrefix("OP"),
    extraBoosters: withPrefix("EB"),
    starterDecks: withPrefix("ST"),
    premiumBoosters: withPrefix("PRB"),
  };
};
