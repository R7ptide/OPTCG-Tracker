import { upsertCards } from "../repositories/cards";
import { getSetting, setSetting } from "../repositories/settings";
import {
  GITHUB_CARDS_URL,
  githubPackDataUrl,
  SERVER_DOWNLOAD_TIMEOUT_MS,
  SERVER_TIMEOUT_MS,
  USE_FALLBACK,
  serverUrls,
} from "../constants/server";
import {
  getPackIds,
  isUpdateAvailable,
  toCardDetails,
  toCardRows,
  type CardDetailsDict,
  type PackCard,
  type PunkRecordDict,
  type ServerVersion,
} from "../utils/cardSync";

const CARDS_COMMIT_KEY = "cardsCommit";

const fetchJson = async <T>(url: string, timeoutMs: number): Promise<T> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
};

const PACK_CONCURRENCY = 6;

// Downloads each pack file once. A pack that fails everywhere is skipped, not
// fatal: its cards keep their stored text and `failed` tells the caller to
// leave the commit unset so the next sync retries.
const fetchPackDetails = async (
  packIds: string[],
  fromServer: boolean,
): Promise<{ details: CardDetailsDict; failed: string[] }> => {
  const details: CardDetailsDict = {};
  const failed: string[] = [];
  const queue = [...packIds];

  const fetchPack = async (packId: string): Promise<PackCard[]> => {
    if (fromServer) {
      try {
        return await fetchJson<PackCard[]>(
          serverUrls.data(packId),
          SERVER_DOWNLOAD_TIMEOUT_MS,
        );
      } catch (error) {
        if (!USE_FALLBACK) throw error;
      }
    }
    return fetchJson<PackCard[]>(
      githubPackDataUrl(packId),
      SERVER_DOWNLOAD_TIMEOUT_MS,
    );
  };

  const worker = async () => {
    for (let packId = queue.shift(); packId; packId = queue.shift()) {
      try {
        Object.assign(details, toCardDetails(await fetchPack(packId)));
      } catch (error) {
        console.warn(`Skipping pack ${packId}:`, error);
        failed.push(packId);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(PACK_CONCURRENCY, packIds.length) }, worker),
  );
  return { details, failed };
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
      let fromServer = true;

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
        fromServer = false;
        cardsData = await fetchJson<PunkRecordDict>(
          GITHUB_CARDS_URL,
          SERVER_DOWNLOAD_TIMEOUT_MS,
        );
      }

      const { details, failed } = await fetchPackDetails(
        getPackIds(cardsData),
        fromServer,
      );
      const cards = toCardRows(cardsData, details);
      console.log(`Downloaded ${cards.length} cards. Updating database...`);
      upsertCards(cards);

      // Only after the whole upsert succeeded, never for GitHub data (its
      // state doesn't match any server commit), and not while a pack failed,
      // so the next sync offers the update again and retries it.
      if (commit && failed.length === 0) setSetting(CARDS_COMMIT_KEY, commit);

      console.log("Sync complete!");
      return true;
    } catch (error) {
      console.error("Failed to sync master list:", error);
      return false;
    }
  };

  return { syncMasterList, checkForUpdate };
};
