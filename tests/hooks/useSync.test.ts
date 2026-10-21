import db, { initDB } from "../../database";
import * as cardsRepo from "../../repositories/cards";
import { getSetting, setSetting } from "../../repositories/settings";
import { useSync } from "../../hooks/useSync";

let mockUseFallback = false;

jest.mock("../../constants/server", () => ({
  ...jest.requireActual("../../constants/server"),
  get USE_FALLBACK() {
    return mockUseFallback;
  },
}));

const VERSION_URL = "http://cdn.100.95.187.118.nip.io/version.json";
const SERVER_CARDS_URL =
  "http://cdn.100.95.187.118.nip.io/english/index/cards_by_id.json";
const GITHUB_CARDS_URL =
  "https://raw.githubusercontent.com/buhbbl/punk-records/main/english/index/cards_by_id.json";

const CARDS = { "OP01-001": { name: "Roronoa Zoro", colors: ["Red"] } };

type Routes = Record<string, unknown | Error>;

// Resolves each URL to its JSON body, rejects for an Error, 404s for the rest.
const mockFetch = (routes: Routes) => {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const body = routes[String(input)];
    if (body instanceof Error) throw body;
    if (body === undefined) return { ok: false, status: 404 } as Response;
    return { ok: true, status: 200, json: async () => body } as Response;
  }) as typeof fetch;
};

const cardCount = () => cardsRepo.getTotalCardCount();

beforeAll(() => {
  initDB();
});

beforeEach(() => {
  mockUseFallback = false;
  db.execSync("DELETE FROM settings; DELETE FROM cards;");
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("checkForUpdate", () => {
  it("is true when no commit was ever stored", async () => {
    mockFetch({ [VERSION_URL]: { commit: "abc", updated_at: "now" } });

    expect(await useSync().checkForUpdate()).toBe(true);
  });

  it("is false when the stored commit matches the server", async () => {
    setSetting("cardsCommit", "abc");
    mockFetch({ [VERSION_URL]: { commit: "abc", updated_at: "now" } });

    expect(await useSync().checkForUpdate()).toBe(false);
  });

  it("is true when the server has a newer commit", async () => {
    setSetting("cardsCommit", "abc");
    mockFetch({ [VERSION_URL]: { commit: "def", updated_at: "now" } });

    expect(await useSync().checkForUpdate()).toBe(true);
  });

  it("is false, without throwing, when the server is unreachable", async () => {
    mockFetch({ [VERSION_URL]: new Error("network down") });

    expect(await useSync().checkForUpdate()).toBe(false);
  });

  it("is false when the server answers with an error status", async () => {
    mockFetch({});

    expect(await useSync().checkForUpdate()).toBe(false);
  });
});

describe("syncMasterList", () => {
  it("stores the cards and the server commit on success", async () => {
    mockFetch({
      [VERSION_URL]: { commit: "abc", updated_at: "now" },
      [SERVER_CARDS_URL]: CARDS,
    });

    expect(await useSync().syncMasterList()).toBe(true);
    expect(cardsRepo.getCardById("OP01-001")?.name).toBe("Roronoa Zoro");
    expect(getSetting("cardsCommit")).toBe("abc");
  });

  it("keeps the old commit when the card download fails", async () => {
    setSetting("cardsCommit", "old");
    mockFetch({
      [VERSION_URL]: { commit: "new", updated_at: "now" },
      [SERVER_CARDS_URL]: new Error("timeout"),
    });

    expect(await useSync().syncMasterList()).toBe(false);
    expect(getSetting("cardsCommit")).toBe("old");
    expect(cardCount()).toBe(0);
  });

  it("keeps the old commit when saving the cards fails", async () => {
    setSetting("cardsCommit", "old");
    jest.spyOn(cardsRepo, "upsertCards").mockImplementation(() => {
      throw new Error("disk full");
    });
    mockFetch({
      [VERSION_URL]: { commit: "new", updated_at: "now" },
      [SERVER_CARDS_URL]: CARDS,
    });

    expect(await useSync().syncMasterList()).toBe(false);
    expect(getSetting("cardsCommit")).toBe("old");
  });

  it("fails without touching GitHub when the fallback is off", async () => {
    mockFetch({
      [VERSION_URL]: new Error("network down"),
      [GITHUB_CARDS_URL]: CARDS,
    });

    expect(await useSync().syncMasterList()).toBe(false);
    expect(global.fetch).not.toHaveBeenCalledWith(
      GITHUB_CARDS_URL,
      expect.anything(),
    );
  });

  it("falls back to GitHub, without storing a commit, when enabled", async () => {
    mockUseFallback = true;
    mockFetch({
      [VERSION_URL]: new Error("network down"),
      [GITHUB_CARDS_URL]: CARDS,
    });

    expect(await useSync().syncMasterList()).toBe(true);
    expect(cardsRepo.getCardById("OP01-001")).not.toBeNull();
    expect(getSetting("cardsCommit")).toBeNull();
  });
});
