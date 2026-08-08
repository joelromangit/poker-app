import { describe, expect, it } from "vitest";
import {
  computeBBStats,
  computeHeadToHead,
  computeRecentForm,
  computeHistoryStats,
  filterEntriesByDate,
  getCommonGameIds,
  type HistoryEntry,
  type PlayerHistory,
} from "./historyStats";

function makeEntry(
  gameId: string,
  date: string,
  profit: number,
  bigBlind = 0.1,
): HistoryEntry {
  return {
    game: { id: gameId, name: null, date, bigBlind },
    profit,
    rebuys: 0,
  };
}

function makeHistory(
  id: string,
  name: string,
  entries: HistoryEntry[],
): PlayerHistory {
  return {
    player: { id, name, color: "#10B981" },
    entries,
  };
}

describe("computeHistoryStats", () => {
  it("devuelve ceros sin partidas", () => {
    const stats = computeHistoryStats([]);
    expect(stats.games).toBe(0);
    expect(stats.balance).toBe(0);
    expect(stats.average).toBe(0);
    expect(stats.best).toBe(0);
    expect(stats.worst).toBe(0);
    expect(stats.winRate).toBe(0);
  });

  it("calcula balance, media, mejor y peor", () => {
    const stats = computeHistoryStats([10, -5, 20, -15]);
    expect(stats.games).toBe(4);
    expect(stats.balance).toBe(10);
    expect(stats.average).toBe(2.5);
    expect(stats.best).toBe(20);
    expect(stats.worst).toBe(-15);
  });

  it("cuenta partidas en positivo, negativo y tablas", () => {
    const stats = computeHistoryStats([10, -5, 0, 20]);
    expect(stats.wins).toBe(2);
    expect(stats.losses).toBe(1);
    expect(stats.draws).toBe(1);
    expect(stats.winRate).toBe(50);
  });

  it("suma solo ganancias y solo pérdidas con sus medias", () => {
    const stats = computeHistoryStats([10, -5, 20, -15]);
    expect(stats.totalWon).toBe(30);
    expect(stats.totalLost).toBe(-20);
    expect(stats.avgWin).toBe(15);
    expect(stats.avgLoss).toBe(-10);
  });

  it("calcula rachas de victorias y derrotas", () => {
    const stats = computeHistoryStats([5, 10, 15, -1, -2, 3, -4]);
    expect(stats.bestStreak).toBe(3);
    expect(stats.worstStreak).toBe(2);
  });

  it("una tabla corta las rachas", () => {
    const stats = computeHistoryStats([5, 0, 10]);
    expect(stats.bestStreak).toBe(1);
  });
});

describe("computeHeadToHead", () => {
  const ana = makeHistory("a", "Ana", [
    makeEntry("g1", "2026-01-01", 10),
    makeEntry("g2", "2026-01-08", -5),
    makeEntry("g3", "2026-01-15", 20),
    makeEntry("g5", "2026-02-01", 7),
  ]);
  const bruno = makeHistory("b", "Bruno", [
    makeEntry("g1", "2026-01-01", -10),
    makeEntry("g2", "2026-01-08", 5),
    makeEntry("g3", "2026-01-15", 20),
    makeEntry("g4", "2026-01-22", 50),
  ]);

  it("solo cuenta partidas en común", () => {
    const result = computeHeadToHead(ana, bruno);
    expect(result.commonGames).toBe(3);
  });

  it("calcula victorias directas, empates y balances", () => {
    const result = computeHeadToHead(ana, bruno);
    expect(result.aWins).toBe(1); // g1
    expect(result.bWins).toBe(1); // g2
    expect(result.draws).toBe(1); // g3
    expect(result.aBalance).toBe(25);
    expect(result.bBalance).toBe(15);
  });

  it("encuentra la mayor diferencia", () => {
    const result = computeHeadToHead(ana, bruno);
    expect(result.biggestGap?.game.id).toBe("g1");
    expect(result.biggestGap?.winnerName).toBe("Ana");
    expect(result.biggestGap?.diff).toBe(20);
  });

  it("respeta el filtro de partidas", () => {
    const result = computeHeadToHead(ana, bruno, new Set(["g2"]));
    expect(result.commonGames).toBe(1);
    expect(result.bWins).toBe(1);
    expect(result.aWins).toBe(0);
  });
});

