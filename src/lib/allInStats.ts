// Calle en la que se produce el all-in
export type Street = "preflop" | "flop" | "turn" | "river";

// Resultado para el que va all-in (split = una y una en run it twice)
export type AllInResult = "won" | "lost" | "split";

export const STREET_META: Record<Street, { label: string; emoji: string }> = {
  preflop: { label: "Preflop", emoji: "🂠" },
  flop: { label: "Flop", emoji: "🃏" },
  turn: { label: "Turn", emoji: "🎯" },
  river: { label: "River", emoji: "🌊" },
};

export const RESULT_META: Record<
  AllInResult,
  { label: string; emoji: string }
> = {
  won: { label: "Ganado", emoji: "✅" },
  lost: { label: "Perdido", emoji: "❌" },
  split: { label: "Una y una", emoji: "🤝" },
};

// Un all-in a nivel de UI (sirve tanto para borrador como para filas de DB)
export interface AllInEntry {
  id?: string; // id de DB (los de borrador aún no tienen)
  pusherId: string;
  callerId: string | null; // null = varios / la mesa
  street: Street;
  equity: number | null; // % del pusher al momento del call (null = desconocido)
  runItTwice: boolean;
  result: AllInResult;
  at: string; // ISO
  // Cartas en notación compacta ("AsKd"); opcionales
  pusherCards?: string | null;
  callerCards?: string | null;
  boardCards?: string | null;
  // Bote total de la mano en € (incluye lo que ya había en la mesa)
  potEur?: number | null;
  // Foto de la mesa en el momento del all-in
  photoUrl?: string | null;
  // Partida a la que pertenece (solo en lecturas globales de DB)
  gameId?: string;
}

// Momento dramático del all-in según equity y resultado
export type AllInBadge = "badbeat" | "suckout" | "coinflip" | null;

export const BADGE_META: Record<
  Exclude<AllInBadge, null>,
  { label: string; emoji: string; className: string }
> = {
  badbeat: {
    label: "BAD BEAT",
    emoji: "😭",
    className: "bg-danger/15 text-danger",
  },
  suckout: {
    label: "SUCKOUT",
    emoji: "🍀",
    className: "bg-success/15 text-success",
  },
  coinflip: {
    label: "COINFLIP",
    emoji: "🪙",
    className: "bg-accent/15 text-accent",
  },
};

// Clasificar un all-in: bad beat (favorito claro que pierde), suckout
// (underdog claro que gana) o coinflip (equity pareja)
export function getAllInBadge(
  equity: number | null,
  result: AllInResult,
): AllInBadge {
  if (equity === null) return null;
  if (equity >= 65 && result === "lost") return "badbeat";
  if (equity <= 35 && result === "won") return "suckout";
  if (equity >= 45 && equity <= 55) return "coinflip";
  return null;
}

// Estadísticas de all-ins de un jugador dentro de una partida (o conjunto)
export interface PlayerAllInStats {
  playerId: string;
  pushed: number; // all-ins hechos
  won: number;
  lost: number;
  split: number;
  called: number; // all-ins pagados a otros
  winRate: number; // % ganados sobre hechos (split cuenta medio)
  avgEquity: number | null; // media de equity al call (solo con equity conocida)
  luck: number | null; // winRate - avgEquity: >0 corre bien, <0 corre mal
  badbeats: number;
  suckouts: number;
}

// Calcular estadísticas por jugador a partir de los all-ins registrados.
// Ordena por all-ins hechos (y ganados como desempate) descendente.
export function computeAllInStats(
  entries: ReadonlyArray<AllInEntry>,
): PlayerAllInStats[] {
  const byPlayer = new Map<
    string,
    PlayerAllInStats & { equitySum: number; equityCount: number }
  >();

  const getStats = (playerId: string) => {
    let stats = byPlayer.get(playerId);
    if (!stats) {
      stats = {
        playerId,
        pushed: 0,
        won: 0,
        lost: 0,
        split: 0,
        called: 0,
        winRate: 0,
        avgEquity: null,
        luck: null,
        badbeats: 0,
        suckouts: 0,
        equitySum: 0,
        equityCount: 0,
      };
      byPlayer.set(playerId, stats);
    }
    return stats;
  };

  for (const entry of entries) {
    const pusher = getStats(entry.pusherId);
    pusher.pushed += 1;
    if (entry.result === "won") pusher.won += 1;
    else if (entry.result === "lost") pusher.lost += 1;
    else pusher.split += 1;

    if (entry.equity !== null) {
      pusher.equitySum += entry.equity;
      pusher.equityCount += 1;
    }

    const badge = getAllInBadge(entry.equity, entry.result);
    if (badge === "badbeat") pusher.badbeats += 1;
    if (badge === "suckout") pusher.suckouts += 1;

    if (entry.callerId) {
      getStats(entry.callerId).called += 1;
    }
  }

  return Array.from(byPlayer.values())
    .map(({ equitySum, equityCount, ...stats }) => {
      const winRate =
        stats.pushed > 0
          ? ((stats.won + stats.split / 2) / stats.pushed) * 100
          : 0;
      const avgEquity = equityCount > 0 ? equitySum / equityCount : null;
      return {
        ...stats,
        winRate,
        avgEquity,
        luck:
          avgEquity !== null && stats.pushed > 0 ? winRate - avgEquity : null,
      };
    })
    .sort((a, b) => b.pushed - a.pushed || b.won - a.won);
}
