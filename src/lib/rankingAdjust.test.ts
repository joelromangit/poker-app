import { describe, expect, it } from "vitest";
import type { PlayerHistory } from "./historyStats";
import {
  applyDiscountToHistories,
  discountExcludedFromGame,
} from "./rankingAdjust";

const game = (rows: [string, number][]) =>
  rows.map(([playerId, profit]) => ({ playerId, profit }));

const profitOf = (
  rows: { playerId: string; profit: number }[],
  id: string,
) => rows.find((r) => r.playerId === id)?.profit;

describe("discountExcludedFromGame", () => {
  it("reparte la pérdida del excluido entre los ganadores proporcionalmente", () => {
    // A +30, B +10, C -15, X -25 → sin X: la pérdida de 25 sale de A y B
    const rows = game([
      ["a", 30],
      ["b", 10],
      ["c", -15],
      ["x", -25],
    ]);
    const adjusted = discountExcludedFromGame(rows, new Set(["x"]));

    expect(profitOf(adjusted, "a")).toBeCloseTo(11.25);
    expect(profitOf(adjusted, "b")).toBeCloseTo(3.75);
    expect(profitOf(adjusted, "c")).toBeCloseTo(-15);
    expect(profitOf(adjusted, "x")).toBeUndefined();
    // La partida ajustada vuelve a sumar cero
    expect(adjusted.reduce((s, r) => s + r.profit, 0)).toBeCloseTo(0);
  });

  it("devuelve las ganancias del excluido a los perdedores proporcionalmente", () => {
    // X +20, A +10, B -20, C -10 → los 20 de X vuelven a B y C
    const rows = game([
      ["x", 20],
      ["a", 10],
      ["b", -20],
      ["c", -10],
    ]);
    const adjusted = discountExcludedFromGame(rows, new Set(["x"]));

    expect(profitOf(adjusted, "a")).toBeCloseTo(10);
    expect(profitOf(adjusted, "b")).toBeCloseTo(-20 + 20 * (20 / 30));
    expect(profitOf(adjusted, "c")).toBeCloseTo(-10 + 20 * (10 / 30));
    expect(adjusted.reduce((s, r) => s + r.profit, 0)).toBeCloseTo(0);
  });

  it("no cambia nada si el excluido quedó en tablas", () => {
    const rows = game([
      ["a", 10],
      ["b", -10],
      ["x", 0],
    ]);
    const adjusted = discountExcludedFromGame(rows, new Set(["x"]));
    expect(profitOf(adjusted, "a")).toBe(10);
    expect(profitOf(adjusted, "b")).toBe(-10);
  });

  it("no cambia nada si el excluido no jugó la partida", () => {
    const rows = game([
      ["a", 5],
      ["b", -5],
    ]);
    const adjusted = discountExcludedFromGame(rows, new Set(["x"]));
    expect(adjusted).toHaveLength(2);
    expect(profitOf(adjusted, "a")).toBe(5);
  });

  it("agrega el neto de varios excluidos a la vez", () => {
    // X -10 e Y +4 → neto -6 repartido entre los ganadores restantes
    const rows = game([
      ["a", 9],
      ["b", 3],
      ["c", -6],
      ["x", -10],
      ["y", 4],
    ]);
    const adjusted = discountExcludedFromGame(rows, new Set(["x", "y"]));
    expect(profitOf(adjusted, "a")).toBeCloseTo(9 - 6 * (9 / 12));
    expect(profitOf(adjusted, "b")).toBeCloseTo(3 - 6 * (3 / 12));
    expect(profitOf(adjusted, "c")).toBeCloseTo(-6);
    expect(adjusted.reduce((s, r) => s + r.profit, 0)).toBeCloseTo(0);
  });

  it("descarta la partida si queda menos de 2 jugadores (mano a mano con el excluido)", () => {
    const rows = game([
      ["a", 25],
      ["x", -25],
    ]);
    expect(discountExcludedFromGame(rows, new Set(["x"]))).toEqual([]);
  });
});

const historyGame = (id: string, date: string) => ({
  id,
  name: null,
  date,
  bigBlind: 0.1,
});

const history = (
  id: string,
  entries: [string, number][],
): PlayerHistory => ({
  player: { id, name: id.toUpperCase(), color: "#fff" },
  entries: entries.map(([gameId, profit]) => ({
    game: historyGame(gameId, `2026-01-0${gameId.slice(-1)}T20:00:00Z`),
    profit,
    rebuys: 0,
  })),
});

describe("applyDiscountToHistories", () => {
  it("quita a los excluidos, ajusta al resto y descarta partidas huérfanas", () => {
    // g1: a +30, b -5, x -25 · g2 (mano a mano): a +10, x -10
    const histories = [
      history("a", [
        ["g1", 30],
        ["g2", 10],
      ]),
      history("b", [["g1", -5]]),
      history("x", [
        ["g1", -25],
        ["g2", -10],
      ]),
    ];
    const result = applyDiscountToHistories(histories, new Set(["x"]));

    expect(result.map((h) => h.player.id)).toEqual(["a", "b"]);
    const a = result.find((h) => h.player.id === "a");
    // g1: a era el único ganador, absorbe toda la pérdida de x → +5
    // g2: descartada (solo quedaba a)
    expect(a?.entries).toHaveLength(1);
    expect(a?.entries[0].profit).toBeCloseTo(5);
    const b = result.find((h) => h.player.id === "b");
    expect(b?.entries[0].profit).toBeCloseTo(-5);
  });

  it("sin excluidos devuelve los históricos tal cual", () => {
    const histories = [history("a", [["g1", 10]])];
    const result = applyDiscountToHistories(histories, new Set());
    expect(result[0].entries[0].profit).toBe(10);
  });
});
