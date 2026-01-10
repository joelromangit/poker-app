'use client';

import Link from 'next/link';
import { Calendar, Users, Trophy, TrendingUp, TrendingDown, Frown, Clock, Edit } from 'lucide-react';
import type { GameSummary } from '@/types';

interface GameCardProps {
  game: GameSummary;
  index: number;
}

export default function GameCard({ game, index }: GameCardProps) {
  const date = new Date(game.created_at);
  const formattedDate = date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Check if game is in progress
  const isInProgress = game.status === 'in_progress';

  // Proteger contra valores null/undefined
  const topWinnerProfit = game.top_winner_profit ?? 0;
  const worstLoserProfit = game.worst_loser_profit ?? 0;
  const isWinner = topWinnerProfit > 0;
  const isLoser = worstLoserProfit < 0;

  // For in_progress games, link to edit page instead of detail page
  const href = isInProgress ? `/editar-partida/${game.id}` : `/partida/${game.id}`;

  return (
    <Link href={href}>
      <div 
        className={`card-hover bg-background-card rounded-2xl p-5 border cursor-pointer animate-fade-in ${
          isInProgress 
            ? 'border-warning/50 hover:border-warning' 
            : 'border-border hover:border-primary/50'
        }`}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {/* Status badge for in_progress */}
            {isInProgress && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-medium mb-2">
                <Clock className="w-3 h-3" />
                En curso
              </div>
            )}
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

        {/* For in_progress games, show a simpler message */}
        {isInProgress ? (
          <div className="py-6 text-center border-t border-border">
            <div className="flex items-center justify-center gap-2 text-warning">
              <Edit className="w-5 h-5" />
              <span className="font-medium">Toca para completar la partida</span>
            </div>
          </div>
        ) : (
          <>
            {/* Mejor resultado */}
            <div className="flex items-center justify-between py-3 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-foreground-muted">Mejor resultado</p>
                  <p className="font-medium text-foreground">{game.top_winner || '-'}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 ${isWinner ? 'text-success' : 'text-foreground-muted'}`}>
                {isWinner && <TrendingUp className="w-4 h-4" />}
                <span className="font-bold">
                  {isWinner ? '+' : ''}{topWinnerProfit.toFixed(2)}€
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
                  <p className="font-medium text-foreground">{game.worst_loser || '-'}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 ${isLoser ? 'text-danger' : 'text-foreground-muted'}`}>
                {isLoser && <TrendingDown className="w-4 h-4" />}
                <span className="font-bold">
                  {worstLoserProfit.toFixed(2)}€
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
