"use client";

import {
  Check,
  Loader2,
  Palette,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { ChipBadge } from "./ChipDisplay";
import type { ChipDenomination, ChipSet } from "./types";
import {
  applyStandardDistribution,
  getDefaultColor,
  validateChipSet,
} from "./utils";

// Extended color palette for chips
const CHIP_COLORS = [
  "#FFFFFF", // White
  "#EF4444", // Red
  "#22C55E", // Green
  "#3B82F6", // Blue
  "#1F2937", // Black
  "#8B5CF6", // Purple
  "#FBBF24", // Gold
  "#F97316", // Orange
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#6366F1", // Indigo
];

interface ChipColorPickerProps {
  selected: string;
  onChange: (color: string) => void;
}

function ChipColorPicker({ selected, onChange }: ChipColorPickerProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CHIP_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`w-7 h-7 rounded-full transition-all border-2 ${
            selected === color
              ? "ring-2 ring-offset-2 ring-offset-background-card ring-primary scale-110 border-primary"
              : "hover:scale-110 border-border"
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

interface DenominationEditorProps {
  denomination: ChipDenomination;
  onUpdate: (updated: ChipDenomination) => void;
  onDelete: () => void;
  canDelete: boolean;
}

function DenominationEditor({
  denomination,
  onUpdate,
  onDelete,
  canDelete,
}: DenominationEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="bg-background rounded-xl p-3 border border-border">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Chip preview */}
        <ChipBadge
          value={denomination.value}
          color={denomination.color}
          size="sm"
        />

        {/* Value input */}
        <div className="flex-1 min-w-0">
          <label
            htmlFor="value"
            className="block text-xs text-foreground-muted mb-1"
          >
            Valor
          </label>
          <input
            id="value"
            type="number"
            value={denomination.value}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              onUpdate({ ...denomination, value: Math.max(1, value) });
            }}
            min={1}
            className="w-full px-2 py-1.5 rounded-lg bg-background-secondary border border-border text-foreground text-sm"
          />
        </div>

        {/* Quantity input */}
        <div className="flex-1 min-w-0">
          <label
            htmlFor="quantity"
            className="block text-xs text-foreground-muted mb-1"
          >
            Cantidad
          </label>
          <input
            id="quantity"
            type="number"
            value={denomination.quantity}
            onChange={(e) => {
              const quantity = parseInt(e.target.value) || 1;
              onUpdate({ ...denomination, quantity: Math.max(1, quantity) });
            }}
            min={1}
            className="w-full px-2 py-1.5 rounded-lg bg-background-secondary border border-border text-foreground text-sm"
          />
        </div>

        {/* Name input */}
        <div className="flex-1 min-w-0 hidden sm:block">
          <label
            htmlFor="name"
            className="block text-xs text-foreground-muted mb-1"
          >
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={denomination.name || ""}
            onChange={(e) =>
              onUpdate({ ...denomination, name: e.target.value })
            }
            placeholder="Opcional"
            className="w-full px-2 py-1.5 rounded-lg bg-background-secondary border border-border text-foreground text-sm"
          />
        </div>

        {/* Color picker toggle */}
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
            showColorPicker
              ? "bg-primary/20 text-primary"
              : "bg-background-secondary text-foreground-muted hover:text-foreground"
          }`}
          title="Cambiar color"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* Delete button */}
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          className="p-2 rounded-lg text-foreground-muted hover:text-danger hover:bg-danger/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          title={canDelete ? "Eliminar" : "Necesitas al menos una denominación"}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile name input */}
      <div className="mt-2 sm:hidden">
        <label
          htmlFor="name-mobile"
          className="block text-xs text-foreground-muted mb-1"
        >
          Nombre (opcional)
        </label>
        <input
          id="name-mobile"
          type="text"
          value={denomination.name || ""}
          onChange={(e) => onUpdate({ ...denomination, name: e.target.value })}
          placeholder="Ej: Blanca, Roja..."
          className="w-full px-2 py-1.5 rounded-lg bg-background-secondary border border-border text-foreground text-sm"
        />
      </div>

      {/* Color picker dropdown */}
      {showColorPicker && (
        <div className="mt-3 pt-3 border-t border-border animate-fade-in">
          <ChipColorPicker
            selected={denomination.color}
            onChange={(color) => {
              onUpdate({ ...denomination, color });
              setShowColorPicker(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

interface ChipSetEditorProps {
  chipSet: ChipSet;
  onSave: (chipSet: ChipSet) => Promise<void>;
  onCancel: () => void;
  isNew?: boolean;
}

export function ChipSetEditor({
  chipSet,
  onSave,
  onCancel,
  isNew = false,
}: ChipSetEditorProps) {
  const [editedSet, setEditedSet] = useState<ChipSet>({
    ...chipSet,
    is_preset: false,
  });
  const [newDenomValue, setNewDenomValue] = useState("");
  const [newDenomQuantity, setNewDenomQuantity] = useState("20");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const updateDenomination = (index: number, updated: ChipDenomination) => {
    const newDenoms = [...editedSet.denominations];
    newDenoms[index] = updated;
    setEditedSet({ ...editedSet, denominations: newDenoms });
  };

  const deleteDenomination = (index: number) => {
    const newDenoms = editedSet.denominations.filter((_, i) => i !== index);
    setEditedSet({ ...editedSet, denominations: newDenoms });
  };

  const addDenomination = () => {
    const value = parseInt(newDenomValue) || 100;
    const quantity = parseInt(newDenomQuantity) || 20;

    // Check if value already exists
    if (editedSet.denominations.some((d) => d.value === value)) {
      setErrors(["Ya existe una ficha con ese valor"]);
      return;
    }

    const newDenom: ChipDenomination = {
      value: Math.max(1, value),
      color: getDefaultColor(value),
      quantity: Math.max(1, quantity),
    };
    setEditedSet({
      ...editedSet,
      denominations: [...editedSet.denominations, newDenom].sort(
        (a, b) => a.value - b.value,
      ),
    });
    setNewDenomValue("");
    setNewDenomQuantity("20");
    setErrors([]);
  };

  const handleSave = async () => {
    const validation = validateChipSet(editedSet);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    setErrors([]);

    try {
      // Sort denominations by value before saving
      const sortedSet = {
        ...editedSet,
        denominations: [...editedSet.denominations].sort(
          (a, b) => a.value - b.value,
        ),
      };
      await onSave(sortedSet);
    } catch (err) {
      console.error("Error saving chip set:", err);
      setErrors(["Error al guardar el set de fichas"]);
    } finally {
      setSaving(false);
    }
  };

  // Calculate total chips and value
  const totalChips = editedSet.denominations.reduce(
    (sum, d) => sum + d.quantity,
    0,
  );
  const totalValue = editedSet.denominations.reduce(
    (sum, d) => sum + d.value * d.quantity,
    0,
  );

  // Check if standard distribution can be applied
  const canApplyStandard = totalChips === 300 || totalChips === 500;

  const handleApplyStandard = () => {
    const standardDenoms = applyStandardDistribution(editedSet.denominations);
    if (standardDenoms) {
      setEditedSet({
        ...editedSet,
        denominations: standardDenoms,
      });
      setErrors([]);
    }
  };

  return (
    <div className="bg-background-card rounded-2xl border border-border p-5 sm:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          {isNew ? "Nuevo Set de Fichas" : "Editar Set de Fichas"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-foreground-muted hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Set name */}
      <div className="mb-4">
        <label
          htmlFor="set-name"
          className="block text-sm text-foreground-muted mb-2"
        >
          Nombre del set
        </label>
        <input
          id="set-name"
          type="text"
          value={editedSet.name}
          onChange={(e) => setEditedSet({ ...editedSet, name: e.target.value })}
          placeholder="Ej: Mi set personalizado"
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </div>

      {/* Standard distribution button */}
      {canApplyStandard && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Distribución estándar disponible
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                Tu set tiene {totalChips} fichas. Aplica la distribución
                estándar para {totalChips} fichas.
              </p>
            </div>
            <button
              type="button"
              onClick={handleApplyStandard}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Aplicar estándar</span>
              <span className="sm:hidden">Aplicar</span>
            </button>
          </div>
        </div>
      )}

      {/* Denominations list */}
      <div className="mb-4">
        <label
          htmlFor="denominations-label"
          className="block text-sm text-foreground-muted mb-2"
        >
          Fichas ({editedSet.denominations.length} tipos, {totalChips} fichas
          totales)
        </label>
        <div
          id="denominations-label"
          className="space-y-2 max-h-72 overflow-y-auto"
        >
          {editedSet.denominations.map((denom, index) => (
            <DenominationEditor
              key={`${denom.value}-${index}`}
              denomination={denom}
              onUpdate={(updated) => updateDenomination(index, updated)}
              onDelete={() => deleteDenomination(index)}
              canDelete={editedSet.denominations.length > 1}
            />
          ))}
        </div>
      </div>

      {/* Add new denomination */}
      <div className="mb-4 p-3 bg-background rounded-xl border border-border">
        <p className="text-sm text-foreground-muted mb-2">Añadir nueva ficha</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              value={newDenomValue}
              onChange={(e) => setNewDenomValue(e.target.value)}
              placeholder="Valor"
              min={1}
              className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              value={newDenomQuantity}
              onChange={(e) => setNewDenomQuantity(e.target.value)}
              placeholder="Cantidad"
              min={1}
              className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
            />
          </div>
          <button
            type="button"
            onClick={addDenomination}
            className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Añadir</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4 p-3 bg-background rounded-xl border border-border">
        <div className="flex justify-between text-sm">
          <span className="text-foreground-muted">Valor total disponible:</span>
          <span className="font-bold text-accent">
            {totalValue.toLocaleString()} puntos
          </span>
        </div>
      </div>

      {/* Preview */}
      <div className="mb-6 p-4 bg-background rounded-xl border border-border">
        <p className="text-sm text-foreground-muted mb-3">Vista previa:</p>
        <div className="flex flex-wrap gap-3 justify-center">
          {editedSet.denominations.map((denom, index) => (
            <div key={denom.value} className="text-center">
              <ChipBadge value={denom.value} color={denom.color} size="md" />
              <p className="text-xs text-foreground-muted mt-1">
                ×{denom.quantity}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-xl">
          {errors.map((error) => (
            <p key={error} className="text-sm text-danger">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 px-4 py-3 rounded-xl border border-border text-foreground-muted hover:bg-background transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={
            saving ||
            !editedSet.name.trim() ||
            editedSet.denominations.length === 0
          }
          className="flex-1 btn-primary px-4 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              {isNew ? "Crear Set" : "Guardar Cambios"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ChipSetEditor;
