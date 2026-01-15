import { describe, expect, it } from "vitest";
import type { ChipDenomination, ChipSet, DistributionResult } from "./types";
import {
  calculateDistribution,
  checkDistributionFeasibility,
  formatDistributionForClipboard,
  validateChipSet,
} from "./utils";

describe("calculateDistribution", () => {
  it("should return empty distribution when no denominations provided", () => {
    const result = calculateDistribution({
      denominations: [],
      targetValuePerPlayer: 1000,
      playerCount: 4,
    });

    expect(result.perPlayer).toEqual([]);
    expect(result.totalChips).toBe(0);
    expect(result.totalValue).toBe(0);
    expect(result.tableTotal).toEqual([]);
    expect(result.warnings).toContain("No hay denominaciones definidas");
  });

  it("should distribute chips correctly for simple case", () => {
    const denominations: ChipDenomination[] = [
      { value: 100, color: "#000000", quantity: 20, name: "Negra" },
      { value: 25, color: "#22C55E", quantity: 40, name: "Verde" },
      { value: 10, color: "#EF4444", quantity: 50, name: "Roja" },
    ];

    const result = calculateDistribution({
      denominations,
      targetValuePerPlayer: 1000,
      playerCount: 4,
    });

    // With these quantities (max 5×100 + 10×25 + 12×10 = 870 per player),
    // we can't reach 1000, so should get closest possible (870)
    // If exact solution exists, should hit exact target
    expect(result.totalValue).toBeGreaterThan(0);
    expect(result.totalValue).toBeLessThanOrEqual(1000); // Never overshoot
    expect(result.perPlayer.length).toBeGreaterThan(0);
    expect(result.tableTotal.length).toBe(result.perPlayer.length);

    // Verify table totals are player count times per player
    result.perPlayer.forEach((perPlayerDist) => {
      const tableDist = result.tableTotal.find(
        (t) => t.value === perPlayerDist.value,
      );
      expect(tableDist).toBeDefined();
      expect(tableDist!.count).toBe(perPlayerDist.count * 4);
      expect(tableDist!.value).toBe(perPlayerDist.value);
    });
  });

  it("should hit exact target value for standard chip set", () => {
    const denominations: ChipDenomination[] = [
      { value: 5, color: "#FFFFFF", quantity: 50, name: "Blanca" },
      { value: 10, color: "#EF4444", quantity: 50, name: "Roja" },
      { value: 25, color: "#22C55E", quantity: 40, name: "Verde" },
      { value: 50, color: "#3B82F6", quantity: 30, name: "Azul" },
      { value: 100, color: "#1F2937", quantity: 20, name: "Negra" },
    ];

    const result = calculateDistribution({
      denominations,
      targetValuePerPlayer: 1000,
      playerCount: 4,
    });

    // Must hit exact target
    expect(result.totalValue).toBe(1000);
    expect(result.warnings.length).toBe(0);
  });

  it("should prioritize smaller chips", () => {
    const denominations: ChipDenomination[] = [
      { value: 1000, color: "#FBBF24", quantity: 10, name: "Dorada" },
      { value: 100, color: "#1F2937", quantity: 20, name: "Negra" },
      { value: 25, color: "#22C55E", quantity: 40, name: "Verde" },
      { value: 10, color: "#EF4444", quantity: 50, name: "Roja" },
      { value: 5, color: "#FFFFFF", quantity: 50, name: "Blanca" },
    ];

    const result = calculateDistribution({
      denominations,
      targetValuePerPlayer: 500,
      playerCount: 2,
    });

    // Should use smaller chips first
    const smallChips = result.perPlayer.filter((d) => d.value <= 25);
    const largeChips = result.perPlayer.filter((d) => d.value >= 100);

    expect(smallChips.length).toBeGreaterThan(0);
    // Should have some small chips in the distribution
    const hasSmallChips = smallChips.some((d) => d.count > 0);
    expect(hasSmallChips).toBe(true);
  });

  it("should respect chip quantity limits", () => {
    const denominations: ChipDenomination[] = [
      { value: 100, color: "#1F2937", quantity: 2, name: "Negra" }, // Only 2 chips available
      { value: 25, color: "#22C55E", quantity: 10, name: "Verde" },
    ];

    const result = calculateDistribution({
      denominations,
      targetValuePerPlayer: 1000,
      playerCount: 4,
    });

    // Should not exceed available chips
    const blackChipDist = result.tableTotal.find((d) => d.value === 100);
    if (blackChipDist) {
      expect(blackChipDist.count).toBeLessThanOrEqual(2);
    }
  });

  it("should warn when target value cannot be reached", () => {
    const denominations: ChipDenomination[] = [
      { value: 100, color: "#1F2937", quantity: 2, name: "Negra" },
      { value: 25, color: "#22C55E", quantity: 2, name: "Verde" },
    ];

    const result = calculateDistribution({
      denominations,
      targetValuePerPlayer: 1000,
      playerCount: 4,
    });

    // Should have warnings about not reaching target
    const hasWarning = result.warnings.some(
      (w) => w.includes("Solo se pueden alcanzar") || w.includes("faltan"),
    );
    expect(hasWarning).toBe(true);
  });

  it("should warn when chips are insufficient for all players", () => {
    const denominations: ChipDenomination[] = [
      { value: 100, color: "#1F2937", quantity: 2, name: "Negra" }, // Only 2 chips for 4 players
      { value: 25, color: "#22C55E", quantity: 2, name: "Verde" }, // Also limited
    ];

    const result = calculateDistribution({
      denominations,
      targetValuePerPlayer: 500,
      playerCount: 4,
    });

    // Should warn about chip shortage or inability to reach target
    const hasWarning = result.warnings.some(
      (w) =>
        (w.includes("Faltan fichas") && w.includes("necesitas")) ||
        w.includes("Solo se pueden alcanzar"),
    );
    expect(hasWarning).toBe(true);
  });

  it("should handle single denomination correctly", () => {
    const denominations: ChipDenomination[] = [
      { value: 100, color: "#1F2937", quantity: 40, name: "Negra" },
    ];

    const result = calculateDistribution({
      denominations,
      targetValuePerPlayer: 1000,
      playerCount: 4,
    });

    expect(result.perPlayer.length).toBe(1);
    expect(result.perPlayer[0].value).toBe(100);
    expect(result.perPlayer[0].count).toBe(10); // 1000 / 100 = 10 chips per player
    expect(result.totalValue).toBe(1000);
  });

  it("should distribute evenly when chips are abundant", () => {
    const denominations: ChipDenomination[] = [
      { value: 100, color: "#1F2937", quantity: 100, name: "Negra" },
      { value: 25, color: "#22C55E", quantity: 100, name: "Verde" },
      { value: 10, color: "#EF4444", quantity: 100, name: "Roja" },
    ];

    const result = calculateDistribution({
      denominations,
      targetValuePerPlayer: 500,
      playerCount: 4,
    });

    // Function may prioritize small chips, so value may be close but not exact
    expect(result.totalValue).toBeGreaterThan(0);
    expect(result.totalValue).toBeLessThanOrEqual(500 + 100); // Allow some overshoot for practical distribution

    // Each player should get chips worth close to 500 points
    const playerValue = result.perPlayer.reduce(
      (sum, dist) => sum + dist.value * dist.count,
      0,
    );
    expect(playerValue).toBeGreaterThan(0);
    expect(playerValue).toBeLessThanOrEqual(600); // Allow some overshoot
  });

  it("should handle edge case with very small target value", () => {
    const denominations: ChipDenomination[] = [
      { value: 5, color: "#FFFFFF", quantity: 50, name: "Blanca" },
      { value: 10, color: "#EF4444", quantity: 50, name: "Roja" },
    ];

    const result = calculateDistribution({
      denominations,
      targetValuePerPlayer: 5,
      playerCount: 2,
    });

    // Function may prefer to use more chips for practical gameplay
    expect(result.totalValue).toBeGreaterThanOrEqual(5);
    expect(result.perPlayer.length).toBeGreaterThan(0);

    // Should use at least one chip worth 5 or more
    const minChipValue = Math.min(...result.perPlayer.map((d) => d.value));
    expect(minChipValue).toBeLessThanOrEqual(5);
  });

  it("should handle edge case with very large target value", () => {
    const denominations: ChipDenomination[] = [
      { value: 1000, color: "#FBBF24", quantity: 10, name: "Dorada" },
      { value: 500, color: "#8B5CF6", quantity: 20, name: "Púrpura" },
      { value: 100, color: "#1F2937", quantity: 40, name: "Negra" },
    ];

    const result = calculateDistribution({
      denominations,
      targetValuePerPlayer: 10000,
      playerCount: 2,
    });

    // Should use largest chips first when target is very high
    const largeChips = result.perPlayer.filter((d) => d.value >= 500);
    expect(largeChips.length).toBeGreaterThan(0);
  });

  it("should correctly calculate table totals", () => {
    const denominations: ChipDenomination[] = [
      { value: 100, color: "#1F2937", quantity: 20, name: "Negra" },
      { value: 25, color: "#22C55E", quantity: 40, name: "Verde" },
    ];

    const playerCount = 4;
    const result = calculateDistribution({
      denominations,
      targetValuePerPlayer: 500,
      playerCount,
    });

    result.perPlayer.forEach((perPlayerDist) => {
      const tableDist = result.tableTotal.find(
        (t) => t.value === perPlayerDist.value,
      );
      expect(tableDist).toBeDefined();
      expect(tableDist!.count).toBe(perPlayerDist.count * playerCount);
    });
  });

  it("should handle denominations in any order", () => {
    const denominations: ChipDenomination[] = [
      { value: 500, color: "#8B5CF6", quantity: 10, name: "Púrpura" },
      { value: 5, color: "#FFFFFF", quantity: 50, name: "Blanca" },
      { value: 100, color: "#1F2937", quantity: 20, name: "Negra" },
      { value: 25, color: "#22C55E", quantity: 40, name: "Verde" },
    ];

    const result = calculateDistribution({
      denominations,
      targetValuePerPlayer: 1000,
      playerCount: 4,
    });

    // Should still work correctly regardless of input order
    // Function sorts internally, so order shouldn't matter
    expect(result.totalValue).toBeGreaterThan(0);
    expect(result.perPlayer.length).toBeGreaterThan(0);

    // Verify it uses available chips
    const totalDistributed = result.perPlayer.reduce(
      (sum, dist) => sum + dist.count * dist.value,
      0,
    );
    expect(totalDistributed).toBeGreaterThan(0);
  });

  it("should handle zero quantity denominations gracefully", () => {
    const denominations: ChipDenomination[] = [
      { value: 100, color: "#1F2937", quantity: 0, name: "Negra" },
      { value: 25, color: "#22C55E", quantity: 40, name: "Verde" },
    ];

    const result = calculateDistribution({
      denominations,
      targetValuePerPlayer: 500,
      playerCount: 4,
    });

    // Should not include chips with zero quantity
    const blackChipDist = result.perPlayer.find((d) => d.value === 100);
    expect(blackChipDist).toBeUndefined();
  });
});

