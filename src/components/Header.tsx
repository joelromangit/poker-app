"use client";

import { Plus, Spade, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import InstallPrompt from "./InstallPrompt";

export default function Header() {
  const pathname = usePathname();

  const navLinks = [{ href: "/jugadores", label: "Jugadores", icon: Users }];

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
              <h1 className="text-lg font-bold text-foreground">
                Poker Nights
              </h1>
              <p className="text-xs text-foreground-muted hidden sm:block">
                Gestión de partidas
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            {/* Botón de instalar PWA */}
            <InstallPrompt />

            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground-muted hover:text-foreground hover:bg-background"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}

            <Link
              href="/nueva-partida"
              className="btn-primary px-3 sm:px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Partida</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
