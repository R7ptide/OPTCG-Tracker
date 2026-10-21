// Home server (punk-records CDN) the app syncs card data and images from.
export const SERVER_BASE_URL = "http://cdn.100.95.187.118.nip.io";

// When true, the app falls back to GitHub (card data) and the official site
// (images) if the server can't be reached. Turn off while testing so a broken
// server shows up as an error instead of being hidden by the fallback.
export const USE_FALLBACK = true;

// Short, so an unreachable server (e.g. off the tailnet) doesn't stall launch.
export const SERVER_TIMEOUT_MS = 3000;

// How long a card image may take from the server before we give up on it.
export const SERVER_IMAGE_TIMEOUT_MS = 5000;

// The card list is a few MB, so downloading it gets more time than a ping.
export const SERVER_DOWNLOAD_TIMEOUT_MS = 30000;

export const GITHUB_CARDS_URL =
  "https://raw.githubusercontent.com/buhbbl/punk-records/main/english/index/cards_by_id.json";

export const GITHUB_PACKS_URL =
  "https://raw.githubusercontent.com/buhbbl/punk-records/main/english/packs.json";

export const serverUrls = {
  version: `${SERVER_BASE_URL}/version.json`,
  cards: `${SERVER_BASE_URL}/english/index/cards_by_id.json`,
  packs: `${SERVER_BASE_URL}/english/packs.json`,
  image: (cardId: string): string =>
    `${SERVER_BASE_URL}/english/images/${cardId}.png`,
};
