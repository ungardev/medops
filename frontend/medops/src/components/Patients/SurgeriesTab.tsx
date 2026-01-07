// src/components/Patients/SurgeriesTab.tsx
import { useState } from "react";
import { useSurgeries, Surgery } from "../../hooks/patients/useSurgeries";
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
  const [editingItem, setEditingItem] = useState<Surgery | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const isSaving = create.isPending || update.isPending || remove.isPending;

  const handleCreate = () => {
    setEditingItem(null);
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
    if (!window.confirm("CONFIRM_PROCEDURE_DELETION?")) return;
    setLocalError(null);
    remove.mutate(id, {
      onSuccess: () => {
        query.refetch();
        onRefresh?.();
      },
      onError: () => setLocalError("PROTOCOL_ERROR: DELETION_FAILED")
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con Estética de Comando */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--palantir-surface)]/20 p-4 border border-[var(--palantir-border)] rounded-sm">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-[var(--palantir-active)]/10 border border-[var(--palantir-active)]/30 rounded-sm">
            <ScissorsIcon className="w-6 h-6 text-[var(--palantir-active)]" />
          </div>
          <div>
            <h2 className="text-[12px] font-black text-[var(--palantir-text)] uppercase tracking-[0.2em]">
              SURGICAL_HISTORY_LOG
            </h2>
            <p className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase mt-0.5">
              Patient_UID: {patientId.toString().padStart(6, '0')} // Status: OPERATIONAL
            </p>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--palantir-active)] hover:bg-[var(--palantir-active)]/80 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
        >
          <PlusIcon className="w-4 h-4" />
          Add_Procedure
        </button>
      </div>

      {/* Alerta de Error Técnica */}
      {localError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-mono uppercase">
          {localError}
        </div>
      )}

      {/* Lista de Cirugías */}
      <div className="relative min-h-[200px]">
        {isSaving && (
          <div className="absolute inset-0 bg-[var(--palantir-bg)]/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] animate-pulse">Writing_Clinical_Data...</span>
          </div>
        )}

        {query.isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-[var(--palantir-surface)] animate-pulse rounded-sm border border-[var(--palantir-border)]" />
            ))}
          </div>
        ) : query.data && query.data.length === 0 ? (
          <div className="py-12 border border-dashed border-[var(--palantir-border)] text-center">
            <p className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
              No_Surgical_Interventions_Recorded
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {query.data?.map((item) => (
              <div 
                key={item.id} 
                className="group p-4 bg-[var(--palantir-bg)] border border-[var(--palantir-border)] hover:border-[var(--palantir-active)]/50 transition-all rounded-sm flex flex-col md:flex-row justify-between gap-4"
              >
                <div className="space-y-3 flex-grow">
                  <div className="flex items-start justify-between md:justify-start gap-4">
                    <h3 className="text-[13px] font-bold text-[var(--palantir-text)] uppercase tracking-tight">
                      {item.name}
                    </h3>
                    <span className="px-2 py-0.5 bg-[var(--palantir-surface)] border border-[var(--palantir-border)] text-[8px] font-mono text-[var(--palantir-muted)] uppercase">
                      {item.status || 'COMPLETED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-6">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--palantir-muted)] uppercase">
                      <BuildingOfficeIcon className="w-3 h-3 text-[var(--palantir-active)]" />
                      {item.hospital}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--palantir-muted)] uppercase">
                      <UserCircleIcon className="w-3 h-3 text-[var(--palantir-active)]" />
                      Dr. {item.doctor || 'NOT_SPECIFIED'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--palantir-muted)] uppercase">
                      <CalendarIcon className="w-3 h-3 text-[var(--palantir-active)]" />
                      {item.date || 'UNKWOWN_DATE'}
                    </div>
                  </div>

                  {item.description && (
                    <div className="p-2 bg-[var(--palantir-surface)]/50 border-l-2 border-[var(--palantir-active)]/30">
                      <p className="text-[10px] font-mono text-[var(--palantir-muted)] italic leading-relaxed">
                        &gt; {item.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col gap-2 justify-end">
                  <button
                    onClick={() => handleEdit(item)}
                    disabled={isSaving}
                    className="p-2 hover:bg-[var(--palantir-active)]/10 text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] transition-colors border border-transparent hover:border-[var(--palantir-active)]/20 rounded-sm"
                    title="Edit_Record"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isSaving}
                    className="p-2 hover:bg-red-500/10 text-[var(--palantir-muted)] hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20 rounded-sm"
                    title="Delete_Record"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SurgeriesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editingItem}
      />
    </div>
  );
}
