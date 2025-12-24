'use client';

import Link from 'next/link';
import { Spade } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background-secondary/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <Spade className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Poker Nights</h1>
              <p className="text-xs text-foreground-muted hidden sm:block">Gestión de partidas</p>
            </div>
          </Link>
          
          <nav className="flex items-center gap-2">
            <Link
              href="/nueva-partida"
              className="btn-primary px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2"
            >
              <span className="hidden sm:inline">Nueva Partida</span>
              <span className="sm:hidden">+ Nueva</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

