'use client';

import Header from '@/components/Header';
import ChipCalculator from './ChipCalculator';

export default function CalculadoraPage() {
  return (
    <>
      <Header />
      
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="animate-fade-in w-full">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Calculadora de Fichas
          </h1>
          <p className="text-foreground-muted mb-6">
            Calcula la distribución óptima de fichas para tu partida
          </p>

          <ChipCalculator />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-foreground-muted">
            Crispy maricón
          </p>
        </div>
      </footer>
    </>
  );
}

