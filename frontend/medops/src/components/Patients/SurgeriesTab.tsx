// src/components/Patients/SurgeriesTab.tsx
import { useState } from "react";
import { useSurgeries } from "../../hooks/patients/useSurgeries";
import { Surgery } from "../../types/patients";
import SurgeriesModal from "./SurgeriesModal";
import { 
  ScissorsIcon, 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  BuildingOfficeIcon,
  UserCircleIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";
interface Props {
  patientId: number;
  onRefresh?: () => void;
  readOnly?: boolean;
}
export default function SurgeriesTab({ patientId, onRefresh, readOnly = false }: Props) {
  const { query, create, update, remove } = useSurgeries(patientId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Surgery | undefined>(undefined);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const isSaving = create.isPending || update.isPending || remove.isPending;
  const handleCreate = () => {
    setEditingItem(undefined);
    setModalOpen(true);
  };
  const handleEdit = (item: Surgery) => {
    setEditingItem(item);
    setModalOpen(true);
  };
  const handleSave = (data: Surgery) => {
    setLocalError(null);
    const mutation = editingItem ? update : create;
    const payload = editingItem ? { ...editingItem, ...data } : { ...data, patient: patientId };
    mutation.mutate(payload as any, {
      onSuccess: () => {
        query.refetch();
        onRefresh?.();
        setModalOpen(false);
      },
      onError: () => setLocalError("Error al guardar la cirugía")
    });
  };
  const handleDelete = (id: number) => {
    remove.mutate(id, {
      onSuccess: () => {
        query.refetch();
        onRefresh?.();
      }
    });
  };
  if (query.isLoading) return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (query.isError) return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
      <p className="text-[11px] text-red-400">Error al cargar el historial quirúrgico</p>
    </div>
  );
  const surgeries = query.data || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-[12px] font-semibold text-white">
          Historial Quirúrgico
        </h2>
        
        {!readOnly && (
          <button
            onClick={handleCreate}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium rounded-lg disabled:opacity-50 transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva Cirugía
          </button>
        )}
      </div>
      {localError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-[11px] text-red-400">{localError}</p>
        </div>
      )}
      {surgeries.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/15 rounded-lg">
          <ScissorsIcon className="w-12 h-12 mx-auto text-white/15 mb-4" />
          <p className="text-[11px] text-white/40">No hay registros quirúrgicos</p>
          <p className="text-[9px] text-white/30 mt-1">Agrega la primera cirugía para comenzar el registro</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {surgeries.map((surgery: Surgery) => (
            <div
              key={surgery.id}
              className="bg-white/5 border border-white/15 rounded-lg p-5 hover:border-white/25 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-[12px] font-medium text-white mb-2">
                    {surgery.name || "Procedimiento sin nombre"}
                  </h3>
                  <div className="space-y-1.5 text-[10px] text-white/50">
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className="w-4 h-4" />
                      <span>{surgery.hospital || "Hospital no especificado"}</span>
                    </div>
                    {surgery.date && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{new Date(surgery.date).toLocaleDateString("es-VE")}</span>
                      </div>
                    )}
                    {surgery.doctor && (
                      <div className="flex items-center gap-2">
                        <UserCircleIcon className="w-4 h-4" />
                        <span>Dr. {surgery.doctor}</span>
                      </div>
                    )}
                  </div>
                  {surgery.description && (
                    <p className="text-[11px] text-white/60 mt-3 leading-relaxed">
                      {surgery.description}
                    </p>
                  )}
                </div>
                
                {!readOnly && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(surgery)}
                      disabled={isSaving}
                      className="p-2 text-white/50 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                      title="Editar"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(surgery.id)}
                      disabled={isSaving}
                      className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {!readOnly && (
        <SurgeriesModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          initial={editingItem}
          patientId={patientId}
        />
      )}
    </div>
  );
}