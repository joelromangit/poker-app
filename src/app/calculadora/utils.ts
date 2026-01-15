import {
  type ChipDenomination,
  type ChipDistribution,
  type ChipSet,
  DEFAULT_CHIP_COLORS,
  DEFAULT_CHIP_QUANTITIES,
  type DistributionResult,
} from "./types";

// ============================================
// Utility Functions
// ============================================

export function getDefaultColor(value: number): string {
  if (DEFAULT_CHIP_COLORS[value]) {
    return DEFAULT_CHIP_COLORS[value];
  }
  // Generate a color based on value for custom denominations
  const hue = (value * 37) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

export function getDefaultQuantity(value: number): number {
  if (DEFAULT_CHIP_QUANTITIES[value]) {
    return DEFAULT_CHIP_QUANTITIES[value];
  }
  // Default to 20 for custom denominations
  return 20;
}

// ============================================
// Distribution Algorithm
// ============================================

/**
 * Calculate practical chip distribution for poker gameplay
 * Prioritizes having enough small chips and checks against available quantities
 */
export function calculateDistribution({
  denominations,
  targetValuePerPlayer,
  playerCount,
}: {
  denominations: ChipDenomination[];
  targetValuePerPlayer: number;
  playerCount: number;
}): DistributionResult {
  const warnings: string[] = [];

  // Sort denominations by value (ascending) - prioritize small chips
  const sorted = [...denominations].sort((a, b) => a.value - b.value);

  if (sorted.length === 0) {
    return {
      perPlayer: [],
      totalChips: 0,
      totalValue: 0,
      tableTotal: [],
      warnings: ["No hay denominaciones definidas"],
    };
  }

  // Calculate maximum chips per player for each denomination
  const maxPerPlayer: Map<number, number> = new Map();
  for (const denom of sorted) {
    const maxForPlayer = Math.floor(denom.quantity / playerCount);
    maxPerPlayer.set(denom.value, maxForPlayer);
  }

  // Find exact distribution using recursive backtracking
  // This ensures we hit the exact target value while preferring smaller chips
  const perPlayerDistribution = findExactDistribution({
    denominations: sorted,
    target: targetValuePerPlayer,
    maxPerPlayer,
  });

  // Verify the solution sums to the target
  let totalDistributed = 0;
  for (const denom of sorted) {
    const count = perPlayerDistribution.get(denom.value) || 0;
    totalDistributed += count * denom.value;
  }

  let remainingValue = targetValuePerPlayer - totalDistributed;

  // If no exact solution found, use improved greedy fallback that never overshoots
  if (remainingValue !== 0) {
    // Try a better approach: use dynamic programming to find closest solution
    // that doesn't exceed target
    const fallbackDistribution = findClosestUnderTarget({
      denominations: sorted,
      target: targetValuePerPlayer,
      maxPerPlayer,
    });

    const fallbackTotal = Array.from(fallbackDistribution.entries()).reduce(
      (sum, [value, count]) => sum + value * count,
      0,
    );

    // Use fallback if it's closer to target (and doesn't overshoot)
    if (
      fallbackTotal <= targetValuePerPlayer &&
      Math.abs(targetValuePerPlayer - fallbackTotal) < Math.abs(remainingValue)
    ) {
      for (const [value, count] of fallbackDistribution.entries()) {
        perPlayerDistribution.set(value, count);
      }
      remainingValue = targetValuePerPlayer - fallbackTotal;
    }
  }

  // Check if we couldn't reach the target value
  if (remainingValue > 0) {
    const achievedValue = targetValuePerPlayer - remainingValue;
    warnings.push(
      `Solo se pueden alcanzar ${achievedValue} puntos por jugador (faltan ${remainingValue})`,
    );
  }

  // Check for chip shortage warnings
  for (const denom of sorted) {
    const needed = (perPlayerDistribution.get(denom.value) || 0) * playerCount;
    if (needed > denom.quantity) {
      warnings.push(
        `Faltan fichas de ${denom.value}: necesitas ${needed}, tienes ${denom.quantity}`,
      );
    }
  }

  // Build result
  const perPlayer: ChipDistribution[] = [];
  let totalChips = 0;
  let actualTotalValue = 0;

  for (const denom of sorted) {
    const count = perPlayerDistribution.get(denom.value) || 0;
    if (count > 0) {
      perPlayer.push({
        value: denom.value,
        count,
        color: denom.color,
        name: denom.name,
      });
      totalChips += count;
      actualTotalValue += count * denom.value;
    }
  }

  // Calculate table totals
  const tableTotal: ChipDistribution[] = perPlayer.map((dist) => ({
    ...dist,
    count: dist.count * playerCount,
  }));

  return {
    perPlayer,
    totalChips,
    totalValue: actualTotalValue,
    tableTotal,
    warnings,
  };
}

/**
 * Find exact distribution that hits the target value exactly
 * Uses recursive backtracking with memoization to find the best solution
 * Prefers smaller chips when multiple solutions exist
 */
function findExactDistribution({
  denominations,
  target,
  maxPerPlayer,
}: {
  denominations: ChipDenomination[];
  target: number;
  maxPerPlayer: Map<number, number>;
}): Map<number, number> {
  const result = new Map<number, number>();

  // Initialize all denominations with 0
  for (const denom of denominations) {
    result.set(denom.value, 0);
  }

  // Use recursive function to find exact match
  const solution = findExactRecursive({
    denominations,
    target,
    maxPerPlayer,
    index: 0,
    current: new Map<number, number>(),
  });

  return solution || result;
}

/**
 * Find closest distribution under target using greedy approach
 * Never exceeds target value
 */
function findClosestUnderTarget({
  denominations,
  target,
  maxPerPlayer,
}: {
  denominations: ChipDenomination[];
  target: number;
  maxPerPlayer: Map<number, number>;
}): Map<number, number> {
  const result = new Map<number, number>();
  for (const denom of denominations) {
    result.set(denom.value, 0);
  }

  let remaining = target;

  // Use smallest chips first to maximize chip count while staying under target
  for (const denom of denominations) {
    const maxAvailable = maxPerPlayer.get(denom.value) || 0;
    if (maxAvailable === 0) continue;

    const chipsToUse = Math.min(
      maxAvailable,
      Math.floor(remaining / denom.value),
    );
    if (chipsToUse > 0) {
      result.set(denom.value, chipsToUse);
      remaining -= chipsToUse * denom.value;
    }
  }

  return result;
}

/**
 * Recursive helper to find exact distribution
 * Returns null if no exact solution exists
 */
function findExactRecursive({
  denominations,
  target,
  maxPerPlayer,
  index,
  current,
}: {
  denominations: ChipDenomination[];
  target: number;
  maxPerPlayer: Map<number, number>;
  index: number;
  current: Map<number, number>;
}): Map<number, number> | null {
  // Base case: exact match
  if (target === 0) {
    return new Map(current);
  }

  // Base case: no more denominations or negative target
  if (index >= denominations.length || target < 0) {
    return null;
  }

  const denom = denominations[index];
  const maxAvailable = maxPerPlayer.get(denom.value) || 0;
  const maxByValue = Math.floor(target / denom.value);
  const maxToUse = Math.min(maxAvailable, maxByValue);

  // Try using this denomination from max down to 0 (prefer smaller counts first)
  // This ensures we prefer smaller chips when possible
  for (let count = maxToUse; count >= 0; count--) {
    const valueUsed = count * denom.value;
    const newTarget = target - valueUsed;

    current.set(denom.value, count);

    const solution = findExactRecursive({
      denominations,
      target: newTarget,
      maxPerPlayer,
      index: index + 1,
      current,
    });

    if (solution !== null) {
      return solution;
    }

    current.set(denom.value, 0);
  }

  return null;
}

/**
 * Format distribution as text for clipboard
 */
export function formatDistributionForClipboard({
  result,
  playerCount,
  chipSet,
}: {
  result: DistributionResult;
  playerCount: number;
  chipSet: ChipSet;
}): string {
  const lines: string[] = [
    `🎰 Distribución de Fichas - ${chipSet.name}`,
    `👥 ${playerCount} jugadores`,
    "",
    "📊 Por jugador:",
  ];

  for (const dist of result.perPlayer) {
    const name = dist.name || `Ficha ${dist.value}`;
    lines.push(
      `  ${dist.count}× ${name} (${dist.value}) = ${dist.count * dist.value}`,
    );
  }

  lines.push("");
  lines.push(
    `💰 Total por jugador: ${result.totalValue} puntos (${result.totalChips} fichas)`,
  );
  lines.push("");
  lines.push("📦 Total para la mesa:");

  for (const dist of result.tableTotal) {
    const name = dist.name || `Ficha ${dist.value}`;
    lines.push(`  ${dist.count}× ${name} (${dist.value})`);
  }

  lines.push("");
  lines.push(`🎲 Fichas totales: ${result.totalChips * playerCount}`);

  if (result.warnings.length > 0) {
    lines.push("");
    lines.push("⚠️ Advertencias:");
    for (const warning of result.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  return lines.join("\n");
}

/**
 * Validate chip set configuration
 */
export function validateChipSet(chipSet: ChipSet): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!chipSet.name.trim()) {
    errors.push("El nombre del set es requerido");
  }

  if (chipSet.denominations.length === 0) {
    errors.push("Necesitas al menos una denominación");
  }

  for (const denom of chipSet.denominations) {
    if (denom.value <= 0) {
      errors.push(`Valor inválido: ${denom.value}`);
    }
    if (denom.quantity <= 0) {
      errors.push(`Cantidad inválida para ficha de ${denom.value}`);
    }
  }

  // Check for duplicate values
  const values = chipSet.denominations.map((d) => d.value);
  const uniqueValues = new Set(values);
  if (values.length !== uniqueValues.size) {
    errors.push("Hay valores de fichas duplicados");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if distribution is possible for given players
 */
export function checkDistributionFeasibility({
  denominations,
  targetValuePerPlayer,
  playerCount,
}: {
  denominations: ChipDenomination[];
  targetValuePerPlayer: number;
  playerCount: number;
}): { feasible: boolean; maxPlayers: number; message: string } {
  // Calculate total available value
  const totalAvailableValue = denominations.reduce(
    (sum, d) => sum + d.value * d.quantity,
    0,
  );

  const totalNeeded = targetValuePerPlayer * playerCount;

  if (totalNeeded > totalAvailableValue) {
    const maxPlayers = Math.floor(totalAvailableValue / targetValuePerPlayer);
    return {
      feasible: false,
      maxPlayers,
      message: `No hay suficientes fichas. Máximo ${maxPlayers} jugadores con ${targetValuePerPlayer} puntos cada uno.`,
    };
  }

  return { feasible: true, maxPlayers: playerCount, message: "" };
}

/**
 * Get total chip count in a chip set
 */
export function getTotalChipCount(denominations: ChipDenomination[]): number {
  return denominations.reduce((sum, d) => sum + d.quantity, 0);
}

/**
 * Create standard 300-chip set distribution
 * Standard distribution: 50/50/50/50/50/30/20
 */
export function createStandard300ChipSet(): ChipDenomination[] {
  return [
    {
      value: 5,
      color: DEFAULT_CHIP_COLORS[5] || "#EF4444",
      quantity: 50,
      name: "Roja",
    },
    {
      value: 10,
      color: DEFAULT_CHIP_COLORS[10] || "#1E3A8A",
      quantity: 50,
      name: "Azul Oscuro",
    },
    {
      value: 25,
      color: DEFAULT_CHIP_COLORS[25] || "#22C55E",
      quantity: 50,
      name: "Verde",
    },
    {
      value: 50,
      color: DEFAULT_CHIP_COLORS[50] || "#3B82F6",
      quantity: 50,
      name: "Azul Claro",
    },
    {
      value: 100,
      color: DEFAULT_CHIP_COLORS[100] || "#1F2937",
      quantity: 50,
      name: "Negra",
    },
    {
      value: 500,
      color: DEFAULT_CHIP_COLORS[500] || "#8B5CF6",
      quantity: 30,
      name: "Púrpura",
    },
    {
      value: 1000,
      color: DEFAULT_CHIP_COLORS[1000] || "#FBBF24",
      quantity: 20,
      name: "Amarilla",
    },
  ];
}

/**
 * Create standard 500-chip set distribution
 * Standard distribution: 100/100/75/75/50/50/50
 */
export function createStandard500ChipSet(): ChipDenomination[] {
  return [
    {
      value: 5,
      color: DEFAULT_CHIP_COLORS[5] || "#EF4444",
      quantity: 100,
      name: "Roja",
    },
    {
      value: 10,
      color: DEFAULT_CHIP_COLORS[10] || "#1E3A8A",
      quantity: 100,
      name: "Azul Oscuro",
    },
    {
      value: 25,
      color: DEFAULT_CHIP_COLORS[25] || "#22C55E",
      quantity: 75,
      name: "Verde",
    },
    {
      value: 50,
      color: DEFAULT_CHIP_COLORS[50] || "#3B82F6",
      quantity: 75,
      name: "Azul Claro",
    },
    {
      value: 100,
      color: DEFAULT_CHIP_COLORS[100] || "#1F2937",
      quantity: 75,
      name: "Negra",
    },
    {
      value: 500,
      color: DEFAULT_CHIP_COLORS[500] || "#8B5CF6",
      quantity: 50,
      name: "Púrpura",
    },
    {
      value: 1000,
      color: DEFAULT_CHIP_COLORS[1000] || "#FBBF24",
      quantity: 25,
      name: "Amarilla",
    },
  ];
}

/**
 * Apply standard distribution to a chip set based on total chip count
 * Returns the updated denominations or null if no standard applies
 * Replaces the set with standard distribution, preserving custom colors and names where values match
 */
export function applyStandardDistribution(
  denominations: ChipDenomination[],
): ChipDenomination[] | null {
  const totalChips = getTotalChipCount(denominations);

  if (totalChips === 300) {
    // Replace with standard 300 distribution, preserving custom colors and names
    const standard300 = createStandard300ChipSet();
    const existingMap = new Map(denominations.map((d) => [d.value, d]));

    return standard300.map((standard) => {
      const existing = existingMap.get(standard.value);
      if (existing) {
        // Preserve custom color and name, update quantity
        return { ...existing, quantity: standard.quantity };
      }
      return standard;
    });
  }

  if (totalChips === 500) {
    // Replace with standard 500 distribution, preserving custom colors and names
    const standard500 = createStandard500ChipSet();
    const existingMap = new Map(denominations.map((d) => [d.value, d]));

    return standard500.map((standard) => {
      const existing = existingMap.get(standard.value);
      if (existing) {
        // Preserve custom color and name, update quantity
        return { ...existing, quantity: standard.quantity };
      }
      return standard;
    });
  }

  return null;
}
