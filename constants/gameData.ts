import AsyncStorage from "@react-native-async-storage/async-storage";

const range = (count: number, prefix: string): string[] =>
  Array.from(
    { length: count },
    (_, i) => `${prefix}${String(i + 1).padStart(2, "0")}`,
  );

export const fetchGameData = async () => {
  try {
    const url = `https://gist.githubusercontent.com/R7ptide/5155dcc8ccdc76e98377ca1214f292d0/raw/gameData.json?t=${Date.now()}`;
    const response = await fetch(url);
    const data = await response.json();

    await AsyncStorage.setItem("@game_data", JSON.stringify(data));
    return data;
  } catch (error) {
    const cachedData = await AsyncStorage.getItem("@game_data");
    if (cachedData) return JSON.parse(cachedData);

    return {
      mainSetCount: 16,
      extraBoosterCount: 4,
      starterDeckCount: 30,
      premiumBoostersCount: 2,
    };
  }
};

export type FilterKey = "colors" | "types" | "rarities";

export type FilterGroup = {
  key: FilterKey;
  label: string;
  options: readonly string[];
};

export const FILTER_GROUPS: readonly FilterGroup[] = [
  {
    key: "colors",
    label: "Color",
    options: ["Red", "Green", "Blue", "Purple", "Black", "Yellow"],
  },
  {
    key: "types",
    label: "Card Type",
    options: ["Leader", "Character", "Event", "Stage"],
  },
  {
    key: "rarities",
    label: "Rarity",
    options: ["C", "UC", "R", "SR", "SEC", "L", "SP", "TR"],
  },
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
