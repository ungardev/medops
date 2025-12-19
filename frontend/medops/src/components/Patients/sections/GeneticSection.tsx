import React, { useState, useEffect } from "react";
import { useGeneticPredispositions } from "../../../hooks/patients/useGeneticPredispositions";
import { useCreateGeneticPredisposition } from "../../../hooks/patients/useCreateGeneticPredisposition";
import { useUpdatePatient } from "../../../hooks/patients/useUpdatePatient";
import ComboboxMultiElegante from "../ComboboxMultiElegante";

interface GeneticItem {
  id: number;
  name: string;
  description?: string;
}

interface Props {
  items: GeneticItem[] | null | undefined;
  patientId: number;
  onRefresh?: () => void;
}

export default function GeneticSection({ items, patientId, onRefresh }: Props) {
  // Blindaje: asegurar que items SIEMPRE sea un array
  const safeItems: GeneticItem[] = Array.isArray(items) ? items : [];

  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<number[]>(
    safeItems.map((i) => i.id)
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    data: catalog,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    error: catalogError,
  } = useGeneticPredispositions();

  const updatePatient = useUpdatePatient(patientId);
  const createPred = useCreateGeneticPredisposition();

  // Sincronizar selección cuando cambian los items del paciente
  useEffect(() => {
    const safe = Array.isArray(items) ? items : [];
    setSelected(safe.map((i) => i.id));
  }, [items]);

  const handleSave = () => {
    setLocalError(null);

    const payload = {
      genetic_predispositions: selected,
    };

    updatePatient.mutate(payload, {
      onSuccess: (data: any) => {
        setEditing(false);
        // 🔥 Actualizar estado local con predisposiciones completas devueltas por el PATCH
        if (data?.genetic_predispositions) {
          setSelected(data.genetic_predispositions.map((gp: any) => gp.id));
        }
        if (onRefresh) onRefresh();
      },
      onError: (err: any) => {
        console.error("Error al actualizar predisposiciones:", err);
        setLocalError(
          "Ocurrió un error al guardar las predisposiciones genéticas. Intenta nuevamente."
        );
      },
    });
  };

  const handleCreate = async (name: string) => {
    setLocalError(null);

    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      const newPred = await createPred.mutateAsync({ name: trimmed });
      if (newPred?.id && typeof newPred.id === "number") {
        setSelected((prev) => [...prev, newPred.id]);
      } else {
        console.error("Predisposición creada sin ID válido:", newPred);
      }
    } catch (err) {
      console.error("Error al crear predisposición genética:", err);
      setLocalError(
        "No se pudo crear la nueva predisposición genética. Revisa el nombre o intenta nuevamente."
      );
    }
  };

  const isSaving = updatePatient.isPending || createPred.isPending;

  return (
    <div className="relative p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      {/* Overlay suave cuando se está guardando */}
      {isSaving && (
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30 rounded-lg flex items-center justify-center z-10">
          <div className="px-4 py-2 bg-white dark:bg-gray-900 rounded-md shadow text-sm text-[#0d2c53] dark:text-gray-100">
            Guardando cambios...
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white">
          Predisposiciones genéticas
        </h3>

        {editing ? (
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 bg-[#0d2c53] text-white rounded-md text-sm disabled:opacity-60"
              onClick={handleSave}
              disabled={isSaving}
            >
              Guardar
            </button>
            <button
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 rounded-md text-sm disabled:opacity-60"
              onClick={() => {
                setEditing(false);
                setLocalError(null);
                const safe = Array.isArray(items) ? items : [];
                setSelected(safe.map((i) => i.id));
              }}
              disabled={isSaving}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 rounded-md text-sm"
            onClick={() => setEditing(true)}
          >
            Editar
          </button>
        )}
      </div>

      {/* Mensaje de error institucional */}
      {(localError || isCatalogError) && (
        <div className="mb-3 text-xs text-red-600 dark:text-red-400">
          {localError ||
            "No se pudo cargar el catálogo de predisposiciones genéticas."}
          {isCatalogError && catalogError && (
            <span className="block opacity-70 mt-0.5">
              Detalle técnico: {catalogError.message}
            </span>
          )}
        </div>
      )}

      {editing ? (
        isCatalogLoading ? (
          <div className="space-y-2">
            <div className="h-9 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
            <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
          </div>
        ) : (
          <ComboboxMultiElegante
            options={catalog ?? []}
            value={selected}
            onChange={setSelected}
            onCreate={handleCreate}
            placeholder="Escribe o selecciona predisposiciones..."
          />
        )
      ) : (
        <p className="text-sm text-[#0d2c53] dark:text-gray-100">
          {safeItems.length > 0
            ? safeItems.map((i) => i.name).join(", ")
            : "—"}
        </p>
      )}
    </div>
  );
}
