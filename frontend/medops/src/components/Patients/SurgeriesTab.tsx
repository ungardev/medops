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
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
interface Props {
  patientId: number;
  onRefresh?: () => void;
  readOnly?: boolean;
}
const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pre_op: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  in_progress: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  canceled: "bg-red-500/10 text-red-400 border-red-500/20",
  postponed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};
const riskColors: Record<string, string> = {
  low: "text-emerald-400",
  moderate: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};
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
  const handleSave = (data: Partial<Surgery>) => {
    setLocalError(null);
    const mutation = editingItem ? update : create;
    const payload = editingItem 
      ? { ...data, id: editingItem.id } 
      : { ...data, patient: patientId };
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
      <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (query.isError) return (
    <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl">
      <p className="text-sm text-red-400">Error al cargar el historial quirúrgico</p>
    </div>
  );
  const surgeries = query.data || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-white">
          Historial Quirúrgico
        </h2>
        
        {!readOnly && (
          <button
            onClick={handleCreate}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 text-sm font-medium rounded-xl disabled:opacity-50 transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Nueva Cirugía
          </button>
        )}
      </div>
      {localError && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400">{localError}</p>
        </div>
      )}
      {surgeries.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-white/15 rounded-xl">
          <ScissorsIcon className="w-14 h-14 mx-auto text-white/15 mb-4" />
          <p className="text-sm text-white/40">No hay registros quirúrgicos</p>
          <p className="text-xs text-white/30 mt-1">Agrega la primera cirugía para comenzar el registro</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {surgeries.map((surgery: Surgery) => (
            <div
              key={surgery.id}
              className="bg-white/5 border border-white/15 rounded-xl p-6 hover:border-white/25 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-medium text-white">
                      {surgery.name || "Procedimiento sin nombre"}
                    </h3>
                    {surgery.status && (
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-lg border ${statusColors[surgery.status] || "bg-white/5 text-white/40 border-white/10"}`}>
                        {surgery.status_display || surgery.status}
                      </span>
                    )}
                    {surgery.risk_level && (
                      <span className={`text-xs font-medium flex items-center gap-1 ${riskColors[surgery.risk_level] || "text-white/40"}`}>
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {surgery.risk_level_display || surgery.risk_level}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-xs text-white/50">
                    {surgery.surgeon_name && (
                      <div className="flex items-center gap-2">
                        <UserCircleIcon className="w-4 h-4" />
                        <span>Dr. {surgery.surgeon_name}</span>
                      </div>
                    )}
                    {surgery.scheduled_date && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{new Date(surgery.scheduled_date).toLocaleDateString("es-VE")}</span>
                      </div>
                    )}
                    {(surgery.institution_name || surgery.hospital) && (
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="w-4 h-4" />
                        <span>{surgery.institution_name || surgery.hospital}</span>
                      </div>
                    )}
                    {surgery.specialty_name && (
                      <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4" />
                        <span>{surgery.specialty_name}</span>
                      </div>
                    )}
                    {surgery.asa_classification && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/30">ASA:</span>
                        <span className="text-white/60">{surgery.asa_classification}</span>
                      </div>
                    )}
                  </div>
                  {surgery.procedure_description && (
                    <p className="text-sm text-white/60 mt-4 leading-relaxed">
                      {surgery.procedure_description}
                    </p>
                  )}
                  {surgery.complications && (
                    <div className="mt-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <p className="text-xs text-red-400/80">
                        <span className="font-medium">Complicaciones:</span> {surgery.complications}
                      </p>
                    </div>
                  )}
                </div>
                
                {!readOnly && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(surgery)}
                      disabled={isSaving}
                      className="p-2.5 text-white/50 hover:text-emerald-400 hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
                      title="Editar"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(surgery.id)}
                      disabled={isSaving}
                      className="p-2.5 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5" />
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