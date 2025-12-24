'use client';

import Link from 'next/link';
import { Calendar, Users, Trophy, TrendingUp, TrendingDown, Euro } from 'lucide-react';
import { GameSummary } from '@/types';

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

  // Proteger contra valores null/undefined
  const totalPot = game.total_pot ?? 0;
  const topWinnerProfit = game.top_winner_profit ?? 0;
  const isWinner = topWinnerProfit > 0;

  return (
    <Link href={`/partida/${game.id}`}>
      <div 
        className="card-hover bg-background-card rounded-2xl p-5 border border-border hover:border-primary/50 cursor-pointer animate-fade-in"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 text-foreground-muted text-sm">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
            <span className="text-foreground-muted/50">•</span>
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-background-secondary px-2.5 py-1 rounded-full">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-medium">{game.player_count}</span>
          </div>
        </div>

        {/* Pot total */}
        <div className="mb-4">
          <p className="text-foreground-muted text-xs uppercase tracking-wider mb-1">Bote total</p>
          <div className="flex items-center gap-2">
            <Euro className="w-5 h-5 text-accent" />
            <span className="text-2xl font-bold text-foreground">
              {totalPot.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Ganador */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-foreground-muted">Mejor resultado</p>
              <p className="font-medium text-foreground">{game.top_winner || '-'}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 ${isWinner ? 'text-success' : 'text-danger'}`}>
            {isWinner ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-bold">
              {isWinner ? '+' : ''}{topWinnerProfit.toFixed(2)}€
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

