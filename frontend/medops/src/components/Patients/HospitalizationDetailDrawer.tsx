// src/components/Patients/HospitalizationDetailDrawer.tsx
import React from "react";
import type { Hospitalization } from "@/types/patients";
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
  X,
  Pencil,
  LogOut,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  hospitalization?: Hospitalization;
  onEdit: (hospitalization: Hospitalization) => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  admitted: { label: "Admitido", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  stable: { label: "Estable", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  critical: { label: "Crítico", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  improving: { label: "En Mejoría", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  awaiting_discharge: { label: "Esperando Alta", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  discharged: { label: "Dado de Alta", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" },
  transferred: { label: "Transferido", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  deceased: { label: "Fallecido", color: "text-red-500", bg: "bg-red-900/20", border: "border-red-900/30" },
};

export default function HospitalizationDetailDrawer({ open, onClose, hospitalization, onEdit }: Props) {
  if (!open || !hospitalization) return null;

  const statusKey = hospitalization.status || "admitted";
  const status = statusConfig[statusKey] || { label: hospitalization.status || "Desconocido", color: "text-white/60", bg: "bg-white/5", border: "border-white/10" };
  
  // Vital signs from hospitalization data
  const vitalSigns = (hospitalization as any).vital_signs || {};
  
  // Calculate BMI if weight and height available
  const bmi = vitalSigns.weight && vitalSigns.height 
    ? (vitalSigns.weight / Math.pow(vitalSigns.height / 100, 2)).toFixed(1)
    : null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-[#1a1a1b] border-l border-white/15 z-50 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Bed className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-white">Detalle de Hospitalización</h2>
              <p className="text-[10px] text-white/40">Información completa del paciente</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1.5 text-[10px] font-medium rounded-md border ${status.bg} ${status.color} ${status.border}`}>
              {status.label}
            </span>
            {(hospitalization as any).length_of_stay !== undefined && (
              <span className="text-[10px] text-white/40 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {hospitalization.length_of_stay} {hospitalization.length_of_stay === 1 ? "día" : "días"}
              </span>
            )}
          </div>

          {/* Patient Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <h3 className="text-[11px] font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              Paciente
            </h3>
            <p className="text-[13px] text-white/80 font-medium">{hospitalization.patient_name || "Sin información"}</p>
          </div>

          {/* Location Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <h3 className="text-[11px] font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
              <Bed className="w-4 h-4" />
              Ubicación
            </h3>
            
            <div className="space-y-2">
              {(hospitalization as any).hospital && (
                <div>
                  <span className="text-[10px] text-white/40 uppercase">Centro Médico</span>
                  <p className="text-[12px] text-white/70">{(hospitalization as any).hospital}</p>
                </div>
              )}
              
              {hospitalization.ward && (
                <div className="flex gap-4">
                  <div>
                    <span className="text-[10px] text-white/40 uppercase">Sala/Pabellón</span>
                    <p className="text-[12px] text-white/70">{hospitalization.ward}</p>
                  </div>
                  {hospitalization.room_number && (
                    <div>
                      <span className="text-[10px] text-white/40 uppercase">Habitación</span>
                      <p className="text-[12px] text-white/70">{hospitalization.room_number}</p>
                    </div>
                  )}
                  {hospitalization.bed_number && (
                    <div>
                      <span className="text-[10px] text-white/40 uppercase">Cama</span>
                      <p className="text-[12px] text-white/70">{hospitalization.bed_number}</p>
                    </div>
                  )}
                </div>
              )}
              
              {!hospitalization.ward && (
                <p className="text-[11px] text-white/40">No hay información de ubicación</p>
              )}
            </div>
          </div>

          {/* Admission Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <h3 className="text-[11px] font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fechas de Admisión
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {hospitalization.admission_date && (
                <div>
                  <span className="text-[10px] text-white/40 uppercase">Fecha de Ingreso</span>
                  <p className="text-[12px] text-white/70">
                    {new Date(hospitalization.admission_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
              {(hospitalization as any).expected_discharge_date && (
                <div>
                  <span className="text-[10px] text-white/40 uppercase">Fecha Estimada de Alta</span>
                  <p className="text-[12px] text-white/70">
                    {new Date((hospitalization as any).expected_discharge_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
              {(hospitalization as any).actual_discharge_date && (
                <div>
                  <span className="text-[10px] text-white/40 uppercase">Fecha Real de Alta</span>
                  <p className="text-[12px] text-white/70">
                    {new Date((hospitalization as any).actual_discharge_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Medical Responsible */}
          {(hospitalization as any).attending_doctor_name && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <h3 className="text-[11px] font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Médico Responsable
              </h3>
              <p className="text-[13px] text-white/80">{(hospitalization as any).attending_doctor_name}</p>
            </div>
          )}

          {/* Admission Type & Reason */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <h3 className="text-[11px] font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Información de Ingreso
            </h3>
            
            <div className="space-y-2">
              {hospitalization.admission_type && (
                <div>
                  <span className="text-[10px] text-white/40 uppercase">Tipo de Admisión</span>
                  <p className="text-[12px] text-white/70 capitalize">{hospitalization.admission_type}</p>
                </div>
              )}
              
              {(hospitalization as any).chief_complaint && (
                <div>
                  <span className="text-[10px] text-white/40 uppercase">Motivo de Ingreso</span>
                  <p className="text-[12px] text-white/70 whitespace-pre-wrap">{(hospitalization as any).chief_complaint}</p>
                </div>
              )}
              
              {(hospitalization as any).clinical_summary && (
                <div>
                  <span className="text-[10px] text-white/40 uppercase">Resumen Clínico</span>
                  <p className="text-[12px] text-white/70 whitespace-pre-wrap">{(hospitalization as any).clinical_summary}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vital Signs */}
          {(vitalSigns.weight || vitalSigns.height || vitalSigns.temperature || vitalSigns.bp_systolic || vitalSigns.heart_rate || vitalSigns.respiratory_rate || vitalSigns.oxygen_saturation) && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <h3 className="text-[11px] font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Signos Vitales
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {vitalSigns.weight && (
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-white/40" />
                    <div>
                      <span className="text-[9px] text-white/40 uppercase">Peso</span>
                      <p className="text-[11px] text-white/70">{vitalSigns.weight} kg</p>
                    </div>
                  </div>
                )}
                {vitalSigns.height && (
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-white/40" />
                    <div>
                      <span className="text-[9px] text-white/40 uppercase">Altura</span>
                      <p className="text-[11px] text-white/70">{vitalSigns.height} cm</p>
                    </div>
                  </div>
                )}
                {bmi && (
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="text-[9px] text-white/40 uppercase">IMC</span>
                      <p className="text-[11px] text-blue-400 font-medium">{bmi}</p>
                    </div>
                  </div>
                )}
                {vitalSigns.temperature && (
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-white/40" />
                    <div>
                      <span className="text-[9px] text-white/40 uppercase">Temperatura</span>
                      <p className="text-[11px] text-white/70">{vitalSigns.temperature} °C</p>
                    </div>
                  </div>
                )}
                {vitalSigns.bp_systolic && vitalSigns.bp_diastolic && (
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-white/40" />
                    <div>
                      <span className="text-[9px] text-white/40 uppercase">Presión Arterial</span>
                      <p className="text-[11px] text-white/70">{vitalSigns.bp_systolic}/{vitalSigns.bp_diastolic} mmHg</p>
                    </div>
                  </div>
                )}
                {vitalSigns.heart_rate && (
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    <div>
                      <span className="text-[9px] text-white/40 uppercase">Frecuencia Cardíaca</span>
                      <p className="text-[11px] text-white/70">{vitalSigns.heart_rate} bpm</p>
                    </div>
                  </div>
                )}
                {vitalSigns.respiratory_rate && (
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-white/40" />
                    <div>
                      <span className="text-[9px] text-white/40 uppercase">Frecuencia Respiratoria</span>
                      <p className="text-[11px] text-white/70">{vitalSigns.respiratory_rate} /min</p>
                    </div>
                  </div>
                )}
                {vitalSigns.oxygen_saturation && (
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="text-[9px] text-white/40 uppercase">Sat. Oxígeno</span>
                      <p className="text-[11px] text-white/70">{vitalSigns.oxygen_saturation}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Allergies */}
          {(hospitalization as any).allergies_at_admission && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <h3 className="text-[11px] font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Alergias al Ingreso
              </h3>
              <p className="text-[12px] text-white/70 whitespace-pre-wrap">{(hospitalization as any).allergies_at_admission}</p>
            </div>
          )}

          {/* Daily Notes */}
          {(hospitalization as any).daily_notes && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <h3 className="text-[11px] font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notas de Evolución
              </h3>
              <p className="text-[12px] text-white/70 whitespace-pre-wrap">{(hospitalization as any).daily_notes}</p>
            </div>
          )}

          {/* Complications */}
          {(hospitalization as any).complications && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <h3 className="text-[11px] font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Complicaciones
              </h3>
              <p className="text-[12px] text-white/70 whitespace-pre-wrap">{(hospitalization as any).complications}</p>
            </div>
          )}

          {/* Discharge Info */}
          {(hospitalization as any).discharge_type || (hospitalization as any).discharge_summary && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <h3 className="text-[11px] font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Información de Alta
              </h3>
              
              <div className="space-y-2">
                {(hospitalization as any).discharge_type && (
                  <div>
                    <span className="text-[10px] text-white/40 uppercase">Tipo de Alta</span>
                    <p className="text-[12px] text-white/70 capitalize">{(hospitalization as any).discharge_type}</p>
                  </div>
                )}
                {(hospitalization as any).discharge_summary && (
                  <div>
                    <span className="text-[10px] text-white/40 uppercase">Resumen de Alta</span>
                    <p className="text-[12px] text-white/70 whitespace-pre-wrap">{(hospitalization as any).discharge_summary}</p>
                  </div>
                )}
                {(hospitalization as any).discharge_instructions && (
                  <div>
                    <span className="text-[10px] text-white/40 uppercase">Instrucciones al Alta</span>
                    <p className="text-[12px] text-white/70 whitespace-pre-wrap">{(hospitalization as any).discharge_instructions}</p>
                  </div>
                )}
                {(hospitalization as any).discharge_medications && (
                  <div>
                    <span className="text-[10px] text-white/40 uppercase">Medicamentos al Alta</span>
                    <p className="text-[12px] text-white/70 whitespace-pre-wrap">{(hospitalization as any).discharge_medications}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/15 bg-[#1f1f1f]">
          <button
            onClick={() => onEdit(hospitalization)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-400 rounded-lg transition-all text-[12px] font-medium"
          >
            <Pencil className="w-4 h-4" />
            Editar Hospitalización
          </button>
        </div>
      </div>
    </>
  );
}