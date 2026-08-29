// Ciega grande por defecto en fichas: fallback para partidas anteriores a
// las ciegas configurables (los presets clásicos jugaban SB 5 / BB 10)
export const BIG_BLIND_CHIPS = 10;

// Info mínima de una partida para el histórico
export interface HistoryGameInfo {
  id: string;
  name: string | null;
  date: string; // ISO
  bigBlind: number; // valor de la ciega grande en € (10 fichas * valor ficha)
}

// Info mínima de un jugador para el histórico
export interface HistoryPlayerInfo {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
}

// Resultado de un jugador en una partida concreta
export interface HistoryEntry {
  game: HistoryGameInfo;
  profit: number;
  rebuys: number;
}

// Histórico completo de un jugador (entradas ordenadas por fecha ascendente)
export interface PlayerHistory {
  player: HistoryPlayerInfo;
  entries: HistoryEntry[];
}

// Estadísticas detalladas calculadas sobre un conjunto de resultados
export interface HistoryStats {
  games: number;
  balance: number;
  average: number;
  best: number; // máxima ganancia (0 si nunca ganó)
  worst: number; // máxima pérdida (0 si nunca perdió)
  wins: number; // partidas en positivo
  losses: number; // partidas en negativo
  draws: number; // partidas en tablas (profit 0)
  winRate: number; // % de partidas en positivo
  totalWon: number; // suma de todas las ganancias
  totalLost: number; // suma de todas las pérdidas (valor negativo)
  avgWin: number; // media cuando gana
  avgLoss: number; // media cuando pierde
  bestStreak: number; // mayor racha de partidas en positivo
  worstStreak: number; // mayor racha de partidas en negativo
}

