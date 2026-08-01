import type { GameSummary } from "@/types";

// Resultado acumulado de un jugador sobre un conjunto de partidas
export interface AggregatePlayerResult {
  name: string;
  games: number; // partidas jugadas dentro de la selección
  balance: number; // suma de profits en esas partidas
  wins: number; // partidas en positivo
  losses: number; // partidas en negativo
  best: number; // mejor resultado (0 si nunca ganó)
  worst: number; // peor resultado (0 si nunca perdió)
}

// Acumulado de una selección de partidas
export interface GamesAggregate {
  games: number;
  totalPot: number;
  from: string | null; // fecha de la partida más antigua (ISO)
  to: string | null; // fecha de la más reciente (ISO)
  players: AggregatePlayerResult[]; // ordenados por balance descendente
}

// Calcular el acumulado de las partidas seleccionadas a partir de sus resúmenes
export function computeGamesAggregate(
  games: ReadonlyArray<GameSummary>,
  selectedIds: ReadonlySet<string>,
): GamesAggregate {
  const selected = games.filter((game) => selectedIds.has(game.id));

  const byPlayer = new Map<string, AggregatePlayerResult>();
  let totalPot = 0;
  let from: string | null = null;
  let to: string | null = null;

  for (const game of selected) {
    totalPot += game.total_pot || 0;
    if (!from || game.created_at < from) from = game.created_at;
    if (!to || game.created_at > to) to = game.created_at;

    for (const result of game.player_results ?? []) {
      let player = byPlayer.get(result.name);
      if (!player) {
        player = {
          name: result.name,
          games: 0,
          balance: 0,
          wins: 0,
          losses: 0,
          best: 0,
          worst: 0,
        };
        byPlayer.set(result.name, player);
      }
      player.games += 1;
      player.balance += result.profit;
      if (result.profit > 0) {
        player.wins += 1;
        player.best = Math.max(player.best, result.profit);
      } else if (result.profit < 0) {
        player.losses += 1;
        player.worst = Math.min(player.worst, result.profit);
      }
    }
  }

  const players = Array.from(byPlayer.values()).sort(
    (a, b) => b.balance - a.balance || a.name.localeCompare(b.name),
  );

  return { games: selected.length, totalPot, from, to, players };
}
