import type { GameSummary } from "@/types";
import type { AllInEntry } from "./allInStats";
import { getAllInBadge } from "./allInStats";
import type { HistoryGameInfo, PlayerHistory } from "./historyStats";

// Quién ostenta un récord del grupo y con qué valor
export interface RecordHolder {
  playerId?: string;
  playerName?: string;
  // Segundo protagonista (p. ej. la víctima de la mayor paliza)
  rivalName?: string;
  gameId?: string;
  gameName?: string | null;
  date?: string; // ISO
  value: string; // valor formateado ("+62.50€", "5 partidas"...)
  detail?: string;
}

// Un récord o título del Salón de la Fama
export interface GroupRecord {
  key: string;
  emoji: string;
  title: string;
  description: string;
  holder: RecordHolder | null;
}

function gameRef(game: HistoryGameInfo | GameSummary): {
  gameId: string;
  gameName: string | null;
  date: string;
} {
  if ("date" in game) {
    return { gameId: game.id, gameName: game.name, date: game.date };
  }
  return {
    gameId: game.id,
    gameName: game.name ?? null,
    date: game.created_at,
  };
}

// Récords de noches y partidas a partir del histórico completo
export function computeGroupRecords(
  histories: ReadonlyArray<PlayerHistory>,
  games: ReadonlyArray<GameSummary>,
): GroupRecord[] {
  const records: GroupRecord[] = [];

  // 💰 Mayor bote
  let biggestPot: GameSummary | null = null;
  for (const game of games) {
    if (!biggestPot || game.total_pot > biggestPot.total_pot) biggestPot = game;
  }
  records.push({
    key: "pot",
    emoji: "💰",
    title: "Mayor bote",
    description: "La noche con más dinero encima de la mesa",
    holder: biggestPot
      ? {
          ...gameRef(biggestPot),
          value: `${biggestPot.total_pot.toFixed(2)}€`,
          detail: `${biggestPot.player_count} jugadores`,
        }
      : null,
  });

  // 🚀 Mejor noche y 💀 peor noche individual
  type NightRecord = {
    history: PlayerHistory;
    entry: PlayerHistory["entries"][0];
  } | null;
  let best: NightRecord = null;
  let worst: NightRecord = null;
  for (const history of histories) {
    for (const entry of history.entries) {
      if (!best || entry.profit > best.entry.profit) best = { history, entry };
      if (!worst || entry.profit < worst.entry.profit)
        worst = { history, entry };
    }
  }
  records.push({
    key: "best-night",
    emoji: "🚀",
    title: "Mejor noche",
    description: "La mayor ganancia individual en una partida",
    holder:
      best && best.entry.profit > 0
        ? {
            playerId: best.history.player.id,
            playerName: best.history.player.name,
            ...gameRef(best.entry.game),
            value: `+${best.entry.profit.toFixed(2)}€`,
          }
        : null,
  });
  records.push({
    key: "worst-night",
    emoji: "💀",
    title: "Peor noche",
    description: "La mayor pérdida individual en una partida",
    holder:
      worst && worst.entry.profit < 0
        ? {
            playerId: worst.history.player.id,
            playerName: worst.history.player.name,
            ...gameRef(worst.entry.game),
            value: `${worst.entry.profit.toFixed(2)}€`,
          }
        : null,
  });

  // 🔥 / 🥶 Rachas más largas (las entradas ya vienen en orden cronológico)
  type StreakRecord = { history: PlayerHistory; length: number } | null;
  let bestStreak: StreakRecord = null;
  let worstStreak: StreakRecord = null;
  for (const history of histories) {
    let wins = 0;
    let losses = 0;
    for (const entry of history.entries) {
      wins = entry.profit > 0 ? wins + 1 : 0;
      losses = entry.profit < 0 ? losses + 1 : 0;
      if (wins > 0 && (!bestStreak || wins > bestStreak.length))
        bestStreak = { history, length: wins };
      if (losses > 0 && (!worstStreak || losses > worstStreak.length))
        worstStreak = { history, length: losses };
    }
  }
  records.push({
    key: "win-streak",
    emoji: "🔥",
    title: "Racha ganadora más larga",
    description: "Partidas seguidas acabando en positivo",
    holder: bestStreak
      ? {
          playerId: bestStreak.history.player.id,
          playerName: bestStreak.history.player.name,
          value: `${bestStreak.length} seguidas`,
        }
      : null,
  });
  records.push({
    key: "loss-streak",
    emoji: "🥶",
    title: "Racha perdedora más larga",
    description: "Partidas seguidas acabando en negativo",
    holder: worstStreak
      ? {
          playerId: worstStreak.history.player.id,
          playerName: worstStreak.history.player.name,
          value: `${worstStreak.length} seguidas`,
        }
      : null,
  });

  // 💥 Mayor escabechina: máxima diferencia entre el mejor y el peor de una noche
  let massacre: GameSummary | null = null;
  let massacreGap = 0;
  for (const game of games) {
    const gap = (game.top_winner_profit ?? 0) - (game.worst_loser_profit ?? 0);
    if (gap > massacreGap) {
      massacreGap = gap;
      massacre = game;
    }
  }
  records.push({
    key: "massacre",
    emoji: "💥",
    title: "Mayor escabechina",
    description: "La mayor distancia entre el primero y el último",
    holder: massacre
      ? {
          playerName: massacre.top_winner,
          rivalName: massacre.worst_loser,
          ...gameRef(massacre),
          value: `${massacreGap.toFixed(2)}€ de diferencia`,
        }
      : null,
  });

  // 🎢 Noche más loca: más dinero cambiando de manos
  let craziest: GameSummary | null = null;
  let craziestSwing = 0;
  for (const game of games) {
    const swing = (game.player_results ?? []).reduce(
      (sum, r) => sum + Math.abs(r.profit),
      0,
    );
    if (swing > craziestSwing) {
      craziestSwing = swing;
      craziest = game;
    }
  }
  records.push({
    key: "crazy-night",
    emoji: "🎢",
    title: "Noche más loca",
    description: "La partida en la que más dinero cambió de manos",
    holder: craziest
      ? {
          ...gameRef(craziest),
          value: `${craziestSwing.toFixed(2)}€ en movimiento`,
        }
      : null,
  });

  return records;
}

