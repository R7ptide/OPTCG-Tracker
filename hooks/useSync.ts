import { upsertCards } from "../repositories/cards";
import { getSetting, setSetting } from "../repositories/settings";
import {
  GITHUB_CARDS_URL,
  SERVER_DOWNLOAD_TIMEOUT_MS,
  SERVER_TIMEOUT_MS,
  USE_FALLBACK,
  serverUrls,
} from "../constants/server";
import {
  isUpdateAvailable,
  toCardRows,
  type PunkRecordDict,
  type ServerVersion,
} from "../utils/cardSync";

const CARDS_COMMIT_KEY = "cardsCommit";

const fetchJson = async <T>(url: string, timeoutMs: number): Promise<T> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
};

export const useSync = () => {
  // Silent on purpose: an unreachable server (e.g. off the tailnet) just
  // means "nothing to offer", not an error the user needs to see.
  const checkForUpdate = async (): Promise<boolean> => {
    try {
      const version = await fetchJson<ServerVersion>(
        serverUrls.version,
        SERVER_TIMEOUT_MS,
      );
      return isUpdateAvailable(getSetting(CARDS_COMMIT_KEY), version.commit);
    } catch {
      return false;
    }
  };

  const syncMasterList = async (): Promise<boolean> => {
    try {
      let cardsData: PunkRecordDict;
      let commit: string | null = null;

      try {
        console.log("Fetching master list from server...");
        // Version first: if a build lands mid-download we store the older
        // commit, so the next launch simply offers the update again.
        const version = await fetchJson<ServerVersion>(
          serverUrls.version,
          SERVER_TIMEOUT_MS,
        );
        cardsData = await fetchJson<PunkRecordDict>(
          serverUrls.cards,
          SERVER_DOWNLOAD_TIMEOUT_MS,
        );
        commit = version.commit;
      } catch (error) {
        if (!USE_FALLBACK) throw error;
        console.warn("Server unreachable, falling back to GitHub:", error);
        cardsData = await fetchJson<PunkRecordDict>(
          GITHUB_CARDS_URL,
          SERVER_DOWNLOAD_TIMEOUT_MS,
        );
      }

      const cards = toCardRows(cardsData);
      console.log(`Downloaded ${cards.length} cards. Updating database...`);
      upsertCards(cards);

      // Only after the whole upsert succeeded, and never for GitHub data,
      // whose state doesn't match any server commit.
      if (commit) setSetting(CARDS_COMMIT_KEY, commit);

      console.log("Sync complete!");
      return true;
    } catch (error) {
      console.error("Failed to sync master list:", error);
      return false;
    }
  };

  return { syncMasterList, checkForUpdate };
};
