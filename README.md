# One Piece Vault 🏴‍☠️

A local, offline-first native mobile application built to faithfully track massive One Piece TCG collections. Designed to map digital tracking directly to physical storage systems.

## Features Currently Implemented

- **Offline-First Native Database:** Powered by Expo SQLite. All card data, quantities, and collection stats are stored directly on the device's physical hardware. No cloud accounts or internet connections required to view your vault.
- **Master List Synchronization:** Pulls the absolute latest card dictionary (4,500+ cards) from the community-maintained `punk-records` repository. Updates the local database schema in seconds without requiring app updates.
- **Visual Completion Tracker:** Navigate through beautifully rendered digital binders for every official expansion (OP01–OP16, Extra Boosters, and ST01–ST30).
- **Dynamic Bandai Image Rendering:** Automatically constructs official Bandai image URLs based on card IDs.
- **Ghost Missing Cards:** Cards you own are rendered in full, vibrant color with their current playset quantity. Missing cards are rendered as faded "ghosts" so you know exactly what you need to complete a set.
- **Rapid Vault Entry:** A dedicated input interface to quickly scan and type set IDs to add cards to your physical collection.

## Tech Stack

- **Framework:** React Native / Expo
- **Navigation:** Expo Router (File-based routing)
- **Local Persistence:** `expo-sqlite`
- **Data Source:** `buhbbl/punk-records` GitHub JSON API

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

On first launch, click Sync Latest Sets Data on the Home Screen to populate the SQLite dictionary.

## Roadmap & Next Steps

- Advanced Filtering: Filter grids by color, cost, and card type (Leader, Character, Event).
- Event tracker
- Deck builder
