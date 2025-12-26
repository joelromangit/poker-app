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
  ArrowRight,
  Wallet,
  Camera,
  Frown,
  Loader2,
  X,
  ChevronDown,
} from 'lucide-react';
import { uploadLoserPhoto, compressImage, deleteLoserPhoto } from '@/lib/storage';
import { updateGameLoserPhoto } from '@/lib/games';
import ImageCropper from '@/components/ImageCropper';

export default function PartidaPage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadingLoserPhoto, setUploadingLoserPhoto] = useState(false);
  const [showLoserSection, setShowLoserSection] = useState(false);
  const [showPaymentsSection, setShowPaymentsSection] = useState(false);
  
  // Cropper state para foto del perdedor
  const [loserCropperImage, setLoserCropperImage] = useState<string | null>(null);
  const [showLoserCropper, setShowLoserCropper] = useState(false);

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

  // Manejar selección de foto del perdedor (abre cropper)
  function handleLoserPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setLoserCropperImage(reader.result as string);
      setShowLoserCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  // Manejar foto del perdedor recortada
  async function handleLoserCroppedImage(croppedFile: File) {
    if (!game) return;
    
    setShowLoserCropper(false);
    setLoserCropperImage(null);
    setUploadingLoserPhoto(true);
    
    try {
      const compressedFile = await compressImage(croppedFile, 600);
      const url = await uploadLoserPhoto(game.id, compressedFile);
      
      if (url) {
        await updateGameLoserPhoto(game.id, url);
        await loadGame();
      }
    } catch (err) {
      console.error('Error uploading loser photo:', err);
    }
    setUploadingLoserPhoto(false);
  }

  // Cancelar cropper del perdedor
  function handleCancelLoserCrop() {
    setShowLoserCropper(false);
    setLoserCropperImage(null);
  }

  // Eliminar foto del perdedor
  async function handleRemoveLoserPhoto() {
    if (!game?.loser_photo_url) return;
    
    await deleteLoserPhoto(game.loser_photo_url);
    await updateGameLoserPhoto(game.id, null);
    await loadGame();
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

  // Calcular distribución de pagos (quién paga a quién)
  interface Payment {
    from: { name: string; avatar_color: string };
    to: { name: string; avatar_color: string };
    amount: number;
  }

  function calculatePayments(players: GamePlayer[]): Payment[] {
    // Separar ganadores y perdedores
    const debtors = players
      .filter(p => p.profit < 0)
      .map(p => ({ ...p, balance: Math.abs(p.profit) }))
      .sort((a, b) => b.balance - a.balance);
    
    const creditors = players
      .filter(p => p.profit > 0)
      .map(p => ({ ...p, balance: p.profit }))
      .sort((a, b) => b.balance - a.balance);

    const payments: Payment[] = [];

    // Algoritmo greedy para minimizar transacciones
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const amount = Math.min(debtor.balance, creditor.balance);
      
      if (amount > 0.01) { // Ignorar cantidades muy pequeñas
        payments.push({
          from: { name: debtor.player.name, avatar_color: debtor.player.avatar_color },
          to: { name: creditor.player.name, avatar_color: creditor.player.avatar_color },
          amount: Math.round(amount * 100) / 100, // Redondear a 2 decimales
        });
      }
      
      debtor.balance -= amount;
      creditor.balance -= amount;
      
      if (debtor.balance < 0.01) i++;
      if (creditor.balance < 0.01) j++;
    }

    return payments;
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
                        {typeof navigator !== 'undefined' && 'share' in navigator && (
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
                {winner.player.avatar_url ? (
                  <img
                    src={winner.player.avatar_url}
                    alt={winner.player.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: winner.player.avatar_color }}
                  >
                    {winner.player.name.charAt(0).toUpperCase()}
                  </div>
                )}
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
                    {gp.player.avatar_url ? (
                      <img
                        src={gp.player.avatar_url}
                        alt={gp.player.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: gp.player.avatar_color }}
                      >
                        {gp.player.name.charAt(0).toUpperCase()}
                      </div>
                    )}

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

          {/* Foto del perdedor */}
          {(() => {
            const loser = sortedPlayers[sortedPlayers.length - 1];
            if (!loser || loser.profit >= 0) return null;

            return (
              <div className="bg-background-card rounded-2xl border border-border mt-6 overflow-hidden animate-fade-in" style={{ animationDelay: '0.15s' }}>
                <button
                  onClick={() => setShowLoserSection(!showLoserSection)}
                  className="w-full p-4 bg-gradient-to-r from-danger/10 to-warning/10 flex items-center justify-between hover:from-danger/15 hover:to-warning/15 transition-colors"
                >
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Frown className="w-5 h-5 text-danger" />
                      El Gran Perdedor 😭
                    </h2>
                    <p className="text-sm text-foreground-muted mt-1">
                      {loser.player.name} perdió {Math.abs(loser.profit).toFixed(2)}€
                    </p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-foreground-muted transition-transform ${showLoserSection ? 'rotate-180' : ''}`} />
                </button>

                {showLoserSection && (
                  <div className="p-4 border-t border-border">
                    {game.loser_photo_url ? (
                      <div className="relative">
                        <img
                          src={game.loser_photo_url}
                          alt={`${loser.player.name} - el perdedor`}
                          className="w-full max-h-96 object-contain rounded-xl"
                        />
                        <button
                          onClick={handleRemoveLoserPhoto}
                          className="absolute top-2 right-2 w-8 h-8 bg-danger/80 hover:bg-danger rounded-full flex items-center justify-center text-white transition-colors"
                          title="Eliminar foto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                        {uploadingLoserPhoto ? (
                          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                        ) : (
                          <Camera className="w-8 h-8 text-foreground-muted mb-2" />
                        )}
                        <span className="text-sm text-foreground-muted text-center">
                          {uploadingLoserPhoto ? 'Subiendo...' : 'Haz clic para subir la foto del perdedor'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleLoserPhotoSelect}
                          className="hidden"
                          disabled={uploadingLoserPhoto}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Distribución de pagos */}
          {(() => {
            const payments = calculatePayments(game.players);
            if (payments.length === 0) return null;
            
            return (
              <div className="bg-background-card rounded-2xl border border-border mt-6 overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <button
                  onClick={() => setShowPaymentsSection(!showPaymentsSection)}
                  className="w-full p-4 bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-between hover:from-primary/15 hover:to-accent/15 transition-colors"
                >
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      Liquidación de Cuentas
                    </h2>
                    <p className="text-sm text-foreground-muted mt-1">
                      {payments.length} transaccion{payments.length !== 1 ? 'es' : ''} para saldar cuentas
                    </p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-foreground-muted transition-transform ${showPaymentsSection ? 'rotate-180' : ''}`} />
                </button>

                {showPaymentsSection && (
                  <>
                    <div className="p-4 space-y-3 border-t border-border">
                      {payments.map((payment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border"
                        >
                          {/* Deudor */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ backgroundColor: payment.from.avatar_color }}
                            >
                              {payment.from.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground truncate">{payment.from.name}</span>
                          </div>

                          {/* Flecha y cantidad */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-danger/10 text-danger rounded-full font-bold text-sm">
                              <ArrowRight className="w-4 h-4" />
                              <span>{payment.amount.toFixed(2)}€</span>
                            </div>
                          </div>

                          {/* Acreedor */}
                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                            <span className="font-medium text-foreground truncate">{payment.to.name}</span>
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ backgroundColor: payment.to.avatar_color }}
                            >
                              {payment.to.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="px-4 pb-4">
                      <p className="text-xs text-foreground-muted text-center">
                        💡 Quién debe pagar a quién para liquidar todas las cuentas
                      </p>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

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

      {/* Image Cropper Modal para foto del perdedor */}
      {showLoserCropper && loserCropperImage && (
        <ImageCropper
          image={loserCropperImage}
          onCropComplete={handleLoserCroppedImage}
          onCancel={handleCancelLoserCrop}
          aspectRatio={4 / 3}
          cropShape="rect"
        />
      )}

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
