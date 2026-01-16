"use client";

import { Calculator, Shuffle, Wrench } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";

// Define available tools
const tools = [
  {
    id: "calculadora",
    name: "Calculadora de Fichas",
    description:
      "Calcula la distribución óptima de fichas para tu partida según el número de jugadores",
    href: "/calculadora",
    icon: Calculator,
    color: "text-accent",
    bgColor: "bg-accent/20",
  },
  {
    id: "posiciones",
    name: "Posiciones de Mesa",
    description:
      "Baraja jugadores y asigna BTN, ciegas y posiciones en segundos",
    href: "/herramientas/posiciones",
    icon: Shuffle,
    color: "text-primary",
    bgColor: "bg-primary/20",
  },
  // Future tools can be added here
];

export default function HerramientasPage() {
  return (
    <>
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="animate-fade-in w-full">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Herramientas
            </h1>
          </div>
          <p className="text-foreground-muted mb-8 ml-13">
            Utilidades para gestionar tus partidas de poker
          </p>

          {/* Tools grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group bg-background-card rounded-2xl border border-border p-6 hover:border-primary/50 transition-all card-hover"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${tool.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`w-6 h-6 ${tool.color}`} />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {tool.name}
                  </h2>
                  <p className="text-sm text-foreground-muted">
                    {tool.description}
                  </p>
                </Link>
              );
            })}

            {/* Coming soon placeholder */}
            <div className="bg-background-card/50 rounded-2xl border border-border border-dashed p-6 opacity-60">
              <div className="w-12 h-12 rounded-xl bg-border flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h2 className="text-lg font-semibold text-foreground-muted mb-2">
                Más herramientas
              </h2>
              <p className="text-sm text-foreground-muted">
                Próximamente más utilidades para tus partidas
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-foreground-muted">Crispy maricón</p>
        </div>
      </footer>
    </>
  );
}
