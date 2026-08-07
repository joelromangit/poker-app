"use client";

import { useState } from "react";
import {
  CARD_RANKS,
  CARD_SUITS,
  type Card,
  type CardRank,
  rankLabel,
  SUIT_BY_KEY,
} from "@/lib/cards";

// Carta pintada como mini naipe (baraja de 4 colores)
export function CardChip({
  card,
  size = "md",
}: {
  card: Card;
  size?: "sm" | "md";
}) {
  const rank = card[0] as CardRank;
  const suit = SUIT_BY_KEY.get(card[1] as "s" | "h" | "d" | "c");
  const sizeClass =
    size === "sm"
      ? "w-6 h-8 text-[10px] rounded"
      : "w-8 h-11 text-xs rounded-md";
  return (
    <span
      className={`${sizeClass} bg-white inline-flex flex-col items-center justify-center font-bold leading-none shadow-sm ${suit?.colorClass ?? ""}`}
    >
      <span>{rankLabel(rank)}</span>
      <span className={size === "sm" ? "text-[10px]" : "text-sm"}>
        {suit?.symbol}
      </span>
    </span>
  );
}

// Grupo de huecos de cartas (mano de un jugador o board)
export interface CardSlotGroup {
  key: string;
  label: string;
  max: number;
}

interface CardsInputProps {
  groups: CardSlotGroup[];
  // Cartas por grupo, en el mismo orden que groups
  value: Record<string, Card[]>;
  onChange: (next: Record<string, Card[]>) => void;
}

// Selector de cartas en dos toques (rango y palo), pensado para pulgar.
// Toca un hueco vacío para apuntar ahí; toca una carta puesta para quitarla.
export default function CardsInput({
  groups,
  value,
  onChange,
}: CardsInputProps) {
  const [pendingRank, setPendingRank] = useState<CardRank | null>(null);

  const usedCards = new Set<Card>(groups.flatMap((g) => value[g.key] ?? []));

  // El siguiente hueco a rellenar: primer grupo con espacio libre
  const targetGroup = groups.find((g) => (value[g.key] ?? []).length < g.max);

  const addCard = (card: Card) => {
    if (!targetGroup || usedCards.has(card)) return;
    onChange({
      ...value,
      [targetGroup.key]: [...(value[targetGroup.key] ?? []), card],
    });
    setPendingRank(null);
  };

  const removeCard = (groupKey: string, index: number) => {
    onChange({
      ...value,
      [groupKey]: (value[groupKey] ?? []).filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-3">
      {/* Huecos por grupo */}
      <div className="space-y-2">
        {groups.map((group) => {
          const cards = value[group.key] ?? [];
          const isTarget = targetGroup?.key === group.key;
          return (
            <div key={group.key} className="flex items-center gap-2">
              <span
                className={`text-xs w-24 flex-shrink-0 truncate ${
                  isTarget
                    ? "text-primary font-semibold"
                    : "text-foreground-muted"
                }`}
              >
                {group.label}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {cards.map((card, index) => (
                  <button
                    key={card}
                    type="button"
                    onClick={() => removeCard(group.key, index)}
                    title="Quitar carta"
                  >
                    <CardChip card={card} />
                  </button>
                ))}
                {Array.from({ length: group.max - cards.length }).map(
                  (_, i) => (
                    <span
                      key={`empty-${group.key}-${cards.length + i}`}
                      className={`w-8 h-11 rounded-md border-2 border-dashed inline-flex items-center justify-center text-foreground-muted text-xs ${
                        isTarget && i === 0
                          ? "border-primary text-primary animate-pulse"
                          : "border-border"
                      }`}
                    >
                      ?
                    </span>
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Teclado de cartas: primero el rango, luego el palo */}
      {targetGroup && (
        <div className="bg-background rounded-xl border border-border p-2 space-y-2">
          <div className="grid grid-cols-7 gap-1">
            {CARD_RANKS.map((rank) => (
              <button
                key={rank}
                type="button"
                onClick={() =>
                  setPendingRank(pendingRank === rank ? null : rank)
                }
                className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                  pendingRank === rank
                    ? "bg-primary text-white"
                    : "bg-background-card border border-border text-foreground hover:border-primary/50"
                }`}
              >
                {rankLabel(rank)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {CARD_SUITS.map((suit) => {
              const card = pendingRank
                ? (`${pendingRank}${suit.key}` as Card)
                : null;
              const disabled = !card || usedCards.has(card);
              return (
                <button
                  key={suit.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => card && addCard(card)}
                  className={`py-2 rounded-lg text-xl leading-none bg-white transition-opacity ${suit.colorClass} ${
                    disabled
                      ? "opacity-25 cursor-not-allowed"
                      : "hover:opacity-80"
                  }`}
                >
                  {suit.symbol}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-foreground-muted text-center">
            {pendingRank
              ? `Elige el palo para completar el ${rankLabel(pendingRank)} → ${targetGroup.label}`
              : `Elige rango y palo para ${targetGroup.label}`}
          </p>
        </div>
      )}
    </div>
  );
}