// Títulos individuales: quién lidera cada categoría acumulada
export function computePlayerTitles(
  histories: ReadonlyArray<PlayerHistory>,
): GroupRecord[] {
  interface Totals {
    history: PlayerHistory;
    games: number;
    balance: number;
    wins: number;
    rebuys: number;
  }
  const totals: Totals[] = histories
    .map((history) => ({
      history,
      games: history.entries.length,
      balance: history.entries.reduce((sum, e) => sum + e.profit, 0),
      wins: history.entries.filter((e) => e.profit > 0).length,
      rebuys: history.entries.reduce((sum, e) => sum + e.rebuys, 0),
    }))
    .filter((t) => t.games > 0);

  const holderFrom = (t: Totals | null, value: string, detail?: string) =>
    t
      ? {
          playerId: t.history.player.id,
          playerName: t.history.player.name,
          value,
          detail,
        }
      : null;

  const maxBy = (
    fn: (t: Totals) => number,
    filter?: (t: Totals) => boolean,
  ) => {
    let top: Totals | null = null;
    for (const t of totals) {
      if (filter && !filter(t)) continue;
      if (!top || fn(t) > fn(top)) top = t;
    }
    return top;
  };

  const banker = maxBy((t) => t.balance);
  const pit = maxBy((t) => -t.balance);
  const rock = maxBy(
    (t) => t.wins / t.games,
    (t) => t.games >= 5,
  );
  const regular = maxBy((t) => t.games);
  const rebuyKing = maxBy((t) => t.rebuys);

  return [
    {
      key: "banker",
      emoji: "🏦",
      title: "El Banquero",
      description: "Mayor balance acumulado de la historia",
      holder:
        banker && banker.balance > 0
          ? holderFrom(
              banker,
              `+${banker.balance.toFixed(2)}€`,
              `${banker.games} partidas`,
            )
          : null,
    },
    {
      key: "pit",
      emoji: "🕳️",
      title: "El Pozo",
      description: "Peor balance acumulado de la historia",
      holder:
        pit && pit.balance < 0
          ? holderFrom(
              pit,
              `${pit.balance.toFixed(2)}€`,
              `${pit.games} partidas`,
            )
          : null,
    },
    {
      key: "rock",
      emoji: "🧊",
      title: "La Roca",
      description: "Mejor % de noches ganadoras (mínimo 5 partidas)",
      holder: rock
        ? holderFrom(
            rock,
            `${((rock.wins / rock.games) * 100).toFixed(0)}% ganadas`,
            `${rock.wins} de ${rock.games}`,
          )
        : null,
    },
    {
      key: "regular",
      emoji: "📅",
      title: "El Fijo",
      description: "El que nunca falla a una partida",
      holder: regular ? holderFrom(regular, `${regular.games} partidas`) : null,
    },
    {
      key: "rebuy-king",
      emoji: "🧲",
      title: "Rey del Rebuy",
      description: "Más recompras acumuladas",
      holder:
        rebuyKing && rebuyKing.rebuys > 0
          ? holderFrom(rebuyKing, `${rebuyKing.rebuys} rebuys`)
          : null,
    },
  ];
}

