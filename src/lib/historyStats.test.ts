import { describe, expect, it } from "vitest";
import {
  computeHeadToHead,
  computeHistoryStats,
  filterEntriesByDate,
  getCommonGameIds,
  type HistoryEntry,
  type PlayerHistory,
} from "./historyStats";

function makeEntry(gameId: string, date: string, profit: number): HistoryEntry {
  return {
    game: { id: gameId, name: null, date },
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
