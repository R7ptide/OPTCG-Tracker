import { MANUAL_CARDS } from "../../constants/manualCards";
import { isUpdateAvailable, toCardRows } from "../../utils/cardSync";

const MANUAL_ID = Object.keys(MANUAL_CARDS)[0];

describe("isUpdateAvailable", () => {
  it("is true when the device never synced", () => {
    expect(isUpdateAvailable(null, "abc123")).toBe(true);
  });

  it("is false when the commits match", () => {
    expect(isUpdateAvailable("abc123", "abc123")).toBe(false);
  });

  it("is true when the server has a different commit", () => {
    expect(isUpdateAvailable("abc123", "def456")).toBe(true);
  });
});

describe("toCardRows", () => {
  it("maps a punk-records card to a database row", () => {
    const [row] = toCardRows({
      "OP01-001": {
        name: "Roronoa Zoro",
        colors: ["Red", "Green"],
        category: "Leader",
        cost: 5,
        power: 5000,
        counter: null,
        attributes: ["Slash"],
        rarity: "Leader",
        img_url: "https://example.com/OP01-001.png",
        types: ["Straw Hat Crew", "Supernovas"],
      },
    });

    expect(row).toEqual({
      id: "OP01-001",
      name: "Roronoa Zoro",
      color: "Red/Green",
      type: "Leader",
      cost: 5,
      power: 5000,
      attribute: "Slash",
      rarity: "Leader",
      image_url: "https://example.com/OP01-001.png",
      set_id: "OP01",
      traits: "Straw Hat Crew/Supernovas",
      counter: null,
    });
  });

  it("falls back to empty values for missing fields", () => {
    const row = toCardRows({ "ST01-001": {} }).find((r) => r.id === "ST01-001");

    expect(row).toMatchObject({
      name: "Unknown",
      color: "",
      type: "",
      cost: 0,
      power: 0,
      attribute: "",
      rarity: "",
      image_url: "",
      traits: "",
      counter: null,
    });
  });

  it("skips ids containing _r", () => {
    const ids = toCardRows({ "OP01-001": {}, "OP01-001_r1": {} }).map(
      (r) => r.id,
    );

    expect(ids).toContain("OP01-001");
    expect(ids).not.toContain("OP01-001_r1");
  });

  it("adds manual cards the remote data doesn't have", () => {
    const ids = toCardRows({ "OP01-001": {} }).map((r) => r.id);

    expect(ids).toContain(MANUAL_ID);
  });

  it("lets remote data win over a manual card with the same id", () => {
    const rows = toCardRows({ [MANUAL_ID]: { name: "From Remote" } });
    const matches = rows.filter((r) => r.id === MANUAL_ID);

    expect(matches).toHaveLength(1);
    expect(matches[0].name).toBe("From Remote");
  });
});
