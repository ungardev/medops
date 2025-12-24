// src/components/Patients/sections/AlertsSection.tsx
import React, { useMemo, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import AlertModal from "./AlertModal";
import { useClinicalAlerts } from "../../../hooks/patients/useClinicalAlerts";

type AlertType = "danger" | "warning" | "info";

interface AutoAlert {
  type: AlertType;
  message: React.ReactNode;
}

interface ManualAlert {
  id: number;
  type: AlertType;
  message: string;
}

interface Props {
  patient: any;
  backgrounds: any[];
  allergies?: any[];
  habits: any[];
  surgeries: any[];
  vaccinations: any[];
  vaccinationSchedule: any[];
  onChangeTab?: (id: string) => void;
}

function isRecent(date?: string) {
  if (!date) return false;
  const diffMonths =
    (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 30);
  return diffMonths < 6;
}

export default function AlertsSection({
  patient,
  backgrounds,
  allergies = [],
  habits,
  surgeries,
  vaccinations,
  vaccinationSchedule,
  onChangeTab,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManualAlert | null>(null);

  const { list, create, update, remove } = useClinicalAlerts(patient.id);

  // --- ALERTAS AUTOMÁTICAS ---
  const autoAlerts: AutoAlert[] = useMemo(() => {
    const alerts: AutoAlert[] = [];

    if (allergies.length > 0) {
      alerts.push({
        type: "danger",
        message: (
          <div>
            Alergias registradas: {allergies.map((a) => a.name).join(", ")}
            <button
              onClick={() => onChangeTab?.("clinical-profile")}
              className="ml-2 underline text-blue-700"
            >
              Editar en perfil clínico
            </button>
          </div>
        ),
      });
    }

    const medicalHistory = backgrounds.filter(
      (a) => a.type === "personal" || a.type === "family"
    );
    if (medicalHistory.length > 0) {
      alerts.push({
        type: "warning",
        message: (
          <div>
            Antecedentes médicos relevantes:{" "}
            {medicalHistory.map((a) => a.condition).join(", ")}
            <button
              onClick={() => onChangeTab?.("clinical-profile")}
              className="ml-2 underline text-blue-700"
            >
              Editar en perfil clínico
            </button>
          </div>
        ),
      });
    }

    const riskyHabits = habits.filter((h) =>
      ["smoking", "alcohol", "drugs"].includes(h.type)
    );
    if (riskyHabits.length > 0) {
      alerts.push({
        type: "warning",
        message: (
          <div>
            Hábitos de riesgo: {riskyHabits.map((h) => h.type).join(", ")}
            <button
              onClick={() => onChangeTab?.("clinical-profile")}
              className="ml-2 underline text-blue-700"
            >
              Editar hábitos
            </button>
          </div>
        ),
      });
    }

    const genetics = backgrounds.filter((a) => a.type === "genetic");
    if (genetics.length > 0) {
      alerts.push({
        type: "info",
        message: (
          <div>
            Predisposiciones genéticas: {genetics.map((g) => g.condition).join(", ")}
            <button
              onClick={() => onChangeTab?.("clinical-profile")}
              className="ml-2 underline text-blue-700"
            >
              Editar en perfil clínico
            </button>
          </div>
        ),
      });
    }

    const recentSurgeries = surgeries.filter((s) => isRecent(s.date));
    if (recentSurgeries.length > 0) {
      alerts.push({
        type: "warning",
        message: (
          <div>
            Cirugías recientes: {recentSurgeries.map((s) => s.name).join(", ")}
            <button
              onClick={() => onChangeTab?.("surgeries")}
              className="ml-2 underline text-blue-700"
            >
              Ver cirugías
            </button>
          </div>
        ),
      });
    }

    const missing = vaccinationSchedule.filter(
      (dose: any) =>
        !vaccinations.some(
          (v: any) =>
            v.vaccine.id === dose.vaccine.id &&
            v.dose_number === dose.dose_number
        )
    );
    if (missing.length > 0) {
      alerts.push({
        type: "warning",
        message: (
          <div>
            Tiene {missing.length} vacunas faltantes según el esquema SVPP
            <button
              onClick={() => onChangeTab?.("vaccination")}
              className="ml-2 underline text-blue-700"
            >
              Ir a vacunación
            </button>
          </div>
        ),
      });
    }

    return alerts;
  }, [backgrounds, allergies, habits, surgeries, vaccinations, vaccinationSchedule, onChangeTab]);

  // --- ALERTAS MANUALES ---
  const handleSave = (data: { type: AlertType; message: string }) => {
    if (editing) {
      update.mutate({ id: editing.id, data });
    } else {
      create.mutate(data);
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: number) => {
    remove.mutate(id);
  };

  const manualAlerts: ManualAlert[] = (list.data as ManualAlert[]) ?? [];
  const allAlerts: (AutoAlert | ManualAlert)[] = [...autoAlerts, ...manualAlerts];

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
        <PlusIcon
          className="w-6 h-6 text-white bg-[#0d2c53] rounded-md p-1 cursor-pointer hover:bg-[#0b2444]"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        />
      </div>

      {allAlerts.length === 0 ? (
        <p className="text-sm text-gray-500">No hay alertas clínicas.</p>
      ) : (
        <ul className="space-y-3">
          {allAlerts.map((alert, index) => {
            const type = alert.type as AlertType;
            const key = "id" in alert ? `manual-${alert.id}` : `auto-${index}`;
            return (
              <li
                key={key}
                className={`p-3 border rounded-md whitespace-pre-line ${color[type]}`}
              >
                <div className="flex justify-between">
                  <div className="text-sm">{alert.message}</div>
                  {"id" in alert && (
                    <div className="flex gap-2">
                      <button
                        className="text-blue-700 text-sm"
                        onClick={() => {
                          setEditing(alert as ManualAlert);
                          setModalOpen(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="text-red-700 text-sm"
                        onClick={() => handleDelete((alert as ManualAlert).id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
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
