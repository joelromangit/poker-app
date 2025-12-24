'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getGamesSummary } from '@/lib/games';
import { GameSummary } from '@/types';
import { TrendingUp, Euro, Spade, FileWarning, ArrowRight, X } from 'lucide-react';
import { getDraft, clearDraft } from './nueva-partida/page';
import { InstallBanner } from '@/components/InstallPrompt';

export default function Home() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftInfo, setDraftInfo] = useState<{ playerCount: number; savedAt: string } | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  useEffect(() => {
    loadGames();
    checkDraft();
  }, []);

  async function loadGames() {
    setLoading(true);
    const data = await getGamesSummary();
    setGames(data);
    setLoading(false);
  }

  function checkDraft() {
    const draft = getDraft();
    if (draft && draft.players.length > 0) {
      setDraftInfo({
        playerCount: draft.players.length,
        savedAt: draft.savedAt,
      });
      setShowDraftBanner(true);
    }
  }

  function handleDiscardDraft() {
    clearDraft();
    setShowDraftBanner(false);
    setDraftInfo(null);
  }

  function formatDraftTime(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  }

  // Calcular estadísticas
  const totalGames = games.length;
  const totalPot = games.reduce((sum, g) => sum + g.total_pot, 0);
  const totalPlayers = games.reduce((sum, g) => sum + g.player_count, 0);

  return (
    <>
      <Header />
      
      <main className="flex-1">
        {/* Banner de partida en borrador */}
        {showDraftBanner && draftInfo && (
          <div className="bg-warning/10 border-b border-warning/30">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                    <FileWarning className="w-5 h-5 text-warning" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Tienes una partida sin terminar
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {draftInfo.playerCount} jugadores • {formatDraftTime(draftInfo.savedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href="/nueva-partida"
                    className="btn-primary px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={handleDiscardDraft}
                    className="p-1.5 text-foreground-muted hover:text-danger transition-colors"
                    title="Descartar borrador"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

      {/* Banner de instalación PWA */}
      <InstallBanner />
    </>
  );
}
