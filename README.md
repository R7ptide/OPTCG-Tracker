# One Piece Vault

A premium, offline-first native mobile application built to faithfully track One Piece TCG collections. Designed for collectors and players, it features smart playset calculations, advanced filtering, and complete data ownership.

## Key Features

- **Offline-First Native Database:** Powered by Expo SQLite. All card data, quantities, and collection stats are stored directly on your device. No cloud accounts or internet connections required to view your vault.
- **Smart Playset Tracking:**
  - Automatically groups alt-arts with their base cards to calculate playset totals.
  - Color-coded completion badges: Turns green when you hit a full playset (4 copies for standard cards, 1 copy for Leaders), and yellow for incomplete sets.
- **Interactive Binder UI:** Missing cards are rendered as faded "ghosts." Tap any card to open a vibrant, full-resolution modal to quickly adjust your inventory (+/-).
- **Advanced Multi-Filter Drawer:** Slide-out side menu to instantly filter sets by:
  - Card Name (Text Search)
  - Color (Red, Green, Blue, Purple, Black, Yellow)
  - Type (Leader, Character, Event, Stage)
  - Rarity (C, UC, R, SR, SEC, L, SP, TR)
  - Toggle Missing/Owned cards
- **Data Portability (Backup & Restore):** Fully export your physical collection to a JSON file and share it via Google Drive, WhatsApp, or email. Import backups to restore your data at any time.
- **Master List Synchronization:** Pulls the absolute latest card dictionary (4,500+ cards) from the community-maintained `punk-records` repository. Updates the local database schema in seconds without requiring app updates.

## Tech Stack

- **Framework:** React Native / Expo
- **Navigation:** Expo Router (File-based routing)
- **Local Persistence:** `expo-sqlite`
- **File Management:** `expo-file-system`, `expo-sharing`, `expo-document-picker`
- **UI/Icons:** `@expo/vector-icons` (Ionicons)
- **Data Source:** `buhbbl/punk-records` GitHub JSON API

## Project Architecture

```text
 app/                   # Application screens and routing
  ├── _layout.jsx       # Global navigation stack
  ├── index.jsx         # Home screen & Vault Overview
  ├── settings.jsx      # Data management
  └── collection/       # Set menus for the collection
 components/            # Reusable UI elements
  ├── CardModal.jsx     # Interactive add/remove popup
  └── FilterDrawer.jsx  # Multi-select slide-out menu
 constants/             # Configuration and static data
 └── gameData.js        # Set arrays, rarity mappings
 hooks/                 # Custom React hooks
 database.js            # SQLite initialization and queries
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
5. On first launch, navigate to the Settingsscreen and click Sync Latest Master List to populate the SQLite dictionary.

## Roadmap & Next Steps

- **Visual Progress Bars**: Add filling progress bars to the main Sets menu to visualize completion percentages at a glance.
- **Tournament & Match Tracker**: A logging system to record local matches, opponent Leaders, and track win rates against specific meta decks.
- **Deck Builder**: Create and save 50-card lists, cross-referencing against the SQLite vault to identify missing physical cards needed to finish a deck.
