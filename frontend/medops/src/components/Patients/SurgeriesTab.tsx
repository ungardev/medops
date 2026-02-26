// src/components/Patients/SurgeriesTab.tsx
import { useState } from "react";
import { useSurgeries } from "../../hooks/patients/useSurgeries"; // ✅ FIX: Remover Surgery del import ya que ahora viene de types/patients
import { Surgery } from "../../types/patients"; // ✅ FIX: Importar Surgery desde types/patients
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
}
export default function SurgeriesTab({ patientId, onRefresh }: Props) {
  const { query, create, update, remove } = useSurgeries(patientId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Surgery | undefined>(undefined); // ✅ FIX: Cambiar null por undefined
  const [localError, setLocalError] = useState<string | null>(null);
  const isSaving = create.isPending || update.isPending || remove.isPending;
  const handleCreate = () => {
    setEditingItem(undefined); // ✅ FIX: Cambiar null por undefined
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
      onError: () => setLocalError("PROTOCOL_ERROR: SURGERY_SYNC_FAILED")
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
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (query.isError) return (
    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-sm">
      <p className="text-[10px] font-mono text-red-500 uppercase">Error: Failed to load surgical records</p>
    </div>
  );
  const surgeries = query.data || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-[10px] font-mono font-black text-[var(--palantir-text)] uppercase tracking-widest">
          Surgical Operations Log
        </h2>
        <button
          onClick={handleCreate}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--palantir-active)] hover:bg-[var(--palantir-active)]/80 text-black text-[10px] font-bold uppercase tracking-widest rounded-sm disabled:opacity-50 hover:shadow-lg transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          New Record
        </button>
      </div>
      {localError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-sm">
          <p className="text-[9px] font-mono text-red-500 uppercase">{localError}</p>
        </div>
      )}
      {surgeries.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--palantir-border)] rounded-sm">
          <ScissorsIcon className="w-12 h-12 mx-auto text-[var(--palantir-muted)]/30 mb-4" />
          <p className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase">No surgical records found</p>
          <p className="text-[8px] font-mono text-[var(--palantir-muted)]/60 mt-1">Add the first surgery to begin tracking</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {surgeries.map((surgery: Surgery) => (
            <div
              key={surgery.id}
              className="bg-[var(--palantir-surface)]/20 border border-[var(--palantir-border)] rounded-sm p-4 hover:shadow-[0_0_10px_rgba(0,0,0,0.3)] transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[var(--palantir-text)] uppercase tracking-tight mb-2">
                    {surgery.name || "Unnamed Procedure"}
                  </h3>
                  <div className="space-y-1 text-[9px] font-mono text-[var(--palantir-muted)] uppercase">
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className="w-3 h-3" />
                      <span>{surgery.hospital || "Hospital not specified"}</span>
                    </div>
                    {surgery.date && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3 h-3" />
                        <span>{new Date(surgery.date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {surgery.doctor && (
                      <div className="flex items-center gap-2">
                        <UserCircleIcon className="w-3 h-3" />
                        <span>Dr. {surgery.doctor}</span>
                      </div>
                    )}
                  </div>
                  {surgery.description && (
                    <p className="text-[10px] font-mono text-[var(--palantir-text)] mt-2 leading-relaxed">
                      {surgery.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(surgery)}
                    disabled={isSaving}
                    className="p-1 text-[var(--palantir-active)] hover:bg-white/5 rounded-sm transition-colors disabled:opacity-50"
                    title="Edit"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(surgery.id)}
                    disabled={isSaving}
                    className="p-1 text-red-500 hover:bg-red-500/10 rounded-sm transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <SurgeriesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editingItem} // ✅ Ahora es Surgery | undefined
        patientId={patientId}
      />
    </div>
  );
}