import { describe, expect, it } from "vitest";
import type { Card } from "./cards";
import { computeAllInEquity } from "./equity";

describe("computeAllInEquity", () => {
  it("calcula exacto en el flop (doble pareja vs top pair)", async () => {
    // AhKh (top pair) vs 7c2d (doble pareja) en Kd7h2s: ~29% para AK
    const eq = await computeAllInEquity(
      ["Ah", "Kh"],
      ["7c", "2d"],
      ["Kd", "7h", "2s"],
    );
    expect(eq).not.toBeNull();
    expect(eq).toBeGreaterThan(25);
    expect(eq).toBeLessThan(33);
  });

  it("en el river el resultado es 0 o 100", async () => {
    const eq = await computeAllInEquity(
      ["Ah", "Kh"],
      ["7c", "2d"],
      ["Kd", "7h", "2s", "4c", "7d"],
    );
    expect(eq).toBe(0); // el 7d da trío al 72
  });

  it("preflop (Monte Carlo) se acerca al valor real", async () => {
    // AKs vs QQ: ~46% para AKs
    const eq = await computeAllInEquity(["As", "Ks"], ["Qd", "Qh"], []);
    expect(eq).not.toBeNull();
    expect(eq).toBeGreaterThan(40);
    expect(eq).toBeLessThan(52);
  });

  it("los empates reparten equity a medias", async () => {
    // Manos espejo AKo vs AKo: ~50% para cada uno
    const eq = await computeAllInEquity(["Ah", "Kd"], ["Ad", "Kh"], []);
    expect(eq).not.toBeNull();
    expect(eq).toBeGreaterThan(45);
    expect(eq).toBeLessThan(55);
  });

  it("rechaza manos incompletas, boards inválidos o cartas duplicadas", async () => {
    expect(
      await computeAllInEquity(["Ah"] as Card[], ["7c", "2d"], []),
    ).toBeNull();
    expect(
      await computeAllInEquity(["Ah", "Kh"], ["7c", "2d"], ["Kd", "7h"]),
    ).toBeNull();
    expect(await computeAllInEquity(["Ah", "Kh"], ["Ah", "2d"], [])).toBeNull();
  });
});