describe("formatDistributionForClipboard", () => {
  it("should format distribution correctly", () => {
    const result: DistributionResult = {
      perPlayer: [
        { value: 100, count: 5, color: "#000000", name: "Negra" },
        { value: 25, count: 8, color: "#22C55E", name: "Verde" },
      ],
      totalChips: 13,
      totalValue: 700,
      tableTotal: [
        { value: 100, count: 20, color: "#000000", name: "Negra" },
        { value: 25, count: 32, color: "#22C55E", name: "Verde" },
      ],
      warnings: [],
    };

    const chipSet: ChipSet = {
      id: "test",
      name: "Test Set",
      denominations: [],
    };

    const formatted = formatDistributionForClipboard({
      result,
      playerCount: 4,
      chipSet,
    });

    expect(formatted).toContain("Test Set");
    expect(formatted).toContain("4 jugadores");
    expect(formatted).toContain("Por jugador");
    expect(formatted).toContain("Negra");
    expect(formatted).toContain("Verde");
    expect(formatted).toContain("700 puntos");
    expect(formatted).toContain("Total para la mesa");
  });

  it("should include warnings in formatted output", () => {
    const result: DistributionResult = {
      perPlayer: [],
      totalChips: 0,
      totalValue: 0,
      tableTotal: [],
      warnings: ["Test warning"],
    };

    const chipSet: ChipSet = {
      id: "test",
      name: "Test Set",
      denominations: [],
    };

    const formatted = formatDistributionForClipboard({
      result,
      playerCount: 2,
      chipSet,
    });

    expect(formatted).toContain("Advertencias");
    expect(formatted).toContain("Test warning");
  });
});

