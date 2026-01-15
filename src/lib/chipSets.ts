import { z } from "zod";
import type { ChipDenomination, ChipSet } from "@/app/calculadora/types";
import {
  ChipDenominationSchema,
  FALLBACK_CHIP_SETS,
} from "@/app/calculadora/types";
import type { Json } from "@/lib/database.types";
import { db } from "@/lib/supabase";

// Helper to convert JSON from database to ChipDenomination[]
function parseChipDenominations(json: Json): ChipDenomination[] {
  if (!Array.isArray(json)) return [];

  const result = z.array(ChipDenominationSchema).safeParse(json);
  if (!result.success) {
    console.error("Invalid chip denominations data:", result.error);
    return [];
  }

  return result.data;
}

export async function getChipSets(): Promise<ChipSet[]> {
  try {
    const { data, error } = await db
      .from("chip_sets")
      .select("*")
      .order("is_preset", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching chip sets:", error);
      return FALLBACK_CHIP_SETS;
    }

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      denominations: parseChipDenominations(row.denominations),
      is_preset: row.is_preset,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (err) {
    console.error("Error fetching chip sets:", err);
    return FALLBACK_CHIP_SETS;
  }
}

export async function createChipSet(
  chipSet: Omit<ChipSet, "id" | "created_at" | "updated_at">,
): Promise<ChipSet | null> {
  try {
    const { data, error } = await db
      .from("chip_sets")
      .insert({
        name: chipSet.name,
        denominations: chipSet.denominations,
        is_preset: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating chip set:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      denominations: parseChipDenominations(data.denominations),
      is_preset: data.is_preset,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (err) {
    console.error("Error creating chip set:", err);
    return null;
  }
}

export async function updateChipSet(
  id: string,
  updates: Partial<
    Omit<ChipSet, "id" | "is_preset" | "created_at" | "updated_at">
  >,
): Promise<ChipSet | null> {
  try {
    const updateData: { name?: string; denominations?: ChipDenomination[] } = {
      name: updates.name,
      denominations: updates.denominations,
    };

    const { data, error } = await db
      .from("chip_sets")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating chip set:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      denominations: parseChipDenominations(data.denominations),
      is_preset: data.is_preset,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (err) {
    console.error("Error updating chip set:", err);
    return null;
  }
}

export async function deleteChipSet(id: string): Promise<boolean> {
  try {
    const { error } = await db.from("chip_sets").delete().eq("id", id);

    if (error) {
      console.error("Error deleting chip set:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error deleting chip set:", err);
    return false;
  }
}
