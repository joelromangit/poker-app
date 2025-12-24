'use client';

import Link from 'next/link';
import { Spade, Heart, Diamond, Club, Plus } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      {/* Iconos de cartas animados */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-background-card border border-border flex items-center justify-center animate-pulse" style={{ animationDelay: '0s' }}>
          <Spade className="w-6 h-6 text-foreground-muted" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-background-card border border-border flex items-center justify-center animate-pulse" style={{ animationDelay: '0.1s' }}>
          <Heart className="w-6 h-6 text-danger" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-background-card border border-border flex items-center justify-center animate-pulse" style={{ animationDelay: '0.2s' }}>
          <Diamond className="w-6 h-6 text-danger" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-background-card border border-border flex items-center justify-center animate-pulse" style={{ animationDelay: '0.3s' }}>
          <Club className="w-6 h-6 text-foreground-muted" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
        ¡Aún no hay partidas!
      </h2>
      <p className="text-foreground-muted text-center max-w-sm mb-8">
        Registra tu primera partida de poker y lleva el control de las ganancias y pérdidas con tus amigos.
      </p>

      <Link
        href="/nueva-partida"
        className="btn-primary px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2 animate-pulse-glow"
      >
        <Plus className="w-5 h-5" />
        Crear primera partida
      </Link>
    </div>
  );
}

