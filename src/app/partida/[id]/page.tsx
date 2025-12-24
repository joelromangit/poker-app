'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getGameById, deleteGame } from '@/lib/games';
import { Game, GamePlayer } from '@/types';
import {
  ArrowLeft,
  Calendar,
  Coins,
  Euro,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  FileText,
  Trash2,
  Share2,
  RefreshCw,
  Edit,
  MessageCircle,
  Copy,
  Check,
} from 'lucide-react';

export default function PartidaPage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadGame();
  }, [params.id]);

  async function loadGame() {
    if (!params.id) return;
    setLoading(true);
    const data = await getGameById(params.id as string);
    setGame(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!game) return;
    setDeleting(true);
    const success = await deleteGame(game.id);
    if (success) {
      router.push('/');
    } else {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  function handleShareWhatsApp() {
    if (!game) return;
    const text = generateShareText(game);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setShowShareMenu(false);
  }

  function handleCopyToClipboard() {
    if (!game) return;
    const text = generateShareText(game);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowShareMenu(false);
  }

  async function handleNativeShare() {
    if (!game) return;
    const text = generateShareText(game);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Partida de Poker',
          text: text,
        });
      } catch {
        // Usuario canceló
      }
    }
    setShowShareMenu(false);
  }

  function generateShareText(game: Game): string {
    const date = new Date(game.created_at).toLocaleDateString('es-ES');
    const sortedPlayers = [...game.players].sort((a, b) => b.profit - a.profit);
    const totalRebuys = game.players.reduce((sum, gp) => sum + gp.rebuys, 0);
    
    let text = `🃏 Partida de Poker - ${date}\n`;
    text += `💰 Bote: ${game.total_pot.toFixed(2)}€`;
    if (totalRebuys > 0) {
      text += ` (${totalRebuys} rebuys)`;
    }
    text += `\n\n`;
    text += `Resultados:\n`;
    
    sortedPlayers.forEach((gp, i) => {
      const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•';
      const sign = gp.profit > 0 ? '+' : '';
      const rebuyText = gp.rebuys > 0 ? ` (${gp.rebuys}R)` : '';
      text += `${emoji} ${gp.player.name}${rebuyText}: ${sign}${gp.profit.toFixed(2)}€\n`;
    });
    
    return text;
  }

  // Calcular fichas totales compradas (buy-in + rebuys)
  function getTotalChipsBought(gp: GamePlayer): number {
    if (!game) return 0;
    return game.buy_in * (1 + gp.rebuys);
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <LoadingSpinner />
        </main>
      </>
    );
  }

  if (!game) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center animate-fade-in">
            <h1 className="text-2xl font-bold text-foreground mb-2">Partida no encontrada</h1>
            <p className="text-foreground-muted mb-6">Esta partida no existe o ha sido eliminada.</p>
            <Link href="/" className="btn-primary px-6 py-3 rounded-xl text-white font-medium">
              Volver al inicio
            </Link>
          </div>
        </main>
      </>
    );
  }

  const date = new Date(game.created_at);
  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const sortedPlayers = [...game.players].sort((a, b) => b.profit - a.profit);
  const winner = sortedPlayers[0];
  const totalRebuys = game.players.reduce((sum, gp) => sum + gp.rebuys, 0);

  return (
    <>
      <Header />

      <main className="flex-1">
        {/* Back button */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al historial</span>
          </Link>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
          {/* Header de la partida */}
          <div className="bg-background-card rounded-2xl p-6 border border-border mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 text-foreground-muted text-sm mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="capitalize">{formattedDate}</span>
                  <span>•</span>
                  <span>{formattedTime}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Detalle de Partida
                </h1>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Botón Editar */}
                <Link
                  href={`/editar-partida/${game.id}`}
                  className="p-2 rounded-lg bg-background border border-border hover:border-primary transition-colors"
                  title="Editar partida"
                >
                  <Edit className="w-5 h-5 text-foreground-muted hover:text-primary" />
                </Link>

                {/* Botón Compartir con menú */}
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="p-2 rounded-lg bg-background border border-border hover:border-primary transition-colors"
                    title="Compartir"
                  >
                    <Share2 className="w-5 h-5 text-foreground-muted" />
                  </button>

                  {/* Menú de compartir */}
                  {showShareMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowShareMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 bg-background-card border border-border rounded-xl shadow-lg z-50 w-48 overflow-hidden animate-fade-in">
                        <button
                          onClick={handleShareWhatsApp}
                          className="w-full px-4 py-3 text-left hover:bg-background flex items-center gap-3 transition-colors text-foreground"
                        >
                          <MessageCircle className="w-5 h-5 text-green-500" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={handleCopyToClipboard}
                          className="w-full px-4 py-3 text-left hover:bg-background flex items-center gap-3 transition-colors text-foreground border-t border-border"
                        >
                          {copied ? (
                            <>
                              <Check className="w-5 h-5 text-success" />
                              <span className="text-success">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-5 h-5 text-foreground-muted" />
                              <span>Copiar texto</span>
                            </>
                          )}
                        </button>
                        {typeof navigator !== 'undefined' && navigator.share && (
                          <button
                            onClick={handleNativeShare}
                            className="w-full px-4 py-3 text-left hover:bg-background flex items-center gap-3 transition-colors text-foreground border-t border-border"
                          >
                            <Share2 className="w-5 h-5 text-foreground-muted" />
                            <span>Más opciones...</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Botón Eliminar */}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-lg bg-background border border-border hover:border-danger transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5 text-foreground-muted hover:text-danger" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-background rounded-xl p-4 text-center">
                <Euro className="w-5 h-5 text-accent mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{game.total_pot.toFixed(2)}€</p>
                <p className="text-xs text-foreground-muted">Bote total</p>
              </div>
              <div className="bg-background rounded-xl p-4 text-center">
                <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{game.players.length}</p>
                <p className="text-xs text-foreground-muted">Jugadores</p>
              </div>
              <div className="bg-background rounded-xl p-4 text-center">
                <Coins className="w-5 h-5 text-warning mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{game.chip_value}€</p>
                <p className="text-xs text-foreground-muted">Valor ficha</p>
              </div>
              <div className="bg-background rounded-xl p-4 text-center">
                <RefreshCw className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{totalRebuys}</p>
                <p className="text-xs text-foreground-muted">Rebuys</p>
              </div>
            </div>
          </div>

          {/* Ganador destacado */}
          {winner && winner.profit > 0 && (
            <div className="bg-gradient-to-r from-accent/20 to-warning/10 rounded-2xl p-6 border border-accent/30 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: winner.player.avatar_color }}
                >
                  {winner.player.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-accent font-medium">🎉 ¡Ganador de la noche!</p>
                  <p className="text-2xl font-bold text-foreground">{winner.player.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-success">+{winner.profit.toFixed(2)}€</p>
                  <p className="text-sm text-foreground-muted">
                    {winner.final_chips - getTotalChipsBought(winner) > 0 ? '+' : ''}
                    {winner.final_chips - getTotalChipsBought(winner)} fichas
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lista de jugadores */}
          <div className="bg-background-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Resultados
              </h2>
            </div>

            <div className="divide-y divide-border">
              {sortedPlayers.map((gp, index) => {
                const isWinner = gp.profit > 0;
                const isLoser = gp.profit < 0;
                const totalChipsBought = getTotalChipsBought(gp);
                const chipDiff = gp.final_chips - totalChipsBought;

                return (
                  <div
                    key={gp.id}
                    className="p-4 flex items-center gap-4 animate-slide-in"
                    style={{ animationDelay: `${(index + 1) * 0.05}s` }}
                  >
                    {/* Posición */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-accent/20 text-accent' :
                      index === 1 ? 'bg-foreground-muted/20 text-foreground-muted' :
                      index === 2 ? 'bg-warning/20 text-warning' :
                      'bg-background text-foreground-muted'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: gp.player.avatar_color }}
                    >
                      {gp.player.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Nombre y fichas */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{gp.player.name}</p>
                        {gp.rebuys > 0 && (
                          <span className="flex items-center gap-0.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex-shrink-0">
                            <RefreshCw className="w-3 h-3" />
                            {gp.rebuys}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground-muted">
                        {totalChipsBought} → {gp.final_chips} fichas
                        <span className={`ml-2 ${chipDiff > 0 ? 'text-success' : chipDiff < 0 ? 'text-danger' : ''}`}>
                          ({chipDiff > 0 ? '+' : ''}{chipDiff})
                        </span>
                      </p>
                      {gp.rebuys > 0 && (
                        <p className="text-xs text-foreground-muted">
                          Inversión: {(totalChipsBought * game.chip_value).toFixed(2)}€ ({gp.rebuys} rebuy{gp.rebuys > 1 ? 's' : ''})
                        </p>
                      )}
                    </div>

                    {/* Resultado */}
                    <div className={`flex items-center gap-1 font-bold ${
                      isWinner ? 'text-success' :
                      isLoser ? 'text-danger' :
                      'text-foreground-muted'
                    }`}>
                      {isWinner && <TrendingUp className="w-4 h-4" />}
                      {isLoser && <TrendingDown className="w-4 h-4" />}
                      {!isWinner && !isLoser && <Minus className="w-4 h-4" />}
                      <span>
                        {isWinner ? '+' : ''}{gp.profit.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notas */}
          {game.notes && (
            <div className="bg-background-card rounded-2xl p-5 border border-border mt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-sm font-semibold text-foreground-muted mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notas
              </h3>
              <p className="text-foreground">{game.notes}</p>
            </div>
          )}

          {/* Info adicional */}
          <div className="mt-6 p-4 bg-background-secondary rounded-xl text-center">
            <p className="text-sm text-foreground-muted">
              Buy-in: <span className="font-medium text-foreground">{game.buy_in} fichas</span> × <span className="font-medium text-foreground">{game.chip_value}€</span> = <span className="font-medium text-accent">{(game.buy_in * game.chip_value).toFixed(2)}€</span> por entrada
            </p>
          </div>
        </div>
      </main>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-background-card rounded-2xl p-6 max-w-sm w-full border border-border">
            <h3 className="text-xl font-bold text-foreground mb-2">¿Eliminar partida?</h3>
            <p className="text-foreground-muted mb-6">
              Esta acción no se puede deshacer. Se eliminarán todos los datos de esta partida.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-background border border-border text-foreground font-medium hover:bg-background-secondary transition-colors"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-danger text-white font-medium hover:bg-danger/80 transition-colors flex items-center justify-center gap-2"
                disabled={deleting}
              >
                {deleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
