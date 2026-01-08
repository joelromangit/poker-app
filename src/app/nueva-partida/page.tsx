'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import NumberInput from '@/components/NumberInput';
import { createGame } from '@/lib/games';
import { getPlayers, createPlayer } from '@/lib/players';
import { Player, GameFormPlayer } from '@/types';
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
  Trash2,
  FileWarning,
  Calendar,
  Clock,
  Trophy,
  Banknote,
  Lock,
  Settings2
} from 'lucide-react';

// Game mode types
type GameMode = 'cash' | 'tournament';

// Cash game format types
type CashGameFormat = 'entry5' | 'entry10' | 'custom';

// Predefined cash game formats (100BB with easy-to-manage chip values)
const CASH_GAME_FORMATS = {
  entry5: {
    name: '5€ Entry',
    description: '100BB - SB 5, BB 10',
    chipValue: 0.005, // 5€ / 1000 chips
    buyIn: 1000,
    totalEntry: 5,
  },
  entry10: {
    name: '10€ Entry',
    description: '100BB - SB 5, BB 10',
    chipValue: 0.01, // 10€ / 1000 chips
    buyIn: 1000,
    totalEntry: 10,
  },
  custom: {
    name: 'Personalizado',
    description: 'Configura tus propios valores',
    chipValue: 0.01,
    buyIn: 1000,
    totalEntry: 10,
  },
};

// Clave para localStorage
const DRAFT_KEY = 'poker-draft-game';

// Interfaz para el borrador
interface GameDraft {
  gameName: string;
  chipValue: string;
  buyIn: string;
  players: Array<{
    player_id: string;
    final_chips: string;
    rebuys: string | number; // string para nuevo formato, number para compatibilidad
  }>;
  notes: string;
  gameDate: string;
  gameTime: string;
  savedAt: string;
  gameMode?: GameMode;
  cashGameFormat?: CashGameFormat;
}

// Función para guardar borrador
export function saveDraft(draft: Omit<GameDraft, 'savedAt'>) {
  if (typeof window === 'undefined') return;
  const draftWithTime: GameDraft = {
    ...draft,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draftWithTime));
}

// Función para obtener borrador
export function getDraft(): GameDraft | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(DRAFT_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

// Función para eliminar borrador
export function clearDraft() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRAFT_KEY);
}

// Función para verificar si hay borrador (exportada para usar en home)
export function hasDraft(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DRAFT_KEY) !== null;
}

