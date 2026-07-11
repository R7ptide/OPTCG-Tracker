import { initDB } from "../../database";
import db from "../../database";
import { getSetting, setSetting } from "../../repositories/settings";

beforeAll(() => {
  initDB();
});

beforeEach(() => {
  db.execSync("DELETE FROM settings;");
});

describe("settings repository", () => {
  it("returns null for a key that was never set", () => {
    expect(getSetting("isLightMode")).toBeNull();
  });

  it("persists and reads back a value", () => {
    setSetting("isLightMode", "true");
    expect(getSetting("isLightMode")).toBe("true");
  });

  it("overwrites the previous value on repeated writes", () => {
    setSetting("showMissing", "true");
    setSetting("showMissing", "false");
    expect(getSetting("showMissing")).toBe("false");
  });
});
