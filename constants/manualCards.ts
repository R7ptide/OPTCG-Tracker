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
  // ----- ILUSTRATION BOX -----
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
  "OP05-062_m1": {
    attributes: ["Special"],
    card_id: "OP05-062",
    category: "Character",
    colors: ["Purple"],
    cost: 1,
    counter: 1000,
    img_url:
      "https://en.onepiece-cardgame.com/images/products/other/ib01/OP05-062.png",
    keywords: ["Blocker"],
    name: "O-Nami",
    pack_id: "569105",
    power: 1000,
    rarity: "Uncommon",
    types: ["Straw Hat Crew"],
  },
  "OP08-074_m1": {
    attributes: ["Special"],
    card_id: "OP08-074",
    category: "Character",
    colors: ["Purple"],
    cost: 3,
    counter: 2000,
    img_url:
      "https://en.onepiece-cardgame.com/images/products/other/ib02/OP08-074.png",
    keywords: ["Activate: Main", "Once Per Turn"],
    name: "Black Maria",
    pack_id: "569108",
    power: 2000,
    rarity: "SuperRare",
    types: ["Animal Kingdom Pirates"],
  },
  "ST13-016_m1": {
    attributes: ["Strike"],
    card_id: "ST13-016",
    category: "Character",
    colors: ["Yellow"],
    cost: 5,
    counter: 2000,
    img_url:
      "https://en.onepiece-cardgame.com/images/products/other/ib02/ST13-016.png",
    keywords: ["Rush", "On Play"],
    name: "Yamato",
    pack_id: "569013",
    power: 4000,
    rarity: "Common",
    types: ["Land of Wano"],
  },
  "OP07-109_m1": {
    attributes: ["Strike"],
    card_id: "OP07-109",
    category: "Character",
    colors: ["Yellow"],
    cost: 5,
    counter: 1000,
    img_url:
      "https://en.onepiece-cardgame.com/images/products/other/ib03/OP07-109.png",
    keywords: ["Activate: Main"],
    name: "Monkey.D.Luffy",
    pack_id: "569107",
    power: 6000,
    rarity: "SuperRare",
    types: ["The Four Emperors", "Egghead", "Straw Hat Crew"],
  },
  "OP07-113_m1": {
    attributes: ["Slash"],
    card_id: "OP07-113",
    category: "Character",
    colors: ["Yellow"],
    cost: 5,
    counter: 1000,
    img_url:
      "https://en.onepiece-cardgame.com/images/products/other/ib03/OP07-113.png",
    keywords: [],
    name: "Roronoa Zoro",
    pack_id: "569107",
    power: 6000,
    rarity: "Uncommon",
    types: ["Egghead", "Straw Hat Crew"],
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
  // ----- ILUSTRATION BOX -----
};
