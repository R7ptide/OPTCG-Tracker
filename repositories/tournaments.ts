import db, { type MatchResult, type MatchRow, type TournamentRow } from "../database";

export type NewTournament = {
  title: string;
  description?: string | null;
  leaderId?: string | null;
  placement?: number | null;
};

export const createTournament = (input: NewTournament): number => {
  const result = db.runSync(
    "INSERT INTO tournaments (title, description, leader_id, placement) VALUES (?, ?, ?, ?)",
    [
      input.title,
      input.description ?? null,
      input.leaderId ?? null,
      input.placement ?? null,
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
      COALESCE(SUM(CASE WHEN m.result = 'W' THEN 1 ELSE 0 END), 0) AS wins,
      COALESCE(SUM(CASE WHEN m.result = 'L' THEN 1 ELSE 0 END), 0) AS losses,
      COALESCE(SUM(CASE WHEN m.result = 'BYE' THEN 1 ELSE 0 END), 0) AS byes,
      COUNT(m.id) AS totalMatches
    FROM tournaments t
    LEFT JOIN matches m ON m.tournament_id = t.id
    GROUP BY t.id
    ORDER BY t.created_at DESC, t.id DESC
  `);
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
