import React, { useState, useEffect } from "react";
import { useGeneticPredispositions } from "../../../hooks/patients/useGeneticPredispositions";
import { useUpdatePatient } from "../../../hooks/patients/useUpdatePatient";
import ComboboxMultiElegante from "../ComboboxMultiElegante";

interface Props {
  items: any[];
  patientId: number;
}

export default function GeneticSection({ items, patientId }: Props) {
  // Blindaje: asegurar que items SIEMPRE sea un array
  const safeItems = Array.isArray(items) ? items : [];

  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<number[]>(
    safeItems.map((i) => i.id)
  );

  const { data: catalog, isLoading, refetch } = useGeneticPredispositions();
  const updatePatient = useUpdatePatient(patientId);

  useEffect(() => {
    const safe = Array.isArray(items) ? items : [];
    setSelected(safe.map((i) => i.id));
  }, [items]);

  const handleSave = () => {
    const payload = {
      genetic_predispositions: selected,
    } as any; // actualización parcial permitida

    updatePatient.mutate(payload, {
      onSuccess: () => setEditing(false),
      onError: (err) =>
        console.error("Error al actualizar predisposiciones:", err),
    });
  };

  const handleCreate = async (name: string) => {
    const newPred = await fetch("/api/genetic-predispositions/", {
      method: "POST",
      body: JSON.stringify({ name }),
      headers: { "Content-Type": "application/json" },
    }).then((r) => r.json());

    await refetch();
    setSelected((prev) => [...prev, newPred.id]);
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white">
          Predisposiciones genéticas
        </h3>

        {editing ? (
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 bg-[#0d2c53] text-white rounded-md text-sm"
              onClick={handleSave}
            >
              Guardar
            </button>
            <button
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"
            onClick={() => setEditing(true)}
          >
            Editar
          </button>
        )}
      </div>

      {editing ? (
        isLoading ? (
          <p className="text-sm text-gray-500">Cargando catálogo...</p>
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
