# R7-Pose

A premium, offline-first native mobile application built to faithfully track One Piece TCG collections and tournament results. Designed for collectors and players, it features smart playset calculations, advanced filtering, tournament/match logging, and complete data ownership.

## Key Features

- **Offline-First Native Database:** Powered by Expo SQLite. All card data, quantities, collection stats, and tournament history are stored directly on your device. No cloud accounts or internet connections required to view your vault.
- **Smart Playset Tracking:**
  - Automatically groups alt-arts with their base cards to calculate playset totals.
  - Color-coded completion badges: Turns green when you hit a full playset (4 copies for standard cards, 1 copy for Leaders), and yellow for incomplete sets.
- **Interactive Binder UI:** Missing cards are rendered as faded "ghosts." Tap any card to open a vibrant, full-resolution modal to quickly adjust your inventory (+/-).
- **Cross-Set Card Search:** Search your entire collection by card name from a single screen, without picking a set first.
- **Advanced Multi-Filter Drawer:** Slide-out side menu to instantly filter sets by:
  - Card Name (Text Search)
  - Color (Red, Green, Blue, Purple, Black, Yellow)
  - Type (Leader, Character, Event, Stage)
  - Rarity (C, UC, R, SR, SEC, L, SP, TR)
  - Toggle Missing/Owned cards
- **Tournament & Match Tracker:** Log tournaments with a title, description, date (backdatable for events you forgot to log), your leader, and an optional final placement. Record each round's opponent leader, result (Win/Loss/Bye), turn order, and freeform notes. Matches and tournaments are fully editable and deletable after the fact.
- **Light & Dark Mode:** Toggle in Settings; persists across app restarts.
- **Data Portability (Backup & Restore):** Fully export your physical collection to a JSON file and share it via Google Drive, WhatsApp, or email. Import backups to restore your data at any time.
- **Master List Synchronization:** Pulls the absolute latest card dictionary (4,500+ cards) from the community-maintained `punk-records` repository. Updates the local database schema in seconds without requiring app updates.
- **Crash Resilience:** A global error boundary and cold-start loading gate keep the app from showing a blank or broken screen if initialization ever fails.

## Tech Stack

- **Framework:** React Native / Expo (TypeScript)
- **Navigation:** Expo Router (File-based routing)
- **Local Persistence:** `expo-sqlite`, with a versioned migration system
- **File Management:** `expo-file-system`, `expo-sharing`, `expo-document-picker`
- **UI/Icons:** `@expo/vector-icons` (Ionicons), `@react-native-community/datetimepicker`
- **Data Source:** `buhbbl/punk-records` GitHub JSON API
- **Testing:** Jest + `ts-jest`, with `better-sqlite3` standing in for `expo-sqlite` in tests (real SQL semantics, no native RN runtime needed)
- **CI:** GitHub Actions — typecheck, lint, and test run on every push/PR to `main`

## Project Architecture

```text
 app/                       # Application screens and routing (Expo Router)
  ├── _layout.tsx           # Global navigation stack, theme + settings context
  ├── index.tsx             # Home screen & Vault Overview
  ├── settings.tsx          # Data management, theme toggle, backup/restore
  ├── collection/           # Set menus, set detail, cross-set search
  └── tournaments/          # Tournament list, create, and detail/match logging screens
 components/                # Reusable UI elements
  ├── CardModal.tsx         # Interactive add/remove popup
  ├── FilterDrawer.tsx      # Multi-select slide-out menu
  ├── LeaderPicker.tsx      # Leader-only card picker (used by tournament forms)
  └── ErrorBoundary.tsx     # Global crash screen
 constants/                 # Configuration and static data
  ├── gameData.ts           # Set arrays, rarity mappings
  └── theme.ts              # Dark/light color palettes, spacing, typography
 repositories/               # All SQLite queries, grouped by domain
  ├── cards.ts, collection.ts, settings.ts, tournaments.ts
 hooks/                      # Custom React hooks (useSync, useFilters)
 utils/                      # Small pure helpers (date formatting, placement parsing)
 database.ts                 # SQLite connection + versioned migrations
 tests/                      # Jest unit tests (repositories, database, utils)
 .github/workflows/ci.yml    # Typecheck + lint + test on every push/PR
```

## How to Run Locally

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Start the Expo development server:

```bash
npx expo start -c
```

4. Scan the QR code with the Expo Go app on your physical device.

   > **Note:** the app depends on `@react-native-community/datetimepicker`, a native module. Plain Expo Go supports it out of the box on recent SDKs, but if you hit a native-module error, run `npx expo prebuild` or build a custom dev client instead.

5. On first launch, navigate to the Settings screen and click Sync Latest Master List to populate the SQLite dictionary.

## Development Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm test            # jest — repository, database, and util tests
```

All three run automatically in CI on every push/PR to `main`.

## Roadmap & Next Steps

- **Visual Progress Bars**: Add filling progress bars to the main Sets menu to visualize completion percentages at a glance.
- **Tournament Statistics**: Aggregate win-rate breakdowns by opponent leader, own leader, and turn order across all logged tournaments.
- **Deck Builder**: Create and save 50-card lists, cross-referencing against the SQLite vault to identify missing physical cards needed to finish a deck.
- **Automated Backups**: Scheduled/automatic collection backups, beyond the current manual export flow.
