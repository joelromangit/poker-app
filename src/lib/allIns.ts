import type { AllInEntry, AllInResult, Street } from "./allInStats";
import { db } from "./supabase";

export * from "./allInStats";

interface AllInRow {
  id: string;
  pusher_id: string;
  caller_id: string | null;
  street: string;
  pusher_equity: number | null;
  run_it_twice: boolean;
  result: string;
  created_at: string;
  pusher_cards?: string | null;
  caller_cards?: string | null;
  board_cards?: string | null;
}

function rowToEntry(row: AllInRow): AllInEntry {
  return {
    id: row.id,
    pusherId: row.pusher_id,
    callerId: row.caller_id,
    street: (row.street as Street) || "preflop",
    equity: row.pusher_equity,
    runItTwice: row.run_it_twice,
    result: (row.result as AllInResult) || "lost",
    at: row.created_at,
    pusherCards: row.pusher_cards ?? null,
    callerCards: row.caller_cards ?? null,
    boardCards: row.board_cards ?? null,
  };
}

// Obtener los all-ins de una partida (orden cronológico)
export async function getGameAllIns(gameId: string): Promise<AllInEntry[]> {
  const { data, error } = await db
    .from("all_ins")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("Error fetching all-ins:", error);
    return [];
  }
  return data.map(rowToEntry);
}

// Registrar un all-in en una partida existente
export async function addAllIn(
  gameId: string,
  entry: AllInEntry,
): Promise<AllInEntry | null> {
  const { data, error } = await db
    .from("all_ins")
    .insert({
      game_id: gameId,
      pusher_id: entry.pusherId,
      caller_id: entry.callerId,
      street: entry.street,
      pusher_equity: entry.equity,
      run_it_twice: entry.runItTwice,
      result: entry.result,
      created_at: entry.at,
      pusher_cards: entry.pusherCards ?? null,
      caller_cards: entry.callerCards ?? null,
      board_cards: entry.boardCards ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Error adding all-in:", error);
    return null;
  }
  return rowToEntry(data);
}

// Eliminar un all-in
export async function deleteAllIn(id: string): Promise<boolean> {
  const { error } = await db.from("all_ins").delete().eq("id", id);
  if (error) {
    console.error("Error deleting all-in:", error);
    return false;
  }
  return true;
}

// Guardar en bloque los all-ins acumulados en el borrador al crear la partida.
// No lanza: si falla (p. ej. migración sin aplicar) la partida ya está creada
// y se informa por consola.
export async function saveGameAllIns(
  gameId: string,
  entries: ReadonlyArray<AllInEntry>,
): Promise<boolean> {
  if (entries.length === 0) return true;

  const { error } = await db.from("all_ins").insert(
    entries.map((entry) => ({
      game_id: gameId,
      pusher_id: entry.pusherId,
      caller_id: entry.callerId,
      street: entry.street,
      pusher_equity: entry.equity,
      run_it_twice: entry.runItTwice,
      result: entry.result,
      created_at: entry.at,
      pusher_cards: entry.pusherCards ?? null,
      caller_cards: entry.callerCards ?? null,
      board_cards: entry.boardCards ?? null,
    })),
  );

  if (error) {
    console.error("Error saving game all-ins:", error);
    return false;
  }
  return true;
}
