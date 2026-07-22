import db, { type MatchResult, type MatchRow, type TournamentRow } from "../database";
import { toDateString } from "../utils/date";

export type NewTournament = {
  title: string;
  description?: string | null;
  leaderId?: string | null;
  placement?: number | null;
  eventDate?: string;
};

export const createTournament = (input: NewTournament): number => {
  const result = db.runSync(
    "INSERT INTO tournaments (title, description, leader_id, placement, event_date) VALUES (?, ?, ?, ?, ?)",
    [
      input.title,
      input.description ?? null,
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
};

export const getTournaments = (): TournamentWithRecord[] => {
  return db.getAllSync<TournamentWithRecord>(`
    SELECT
      t.*,
      COALESCE(SUM(CASE WHEN m.result IN ('W', 'BYE') THEN 1 ELSE 0 END), 0) AS wins,
      COALESCE(SUM(CASE WHEN m.result = 'L' THEN 1 ELSE 0 END), 0) AS losses,
      COALESCE(SUM(CASE WHEN m.result = 'BYE' THEN 1 ELSE 0 END), 0) AS byes,
      COUNT(m.id) AS totalMatches
    FROM tournaments t
    LEFT JOIN matches m ON m.tournament_id = t.id
    GROUP BY t.id
    ORDER BY t.event_date DESC, t.created_at DESC, t.id DESC
  `);
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
  description?: string | null;
  leaderId?: string | null;
  placement?: number | null;
  eventDate: string;
};

export const updateTournament = (id: number, input: TournamentUpdate): void => {
  db.runSync(
    "UPDATE tournaments SET title = ?, description = ?, leader_id = ?, placement = ?, event_date = ? WHERE id = ?",
    [
      input.title,
      input.description ?? null,
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
  wentFirst?: boolean | null;
  comment?: string | null;
};

export const addMatch = (input: NewMatch): number => {
  const result = db.runSync(
    "INSERT INTO matches (tournament_id, opponent_leader_id, result, went_first, comment) VALUES (?, ?, ?, ?, ?)",
    [
      input.tournamentId,
      input.opponentLeaderId ?? null,
      input.result,
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

export const getMatchesForTournament = (tournamentId: number): MatchRow[] => {
  return db.getAllSync<MatchRow>(
    "SELECT * FROM matches WHERE tournament_id = ? ORDER BY id ASC",
    [tournamentId],
  );
};

export type MatchUpdate = {
  opponentLeaderId?: string | null;
  result: MatchResult;
  wentFirst?: boolean | null;
  comment?: string | null;
};

export const updateMatch = (matchId: number, input: MatchUpdate): void => {
  db.runSync(
    "UPDATE matches SET opponent_leader_id = ?, result = ?, went_first = ?, comment = ? WHERE id = ?",
    [
      input.opponentLeaderId ?? null,
      input.result,
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
