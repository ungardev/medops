// src/components/Patients/VaccinationTab.tsx
import { useState } from "react";
import {
  useVaccinations,
  PatientVaccination,
  VaccinationSchedule,
  PatientVaccinationPayload,
  Paginated,
} from "../../hooks/patients/useVaccinations";
import VaccinationModal from "./VaccinationModal";
import VaccinationMatrixUniversal from "./VaccinationMatrixUniversal";
import { BeakerIcon, ShieldCheckIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
interface Props {
  patientId: number;
  onRefresh?: () => void;
  readOnly?: boolean;
}
export default function VaccinationTab({ patientId, onRefresh, readOnly = false }: Props) {
  const { vaccinations: vaccQuery, schedule, create, update, remove } = useVaccinations(patientId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PatientVaccination | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const isSaving = create.isPending || update.isPending || remove.isPending;
  const handleSave = (payload: PatientVaccinationPayload) => {
    setLocalError(null);
    if (editingItem && editingItem.id > 0) {
      update.mutate(
        { ...payload, id: editingItem.id },
        {
          onSuccess: () => {
            vaccQuery.refetch();
            onRefresh?.();
            setModalOpen(false);
            setEditingItem(null);
          },
          onError: () => setLocalError("Error al actualizar la vacuna")
        }
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          vaccQuery.refetch();
          onRefresh?.();
          setModalOpen(false);
          setEditingItem(null);
        },
        onError: () => setLocalError("Error al registrar la vacuna")
      });
    }
  };
  const schema: VaccinationSchedule[] = Array.isArray(schedule.data)
    ? schedule.data
    : (schedule.data as Paginated<VaccinationSchedule> | undefined)?.results ?? [];
  const applied: PatientVaccination[] = Array.isArray(vaccQuery.data) ? vaccQuery.data : [];
  const handleRegisterDose = (dose: any) => {
    const existing = applied.find(
      a => a.vaccine_detail.code === dose.vaccine_detail.code && 
      a.dose_number === dose.dose_number
    );
    if (existing) {
      setEditingItem(existing);
    } else {
      setEditingItem({
        id: -1,
        patient: patientId,
        vaccine: dose.vaccine,
        vaccine_detail: dose.vaccine_detail,
        dose_number: dose.dose_number,
        date_administered: "",
        center: "",
        lot: "",
      });
    }
    setModalOpen(true);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-5 border border-white/15 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <BeakerIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-[12px] font-semibold text-white">
              Esquema de Vacunación
            </h2>
            <p className="text-[10px] text-white/40 mt-0.5">
              {applied.length >= schema.length ? "Esquema completo" : `${applied.length} de ${schema.length} dosis aplicadas`}
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[16px] font-semibold text-white">{applied.length}</span>
            <span className="text-[9px] text-white/40">Dosis aplicadas</span>
          </div>
        </div>
      </div>
      {localError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] rounded-lg">
          {localError}
        </div>
      )}
      <div className="relative bg-white/5 border border-white/15 rounded-lg overflow-hidden">
        {isSaving && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <span className="text-[11px] text-white/60 animate-pulse">Guardando...</span>
          </div>
        )}
        
        <VaccinationMatrixUniversal
          schedule={schema}
          vaccinations={applied}
          onRegisterDose={readOnly ? undefined : handleRegisterDose}
        />
      </div>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 px-2">
        <div className="flex flex-wrap gap-6">
          <LegendItem color="bg-yellow-400/20 border-yellow-400/40" label="Dosis recomendada" />
          <LegendItem color="bg-emerald-500/30 border-emerald-500/50" label="Inmunidad validada" />
          <LegendItem color="bg-white/5 border-white/15" label="No aplica" />
        </div>
        
        <div className="flex items-center gap-2 text-[9px] text-white/40">
          <InformationCircleIcon className="w-4 h-4" />
          Basado en la Sociedad Venezolana de Puericultura y Pediatría (SVPP)
        </div>
      </div>
      {!readOnly && (
        <VaccinationModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
          initial={editingItem}
          vaccines={schema.map(s => ({ ...s.vaccine_detail }))}
          patientId={patientId}
        />
      )}
    </div>
  );
}
function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color} border`} />
      <span className="text-[9px] text-white/40">{label}</span>
    </div>
  );
}