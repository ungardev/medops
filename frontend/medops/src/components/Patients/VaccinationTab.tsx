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
}

export default function VaccinationTab({ patientId, onRefresh }: Props) {
  const { vaccinations: vaccQuery, schedule, create, update, remove } = useVaccinations(patientId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PatientVaccination | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const isSaving = create.isPending || update.isPending || remove.isPending;

  // ✅ Lógica de guardado corregida para resolver el error de TS(2345)
  const handleSave = (payload: PatientVaccinationPayload) => {
    setLocalError(null);

    if (editingItem && editingItem.id > 0) {
      // Flujo de ACTUALIZACIÓN: Se requiere ID explícito
      update.mutate(
        { 
          ...payload, 
          id: editingItem.id 
        },
        {
          onSuccess: () => {
            vaccQuery.refetch();
            onRefresh?.();
            setModalOpen(false);
            setEditingItem(null);
          },
          onError: () => setLocalError("PROTOCOL_ERROR: UPDATE_FAILED")
        }
      );
    } else {
      // Flujo de CREACIÓN
      create.mutate(payload, {
        onSuccess: () => {
          vaccQuery.refetch();
          onRefresh?.();
          setModalOpen(false);
          setEditingItem(null);
        },
        onError: () => setLocalError("PROTOCOL_ERROR: CREATION_FAILED")
      });
    }
  };

  // Normalización de datos del esquema
  const schema: VaccinationSchedule[] = Array.isArray(schedule.data)
    ? schedule.data
    : (schedule.data as Paginated<VaccinationSchedule> | undefined)?.results ?? [];

  const applied: PatientVaccination[] = Array.isArray(vaccQuery.data) ? vaccQuery.data : [];

  return (
    <div className="space-y-6">
      {/* Header Estilizado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--palantir-surface)]/20 p-4 border border-[var(--palantir-border)] rounded-sm">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-[var(--palantir-active)]/10 border border-[var(--palantir-active)]/30 rounded-sm">
            <BeakerIcon className="w-6 h-6 text-[var(--palantir-active)]" />
          </div>
          <div>
            <h2 className="text-[12px] font-black text-[var(--palantir-text)] uppercase tracking-[0.2em]">
              IMMUNIZATION_PROTOCOL_SVPP
            </h2>
            <p className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase mt-0.5">
              Status: {applied.length >= schema.length ? "PROTOCOL_COMPLETE" : "SYNCING_CLINICAL_DATA"}
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[14px] font-mono font-bold text-[var(--palantir-text)]">{applied.length}</span>
            <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase">Applied_Doses</span>
          </div>
        </div>
      </div>

      {localError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-mono uppercase">
          {localError}
        </div>
      )}

      {/* Matrix Container */}
      <div className="relative bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-sm overflow-hidden">
        {isSaving && (
          <div className="absolute inset-0 bg-[var(--palantir-bg)]/80 backdrop-blur-sm flex items-center justify-center z-50">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] animate-pulse">Writing_Data...</span>
          </div>
        )}
        
        <VaccinationMatrixUniversal
          schedule={schema}
          vaccinations={applied}
          onRegisterDose={(dose) => {
            // Buscamos si ya existe una dosis aplicada para este esquema para permitir edición
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
          }}
        />
      </div>

      {/* Legend & Footer */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 px-2">
        <div className="flex flex-wrap gap-6">
          <LegendItem color="bg-yellow-400/20 border-yellow-400/40" label="Recommended_Dose" />
          <LegendItem color="bg-emerald-500/30 border-emerald-500/50" label="Validated_Immunity" />
          <LegendItem color="bg-[var(--palantir-surface)] border-[var(--palantir-border)]" label="Not_Applicable" />
        </div>
        
        <div className="flex items-center gap-2 text-[9px] font-mono text-[var(--palantir-muted)] uppercase">
          <InformationCircleIcon className="w-3 h-3" />
          Data based on Venezuelan Society of Childcare and Pediatrics (SVPP)
        </div>
      </div>

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
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color} border`} />
      <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-wider">{label}</span>
    </div>
  );
}
