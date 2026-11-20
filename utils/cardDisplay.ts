import { type CollectionCard } from "../components/CardModal";
import { RARITY_MAP } from "../constants/gameData";

export type StatTile = {
  label: string;
  value: string;
  // Card colors, drawn as dots next to the value.
  colors?: string[];
};

// Dot colors for the card colors punk-records uses.
export const CARD_COLOR_HEX: Record<string, string> = {
  Red: "#e5484d",
  Green: "#30a46c",
  Blue: "#3e63dd",
  Purple: "#8e4ec6",
  Black: "#3a3a3a",
  Yellow: "#f5d90a",
};

// Stored lists are "/"-joined (e.g. "Red/Green").
export const splitList = (value: string): string[] =>
  value
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

// The subtitle under the name, e.g. "ANIMAL · ALABASTA" (case set by the UI).
export const getTraitsLine = (traits: string): string =>
  splitList(traits).join(" · ");

// Short rarity code ("SR", "L") from the stored full name ("SuperRare").
export const getRarityCode = (rarity: string): string =>
  Object.entries(RARITY_MAP).find(([, full]) => full === rarity)?.[0] ?? "";

// Characters and Leaders always have a power, even a printed 0. The database
// stores a missing power as 0 too, so Events and Stages are told apart by
// type and only show one when it's above 0.
const hasPower = (card: Pick<CollectionCard, "type" | "power">): boolean =>
  (card.power ?? 0) > 0 || card.type === "Character" || card.type === "Leader";

// The stat tiles of the info box. Tiles with no value are left out, e.g.
// Events have no power or counter. A Leader's cost is its life.
export const getStatTiles = (
  card: Pick<
    CollectionCard,
    "type" | "cost" | "power" | "attribute" | "color" | "counter"
  >,
): StatTile[] => {
  const colors = splitList(card.color);
  const attributes = splitList(card.attribute);

  const tiles: (StatTile | null)[] = [
    card.cost === null
      ? null
      : {
          label: card.type === "Leader" ? "Life" : "Cost",
          value: String(card.cost),
        },
    hasPower(card) ? { label: "Power", value: String(card.power ?? 0) } : null,
    colors.length > 0
      ? { label: "Color", value: colors.join(" / "), colors }
      : null,
    card.counter ? { label: "Counter", value: String(card.counter) } : null,
    attributes.length > 0
      ? { label: "Attribute", value: attributes.join(" / ") }
      : null,
  ];
  return tiles.filter((tile): tile is StatTile => tile !== null);
};
