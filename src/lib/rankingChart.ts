import { db } from "./supabase";

export type IntervalType = "month" | "year";

// Player info for the chart legend and styling
export interface PlayerChartInfo {
  id: string;
  name: string;
  color: string;
}

// Data point for Recharts - one object per period with player names as keys
export interface ChartDataPoint {
  period: string;
  periodLabel: string;
  [playerName: string]: number | string; // rank values keyed by player name
}

// Complete chart data structure
export interface RankingChartData {
  dataPoints: ChartDataPoint[];
  players: PlayerChartInfo[];
  maxRank: number;
}

/**
 * Formats a date label based on the interval type
 */
function formatPeriodLabel(date: Date, intervalType: IntervalType): string {
  if (intervalType === "year") {
    return date.getFullYear().toString();
  }
  // Monthly: "Ene 26" format
  return date.toLocaleDateString("es-ES", {
    month: "short",
    year: "2-digit",
  });
}

/**
 * Fetches ranking evolution data from Supabase and transforms it
 * into a format suitable for Recharts LineChart
 */
export async function getRankingEvolution(
  intervalType: IntervalType = "month"
): Promise<RankingChartData | null> {
  const { data, error } = await db.rpc("get_ranking_evolution", {
    interval_type: intervalType,
  });

  if (error) {
    console.error("Error fetching ranking evolution:", error);
    return null;
  }

  const rows = data;

  // Extract unique players with their colors
  const playersMap = new Map<string, PlayerChartInfo>();
  for (const row of rows) {
    if (!playersMap.has(row.player_id)) {
      playersMap.set(row.player_id, {
        id: row.player_id,
        name: row.player_name,
        color: row.avatar_color || "#10B981",
      });
    }
  }
  const players = Array.from(playersMap.values());

  // Group data by period
  const periodMap = new Map<string, Map<string, number>>();
  let maxRank = 1;

  for (const row of rows) {
    if (!periodMap.has(row.period_start)) {
      periodMap.set(row.period_start, new Map());
    }
    const periodData = periodMap.get(row.period_start);
    if (periodData) {
      periodData.set(row.player_name, row.rank);
    }
    if (row.rank > maxRank) {
      maxRank = row.rank;
    }
  }

  // Convert to Recharts format
  const dataPoints: ChartDataPoint[] = [];
  const sortedPeriods = Array.from(periodMap.keys()).sort();

  for (const period of sortedPeriods) {
    const periodData = periodMap.get(period);
    if (!periodData) {
      continue;
    }
    const date = new Date(period);
    const periodLabel = formatPeriodLabel(date, intervalType);

    const point: ChartDataPoint = {
      period,
      periodLabel,
    };

    // Add rank for each player
    for (const player of players) {
      point[player.name] = periodData.get(player.name) ?? maxRank;
    }

    dataPoints.push(point);
  }

  return {
    dataPoints,
    players,
    maxRank,
  };
}
