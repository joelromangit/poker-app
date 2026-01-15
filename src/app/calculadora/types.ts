import { z } from "zod";

export const ChipDenominationSchema = z.object({
  value: z.number().positive(),
  color: z.string().min(1),
  quantity: z.number().int().nonnegative(),
  name: z.string().optional(),
});

export type ChipDenomination = z.infer<typeof ChipDenominationSchema>;

export interface ChipSet {
  id: string;
  name: string;
  denominations: ChipDenomination[];
  is_preset?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ChipDistribution {
  value: number;
  count: number;
  color: string;
  name?: string;
}

export interface DistributionResult {
  perPlayer: ChipDistribution[];
  totalChips: number;
  totalValue: number;
  tableTotal: ChipDistribution[];
  warnings: string[];
}

// Default chip colors matching poker chip aesthetics
export const DEFAULT_CHIP_COLORS: Record<number, string> = {
  5: "#EF4444", // Red
  10: "#1E3A8A", // Dark Blue
  25: "#22C55E", // Green
  50: "#3B82F6", // Light Blue
  100: "#1F2937", // Black/Dark gray
  500: "#8B5CF6", // Purple
  1000: "#FBBF24", // Yellow
  5000: "#EC4899", // Pink
};

// Default quantities for common denominations (500 chips total)
export const DEFAULT_CHIP_QUANTITIES: Record<number, number> = {
  5: 100,
  10: 100,
  25: 75,
  50: 75,
  100: 75,
  500: 50,
  1000: 25,
};

// Fallback preset chip sets (used if database is not available)
export const FALLBACK_CHIP_SETS: ChipSet[] = [
  {
    id: "fallback-standard",
    name: "Estándar",
    is_preset: true,
    denominations: [
      { value: 5, color: "#EF4444", quantity: 100, name: "Roja" },
      { value: 10, color: "#1E3A8A", quantity: 100, name: "Azul Oscuro" },
      { value: 25, color: "#22C55E", quantity: 75, name: "Verde" },
      { value: 50, color: "#3B82F6", quantity: 75, name: "Azul Claro" },
      { value: 100, color: "#1F2937", quantity: 75, name: "Negra" },
      { value: 500, color: "#8B5CF6", quantity: 50, name: "Púrpura" },
      { value: 1000, color: "#FBBF24", quantity: 25, name: "Amarilla" },
    ],
  },
];
