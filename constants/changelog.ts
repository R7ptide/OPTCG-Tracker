// Newest release first. Each item is "<emoji> Title: description" - the
// What's New screen splits on the first colon. Add an entry here whenever
// the version in app.config.js is bumped (a test enforces they match).
export type Release = {
  version: string;
  // ISO date (YYYY-MM-DD) the release was prepared.
  date: string;
  items: string[];
};

export const CHANGELOG: Release[] = [
  {
    version: "1.7.0",
    date: "2026-11-19",
    items: [
      "🃏 Card Details: Tap a card and scroll down to see its type, attribute, cost or life, traits, power, counter, color, block and set.",
      "📜 Card Text: Each card now shows its effect and trigger text. Cards without text simply hide that section.",
      "🔄 One-time Sync: After updating, the app asks you to sync once so the card text can be downloaded.",
    ],
  },
  {
    version: "1.6.0",
    date: "2026-10-21",
    items: [
      "⚡ Faster Images: Card images now load from our own server, so they show up much faster. If the server can't be reached, they load from the official site as before.",
      "🔔 Card Updates: When new cards are available, the app asks you on launch if you want to sync. No more checking by hand.",
      "🗂️ Automatic Sets: The list of sets (OP, EB, ST, PRB) now updates itself when a new set comes out.",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-10-07",
    items: [
      "🛠️ Deck Builder: Build and manage decklists - pick a leader, search and filter cards by type, cost, counter, and rarity, with live 4-copy and color-legality checks.",
      "📊 Deck Stats: Deck settings show 2k counters, 1k counters, bricks, average cost, and a cost curve bar chart.",
      "🖼️ Export Decks: Share a decklist as an image, with your leader and full card grid laid out and branded.",
      "📋 Missing Cards: See exactly which cards (across all art variants) you still need from your collection to complete a deck.",
      "🛒 Cardmarket Export: Copy your missing cards from the Missing Cards page in a Cardmarket-ready format.",
      "📝 Copy Deck List: Copy a decklist to paste into the simulator.",
      "☁️ Deck Backups: Decks are now included in Google Drive backups and JSON exports.",
      "🔎 Leader Preview: Tap a deck's leader to view the card in a larger pop-up.",
      '🔢 Search by Set or Card ID: Type a set like "OP16" to list every card in it, or a full ID like "OP16-003" to find that exact card.',
      '🔍 Smarter Search: The collection search also matches card attribute (e.g. "Slash") and traits (e.g. "Straw Hat Crew"), not just name.',
      "🃏 Player vs Collector Mode: Switch how set completion is calculated - Player mode counts full playsets across art variants, Collector mode counts every individual card.",
      "🎴 Illustration Box Cards: Added the IB01-IB03 alternate arts.",
      "🐛 Search Fix: Card search and deck builder filters no longer hide cards past a result cap (e.g. high-cost cards).",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-08-11",
    items: [
      "☁️ Cloud Backup: Link your Google account to securely back up and restore your entire collection and tournament history via Google Drive.",
      "🎯 Playset Tracker: Quickly toggle your collection view to see exactly which cards you still need to finish a full playset.",
      "🔎 Global Search Filters: Filter search results across all sets by color, card type, and rarity, matching the filters already in each set's collection view.",
      "📈 More Accurate Stats: Tournament win rate no longer inflates your record with BYE rounds.",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-07-29",
    items: [
      "🔍 Advanced Tournament Search: Instantly filter your event history by tournament title or specific Leader names to find exactly what you are looking for.",
      "📊 Detailed Statistics Dashboard: Dive deeper into your performance! Includes dynamic matchup data, official Leader artwork filtering, and visual podium rankings for your best decks.",
      "✨ Streamlined Collection: We cleaned up the database! Duplicate cards caused by standard set reprints are now consolidated for a much smoother tracking experience.",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-07-23",
    items: [
      "🏆 Tournament Tracker: Log your tournaments and record every match, including the result, who went first, and a comment.",
    ],
  },
];

// Planned, not shipped yet.
export const ROADMAP: string[] = [
  "💰 Market Prices: Track the real-time financial value of individual cards and your overall collection.",
];

// The release to feature for an installed version: its own entry, or the
// newest one when the version isn't listed (e.g. a dev build). Everything
// else, newest first, is the history.
export const splitReleases = (
  version: string,
  releases: Release[] = CHANGELOG,
): { current: Release | null; previous: Release[] } => {
  const current =
    releases.find((release) => release.version === version) ??
    releases[0] ??
    null;
  return {
    current,
    previous: releases.filter((release) => release !== current),
  };
};
