"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export default function NumberInput({
  value,
  onChange,
  step = 1,
  min,
  max,
  placeholder,
  className = "",
  icon,
}: NumberInputProps) {
  // Determinar decimales basado en el step
  const decimals =
    step < 1 ? Math.max(2, String(step).split(".")[1]?.length || 0) : 0;

  const increment = () => {
    const current = parseFloat(value) || 0;
    const newValue = current + step;
    if (max === undefined || newValue <= max) {
      onChange(Number(newValue.toFixed(decimals)).toString());
    }
  };

  const decrement = () => {
    const current = parseFloat(value) || 0;
    const newValue = current - step;
    if (min === undefined || newValue >= min) {
      onChange(Number(newValue.toFixed(decimals)).toString());
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
          {icon}
        </div>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${icon ? "pl-10" : "pl-4"} pr-12 py-3 rounded-xl text-foreground bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all`}
        placeholder={placeholder}
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
        <button
          type="button"
          onClick={increment}
          className="w-8 h-5 flex items-center justify-center text-foreground-muted hover:text-primary hover:bg-primary/10 rounded-t transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={decrement}
          className="w-8 h-5 flex items-center justify-center text-foreground-muted hover:text-primary hover:bg-primary/10 rounded-b transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
