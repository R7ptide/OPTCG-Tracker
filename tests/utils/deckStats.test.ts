import { computeDeckStats } from "../../utils/deckStats";

describe("computeDeckStats", () => {
  it("returns zeros for an empty deck", () => {
    const s = computeDeckStats([]);
    expect(s.totalCards).toBe(0);
    expect(s.averageCost).toBe(0);
    expect(s.costCurve.every((n) => n === 0)).toBe(true);
  });

  it("counts counters and bricks by quantity, characters only", () => {
    const s = computeDeckStats([
      { type: "Character", cost: 1, counter: 2000, quantity: 4 },
      { type: "Character", cost: 2, counter: 1000, quantity: 3 },
      { type: "Character", cost: 3, counter: null, quantity: 2 },
      { type: "Character", cost: 4, counter: 0, quantity: 1 },
      { type: "Event", cost: 1, counter: null, quantity: 4 },
    ]);
    expect(s.counter2k).toBe(4);
    expect(s.counter1k).toBe(3);
    expect(s.bricks).toBe(3);
  });

  it("builds a weighted cost curve and average, bucketing 10+", () => {
    const s = computeDeckStats([
      { type: "Character", cost: 2, quantity: 4 },
      { type: "Event", cost: 4, quantity: 2 },
      { type: "Character", cost: 12, quantity: 1 },
    ]);
    expect(s.costCurve[2]).toBe(4);
    expect(s.costCurve[4]).toBe(2);
    expect(s.costCurve[10]).toBe(1);
    expect(s.averageCost).toBeCloseTo((8 + 8 + 12) / 7);
  });
});