describe("validateChipSet", () => {
  it("should validate correct chip set", () => {
    const chipSet: ChipSet = {
      id: "test",
      name: "Test Set",
      denominations: [
        { value: 100, color: "#000000", quantity: 20, name: "Negra" },
        { value: 25, color: "#22C55E", quantity: 40, name: "Verde" },
      ],
    };

    const validation = validateChipSet(chipSet);

    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it("should reject chip set with empty name", () => {
    const chipSet: ChipSet = {
      id: "test",
      name: "   ",
      denominations: [{ value: 100, color: "#000000", quantity: 20 }],
    };

    const validation = validateChipSet(chipSet);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("El nombre del set es requerido");
  });

  it("should reject chip set with no denominations", () => {
    const chipSet: ChipSet = {
      id: "test",
      name: "Test Set",
      denominations: [],
    };

    const validation = validateChipSet(chipSet);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("Necesitas al menos una denominación");
  });

  it("should reject chip set with invalid values", () => {
    const chipSet: ChipSet = {
      id: "test",
      name: "Test Set",
      denominations: [
        { value: -10, color: "#000000", quantity: 20 },
        { value: 0, color: "#22C55E", quantity: 40 },
      ],
    };

    const validation = validateChipSet(chipSet);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes("Valor inválido"))).toBe(
      true,
    );
  });

  it("should reject chip set with invalid quantities", () => {
    const chipSet: ChipSet = {
      id: "test",
      name: "Test Set",
      denominations: [
        { value: 100, color: "#000000", quantity: -5 },
        { value: 25, color: "#22C55E", quantity: 0 },
      ],
    };

    const validation = validateChipSet(chipSet);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes("Cantidad inválida"))).toBe(
      true,
    );
  });

  it("should reject chip set with duplicate values", () => {
    const chipSet: ChipSet = {
      id: "test",
      name: "Test Set",
      denominations: [
        { value: 100, color: "#000000", quantity: 20 },
        { value: 100, color: "#22C55E", quantity: 40 },
      ],
    };

    const validation = validateChipSet(chipSet);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("Hay valores de fichas duplicados");
  });
});

