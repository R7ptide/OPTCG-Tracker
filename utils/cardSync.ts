import { type CardRow } from "../database";
import { MANUAL_CARDS, type PunkRecordCard } from "../constants/manualCards";

export type PunkRecordDict = Record<string, PunkRecordCard>;

export type ServerVersion = {
  commit: string;
  updated_at: string;
};

// A device that never synced has no stored commit, so it counts as outdated.
export const isUpdateAvailable = (
  localCommit: string | null,
  serverCommit: string,
): boolean => localCommit !== serverCommit;

// One card as it appears in english/data/<pack_id>.json.
export type PackCard = {
  id: string;
  effect?: string | null;
  trigger?: string | null;
  block_number?: number | null;
};

export type CardDetails = {
  effect: string;
  trigger: string;
  block_number: number | null;
};

export type CardDetailsDict = Record<string, CardDetails>;

// The distinct packs referenced by the card list, so each pack file is
// downloaded once instead of once per card.
export const getPackIds = (cardsData: PunkRecordDict): string[] => {
  const ids = new Set<string>();
  for (const card of Object.values(cardsData)) {
    if (card.pack_id) ids.add(card.pack_id);
  }
  return [...ids];
};

// "" (not null) marks a card from a synced pack that simply has no text, so
// it still overwrites stale text when the upsert keeps old values for nulls.
export const toCardDetails = (packCards: PackCard[]): CardDetailsDict => {
  const details: CardDetailsDict = {};
  for (const card of packCards) {
    details[card.id] = {
      effect: card.effect ?? "",
      trigger: card.trigger ?? "",
      block_number: card.block_number ?? null,
    };
  }
  return details;
};

// Remote data wins over a manual entry for the same id, except the effect,
// trigger and block fields, where a manual value always wins. Cards from a
// pack that failed to download have no details and keep their stored text.
export const toCardRows = (
  cardsData: PunkRecordDict,
  details: CardDetailsDict = {},
): CardRow[] => {
  const manualEntries = Object.entries(MANUAL_CARDS).filter(
    ([cardId]) => !cardsData[cardId],
  );

  return [...Object.entries(cardsData), ...manualEntries]
    .filter(([cardId]) => !cardId.includes("_r"))
    .map(([cardId, card]) => {
      const manual = MANUAL_CARDS[cardId];
      const packed = details[cardId];
      // Safety net for a manual alt art with no text of its own: borrow the
      // base card's, e.g. ST17-004_m1 -> ST17-004.
      const base = cardId.includes("_")
        ? details[cardId.split("_")[0]]
        : undefined;

      const effect = manual?.effect ?? packed?.effect ?? base?.effect ?? null;
      const trigger =
        manual?.trigger ?? packed?.trigger ?? base?.trigger ?? null;
      const block =
        manual?.block_number ??
        packed?.block_number ??
        base?.block_number ??
        null;

      return {
        id: cardId,
        name: card.name ?? "Unknown",
        color: card.colors ? card.colors.join("/") : "",
        type: card.category ?? "",
        cost: card.cost ?? 0,
        power: card.power ?? 0,
        attribute: card.attributes ? card.attributes.join("/") : "",
        rarity: card.rarity ?? "",
        image_url: card.img_url ?? "",
        set_id: cardId.split("-")[0],
        traits: card.types ? card.types.join("/") : "",
        counter: card.counter ?? null,
        pack_id: card.pack_id ?? null,
        effect,
        trigger_text: trigger,
        block_number: block,
      };
    });
};
