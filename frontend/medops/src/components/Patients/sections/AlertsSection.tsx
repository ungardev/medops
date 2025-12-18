import React, { useState, useMemo } from "react";
import AlertModal from "./AlertModal";

type AlertType = "danger" | "warning" | "info";

interface ClinicalAlert {
  id?: number;
  type: AlertType;
  message: string;
}

interface Props {
  patient: any;
  vaccinations: any[];
  vaccinationSchedule: any[];
}

export default function AlertsSection({
  patient,
  vaccinations,
  vaccinationSchedule,
}: Props) {
  const [manualAlerts, setManualAlerts] = useState<ClinicalAlert[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClinicalAlert | null>(null);

  // --- ALERTAS AUTOMÁTICAS ---
  const autoAlerts: ClinicalAlert[] = useMemo(() => {
    const alerts: ClinicalAlert[] = [];

    // 1. Alergias
    if (patient.allergies) {
      alerts.push({
        type: "danger",
        message: `Alergias registradas: ${patient.allergies}`,
      });
    }

    // 2. Enfermedades crónicas
    if (patient.medical_history) {
      alerts.push({
        type: "warning",
        message: `Antecedentes médicos relevantes: ${patient.medical_history}`,
      });
    }

    // 3. Cirugías recientes (< 6 meses)
    if (patient.surgeries?.length > 0) {
      const recent = patient.surgeries.filter((s: any) => {
        const diff =
          (Date.now() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24 * 30);
        return diff < 6;
      });

      if (recent.length > 0) {
        alerts.push({
          type: "warning",
          message: `Cirugías recientes: ${recent
            .map((s: any) => s.name)
            .join(", ")}`,
        });
      }
    }

    // 4. Hábitos de riesgo
    const risky = patient.habits?.filter((h: any) =>
      ["tabaquismo", "alcohol", "drogas"].includes(h.type.toLowerCase())
    );

    if (risky?.length > 0) {
      alerts.push({
        type: "warning",
        message: `Hábitos de riesgo: ${risky
          .map((h: any) => h.type)
          .join(", ")}`,
      });
    }

    // 5. Predisposiciones genéticas
    if (patient.genetic_predispositions?.length > 0) {
      alerts.push({
        type: "info",
        message: `Predisposiciones genéticas: ${patient.genetic_predispositions
          .map((g: any) => g.name)
          .join(", ")}`,
      });
    }

    // 6. Vacunas faltantes
    const missing = vaccinationSchedule.filter((dose: any) => {
      return !vaccinations.some(
        (v: any) =>
          v.vaccine.id === dose.vaccine.id &&
          v.dose_number === dose.dose_number
      );
    });

    if (missing.length > 0) {
      alerts.push({
        type: "warning",
        message: `Vacunas faltantes: ${missing
          .map((m: any) => `${m.vaccine.code} dosis ${m.dose_number}`)
          .join(", ")}`,
      });
    }

    return alerts;
  }, [patient, vaccinations, vaccinationSchedule]);

  // --- MANEJO DE ALERTAS MANUALES ---
  const handleSave = (data: ClinicalAlert) => {
    if (editing) {
      setManualAlerts((prev) =>
        prev.map((a) => (a.id === editing.id ? { ...a, ...data } : a))
      );
    } else {
      setManualAlerts((prev) => [
        ...prev,
        { id: Date.now(), ...data },
      ]);
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: number) => {
    setManualAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const allAlerts: ClinicalAlert[] = [...autoAlerts, ...manualAlerts];

  const color: Record<AlertType, string> = {
    danger: "bg-red-100 border-red-300 text-red-800",
    warning: "bg-yellow-100 border-yellow-300 text-yellow-800",
    info: "bg-blue-100 border-blue-300 text-blue-800",
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white">
          Alertas clínicas
        </h3>

        <button
          className="px-3 py-1.5 bg-[#0d2c53] text-white rounded-md text-sm"
          onClick={() => setModalOpen(true)}
        >
          Añadir alerta
        </button>
      </div>

      {allAlerts.length === 0 ? (
        <p className="text-sm text-gray-500">No hay alertas clínicas.</p>
      ) : (
        <ul className="space-y-3">
          {allAlerts.map((alert) => (
            <li
              key={alert.id ?? alert.message}
              className={`p-3 border rounded-md ${color[alert.type]}`}
            >
              <div className="flex justify-between">
                <p className="text-sm">{alert.message}</p>

                {alert.id && (
                  <div className="flex gap-2">
                    <button
                      className="text-blue-700 text-sm"
                      onClick={() => {
                        setEditing(alert);
                        setModalOpen(true);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="text-red-700 text-sm"
                      onClick={() => handleDelete(alert.id!)}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initial={editing || undefined}
      />
    </div>
  );
}