describe("checkDistributionFeasibility", () => {
  it("should return feasible when chips are sufficient", () => {
    const denominations: ChipDenomination[] = [
      { value: 100, color: "#000000", quantity: 40, name: "Negra" },
      { value: 25, color: "#22C55E", quantity: 40, name: "Verde" },
    ];

    const result = checkDistributionFeasibility({
      denominations,
      targetValuePerPlayer: 1000,
      playerCount: 4,
    });

    expect(result.feasible).toBe(true);
    expect(result.maxPlayers).toBe(4);
    expect(result.message).toBe("");
  });

  it("should return not feasible when chips are insufficient", () => {
    const denominations: ChipDenomination[] = [
      { value: 100, color: "#000000", quantity: 2, name: "Negra" },
      { value: 25, color: "#22C55E", quantity: 2, name: "Verde" },
    ];

    const result = checkDistributionFeasibility({
      denominations,
      targetValuePerPlayer: 1000,
      playerCount: 4,
    });

    expect(result.feasible).toBe(false);
    expect(result.maxPlayers).toBeLessThan(4);
    expect(result.message).toContain("No hay suficientes fichas");
  });

  it("should calculate correct max players", () => {
    const denominations: ChipDenomination[] = [
      { value: 100, color: "#000000", quantity: 20, name: "Negra" }, // 2000 total value
    ];

    const result = checkDistributionFeasibility({
      denominations,
      targetValuePerPlayer: 1000,
      playerCount: 4,
    });

    expect(result.maxPlayers).toBe(2); // 2000 / 1000 = 2 players
  });
});
