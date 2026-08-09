import { describe, expect, it } from "vitest";
import type { HistoryEntry, PlayerHistory } from "./historyStats";
import { computeRankingEvolution } from "./rankingEvolution";

function entry(gameId: string, date: string, profit: number): HistoryEntry {
  return {
    game: { id: gameId, name: null, date, bigBlind: 0.1 },
    profit,
    rebuys: 0,
  };
}

function history(
  id: string,
  name: string,
  entries: HistoryEntry[],
): PlayerHistory {
  return { player: { id, name, color: "#10B981" }, entries };
}

const histories = [
  history("ana", "Ana", [
    entry("g1", "2025-11-01", 10),
    entry("g2", "2026-01-10", -20),
    entry("g3", "2026-02-10", 5),
  ]),
  history("beto", "Beto", [
    entry("g1", "2025-11-01", -10),
    entry("g2", "2026-01-10", 20),
    entry("g3", "2026-02-10", -5),
  ]),
  history("carla", "Carla", [entry("g3", "2026-02-10", 0)]),
];

describe("computeRankingEvolution", () => {
  it("recalcula posiciones tras cada partida", () => {
    const { points, maxRank } = computeRankingEvolution(histories);
    expect(points).toHaveLength(3);
    expect(maxRank).toBe(3);
    // g1: Ana +10 (1º), Beto -10 (2º)
    expect(points[0].Ana).toBe(1);
    expect(points[0].Beto).toBe(2);
    expect(points[0].Carla).toBeNull(); // aún no ha jugado
    // g2: Ana -10, Beto +10 -> se intercambian
    expect(points[1].Ana).toBe(2);
    expect(points[1].Beto).toBe(1);
    // g3: Ana -5, Beto +5, Carla 0 -> Beto 1º, Carla 2º, Ana 3º
    expect(points[2].Beto).toBe(1);
    expect(points[2].Carla).toBe(2);
    expect(points[2].Ana).toBe(3);
  });

  it("la clasificación final refleja el balance de la ventana", () => {
    const { players } = computeRankingEvolution(histories);
    expect(players.map((p) => p.name)).toEqual(["Beto", "Carla", "Ana"]);
    expect(players[0].balance).toBe(5);
    expect(players[0].finalRank).toBe(1);
  });

  it("el filtro de fechas reinicia los balances dentro de la ventana", () => {
    const { points, players } = computeRankingEvolution(histories, {
      from: "2026-01-01",
    });
    // Solo g2 y g3: Ana -20 +5 = -15, Beto +20 -5 = +15, Carla 0
    expect(points).toHaveLength(2);
    expect(players.find((p) => p.name === "Ana")?.balance).toBe(-15);
    expect(players.find((p) => p.name === "Beto")?.balance).toBe(15);
  });

  it("lastGames limita a las últimas N partidas", () => {
    const { points, players } = computeRankingEvolution(histories, {
      lastGames: 1,
    });
    expect(points).toHaveLength(1);
    // Solo g3: Ana +5, Carla 0, Beto -5
    expect(players.map((p) => p.name)).toEqual(["Ana", "Carla", "Beto"]);
  });

  it("los jugadores sin partidas en la ventana no aparecen", () => {
    const { players, maxRank } = computeRankingEvolution(histories, {
      to: "2025-12-31",
    });
    expect(players.map((p) => p.name).sort()).toEqual(["Ana", "Beto"]);
    expect(maxRank).toBe(2);
  });

  it("sin partidas devuelve vacío", () => {
    const { points, players } = computeRankingEvolution([], {});
    expect(points).toEqual([]);
    expect(players).toEqual([]);
  });
});
