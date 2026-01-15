"use client";

import {
  AlertCircle,
  AlertTriangle,
  Calculator,
  Check,
  ChevronDown,
  Coins,
  Copy,
  Loader2,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import NumberInput from "@/components/NumberInput";
import { deleteChipSet, getChipSets } from "@/lib/chipSets";
import { DistributionDisplay } from "./ChipDisplay";
import type { ChipSet, DistributionResult } from "./types";
import {
  calculateDistribution,
  checkDistributionFeasibility,
  formatDistributionForClipboard,
} from "./utils";

export function ChipCalculator() {
  const router = useRouter();

  // State
  const [playerCount, setPlayerCount] = useState("4");
  const [chipsPerPlayer, setChipsPerPlayer] = useState("1000");
  const [chipSets, setChipSets] = useState<ChipSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [showSetDropdown, setShowSetDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load chip sets from database on mount
  useEffect(() => {
    async function loadChipSets() {
      setLoading(true);
      const sets = await getChipSets();
      setChipSets(sets);
      setLoading(false);
    }
    loadChipSets();
  }, []);

  // Set default selection when chip sets are loaded
  useEffect(() => {
    if (chipSets.length > 0 && !selectedSetId) {
      setSelectedSetId(chipSets[0].id);
    }
  }, [chipSets, selectedSetId]);

  // Reload chip sets when component becomes visible (user navigated back)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const sets = await getChipSets();
        setChipSets(sets);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Get current chip set
  const currentSet =
    chipSets.find((s) => s.id === selectedSetId) || chipSets[0];

  // Calculate distribution and feasibility warning using useMemo
  const players = parseInt(playerCount) || 2;
  const chips = parseInt(chipsPerPlayer) || 1000;

  const feasibilityWarning = useMemo(() => {
    if (
      !currentSet ||
      players < 2 ||
      chips <= 0 ||
      currentSet.denominations.length === 0
    ) {
      return null;
    }

    const feasibility = checkDistributionFeasibility({
      denominations: currentSet.denominations,
      targetValuePerPlayer: chips,
      playerCount: players,
    });

    return feasibility.feasible ? null : feasibility.message;
  }, [currentSet, chips, players]);

  const result = useMemo<DistributionResult | null>(() => {
    if (
      !currentSet ||
      players < 2 ||
      chips <= 0 ||
      currentSet.denominations.length === 0
    ) {
      return null;
    }

    return calculateDistribution({
      denominations: currentSet.denominations,
      targetValuePerPlayer: chips,
      playerCount: players,
    });
  }, [currentSet, chips, players]);

  // Copy to clipboard
  const handleCopy = async () => {
    if (!result || !currentSet) return;

    const text = formatDistributionForClipboard({
      result,
      playerCount: parseInt(playerCount) || 2,
      chipSet: currentSet,
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Delete chip set from database
  const handleDeleteSet = async (setId: string) => {
    const setToDelete = chipSets.find((s) => s.id === setId);
    if (setToDelete?.is_preset) return; // Can't delete presets

    const success = await deleteChipSet(setId);
    if (success) {
      setChipSets((prev) => prev.filter((s) => s.id !== setId));
      if (selectedSetId === setId && chipSets.length > 1) {
        const remaining = chipSets.filter((s) => s.id !== setId);
        setSelectedSetId(remaining[0]?.id || "");
      }
    }
  };

  // Edit chip set
  const handleEditSet = (chipSet: ChipSet) => {
    router.push(`/calculadora/editor?chipset=${chipSet.id}`);
    setShowSetDropdown(false);
  };

  // New chip set
  const handleNewSet = () => {
    router.push("/calculadora/editor");
    setShowSetDropdown(false);
  };

  // New standard 300 chip set
  const handleNewStandard300 = () => {
    router.push("/calculadora/editor?preset=standard-300");
    setShowSetDropdown(false);
  };

  // New standard 500 chip set
  const handleNewStandard500 = () => {
    router.push("/calculadora/editor?preset=standard-500");
    setShowSetDropdown(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main calculator */}

      {/* Chip Set Selection */}
      <section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          Set de Fichas
        </h2>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSetDropdown(!showSetDropdown)}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-left flex items-center justify-between hover:border-primary/50 transition-colors"
          >
            {currentSet ? (
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1">
                  {currentSet.denominations.slice(0, 4).map((d) => (
                    <div
                      key={`preview-${d.value}`}
                      className="w-6 h-6 rounded-full border-2 border-background"
                      style={{ backgroundColor: d.color }}
                    />
                  ))}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {currentSet.name}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {currentSet.denominations
                      .map((d) => `${d.quantity}×${d.value}`)
                      .join(", ")}
                  </p>
                </div>
              </div>
            ) : (
              <span className="text-foreground-muted">
                Selecciona un set de fichas
              </span>
            )}
            <ChevronDown
              className={`w-5 h-5 text-foreground-muted transition-transform ${
                showSetDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {showSetDropdown && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-[5] cursor-default"
                onClick={() => setShowSetDropdown(false)}
                aria-label="Cerrar menú"
              />
              <div className="absolute top-full left-0 right-0 mt-2 bg-background-card border border-border rounded-xl shadow-lg z-10 max-h-80 overflow-y-auto">
                {/* Preset sets */}
                {chipSets.some((s) => s.is_preset) && (
                  <div className="p-2 border-b border-border">
                    <p className="text-xs text-foreground-muted px-2 py-1">
                      Sets predefinidos
                    </p>
                    {chipSets
                      .filter((s) => s.is_preset)
                      .map((set) => (
                        <SetOption
                          key={set.id}
                          set={set}
                          isSelected={selectedSetId === set.id}
                          onSelect={() => {
                            setSelectedSetId(set.id);
                            setShowSetDropdown(false);
                          }}
                          onEdit={() => handleEditSet(set)}
                          onDelete={() => {}}
                          canDelete={false}
                        />
                      ))}
                  </div>
                )}

                {/* Custom sets */}
                {chipSets.some((s) => !s.is_preset) && (
                  <div className="p-2 border-b border-border">
                    <p className="text-xs text-foreground-muted px-2 py-1">
                      Mis sets personalizados
                    </p>
                    {chipSets
                      .filter((s) => !s.is_preset)
                      .map((set) => (
                        <SetOption
                          key={set.id}
                          set={set}
                          isSelected={selectedSetId === set.id}
                          onSelect={() => {
                            setSelectedSetId(set.id);
                            setShowSetDropdown(false);
                          }}
                          onEdit={() => handleEditSet(set)}
                          onDelete={() => handleDeleteSet(set.id)}
                          canDelete={true}
                        />
                      ))}
                  </div>
                )}

                {/* Create new */}
                <div className="p-2 space-y-1">
                  <p className="text-xs text-foreground-muted px-2 py-1">
                    Crear nuevo set
                  </p>
                  <button
                    type="button"
                    onClick={handleNewStandard300}
                    className="w-full px-3 py-2.5 rounded-lg text-left hover:bg-background flex items-center gap-3 text-primary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium block">
                        Set Estándar 300 Fichas
                      </span>
                      <span className="text-xs text-foreground-muted">
                        Distribución estándar
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handleNewStandard500}
                    className="w-full px-3 py-2.5 rounded-lg text-left hover:bg-background flex items-center gap-3 text-primary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium block">
                        Set Estándar 500 Fichas
                      </span>
                      <span className="text-xs text-foreground-muted">
                        Distribución estándar
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handleNewSet}
                    className="w-full px-3 py-2.5 rounded-lg text-left hover:bg-background flex items-center gap-3 text-foreground-muted hover:text-foreground transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Set personalizado</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Chip set summary */}
        {currentSet && (
          <div className="mt-4 p-3 bg-background rounded-xl border border-border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-foreground-muted">Fichas totales:</span>
                <span className="ml-2 font-medium text-foreground">
                  {currentSet.denominations.reduce(
                    (sum, d) => sum + d.quantity,
                    0,
                  )}
                </span>
              </div>
              <div>
                <span className="text-foreground-muted">Valor total:</span>
                <span className="ml-2 font-medium text-accent">
                  {currentSet.denominations
                    .reduce((sum, d) => sum + d.value * d.quantity, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Calculator inputs */}
      <section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-accent" />
          Calcular Distribución
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="playerCount"
              className="block text-sm text-foreground-muted mb-2 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Número de jugadores
            </label>
            <NumberInput
              id="playerCount"
              value={playerCount}
              onChange={setPlayerCount}
              min={2}
              max={20}
              step={1}
              placeholder="4"
            />
          </div>

          <div>
            <label
              htmlFor="chipsPerPlayer"
              className="block text-sm text-foreground-muted mb-2 flex items-center gap-2"
            >
              <Coins className="w-4 h-4" />
              Puntos por jugador
            </label>
            <NumberInput
              id="chipsPerPlayer"
              value={chipsPerPlayer}
              onChange={setChipsPerPlayer}
              min={100}
              step={100}
              placeholder="1000"
            />
          </div>
        </div>

        {/* Feasibility warning */}
        {feasibilityWarning && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-xl text-warning flex items-start gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{feasibilityWarning}</span>
          </div>
        )}
      </section>

      {/* Results */}
      {result && (
        <section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              Distribución
            </h2>
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                copied
                  ? "bg-success/20 text-success"
                  : "bg-background text-foreground-muted hover:text-foreground hover:bg-background-secondary"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </button>
          </div>

          {/* Warnings from distribution */}
          {result.warnings.length > 0 && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {result.warnings.map((warning) => (
                    <p key={warning} className="text-sm text-danger">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DistributionDisplay
            result={result}
            playerCount={parseInt(playerCount) || 2}
          />
        </section>
      )}
    </div>
  );
}

// Chip set option in dropdown
interface SetOptionProps {
  set: ChipSet;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

function SetOption({
  set,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  canDelete,
}: SetOptionProps) {
  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        isSelected ? "bg-primary/10" : "hover:bg-background"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 flex items-center gap-3 text-left"
      >
        <div className="flex -space-x-1">
          {set.denominations.slice(0, 3).map((d) => (
            <div
              key={`opt-${set.id}-${d.value}`}
              className="w-5 h-5 rounded-full border-2 border-background-card"
              style={{ backgroundColor: d.color }}
            />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`font-medium truncate ${
              isSelected ? "text-primary" : "text-foreground"
            }`}
          >
            {set.name}
          </p>
          <p className="text-xs text-foreground-muted truncate">
            {set.denominations
              .map((d) => `${d.quantity}×${d.value}`)
              .join(", ")}
          </p>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors"
          title={set.is_preset ? "Duplicar y editar" : "Editar"}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg text-foreground-muted hover:text-danger hover:bg-danger/10 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ChipCalculator;
