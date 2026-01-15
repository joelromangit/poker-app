"use client";

import {
  Calendar,
  CalendarDays,
  Loader2,
  Pause,
  Play,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  type IntervalType,
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
  if (data.length === 0) {
    return null;
  }

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

// Interval toggle button component
function IntervalToggle({
  interval,
  onChange,
}: {
  interval: IntervalType;
  onChange: (interval: IntervalType) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-background rounded-lg p-1">
      <button
        type="button"
        onClick={() => onChange("month")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          interval === "month"
            ? "bg-primary text-primary-foreground"
            : "text-foreground-muted hover:text-foreground hover:bg-background-elevated"
        }`}
      >
        <CalendarDays className="w-4 h-4" />
        <span className="hidden sm:inline">Mensual</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("year")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          interval === "year"
            ? "bg-primary text-primary-foreground"
            : "text-foreground-muted hover:text-foreground hover:bg-background-elevated"
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span className="hidden sm:inline">Anual</span>
      </button>
    </div>
  );
}

type AnimationSpeed = 1 | 0.5 | 0.25;

// Play/Pause toggle button
function PlayPauseButton({
  onToggle,
  disabled,
  isAnimating,
}: {
  onToggle: () => void;
  disabled: boolean;
  isAnimating: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        disabled
          ? "bg-background text-foreground-muted/60 cursor-not-allowed"
          : isAnimating
            ? "bg-danger/10 text-danger hover:bg-danger/20"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
      title={isAnimating ? "Detener animación" : "Reproducir animación"}
    >
      {isAnimating ? (
        <Pause className="w-4 h-4" />
      ) : (
        <Play className="w-4 h-4" />
      )}
    </button>
  );
}

// Speed control buttons
function SpeedControls({
  speed,
  onSpeedChange,
  disabled,
}: {
  speed: AnimationSpeed;
  onSpeedChange: (speed: AnimationSpeed) => void;
  disabled: boolean;
}) {
  const speedOptions: AnimationSpeed[] = [1, 0.5, 0.25];

  return (
    <div className="flex items-center gap-1 bg-background rounded-lg p-1">
      {speedOptions.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSpeedChange(option)}
          disabled={disabled}
          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
            speed === option
              ? "bg-primary text-primary-foreground"
              : disabled
                ? "text-foreground-muted/60"
                : "text-foreground-muted hover:text-foreground hover:bg-background-elevated"
          }`}
          title={`Velocidad ${option}x`}
        >
          {option}x
        </button>
      ))}
    </div>
  );
}

export default function RankingChart() {
  const [chartData, setChartData] = useState<RankingChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<IntervalType>("month");
  const [animationSeed, setAnimationSeed] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>(1);
  const animationTimeoutRef = useRef<number | null>(null);

  const loadData = useCallback(async (intervalType: IntervalType) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRankingEvolution(intervalType);
      setChartData(data);
    } catch (err) {
      console.error("Error loading ranking chart:", err);
      setError("Error al cargar el gráfico");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(interval);
  }, [loadData, interval]);

  const handleIntervalChange = (newInterval: IntervalType) => {
    setInterval(newInterval);
  };
  const baseAnimationDuration = 1200;
  const animationDuration = Math.round(baseAnimationDuration / animationSpeed);
  const isAnimationReady = !!chartData && chartData.dataPoints.length >= 2;

  const handlePlayAnimation = () => {
    if (!isAnimationReady) return;
    if (animationTimeoutRef.current) {
      window.clearTimeout(animationTimeoutRef.current);
    }
    setIsAnimating(true);
    setAnimationSeed((seed) => seed + 1);
    animationTimeoutRef.current = window.setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);
  };

  const handleStopAnimation = () => {
    if (animationTimeoutRef.current) {
      window.clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    setIsAnimating(false);
  };

  const handleToggleAnimation = () => {
    if (isAnimating) {
      handleStopAnimation();
    } else {
      handlePlayAnimation();
    }
  };

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const emptyStateMessage =
    interval === "month"
      ? "Se necesitan al menos 2 meses de partidas"
      : "Se necesitan al menos 2 años de partidas";

  if (loading) {
    return (
      <div className="bg-background-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">
              Evolución del Ranking
            </h2>
          </div>
          <IntervalToggle interval={interval} onChange={handleIntervalChange} />
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">
              Evolución del Ranking
            </h2>
          </div>
          <IntervalToggle interval={interval} onChange={handleIntervalChange} />
        </div>
        <div className="flex items-center justify-center h-64 text-danger">
          {error}
        </div>
      </div>
    );
  }

  if (!chartData || chartData.dataPoints.length < 2) {
    return (
      <div className="bg-background-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">
              Evolución del Ranking
            </h2>
          </div>
          <IntervalToggle interval={interval} onChange={handleIntervalChange} />
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-foreground-muted">
          <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
          <p>No hay suficientes datos para mostrar el gráfico</p>
          <p className="text-sm">{emptyStateMessage}</p>
        </div>
      </div>
    );
  }

  const { dataPoints, players, maxRank } = chartData;
  const chartHeight = 400;
  const dotDelayStep = animationDuration / Math.max(dataPoints.length - 1, 1);
  const renderDot = ({
    cx,
    cy,
    stroke,
    fill,
    index,
  }: {
    cx?: number;
    cy?: number;
    stroke?: string;
    fill?: string;
    index?: number;
  }) => {
    if (cx == null || cy == null) return null;
    const delay = (index ?? 0) * dotDelayStep;
    const style = isAnimating
      ? ({
          animation: `ranking-dot-pop ${animationDuration}ms ease-out ${delay}ms both`,
          transformOrigin: "center",
          transformBox: "fill-box",
        } as React.CSSProperties)
      : undefined;
    return (
      <circle
        cx={cx}
        cy={cy}
        r="3"
        fill={fill ?? stroke ?? "currentColor"}
        stroke={stroke ?? "currentColor"}
        strokeWidth="1.5"
        className="sm:r-4 sm:stroke-2"
        style={style}
      />
    );
  };

  return (
    <div className="bg-background-card rounded-2xl border border-border p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">
            Evolución del Ranking
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PlayPauseButton
            onToggle={handleToggleAnimation}
            disabled={!isAnimationReady}
            isAnimating={isAnimating}
          />
          <SpeedControls
            speed={animationSpeed}
            onSpeedChange={setAnimationSpeed}
            disabled={!isAnimationReady}
          />
          <IntervalToggle interval={interval} onChange={handleIntervalChange} />
        </div>
      </div>

      <style jsx global>{`
        @keyframes ranking-dot-pop {
          0% {
            transform: scale(0.6);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

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
              key={`ranking-chart-${animationSeed}`}
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
                dataKey="periodLabel"
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
                  isAnimationActive={isAnimating}
                  animationDuration={animationDuration}
                  animationEasing="linear"
                  dot={renderDot}
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
