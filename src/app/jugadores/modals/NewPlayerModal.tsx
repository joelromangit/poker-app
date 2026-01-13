"use client";

import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { AVATAR_COLORS, ColorPicker } from "@/components/ColorPicker";

interface NewPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: ({ name, color }: { name: string; color: string }) => void;
  creating: boolean;
  error: string;
}

export function NewPlayerModal({
  isOpen,
  onClose,
  onSubmit,
  creating,
  error,
}: NewPlayerModalProps) {
  const [name, onNameChange] = useState("");
  const [color, onColorChange] = useState(AVATAR_COLORS[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-card rounded-2xl p-6 w-full max-w-md border border-border animate-slide-in max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Nuevo Jugador</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <label
            htmlFor="new-player-name"
            className="block text-sm text-foreground-muted mb-2"
          >
            Nombre del jugador
          </label>
          <input
            id="new-player-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit({ name, color })}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="Ej: Carlos"
            autoFocus
          />
        </div>

        <div className="mb-4">
          <span className="block text-sm text-foreground-muted mb-2">
            Color del avatar
          </span>
          <ColorPicker selected={color} onChange={onColorChange} />
        </div>

        {error && <p className="text-danger text-sm mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-border text-foreground-muted hover:bg-background transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSubmit({ name, color })}
            disabled={creating || !name.trim()}
            className="flex-1 btn-primary px-4 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Crear
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
