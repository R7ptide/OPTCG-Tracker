import { readFileSync } from "fs";
import { join } from "path";
import {
  CHANGELOG,
  ROADMAP,
  splitReleases,
  type Release,
} from "../../constants/changelog";

const compareVersions = (a: string, b: string): number => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
};

describe("CHANGELOG", () => {
  it("has its newest entry at the app.config.js version", () => {
    const config = readFileSync(join(__dirname, "../../app.config.js"), "utf8");
    const version = config.match(/version:\s*"(\d+\.\d+\.\d+)"/)?.[1];

    expect(CHANGELOG[0].version).toBe(version);
  });

  it("is ordered newest first with unique versions and valid dates", () => {
    for (let i = 1; i < CHANGELOG.length; i++) {
      expect(
        compareVersions(CHANGELOG[i - 1].version, CHANGELOG[i].version),
      ).toBeGreaterThan(0);
      expect(CHANGELOG[i - 1].date >= CHANGELOG[i].date).toBe(true);
    }
    for (const release of CHANGELOG) {
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("writes every item as 'Title: description'", () => {
    const items = [...CHANGELOG.flatMap((r) => r.items), ...ROADMAP];
    for (const item of items) {
      expect(item).toMatch(/^[^:]+:\s*\S/);
    }
  });
});

describe("splitReleases", () => {
  const releases: Release[] = [
    { version: "1.2.0", date: "2026-02-01", items: ["a: b"] },
    { version: "1.1.0", date: "2026-01-01", items: ["c: d"] },
  ];

  it("features the installed version and lists the rest as history", () => {
    const { current, previous } = splitReleases("1.1.0", releases);

    expect(current?.version).toBe("1.1.0");
    expect(previous.map((r) => r.version)).toEqual(["1.2.0"]);
  });

  it("falls back to the newest release for an unlisted version", () => {
    const { current, previous } = splitReleases("9.9.9", releases);

    expect(current?.version).toBe("1.2.0");
    expect(previous.map((r) => r.version)).toEqual(["1.1.0"]);
  });

  it("handles an empty changelog", () => {
    expect(splitReleases("1.0.0", [])).toEqual({ current: null, previous: [] });
  });
});