describe("getCommonGameIds", () => {
  it("devuelve la intersección de partidas", () => {
    const a = makeHistory("a", "Ana", [
      makeEntry("g1", "2026-01-01", 1),
      makeEntry("g2", "2026-01-08", 1),
    ]);
    const b = makeHistory("b", "Bruno", [
      makeEntry("g2", "2026-01-08", 1),
      makeEntry("g3", "2026-01-15", 1),
    ]);
    expect(Array.from(getCommonGameIds([a, b]))).toEqual(["g2"]);
  });

  it("con un solo jugador devuelve todas sus partidas", () => {
    const a = makeHistory("a", "Ana", [makeEntry("g1", "2026-01-01", 1)]);
    expect(getCommonGameIds([a]).size).toBe(1);
  });

  it("sin jugadores devuelve vacío", () => {
    expect(getCommonGameIds([]).size).toBe(0);
  });
});

describe("filterEntriesByDate", () => {
  const entries = [
    makeEntry("g1", "2025-06-15T20:00:00", 1),
    makeEntry("g2", "2025-12-31T23:00:00", 1),
    makeEntry("g3", "2026-01-01T01:00:00", 1),
  ];

  it("sin fechas devuelve todo", () => {
    expect(filterEntriesByDate(entries)).toHaveLength(3);
  });

  it("filtra desde una fecha inclusive", () => {
    const result = filterEntriesByDate(entries, "2025-12-31");
    expect(result.map((e) => e.game.id)).toEqual(["g2", "g3"]);
  });

  it("filtra hasta una fecha inclusive", () => {
    const result = filterEntriesByDate(entries, undefined, "2025-12-31");
    expect(result.map((e) => e.game.id)).toEqual(["g1", "g2"]);
  });

  it("filtra un año concreto", () => {
    const result = filterEntriesByDate(entries, "2025-01-01", "2025-12-31");
    expect(result.map((e) => e.game.id)).toEqual(["g1", "g2"]);
  });
});

describe("computeBBStats", () => {
  it("convierte cada partida con su propia ciega", () => {
    // Partida con ciega 0.10€ (ficha 0.01) y otra con ciega 0.20€ (ficha 0.02)
    const stats = computeBBStats([
      makeEntry("g1", "2026-01-01T21:00:00", 10, 0.1), // +100 BB
      makeEntry("g2", "2026-01-02T21:00:00", -10, 0.2), // -50 BB
    ]);
    expect(stats.balanceBB).toBeCloseTo(50);
    expect(stats.averageBB).toBeCloseTo(25);
    expect(stats.bestBB).toBeCloseTo(100);
    expect(stats.worstBB).toBeCloseTo(-50);
  });

  it("ignora partidas sin ciega válida", () => {
    const stats = computeBBStats([
      makeEntry("g1", "2026-01-01T21:00:00", 10, 0.1),
      makeEntry("g2", "2026-01-02T21:00:00", 99, 0),
    ]);
    expect(stats.balanceBB).toBeCloseTo(100);
    expect(stats.averageBB).toBeCloseTo(100);
  });

  it("sin entradas devuelve ceros", () => {
    expect(computeBBStats([])).toEqual({
      balanceBB: 0,
      averageBB: 0,
      bestBB: 0,
      worstBB: 0,
    });
  });
});

describe("computeRecentForm", () => {
  it("mapea las últimas 5 partidas a W/L/D", () => {
    expect(computeRecentForm([10, -5, 0, 3, -2, 8, 1])).toEqual([
      "D",
      "W",
      "L",
      "W",
      "W",
    ]);
  });

  it("con menos de 5 partidas devuelve las que haya", () => {
    expect(computeRecentForm([-1, 2])).toEqual(["L", "W"]);
    expect(computeRecentForm([])).toEqual([]);
  });
});
