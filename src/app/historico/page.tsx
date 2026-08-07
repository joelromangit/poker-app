"use client";

import {
  Calendar,
  ChartLine,
  Check,
  ChevronDown,
  Coins,
  Minus,
  Swords,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import SegmentedButton from "@/components/SegmentedButton";
import {
  computeBBStats,
  computeHeadToHead,
  computeHistoryStats,
  filterEntriesByDate,
  getCommonGameIds,
  getPlayersHistory,
  type HistoryEntry,
  type PlayerHistory,
} from "@/lib/history";

type ResultFilter = "all" | "wins" | "losses";
type GameScope = "common" | "all";
type ChartMode = "perGame" | "cumulative";
type ChartUnit = "euros" | "bb"; // unidad de la gráfica: dinero o ciegas grandes
type PeriodFilter = "all" | "custom" | number; // número = año concreto

interface ChartPoint {
  gameId: string;
  label: string;
  fullLabel: string;
  [playerName: string]: number | string | null;
}

function formatEuros(value: number, withSign = true): string {
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}€`;
}

function formatBB(value: number, withSign = true): string {
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} BB`;
}

function profitColorClass(value: number): string {
  if (value > 0) return "text-success";
  if (value < 0) return "text-danger";
  return "text-foreground-muted";
}

// Tooltip personalizado del gráfico
function HistoryTooltip({
  active,
  payload,
  label,
  fullLabelByLabel,
  unit = "euros",
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    dataKey: string | number;
    value: number | null;
    color?: string;
  }>;
  label?: string | number;
  fullLabelByLabel: Map<string, string>;
  unit?: ChartUnit;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const entries = payload.filter((entry) => typeof entry.value === "number");
  if (entries.length === 0) return null;

  const sorted = [...entries].sort(
    (a, b) => (b.value as number) - (a.value as number),
  );

  return (
    <div className="bg-background-card border border-border rounded-lg p-3 shadow-xl max-w-[240px]">
      <p className="text-foreground-muted text-xs mb-2 font-medium">
        {fullLabelByLabel.get(String(label)) ?? label}
      </p>
      <div className="space-y-1">
        {sorted.map((entry) => (
          <div
            key={String(entry.dataKey)}
            className="flex items-center gap-2 text-sm"
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-foreground truncate">{entry.dataKey}</span>
            <span
              className={`ml-auto font-semibold ${profitColorClass(entry.value as number)}`}
            >
              {unit === "bb"
                ? formatBB(entry.value as number)
                : formatEuros(entry.value as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tarjeta de estadística pequeña dentro del panel de un jugador
function StatItem({
  label,
  value,
  valueClass,
  sub,
}: {
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
}) {
  return (
    <div className="bg-background rounded-lg p-2.5 border border-border">
      <p className="text-[11px] text-foreground-muted leading-tight">{label}</p>
      <p className={`text-sm font-bold ${valueClass ?? "text-foreground"}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-foreground-muted">{sub}</p>}
    </div>
  );
}

export default function HistoricoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin" />
        </div>
      }
    >
      <HistoricoContent />
    </Suspense>
  );
}

function HistoricoContent() {
  const searchParams = useSearchParams();
  const [histories, setHistories] = useState<PlayerHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initializedFromUrl, setInitializedFromUrl] = useState(false);

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [gameScope, setGameScope] = useState<GameScope>("common");
  const [chartMode, setChartMode] = useState<ChartMode>("perGame");
  const [chartUnit, setChartUnit] = useState<ChartUnit>("euros");
  const [showDetailTable, setShowDetailTable] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getPlayersHistory();
      setHistories(data);
      setLoading(false);
    }
    load();
  }, []);

  // Preseleccionar jugador desde la URL (?jugador=Nombre)
  useEffect(() => {
    if (initializedFromUrl || histories.length === 0) return;
    const jugadorParam = searchParams.get("jugador");
    if (jugadorParam) {
      const match = histories.find(
        (h) => h.player.name.toLowerCase() === jugadorParam.toLowerCase(),
      );
      if (match) {
        setSelectedIds([match.player.id]);
      }
    }
    setInitializedFromUrl(true);
  }, [histories, searchParams, initializedFromUrl]);

  const togglePlayer = (playerId: string) => {
    setSelectedIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId],
    );
  };

  // Años disponibles según los datos
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const history of histories) {
      for (const entry of history.entries) {
        years.add(new Date(entry.game.date).getFullYear());
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [histories]);

  // Rango de fechas efectivo según el filtro de periodo
  const effectiveRange = useMemo((): { from?: string; to?: string } => {
    if (periodFilter === "all") return {};
    if (periodFilter === "custom") {
      return { from: dateFrom || undefined, to: dateTo || undefined };
    }
    return { from: `${periodFilter}-01-01`, to: `${periodFilter}-12-31` };
  }, [periodFilter, dateFrom, dateTo]);

  // Históricos seleccionados en el orden de selección
  const selectedHistories = useMemo(
    () =>
      selectedIds
        .map((id) => histories.find((h) => h.player.id === id))
        .filter((h): h is PlayerHistory => !!h),
    [selectedIds, histories],
  );

  const isComparison = selectedHistories.length > 1;
  const isDuel = selectedHistories.length === 2;
  const useCommonScope = isComparison && gameScope === "common";

  // Entradas filtradas por fecha (y por partidas en común si aplica) por jugador
  const filteredHistories = useMemo(() => {
    const dateFiltered = selectedHistories.map((history) => ({
      player: history.player,
      entries: filterEntriesByDate(
        history.entries,
        effectiveRange.from,
        effectiveRange.to,
      ),
    }));

    if (!useCommonScope) return dateFiltered;

    const commonIds = getCommonGameIds(dateFiltered);
    return dateFiltered.map((history) => ({
      player: history.player,
      entries: history.entries.filter((e) => commonIds.has(e.game.id)),
    }));
  }, [selectedHistories, effectiveRange, useCommonScope]);

  // Estadísticas por jugador (sobre fecha+ámbito, sin filtro de resultado)
  const statsByPlayer = useMemo(
    () =>
      filteredHistories.map((history) => ({
        player: history.player,
        stats: computeHistoryStats(history.entries.map((e) => e.profit)),
        bbStats: computeBBStats(history.entries),
      })),
    [filteredHistories],
  );

  // Entradas para el gráfico: aplica también el filtro de resultado
  const chartHistories = useMemo(
    () =>
      filteredHistories.map((history) => ({
        player: history.player,
        entries: history.entries.filter((entry) => {
          if (resultFilter === "wins") return entry.profit > 0;
          if (resultFilter === "losses") return entry.profit < 0;
          return true;
        }),
      })),
    [filteredHistories, resultFilter],
  );

  // Puntos del gráfico: unión de partidas de los jugadores, orden cronológico
  const { chartData, fullLabelByLabel } = useMemo(() => {
    const gamesById = new Map<
      string,
      { game: HistoryEntry["game"]; profits: Map<string, number> }
    >();

    for (const history of chartHistories) {
      for (const entry of history.entries) {
        let record = gamesById.get(entry.game.id);
        if (!record) {
          record = { game: entry.game, profits: new Map() };
          gamesById.set(entry.game.id, record);
        }
        // En modo BB cada partida se convierte con su propia ciega
        if (chartUnit === "bb") {
          if (entry.game.bigBlind > 0) {
            record.profits.set(
              history.player.name,
              Math.round((entry.profit / entry.game.bigBlind) * 10) / 10,
            );
          }
        } else {
          record.profits.set(history.player.name, entry.profit);
        }
      }
    }

    const sortedGames = Array.from(gamesById.values()).sort(
      (a, b) =>
        new Date(a.game.date).getTime() - new Date(b.game.date).getTime(),
    );

    const cumulative = new Map<string, number>();
    const labels = new Map<string, string>();
    const points: ChartPoint[] = sortedGames.map((record, index) => {
      const date = new Date(record.game.date);
      const label = `${index + 1}·${date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      })}`;
      const fullLabel = record.game.name
        ? `${record.game.name} — ${date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`
        : date.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });
      labels.set(label, fullLabel);

      const point: ChartPoint = { gameId: record.game.id, label, fullLabel };
      for (const history of chartHistories) {
        const profit = record.profits.get(history.player.name);
        if (profit === undefined) {
          point[history.player.name] = null;
        } else if (chartMode === "cumulative") {
          const acc = (cumulative.get(history.player.name) ?? 0) + profit;
          cumulative.set(history.player.name, acc);
          point[history.player.name] = Math.round(acc * 100) / 100;
        } else {
          point[history.player.name] = profit;
        }
      }
      return point;
    });

    return { chartData: points, fullLabelByLabel: labels };
  }, [chartHistories, chartMode, chartUnit]);

  // Cara a cara (solo con exactamente 2 jugadores)
  const headToHead = useMemo(() => {
    if (!isDuel) return null;
    const [a, b] = selectedHistories;
    const dateFilteredA = filterEntriesByDate(
      a.entries,
      effectiveRange.from,
      effectiveRange.to,
    );
    const gameIds = new Set(dateFilteredA.map((e) => e.game.id));
    return computeHeadToHead(a, b, gameIds);
  }, [isDuel, selectedHistories, effectiveRange]);

  const hasChartData = chartData.length > 0 && selectedHistories.length > 0;

  return (
    <>
      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="animate-fade-in w-full">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <ChartLine className="w-7 h-7 text-accent" />
            Histórico de Resultados
          </h1>
          <p className="text-foreground-muted mb-6">
            Ganancias y pérdidas por partida de cada jugador. Selecciona uno
            para ver su evolución o varios para compararlos.
          </p>

          {loading ? (
            <LoadingSpinner />
          ) : histories.length === 0 ? (
            <div className="text-center py-16 text-foreground-muted">
              <ChartLine className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Todavía no hay partidas registradas</p>
            </div>
          ) : (
            <>
              {/* Selector de jugadores */}
              <section className="bg-background-card rounded-2xl p-4 sm:p-5 border border-border mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Jugadores
                    {selectedIds.length > 0 && (
                      <span className="text-xs font-normal text-foreground-muted">
                        ({selectedIds.length} seleccionado
                        {selectedIds.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </h2>
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                      className="text-xs text-foreground-muted hover:text-danger flex items-center gap-1 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {histories.map((history) => {
                    const isSelected = selectedIds.includes(history.player.id);
                    return (
                      <button
                        key={history.player.id}
                        type="button"
                        onClick={() => togglePlayer(history.player.id)}
                        className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border-2 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {history.player.avatarUrl ? (
                          <img
                            src={history.player.avatarUrl}
                            alt={history.player.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: history.player.color }}
                          >
                            {history.player.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`text-sm font-medium ${
                            isSelected
                              ? "text-foreground"
                              : "text-foreground-muted"
                          }`}
                        >
                          {history.player.name}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Filtros */}
              <section className="bg-background-card rounded-2xl p-4 sm:p-5 border border-border mb-4 space-y-3">
                {/* Periodo */}
                <div className="flex items-start gap-3 flex-wrap">
                  <span className="text-xs text-foreground-muted font-medium w-16 pt-2 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Periodo
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 bg-background rounded-lg p-1 flex-wrap w-fit">
                      <SegmentedButton
                        active={periodFilter === "all"}
                        onClick={() => setPeriodFilter("all")}
                      >
                        Todo
                      </SegmentedButton>
                      {availableYears.map((year) => (
                        <SegmentedButton
                          key={year}
                          active={periodFilter === year}
                          onClick={() => setPeriodFilter(year)}
                        >
                          {year}
                        </SegmentedButton>
                      ))}
                      <SegmentedButton
                        active={periodFilter === "custom"}
                        onClick={() => setPeriodFilter("custom")}
                      >
                        Fechas
                      </SegmentedButton>
                    </div>
                    {periodFilter === "custom" && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-sm focus:border-primary outline-none"
                        />
                        <span className="text-foreground-muted text-sm">a</span>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-sm focus:border-primary outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Resultado */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-foreground-muted font-medium w-16 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    Resultado
                  </span>
                  <div className="flex items-center gap-1 bg-background rounded-lg p-1 w-fit">
                    <SegmentedButton
                      active={resultFilter === "all"}
                      onClick={() => setResultFilter("all")}
                    >
                      Todas
                    </SegmentedButton>
                    <SegmentedButton
                      active={resultFilter === "wins"}
                      onClick={() => setResultFilter("wins")}
                    >
                      Solo ganancias
                    </SegmentedButton>
                    <SegmentedButton
                      active={resultFilter === "losses"}
                      onClick={() => setResultFilter("losses")}
                    >
                      Solo pérdidas
                    </SegmentedButton>
                  </div>
                </div>

                {/* Ámbito de partidas (solo comparando) */}
                {isComparison && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-foreground-muted font-medium w-16 flex items-center gap-1">
                      <Swords className="w-3.5 h-3.5" />
                      Partidas
                    </span>
                    <div className="flex items-center gap-1 bg-background rounded-lg p-1 w-fit">
                      <SegmentedButton
                        active={gameScope === "common"}
                        onClick={() => setGameScope("common")}
                      >
                        Solo en común
                      </SegmentedButton>
                      <SegmentedButton
                        active={gameScope === "all"}
                        onClick={() => setGameScope("all")}
                      >
                        Todas
                      </SegmentedButton>
                    </div>
                    {useCommonScope && (
                      <span className="text-xs text-foreground-muted">
                        Solo partidas donde jugaron todos los seleccionados
                      </span>
                    )}
                  </div>
                )}

                {/* Vista del gráfico */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-foreground-muted font-medium w-16 flex items-center gap-1">
                    <ChartLine className="w-3.5 h-3.5" />
                    Vista
                  </span>
                  <div className="flex items-center gap-1 bg-background rounded-lg p-1 w-fit">
                    <SegmentedButton
                      active={chartMode === "perGame"}
                      onClick={() => setChartMode("perGame")}
                    >
                      Por partida
                    </SegmentedButton>
                    <SegmentedButton
                      active={chartMode === "cumulative"}
                      onClick={() => setChartMode("cumulative")}
                    >
                      Acumulado
                    </SegmentedButton>
                  </div>
                  <div className="flex items-center gap-1 bg-background rounded-lg p-1 w-fit">
                    <SegmentedButton
                      active={chartUnit === "euros"}
                      onClick={() => setChartUnit("euros")}
                    >
                      €
                    </SegmentedButton>
                    <SegmentedButton
                      active={chartUnit === "bb"}
                      onClick={() => setChartUnit("bb")}
                    >
                      BB
                    </SegmentedButton>
                  </div>
                </div>
              </section>

              {selectedHistories.length === 0 ? (
                <div className="text-center py-16 text-foreground-muted bg-background-card rounded-2xl border border-border">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Selecciona al menos un jugador</p>
                  <p className="text-sm mt-1">
                    Elige uno para ver su histórico o dos para un 1vs1
                  </p>
                </div>
              ) : (
                <>
                  {/* Cara a cara 1vs1 */}
                  {isDuel && headToHead && (
                    <section className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 sm:p-5 border border-primary/30 mb-4">
                      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Swords className="w-4 h-4 text-accent" />
                        Cara a Cara
                        <span className="text-xs font-normal text-foreground-muted">
                          ({headToHead.commonGames} partida
                          {headToHead.commonGames !== 1 ? "s" : ""} en común)
                        </span>
                      </h2>

                      {headToHead.commonGames === 0 ? (
                        <p className="text-sm text-foreground-muted">
                          No han jugado partidas juntos en este periodo
                        </p>
                      ) : (
                        <>
                          {/* Marcador */}
                          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-4">
                            {[0, 1].map((idx) => {
                              const history = selectedHistories[idx];
                              const wins =
                                idx === 0 ? headToHead.aWins : headToHead.bWins;
                              const balance =
                                idx === 0
                                  ? headToHead.aBalance
                                  : headToHead.bBalance;
                              return (
                                <div
                                  key={history.player.id}
                                  className={`flex-1 max-w-[200px] text-center ${idx === 1 ? "order-3" : ""}`}
                                >
                                  {history.player.avatarUrl ? (
                                    <img
                                      src={history.player.avatarUrl}
                                      alt={history.player.name}
                                      className="w-12 h-12 rounded-full object-cover mx-auto mb-1 border-2"
                                      style={{
                                        borderColor: history.player.color,
                                      }}
                                    />
                                  ) : (
                                    <div
                                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-1"
                                      style={{
                                        backgroundColor: history.player.color,
                                      }}
                                    >
                                      {history.player.name
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>
                                  )}
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {history.player.name}
                                  </p>
                                  <p className="text-3xl font-bold text-foreground">
                                    {wins}
                                  </p>
                                  <p className="text-xs text-foreground-muted">
                                    victorias directas
                                  </p>
                                  <p
                                    className={`text-sm font-bold mt-1 ${profitColorClass(balance)}`}
                                  >
                                    {formatEuros(balance)}
                                  </p>
                                  <p className="text-[10px] text-foreground-muted">
                                    balance en común
                                  </p>
                                </div>
                              );
                            })}
                            <div className="order-2 text-center">
                              <p className="text-lg font-bold text-foreground-muted">
                                VS
                              </p>
                              {headToHead.draws > 0 && (
                                <p className="text-[10px] text-foreground-muted">
                                  {headToHead.draws} empate
                                  {headToHead.draws !== 1 ? "s" : ""}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Mayor paliza */}
                          {headToHead.biggestGap && (
                            <div className="text-center text-xs text-foreground-muted border-t border-border/50 pt-3">
                              💥 Mayor paliza:{" "}
                              <span className="font-semibold text-foreground">
                                {headToHead.biggestGap.winnerName}
                              </span>{" "}
                              por{" "}
                              <span className="font-semibold text-accent">
                                {headToHead.biggestGap.diff.toFixed(2)}€
                              </span>{" "}
                              de diferencia (
                              <Link
                                href={`/partida/${headToHead.biggestGap.game.id}`}
                                className="text-primary hover:underline"
                              >
                                {headToHead.biggestGap.game.name ||
                                  new Date(
                                    headToHead.biggestGap.game.date,
                                  ).toLocaleDateString("es-ES")}
                              </Link>
                              )
                            </div>
                          )}
                        </>
                      )}
                    </section>
                  )}

                  {/* Estadísticas por jugador */}
                  <div
                    className={`grid gap-4 mb-4 ${
                      statsByPlayer.length > 1 ? "sm:grid-cols-2" : ""
                    }`}
                  >
                    {statsByPlayer.map(({ player, stats, bbStats }) => (
                      <section
                        key={player.id}
                        className="bg-background-card rounded-2xl p-4 sm:p-5 border border-border"
                        style={{
                          borderTopColor: player.color,
                          borderTopWidth: 3,
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {player.avatarUrl ? (
                            <img
                              src={player.avatarUrl}
                              alt={player.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: player.color }}
                            >
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {player.name}
                            </p>
                            <p className="text-xs text-foreground-muted">
                              {stats.games} partida
                              {stats.games !== 1 ? "s" : ""} en el periodo
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${profitColorClass(stats.balance)}`}
                            >
                              {formatEuros(stats.balance)}
                            </p>
                            <p
                              className={`text-xs font-semibold ${profitColorClass(bbStats.balanceBB)}`}
                            >
                              {formatBB(bbStats.balanceBB)}
                            </p>
                            <p className="text-[10px] text-foreground-muted">
                              balance
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <StatItem
                            label="Media/partida"
                            value={formatEuros(stats.average)}
                            valueClass={profitColorClass(stats.average)}
                            sub={formatBB(bbStats.averageBB)}
                          />
                          <StatItem
                            label="Máx. ganancia"
                            value={formatEuros(stats.best)}
                            valueClass="text-success"
                            sub={formatBB(bbStats.bestBB)}
                          />
                          <StatItem
                            label="Máx. pérdida"
                            value={formatEuros(stats.worst, false)}
                            valueClass="text-danger"
                            sub={formatBB(bbStats.worstBB, false)}
                          />
                          <StatItem
                            label="En positivo"
                            value={`${stats.wins}`}
                            valueClass="text-success"
                            sub={`${stats.winRate.toFixed(0)}% de ${stats.games}`}
                          />
                          <StatItem
                            label="En negativo"
                            value={`${stats.losses}`}
                            valueClass="text-danger"
                            sub={
                              stats.draws > 0
                                ? `${stats.draws} en tablas`
                                : undefined
                            }
                          />
                          <StatItem
                            label="Rachas"
                            value={`🔥${stats.bestStreak} · 🥶${stats.worstStreak}`}
                            sub="victorias · derrotas"
                          />
                          <StatItem
                            label="Total ganado"
                            value={formatEuros(stats.totalWon)}
                            valueClass="text-success"
                            sub={
                              stats.wins > 0
                                ? `media ${formatEuros(stats.avgWin)}`
                                : undefined
                            }
                          />
                          <StatItem
                            label="Total perdido"
                            value={formatEuros(stats.totalLost, false)}
                            valueClass="text-danger"
                            sub={
                              stats.losses > 0
                                ? `media ${formatEuros(stats.avgLoss, false)}`
                                : undefined
                            }
                          />
                          <StatItem
                            label="Ratio €"
                            value={
                              stats.totalLost !== 0
                                ? (
                                    stats.totalWon / Math.abs(stats.totalLost)
                                  ).toFixed(2)
                                : stats.totalWon > 0
                                  ? "∞"
                                  : "-"
                            }
                            sub="ganado/perdido"
                          />
                        </div>
                      </section>
                    ))}
                  </div>

                  {/* Gráfico */}
                  <section className="bg-background-card rounded-2xl p-4 sm:p-6 border border-border mb-4">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <ChartLine className="w-5 h-5 text-accent" />
                        {chartMode === "cumulative"
                          ? "Evolución acumulada"
                          : "Resultado por partida"}
                        {chartUnit === "bb" && (
                          <span className="text-xs font-normal px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                            en BBs
                          </span>
                        )}
                      </h2>
                      <span className="text-xs text-foreground-muted">
                        {chartData.length} partida
                        {chartData.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {!hasChartData ? (
                      <div className="flex flex-col items-center justify-center h-64 text-foreground-muted">
                        <ChartLine className="w-12 h-12 mb-3 opacity-50" />
                        <p>No hay partidas con estos filtros</p>
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={360}>
                          <LineChart
                            data={chartData}
                            margin={{ top: 10, right: 15, left: 0, bottom: 10 }}
                          >
                            <XAxis
                              dataKey="label"
                              axisLine={{ stroke: "var(--border)" }}
                              tickLine={{ stroke: "var(--border)" }}
                              tick={{
                                fill: "var(--foreground-muted)",
                                fontSize: 10,
                              }}
                              interval="preserveStartEnd"
                              minTickGap={30}
                              tickFormatter={(value: string) =>
                                value.split("·")[1] ?? value
                              }
                            />
                            <YAxis
                              axisLine={{ stroke: "var(--border)" }}
                              tickLine={{ stroke: "var(--border)" }}
                              tick={{
                                fill: "var(--foreground-muted)",
                                fontSize: 11,
                              }}
                              tickFormatter={(value: number) =>
                                chartUnit === "bb" ? `${value}BB` : `${value}€`
                              }
                              width={chartUnit === "bb" ? 58 : 50}
                            />
                            <ReferenceLine
                              y={0}
                              stroke="var(--foreground-muted)"
                              strokeOpacity={0.4}
                              strokeDasharray="4 4"
                            />
                            <Tooltip
                              content={(props) => (
                                <HistoryTooltip
                                  {...props}
                                  fullLabelByLabel={fullLabelByLabel}
                                  unit={chartUnit}
                                />
                              )}
                            />
                            {chartHistories.map((history) => (
                              <Line
                                key={history.player.id}
                                type="monotone"
                                dataKey={history.player.name}
                                stroke={history.player.color}
                                strokeWidth={2.5}
                                dot={{
                                  fill: history.player.color,
                                  stroke: history.player.color,
                                  strokeWidth: 1.5,
                                  r: 3.5,
                                }}
                                activeDot={{
                                  fill: history.player.color,
                                  stroke: "var(--background)",
                                  strokeWidth: 2,
                                  r: 6,
                                }}
                                connectNulls
                                isAnimationActive={false}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>

                        {/* Leyenda */}
                        <div className="mt-3 flex flex-wrap gap-3 justify-center">
                          {chartHistories.map((history) => (
                            <div
                              key={history.player.id}
                              className="flex items-center gap-1.5 text-xs"
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                  backgroundColor: history.player.color,
                                }}
                              />
                              <span className="text-foreground-muted">
                                {history.player.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </section>

                  {/* Detalle por partida */}
                  {hasChartData && (
                    <section className="bg-background-card rounded-2xl border border-border overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowDetailTable(!showDetailTable)}
                        className="w-full p-4 flex items-center justify-between hover:bg-background/50 transition-colors"
                      >
                        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-warning" />
                          Detalle por partida
                        </h2>
                        <ChevronDown
                          className={`w-5 h-5 text-foreground-muted transition-transform ${
                            showDetailTable ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {showDetailTable && (
                        <div className="border-t border-border overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs text-foreground-muted border-b border-border">
                                <th className="px-4 py-2 font-medium">
                                  Partida
                                </th>
                                {chartHistories.map((history) => (
                                  <th
                                    key={history.player.id}
                                    className="px-4 py-2 font-medium text-right whitespace-nowrap"
                                  >
                                    <span
                                      className="inline-block w-2 h-2 rounded-full mr-1.5"
                                      style={{
                                        backgroundColor: history.player.color,
                                      }}
                                    />
                                    {history.player.name}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {[...chartData].reverse().map((point) => (
                                <tr
                                  key={point.gameId}
                                  className="hover:bg-background/50"
                                >
                                  <td className="px-4 py-2.5">
                                    <Link
                                      href={`/partida/${point.gameId}`}
                                      className="text-foreground hover:text-primary transition-colors"
                                    >
                                      {point.fullLabel}
                                    </Link>
                                  </td>
                                  {chartHistories.map((history) => {
                                    const value = point[history.player.name];
                                    return (
                                      <td
                                        key={history.player.id}
                                        className="px-4 py-2.5 text-right whitespace-nowrap"
                                      >
                                        {typeof value === "number" ? (
                                          <span
                                            className={`font-semibold ${profitColorClass(value)}`}
                                          >
                                            {value > 0 && (
                                              <TrendingUp className="w-3 h-3 inline mr-1" />
                                            )}
                                            {value < 0 && (
                                              <TrendingDown className="w-3 h-3 inline mr-1" />
                                            )}
                                            {value === 0 && (
                                              <Minus className="w-3 h-3 inline mr-1" />
                                            )}
                                            {formatEuros(value)}
                                          </span>
                                        ) : (
                                          <span className="text-foreground-muted/50">
                                            —
                                          </span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