// Récords de all-ins de todas las partidas
export function computeAllInRecords(
  allIns: ReadonlyArray<AllInEntry>,
  playerNameById: ReadonlyMap<string, string>,
): GroupRecord[] {
  const name = (id: string) => playerNameById.get(id) ?? "?";

  // 😭 Bad beat más doloroso: perdió con la mayor equity
  let badbeat: AllInEntry | null = null;
  // 🍀 Suckout más épico: ganó con la menor equity
  let suckout: AllInEntry | null = null;
  const pushedCount = new Map<string, number>();
  const badbeatsSuffered = new Map<string, number>();

  for (const entry of allIns) {
    pushedCount.set(entry.pusherId, (pushedCount.get(entry.pusherId) ?? 0) + 1);
    if (entry.equity === null) continue;
    if (
      entry.result === "lost" &&
      (!badbeat || entry.equity > (badbeat.equity ?? 0))
    )
      badbeat = entry;
    if (
      entry.result === "won" &&
      (!suckout || entry.equity < (suckout.equity ?? 100))
    )
      suckout = entry;
    if (getAllInBadge(entry.equity, entry.result) === "badbeat") {
      badbeatsSuffered.set(
        entry.pusherId,
        (badbeatsSuffered.get(entry.pusherId) ?? 0) + 1,
      );
    }
  }

  // 💰 Mayor bote ganado en un all-in
  let biggestPot: AllInEntry | null = null;
  for (const entry of allIns) {
    if (
      entry.result !== "lost" &&
      entry.potEur != null &&
      entry.potEur > 0 &&
      (!biggestPot || entry.potEur > (biggestPot.potEur ?? 0))
    ) {
      biggestPot = entry;
    }
  }

  let topPusher: string | null = null;
  for (const [playerId, count] of pushedCount) {
    if (topPusher === null || count > (pushedCount.get(topPusher) ?? 0))
      topPusher = playerId;
  }
  let stoneHands: string | null = null;
  for (const [playerId, count] of badbeatsSuffered) {
    if (stoneHands === null || count > (badbeatsSuffered.get(stoneHands) ?? 0))
      stoneHands = playerId;
  }

  return [
    {
      key: "big-pot",
      emoji: "💰",
      title: "Mayor bote all-in",
      description: "El bote más gordo ganado yendo con todo",
      holder: biggestPot
        ? {
            playerId: biggestPot.pusherId,
            playerName: name(biggestPot.pusherId),
            rivalName: biggestPot.callerId
              ? name(biggestPot.callerId)
              : undefined,
            value: `${(biggestPot.potEur ?? 0).toFixed(2)}€`,
            date: biggestPot.at,
            gameId: biggestPot.gameId,
          }
        : null,
    },
    {
      key: "badbeat",
      emoji: "😭",
      title: "Bad beat más doloroso",
      description: "Perdió el all-in siendo el mayor favorito",
      holder:
        badbeat && badbeat.equity !== null && badbeat.equity >= 50
          ? {
              playerId: badbeat.pusherId,
              playerName: name(badbeat.pusherId),
              rivalName: badbeat.callerId ? name(badbeat.callerId) : undefined,
              value: `perdió con ${badbeat.equity.toFixed(0)}%`,
              date: badbeat.at,
            }
          : null,
    },
    {
      key: "suckout",
      emoji: "🍀",
      title: "Suckout más épico",
      description: "Ganó el all-in siendo el mayor underdog",
      holder:
        suckout && suckout.equity !== null && suckout.equity <= 50
          ? {
              playerId: suckout.pusherId,
              playerName: name(suckout.pusherId),
              rivalName: suckout.callerId ? name(suckout.callerId) : undefined,
              value: `ganó con ${suckout.equity.toFixed(0)}%`,
              date: suckout.at,
            }
          : null,
    },
    {
      key: "pistolero",
      emoji: "🔫",
      title: "El Pistolero",
      description: "Más all-ins soltados en la historia",
      holder: topPusher
        ? {
            playerId: topPusher,
            playerName: name(topPusher),
            value: `${pushedCount.get(topPusher)} all-ins`,
          }
        : null,
    },
    {
      key: "stone-hands",
      emoji: "🗿",
      title: "Manos de Piedra",
      description: "Más bad beats sufridos",
      holder: stoneHands
        ? {
            playerId: stoneHands,
            playerName: name(stoneHands),
            value: `${badbeatsSuffered.get(stoneHands)} bad beats`,
          }
        : null,
    },
  ];
}
