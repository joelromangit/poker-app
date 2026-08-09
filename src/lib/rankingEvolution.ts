import type { HistoryGameInfo, PlayerHistory } from "./historyStats";

// Opciones de ventana para la evolución del ranking
export interface EvolutionOptions {
  from?: string; // YYYY-MM-DD inclusive
  to?: string; // YYYY-MM-DD inclusive
  lastGames?: number; // limitar a las últimas N partidas (tras el filtro de fechas)
}

export interface EvolutionPlayer {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
  finalRank: number; // posición al final de la ventana
  balance: number; // balance acumulado dentro de la ventana
}

export interface EvolutionPoint {
  label: string;
  fullLabel: string;
  [playerName: string]: number | string | null;
}

export interface RankingEvolution {
  points: EvolutionPoint[];
  players: EvolutionPlayer[]; // ordenados por posición final
  maxRank: number;
}

// Calcular la evolución del ranking dentro de una ventana: los balances
// arrancan de cero al inicio de la ventana y tras cada partida se recalcula
// la posición de todos los que ya han jugado en ella.
export function computeRankingEvolution(
  histories: ReadonlyArray<PlayerHistory>,
  options: EvolutionOptions = {},
): RankingEvolution {
  const fromTime = options.from
    ? new Date(`${options.from}T00:00:00`).getTime()
    : null;
  const toTime = options.to
    ? new Date(`${options.to}T23:59:59.999`).getTime()
    : null;

  // Unión de partidas en la ventana, con los profits por jugador
  const gamesById = new Map<
    string,
    { game: HistoryGameInfo; profits: Map<string, number> }
  >();
  for (const history of histories) {
    for (const entry of history.entries) {
      const time = new Date(entry.game.date).getTime();
      if (fromTime !== null && time < fromTime) continue;
      if (toTime !== null && time > toTime) continue;
      let record = gamesById.get(entry.game.id);
      if (!record) {
        record = { game: entry.game, profits: new Map() };
        gamesById.set(entry.game.id, record);
      }
      record.profits.set(history.player.name, entry.profit);
    }
  }

  let sortedGames = Array.from(gamesById.values()).sort(
    (a, b) => new Date(a.game.date).getTime() - new Date(b.game.date).getTime(),
  );
  if (options.lastGames && options.lastGames > 0) {
    sortedGames = sortedGames.slice(-options.lastGames);
  }

  // Jugadores presentes en la ventana final
  const activeNames = new Set<string>();
  for (const record of sortedGames) {
    for (const name of record.profits.keys()) activeNames.add(name);
  }
  const activePlayers = histories.filter((h) => activeNames.has(h.player.name));
  const maxRank = activePlayers.length;

  const cumulative = new Map<string, number>();
  const played = new Set<string>();
  const points: EvolutionPoint[] = sortedGames.map((record, index) => {
    const date = new Date(record.game.date);
    const label = `${index + 1}·${date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    })}`;
    const fullLabel = record.game.name
      ? `${record.game.name} — ${date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`
      : date.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

    for (const [name, profit] of record.profits) {
      cumulative.set(name, (cumulative.get(name) ?? 0) + profit);
      played.add(name);
    }

    // Ranking de los que ya han jugado dentro de la ventana
    const standings = Array.from(played)
      .map((name) => ({ name, balance: cumulative.get(name) ?? 0 }))
      .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));

    const point: EvolutionPoint = { label, fullLabel };
    for (const player of activePlayers) {
      const rank = standings.findIndex((s) => s.name === player.player.name);
      point[player.player.name] = rank === -1 ? null : rank + 1;
    }
    return point;
  });

  // Clasificación final de la ventana
  const finalStandings = activePlayers
    .map((history) => ({
      history,
      balance: cumulative.get(history.player.name) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.balance - a.balance ||
        a.history.player.name.localeCompare(b.history.player.name),
    );

  return {
    points,
    players: finalStandings.map(({ history, balance }, index) => ({
      id: history.player.id,
      name: history.player.name,
      color: history.player.color,
      avatarUrl: history.player.avatarUrl,
      finalRank: index + 1,
      balance,
    })),
    maxRank,
  };
}
