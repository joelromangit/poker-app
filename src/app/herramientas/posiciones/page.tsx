"use client";

import Header from "@/components/Header";
import PositionTool from "./PositionTool";

export default function PosicionesPage() {
  return (
    <>
      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="animate-fade-in w-full">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Posiciones de Mesa
          </h1>
          <p className="text-foreground-muted mb-6">
            Selecciona jugadores, baraja el orden y asigna posiciones al
            instante.
          </p>

          <PositionTool />
        </div>
      </main>

      <footer className="border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-foreground-muted">Crispy maricón</p>
        </div>
      </footer>
    </>
  );
}
