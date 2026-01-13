"use client";

import { Loader2, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartDataPoint,
  getRankingEvolution,
  type PlayerChartInfo,
  type RankingChartData,
} from "@/lib/rankingChart";

interface CustomTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{
    dataKey: string;
    value: number;
    color: string;
  }>;
  label?: string | number;
  players: PlayerChartInfo[];
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  label,
  players,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  // Sort by rank value (ascending since rank 1 is best)
  const sortedPayload = [...payload].sort(
    (a, b) => (a.value as number) - (b.value as number),
  );

  return (
    <div className="bg-background-card border border-border rounded-lg p-3 shadow-xl">
      <p className="text-foreground-muted text-sm mb-2 font-medium">{label}</p>
      <div className="space-y-1">
        {sortedPayload.map((entry) => {
          const player = players.find((p) => p.name === entry.dataKey);
          return (
            <div
              key={entry.dataKey}
              className="flex items-center gap-2 text-sm"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: player?.color || entry.color }}
              />
              <span className="text-foreground">{entry.dataKey}</span>
              <span className="text-foreground-muted ml-auto">
                #{entry.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Custom Y-axis tick to show rank numbers
function CustomYAxisTick({
  x,
  y,
  payload,
}: {
  x: number;
  y: number;
  payload: { value: number };
}) {
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill="var(--foreground-muted)"
      fontSize={12}
    >
      {payload.value}
    </text>
  );
}

// Left side labels showing player names at first data point
function LeftLabels({
  data,
  players,
  chartHeight,
  maxRank,
}: {
  data: ChartDataPoint[];
  players: PlayerChartInfo[];
  chartHeight: number;
  maxRank: number;
}) {
  if (data.length === 0) return null;

  const firstPoint = data[0];
  const paddingTop = 20;
  const paddingBottom = 40;
  const effectiveHeight = chartHeight - paddingTop - paddingBottom;
  const rankStep = effectiveHeight / (maxRank - 1 || 1);

  return (
    <div
      className="absolute left-0 top-0 w-24 pointer-events-none"
      style={{ height: chartHeight }}
    >
      {players.map((player) => {
        const rank = (firstPoint[player.name] as number) || maxRank;
        const yPos = paddingTop + (rank - 1) * rankStep;

        return (
          <div
            key={player.id}
            className="absolute flex items-center gap-1.5 text-xs font-medium transition-all duration-300"
            style={{
              top: yPos,
              transform: "translateY(-50%)",
              left: 4,
            }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: player.color }}
            />
            <span
              className="truncate max-w-[70px]"
              style={{ color: player.color }}
            >
              {player.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Right side labels showing player names at last data point
function RightLabels({
  data,
  players,
  chartHeight,
  maxRank,
}: {
  data: ChartDataPoint[];
  players: PlayerChartInfo[];
  chartHeight: number;
  maxRank: number;
}) {
  if (data.length === 0) return null;

  const lastPoint = data[data.length - 1];
  const paddingTop = 20;
  const paddingBottom = 40;
  const effectiveHeight = chartHeight - paddingTop - paddingBottom;
  const rankStep = effectiveHeight / (maxRank - 1 || 1);

  return (
    <div
      className="absolute right-0 top-0 w-24 pointer-events-none"
      style={{ height: chartHeight }}
    >
      {players.map((player) => {
        const rank = (lastPoint[player.name] as number) || maxRank;
        const yPos = paddingTop + (rank - 1) * rankStep;

        return (
          <div
            key={player.id}
            className="absolute flex items-center gap-1.5 text-xs font-medium transition-all duration-300"
            style={{
              top: yPos,
              transform: "translateY(-50%)",
              right: 4,
            }}
          >
            <span
              className="truncate max-w-[70px] text-right"
              style={{ color: player.color }}
            >
              {player.name}
            </span>
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: player.color }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function RankingChart() {
  const [chartData, setChartData] = useState<RankingChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRankingEvolution();
      setChartData(data);
    } catch (err) {
      console.error("Error loading ranking chart:", err);
      setError("Error al cargar el gráfico");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const chartHeight = 400;

  if (loading) {
    return (
      <div className="bg-background-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-center h-64 text-danger">
          {error}
        </div>
      </div>
    );
  }

  if (!chartData || chartData.dataPoints.length < 2) {
    return (
      <div className="bg-background-card rounded-2xl border border-border p-6">
        <div className="flex flex-col items-center justify-center h-64 text-foreground-muted">
          <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
          <p>No hay suficientes datos para mostrar el gráfico</p>
          <p className="text-sm">Se necesitan al menos 2 semanas de partidas</p>
        </div>
      </div>
    );
  }

  const { dataPoints, players, maxRank } = chartData;

  return (
    <div className="bg-background-card rounded-2xl border border-border p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">
          Evolución del Ranking
        </h2>
      </div>

      {/* Chart container with side labels */}
      <div className="relative">
        {/* Left labels */}
        <LeftLabels
          data={dataPoints}
          players={players}
          chartHeight={chartHeight}
          maxRank={maxRank}
        />

        {/* Main chart */}
        <div className="mx-24">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart
              data={dataPoints}
              margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
            >
              {/* Grid lines for each rank */}
              {Array.from({ length: maxRank }, (_, i) => i + 1).map((rank) => (
                <line
                  key={rank}
                  x1="0%"
                  x2="100%"
                  y1={`${((rank - 1) / (maxRank - 1 || 1)) * 100}%`}
                  y2={`${((rank - 1) / (maxRank - 1 || 1)) * 100}%`}
                  stroke="var(--border)"
                  strokeOpacity={0.5}
                  strokeDasharray="4 4"
                />
              ))}

              <XAxis
                dataKey="weekLabel"
                axisLine={{ stroke: "var(--border)" }}
                tickLine={{ stroke: "var(--border)" }}
                tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={40}
              />

              <YAxis
                domain={[1, maxRank]}
                reversed
                axisLine={{ stroke: "var(--border)" }}
                tickLine={{ stroke: "var(--border)" }}
                tick={CustomYAxisTick}
                ticks={Array.from({ length: maxRank }, (_, i) => i + 1)}
                width={25}
              />

              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} players={players} />
                )}
              />

              {/* One line per player */}
              {players.map((player) => (
                <Line
                  key={player.id}
                  type="monotone"
                  dataKey={player.name}
                  stroke={player.color}
                  strokeWidth={2.5}
                  dot={{
                    fill: player.color,
                    stroke: player.color,
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{
                    fill: player.color,
                    stroke: "var(--background)",
                    strokeWidth: 2,
                    r: 6,
                  }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Right labels */}
        <RightLabels
          data={dataPoints}
          players={players}
          chartHeight={chartHeight}
          maxRank={maxRank}
        />
      </div>

      {/* Legend (mobile-friendly) */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center sm:hidden">
        {players.map((player) => (
          <div key={player.id} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: player.color }}
            />
            <span className="text-foreground-muted">{player.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
