import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GITHUB_PACKS_URL,
  SERVER_TIMEOUT_MS,
  USE_FALLBACK,
  serverUrls,
} from "./server";
import { parseSets, type GameDataSets, type PacksJson } from "../utils/sets";

const GAME_DATA_CACHE_KEY = "@game_data_sets";

const range = (count: number, prefix: string): string[] =>
  Array.from(
    { length: count },
    (_, i) => `${prefix}${String(i + 1).padStart(2, "0")}`,
  );

// Last-resort lists for a first launch with no server and no cache.
const DEFAULT_SETS: GameDataSets = {
  mainSets: range(17, "OP"),
  extraBoosters: range(4, "EB"),
  starterDecks: range(36, "ST"),
  premiumBoosters: range(2, "PRB"),
};

const EMPTY_SETS: GameDataSets = {
  mainSets: [],
  extraBoosters: [],
  starterDecks: [],
  premiumBoosters: [],
};

const fetchPacks = async (url: string): Promise<PacksJson> => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(SERVER_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
};

export const fetchGameData = async (): Promise<GameDataSets> => {
  try {
    return await loadSets(serverUrls.packs);
  } catch (error) {
    // Without the fallback, surface the failure instead of masking it.
    if (!USE_FALLBACK) {
      console.error("Failed to load sets from server:", error);
      return EMPTY_SETS;
    }
  }

  try {
    return await loadSets(GITHUB_PACKS_URL);
  } catch {
    const cached = await AsyncStorage.getItem(GAME_DATA_CACHE_KEY);
    return cached ? JSON.parse(cached) : DEFAULT_SETS;
  }
};

const loadSets = async (url: string): Promise<GameDataSets> => {
  const sets = parseSets(await fetchPacks(url));
  await AsyncStorage.setItem(GAME_DATA_CACHE_KEY, JSON.stringify(sets));
  return sets;
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
