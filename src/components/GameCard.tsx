"use client";

import {
  Calendar,
  Check,
  Frown,
  Medal,
  Minus,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { GameSummary } from "@/types";

interface GameCardProps {
  game: GameSummary;
  index: number;
  // Si se indica, la tarjeta destaca el resultado de este jugador
  // junto al mejor/peor resultado de la partida
  highlightPlayer?: string;
  // Modo selección para el acumulado: la tarjeta se marca en lugar de navegar
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export default function GameCard({
  game,
  index,
  highlightPlayer,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: GameCardProps) {
  const date = new Date(game.created_at);
  const formattedDate = date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Proteger contra valores null/undefined
  const topWinnerProfit = game.top_winner_profit ?? 0;
  const worstLoserProfit = game.worst_loser_profit ?? 0;
  const isWinner = topWinnerProfit > 0;
  const isLoser = worstLoserProfit < 0;

  // Resultado del jugador destacado (si se filtra por jugador)
  const highlighted = highlightPlayer
    ? (game.player_results ?? []).find(
        (pr) => pr.name.toLowerCase() === highlightPlayer.toLowerCase(),
      )
    : undefined;
  const highlightedPosition = highlighted
    ? [...(game.player_results ?? [])]
        .sort((a, b) => b.profit - a.profit)
        .findIndex((pr) => pr.name === highlighted.name) + 1
    : 0;

  const card = (
      <div
        className={`relative card-hover bg-background-card rounded-2xl p-5 border cursor-pointer animate-fade-in ${
          selected
            ? "border-primary ring-1 ring-primary"
            : "border-border hover:border-primary/50"
        }`}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {/* Marcador de selección para el acumulado */}
        {selectionMode && (
          <div
            className={`absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              selected
                ? "bg-primary border-primary text-white"
                : "bg-background-card border-border text-transparent"
            }`}
          >
            <Check className="w-4 h-4" strokeWidth={3} />
          </div>
        )}
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {game.name && (
              <h3 className="font-semibold text-foreground truncate mb-1">
                {game.name}
              </h3>
            )}
            <div className="flex items-center gap-2 text-foreground-muted text-sm">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{formattedDate}</span>
              <span className="text-foreground-muted/50">•</span>
              <span>{formattedTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
            {game.entry_eur != null && game.entry_eur > 0 && (
              <span className="text-xs font-bold text-accent bg-accent/15 px-2 py-1 rounded-full">
                {Number(game.entry_eur.toFixed(2))}€
              </span>
            )}
            <div className="flex items-center gap-1.5 bg-background-secondary px-2.5 py-1 rounded-full">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-medium">{game.player_count}</span>
            </div>
          </div>
        </div>

        {/* Resultado del jugador filtrado (añadido al mejor/peor del día) */}
        {highlighted && (
          <div
            className={`mb-3 px-3 py-2.5 rounded-xl border flex items-center justify-between ${
              highlighted.profit > 0
                ? "bg-success/10 border-success/30"
                : highlighted.profit < 0
                  ? "bg-danger/10 border-danger/30"
                  : "bg-background-secondary border-border"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  highlighted.profit > 0
                    ? "bg-success/20"
                    : highlighted.profit < 0
                      ? "bg-danger/20"
                      : "bg-background"
                }`}
              >
                <Medal
                  className={`w-4 h-4 ${
                    highlighted.profit > 0
                      ? "text-success"
                      : highlighted.profit < 0
                        ? "text-danger"
                        : "text-foreground-muted"
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-foreground-muted">
                  {highlighted.name}
                </p>
                <p className="font-medium text-foreground">
                  {highlightedPosition}º de {game.player_count}
                </p>
              </div>
            </div>
            <div
              className={`flex items-center gap-1 ${
                highlighted.profit > 0
                  ? "text-success"
                  : highlighted.profit < 0
                    ? "text-danger"
                    : "text-foreground-muted"
              }`}
            >
              {highlighted.profit > 0 && <TrendingUp className="w-4 h-4" />}
              {highlighted.profit < 0 && <TrendingDown className="w-4 h-4" />}
              {highlighted.profit === 0 && <Minus className="w-4 h-4" />}
              <span className="font-bold">
                {highlighted.profit > 0 ? "+" : ""}
                {highlighted.profit.toFixed(2)}€
              </span>
            </div>
          </div>
        )}

        {/* Mejor resultado */}
        <div className="flex items-center justify-between py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-foreground-muted">Mejor resultado</p>
              <p className="font-medium text-foreground">
                {game.top_winner || "-"}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-1 ${isWinner ? "text-success" : "text-foreground-muted"}`}
          >
            {isWinner && <TrendingUp className="w-4 h-4" />}
            <span className="font-bold">
              {isWinner ? "+" : ""}
              {topWinnerProfit.toFixed(2)}€
            </span>
          </div>
        </div>

        {/* Peor resultado */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center">
              <Frown className="w-4 h-4 text-danger" />
            </div>
            <div>
              <p className="text-xs text-foreground-muted">Peor resultado</p>
              <p className="font-medium text-foreground">
                {game.worst_loser || "-"}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-1 ${isLoser ? "text-danger" : "text-foreground-muted"}`}
          >
            {isLoser && <TrendingDown className="w-4 h-4" />}
            <span className="font-bold">{worstLoserProfit.toFixed(2)}€</span>
          </div>
        </div>
      </div>
  );

  if (selectionMode) {
    return (
      <button
        type="button"
        onClick={onToggleSelect}
        className="block w-full text-left"
      >
        {card}
      </button>
    );
  }

  return <Link href={`/partida/${game.id}`}>{card}</Link>;
}
