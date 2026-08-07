import { describe, expect, it } from "vitest";
import {
  type AllInEntry,
  computeAllInStats,
  getAllInBadge,
} from "./allInStats";

function makeEntry(overrides: Partial<AllInEntry>): AllInEntry {
  return {
    pusherId: "p1",
    callerId: "p2",
    street: "preflop",
    equity: 50,
    runItTwice: false,
    result: "won",
    at: "2026-08-08T22:00:00Z",
    ...overrides,
  };
}

describe("getAllInBadge", () => {
  it("bad beat: favorito claro que pierde", () => {
    expect(getAllInBadge(80, "lost")).toBe("badbeat");
    expect(getAllInBadge(65, "lost")).toBe("badbeat");
  });

  it("suckout: underdog claro que gana", () => {
    expect(getAllInBadge(20, "won")).toBe("suckout");
    expect(getAllInBadge(35, "won")).toBe("suckout");
  });

  it("coinflip: equity pareja gane o pierda", () => {
    expect(getAllInBadge(50, "won")).toBe("coinflip");
    expect(getAllInBadge(45, "lost")).toBe("coinflip");
    expect(getAllInBadge(55, "split")).toBe("coinflip");
  });

  it("sin badge: favorito que gana, underdog que pierde o equity desconocida", () => {
    expect(getAllInBadge(80, "won")).toBeNull();
    expect(getAllInBadge(20, "lost")).toBeNull();
    expect(getAllInBadge(null, "won")).toBeNull();
  });
});

describe("computeAllInStats", () => {
  it("cuenta all-ins hechos, ganados, perdidos y pagados", () => {
    const stats = computeAllInStats([
      makeEntry({ pusherId: "raul", callerId: "paco", result: "won" }),
      makeEntry({ pusherId: "raul", callerId: "paco", result: "lost" }),
      makeEntry({ pusherId: "paco", callerId: "raul", result: "won" }),
    ]);

    const raul = stats.find((s) => s.playerId === "raul");
    const paco = stats.find((s) => s.playerId === "paco");
    expect(raul).toMatchObject({ pushed: 2, won: 1, lost: 1, called: 1 });
    expect(paco).toMatchObject({ pushed: 1, won: 1, called: 2 });
  });

  it("el split cuenta como media victoria en el winrate", () => {
    const stats = computeAllInStats([
      makeEntry({ pusherId: "raul", result: "won" }),
      makeEntry({ pusherId: "raul", result: "split", runItTwice: true }),
    ]);
    expect(stats[0].winRate).toBeCloseTo(75);
    expect(stats[0].split).toBe(1);
  });

  it("calcula equity media y suerte (winrate - equity)", () => {
    const stats = computeAllInStats([
      makeEntry({ pusherId: "raul", equity: 30, result: "won" }),
      makeEntry({ pusherId: "raul", equity: 50, result: "won" }),
    ]);
    // winrate 100, equity media 40 -> corre +60
    expect(stats[0].avgEquity).toBeCloseTo(40);
    expect(stats[0].luck).toBeCloseTo(60);
  });

  it("ignora equity desconocida en la media pero no en el conteo", () => {
    const stats = computeAllInStats([
      makeEntry({ pusherId: "raul", equity: null, result: "lost" }),
      makeEntry({ pusherId: "raul", equity: 80, result: "lost" }),
    ]);
    expect(stats[0].pushed).toBe(2);
    expect(stats[0].avgEquity).toBeCloseTo(80);
    expect(stats[0].badbeats).toBe(1);
  });

  it("caller null (la mesa) no crea jugador fantasma", () => {
    const stats = computeAllInStats([
      makeEntry({ pusherId: "raul", callerId: null }),
    ]);
    expect(stats).toHaveLength(1);
    expect(stats[0].playerId).toBe("raul");
  });

  it("ordena por all-ins hechos descendente", () => {
    const stats = computeAllInStats([
      makeEntry({ pusherId: "paco", callerId: null }),
      makeEntry({ pusherId: "raul", callerId: null }),
      makeEntry({ pusherId: "raul", callerId: "paco" }),
    ]);
    expect(stats.map((s) => s.playerId)).toEqual(["raul", "paco"]);
  });
});
