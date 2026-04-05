// src/components/Patients/HospitalizationsTab.tsx
import { useState } from "react";
import { useHospitalizations } from "../../hooks/patients/useHospitalizations";
import { Hospitalization } from "../../types/patients";
import HospitalizationsModal from "./HospitalizationsModal";
import { 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon,
  UserCircleIcon,
  CalendarIcon,
  HeartIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { Bed } from "lucide-react";
interface Props {
  patientId: number;
  onRefresh?: () => void;
  readOnly?: boolean;
}
const statusColors: Record<string, string> = {
  admitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  stable: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  improving: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  awaiting_discharge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  discharged: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  transferred: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  deceased: "bg-red-900/20 text-red-500 border-red-900/30",
};
export default function HospitalizationsTab({ patientId, onRefresh, readOnly = false }: Props) {
  const { query, create, update, remove } = useHospitalizations(patientId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Hospitalization | undefined>(undefined);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const isSaving = create.isPending || update.isPending || remove.isPending;
  const handleCreate = () => {
    setEditingItem(undefined);
    setModalOpen(true);
  };
  const handleEdit = (item: Hospitalization) => {
    setEditingItem(item);
    setModalOpen(true);
  };
  const handleSave = (data: Partial<Hospitalization>) => {
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
      onError: () => setLocalError("Error al guardar la hospitalización")
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
      <p className="text-[11px] text-red-400">Error al cargar el historial de hospitalizaciones</p>
    </div>
  );
  const hospitalizations = query.data || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-[12px] font-semibold text-white">
          Historial de Hospitalización
        </h2>
        
        {!readOnly && (
          <button
            onClick={handleCreate}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium rounded-lg disabled:opacity-50 transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva Admisión
          </button>
        )}
      </div>
      {localError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-[11px] text-red-400">{localError}</p>
        </div>
      )}
      {hospitalizations.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/15 rounded-lg">
          <Bed className="w-12 h-12 mx-auto text-white/15 mb-4" />
          <p className="text-[11px] text-white/40">No hay hospitalizaciones registradas</p>
          <p className="text-[9px] text-white/30 mt-1">Agrega la primera admisión para comenzar el registro</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {hospitalizations.map((hosp: Hospitalization) => (
            <div
              key={hosp.id}
              className="bg-white/5 border border-white/15 rounded-lg p-5 hover:border-white/25 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[12px] font-medium text-white">
                      {hosp.ward} - Cama {hosp.bed_number}
                      {hosp.room_number && ` / Hab. ${hosp.room_number}`}
                    </h3>
                    {hosp.status && (
                      <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-medium rounded-md border ${statusColors[hosp.status] || "bg-white/5 text-white/40 border-white/10"}`}>
                        {hosp.status_display || hosp.status}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-[10px] text-white/50">
                    {hosp.attending_doctor_name && (
                      <div className="flex items-center gap-2">
                        <UserCircleIcon className="w-4 h-4" />
                        <span>Dr. {hosp.attending_doctor_name}</span>
                      </div>
                    )}
                    {hosp.admission_date && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Ingreso: {new Date(hosp.admission_date).toLocaleDateString("es-VE")}</span>
                      </div>
                    )}
                    {hosp.length_of_stay !== undefined && (
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        <span>{hosp.length_of_stay} {hosp.length_of_stay === 1 ? "día" : "días"} de estancia</span>
                      </div>
                    )}
                    {hosp.admission_diagnosis_title && (
                      <div className="flex items-center gap-2">
                        <HeartIcon className="w-4 h-4" />
                        <span>Dx: {hosp.admission_diagnosis_title}</span>
                      </div>
                    )}
                  </div>
                  {hosp.chief_complaint && (
                    <p className="text-[11px] text-white/60 mt-3 leading-relaxed">
                      <span className="text-white/40">Motivo:</span> {hosp.chief_complaint}
                    </p>
                  )}
                  {hosp.clinical_summary && (
                    <p className="text-[11px] text-white/50 mt-2 leading-relaxed line-clamp-3">
                      {hosp.clinical_summary}
                    </p>
                  )}
                  {hosp.complications && (
                    <div className="mt-2 p-2 bg-red-500/5 border border-red-500/10 rounded">
                      <p className="text-[10px] text-red-400/80">
                        <span className="font-medium">Complicaciones:</span> {hosp.complications}
                      </p>
                    </div>
                  )}
                </div>
                
                {!readOnly && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(hosp)}
                      disabled={isSaving}
                      className="p-2 text-white/50 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                      title="Editar"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(hosp.id)}
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
        <HospitalizationsModal
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