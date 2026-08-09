"use client";

import { Loader2, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SegmentedButton from "@/components/SegmentedButton";
import { getPlayersHistory, type PlayerHistory } from "@/lib/history";
import {
  computeRankingEvolution,
  type EvolutionOptions,
  type EvolutionPlayer,
} from "@/lib/rankingEvolution";

// Periodos rápidos de la evolución del ranking
type PeriodOption = "total" | "last3m" | "last5" | "custom" | number;

function RankTooltip({
  active,
  payload,
  label,
  players,
  fullLabelByLabel,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    dataKey: string | number;
    value: number | null;
    color?: string;
  }>;
  label?: string | number;
  players: EvolutionPlayer[];
  fullLabelByLabel: Map<string, string>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const entries = payload.filter((entry) => typeof entry.value === "number");
  if (entries.length === 0) return null;
  const sorted = [...entries].sort(
    (a, b) => (a.value as number) - (b.value as number),
  );

  return (
    <div className="bg-background-card border border-border rounded-lg p-3 shadow-xl max-w-[240px]">
      <p className="text-foreground-muted text-xs mb-2 font-medium">
        {fullLabelByLabel.get(String(label)) ?? label}
      </p>
      <div className="space-y-1">
        {sorted.map((entry) => {
          const player = players.find((p) => p.name === entry.dataKey);
          return (
            <div
              key={String(entry.dataKey)}
              className="flex items-center gap-2 text-sm"
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: player?.color ?? entry.color }}
              />
              <span className="text-foreground truncate">
                {String(entry.dataKey)}
              </span>
              <span className="text-foreground-muted ml-auto font-semibold">
                {entry.value}º
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RankingChart({
  hiddenPlayerIds,
}: {
  hiddenPlayerIds: Set<string>;
}) {
  const [histories, setHistories] = useState<PlayerHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState<PeriodOption>("total");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [customLastGames, setCustomLastGames] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getPlayersHistory();
      setHistories(data);
      setLoading(false);
    }
    load();
  }, []);

  const visibleHistories = useMemo(
    () => histories.filter((h) => !hiddenPlayerIds.has(h.player.id)),
    [histories, hiddenPlayerIds],
  );

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const history of visibleHistories) {
      for (const entry of history.entries) {
        years.add(new Date(entry.game.date).getFullYear());
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [visibleHistories]);

  const options = useMemo((): EvolutionOptions => {
    if (period === "total") return {};
    if (period === "last5") return { lastGames: 5 };
    if (period === "last3m") {
      const from = new Date();
      from.setMonth(from.getMonth() - 3);
      return { from: from.toISOString().split("T")[0] };
    }
    if (period === "custom") {
      const lastGames = parseInt(customLastGames, 10);
      return {
        from: customFrom || undefined,
        to: customTo || undefined,
        lastGames:
          Number.isNaN(lastGames) || lastGames <= 0 ? undefined : lastGames,
      };
    }
    return { from: `${period}-01-01`, to: `${period}-12-31` };
  }, [period, customFrom, customTo, customLastGames]);

  const evolution = useMemo(
    () => computeRankingEvolution(visibleHistories, options),
    [visibleHistories, options],
  );

  const fullLabelByLabel = useMemo(
    () =>
      new Map(
        evolution.points.map((p) => [p.label as string, p.fullLabel as string]),
      ),
    [evolution],
  );

  const hasData = evolution.points.length > 0 && evolution.players.length > 0;
  const chartHeight = Math.max(260, evolution.maxRank * 44 + 80);

  return (
    <section className="bg-background-card rounded-2xl p-4 sm:p-6 border border-border">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">
          Evolución del Ranking
        </h2>
      </div>
      <p className="text-xs text-foreground-muted mb-4">
        Posición tras cada partida según el balance acumulado del periodo
        elegido
      </p>

      {/* Filtro de periodo */}
      <div className="flex items-center gap-1 bg-background rounded-lg p-1 flex-wrap w-fit mb-2">
        <SegmentedButton
          active={period === "total"}
          onClick={() => setPeriod("total")}
        >
          Total
        </SegmentedButton>
        {availableYears.map((year) => (
          <SegmentedButton
            key={year}
            active={period === year}
            onClick={() => setPeriod(year)}
          >
            {year}
          </SegmentedButton>
        ))}
        <SegmentedButton
          active={period === "last3m"}
          onClick={() => setPeriod("last3m")}
        >
          Últ. 3 meses
        </SegmentedButton>
        <SegmentedButton
          active={period === "last5"}
          onClick={() => setPeriod("last5")}
        >
          Últ. 5 partidas
        </SegmentedButton>
        <SegmentedButton
          active={period === "custom"}
          onClick={() => setPeriod("custom")}
        >
          Personalizado
        </SegmentedButton>
      </div>

      {/* Filtros personalizados: fechas y últimas N partidas, combinables */}
      {period === "custom" && (
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-sm focus:border-primary outline-none"
          />
          <span className="text-foreground-muted text-sm">a</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-sm focus:border-primary outline-none"
          />
          <label className="flex items-center gap-1.5 text-sm text-foreground-muted">
            últimas
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={customLastGames}
              onChange={(e) => setCustomLastGames(e.target.value)}
              placeholder="N"
              className="w-16 px-2 py-1.5 rounded-lg bg-background border border-border text-foreground text-sm focus:border-primary outline-none"
            />
            partidas
          </label>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center h-48 text-foreground-muted">
          <TrendingUp className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm">No hay partidas en este periodo</p>
        </div>
      ) : (
        <>
          <span className="block text-xs text-foreground-muted mb-2">
            {evolution.points.length} partida
            {evolution.points.length !== 1 ? "s" : ""} ·{" "}
            {evolution.players.length} jugadores
          </span>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart
              data={evolution.points}
              margin={{ top: 10, right: 15, left: 0, bottom: 10 }}
            >
              <XAxis
                dataKey="label"
                axisLine={{ stroke: "var(--border)" }}
                tickLine={{ stroke: "var(--border)" }}
                tick={{ fill: "var(--foreground-muted)", fontSize: 10 }}
                interval="preserveStartEnd"
                minTickGap={30}
                tickFormatter={(value: string) => value.split("·")[1] ?? value}
              />
              <YAxis
                reversed
                domain={[1, Math.max(evolution.maxRank, 2)]}
                ticks={Array.from(
                  { length: evolution.maxRank },
                  (_, i) => i + 1,
                )}
                allowDecimals={false}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={{ stroke: "var(--border)" }}
                tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
                tickFormatter={(value: number) => `${value}º`}
                width={36}
              />
              <Tooltip
                content={(props) => (
                  <RankTooltip
                    {...props}
                    players={evolution.players}
                    fullLabelByLabel={fullLabelByLabel}
                  />
                )}
              />
              {evolution.players.map((player) => (
                <Line
                  key={player.id}
                  type="monotone"
                  dataKey={player.name}
                  stroke={player.color}
                  strokeWidth={2.5}
                  dot={{
                    fill: player.color,
                    stroke: player.color,
                    strokeWidth: 1.5,
                    r: 3,
                  }}
                  activeDot={{
                    fill: player.color,
                    stroke: "var(--background)",
                    strokeWidth: 2,
                    r: 5.5,
                  }}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* Clasificación final del periodo como leyenda */}
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {evolution.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-background border border-border"
              >
                <span className="font-bold text-foreground-muted">
                  {player.finalRank}º
                </span>
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={player.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: player.color }}
                  />
                )}
                <span className="text-foreground font-medium">
                  {player.name}
                </span>
                <span
                  className={`font-semibold ${
                    player.balance > 0
                      ? "text-success"
                      : player.balance < 0
                        ? "text-danger"
                        : "text-foreground-muted"
                  }`}
                >
                  {player.balance > 0 ? "+" : ""}
                  {player.balance.toFixed(2)}€
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
