"use client";

import { Minus, Pencil, Plus } from "lucide-react";
import { useState } from "react";

interface QuickBuyInControlProps {
  baseEuros: number; // € que vale un buy-in base
  units: string; // nº de buy-ins como texto (admite decimales)
  onChange: (units: string) => void;
  // entry: botones que fijan la entrada (1×, 2×, otro), mínimo 1 buy-in
  // rebuy: botones que suman importes (+1×, +2×), mínimo 0
  variant: "entry" | "rebuy";
}

function parseUnits(value: string): number | null {
  const num = parseFloat((value || "").replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

function formatEuros(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2);
}

export default function QuickBuyInControl({
  baseEuros,
  units,
  onChange,
  variant,
}: QuickBuyInControlProps) {
  const [showFine, setShowFine] = useState(false);

  const floor = variant === "entry" ? 1 : 0;
  const current = parseUnits(units) ?? floor;
  const euros = current * baseEuros;
  const isCustom = variant === "entry" && current !== 1 && current !== 2;

  const setUnits = (value: number) => {
    const clamped = Math.max(variant === "entry" ? 0.1 : 0, value);
    onChange((Math.round(clamped * 100) / 100).toString());
  };

  const pill =
    "h-8 px-2 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center";
  const pillActive = "border-accent bg-accent/10 text-accent";
  const pillIdle =
    "border-border bg-background-secondary text-foreground-muted hover:text-foreground hover:border-accent/50";
  const iconPill =
    "w-8 h-8 rounded-lg bg-background-secondary border border-border flex items-center justify-center text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors flex-shrink-0";

  return (
    <div>
      <div className="flex items-center gap-1 flex-wrap">
        {variant === "entry" ? (
          <>
            <button
              type="button"
              onClick={() => setUnits(1)}
              className={`${pill} ${current === 1 ? pillActive : pillIdle}`}
            >
              {formatEuros(baseEuros)}€
            </button>
            <button
              type="button"
              onClick={() => setUnits(2)}
              className={`${pill} ${current === 2 ? pillActive : pillIdle}`}
            >
              {formatEuros(baseEuros * 2)}€
            </button>
            <button
              type="button"
              onClick={() => setShowFine(!showFine)}
              className={`${pill} ${isCustom ? pillActive : pillIdle} gap-1`}
              title="Otra cantidad"
            >
              {isCustom ? `${formatEuros(euros)}€` : "Otro"}
              <Pencil className="w-3 h-3" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setUnits(current - 1)}
              disabled={current <= 0}
              className={iconPill}
              title={`Quitar rebuy de ${formatEuros(baseEuros)}€`}
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setUnits(current + 1)}
              className={`${pill} ${pillIdle}`}
            >
              +{formatEuros(baseEuros)}€
            </button>
            <button
              type="button"
              onClick={() => setUnits(current + 2)}
              className={`${pill} ${pillIdle}`}
            >
              +{formatEuros(baseEuros * 2)}€
            </button>
            <button
              type="button"
              onClick={() => setShowFine(!showFine)}
              className={`${pill} ${showFine || current % 1 !== 0 ? pillActive : pillIdle} gap-1`}
              title="Ajustar a mano"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </>
        )}
      </div>

      {/* Ajuste fino: nº de buy-ins con decimales */}
      {showFine && (
        <div className="flex items-center gap-1 mt-1.5">
          <button
            type="button"
            onClick={() => setUnits(current - 1)}
            disabled={current <= floor}
            className={iconPill}
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="text"
            inputMode="decimal"
            value={units}
            onChange={(e) => {
              const val = e.target.value.replace(",", ".");
              if (val === "" || /^\d*\.?\d*$/.test(val)) {
                onChange(val);
              }
            }}
            onBlur={(e) => {
              const num = parseUnits(e.target.value);
              onChange(
                num !== null && num > 0 ? num.toString() : floor.toString(),
              );
            }}
            className="w-12 h-8 text-center font-bold text-foreground bg-background border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
          />
          <button
            type="button"
            onClick={() => setUnits(current + 1)}
            className={iconPill}
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-xs text-foreground-muted ml-1 whitespace-nowrap">
            buy-ins = {formatEuros(current * baseEuros)}€
          </span>
        </div>
      )}
    </div>
  );
}
