"use client";

import { Shuffle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { positionsFor, seatAngles, shuffle } from "@/lib/positions";

// Jugador mínimo para el sorteo de sitios
export interface SeatDrawPlayer {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
}

interface SeatDrawModalProps {
  players: SeatDrawPlayer[];
  onClose: () => void;
}

interface SeatAssignment {
  player: SeatDrawPlayer;
  position: string;
}

// Modal de sorteo de sitios: baraja los jugadores de la partida y los pinta
// alrededor de la mesa con sus posiciones (BTN, ciegas...)
export default function SeatDrawModal({ players, onClose }: SeatDrawModalProps) {
  const [assignments, setAssignments] = useState<SeatAssignment[]>([]);

  const draw = () => {
    const positions = positionsFor(players.length);
    const shuffled = shuffle(players);
    setAssignments(
      positions.map((position, index) => ({
        player: shuffled[index],
        position,
      })),
    );
  };

  // Sortear directamente al abrir
  // biome-ignore lint/correctness/useExhaustiveDependencies: solo al montar
  useEffect(() => {
    draw();
  }, []);

  const angles = useMemo(() => seatAngles(assignments.length), [assignments]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-background-card border border-border rounded-t-2xl sm:rounded-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background-card border-b border-border p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            🎲 Sorteo de sitios
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-1 text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Mesa */}
          <div className="rounded-3xl border border-border/60 relative overflow-hidden px-4 py-8 bg-[radial-gradient(circle_at_top,#0f766e_0%,#134e4a_45%,#0b1f1f_100%)]">
            <div className="relative w-full aspect-[4/3]">
              <div className="absolute inset-4 rounded-[999px] border border-emerald-200/20 bg-emerald-950/30" />
              <div className="absolute inset-8 rounded-[999px] border border-emerald-100/10" />

              {assignments.map((seat, index) => {
                const angle = angles[index];
                const radius = assignments.length <= 4 ? 40 : 46;
                const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
                const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
                const isButton = seat.position.startsWith("BTN");

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
                      {seat.player.avatarUrl ? (
                        <img
                          src={seat.player.avatarUrl}
                          alt={seat.player.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-background shadow-lg"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base border-2 border-background shadow-lg"
                          style={{ backgroundColor: seat.player.color }}
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
            </div>
          </div>

          {/* Lista de asignaciones (fácil de leer en la mesa) */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {assignments.map((seat) => (
              <div
                key={seat.player.id}
                className="flex items-center gap-2 p-2 bg-background rounded-lg border border-border"
              >
                <span className="text-xs font-bold text-accent w-12 flex-shrink-0">
                  {seat.position}
                </span>
                <span className="text-sm font-medium text-foreground truncate">
                  {seat.player.name}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={draw}
            className="btn-primary w-full mt-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Shuffle className="w-5 h-5" />
            Volver a sortear
          </button>
        </div>
      </div>
    </div>
  );
}
