"use client";

import { Loader2, Shuffle, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAvatarColor, getPlayers } from "@/lib/players";
import type { Player } from "@/types";

type SeatAssignment = {
  player: Player;
  position: string;
};

const POSITION_SETS: Record<number, string[]> = {
  3: ["BTN", "SB", "BB"],
  4: ["BTN", "SB", "BB", "UTG"],
  5: ["BTN", "SB", "BB", "UTG", "CO"],
  6: ["BTN", "SB", "BB", "UTG", "MP", "CO"],
  7: ["BTN", "SB", "BB", "UTG", "MP", "HJ", "CO"],
  8: ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "HJ", "CO"],
  9: ["BTN", "SB", "BB", "UTG", "UTG+1", "UTG+2", "MP", "HJ", "CO"],
};

const FALLBACK_POSITIONS = [
  "BTN",
  "SB",
  "BB",
  "UTG",
  "UTG+1",
  "UTG+2",
  "MP",
  "MP+1",
  "HJ",
  "CO",
];

const seatAngles = (count: number) =>
  Array.from({ length: count }, (_, index) => (360 / count) * index - 90);

const shuffle = <T,>(items: T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export default function PositionTool() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState<SeatAssignment[]>([]);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    const data = await getPlayers();
    setPlayers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const selectedPlayers = useMemo(
    () => players.filter((player) => selectedIds.has(player.id)),
    [players, selectedIds],
  );

  const canAssign = selectedPlayers.length >= 3;

  const togglePlayer = (playerId: string) => {
    setAssignments([]);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setAssignments([]);
    setSelectedIds(new Set(players.map((player) => player.id)));
  };

  const handleClear = () => {
    setAssignments([]);
    setSelectedIds(new Set());
  };

  const handleAssignPositions = () => {
    if (!canAssign) return;
    const positions =
      POSITION_SETS[selectedPlayers.length] ||
      FALLBACK_POSITIONS.slice(0, selectedPlayers.length);
    const shuffled = shuffle(selectedPlayers);

    const nextAssignments = positions.map((position, index) => ({
      player: shuffled[index],
      position,
    }));

    setAssignments(nextAssignments);
  };

  const seatPositions = useMemo(
    () => seatAngles(assignments.length || selectedPlayers.length || 1),
    [assignments.length, selectedPlayers.length],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <section className="bg-background-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Jugadores</h2>
            <p className="text-sm text-foreground-muted">
              Elige al menos 3 jugadores
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
            <p className="text-foreground-muted">No hay jugadores activos.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-background border border-border text-foreground-muted hover:text-foreground transition-colors"
              >
                Seleccionar todos
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-background border border-border text-foreground-muted hover:text-foreground transition-colors"
              >
                Limpiar
              </button>
              {!canAssign && selectedIds.size > 0 && (
                <span className="text-xs text-warning">
                  Selecciona al menos 3 jugadores.
                </span>
              )}
            </div>

            <div className="grid gap-3 max-h-[360px] overflow-y-auto pr-1">
              {players.map((player) => {
                const isSelected = selectedIds.has(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player.id)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt={player.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                        style={{
                          backgroundColor: getAvatarColor(player.avatar_color),
                        }}
                      >
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-foreground">
                        {player.name}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        Click para {isSelected ? "quitar" : "añadir"}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? "bg-primary text-white border-primary"
                          : "border-border text-foreground-muted"
                      }`}
                    >
                      {isSelected ? "✓" : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-5 pt-5 border-t border-border flex flex-col sm:flex-row gap-3 sm:items-center">
          <button
            type="button"
            onClick={handleAssignPositions}
            disabled={!canAssign}
            className={`btn-primary px-4 py-2 rounded-xl inline-flex items-center justify-center text-center gap-2 ${
              !canAssign ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>Randomizar posiciones</span>
          </button>
          <span className="text-xs text-foreground-muted">
            {selectedPlayers.length} jugadores seleccionados
          </span>
        </div>
      </section>

      <section className="bg-background-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Mesa</h2>
            <p className="text-sm text-foreground-muted">
              {assignments.length === 0
                ? "Baraja para ver las posiciones asignadas."
                : "Distribución actual de posiciones."}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 relative overflow-hidden px-4 py-8 sm:py-10 bg-[radial-gradient(circle_at_top,#0f766e_0%,#134e4a_45%,#0b1f1f_100%)]">
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10]">
            <div className="absolute inset-4 sm:inset-6 rounded-[999px] border border-emerald-200/20 bg-emerald-950/30" />
            <div className="absolute inset-8 sm:inset-10 rounded-[999px] border border-emerald-100/10" />

            {selectedPlayers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                <p className="text-sm text-emerald-50/70">
                  Selecciona jugadores para mostrar los asientos.
                </p>
              </div>
            )}

            {assignments.map((seat, index) => {
              const angle = seatPositions[index];
              const radius = assignments.length <= 4 ? 40 : 46;
              const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
              const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
              const isButton = seat.position === "BTN";

              return (
                <div
                  key={seat.player.id}
                  className="absolute flex flex-col items-center gap-1"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="relative">
                    {seat.player.avatar_url ? (
                      <img
                        src={seat.player.avatar_url}
                        alt={seat.player.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-background shadow-lg"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg border-2 border-background shadow-lg"
                        style={{
                          backgroundColor: getAvatarColor(
                            seat.player.avatar_color,
                          ),
                        }}
                      >
                        {seat.player.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isButton && (
                      <span className="absolute -right-2 -bottom-1 w-6 h-6 rounded-full bg-accent text-black text-xs font-bold flex items-center justify-center border border-white shadow">
                        D
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-emerald-50 font-semibold text-center max-w-[90px] truncate">
                    {seat.player.name}
                  </span>
                  <span className="text-xs text-emerald-100/70">
                    {seat.position}
                  </span>
                </div>
              );
            })}

            {assignments.length === 0 && selectedPlayers.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                <p className="text-sm text-emerald-50/70">
                  Baraja para mostrar las posiciones en la mesa.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
