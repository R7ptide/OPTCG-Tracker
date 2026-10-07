export type DeckStatsInput = {
  type?: string | null;
  cost?: number | null;
  counter?: number | null;
  quantity: number;
};

export type DeckStats = {
  counter2k: number;
  counter1k: number;
  // Characters without a counter value; events/stages never have one so
  // they don't count as bricks.
  bricks: number;
  costCurve: number[];
  averageCost: number;
  totalCards: number;
};

// Costs above this share the last bucket so the chart stays readable.
export const MAX_COST_BUCKET = 10;

export const computeDeckStats = (cards: DeckStatsInput[]): DeckStats => {
  const stats: DeckStats = {
    counter2k: 0,
    counter1k: 0,
    bricks: 0,
    costCurve: new Array(MAX_COST_BUCKET + 1).fill(0),
    averageCost: 0,
    totalCards: 0,
  };
  let costSum = 0;
  let costCount = 0;

  for (const c of cards) {
    stats.totalCards += c.quantity;

    if (c.cost != null) {
      stats.costCurve[Math.min(c.cost, MAX_COST_BUCKET)] += c.quantity;
      costSum += c.cost * c.quantity;
      costCount += c.quantity;
    }

    if (c.type === "Character") {
      if (c.counter === 2000) stats.counter2k += c.quantity;
      else if (c.counter === 1000) stats.counter1k += c.quantity;
      else if (!c.counter) stats.bricks += c.quantity;
    }
  }

  stats.averageCost = costCount ? costSum / costCount : 0;
  return stats;
};
