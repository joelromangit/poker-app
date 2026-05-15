import type { Json } from "@/lib/database.types";
import { db } from "@/lib/supabase";

export const PLAYERS_COLUMNS_KEY = "players_columns_visibility";

export type PlayerColumnKey =
  | "games"
  | "balance"
  | "winrate"
  | "average"
  | "best"
  | "worst";

export type PlayersColumnsVisibility = Record<PlayerColumnKey, boolean>;

export const DEFAULT_PLAYERS_COLUMNS: PlayersColumnsVisibility = {
  games: true,
  balance: true,
  winrate: true,
  average: true,
  best: true,
  worst: true,
};

export const PLAYERS_COLUMNS_META: ReadonlyArray<{
  key: PlayerColumnKey;
  label: string;
}> = [
  { key: "games", label: "Partidas" },
  { key: "balance", label: "Balance" },
  { key: "winrate", label: "% Victorias" },
  { key: "average", label: "Media" },
  { key: "best", label: "Mejor" },
  { key: "worst", label: "Peor" },
];

function sanitizePlayersColumns(value: unknown): PlayersColumnsVisibility {
  if (!value || typeof value !== "object")
    return { ...DEFAULT_PLAYERS_COLUMNS };
  const obj = value as Record<string, unknown>;
  const result = { ...DEFAULT_PLAYERS_COLUMNS };
  for (const { key } of PLAYERS_COLUMNS_META) {
    if (typeof obj[key] === "boolean") {
      result[key] = obj[key] as boolean;
    }
  }
  return result;
}

export async function getPlayersColumnsVisibility(): Promise<PlayersColumnsVisibility> {
  try {
    const { data, error } = await db
      .from("user_preferences")
      .select("value")
      .eq("key", PLAYERS_COLUMNS_KEY)
      .maybeSingle();

    if (error) {
      console.error("Error fetching players columns visibility:", error);
      return { ...DEFAULT_PLAYERS_COLUMNS };
    }
    if (!data) return { ...DEFAULT_PLAYERS_COLUMNS };
    return sanitizePlayersColumns(data.value);
  } catch (err) {
    console.error("Error fetching players columns visibility:", err);
    return { ...DEFAULT_PLAYERS_COLUMNS };
  }
}

export async function savePlayersColumnsVisibility(
  visibility: PlayersColumnsVisibility,
): Promise<boolean> {
  try {
    const { error } = await db.from("user_preferences").upsert(
      {
        key: PLAYERS_COLUMNS_KEY,
        value: visibility as unknown as Json,
      },
      { onConflict: "key" },
    );
    if (error) {
      console.error("Error saving players columns visibility:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error saving players columns visibility:", err);
    return false;
  }
}

export const RANKING_HIDDEN_PLAYERS_KEY = "ranking_hidden_players";

function sanitizeHiddenPlayerIds(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const obj = value as Record<string, unknown>;
  const arr = obj.player_ids;
  if (!Array.isArray(arr)) return [];
  return arr.filter((id): id is string => typeof id === "string");
}

export async function getRankingHiddenPlayerIds(): Promise<string[]> {
  try {
    const { data, error } = await db
      .from("user_preferences")
      .select("value")
      .eq("key", RANKING_HIDDEN_PLAYERS_KEY)
      .maybeSingle();

    if (error) {
      console.error("Error fetching ranking hidden players:", error);
      return [];
    }
    if (!data) return [];
    return sanitizeHiddenPlayerIds(data.value);
  } catch (err) {
    console.error("Error fetching ranking hidden players:", err);
    return [];
  }
}

export async function saveRankingHiddenPlayerIds(
  ids: string[],
): Promise<boolean> {
  try {
    const { error } = await db.from("user_preferences").upsert(
      {
        key: RANKING_HIDDEN_PLAYERS_KEY,
        value: { player_ids: ids } as unknown as Json,
      },
      { onConflict: "key" },
    );
    if (error) {
      console.error("Error saving ranking hidden players:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error saving ranking hidden players:", err);
    return false;
  }
}
