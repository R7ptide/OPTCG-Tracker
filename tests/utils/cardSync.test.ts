import { MANUAL_CARDS } from "../../constants/manualCards";
import {
  getPackIds,
  isUpdateAvailable,
  toCardDetails,
  toCardRows,
} from "../../utils/cardSync";

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
      pack_id: null,
      effect: null,
      trigger_text: null,
      block_number: null,
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
      pack_id: null,
      effect: null,
      trigger_text: null,
      block_number: null,
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

describe("getPackIds", () => {
  it("returns each pack once and skips cards without one", () => {
    expect(
      getPackIds({
        "OP01-001": { pack_id: "569101" },
        "OP01-002": { pack_id: "569101" },
        "ST01-001": { pack_id: "569001" },
        "XX-001": {},
      }).sort(),
    ).toEqual(["569001", "569101"]);
  });
});

describe("toCardDetails", () => {
  it("maps pack cards by id, using empty strings for missing text", () => {
    expect(
      toCardDetails([
        { id: "OP01-001", effect: "Text", trigger: "Trig", block_number: 1 },
        { id: "OP01-002", effect: null, trigger: null },
      ]),
    ).toEqual({
      "OP01-001": { effect: "Text", trigger: "Trig", block_number: 1 },
      "OP01-002": { effect: "", trigger: "", block_number: null },
    });
  });
});

describe("toCardRows with pack details", () => {
  const details = toCardDetails([
    {
      id: "OP01-001",
      effect: "Pack text",
      trigger: "Pack trig",
      block_number: 1,
    },
    { id: "OP01-001_p1", effect: "Alt text", trigger: null, block_number: 1 },
  ]);

  it("merges effect, trigger, block and pack id onto the card", () => {
    const [row] = toCardRows({ "OP01-001": { pack_id: "569101" } }, details);

    expect(row).toMatchObject({
      pack_id: "569101",
      effect: "Pack text",
      trigger_text: "Pack trig",
      block_number: 1,
    });
  });

  it("uses the alt art's own pack entry", () => {
    const row = toCardRows({ "OP01-001_p1": {} }, details).find(
      (r) => r.id === "OP01-001_p1",
    );

    expect(row).toMatchObject({ effect: "Alt text", trigger_text: "" });
  });

  it("leaves text null for cards whose pack failed so stored text is kept", () => {
    const row = toCardRows({ "OP02-001": {} }, details).find(
      (r) => r.id === "OP02-001",
    );

    expect(row).toMatchObject({
      effect: null,
      trigger_text: null,
      block_number: null,
    });
  });

  it("lets a manual entry's own text win over the pack file", () => {
    const manual = MANUAL_CARDS[MANUAL_ID];
    MANUAL_CARDS[MANUAL_ID] = {
      ...manual,
      effect: "Manual text",
      block_number: 9,
    };
    try {
      const row = toCardRows({}, { [MANUAL_ID]: details["OP01-001"] }).find(
        (r) => r.id === MANUAL_ID,
      );
      expect(row).toMatchObject({
        effect: "Manual text",
        trigger_text: "Pack trig",
        block_number: 9,
      });
    } finally {
      MANUAL_CARDS[MANUAL_ID] = manual;
    }
  });

  it("falls back to the base card's text for a manual alt art with none", () => {
    const baseId = MANUAL_ID.split("_")[0];
    const row = toCardRows(
      {},
      toCardDetails([{ id: baseId, effect: "Base text", block_number: 2 }]),
    ).find((r) => r.id === MANUAL_ID);

    expect(row).toMatchObject({ effect: "Base text", block_number: 2 });
  });
});
