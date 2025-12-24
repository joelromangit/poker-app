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
  Pencil
} from 'lucide-react';

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
  const [saving, setSaving] = useState(false);
  
  const [error, setError] = useState('');

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
    setError('');
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
      avatar_color: editColor
    });

    if (updated) {
      setPlayers(prev => prev.map(p => 
        p.id === updated.id ? updated : p
      ).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingPlayer(null);
    } else {
      setError('Error al actualizar. ¿Ya existe ese nombre?');
    }

    setSaving(false);
  };

  const getPlayerStats = (playerId: string) => stats.get(playerId);

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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Jugadores
              </h1>
              <p className="text-foreground-muted">
                {players.length} jugadores registrados
              </p>
            </div>
            <button
              onClick={() => setShowNewPlayer(true)}
              className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo Jugador</span>
            </button>
          </div>

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

                {/* Preview del avatar */}
                <div className="flex justify-center mb-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl transition-colors"
                    style={{ backgroundColor: editColor }}
                  >
                    {editName.charAt(0).toUpperCase() || '?'}
                  </div>
                </div>

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
            <div className="grid gap-4">
              {players.map((player, index) => {
                const playerStats = getPlayerStats(player.id);
                const balance = playerStats?.total_balance || 0;
                const isPositive = balance > 0;
                const isNegative = balance < 0;

                return (
                  <div
                    key={player.id}
                    className="bg-background-card rounded-2xl p-5 border border-border hover:border-primary/30 transition-all animate-slide-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar con botón de editar */}
                      <button
                        onClick={() => openEditModal(player)}
                        className="relative group"
                        title="Editar jugador"
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 transition-opacity group-hover:opacity-70"
                          style={{ backgroundColor: player.avatar_color }}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil className="w-4 h-4 text-white" />
                        </div>
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground truncate">
                          {player.name}
                        </h3>
                        <p className="text-sm text-foreground-muted">
                          {playerStats?.total_games || 0} partidas jugadas
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6">
                        {/* Balance */}
                        <div className="text-right">
                          <p className="text-xs text-foreground-muted mb-1">Balance</p>
                          <p className={`text-lg font-bold flex items-center gap-1 ${
                            isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-foreground-muted'
                          }`}>
                            {isPositive && <TrendingUp className="w-4 h-4" />}
                            {isNegative && <TrendingDown className="w-4 h-4" />}
                            {isPositive ? '+' : ''}{balance.toFixed(2)}€
                          </p>
                        </div>

                        {/* Win rate */}
                        {playerStats && playerStats.total_games > 0 && (
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-foreground-muted mb-1">Victorias</p>
                            <p className="text-lg font-bold text-foreground flex items-center gap-1">
                              <Trophy className="w-4 h-4 text-accent" />
                              {playerStats.win_rate.toFixed(0)}%
                            </p>
                          </div>
                        )}

                        {/* Partidas */}
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-foreground-muted mb-1">Media</p>
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
                      <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 sm:hidden">
                        <div className="text-center">
                          <p className="text-xs text-foreground-muted">Victorias</p>
                          <p className="font-bold text-foreground">{playerStats.win_rate.toFixed(0)}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-foreground-muted">Mejor</p>
                          <p className="font-bold text-success">+{playerStats.best_game.toFixed(2)}€</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-foreground-muted">Peor</p>
                          <p className="font-bold text-danger">{playerStats.worst_game.toFixed(2)}€</p>
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
    </>
  );
}
