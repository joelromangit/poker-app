"use client";

import { Calendar, Coins, Frown, Sigma, Trophy, Users, X } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { GamesAggregate } from "@/lib/aggregate";
import { getAvatarColor } from "@/lib/players";
import type { Player } from "@/types";

interface AggregateSummaryProps {
  aggregate: GamesAggregate;
  players: Player[]; // para resolver avatares por nombre
  onClose: () => void;
}

// Formatear el rango de fechas de la selección, p. ej. "31 jul - 2 ago 2026"
function formatRange(from: string | null, to: string | null): string {
  if (!from || !to) return "";
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const sameDay = fromDate.toDateString() === toDate.toDateString();
  const full: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  if (sameDay) return toDate.toLocaleDateString("es-ES", full);
  const short: Intl.DateTimeFormatOptions =
    fromDate.getFullYear() === toDate.getFullYear()
      ? { day: "numeric", month: "short" }
      : full;
  return `${fromDate.toLocaleDateString("es-ES", short)} - ${toDate.toLocaleDateString("es-ES", full)}`;
}

export default function AggregateSummary({
  aggregate,
  players,
  onClose,
}: AggregateSummaryProps) {
  const playerByName = new Map(players.map((p) => [p.name.toLowerCase(), p]));

  const winner = aggregate.players[0];
  const loser =
    aggregate.players.length > 1
      ? aggregate.players[aggregate.players.length - 1]
      : undefined;

  const chartData = aggregate.players.map((p) => ({
    name: p.name,
    balance: Number(p.balance.toFixed(2)),
  }));
  const chartHeight = Math.max(140, aggregate.players.length * 44 + 30);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background-card border border-border rounded-t-2xl sm:rounded-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background-card border-b border-border p-4 sm:p-5 flex items-start justify-between gap-3 z-10">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sigma className="w-5 h-5 text-accent" />
              Acumulado de la selección
            </h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-foreground-muted flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatRange(aggregate.from, aggregate.to)}
              </span>
              <span>
                {aggregate.games} partida{aggregate.games !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                {aggregate.totalPot.toFixed(2)}€ en juego
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -m-1 text-foreground-muted hover:text-foreground transition-colors flex-shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {/* Ganador y perdedor de la selección */}
          {winner && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-success/10 border border-success/30 rounded-xl p-3 text-center">
                <Trophy className="w-5 h-5 text-warning mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground truncate">
                  {winner.name}
                </p>
                <p className="text-sm font-bold text-success">
                  {winner.balance >= 0 ? "+" : ""}
                  {winner.balance.toFixed(2)}€
                </p>
              </div>
              {loser && (
                <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-center">
                  <Frown className="w-5 h-5 text-danger mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground truncate">
                    {loser.name}
                  </p>
                  <p className="text-sm font-bold text-danger">
                    {loser.balance >= 0 ? "+" : ""}
                    {loser.balance.toFixed(2)}€
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Gráfica de balances */}
          <div className="mb-5">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={{ stroke: "var(--border)" }}
                  tick={{ fill: "var(--foreground-muted)", fontSize: 10 }}
                  tickFormatter={(value: number) => `${value}€`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
                  width={72}
                />
                <ReferenceLine
                  x={0}
                  stroke="var(--foreground-muted)"
                  strokeOpacity={0.4}
                />
                <Bar dataKey="balance" radius={[0, 6, 6, 0]} maxBarSize={26}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.balance >= 0 ? "var(--success)" : "var(--danger)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ranking detallado */}
          <div className="space-y-2">
            {aggregate.players.map((result, index) => {
              const player = playerByName.get(result.name.toLowerCase());
              return (
                <div
                  key={result.name}
                  className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border"
                >
                  <span className="w-6 text-center text-sm font-bold text-foreground-muted flex-shrink-0">
                    {index + 1}º
                  </span>
                  {player?.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt={result.name}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{
                        backgroundColor: getAvatarColor(player?.avatar_color),
                      }}
                    >
                      {result.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {result.name}
                    </p>
                    <p className="text-xs text-foreground-muted flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {result.games} de {aggregate.games} partida
                      {aggregate.games !== 1 ? "s" : ""}
                      {result.games > 0 && (
                        <span>
                          · {result.wins}G {result.losses}P
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`font-bold flex-shrink-0 ${
                      result.balance > 0
                        ? "text-success"
                        : result.balance < 0
                          ? "text-danger"
                          : "text-foreground-muted"
                    }`}
                  >
                    {result.balance > 0 ? "+" : ""}
                    {result.balance.toFixed(2)}€
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
