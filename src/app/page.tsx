'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getGamesSummary } from '@/lib/games';
import { GameSummary } from '@/types';
import { TrendingUp, Euro, Spade } from 'lucide-react';

export default function Home() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    setLoading(true);
    const data = await getGamesSummary();
    setGames(data);
    setLoading(false);
  }

  // Calcular estadísticas
  const totalGames = games.length;
  const totalPot = games.reduce((sum, g) => sum + g.total_pot, 0);
  const totalPlayers = games.reduce((sum, g) => sum + g.player_count, 0);

  return (
    <>
      <Header />
      
      <main className="flex-1">
        {/* Hero section con estadísticas */}
        {totalGames > 0 && (
          <section className="poker-table-bg py-8 sm:py-12">
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-background-card/80 backdrop-blur rounded-xl p-4 sm:p-6 text-center border border-border animate-fade-in">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Spade className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <p className="text-xl sm:text-3xl font-bold text-foreground">{totalGames}</p>
                  <p className="text-xs sm:text-sm text-foreground-muted">Partidas</p>
                </div>
                
                <div className="bg-background-card/80 backdrop-blur rounded-xl p-4 sm:p-6 text-center border border-border animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Euro className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>
                  <p className="text-xl sm:text-3xl font-bold text-foreground">{totalPot.toFixed(0)}€</p>
                  <p className="text-xs sm:text-sm text-foreground-muted">Total jugado</p>
                </div>
                
                <div className="bg-background-card/80 backdrop-blur rounded-xl p-4 sm:p-6 text-center border border-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                  </div>
                  <p className="text-xl sm:text-3xl font-bold text-foreground">{totalPlayers}</p>
                  <p className="text-xs sm:text-sm text-foreground-muted">Participaciones</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Lista de partidas */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {loading ? (
            <LoadingSpinner />
          ) : games.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Historial de Partidas
                </h2>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {games.map((game, index) => (
                  <GameCard key={game.id} game={game} index={index} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-foreground-muted">
            🃏 Poker Nights — Hecho con ♥ para las noches de poker
          </p>
        </div>
      </footer>
    </>
  );
}
