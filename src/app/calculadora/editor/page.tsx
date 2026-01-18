"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Header from "@/components/Header";
import { createChipSet, getChipSets, updateChipSet } from "@/lib/chipSets";
import { ChipSetEditor } from "../ChipSetEditor";
import type { ChipSet } from "../types";
import {
  createStandard300ChipSet,
  createStandard500ChipSet,
  getDefaultColor,
  getDefaultQuantity,
} from "../utils";

function ChipSetEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chipSet, setChipSet] = useState<ChipSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Load chip set based on query parameters
  useEffect(() => {
    async function loadChipSet() {
      const chipsetId = searchParams.get("chipset");
      const preset = searchParams.get("preset");

      try {
        if (chipsetId) {
          // Load existing chip set by ID
          const sets = await getChipSets();
          const set = sets.find((s) => s.id === chipsetId);

          if (set) {
            if (set.is_preset) {
              // Clone preset to create custom version
              setChipSet({
                ...set,
                id: "",
                name: `${set.name} (copia)`,
                is_preset: false,
              });
            } else {
              setChipSet(set);
            }
          } else {
            setNotFound(true);
          }
        } else if (preset === "standard-300") {
          // Create standard 300 chip set
          setChipSet({
            id: "",
            name: "Set Estándar 300 Fichas",
            denominations: createStandard300ChipSet(),
            is_preset: false,
          });
        } else if (preset === "standard-500") {
          // Create standard 500 chip set
          setChipSet({
            id: "",
            name: "Set Estándar 500 Fichas",
            denominations: createStandard500ChipSet(),
            is_preset: false,
          });
        } else {
          // Create new custom chip set
          setChipSet({
            id: "",
            name: "",
            denominations: [
              {
                value: 5,
                color: getDefaultColor(5),
                quantity: getDefaultQuantity(5),
              },
              {
                value: 25,
                color: getDefaultColor(25),
                quantity: getDefaultQuantity(25),
              },
            ],
            is_preset: false,
          });
        }
      } catch (error) {
        console.error("Error loading chip set:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadChipSet();
  }, [searchParams]);

  const handleSave = async (updatedSet: ChipSet) => {
    if (updatedSet.id) {
      // Update existing chip set
      const updated = await updateChipSet(updatedSet.id, {
        name: updatedSet.name,
        denominations: updatedSet.denominations,
      });

      if (updated) {
        router.push("/calculadora");
      }
    } else {
      // Create new chip set
      const created = await createChipSet({
        name: updatedSet.name,
        denominations: updatedSet.denominations,
      });

      if (created) {
        router.push("/calculadora");
      }
    }
  };

  const handleCancel = () => {
    router.push("/calculadora");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (notFound || !chipSet) {
    return (
      <div className="bg-background-card rounded-2xl border border-border p-6 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Set de fichas no encontrado
        </h2>
        <p className="text-foreground-muted mb-4">
          El set de fichas que buscas no existe o ha sido eliminado.
        </p>
        <button
          onClick={() => router.push("/calculadora")}
          className="btn-primary px-4 py-2 rounded-lg"
          type="button"
        >
          Volver a la calculadora
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full">
      <ChipSetEditor
        chipSet={chipSet}
        onSave={handleSave}
        onCancel={handleCancel}
        isNew={!chipSet.id}
      />
    </div>
  );
}

export default function ChipSetEditorPage() {
  return (
    <>
      <Header />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          }
        >
          <ChipSetEditorContent />
        </Suspense>
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
