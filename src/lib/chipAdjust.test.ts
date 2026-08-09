import { describe, expect, it } from "vitest";
import { smartDistribute } from "./chipAdjust";

const sum = (values: number[]) => values.reduce((s, v) => s + v, 0);

describe("smartDistribute", () => {
  it("si ya cuadra no toca nada", () => {
    expect(smartDistribute([1000, 500, 500], 2000)).toEqual([1000, 500, 500]);
  });

  it("reparte lo que falta proporcionalmente al stack", () => {
    const result = smartDistribute([1000, 500, 500], 2100);
    expect(sum(result)).toBe(2100);
    // El stack grande absorbe la mitad de las 100 que faltan
    expect(result[0]).toBe(1050);
    expect(result[1]).toBe(1025 - 1000 + 500);
    expect(result[2]).toBe(525);
  });

  it("reparte lo que sobra proporcionalmente", () => {
    const result = smartDistribute([1100, 550, 550], 2000);
    expect(sum(result)).toBe(2000);
    expect(result[0]).toBe(1000);
    expect(result[1]).toBe(500);
    expect(result[2]).toBe(500);
  });

  it("cuadra exacto aunque el reparto proporcional no sea entero", () => {
    const result = smartDistribute([333, 333, 333], 1000);
    expect(sum(result)).toBe(1000);
  });

  it("con todos a cero reparte a partes iguales", () => {
    const result = smartDistribute([0, 0, 0, 0], 100);
    expect(sum(result)).toBe(100);
    expect(Math.max(...result) - Math.min(...result)).toBeLessThanOrEqual(1);
  });

  it("nunca deja a nadie en negativo", () => {
    const result = smartDistribute([10, 1000], 500);
    expect(sum(result)).toBe(500);
    expect(result.every((v) => v >= 0)).toBe(true);
  });

  it("sin jugadores devuelve vacío", () => {
    expect(smartDistribute([], 100)).toEqual([]);
  });
});
