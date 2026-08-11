import { type MatchRow, type TournamentRow } from "../database";
import {
  getAllCollectionRows,
  restoreCollection,
  type BackupRow,
} from "./collection";
import {
  getAllTournamentRows,
  getAllMatchRows,
  restoreTournaments,
  restoreMatches,
} from "./tournaments";

// Bumped whenever the payload shape changes, so restore can tell old
// backups apart from new ones and stay compatible with both.
export const BACKUP_VERSION = 2;

export type BackupPayload = {
  version: number;
  exportedAt: string;
  collection: BackupRow[];
  tournaments: TournamentRow[];
  matches: MatchRow[];
};

// Full collection + tournaments + matches dump, used by both the manual
// JSON export and the future Google Drive backup so the two stay in sync.
export const buildBackupPayload = (): BackupPayload => ({
  version: BACKUP_VERSION,
  exportedAt: new Date().toISOString(),
  collection: getAllCollectionRows(),
  tournaments: getAllTournamentRows(),
  matches: getAllMatchRows(),
});

// Pre-v2 exports were a bare array of collection rows (no tournaments).
// Detect that shape so old backups still import.
export const isLegacyCollectionBackup = (data: unknown): data is BackupRow[] =>
  Array.isArray(data);

export const isBackupPayload = (data: unknown): data is BackupPayload =>
  !!data &&
  typeof data === "object" &&
  Array.isArray((data as BackupPayload).collection);

// Restores everything in one transaction-safe sequence: tournaments before
// matches, since matches.tournament_id is a foreign key into tournaments.
export const restoreBackupPayload = (payload: BackupPayload): void => {
  restoreCollection(payload.collection ?? []);
  restoreTournaments(payload.tournaments ?? []);
  restoreMatches(payload.matches ?? []);
};
