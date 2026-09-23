// Manual card entries to fill gaps in the punk-records source (e.g. alt arts
// not yet indexed upstream). Keyed by card id - paste the entry in the exact
// shape punk-records uses (see e.g. https://raw.githubusercontent.com/buhbbl/
// punk-records/main/english/index/cards_by_id.json), card_id/counter/keywords/
// pack_id are harmless if included but unused by the app. Only used for ids
// the remote source doesn't already have - remote data always wins on
// conflict, so an entry here is dropped automatically once punk-records
// catches up.
export type PunkRecordCard = {
  card_id?: string;
  name?: string;
  colors?: string[];
  category?: string;
  cost?: number;
  power?: number;
  counter?: number | null;
  attributes?: string[];
  rarity?: string;
  img_url?: string;
  types?: string[];
  keywords?: string[];
  pack_id?: string;
};

export const MANUAL_CARDS: Record<string, PunkRecordCard> = {
  // "OP01-001_p3": {
  //   name: "Monkey.D.Luffy",
  //   colors: ["Red"],
  //   category: "Leader",
  //   cost: 0,
  //   power: 5000,
  //   attributes: ["Strike"],
  //   rarity: "SEC",
  //   img_url: "https://example.com/OP01-001_p3.png",
  //   types: ["Straw Hat Crew"],
  // },
  "ST17-004_m1": {
    attributes: ["Special"],
    card_id: "ST17-004",
    category: "Character",
    colors: ["Blue"],
    cost: 4,
    counter: null,
    img_url:
      "https://en.onepiece-cardgame.com/images/products/other/ib01/ST17-004.png",
    keywords: ["Blocker", "On Play"],
    name: "Boa Hancock",
    pack_id: "569017",
    power: 6000,
    rarity: "SuperRare",
    types: ["The Seven Warlords of the Sea", "Kuja Pirates"],
  },
  "ST12-003_m1": {
    attributes: ["Slash"],
    card_id: "ST12-003",
    category: "Character",
    colors: ["Green"],
    cost: 3,
    counter: 2000,
    img_url:
      "https://en.onepiece-cardgame.com/images/products/other/ib04/ST12-003.png",
    keywords: ["On Play"],
    name: "Dracule Mihawk",
    pack_id: "569012",
    power: 4000,
    rarity: "SuperRare",
    types: ["The Seven Warlords of the Sea", "Muggy Kingdom"],
  },
  "OP09-034_m1": {
    attributes: ["Special"],
    card_id: "OP09-034",
    category: "Character",
    colors: ["Green"],
    cost: 1,
    counter: 2000,
    img_url:
      "https://en.onepiece-cardgame.com/images/products/other/ib04/OP09-034.png",
    keywords: ["On Play"],
    name: "Perona",
    pack_id: "569109",
    power: 2000,
    rarity: "Rare",
    types: ["Muggy Kingdom", "Thriller Bark Pirates"],
  },
};
