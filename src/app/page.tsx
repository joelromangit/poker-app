'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getGamesSummary } from '@/lib/games';
import { getHomeStats, HomeStats } from '@/lib/players';
import { GameSummary } from '@/types';
import { Trophy, RefreshCw, Spade, FileWarning, ArrowRight, X, Search } from 'lucide-react';
import { getDraft, clearDraft } from './nueva-partida/page';
import { InstallBanner } from '@/components/InstallPrompt';

export default function Home() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [homeStats, setHomeStats] = useState<HomeStats>({ leader: null, rebuyKing: null });
  const [loading, setLoading] = useState(true);
  const [draftInfo, setDraftInfo] = useState<{ playerCount: number; savedAt: string } | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadGames();
    checkDraft();
  }, []);

  async function loadGames() {
    setLoading(true);
    const [gamesData, statsData] = await Promise.all([
      getGamesSummary(),
      getHomeStats()
    ]);
    setGames(gamesData);
    setHomeStats(statsData);
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

  // Filtrar partidas por búsqueda
  const filteredGames = games.filter(game => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    // Buscar en nombre de la partida
    if (game.name?.toLowerCase().includes(query)) return true;
    // Buscar en fecha
    const date = new Date(game.created_at);
    const dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    if (dateStr.toLowerCase().includes(query)) return true;
    // Buscar en ganador/perdedor
    if (game.top_winner?.toLowerCase().includes(query)) return true;
    if (game.worst_loser?.toLowerCase().includes(query)) return true;
    return false;
  });

  // Calcular estadísticas
  const totalGames = games.length;

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
                {/* Partidas */}
                <div className="bg-background-card/80 backdrop-blur rounded-xl p-4 sm:p-6 text-center border border-border animate-fade-in">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Spade className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <p className="text-xl sm:text-3xl font-bold text-foreground">{totalGames}</p>
                  <p className="text-xs sm:text-sm text-foreground-muted">Partidas</p>
                </div>
                
                {/* Líder actual */}
                <div className="bg-background-card/80 backdrop-blur rounded-xl p-4 sm:p-6 text-center border border-border animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  {homeStats.leader ? (
                    <>
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3">
                        {homeStats.leader.player.avatar_url ? (
                          <img
                            src={homeStats.leader.player.avatar_url}
                            alt={homeStats.leader.player.name}
                            className="w-full h-full rounded-full object-cover border-2 border-accent"
                          />
                        ) : (
                          <div
                            className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl border-2 border-accent"
                            style={{ backgroundColor: homeStats.leader.player.avatar_color }}
                          >
                            {homeStats.leader.player.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-accent rounded-full flex items-center justify-center">
                          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-foreground truncate">{homeStats.leader.player.name}</p>
                      <p className={`text-xs sm:text-sm font-medium ${homeStats.leader.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                        {homeStats.leader.balance >= 0 ? '+' : ''}{homeStats.leader.balance.toFixed(2)}€
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
                      </div>
                      <p className="text-sm text-foreground-muted">-</p>
                    </>
                  )}
                  <p className="text-xs text-foreground-muted mt-1">Líder actual</p>
                </div>
                
                {/* Rey del rebuy */}
                <div className="bg-background-card/80 backdrop-blur rounded-xl p-4 sm:p-6 text-center border border-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  {homeStats.rebuyKing ? (
                    <>
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3">
                        {homeStats.rebuyKing.player.avatar_url ? (
                          <img
                            src={homeStats.rebuyKing.player.avatar_url}
                            alt={homeStats.rebuyKing.player.name}
                            className="w-full h-full rounded-full object-cover border-2 border-warning"
                          />
                        ) : (
                          <div
                            className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl border-2 border-warning"
                            style={{ backgroundColor: homeStats.rebuyKing.player.avatar_color }}
                          >
                            {homeStats.rebuyKing.player.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-warning rounded-full flex items-center justify-center text-xs">
                          👑
                        </div>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-foreground truncate">{homeStats.rebuyKing.player.name}</p>
                      <p className="text-xs sm:text-sm text-warning font-medium">{homeStats.rebuyKing.totalRebuys} rebuys</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <RefreshCw className="w-6 h-6 sm:w-7 sm:h-7 text-warning" />
                      </div>
                      <p className="text-sm text-foreground-muted">-</p>
                    </>
                  )}
                  <p className="text-xs text-foreground-muted mt-1">Rey del Rebuy</p>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Historial de Partidas
                </h2>
                
                {/* Buscador */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar partida..."
                    className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl bg-background-card border border-border text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Resultados de búsqueda */}
              {searchQuery && (
                <p className="text-sm text-foreground-muted mb-4">
                  {filteredGames.length} {filteredGames.length === 1 ? 'resultado' : 'resultados'} para "{searchQuery}"
                </p>
              )}
              
              {filteredGames.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-foreground-muted/50 mx-auto mb-4" />
                  <p className="text-foreground-muted">No se encontraron partidas con "{searchQuery}"</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredGames.map((game, index) => (
                    <GameCard key={game.id} game={game} index={index} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-foreground-muted">
            Crispy maricón
          </p>
        </div>
      </footer>

      {/* Banner de instalación PWA */}
      <InstallBanner />
    </>
  );
}
