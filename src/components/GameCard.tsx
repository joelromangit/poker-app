"use client";

import {
  Calendar,
  Frown,
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
}

export default function GameCard({ game, index }: GameCardProps) {
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

  return (
    <Link href={`/partida/${game.id}`}>
      <div
        className="card-hover bg-background-card rounded-2xl p-5 border border-border hover:border-primary/50 cursor-pointer animate-fade-in"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
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
          <div className="flex items-center gap-1.5 bg-background-secondary px-2.5 py-1 rounded-full ml-2 flex-shrink-0">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-medium">{game.player_count}</span>
          </div>
        </div>

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
    </Link>
  );
}