// Calcular estadísticas a partir de la lista de profits (orden cronológico)
export function computeHistoryStats(profits: number[]): HistoryStats {
  const games = profits.length;
  const balance = profits.reduce((sum, p) => sum + p, 0);
  const winProfits = profits.filter((p) => p > 0);
  const lossProfits = profits.filter((p) => p < 0);
  const wins = winProfits.length;
  const losses = lossProfits.length;
  const totalWon = winProfits.reduce((sum, p) => sum + p, 0);
  const totalLost = lossProfits.reduce((sum, p) => sum + p, 0);

  let bestStreak = 0;
  let worstStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  for (const profit of profits) {
    if (profit > 0) {
      currentWinStreak += 1;
      currentLossStreak = 0;
    } else if (profit < 0) {
      currentLossStreak += 1;
      currentWinStreak = 0;
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
    bestStreak = Math.max(bestStreak, currentWinStreak);
    worstStreak = Math.max(worstStreak, currentLossStreak);
  }

  return {
    games,
    balance,
    average: games > 0 ? balance / games : 0,
    best: wins > 0 ? Math.max(...winProfits) : 0,
    worst: losses > 0 ? Math.min(...lossProfits) : 0,
    wins,
    losses,
    draws: games - wins - losses,
    winRate: games > 0 ? (wins / games) * 100 : 0,
    totalWon,
    totalLost,
    avgWin: wins > 0 ? totalWon / wins : 0,
    avgLoss: losses > 0 ? totalLost / losses : 0,
    bestStreak,
    worstStreak,
  };
}

// Estadísticas expresadas en ciegas grandes (BBs) en lugar de dinero.
// Cada partida se convierte con SU ciega, así los resultados de mesas con
// distinto valor de ficha son comparables entre sí.
export interface BBStats {
  balanceBB: number; // suma de BBs ganadas/perdidas
  averageBB: number; // media de BBs por partida
  bestBB: number; // mejor resultado en BBs (0 si nunca ganó)
  worstBB: number; // peor resultado en BBs (0 si nunca perdió)
}

// Calcular estadísticas en BBs a partir de las entradas del histórico.
// Ignora entradas cuya partida no tenga una ciega válida (> 0).
export function computeBBStats(
  entries: ReadonlyArray<HistoryEntry>,
): BBStats {
  const profitsBB = entries
    .filter((e) => e.game.bigBlind > 0)
    .map((e) => e.profit / e.game.bigBlind);

  const balanceBB = profitsBB.reduce((sum, p) => sum + p, 0);
  const winsBB = profitsBB.filter((p) => p > 0);
  const lossesBB = profitsBB.filter((p) => p < 0);

  return {
    balanceBB,
    averageBB: profitsBB.length > 0 ? balanceBB / profitsBB.length : 0,
    bestBB: winsBB.length > 0 ? Math.max(...winsBB) : 0,
    worstBB: lossesBB.length > 0 ? Math.min(...lossesBB) : 0,
  };
}

// Resultado de una partida para la forma reciente: victoria, derrota o tablas
export type FormResult = "W" | "L" | "D";

// Forma reciente: resultados de las últimas `count` partidas en orden
// cronológico (la última partida es el último elemento)
export function computeRecentForm(
  chronologicalProfits: ReadonlyArray<number>,
  count = 5,
): FormResult[] {
  return chronologicalProfits
    .slice(-count)
    .map((profit) => (profit > 0 ? "W" : profit < 0 ? "L" : "D"));
}

// Resultado del cara a cara entre dos jugadores (solo partidas en común)
export interface HeadToHeadResult {
  commonGames: number;
  aWins: number; // partidas en común donde A sacó más profit que B
  bWins: number;
  draws: number;
  aBalance: number; // balance de A en las partidas en común
  bBalance: number;
  biggestGap: {
    game: HistoryGameInfo;
    winnerName: string;
    diff: number;
  } | null;
}

// Calcular el cara a cara entre dos jugadores a partir de sus históricos
export function computeHeadToHead(
  a: PlayerHistory,
  b: PlayerHistory,
  gameIds?: ReadonlySet<string>,
): HeadToHeadResult {
  const bByGame = new Map(b.entries.map((e) => [e.game.id, e]));

  let aWins = 0;
  let bWins = 0;
  let draws = 0;
  let aBalance = 0;
  let bBalance = 0;
  let commonGames = 0;
  let biggestGap: HeadToHeadResult["biggestGap"] = null;

  for (const aEntry of a.entries) {
    if (gameIds && !gameIds.has(aEntry.game.id)) continue;
    const bEntry = bByGame.get(aEntry.game.id);
    if (!bEntry) continue;

    commonGames += 1;
    aBalance += aEntry.profit;
    bBalance += bEntry.profit;

    const diff = aEntry.profit - bEntry.profit;
    if (diff > 0) aWins += 1;
    else if (diff < 0) bWins += 1;
    else draws += 1;

    const absDiff = Math.abs(diff);
    if (absDiff > 0 && (!biggestGap || absDiff > biggestGap.diff)) {
      biggestGap = {
        game: aEntry.game,
        winnerName: diff > 0 ? a.player.name : b.player.name,
        diff: absDiff,
      };
    }
  }

  return { commonGames, aWins, bWins, draws, aBalance, bBalance, biggestGap };
}

// IDs de las partidas jugadas por TODOS los jugadores indicados
export function getCommonGameIds(
  histories: ReadonlyArray<PlayerHistory>,
): Set<string> {
  if (histories.length === 0) return new Set();

  let common = new Set(histories[0].entries.map((e) => e.game.id));
  for (const history of histories.slice(1)) {
    const ids = new Set(history.entries.map((e) => e.game.id));
    common = new Set(Array.from(common).filter((id) => ids.has(id)));
  }
  return common;
}

// Filtrar entradas por rango de fechas (inclusive). Fechas en formato YYYY-MM-DD.
export function filterEntriesByDate(
  entries: ReadonlyArray<HistoryEntry>,
  from?: string,
  to?: string,
): HistoryEntry[] {
  const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
  const toTime = to ? new Date(`${to}T23:59:59.999`).getTime() : null;

  return entries.filter((entry) => {
    const time = new Date(entry.game.date).getTime();
    if (fromTime !== null && time < fromTime) return false;
    if (toTime !== null && time > toTime) return false;
    return true;
  });
}
