import db, {
  type MatchResult,
  type MatchRow,
  type TournamentRow,
} from "../database";
import { toDateString } from "../utils/date";

export type NewTournament = {
  title: string;
  format: string;
  leaderId?: string | null;
  placement?: number | null;
  eventDate?: string;
};

export const createTournament = (input: NewTournament): number => {
  const result = db.runSync(
    "INSERT INTO tournaments (title, format, leader_id, placement, event_date) VALUES (?, ?, ?, ?, ?)",
    [
      input.title,
      input.format,
      input.leaderId ?? null,
      input.placement ?? null,
      input.eventDate ?? toDateString(new Date()),
    ],
  );
  return result.lastInsertRowId;
};

export const getTournamentById = (id: number): TournamentRow | null => {
  return db.getFirstSync<TournamentRow>(
    "SELECT * FROM tournaments WHERE id = ?",
    [id],
  );
};

export type TournamentWithRecord = TournamentRow & {
  wins: number;
  losses: number;
  byes: number;
  totalMatches: number;
  leaderName: string | null;
};

export const getTournaments = (): TournamentWithRecord[] => {
  return db.getAllSync<TournamentWithRecord>(`
    SELECT
      t.*,
      c.name AS leaderName,
      COALESCE(SUM(CASE WHEN m.result IN ('W', 'BYE') THEN 1 ELSE 0 END), 0) AS wins,
      COALESCE(SUM(CASE WHEN m.result = 'L' THEN 1 ELSE 0 END), 0) AS losses,
      COALESCE(SUM(CASE WHEN m.result = 'BYE' THEN 1 ELSE 0 END), 0) AS byes,
      COUNT(m.id) AS totalMatches
    FROM tournaments t
    LEFT JOIN matches m ON m.tournament_id = t.id
    LEFT JOIN cards c ON c.id = t.leader_id
    GROUP BY t.id
    ORDER BY t.event_date DESC, t.created_at DESC, t.id DESC
  `);
};

export const searchTournaments = (query: string): TournamentWithRecord[] => {
  const needle = `%${query.trim()}%`;
  return db.getAllSync<TournamentWithRecord>(
    `
    SELECT
      t.*,
      c.name AS leaderName,
      COALESCE(SUM(CASE WHEN m.result IN ('W', 'BYE') THEN 1 ELSE 0 END), 0) AS wins,
      COALESCE(SUM(CASE WHEN m.result = 'L' THEN 1 ELSE 0 END), 0) AS losses,
      COALESCE(SUM(CASE WHEN m.result = 'BYE' THEN 1 ELSE 0 END), 0) AS byes,
      COUNT(m.id) AS totalMatches
    FROM tournaments t
    LEFT JOIN matches m ON m.tournament_id = t.id
    LEFT JOIN cards c ON c.id = t.leader_id
    WHERE t.title LIKE ? OR c.name LIKE ?
    GROUP BY t.id
    ORDER BY t.event_date DESC, t.created_at DESC, t.id DESC
  `,
    [needle, needle],
  );
};

export const updateTournamentPlacement = (
  id: number,
  placement: number | null,
): void => {
  db.runSync("UPDATE tournaments SET placement = ? WHERE id = ?", [
    placement,
    id,
  ]);
};

export type TournamentUpdate = {
  title: string;
  format: string;
  leaderId?: string | null;
  placement?: number | null;
  eventDate: string;
};

export const updateTournament = (id: number, input: TournamentUpdate): void => {
  db.runSync(
    "UPDATE tournaments SET title = ?, format = ?, leader_id = ?, placement = ?, event_date = ? WHERE id = ?",
    [
      input.title,
      input.format,
      input.leaderId ?? null,
      input.placement ?? null,
      input.eventDate,
      id,
    ],
  );
};

export const deleteTournament = (id: number): void => {
  db.runSync("DELETE FROM tournaments WHERE id = ?", [id]);
};

export type NewMatch = {
  tournamentId: number;
  opponentLeaderId?: string | null;
  result: MatchResult;
  diceRoll?: boolean | null;
  wentFirst?: boolean | null;
  comment?: string | null;
};

export const addMatch = (input: NewMatch): number => {
  const result = db.runSync(
    "INSERT INTO matches (tournament_id, opponent_leader_id, result, dice_roll, went_first, comment) VALUES (?, ?, ?, ?, ?, ?)",
    [
      input.tournamentId,
      input.opponentLeaderId ?? null,
      input.result,
      input.diceRoll === undefined || input.diceRoll === null
        ? null
        : input.diceRoll
          ? 1
          : 0,
      input.wentFirst === undefined || input.wentFirst === null
        ? null
        : input.wentFirst
          ? 1
          : 0,
      input.comment ?? null,
    ],
  );
  return result.lastInsertRowId;
};

export type MatchWithOpponent = MatchRow & { opponentName: string | null };

export const getMatchesForTournament = (
  tournamentId: number,
): MatchWithOpponent[] => {
  return db.getAllSync<MatchWithOpponent>(
    `
    SELECT m.*, c.name AS opponentName
    FROM matches m
    LEFT JOIN cards c ON c.id = m.opponent_leader_id
    WHERE m.tournament_id = ?
    ORDER BY m.id ASC
  `,
    [tournamentId],
  );
};

// Batched fetch to avoid N+1 queries when loading matches for many tournaments
// at once (e.g. building aggregate stats). Groups results by tournament_id.
export const getMatchesForTournaments = (
  tournamentIds: number[],
): Record<number, MatchRow[]> => {
  if (tournamentIds.length === 0) return {};
  const placeholders = tournamentIds.map(() => "?").join(", ");
  const rows = db.getAllSync<MatchRow>(
    `SELECT * FROM matches WHERE tournament_id IN (${placeholders}) ORDER BY id ASC`,
    tournamentIds,
  );
  const grouped: Record<number, MatchRow[]> = {};
  for (const row of rows) {
    (grouped[row.tournament_id] ??= []).push(row);
  }
  return grouped;
};

export type MatchUpdate = {
  opponentLeaderId?: string | null;
  result: MatchResult;
  diceRoll: boolean | null;
  wentFirst?: boolean | null;
  comment?: string | null;
};

export const updateMatch = (matchId: number, input: MatchUpdate): void => {
  db.runSync(
    "UPDATE matches SET opponent_leader_id = ?, result = ?, dice_roll = ?, went_first = ?, comment = ? WHERE id = ?",
    [
      input.opponentLeaderId ?? null,
      input.result,
      input.diceRoll === undefined || input.diceRoll === null
        ? null
        : input.diceRoll
          ? 1
          : 0,
      input.wentFirst === undefined || input.wentFirst === null
        ? null
        : input.wentFirst
          ? 1
          : 0,
      input.comment ?? null,
      matchId,
    ],
  );
};

export const deleteMatch = (matchId: number): void => {
  db.runSync("DELETE FROM matches WHERE id = ?", [matchId]);
};
