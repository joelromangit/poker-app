'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import NumberInput from '@/components/NumberInput';
import { createGame } from '@/lib/games';
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
  Calculator
} from 'lucide-react';

interface PlayerInput {
  id: string;
  name: string;
  finalChips: string;
}

let playerIdCounter = 10;

export default function NuevaPartidaPage() {
  const router = useRouter();
  const [chipValue, setChipValue] = useState('0.05');
  const [buyIn, setBuyIn] = useState('100');
  const [players, setPlayers] = useState<PlayerInput[]>([
    { id: 'p1', name: '', finalChips: '' },
    { id: 'p2', name: '', finalChips: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Añadir jugador
  function addPlayer() {
    playerIdCounter++;
    setPlayers([...players, { id: `p${playerIdCounter}`, name: '', finalChips: '' }]);
  }

  // Eliminar jugador
  function removePlayer(id: string) {
    setPlayers(players.filter(p => p.id !== id));
  }

  // Actualizar nombre
  function updateName(id: string, value: string) {
    setPlayers(players.map(p => p.id === id ? { ...p, name: value } : p));
  }

  // Actualizar fichas
  function updateChips(id: string, value: string) {
    setPlayers(players.map(p => p.id === id ? { ...p, finalChips: value } : p));
  }

  // Calcular ganancias/pérdidas
  function calculateProfit(finalChips: string): number {
    const chips = parseFloat(finalChips) || 0;
    const initial = parseFloat(buyIn) || 0;
    const value = parseFloat(chipValue) || 0;
    return (chips - initial) * value;
  }

  // Calcular bote total
  const totalPot = (parseFloat(buyIn) || 0) * (parseFloat(chipValue) || 0) * players.length;

  // Verificar balance
  const totalFinalChips = players.reduce((sum, p) => sum + (parseFloat(p.finalChips) || 0), 0);
  const expectedTotalChips = (parseFloat(buyIn) || 0) * players.length;
  const isBalanced = Math.abs(totalFinalChips - expectedTotalChips) < 0.01;
  const allPlayersHaveData = players.every(p => p.name.trim() !== '' && p.finalChips !== '');

  // Guardar partida
  async function handleSubmit() {
    setError('');
    
    if (!allPlayersHaveData) {
      setError('Todos los jugadores deben tener nombre y fichas finales');
      return;
    }

    if (!isBalanced) {
      setError(`El balance de fichas no cuadra: ${totalFinalChips} vs ${expectedTotalChips} esperadas`);
      return;
    }

    setSaving(true);

    try {
      const playersData = players.map(p => ({
        name: p.name.trim(),
        finalChips: parseFloat(p.finalChips) || 0,
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
  }

  return (
    <>
      <Header />

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Nueva Partida
          </h1>
          <p className="text-foreground-muted mb-8">
            Configura los valores y añade a los jugadores
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
            <div className="mt-4 p-4 bg-background rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Bote total estimado:</span>
                <span className="text-xl font-bold text-accent">{totalPot.toFixed(2)}€</span>
              </div>
              <p className="text-xs text-foreground-muted mt-1">
                {players.length} jugadores × {buyIn} fichas × {chipValue}€/ficha
              </p>
            </div>
          </section>

          {/* Jugadores */}
          <section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Jugadores ({players.length})
              </h2>
              <button
                type="button"
                onClick={addPlayer}
                className="btn-primary px-3 py-1.5 rounded-lg text-white text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Añadir
              </button>
            </div>

            <div className="space-y-3">
              {players.map((player, index) => {
                const profit = calculateProfit(player.finalChips);
                const hasProfit = profit > 0;
                const hasLoss = profit < 0;

                return (
                  <div
                    key={player.id}
                    className="bg-background rounded-xl p-4 border border-border"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>

                      <div className="flex-1 grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-foreground-muted mb-1">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={player.name}
                            onChange={(e) => updateName(player.id, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-foreground text-sm"
                            placeholder="Nombre del jugador"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-foreground-muted mb-1">
                            Fichas finales
                          </label>
                          <NumberInput
                            value={player.finalChips}
                            onChange={(val) => updateChips(player.id, val)}
                            step={10}
                            min={0}
                            placeholder="Ej: 150"
                            className="text-sm [&_input]:py-2"
                          />
                        </div>
                      </div>

                      {players.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removePlayer(player.id)}
                          className="p-2 text-foreground-muted hover:text-danger transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Resultado calculado */}
                    {player.finalChips && (
                      <div className={`mt-3 pt-3 border-t border-border flex items-center justify-end gap-2 ${
                        hasProfit ? 'text-success' : hasLoss ? 'text-danger' : 'text-foreground-muted'
                      }`}>
                        {hasProfit && <TrendingUp className="w-4 h-4" />}
                        {hasLoss && <TrendingDown className="w-4 h-4" />}
                        <span className="font-bold">
                          {hasProfit ? '+' : ''}{profit.toFixed(2)}€
                        </span>
                      </div>
                    )}
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

          {/* Botón guardar */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
              saving
                ? 'bg-border text-foreground-muted cursor-not-allowed'
                : allPlayersHaveData && isBalanced
                  ? 'btn-accent'
                  : 'bg-border text-foreground-muted hover:bg-border-hover'
            }`}
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
    </>
  );
}
