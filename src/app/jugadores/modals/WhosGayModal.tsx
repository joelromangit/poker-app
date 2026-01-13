"use client";

import { Rainbow, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getAvatarColor } from "@/lib/players";
import type { Player } from "@/types";

interface WhosGayModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
}

export function WhosGayModal({ isOpen, onClose, players }: WhosGayModalProps) {
  const [gayPlayer, setGayPlayer] = useState<Player | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Start spinning animation when modal opens
  useEffect(() => {
    if (isOpen && players.length > 0) {
      setIsSpinning(true);
      setGayPlayer(null);

      let count = 0;
      const maxCount = 15;
      const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * players.length);
        setGayPlayer(players[randomIndex]);
        count++;

        if (count >= maxCount) {
          clearInterval(interval);
          const finalIndex = Math.floor(Math.random() * players.length);
          setGayPlayer(players[finalIndex]);
          setIsSpinning(false);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isOpen, players]);

  const handlePlayAgain = () => {
    setIsSpinning(true);
    setGayPlayer(null);

    let count = 0;
    const maxCount = 15;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * players.length);
      setGayPlayer(players[randomIndex]);
      count++;

      if (count >= maxCount) {
        clearInterval(interval);
        const finalIndex = Math.floor(Math.random() * players.length);
        setGayPlayer(players[finalIndex]);
        setIsSpinning(false);
      }
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-background-card rounded-2xl p-8 w-full max-w-sm border border-border animate-slide-in text-center relative overflow-hidden">
        {/* Fondo con gradiente arcoíris animado */}
        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500" />

        <button
          type="button"
          onClick={onClose}
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
            <div
              className={`transition-all duration-200 ${
                isSpinning ? "scale-95 opacity-70" : "scale-100 opacity-100"
              }`}
            >
              {/* Avatar grande */}
              {gayPlayer.avatar_url ? (
                <img
                  src={gayPlayer.avatar_url}
                  alt={gayPlayer.name}
                  className={`w-24 h-24 rounded-full object-cover mx-auto mb-4 transition-transform ${
                    isSpinning
                      ? "animate-pulse"
                      : "animate-[wiggle_1s_ease-in-out_infinite]"
                  }`}
                  style={
                    !isSpinning
                      ? { animation: "wiggle 1s ease-in-out infinite" }
                      : {}
                  }
                />
              ) : (
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4 transition-transform ${
                    isSpinning ? "animate-pulse" : ""
                  }`}
                  style={{
                    backgroundColor: getAvatarColor(gayPlayer.avatar_color),
                    ...(!isSpinning
                      ? { animation: "wiggle 1s ease-in-out infinite" }
                      : {}),
                  }}
                >
                  {gayPlayer.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Nombre */}
              <p
                className={`text-3xl font-bold mb-2 ${
                  isSpinning
                    ? "text-foreground-muted"
                    : "text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
                }`}
              >
                {gayPlayer.name}
              </p>

              {!isSpinning && (
                <>
                  <p className="text-lg text-foreground-muted mb-4">
                    ¡Es gay! 🎉
                  </p>

                  {/* Confeti emoji */}
                  <div
                    className="text-4xl"
                    style={{ animation: "float 2s ease-in-out infinite" }}
                  >
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
              type="button"
              onClick={handlePlayAgain}
              className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              🎲 ¡Otra vez!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
