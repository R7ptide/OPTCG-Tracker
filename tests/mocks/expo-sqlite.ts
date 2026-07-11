import Database from "better-sqlite3";

let instance: Database.Database | null = null;

const wrap = (raw: Database.Database) => ({
  execSync: (sql: string): void => {
    raw.exec(sql);
  },
  getFirstSync: <T>(sql: string, params: unknown[] = []): T | undefined => {
    return raw.prepare(sql).get(...params) as T | undefined;
  },
  getAllSync: <T>(sql: string, params: unknown[] = []): T[] => {
    return raw.prepare(sql).all(...params) as T[];
  },
  runSync: (sql: string, params: unknown[] = []) => {
    return raw.prepare(sql).run(...params);
  },
  withTransactionSync: (fn: () => void): void => {
    raw.transaction(fn)();
  },
  prepareSync: (sql: string) => {
    const stmt = raw.prepare(sql);
    return {
      executeSync: (params: unknown[] = []) => stmt.run(...params),
    };
  },
});

export const openDatabaseSync = (_name: string) => {
  if (!instance) instance = new Database(":memory:");
  return wrap(instance);
};

// Test-only helper to fully reset the in-memory db between test files.
export const __resetMockDb = (): void => {
  instance?.close();
  instance = null;
};
