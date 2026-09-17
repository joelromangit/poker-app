import type { PlayerHistory } from "./historyStats";

// Resultado de un jugador dentro de una partida concreta
export interface GamePlayerProfit {
  playerId: string;
  profit: number;
}

// Ajustar una partida como si los jugadores excluidos no hubieran jugado.
// El poker es de suma cero: lo que pierden los excluidos se lo reparten los
// ganadores, así que se les descuenta proporcionalmente a lo que ganaron (y
// simétricamente, si el excluido ganó, se devuelve a los que perdieron).
//
// Devuelve SOLO los resultados ajustados de los jugadores no excluidos.
// Si tras quitar a los excluidos quedan menos de 2 jugadores, la partida
// deja de tener sentido (era un mano a mano con el excluido) y se descarta
// devolviendo una lista vacía.
export function discountExcludedFromGame(
  rows: ReadonlyArray<GamePlayerProfit>,
  excluded: ReadonlySet<string>,
): GamePlayerProfit[] {
  const excludedRows = rows.filter((r) => excluded.has(r.playerId));
  const remaining = rows.filter((r) => !excluded.has(r.playerId));

  if (excludedRows.length === 0) return remaining.map((r) => ({ ...r }));
  if (remaining.length < 2) return [];

  // Balance neto de los excluidos en la partida
  const excludedNet = excludedRows.reduce((sum, r) => sum + r.profit, 0);
  if (excludedNet === 0) return remaining.map((r) => ({ ...r }));

  if (excludedNet < 0) {
    // Los excluidos perdieron: ese dinero fue a los ganadores restantes,
    // se les descuenta en proporción a lo que ganó cada uno
    const loss = -excludedNet;
    const totalWinnings = remaining.reduce(
      (sum, r) => sum + (r.profit > 0 ? r.profit : 0),
      0,
    );
    if (totalWinnings <= 0) return remaining.map((r) => ({ ...r }));
    return remaining.map((r) => ({
      playerId: r.playerId,
      profit:
        r.profit > 0 ? r.profit - loss * (r.profit / totalWinnings) : r.profit,
    }));
  }

  // Los excluidos ganaron: se devuelve a los perdedores restantes en
  // proporción a lo que perdió cada uno
  const gain = excludedNet;
  const totalLosses = remaining.reduce(
    (sum, r) => sum + (r.profit < 0 ? -r.profit : 0),
    0,
  );
  if (totalLosses <= 0) return remaining.map((r) => ({ ...r }));
  return remaining.map((r) => ({
    playerId: r.playerId,
    profit:
      r.profit < 0 ? r.profit + gain * (-r.profit / totalLosses) : r.profit,
  }));
}

// Aplicar el descuento a los históricos completos: los excluidos desaparecen,
// los profits del resto se ajustan partida a partida y las partidas que se
// quedan sin al menos 2 jugadores se descartan.
export function applyDiscountToHistories(
  histories: ReadonlyArray<PlayerHistory>,
  excluded: ReadonlySet<string>,
): PlayerHistory[] {
  if (excluded.size === 0) return histories.map((h) => ({ ...h }));

  // Reunir los resultados de cada partida a partir de todos los históricos
  const rowsByGame = new Map<string, GamePlayerProfit[]>();
  for (const history of histories) {
    for (const entry of history.entries) {
      const rows = rowsByGame.get(entry.game.id);
      const row = { playerId: history.player.id, profit: entry.profit };
      if (rows) rows.push(row);
      else rowsByGame.set(entry.game.id, [row]);
    }
  }

  // Profit ajustado por partida y jugador (las partidas descartadas no aparecen)
  const adjustedByGame = new Map<string, Map<string, number>>();
  for (const [gameId, rows] of rowsByGame) {
    const adjusted = discountExcludedFromGame(rows, excluded);
    if (adjusted.length === 0) continue;
    adjustedByGame.set(
      gameId,
      new Map(adjusted.map((r) => [r.playerId, r.profit])),
    );
  }

  return histories
    .filter((h) => !excluded.has(h.player.id))
    .map((history) => ({
      player: history.player,
      entries: history.entries.flatMap((entry) => {
        const profit = adjustedByGame
          .get(entry.game.id)
          ?.get(history.player.id);
        if (profit === undefined) return [];
        return [{ ...entry, profit }];
      }),
    }));
}
