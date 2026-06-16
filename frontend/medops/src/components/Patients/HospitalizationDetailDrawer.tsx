// src/components/Patients/HospitalizationDetailDrawer.tsx
import React from "react";
import type { Hospitalization } from "@/types/patients";
import DrawerShell from "@/components/Common/DrawerShell";
import StatusBadge, { HOSPITALIZATION_STATUS_CONFIGS } from "@/components/Common/StatusBadge";
import DetailSection, { DetailRow, DetailMultiline } from "@/components/Common/DetailSection";
import { 
  Bed, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Heart,
  Activity,
  AlertTriangle,
  FileText,
  Thermometer,
  Droplets,
  Wind,
  HeartPulse,
  CheckCircle,
  Pencil,
  LogOut,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  hospitalization?: Hospitalization;
  onEdit?: (hospitalization: Hospitalization) => void;
  readOnly?: boolean;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function HospitalizationDetailDrawer({ open, onClose, hospitalization, onEdit, readOnly }: Props) {
  if (!hospitalization) return null;

  const footer = !readOnly && onEdit && hospitalization ? (
    <button
      onClick={() => onEdit(hospitalization)}
      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-400 rounded-xl transition-all text-sm font-medium"
    >
      <Pencil className="w-4 h-4" />
      Editar Hospitalización
    </button>
  ) : undefined;

  const vitalSigns = (hospitalization as any).vital_signs || {};
  const bmi = vitalSigns.weight && vitalSigns.height
    ? (vitalSigns.weight / Math.pow(vitalSigns.height / 100, 2)).toFixed(1)
    : null;

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      title="Detalle de Hospitalización"
      footer={footer}
      accentColor="blue"
    >
      {/* Status & Length of Stay */}
      <div className="flex items-center justify-between">
        <StatusBadge status={hospitalization.status || "admitted"} configs={HOSPITALIZATION_STATUS_CONFIGS} />
        {hospitalization.length_of_stay !== undefined && (
          <span className="text-xs text-white/40 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {hospitalization.length_of_stay} {hospitalization.length_of_stay === 1 ? "día" : "días"}
          </span>
        )}
      </div>

      {/* Patient */}
      <DetailSection title="Paciente" icon={User}>
        <DetailRow value={hospitalization.patient_name || "Sin información"} />
      </DetailSection>

      {/* Location */}
      <DetailSection title="Ubicación" icon={Bed}>
        {(hospitalization as any).hospital && <DetailRow label="Centro Médico" value={(hospitalization as any).hospital} />}
        {hospitalization.ward ? (
          <div className="flex gap-6">
            <DetailRow label="Sala/Pabellón" value={hospitalization.ward} />
            {hospitalization.room_number && <DetailRow label="Habitación" value={hospitalization.room_number} />}
            {hospitalization.bed_number && <DetailRow label="Cama" value={hospitalization.bed_number} />}
          </div>
        ) : (
          <DetailRow noValue="No hay información de ubicación" />
        )}
      </DetailSection>

      {/* Admission Dates */}
      <DetailSection title="Fechas de Admisión" icon={Calendar}>
        <div className="grid grid-cols-2 gap-4">
          {hospitalization.admission_date && (
            <DetailRow label="Fecha de Ingreso" value={formatDate(hospitalization.admission_date)} />
          )}
          {(hospitalization as any).expected_discharge_date && (
            <DetailRow label="Fecha Estimada de Alta" value={formatDate((hospitalization as any).expected_discharge_date)} />
          )}
          {(hospitalization as any).actual_discharge_date && (
            <DetailRow label="Fecha Real de Alta" value={formatDate((hospitalization as any).actual_discharge_date)} />
          )}
        </div>
      </DetailSection>

      {/* Attending Doctor */}
      {(hospitalization as any).attending_doctor_name && (
        <DetailSection title="Médico Responsable" icon={Stethoscope}>
          <DetailRow value={(hospitalization as any).attending_doctor_name} />
        </DetailSection>
      )}

      {/* Admission Info */}
      <DetailSection title="Información de Ingreso" icon={FileText}>
        {hospitalization.admission_type && (
          <DetailRow label="Tipo de Admisión" value={hospitalization.admission_type} />
        )}
        {(hospitalization as any).chief_complaint && (
          <DetailMultiline label="Motivo de Ingreso" value={(hospitalization as any).chief_complaint} />
        )}
        {(hospitalization as any).clinical_summary && (
          <DetailMultiline label="Resumen Clínico" value={(hospitalization as any).clinical_summary} />
        )}
      </DetailSection>

      {/* Vital Signs */}
      {(vitalSigns.weight || vitalSigns.height || vitalSigns.temperature || vitalSigns.bp_systolic || vitalSigns.heart_rate || vitalSigns.respiratory_rate || vitalSigns.oxygen_saturation) && (
        <DetailSection title="Signos Vitales" icon={Heart}>
          <div className="grid grid-cols-2 gap-3">
            {vitalSigns.weight && (
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-white/40" />
                <DetailRow label="Peso" value={`${vitalSigns.weight} kg`} />
              </div>
            )}
            {vitalSigns.height && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-white/40" />
                <DetailRow label="Altura" value={`${vitalSigns.height} cm`} />
              </div>
            )}
            {bmi && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <DetailRow label="IMC" value={bmi} valueClassName="text-blue-400 font-medium" />
              </div>
            )}
            {vitalSigns.temperature && (
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-white/40" />
                <DetailRow label="Temperatura" value={`${vitalSigns.temperature} °C`} />
              </div>
            )}
            {vitalSigns.bp_systolic && vitalSigns.bp_diastolic && (
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-white/40" />
                <DetailRow label="Presión Arterial" value={`${vitalSigns.bp_systolic}/${vitalSigns.bp_diastolic} mmHg`} />
              </div>
            )}
            {vitalSigns.heart_rate && (
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                <DetailRow label="Frecuencia Cardíaca" value={`${vitalSigns.heart_rate} bpm`} />
              </div>
            )}
            {vitalSigns.respiratory_rate && (
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-white/40" />
                <DetailRow label="Frecuencia Respiratoria" value={`${vitalSigns.respiratory_rate} /min`} />
              </div>
            )}
            {vitalSigns.oxygen_saturation && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <DetailRow label="Sat. Oxígeno" value={`${vitalSigns.oxygen_saturation}%`} />
              </div>
            )}
          </div>
        </DetailSection>
      )}

      {/* Allergies */}
      {(hospitalization as any).allergies_at_admission && (
        <DetailSection title="Alergias al Ingreso" icon={AlertTriangle}>
          <DetailMultiline value={(hospitalization as any).allergies_at_admission} />
        </DetailSection>
      )}

      {/* Daily Notes */}
      {(hospitalization as any).daily_notes && (
        <DetailSection title="Notas de Evolución" icon={FileText}>
          <DetailMultiline value={(hospitalization as any).daily_notes} />
        </DetailSection>
      )}

      {/* Complications */}
      {(hospitalization as any).complications && (
        <DetailSection title="Complicaciones" icon={AlertTriangle}>
          <DetailMultiline value={(hospitalization as any).complications} />
        </DetailSection>
      )}

      {/* Discharge Info */}
      {(hospitalization as any).discharge_type || (hospitalization as any).discharge_summary && (
        <DetailSection title="Información de Alta" icon={LogOut}>
          {(hospitalization as any).discharge_type && (
            <DetailRow label="Tipo de Alta" value={(hospitalization as any).discharge_type} />
          )}
          {(hospitalization as any).discharge_summary && (
            <DetailMultiline label="Resumen de Alta" value={(hospitalization as any).discharge_summary} />
          )}
          {(hospitalization as any).discharge_instructions && (
            <DetailMultiline label="Instrucciones al Alta" value={(hospitalization as any).discharge_instructions} />
          )}
          {(hospitalization as any).discharge_medications && (
            <DetailMultiline label="Medicamentos al Alta" value={(hospitalization as any).discharge_medications} />
          )}
        </DetailSection>
      )}
    </DrawerShell>
  );
}
