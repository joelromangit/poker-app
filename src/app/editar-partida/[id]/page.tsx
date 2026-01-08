'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import NumberInput from '@/components/NumberInput';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getGameById, updateGame } from '@/lib/games';
import { getPlayers, createPlayer, getAvatarColor } from '@/lib/players';
import { Player, GameFormPlayer, Game } from '@/types';
import { 
  Plus, 
  Minus,
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
  UserPlus,
  RefreshCw,
  ArrowLeft,
  Calendar
} from 'lucide-react';

export default function EditarPartidaPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;

  const [game, setGame] = useState<Game | null>(null);
  const [loadingGame, setLoadingGame] = useState(true);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  
  const [gameName, setGameName] = useState('');
  const [chipValue, setChipValue] = useState('0.01');
  const [buyIn, setBuyIn] = useState('1000');
  const [selectedPlayers, setSelectedPlayers] = useState<GameFormPlayer[]>([]);
  const [notes, setNotes] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [gameTime, setGameTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Modal para nuevo jugador
  const [showNewPlayerModal, setShowNewPlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [creatingPlayer, setCreatingPlayer] = useState(false);

  // Dropdown de selección
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);

  // Cargar partida y jugadores
  useEffect(() => {
    loadData();
  }, [gameId]);

  const loadData = async () => {
    setLoadingGame(true);
    setLoadingPlayers(true);

    // Cargar jugadores disponibles
    const players = await getPlayers();
    setAvailablePlayers(players);
    setLoadingPlayers(false);

    // Cargar partida existente
    const gameData = await getGameById(gameId);
    if (gameData) {
      setGame(gameData);
      setGameName(gameData.name || '');
      setChipValue(gameData.chip_value.toString());
      setBuyIn(gameData.buy_in.toString());
      setNotes(gameData.notes || '');
      
      // Cargar fecha y hora de la partida
      const existingDate = new Date(gameData.created_at);
      setGameDate(existingDate.toISOString().split('T')[0]);
      setGameTime(existingDate.toTimeString().slice(0, 5));
      
      // Mapear jugadores de la partida al formato del formulario
      const formPlayers: GameFormPlayer[] = gameData.game_players
        .map(gp => ({
          player_id: gp.player_id,
          player: gp.player,
          final_chips: gp.final_chips.toString(),
          rebuys: (gp.rebuys || 0).toString(),
        }));
      setSelectedPlayers(formPlayers);
    }
    setLoadingGame(false);
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
      rebuys: '0',
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

  // Parsear rebuys de string a número
  const parseRebuys = (rebuys: string): number => {
    const normalized = rebuys.replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  // Actualizar rebuys con delta (+1 o -1)
  const updateRebuys = (playerId: string, delta: number) => {
    setSelectedPlayers(selectedPlayers.map(p => {
      if (p.player_id === playerId) {
        const currentValue = parseRebuys(p.rebuys);
        const newRebuys = Math.max(0, Math.round((currentValue + delta) * 10) / 10);
        return { ...p, rebuys: newRebuys.toString() };
      }
      return p;
    }));
  };

  // Establecer rebuys directamente (para input manual)
  const setRebuysDirectly = (playerId: string, value: string) => {
    setSelectedPlayers(selectedPlayers.map(p => {
      if (p.player_id === playerId) {
        return { ...p, rebuys: value };
      }
      return p;
    }));
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

  // Calcular fichas totales compradas por un jugador (buy-in + rebuys)
  const getTotalChipsBought = (rebuys: string): number => {
    const initial = parseFloat(buyIn) || 0;
    return initial * (1 + parseRebuys(rebuys));
  };

  // Calcular ganancias/pérdidas (considerando rebuys)
  const calculateProfit = (finalChips: string, rebuys: string): number => {
    const chips = parseFloat(finalChips) || 0;
    const totalBought = getTotalChipsBought(rebuys);
    const value = parseFloat(chipValue) || 0;
    return (chips - totalBought) * value;
  };

  // Calcular inversión total de un jugador en €
  const calculateInvestment = (rebuys: string): number => {
    const totalBought = getTotalChipsBought(rebuys);
    const value = parseFloat(chipValue) || 0;
    return totalBought * value;
  };

  // Calcular bote total (considerando rebuys de todos)
  const totalPot = selectedPlayers.reduce((sum, p) => {
    return sum + calculateInvestment(p.rebuys);
  }, 0);

  // Verificar balance (considerando rebuys)
  const totalFinalChips = selectedPlayers.reduce((sum, p) => sum + (parseFloat(p.final_chips) || 0), 0);
  const expectedTotalChips = selectedPlayers.reduce((sum, p) => sum + getTotalChipsBought(p.rebuys), 0);
  const isBalanced = Math.abs(totalFinalChips - expectedTotalChips) < 0.01;
  const allPlayersHaveData = selectedPlayers.length >= 2 && 
    selectedPlayers.every(p => p.final_chips !== '' && parseFloat(p.final_chips) >= 0);

  // Guardar cambios
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
        rebuys: parseRebuys(p.rebuys),
      }));

      // Crear fecha combinando fecha y hora
      const gameDatetime = new Date(`${gameDate}T${gameTime}:00`);

      const updatedGame = await updateGame(
        gameId,
        parseFloat(chipValue) || 0,
        parseFloat(buyIn) || 0,
        playersData,
        notes.trim() || undefined,
        gameDatetime,
        gameName.trim() || undefined
      );

      if (updatedGame) {
        router.push(`/partida/${gameId}`);
      } else {
        setError('Error al guardar los cambios. Verifica la conexión.');
        setSaving(false);
      }
    } catch (err) {
      console.error('Error updating game:', err);
      setError('Error al guardar los cambios.');
      setSaving(false);
    }
  };

  if (loadingGame) {
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

  return (
    <>
      <Header />

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Back button */}
        <Link
          href={`/partida/${gameId}`}
          className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la partida</span>
        </Link>

        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Editar Partida
          </h1>
          <p className="text-foreground-muted mb-6">
            Modifica los valores de la partida
          </p>

          {/* Nombre y fecha de la partida */}
          <section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Información de la Partida
            </h2>

            {/* Nombre de la partida */}
            <div className="mb-4">
              <label className="block text-sm text-foreground-muted mb-2">
                Nombre de la partida (opcional)
              </label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Ej: Andorra 2022, Nochevieja..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-foreground-muted mb-2">
                  Fecha de la partida
                </label>
                <input
                  type="date"
                  value={gameDate}
                  onChange={(e) => setGameDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none appearance-none min-w-0 box-border"
                />
              </div>

              <div>
                <label className="block text-sm text-foreground-muted mb-2">
                  Hora de la partida
                </label>
                <input
                  type="time"
                  value={gameTime}
                  onChange={(e) => setGameTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none appearance-none min-w-0 box-border"
                />
              </div>
            </div>
          </section>

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
                  Fichas por buy-in
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
                  <span className="text-foreground-muted">Bote total:</span>
                  <span className="text-xl font-bold text-accent">{totalPot.toFixed(2)}€</span>
                </div>
                <p className="text-xs text-foreground-muted mt-1">
                  {expectedTotalChips} fichas en juego ({selectedPlayers.reduce((s, p) => s + parseRebuys(p.rebuys), 0)} rebuys)
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
                        {player.avatar_url ? (
                          <img
                            src={player.avatar_url}
                            alt={player.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: getAvatarColor(player.avatar_color) }}
                          >
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                        )}
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
            <div className="space-y-3">
              {selectedPlayers.map((gp) => {
                const profit = calculateProfit(gp.final_chips, gp.rebuys);
                const hasProfit = profit > 0;
                const hasLoss = profit < 0;
                const totalChips = getTotalChipsBought(gp.rebuys);
                const investment = calculateInvestment(gp.rebuys);

                return (
                  <div
                    key={gp.player_id}
                    className="bg-background rounded-xl p-4 border border-border"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      {gp.player.avatar_url ? (
                        <img
                          src={gp.player.avatar_url}
                          alt={gp.player.name || ''}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                          style={{ backgroundColor: getAvatarColor(gp.player.avatar_color) }}
                        >
                          {gp.player.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}

                      {/* Info del jugador */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground truncate">
                            {gp.player.name || 'Jugador desconocido'}
                          </p>
                          <button
                            type="button"
                            onClick={() => removePlayerFromGame(gp.player_id)}
                            className="p-1 text-foreground-muted hover:text-danger transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Rebuys y Fichas finales */}
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {/* Rebuys */}
                          <div>
                            <label className="block text-xs text-foreground-muted mb-1 flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" />
                              Rebuys
                            </label>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => updateRebuys(gp.player_id, -1)}
                                disabled={parseRebuys(gp.rebuys) <= 0}
                                className="w-8 h-8 rounded-lg bg-background-secondary border border-border flex items-center justify-center text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={gp.rebuys}
                                onChange={(e) => {
                                  const val = e.target.value.replace(',', '.');
                                  // Permitir string vacío, números, y números con punto decimal
                                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                    setRebuysDirectly(gp.player_id, val === '' ? '0' : val);
                                  }
                                }}
                                onBlur={(e) => {
                                  // Al perder el foco, limpiar el valor
                                  const num = parseRebuys(e.target.value);
                                  setRebuysDirectly(gp.player_id, Math.max(0, num).toString());
                                }}
                                className="w-12 h-8 text-center font-bold text-foreground bg-background border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => updateRebuys(gp.player_id, 1)}
                                className="w-8 h-8 rounded-lg bg-background-secondary border border-border flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Fichas finales */}
                          <div>
                            <label className="block text-xs text-foreground-muted mb-1">
                              Fichas finales
                            </label>
                            <NumberInput
                              value={gp.final_chips}
                              onChange={(val) => updateFinalChips(gp.player_id, val)}
                              step={10}
                              min={0}
                              placeholder={`${totalChips}`}
                              className="text-sm [&_input]:py-1.5"
                            />
                          </div>
                        </div>

                        {/* Info de inversión y resultado */}
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-foreground-muted">
                            Inversión: {totalChips} fichas ({investment.toFixed(2)}€)
                          </span>
                          {gp.final_chips && (
                            <span className={`font-bold ${
                              hasProfit ? 'text-success' : hasLoss ? 'text-danger' : 'text-foreground-muted'
                            }`}>
                              {hasProfit && <TrendingUp className="w-3 h-3 inline mr-1" />}
                              {hasLoss && <TrendingDown className="w-3 h-3 inline mr-1" />}
                              {hasProfit ? '+' : ''}{profit.toFixed(2)}€
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

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

          {/* Botones de acción */}
          <div className="flex gap-3">
            <Link
              href={`/partida/${gameId}`}
              className="flex-1 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 bg-background border border-border text-foreground-muted hover:bg-background-secondary transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !allPlayersHaveData || !isBalanced}
              className={`flex-1 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
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
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
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

