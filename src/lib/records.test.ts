import { describe, expect, it } from "vitest";
import type { GameSummary } from "@/types";
import type { AllInEntry } from "./allInStats";
import type { HistoryEntry, PlayerHistory } from "./historyStats";
import {
  computeAllInRecords,
  computeGroupRecords,
  computePlayerTitles,
} from "./records";

function entry(
  gameId: string,
  date: string,
  profit: number,
  rebuys = 0,
): HistoryEntry {
  return {
    game: { id: gameId, name: null, date, bigBlind: 0.1 },
    profit,
    rebuys,
  };
}

function history(
  id: string,
  name: string,
  entries: HistoryEntry[],
): PlayerHistory {
  return { player: { id, name, color: "#10B981" }, entries };
}

function game(
  id: string,
  pot: number,
  results: { name: string; profit: number }[],
): GameSummary {
  const sorted = [...results].sort((a, b) => b.profit - a.profit);
  return {
    id,
    created_at: "2026-08-01T21:00:00Z",
    player_count: results.length,
    total_pot: pot,
    top_winner: sorted[0]?.name ?? "",
    top_winner_profit: sorted[0]?.profit ?? 0,
    worst_loser: sorted[sorted.length - 1]?.name ?? "",
    worst_loser_profit: sorted[sorted.length - 1]?.profit ?? 0,
    participants: results.map((r) => r.name),
    player_results: results,
  };
}

const histories = [
  history("ana", "Ana", [
    entry("g1", "2026-01-01", 30),
    entry("g2", "2026-01-08", 12),
    entry("g3", "2026-01-15", 5),
    entry("g4", "2026-01-22", -10, 3),
  ]),
  history("beto", "Beto", [
    entry("g1", "2026-01-01", -30),
    entry("g2", "2026-01-08", -12),
    entry("g3", "2026-01-15", -5),
  ]),
];

const games = [
  game("g1", 60, [
    { name: "Ana", profit: 30 },
    { name: "Beto", profit: -30 },
  ]),
  game("g2", 100, [
    { name: "Ana", profit: 12 },
    { name: "Beto", profit: -12 },
  ]),
];

function findRecord(records: { key: string }[], key: string) {
  const record = records.find((r) => r.key === key);
  if (!record) throw new Error(`record ${key} not found`);
  return record as ReturnType<typeof computeGroupRecords>[0];
}

describe("computeGroupRecords", () => {
  const records = computeGroupRecords(histories, games);

  it("encuentra el mayor bote", () => {
    const pot = findRecord(records, "pot");
    expect(pot.holder?.gameId).toBe("g2");
    expect(pot.holder?.value).toBe("100.00€");
  });

  it("encuentra la mejor y peor noche", () => {
    expect(findRecord(records, "best-night").holder).toMatchObject({
      playerName: "Ana",
      gameId: "g1",
      value: "+30.00€",
    });
    expect(findRecord(records, "worst-night").holder).toMatchObject({
      playerName: "Beto",
      value: "-30.00€",
    });
  });

  it("calcula las rachas más largas", () => {
    expect(findRecord(records, "win-streak").holder).toMatchObject({
      playerName: "Ana",
      value: "3 seguidas",
    });
    expect(findRecord(records, "loss-streak").holder).toMatchObject({
      playerName: "Beto",
      value: "3 seguidas",
    });
  });

  it("encuentra la mayor escabechina con víctima", () => {
    const massacre = findRecord(records, "massacre");
    expect(massacre.holder).toMatchObject({
      playerName: "Ana",
      rivalName: "Beto",
      gameId: "g1",
    });
  });

  it("sin datos devuelve holders nulos", () => {
    const empty = computeGroupRecords([], []);
    expect(empty.every((r) => r.holder === null)).toBe(true);
  });
});

describe("computePlayerTitles", () => {
  const titles = computePlayerTitles(histories);

  it("corona al banquero y al pozo", () => {
    expect(findRecord(titles, "banker").holder?.playerName).toBe("Ana");
    expect(findRecord(titles, "pit").holder?.playerName).toBe("Beto");
  });

  it("el fijo es quien más partidas juega", () => {
    expect(findRecord(titles, "regular").holder).toMatchObject({
      playerName: "Ana",
      value: "4 partidas",
    });
  });

  it("la roca exige un mínimo de 5 partidas", () => {
    expect(findRecord(titles, "rock").holder).toBeNull();
  });

  it("rey del rebuy suma recompras", () => {
    expect(findRecord(titles, "rebuy-king").holder).toMatchObject({
      playerName: "Ana",
      value: "3 rebuys",
    });
  });
});

describe("computeAllInRecords", () => {
  const names = new Map([
    ["ana", "Ana"],
    ["beto", "Beto"],
  ]);
  const allIn = (over: Partial<AllInEntry>): AllInEntry => ({
    pusherId: "ana",
    callerId: "beto",
    street: "preflop",
    equity: 50,
    runItTwice: false,
    result: "won",
    at: "2026-08-01T22:00:00Z",
    ...over,
  });

  it("encuentra el bad beat más doloroso y el suckout más épico", () => {
    const records = computeAllInRecords(
      [
        allIn({ equity: 82, result: "lost" }),
        allIn({ equity: 70, result: "lost" }),
        allIn({ pusherId: "beto", callerId: "ana", equity: 18, result: "won" }),
      ],
      names,
    );
    expect(findRecord(records, "badbeat").holder).toMatchObject({
      playerName: "Ana",
      value: "perdió con 82%",
    });
    expect(findRecord(records, "suckout").holder).toMatchObject({
      playerName: "Beto",
      value: "ganó con 18%",
    });
  });

  it("el pistolero es quien más empuja", () => {
    const records = computeAllInRecords(
      [allIn({}), allIn({}), allIn({ pusherId: "beto", callerId: null })],
      names,
    );
    expect(findRecord(records, "pistolero").holder).toMatchObject({
      playerName: "Ana",
      value: "2 all-ins",
    });
  });

  it("sin all-ins no hay récords", () => {
    const records = computeAllInRecords([], names);
    expect(records.every((r) => r.holder === null)).toBe(true);
  });
});