export default function NuevaPartidaPage() {
  const router = useRouter();
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [draftLoaded, setDraftLoaded] = useState(false);
  
  const [gameName, setGameName] = useState('');
  const [chipValue, setChipValue] = useState('0.01');
  const [buyIn, setBuyIn] = useState('1000');
  const [selectedPlayers, setSelectedPlayers] = useState<GameFormPlayer[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  
  // Fecha y hora de la partida (se inicializa en useEffect para evitar hydration mismatch)
  const [gameDate, setGameDate] = useState('');
  const [gameTime, setGameTime] = useState('');

  // Game mode and format
  const [gameMode, setGameMode] = useState<GameMode>('cash');
  const [cashGameFormat, setCashGameFormat] = useState<CashGameFormat>('entry5');

  // Modal para nuevo jugador
  const [showNewPlayerModal, setShowNewPlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [creatingPlayer, setCreatingPlayer] = useState(false);

  // Dropdown de selección
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);

  // Cargar jugadores y borrador
  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoadingPlayers(true);
    const players = await getPlayers();
    setAvailablePlayers(players);
    setLoadingPlayers(false);

    // Establecer fecha y hora actual por defecto
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    // Cargar borrador después de tener los jugadores
    const draft = getDraft();
    if (draft && draft.players.length > 0) {
      setShowDraftBanner(true);
      // Restaurar valores
      setGameName(draft.gameName || '');
      setChipValue(draft.chipValue);
      setBuyIn(draft.buyIn);
      setNotes(draft.notes);
      setGameDate(draft.gameDate || currentDate);
      setGameTime(draft.gameTime || currentTime);
      setGameMode(draft.gameMode || 'cash');
      setCashGameFormat(draft.cashGameFormat || 'custom');
      
      // Restaurar jugadores (solo los que existen)
      const restoredPlayers: GameFormPlayer[] = [];
      for (const dp of draft.players) {
        const player = players.find(p => p.id === dp.player_id);
        if (player) {
          restoredPlayers.push({
            player_id: dp.player_id,
            player: player,
            final_chips: dp.final_chips,
            // Convertir a string si es número (compatibilidad con borradores viejos)
            rebuys: typeof dp.rebuys === 'number' ? dp.rebuys.toString() : dp.rebuys,
          });
        }
      }
      setSelectedPlayers(restoredPlayers);
    } else {
      // Si no hay borrador, usar fecha y hora actuales y formato por defecto
      setGameDate(currentDate);
      setGameTime(currentTime);
      // Set default format values
      const defaultFormat = CASH_GAME_FORMATS.entry5;
      setChipValue(defaultFormat.chipValue.toString());
      setBuyIn(defaultFormat.buyIn.toString());
    }
    setDraftLoaded(true);
  };

  // Guardar borrador automáticamente cuando cambian los datos
  useEffect(() => {
    if (!draftLoaded) return; // No guardar hasta que se haya cargado
    
    // Solo guardar si hay datos significativos
    const hasData = selectedPlayers.length > 0 || notes.trim() !== '';
    
    if (hasData) {
      saveDraft({
        gameName,
        chipValue,
        buyIn,
        players: selectedPlayers.map(p => ({
          player_id: p.player_id,
          final_chips: p.final_chips,
          rebuys: p.rebuys,
        })),
        notes,
        gameDate,
        gameTime,
        gameMode,
        cashGameFormat,
      });
    } else {
      // Si no hay datos, limpiar el borrador
      clearDraft();
    }
  }, [gameName, chipValue, buyIn, selectedPlayers, notes, gameDate, gameTime, gameMode, cashGameFormat, draftLoaded]);

  // Descartar borrador
  const handleDiscardDraft = () => {
    clearDraft();
    setGameName('');
    setGameMode('cash');
    setCashGameFormat('entry5');
    const defaultFormat = CASH_GAME_FORMATS.entry5;
    setChipValue(defaultFormat.chipValue.toString());
    setBuyIn(defaultFormat.buyIn.toString());
    setSelectedPlayers([]);
    setNotes('');
    // Establecer fecha y hora actuales
    const currentNow = new Date();
    setGameDate(currentNow.toISOString().split('T')[0]);
    setGameTime(currentNow.toTimeString().slice(0, 5));
    setShowDraftBanner(false);
  };

  // Handle cash game format change
  const handleFormatChange = (format: CashGameFormat) => {
    setCashGameFormat(format);
    if (format !== 'custom') {
      const formatConfig = CASH_GAME_FORMATS[format];
      setChipValue(formatConfig.chipValue.toString());
      setBuyIn(formatConfig.buyIn.toString());
    }
  };

  // Calculate total entry for custom mode
  const calculateCustomEntry = (): number => {
    const chips = parseFloat(buyIn) || 0;
    const value = parseFloat(chipValue) || 0;
    return chips * value;
  };

  // Jugadores no seleccionados aún
  const unselectedPlayers = availablePlayers.filter(
    p => !selectedPlayers.some(sp => sp.player_id === p.id)
  );

  // Añadir jugador a la partida (sin cerrar dropdown para multiselección)
  const addPlayerToGame = (player: Player, closeDropdown: boolean = false) => {
    setSelectedPlayers([...selectedPlayers, {
      player_id: player.id,
      player: player,
      final_chips: '',
      rebuys: '0',
    }]);
    if (closeDropdown) {
      setShowPlayerDropdown(false);
    }
  };

  // Toggle jugador (añadir o quitar)
  const togglePlayerInGame = (player: Player) => {
    const isSelected = selectedPlayers.some(sp => sp.player_id === player.id);
    if (isSelected) {
      removePlayerFromGame(player.id);
    } else {
      addPlayerToGame(player, false);
    }
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

    // Actualizar rebuys con delta (+1 o -1)
    const updateRebuys = (playerId: string, delta: number) => {
      setSelectedPlayers(selectedPlayers.map(p => {
        if (p.player_id === playerId) {
          const currentValue = parseFloat(p.rebuys) || 0;
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

  // Parsear rebuys de string a número
  const parseRebuys = (rebuys: string): number => {
    const normalized = rebuys.replace(',', '.');
    return parseFloat(normalized) || 0;
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
        rebuys: parseRebuys(p.rebuys),
      }));

      // Crear fecha combinando fecha y hora
      const gameDatetime = new Date(`${gameDate}T${gameTime}:00`);

      const game = await createGame(
        parseFloat(chipValue) || 0,
        parseFloat(buyIn) || 0,
        playersData,
        notes.trim() || undefined,
        gameDatetime,
        gameName.trim() || undefined
      );

      if (game) {
        // Limpiar borrador al guardar exitosamente
        clearDraft();
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

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="animate-fade-in w-full">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Nueva Partida
          </h1>
          <p className="text-foreground-muted mb-6">
            Configura los valores y selecciona a los jugadores
          </p>

          {/* Banner de borrador recuperado */}
          {showDraftBanner && (
            <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-center justify-between gap-4 animate-slide-in">
              <div className="flex items-center gap-3">
                <FileWarning className="w-5 h-5 text-warning flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Partida recuperada</p>
                  <p className="text-xs text-foreground-muted">Se ha restaurado tu partida anterior</p>
                </div>
              </div>
              <button
                onClick={handleDiscardDraft}
                className="flex items-center gap-1 text-sm text-foreground-muted hover:text-danger transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Descartar</span>
              </button>
            </div>
          )}

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

          {/* Game Mode Selection */}
          <section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              Modo de Juego
            </h2>

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Cash Game - Active */}
              <button
                type="button"
                onClick={() => setGameMode('cash')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  gameMode === 'cash'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Banknote className={`w-5 h-5 ${gameMode === 'cash' ? 'text-primary' : 'text-foreground-muted'}`} />
                  <span className={`font-semibold ${gameMode === 'cash' ? 'text-foreground' : 'text-foreground-muted'}`}>
                    Cash Game
                  </span>
                </div>
                <p className="text-xs text-foreground-muted">Partida con dinero real</p>
              </button>

              {/* Tournament - Disabled */}
              <button
                type="button"
                disabled
                className="p-4 rounded-xl border-2 border-border bg-background-secondary/50 text-left opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-5 h-5 text-foreground-muted" />
                  <span className="font-semibold text-foreground-muted">Torneo</span>
                  <Lock className="w-3 h-3 text-foreground-muted" />
                </div>
                <p className="text-xs text-foreground-muted">Proximamente</p>
              </button>
            </div>

            {/* Cash Game Format Selection */}
            {gameMode === 'cash' && (
              <>
                <h3 className="text-sm font-medium text-foreground mb-3">Formato de entrada</h3>
                <div className="flex gap-2 mb-4">
                  {/* 5€ Entry */}
                  <button
                    type="button"
                    onClick={() => handleFormatChange('entry5')}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                      cashGameFormat === 'entry5'
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <span className={`font-bold text-lg ${cashGameFormat === 'entry5' ? 'text-accent' : 'text-foreground'}`}>
                      5€
                    </span>
                    <p className="text-xs text-foreground-muted mt-0.5">100BB</p>
                  </button>

                  {/* 10€ Entry */}
                  <button
                    type="button"
                    onClick={() => handleFormatChange('entry10')}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                      cashGameFormat === 'entry10'
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <span className={`font-bold text-lg ${cashGameFormat === 'entry10' ? 'text-accent' : 'text-foreground'}`}>
                      10€
                    </span>
                    <p className="text-xs text-foreground-muted mt-0.5">100BB</p>
                  </button>

                  {/* Custom */}
                  <button
                    type="button"
                    onClick={() => handleFormatChange('custom')}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                      cashGameFormat === 'custom'
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <span className={`font-bold text-lg ${cashGameFormat === 'custom' ? 'text-accent' : 'text-foreground'}`}>
                      Custom
                    </span>
                    <p className="text-xs text-foreground-muted mt-0.5">Configura</p>
                  </button>
                </div>

                {/* Format Info or Custom Fields */}
                {cashGameFormat !== 'custom' ? (
                  <div className="p-4 bg-background rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground-muted">Entry:</span>
                      <span className="font-bold text-accent">{CASH_GAME_FORMATS[cashGameFormat].totalEntry}€</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground-muted">Fichas:</span>
                      <span className="font-medium text-foreground">{CASH_GAME_FORMATS[cashGameFormat].buyIn}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground-muted">Valor ficha:</span>
                      <span className="font-medium text-foreground">{CASH_GAME_FORMATS[cashGameFormat].chipValue}€</span>
                    </div>
                    <div className="text-xs text-foreground-muted pt-2 border-t border-border">
                      Small Blind: 5 fichas | Big Blind: 10 fichas
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-background rounded-xl border border-border">
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-foreground-muted mb-2">
                          Valor de cada ficha (€)
                        </label>
                        <NumberInput
                          value={chipValue}
                          onChange={setChipValue}
                          step={0.001}
                          min={0.001}
                          placeholder="0.01"
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
                          step={100}
                          min={1}
                          placeholder="1000"
                          icon={<Calculator className="w-4 h-4" />}
                        />
                      </div>
                    </div>

                    {/* Dynamic Total Calculation */}
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground-muted">Entry total calculado:</span>
                        <span className="font-bold text-lg text-accent">{calculateCustomEntry().toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Configuración de fichas - Only show pot info */}
          {selectedPlayers.length > 0 && (
            <section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-accent" />
                Bote en Juego
              </h2>

              <div className="p-4 bg-background rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted">Bote total:</span>
                  <span className="text-xl font-bold text-accent">{totalPot.toFixed(2)}€</span>
                </div>
                <p className="text-xs text-foreground-muted mt-1">
                  {expectedTotalChips} fichas en juego ({selectedPlayers.reduce((s, p) => s + parseRebuys(p.rebuys), 0)} rebuys)
                </p>
              </div>
            </section>
          )}

          {/* Jugadores */}
          <section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Jugadores ({selectedPlayers.length})
              </h2>
            </div>

            {/* Selector de jugadores - Multiselección */}
            <div className="relative mb-4">
              <button
                type="button"
                onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}
                disabled={loadingPlayers}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-left flex items-center justify-between hover:border-primary/50 transition-colors"
              >
                <span className="text-foreground-muted flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Seleccionar jugadores...
                </span>
                <ChevronDown className={`w-5 h-5 text-foreground-muted transition-transform ${showPlayerDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showPlayerDropdown && (
                <>
                  {/* Overlay para cerrar al hacer clic fuera */}
                  <div 
                    className="fixed inset-0 z-[5]" 
                    onClick={() => setShowPlayerDropdown(false)}
                  />
                  
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background-card border border-border rounded-xl shadow-lg z-10 max-h-72 overflow-y-auto">
                    {/* Header del dropdown */}
                    <div className="sticky top-0 bg-background-card border-b border-border p-3 flex items-center justify-between">
                      <span className="text-sm text-foreground-muted">
                        {selectedPlayers.length} seleccionados
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPlayerDropdown(false)}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        Listo
                      </button>
                    </div>

                    {availablePlayers.length === 0 ? (
                      <div className="p-4 text-center text-foreground-muted">
                        No hay jugadores registrados
                      </div>
                    ) : (
                      availablePlayers.map(player => {
                        const isSelected = selectedPlayers.some(sp => sp.player_id === player.id);
                        return (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => togglePlayerInGame(player)}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                              isSelected 
                                ? 'bg-primary/10 hover:bg-primary/20' 
                                : 'hover:bg-background'
                            }`}
                          >
                            {/* Checkbox visual */}
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected 
                                ? 'bg-primary border-primary' 
                                : 'border-border'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>

                            {player.avatar_url ? (
                              <img
                                src={player.avatar_url}
                                alt={player.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                style={{ backgroundColor: player.avatar_color }}
                              >
                                {player.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className={`flex-1 ${isSelected ? 'text-foreground font-medium' : 'text-foreground'}`}>
                              {player.name}
                            </span>
                          </button>
                        );
                      })
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
                      <div className="w-5 h-5" /> {/* Spacer para alineación */}
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Crear nuevo jugador</span>
                    </button>
                  </div>
                </>
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
                            alt={gp.player.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                            style={{ backgroundColor: gp.player.avatar_color }}
                          >
                            {gp.player.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Info del jugador */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground truncate">
                              {gp.player.name}
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
                                    // Al perder el foco, limpiar el valor (quitar puntos finales, etc.)
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
