import { db } from "./supabase";

// Raw data from the PostgreSQL function
export interface RankingEvolutionRow {
  week_start: string;
  player_id: string;
  player_name: string;
  avatar_color: string;
  cumulative_balance: number;
  rank: number;
}

// Player info for the chart legend and styling
export interface PlayerChartInfo {
  id: string;
  name: string;
  color: string;
}

// Data point for Recharts - one object per week with player names as keys
export interface ChartDataPoint {
  week: string;
  weekLabel: string;
  [playerName: string]: number | string; // rank values keyed by player name
}

// Complete chart data structure
export interface RankingChartData {
  dataPoints: ChartDataPoint[];
  players: PlayerChartInfo[];
  maxRank: number;
}

/**
 * Fetches ranking evolution data from Supabase and transforms it
 * into a format suitable for Recharts LineChart
 */
export async function getRankingEvolution(): Promise<RankingChartData | null> {
  const { data, error } = await db.rpc("get_ranking_evolution");

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

  // Group data by week
  const weekMap = new Map<string, Map<string, number>>();
  let maxRank = 1;

  for (const row of rows) {
    if (!weekMap.has(row.week_start)) {
      weekMap.set(row.week_start, new Map());
    }
    const weekData = weekMap.get(row.week_start);
    if (weekData) {
      weekData.set(row.player_name, row.rank);
    }
    if (row.rank > maxRank) {
      maxRank = row.rank;
    }
  }

  // Convert to Recharts format
  const dataPoints: ChartDataPoint[] = [];
  const sortedWeeks = Array.from(weekMap.keys()).sort();

  for (const week of sortedWeeks) {
    const weekData = weekMap.get(week);
    if (!weekData) {
      continue;
    }
    const date = new Date(week);

    // Format: "Jan 13" or "13 Ene" for Spanish
    const weekLabel = date.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    });

    const point: ChartDataPoint = {
      week,
      weekLabel,
    };

    // Add rank for each player
    for (const player of players) {
      point[player.name] = weekData.get(player.name) ?? maxRank;
    }

    dataPoints.push(point);
  }

  return {
    dataPoints,
    players,
    maxRank,
  };
}
