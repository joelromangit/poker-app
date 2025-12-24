'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import NumberInput from '@/components/NumberInput';
import { createGame } from '@/lib/games';
import { getPlayers, createPlayer } from '@/lib/players';
import { Player, GameFormPlayer } from '@/types';
import { 
  Plus, 
  Trash2, 
  Euro, 
  Coins, 
  Users, 
  Save,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Calculator,
  ChevronDown,
  X,
  Check,
  Loader2,
  UserPlus
} from 'lucide-react';

export default function NuevaPartidaPage() {
  const router = useRouter();
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  
  const [chipValue, setChipValue] = useState('0.05');
  const [buyIn, setBuyIn] = useState('100');
  const [selectedPlayers, setSelectedPlayers] = useState<GameFormPlayer[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Modal para nuevo jugador
  const [showNewPlayerModal, setShowNewPlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [creatingPlayer, setCreatingPlayer] = useState(false);

  // Dropdown de selección
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoadingPlayers(true);
    const players = await getPlayers();
    setAvailablePlayers(players);
    setLoadingPlayers(false);
  };

  // Jugadores no seleccionados aún
  const unselectedPlayers = availablePlayers.filter(
    p => !selectedPlayers.some(sp => sp.player_id === p.id)
  );

  // Añadir jugador a la partida
  const addPlayerToGame = (player: Player) => {
    setSelectedPlayers([...selectedPlayers, {
      player_id: player.id,
      player: player,
      final_chips: '',
    }]);
    setShowPlayerDropdown(false);
  };

  // Eliminar jugador de la partida
  const removePlayerFromGame = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.player_id !== playerId));
  };

  // Actualizar fichas finales
  const updateFinalChips = (playerId: string, value: string) => {
    setSelectedPlayers(selectedPlayers.map(p => 
      p.player_id === playerId ? { ...p, final_chips: value } : p
    ));
  };

  // Crear nuevo jugador
  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim()) return;

    setCreatingPlayer(true);
    const player = await createPlayer({ name: newPlayerName.trim() });
    
    if (player) {
      setAvailablePlayers(prev => [...prev, player].sort((a, b) => a.name.localeCompare(b.name)));
      addPlayerToGame(player);
      setNewPlayerName('');
      setShowNewPlayerModal(false);
    }
    
    setCreatingPlayer(false);
  };

  // Calcular ganancias/pérdidas
  const calculateProfit = (finalChips: string): number => {
    const chips = parseFloat(finalChips) || 0;
    const initial = parseFloat(buyIn) || 0;
    const value = parseFloat(chipValue) || 0;
    return (chips - initial) * value;
  };

  // Calcular bote total
  const totalPot = (parseFloat(buyIn) || 0) * (parseFloat(chipValue) || 0) * selectedPlayers.length;

  // Verificar balance
  const totalFinalChips = selectedPlayers.reduce((sum, p) => sum + (parseFloat(p.final_chips) || 0), 0);
  const expectedTotalChips = (parseFloat(buyIn) || 0) * selectedPlayers.length;
  const isBalanced = Math.abs(totalFinalChips - expectedTotalChips) < 0.01;
  const allPlayersHaveData = selectedPlayers.length >= 2 && 
    selectedPlayers.every(p => p.final_chips !== '' && parseFloat(p.final_chips) >= 0);

  // Guardar partida
  const handleSubmit = async () => {
    setError('');
    
    if (selectedPlayers.length < 2) {
      setError('Necesitas al menos 2 jugadores');
      return;
    }

    if (!allPlayersHaveData) {
      setError('Todos los jugadores deben tener fichas finales');
      return;
    }

    if (!isBalanced) {
      setError(`El balance de fichas no cuadra: ${totalFinalChips} vs ${expectedTotalChips} esperadas`);
      return;
    }

    setSaving(true);

    try {
      const playersData = selectedPlayers.map(p => ({
        player_id: p.player_id,
        final_chips: parseFloat(p.final_chips) || 0,
      }));

      const game = await createGame(
        parseFloat(chipValue) || 0,
        parseFloat(buyIn) || 0,
        playersData,
        notes.trim() || undefined
      );

      if (game) {
        router.push(`/partida/${game.id}`);
      } else {
        setError('Error al guardar la partida. Verifica la conexión.');
        setSaving(false);
      }
    } catch (err) {
      console.error('Error saving game:', err);
      setError('Error al guardar la partida.');
      setSaving(false);
    }
  };

  return (
    <>
      <Header />

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Nueva Partida
          </h1>
          <p className="text-foreground-muted mb-8">
            Configura los valores y selecciona a los jugadores
          </p>

          {/* Configuración de fichas */}
          <section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-accent" />
              Configuración de Fichas
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-foreground-muted mb-2">
                  Valor de cada ficha (€)
                </label>
                <NumberInput
                  value={chipValue}
                  onChange={setChipValue}
                  step={0.01}
                  min={0.01}
                  placeholder="0.05"
                  icon={<Euro className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-sm text-foreground-muted mb-2">
                  Fichas iniciales por jugador
                </label>
                <NumberInput
                  value={buyIn}
                  onChange={setBuyIn}
                  step={10}
                  min={1}
                  placeholder="100"
                  icon={<Calculator className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Info del bote */}
            {selectedPlayers.length > 0 && (
              <div className="mt-4 p-4 bg-background rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted">Bote total estimado:</span>
                  <span className="text-xl font-bold text-accent">{totalPot.toFixed(2)}€</span>
                </div>
                <p className="text-xs text-foreground-muted mt-1">
                  {selectedPlayers.length} jugadores × {buyIn} fichas × {chipValue}€/ficha
                </p>
              </div>
            )}
          </section>

          {/* Jugadores */}
          <section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Jugadores ({selectedPlayers.length})
              </h2>
            </div>

            {/* Selector de jugadores */}
            <div className="relative mb-4">
              <button
                type="button"
                onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}
                disabled={loadingPlayers}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-left flex items-center justify-between hover:border-primary/50 transition-colors"
              >
                <span className="text-foreground-muted flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Añadir jugador...
                </span>
                <ChevronDown className={`w-5 h-5 text-foreground-muted transition-transform ${showPlayerDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showPlayerDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background-card border border-border rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                  {unselectedPlayers.length === 0 ? (
                    <div className="p-4 text-center text-foreground-muted">
                      No hay más jugadores disponibles
                    </div>
                  ) : (
                    unselectedPlayers.map(player => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => addPlayerToGame(player)}
                        className="w-full px-4 py-3 text-left hover:bg-background flex items-center gap-3 transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: player.avatar_color }}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-foreground">{player.name}</span>
                      </button>
                    ))
                  )}
                  
                  {/* Crear nuevo jugador */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlayerDropdown(false);
                      setShowNewPlayerModal(true);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-background flex items-center gap-3 transition-colors border-t border-border text-primary"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Crear nuevo jugador</span>
                  </button>
                </div>
              )}
            </div>

            {/* Lista de jugadores seleccionados */}
            {selectedPlayers.length === 0 ? (
              <div className="text-center py-8 text-foreground-muted">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Selecciona al menos 2 jugadores para empezar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPlayers.map((gp, index) => {
                  const profit = calculateProfit(gp.final_chips);
                  const hasProfit = profit > 0;
                  const hasLoss = profit < 0;

                  return (
                    <div
                      key={gp.player_id}
                      className="bg-background rounded-xl p-4 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                          style={{ backgroundColor: gp.player.avatar_color }}
                        >
                          {gp.player.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Nombre y fichas */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {gp.player.name}
                          </p>
                          <div className="mt-2">
                            <label className="block text-xs text-foreground-muted mb-1">
                              Fichas finales
                            </label>
                            <NumberInput
                              value={gp.final_chips}
                              onChange={(val) => updateFinalChips(gp.player_id, val)}
                              step={10}
                              min={0}
                              placeholder="Ej: 150"
                              className="text-sm [&_input]:py-2"
                            />
                          </div>
                        </div>

                        {/* Resultado y eliminar */}
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            onClick={() => removePlayerFromGame(gp.player_id)}
                            className="p-2 text-foreground-muted hover:text-danger transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          
                          {gp.final_chips && (
                            <div className={`flex items-center gap-1 font-bold ${
                              hasProfit ? 'text-success' : hasLoss ? 'text-danger' : 'text-foreground-muted'
                            }`}>
                              {hasProfit && <TrendingUp className="w-4 h-4" />}
                              {hasLoss && <TrendingDown className="w-4 h-4" />}
                              <span>{hasProfit ? '+' : ''}{profit.toFixed(2)}€</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Balance indicator */}
            {allPlayersHaveData && (
              <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${
                isBalanced 
                  ? 'bg-success/10 text-success border border-success/30' 
                  : 'bg-danger/10 text-danger border border-danger/30'
              }`}>
                {isBalanced ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">¡El balance cuadra perfectamente!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Las fichas no cuadran: {totalFinalChips} vs {expectedTotalChips} esperadas
                    </span>
                  </>
                )}
              </div>
            )}
          </section>

          {/* Notas */}
          <section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Notas (opcional)
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground resize-none"
              rows={3}
              placeholder="Añade notas sobre la partida..."
            />
          </section>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl text-danger flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón guardar */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !allPlayersHaveData || !isBalanced}
            className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
              saving || !allPlayersHaveData || !isBalanced
                ? 'bg-border text-foreground-muted cursor-not-allowed'
                : 'btn-accent'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Partida
              </>
            )}
          </button>
        </div>
      </main>

      {/* Modal crear nuevo jugador */}
      {showNewPlayerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-2xl p-6 w-full max-w-md border border-border animate-slide-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Nuevo Jugador</h2>
              <button
                onClick={() => {
                  setShowNewPlayerModal(false);
                  setNewPlayerName('');
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

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewPlayerModal(false);
                  setNewPlayerName('');
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-border text-foreground-muted hover:bg-background transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePlayer}
                disabled={creatingPlayer || !newPlayerName.trim()}
                className="flex-1 btn-primary px-4 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creatingPlayer ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Crear y añadir
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
