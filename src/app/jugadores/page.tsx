'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { getPlayers, createPlayer, updatePlayer, getAllPlayersStats } from '@/lib/players';
import { Player, PlayerStats } from '@/types';
import { 
  Users, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Trophy,
  X,
  Check,
  Loader2,
  Pencil,
  Sparkles,
  Rainbow,
  ArrowUpDown,
  Medal,
  Camera,
  Trash2
} from 'lucide-react';
import { uploadPlayerAvatar, compressImage, deletePlayerAvatar } from '@/lib/storage';
import ImageCropper from '@/components/ImageCropper';

const AVATAR_COLORS = [
  '#10B981', // Verde esmeralda
  '#3B82F6', // Azul
  '#8B5CF6', // Púrpura
  '#F59E0B', // Ámbar
  '#EF4444', // Rojo
  '#EC4899', // Rosa
  '#06B6D4', // Cyan
  '#84CC16', // Lima
];

export default function JugadoresPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<Map<string, PlayerStats>>(new Map());
  const [loading, setLoading] = useState(true);
  
  // Modal crear jugador
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerColor, setNewPlayerColor] = useState(AVATAR_COLORS[0]);
  const [creating, setCreating] = useState(false);
  
  // Modal editar jugador
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | undefined>(undefined);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Cropper state
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  
  const [error, setError] = useState('');
  
  // Orden del ranking
  type SortBy = 'balance' | 'winrate';
  const [sortBy, setSortBy] = useState<SortBy>('balance');
  
  // Who's Gay modal
  const [showGayModal, setShowGayModal] = useState(false);
  const [gayPlayer, setGayPlayer] = useState<Player | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [playersData, statsData] = await Promise.all([
        getPlayers(),
        getAllPlayersStats()
      ]);
      setPlayers(playersData);
      
      const statsMap = new Map<string, PlayerStats>();
      statsData.forEach(s => statsMap.set(s.player.id, s));
      setStats(statsMap);
    } catch (err) {
      console.error('Error loading players:', err);
    }
    setLoading(false);
  };

  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setCreating(true);
    setError('');

    const player = await createPlayer({ 
      name: newPlayerName.trim(),
      avatar_color: newPlayerColor
    });
    
    if (player) {
      setPlayers(prev => [...prev, player].sort((a, b) => a.name.localeCompare(b.name)));
      setNewPlayerName('');
      setNewPlayerColor(AVATAR_COLORS[0]);
      setShowNewPlayer(false);
      loadData();
    } else {
      setError('Error al crear jugador. ¿Ya existe ese nombre?');
    }

    setCreating(false);
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setEditName(player.name);
    setEditColor(player.avatar_color);
    setEditAvatarUrl(player.avatar_url);
    setError('');
  };

  // Manejar selección de imagen (abre el cropper)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convertir a URL para el cropper
    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    
    // Resetear el input para permitir seleccionar la misma imagen de nuevo
    e.target.value = '';
  };

  // Manejar imagen recortada
  const handleCroppedImage = async (croppedFile: File) => {
    if (!editingPlayer) return;
    
    setShowCropper(false);
    setCropperImage(null);
    setUploadingAvatar(true);
    
    try {
      // Comprimir imagen recortada
      const compressedFile = await compressImage(croppedFile, 300);
      
      // Subir a Supabase Storage
      const url = await uploadPlayerAvatar(editingPlayer.id, compressedFile);
      if (url) {
        setEditAvatarUrl(url);
      } else {
        setError('Error al subir la imagen. Verifica que el bucket "avatars" esté configurado en Supabase.');
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Error al subir la imagen');
    }
    setUploadingAvatar(false);
  };

  // Cancelar cropper
  const handleCancelCrop = () => {
    setShowCropper(false);
    setCropperImage(null);
  };

  // Eliminar avatar
  const handleRemoveAvatar = async () => {
    if (editAvatarUrl) {
      await deletePlayerAvatar(editAvatarUrl);
    }
    setEditAvatarUrl(undefined);
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return;
    
    if (!editName.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    setError('');

    const updated = await updatePlayer(editingPlayer.id, {
      name: editName.trim(),
      avatar_color: editColor,
      avatar_url: editAvatarUrl || null,
    });

    if (updated) {
      setPlayers(prev => prev.map(p => 
        p.id === updated.id ? updated : p
      ).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingPlayer(null);
      loadData(); // Recargar para obtener los datos actualizados
    } else {
      setError('Error al actualizar. ¿Ya existe ese nombre?');
    }

    setSaving(false);
  };

  const getPlayerStats = (playerId: string) => stats.get(playerId);

  // Ordenar jugadores según el criterio seleccionado
  const sortedPlayers = [...players].sort((a, b) => {
    const statsA = stats.get(a.id);
    const statsB = stats.get(b.id);
    
    if (sortBy === 'balance') {
      const balanceA = statsA?.total_balance || 0;
      const balanceB = statsB?.total_balance || 0;
      return balanceB - balanceA; // Mayor balance primero
    } else {
      const winrateA = statsA?.win_rate || 0;
      const winrateB = statsB?.win_rate || 0;
      return winrateB - winrateA; // Mayor winrate primero
    }
  });

  // Who's Gay? - Seleccionar jugador aleatorio con animación
  const handleWhosGay = () => {
    if (players.length === 0) return;
    
    setShowGayModal(true);
    setIsSpinning(true);
    setGayPlayer(null);

    // Animación de "ruleta" mostrando jugadores aleatorios
    let count = 0;
    const maxCount = 15;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * players.length);
      setGayPlayer(players[randomIndex]);
      count++;
      
      if (count >= maxCount) {
        clearInterval(interval);
        // Selección final
        const finalIndex = Math.floor(Math.random() * players.length);
        setGayPlayer(players[finalIndex]);
        setIsSpinning(false);
      }
    }, 100);
  };

  // Componente de selector de color
  const ColorPicker = ({ selected, onChange }: { selected: string; onChange: (color: string) => void }) => (
    <div className="flex gap-2 flex-wrap">
      {AVATAR_COLORS.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`w-8 h-8 rounded-full transition-all ${
            selected === color 
              ? 'ring-2 ring-offset-2 ring-offset-background-card ring-primary scale-110' 
              : 'hover:scale-110'
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );

  return (
    <>
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="animate-fade-in">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <Medal className="w-8 h-8 text-accent" />
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Ranking de Jugadores
              </h1>
            </div>
            <p className="text-foreground-muted">
              {players.length} jugadores registrados
            </p>
          </div>

          {/* Barra de acciones */}
          {players.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 p-4 bg-background-card rounded-xl border border-border">
              {/* Botones de ordenación */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-muted flex items-center gap-1">
                  <ArrowUpDown className="w-4 h-4" />
                  Ordenar:
                </span>
                <button
                  onClick={() => setSortBy('balance')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === 'balance'
                      ? 'bg-primary text-white'
                      : 'bg-background border border-border text-foreground-muted hover:text-foreground'
                  }`}
                >
                  💰 Balance
                </button>
                <button
                  onClick={() => setSortBy('winrate')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === 'winrate'
                      ? 'bg-primary text-white'
                      : 'bg-background border border-border text-foreground-muted hover:text-foreground'
                  }`}
                >
                  🏆 % Victorias
                </button>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleWhosGay}
                  className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity"
                >
                  <Rainbow className="w-4 h-4" />
                  <span>Who's Gay?</span>
                </button>
                
                <button
                  onClick={() => setShowNewPlayer(true)}
                  className="btn-primary px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo</span>
                </button>
              </div>
            </div>
          )}

          {/* Botón nuevo jugador cuando no hay jugadores */}
          {players.length === 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowNewPlayer(true)}
                className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Nuevo Jugador</span>
              </button>
            </div>
          )}

          {/* Modal crear jugador */}
          {showNewPlayer && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background-card rounded-2xl p-6 w-full max-w-md border border-border animate-slide-in">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Nuevo Jugador</h2>
                  <button
                    onClick={() => {
                      setShowNewPlayer(false);
                      setNewPlayerName('');
                      setError('');
                    }}
                    className="p-2 text-foreground-muted hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-foreground-muted mb-2">
                    Nombre del jugador
                  </label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreatePlayer()}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Ej: Carlos"
                    autoFocus
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-foreground-muted mb-2">
                    Color del avatar
                  </label>
                  <ColorPicker selected={newPlayerColor} onChange={setNewPlayerColor} />
                </div>

                {error && (
                  <p className="text-danger text-sm mb-4">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowNewPlayer(false);
                      setNewPlayerName('');
                      setError('');
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border border-border text-foreground-muted hover:bg-background transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreatePlayer}
                    disabled={creating || !newPlayerName.trim()}
                    className="flex-1 btn-primary px-4 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Crear
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal editar jugador */}
          {editingPlayer && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background-card rounded-2xl p-6 w-full max-w-md border border-border animate-slide-in">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Editar Jugador</h2>
                  <button
                    onClick={() => {
                      setEditingPlayer(null);
                      setError('');
                    }}
                    className="p-2 text-foreground-muted hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Preview del avatar con opción de foto */}
                <div className="flex justify-center mb-6">
                  <div className="relative group">
                    {editAvatarUrl ? (
                      <img
                        src={editAvatarUrl}
                        alt={editName}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl transition-colors"
                        style={{ backgroundColor: editColor }}
                      >
                        {editName.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    
                    {/* Overlay para subir foto */}
                    <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      {uploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>

                    {/* Botón eliminar foto */}
                    {editAvatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-danger rounded-full flex items-center justify-center text-white hover:bg-danger/80 transition-colors"
                        title="Eliminar foto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-foreground-muted text-center mb-4">
                  Haz clic en el avatar para subir una foto
                </p>

                <div className="mb-4">
                  <label className="block text-sm text-foreground-muted mb-2">
                    Nombre del jugador
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdatePlayer()}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Ej: Carlos"
                    autoFocus
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-foreground-muted mb-2">
                    Color del avatar
                  </label>
                  <ColorPicker selected={editColor} onChange={setEditColor} />
                </div>

                {error && (
                  <p className="text-danger text-sm mb-4">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditingPlayer(null);
                      setError('');
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border border-border text-foreground-muted hover:bg-background transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdatePlayer}
                    disabled={saving || !editName.trim()}
                    className="flex-1 btn-primary px-4 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Guardar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de jugadores */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No hay jugadores
              </h2>
              <p className="text-foreground-muted mb-6">
                Crea tu primer jugador para empezar
              </p>
              <button
                onClick={() => setShowNewPlayer(true)}
                className="btn-primary px-6 py-3 rounded-xl inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Crear Jugador
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {sortedPlayers.map((player, index) => {
                const playerStats = getPlayerStats(player.id);
                const balance = playerStats?.total_balance || 0;
                const isPositive = balance > 0;
                const isNegative = balance < 0;
                const position = index + 1;

                return (
                  <div
                    key={player.id}
                    className={`bg-background-card rounded-2xl p-4 sm:p-5 border transition-all animate-slide-in ${
                      position === 1 ? 'border-accent/50 bg-gradient-to-r from-accent/10 to-transparent' :
                      position === 2 ? 'border-foreground-muted/30' :
                      position === 3 ? 'border-warning/30' :
                      'border-border hover:border-primary/30'
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Posición del ranking */}
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg flex-shrink-0 ${
                        position === 1 ? 'bg-accent/20 text-accent' :
                        position === 2 ? 'bg-foreground-muted/20 text-foreground-muted' :
                        position === 3 ? 'bg-warning/20 text-warning' :
                        'bg-background text-foreground-muted'
                      }`}>
                        {position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : position}
                      </div>

                      {/* Avatar con botón de editar */}
                      <button
                        onClick={() => openEditModal(player)}
                        className="relative group"
                        title="Editar jugador"
                      >
                        {player.avatar_url ? (
                          <img
                            src={player.avatar_url}
                            alt={player.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0 transition-opacity group-hover:opacity-70"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 transition-opacity group-hover:opacity-70"
                            style={{ backgroundColor: player.avatar_color }}
                          >
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil className="w-4 h-4 text-white" />
                        </div>
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                          {player.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-foreground-muted">
                          {playerStats?.total_games || 0} partidas
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 sm:gap-6">
                        {/* Balance */}
                        <div className="text-right">
                          <p className="text-xs text-foreground-muted mb-0.5 hidden sm:block">Balance</p>
                          <p className={`text-base sm:text-lg font-bold flex items-center justify-end gap-1 ${
                            isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-foreground-muted'
                          }`}>
                            {isPositive && <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />}
                            {isNegative && <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                            {isPositive ? '+' : ''}{balance.toFixed(2)}€
                          </p>
                        </div>

                        {/* Win rate */}
                        {playerStats && playerStats.total_games > 0 && (
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-foreground-muted mb-0.5">Victorias</p>
                            <p className="text-lg font-bold text-foreground flex items-center justify-end gap-1">
                              <Trophy className="w-4 h-4 text-accent" />
                              {playerStats.win_rate.toFixed(0)}%
                            </p>
                          </div>
                        )}

                        {/* Media */}
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-foreground-muted mb-0.5">Media</p>
                          <p className={`text-lg font-bold ${
                            (playerStats?.average_per_game || 0) >= 0 ? 'text-success' : 'text-danger'
                          }`}>
                            {(playerStats?.average_per_game || 0) >= 0 ? '+' : ''}
                            {(playerStats?.average_per_game || 0).toFixed(2)}€
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats expandidas en móvil */}
                    {playerStats && playerStats.total_games > 0 && (
                      <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-3 sm:hidden">
                        <div className="text-center">
                          <p className="text-xs text-foreground-muted">Victorias</p>
                          <p className="font-bold text-foreground text-sm">{playerStats.win_rate.toFixed(0)}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-foreground-muted">Mejor</p>
                          <p className="font-bold text-success text-sm">+{playerStats.best_game.toFixed(2)}€</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-foreground-muted">Peor</p>
                          <p className="font-bold text-danger text-sm">{playerStats.worst_game.toFixed(2)}€</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Image Cropper Modal */}
      {showCropper && cropperImage && (
        <ImageCropper
          image={cropperImage}
          onCropComplete={handleCroppedImage}
          onCancel={handleCancelCrop}
          aspectRatio={1}
          cropShape="round"
        />
      )}

      {/* Who's Gay Modal */}
      {showGayModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-2xl p-8 w-full max-w-sm border border-border animate-slide-in text-center relative overflow-hidden">
            {/* Fondo con gradiente arcoíris animado */}
            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500" />
            
            <button
              onClick={() => setShowGayModal(false)}
              className="absolute top-4 right-4 p-2 text-foreground-muted hover:text-foreground transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <Rainbow className="w-12 h-12 text-pink-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Who's Gay? 🏳️‍🌈
              </h2>

              {gayPlayer && (
                <div className={`transition-all duration-200 ${isSpinning ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}>
                  {/* Avatar grande */}
                  {gayPlayer.avatar_url ? (
                    <img
                      src={gayPlayer.avatar_url}
                      alt={gayPlayer.name}
                      className={`w-24 h-24 rounded-full object-cover mx-auto mb-4 transition-transform ${
                        isSpinning ? 'animate-pulse' : 'animate-[wiggle_1s_ease-in-out_infinite]'
                      }`}
                      style={!isSpinning ? { animation: 'wiggle 1s ease-in-out infinite' } : {}}
                    />
                  ) : (
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4 transition-transform ${
                        isSpinning ? 'animate-pulse' : ''
                      }`}
                      style={{ 
                        backgroundColor: gayPlayer.avatar_color,
                        ...(!isSpinning ? { animation: 'wiggle 1s ease-in-out infinite' } : {})
                      }}
                    >
                      {gayPlayer.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Nombre */}
                  <p className={`text-3xl font-bold mb-2 ${
                    isSpinning 
                      ? 'text-foreground-muted' 
                      : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500'
                  }`}>
                    {gayPlayer.name}
                  </p>

                  {!isSpinning && (
                    <>
                      <p className="text-lg text-foreground-muted mb-4">
                        ¡Es gay! 🎉
                      </p>
                      
                      {/* Confeti emoji */}
                      <div className="text-4xl" style={{ animation: 'float 2s ease-in-out infinite' }}>
                        🏳️‍🌈✨🎊
                      </div>
                    </>
                  )}

                  {isSpinning && (
                    <div className="flex items-center justify-center gap-2 text-foreground-muted">
                      <Sparkles className="w-5 h-5 animate-spin" />
                      <span>Seleccionando...</span>
                    </div>
                  )}
                </div>
              )}

              {!isSpinning && (
                <button
                  onClick={handleWhosGay}
                  className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity"
                >
                  🎲 ¡Otra vez!
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
