import { describe, expect, it } from "vitest";
import { computeGamesAggregate, computeSettlement } from "./aggregate";
import type { GameSummary } from "@/types";

function makeGame(
  id: string,
  date: string,
  results: { name: string; profit: number }[],
  pot = 40,
): GameSummary {
  return {
    id,
    created_at: date,
    player_count: results.length,
    total_pot: pot,
    top_winner: results[0]?.name ?? "",
    top_winner_profit: results[0]?.profit ?? 0,
    worst_loser: results[results.length - 1]?.name ?? "",
    worst_loser_profit: results[results.length - 1]?.profit ?? 0,
    participants: results.map((r) => r.name),
    player_results: results,
  };
}

const games: GameSummary[] = [
  makeGame("g1", "2026-07-31T21:00:00Z", [
    { name: "Ana", profit: 15 },
    { name: "Beto", profit: -5 },
    { name: "Carla", profit: -10 },
  ]),
  makeGame("g2", "2026-08-01T21:00:00Z", [
    { name: "Ana", profit: -8 },
    { name: "Beto", profit: 8 },
  ]),
  makeGame("g3", "2026-08-02T21:00:00Z", [
    { name: "Beto", profit: 12 },
    { name: "Carla", profit: -12 },
  ]),
];

describe("computeGamesAggregate", () => {
  it("solo agrega las partidas seleccionadas", () => {
    const agg = computeGamesAggregate(games, new Set(["g1", "g3"]));
    expect(agg.games).toBe(2);
    expect(agg.totalPot).toBe(80);
    const carla = agg.players.find((p) => p.name === "Carla");
    expect(carla).toMatchObject({ games: 2, balance: -22, losses: 2 });
  });

  it("acumula balance y cuenta partidas por jugador", () => {
    const agg = computeGamesAggregate(games, new Set(["g1", "g2", "g3"]));
    const ana = agg.players.find((p) => p.name === "Ana");
    const beto = agg.players.find((p) => p.name === "Beto");
    expect(ana).toMatchObject({
      games: 2,
      balance: 7,
      wins: 1,
      losses: 1,
      best: 15,
      worst: -8,
    });
    expect(beto).toMatchObject({ games: 3, balance: 15, wins: 2, losses: 1 });
  });

  it("ordena por balance descendente", () => {
    const agg = computeGamesAggregate(games, new Set(["g1", "g2", "g3"]));
    expect(agg.players.map((p) => p.name)).toEqual(["Beto", "Ana", "Carla"]);
  });

  it("calcula el rango de fechas de la selección", () => {
    const agg = computeGamesAggregate(games, new Set(["g2", "g3"]));
    expect(agg.from).toBe("2026-08-01T21:00:00Z");
    expect(agg.to).toBe("2026-08-02T21:00:00Z");
  });

  it("devuelve un acumulado vacío sin selección", () => {
    const agg = computeGamesAggregate(games, new Set());
    expect(agg.games).toBe(0);
    expect(agg.players).toEqual([]);
    expect(agg.from).toBeNull();
  });

  it("los profits cero no cuentan como victoria ni derrota", () => {
    const agg = computeGamesAggregate(
      [makeGame("g4", "2026-08-03T21:00:00Z", [{ name: "Dani", profit: 0 }])],
      new Set(["g4"]),
    );
    const dani = agg.players[0];
    expect(dani).toMatchObject({ games: 1, wins: 0, losses: 0, balance: 0 });
  });
});

describe("computeSettlement", () => {
  it("un deudor paga a un acreedor", () => {
    const payments = computeSettlement([
      { name: "Ana", balance: 10 },
      { name: "Beto", balance: -10 },
    ]);
    expect(payments).toEqual([{ from: "Beto", to: "Ana", amount: 10 }]);
  });

  it("liquida el acumulado con el mínimo de transacciones", () => {
    const payments = computeSettlement([
      { name: "Ana", balance: 30 },
      { name: "Beto", balance: 5 },
      { name: "Carla", balance: -20 },
      { name: "Dani", balance: -15 },
    ]);
    expect(payments).toEqual([
      { from: "Carla", to: "Ana", amount: 20 },
      { from: "Dani", to: "Ana", amount: 10 },
      { from: "Dani", to: "Beto", amount: 5 },
    ]);
  });

  it("los pagos cubren exactamente lo que cada uno debe y cobra", () => {
    const players = [
      { name: "Ana", balance: 12.5 },
      { name: "Beto", balance: -4.25 },
      { name: "Carla", balance: -8.25 },
      { name: "Dani", balance: 0 },
    ];
    const payments = computeSettlement(players);
    const net = new Map(players.map((p) => [p.name, 0]));
    for (const payment of payments) {
      net.set(payment.from, (net.get(payment.from) ?? 0) - payment.amount);
      net.set(payment.to, (net.get(payment.to) ?? 0) + payment.amount);
    }
    for (const player of players) {
      expect(net.get(player.name)).toBeCloseTo(player.balance, 2);
    }
  });

  it("ignora jugadores en tablas y restos de céntimos", () => {
    expect(computeSettlement([{ name: "Ana", balance: 0 }])).toEqual([]);
    expect(
      computeSettlement([
        { name: "Ana", balance: 0.005 },
        { name: "Beto", balance: -0.005 },
      ]),
    ).toEqual([]);
  });
});
