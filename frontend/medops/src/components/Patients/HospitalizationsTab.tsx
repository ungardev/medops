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
      <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (query.isError) return (
    <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl">
      <p className="text-sm text-red-400">Error al cargar el historial de hospitalizaciones</p>
    </div>
  );
  const hospitalizations = query.data || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-white">
          Historial de Hospitalización
        </h2>
        
        {!readOnly && (
          <button
            onClick={handleCreate}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 text-sm font-medium rounded-xl disabled:opacity-50 transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Nueva Admisión
          </button>
        )}
      </div>
      {localError && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400">{localError}</p>
        </div>
      )}
      {hospitalizations.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-white/15 rounded-xl">
          <Bed className="w-14 h-14 mx-auto text-white/15 mb-4" />
          <p className="text-sm text-white/40">No hay hospitalizaciones registradas</p>
          <p className="text-xs text-white/30 mt-1">Agrega la primera admisión para comenzar el registro</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {hospitalizations.map((hosp: Hospitalization) => (
            <div
              key={hosp.id}
              className="bg-white/5 border border-white/15 rounded-xl p-6 hover:border-white/25 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-medium text-white">
                      {hosp.ward} - Cama {hosp.bed_number}
                      {hosp.room_number && ` / Hab. ${hosp.room_number}`}
                    </h3>
                    {hosp.status && (
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-lg border ${statusColors[hosp.status] || "bg-white/5 text-white/40 border-white/10"}`}>
                        {hosp.status_display || hosp.status}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-xs text-white/50">
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
                    <p className="text-sm text-white/60 mt-4 leading-relaxed">
                      <span className="text-white/40">Motivo:</span> {hosp.chief_complaint}
                    </p>
                  )}
                  {hosp.clinical_summary && (
                    <p className="text-sm text-white/50 mt-3 leading-relaxed line-clamp-3">
                      {hosp.clinical_summary}
                    </p>
                  )}
                  {hosp.complications && (
                    <div className="mt-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <p className="text-xs text-red-400/80">
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
                      className="p-2.5 text-white/50 hover:text-emerald-400 hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
                      title="Editar"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(hosp.id)}
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