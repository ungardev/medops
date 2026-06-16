// src/components/Patients/SurgeryDetailDrawer.tsx
import React from "react";
import type { Surgery } from "@/types/patients";
import DrawerShell from "@/components/Common/DrawerShell";
import StatusBadge, { SURGERY_STATUS_CONFIGS, RISK_LEVEL_CONFIGS } from "@/components/Common/StatusBadge";
import DetailSection, { DetailRow, DetailMultiline } from "@/components/Common/DetailSection";
import { 
  Scissors, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Heart,
  ShieldCheckIcon,
  AlertTriangle,
  Activity,
  FileText,
  Droplets,
  TestTube,
  CheckCircle,
  Pencil,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  surgery?: Surgery;
  onEdit?: (surgery: Surgery) => void;
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

export default function SurgeryDetailDrawer({ open, onClose, surgery, onEdit, readOnly }: Props) {
  if (!surgery) return null;

  const footer = !readOnly && onEdit && surgery ? (
    <button
      onClick={() => onEdit(surgery)}
      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 rounded-xl transition-all text-sm font-medium"
    >
      <Pencil className="w-4 h-4" />
      Editar Cirugía
    </button>
  ) : undefined;

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      title="Detalle de Cirugía"
      footer={footer}
      accentColor="emerald"
    >
      {/* Status & Risk */}
      <div className="flex items-center justify-between">
        <StatusBadge status={surgery.status || "scheduled"} configs={SURGERY_STATUS_CONFIGS} />
        {surgery.risk_level && (
          <StatusBadge status={surgery.risk_level} configs={RISK_LEVEL_CONFIGS} />
        )}
      </div>

      {/* Basic Info */}
      <DetailSection title="Información del Procedimiento" icon={FileText}>
        <DetailRow label="Procedimiento" value={surgery.name || "Sin nombre"} />
        {(surgery as any).hospital && <DetailRow label="Centro Médico" value={(surgery as any).hospital} />}
        {(surgery as any).surgery_type && (
          <DetailRow label="Tipo de Cirugía" value={(surgery as any).surgery_type} />
        )}
        {surgery.scheduled_date && (
          <div className="flex gap-6">
            <DetailRow label="Fecha" value={formatDate(surgery.scheduled_date)} />
            {(surgery as any).scheduled_time && <DetailRow label="Hora" value={(surgery as any).scheduled_time} />}
          </div>
        )}
      </DetailSection>

      {/* Patient */}
      <DetailSection title="Paciente" icon={User}>
        <DetailRow value={surgery.patient_name || "Sin información del paciente"} />
      </DetailSection>

      {/* Surgical Team */}
      <DetailSection title="Equipo Quirúrgico" icon={Heart}>
        {(surgery as any).surgeon_name && (
          <DetailRow label="Cirujano" value={(surgery as any).surgeon_name} />
        )}
        {(surgery as any).anesthesiologist_name && (
          <DetailRow label="Anestesiólogo" value={(surgery as any).anesthesiologist_name} />
        )}
        {(surgery as any).surgical_assistants_name && (
          <DetailRow label="Asistentes" value={(surgery as any).surgical_assistants_name} />
        )}
        {!(surgery as any).surgeon_name && !(surgery as any).anesthesiologist_name && !(surgery as any).surgical_assistants_name && (
          <DetailRow noValue="No hay información del equipo registrada" />
        )}
      </DetailSection>

      {/* Risk Classification */}
      <DetailSection title="Clasificación de Riesgo" icon={ShieldCheckIcon}>
        {surgery.asa_classification && (
          <DetailRow label="Clasificación ASA" value={surgery.asa_classification} />
        )}
        {surgery.risk_level && (
          <DetailRow label="Nivel de Riesgo" value={(surgery as any).risk_level_display} />
        )}
        {!surgery.asa_classification && !surgery.risk_level && (
          <DetailRow noValue="No hay clasificación de riesgo registrada" />
        )}
      </DetailSection>

      {/* Procedure Details */}
      {(surgery as any).procedure_description && (
        <DetailSection title="Descripción del Procedimiento" icon={FileText}>
          <DetailMultiline label="" value={(surgery as any).procedure_description} />
        </DetailSection>
      )}

      {/* Findings */}
      {(surgery as any).findings && (
        <DetailSection title="Hallazgos" icon={AlertTriangle}>
          <DetailMultiline label="" value={(surgery as any).findings} />
        </DetailSection>
      )}

      {/* Specimens */}
      {(surgery as any).specimens && (
        <DetailSection title="Especímenes" icon={TestTube}>
          <DetailMultiline label="" value={(surgery as any).specimens} />
        </DetailSection>
      )}

      {/* Blood Loss */}
      {(surgery as any).estimated_blood_loss != null && (surgery as any).estimated_blood_loss !== "" && (
        <DetailSection title="Pérdida Sanguínea" icon={Droplets}>
          <DetailRow label="" value={`${(surgery as any).estimated_blood_loss} ml`} />
        </DetailSection>
      )}

      {/* Complications */}
      {(surgery as any).complications && (
        <DetailSection title="Complicaciones" icon={AlertTriangle}>
          <DetailMultiline label="" value={(surgery as any).complications} />
        </DetailSection>
      )}

      {/* Post-op Instructions */}
      {(surgery as any).post_op_instructions && (
        <DetailSection title="Instrucciones Post-operatorias" icon={CheckCircle}>
          <DetailMultiline label="" value={(surgery as any).post_op_instructions} />
        </DetailSection>
      )}

      {/* Follow-up */}
      {(surgery as any).follow_up_date && (
        <DetailSection title="Fecha de Seguimiento" icon={Calendar}>
          <DetailRow label="" value={formatDate((surgery as any).follow_up_date)} />
        </DetailSection>
      )}
    </DrawerShell>
  );
}
