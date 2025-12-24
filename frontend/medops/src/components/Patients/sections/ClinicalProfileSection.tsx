// src/components/Patients/sections/ClinicalProfileSection.tsx
import React, { useState } from "react";
import {
  UserIcon,
  UsersIcon,
  SparklesIcon,
  FireIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { apiFetch } from "../../../api/client";
import ClinicalBackgroundModal from "./ClinicalBackgroundModal";

type BackgroundType = "personal" | "family" | "genetic" | "allergy" | "habit";

interface ClinicalBackground {
  id: number;
  type: BackgroundType;
  condition: string;
  relative?: string;   // clave correcta según el modelo del backend
  status?: string;
  source?: string;
  notes?: string;
}

interface Habit {
  id: number;
  type: string;
  frequency: string;
  impact?: string;
  notes?: string;
}

interface Allergy {
  id: number;
  name: string;
  severity?: string;
  source?: string;
  notes?: string;
}

interface Props {
  backgrounds?: ClinicalBackground[];
  allergies?: Allergy[];
  habits?: Habit[];
  patientId: number;
  onRefresh?: () => void;
}

const backgroundLabels: Record<BackgroundType, string> = {
  personal: "Antecedentes personales",
  family: "Antecedentes familiares",
  genetic: "Predisposiciones genéticas",
  allergy: "Alergias",
  habit: "Hábitos",
};

const backgroundIcons: Record<BackgroundType, React.ElementType> = {
  personal: UserIcon,
  family: UsersIcon,
  genetic: SparklesIcon,
  allergy: SparklesIcon,
  habit: FireIcon,
};

const impactColors: Record<string, string> = {
  high: "bg-red-100 border-red-300 text-red-800",
  medium: "bg-yellow-100 border-yellow-300 text-yellow-800",
  low: "bg-green-100 border-green-300 text-green-800",
};

export default function ClinicalProfileSection({
  backgrounds = [],
  allergies = [],
  habits = [],
  patientId,
  onRefresh,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<BackgroundType>("personal");
  const [modalInitial, setModalInitial] = useState<any>(undefined);

  const grouped: Record<BackgroundType, ClinicalBackground[]> = {
    personal: [],
    family: [],
    genetic: [],
    allergy: [],
    habit: [],
  };

  backgrounds.forEach((item) => {
    if (grouped[item.type]) {
      grouped[item.type].push(item);
    }
  });

  const handleDeleteBackground = (item: ClinicalBackground) => {
    let endpoint = "";
    if (item.type === "personal") endpoint = `personal-history/${item.id}/`;
    if (item.type === "family") endpoint = `family-history/${item.id}/`;
    if (item.type === "genetic") endpoint = `genetic-predisposition/${item.id}/`;
    if (item.type === "allergy") endpoint = `allergies/${item.id}/`;
    if (item.type === "habit") endpoint = `habits/${item.id}/`;

    apiFetch(endpoint, { method: "DELETE" })
      .then(() => onRefresh?.())
      .catch((err: unknown) => console.error("Error eliminando registro:", err));
  };

  const handleSave = (type: BackgroundType, payload: any) => {
    const isEdit = modalInitial?.id;
    let endpoint = "";
    if (type === "personal") endpoint = "personal-history/";
    if (type === "family") endpoint = "family-history/";
    if (type === "genetic") endpoint = "genetic-predisposition/";
    if (type === "allergy") endpoint = "allergies/";
    if (type === "habit") endpoint = "habits/";

    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit ? `${endpoint}${modalInitial.id}/` : endpoint;

    const body = { ...payload, patient: patientId };
    console.log("[SAVE] URL:", url, "METHOD:", method, "BODY:", body);

    apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" }, // ✅ fuerza JSON
      body: JSON.stringify(body),
    })
      .then((res: any) => {
        console.log("[SAVE] Response:", res);
        setModalOpen(false);
        onRefresh?.();
      })
      .catch((err: unknown) => console.error("[SAVE] Error guardando registro:", err));
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white">Perfil clínico</h3>

      {(Object.keys(backgroundLabels) as BackgroundType[]).map((type) => {
        const Icon = backgroundIcons[type];
        const items = type === "allergy" ? allergies : type === "habit" ? habits : grouped[type];
        return (
          <div key={type} className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <button
              className="w-full flex justify-between items-center px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => setExpanded(expanded === type ? null : type)}
            >
              <span className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#0d2c53]" />
                {backgroundLabels[type]}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-300">{items.length} registro(s)</span>
            </button>

            {expanded === type && (
              <div className="px-3 pt-3 pb-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2">
                {items.length === 0 ? (
                  <p className="text-xs text-gray-500">No hay registros.</p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((item: any) => (
                      <li
                        key={item.id}
                        className={`p-2 border rounded-md text-sm ${
                          item.impact ? impactColors[item.impact] : "bg-gray-50 dark:bg-gray-700"
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{item.condition || item.name || item.type}</span>
                          <span className="text-xs text-gray-500">
                            {item.status || item.frequency || item.severity || "—"}
                          </span>
                        </div>
                        {item.relative && <p className="text-xs text-gray-600">Relación: {item.relative}</p>}
                        {item.source && <p className="text-xs text-gray-600">Fuente: {item.source}</p>}
                        {item.notes && <p className="text-xs text-gray-600">{item.notes}</p>}

                        <div className="flex gap-2 mt-1">
                          <button
                            className="text-blue-700 text-xs"
                            onClick={() => {
                              setModalType(type);
                              setModalInitial(item);
                              setModalOpen(true);
                            }}
                          >
                            Editar
                          </button>
                          <button className="text-red-700 text-xs" onClick={() => handleDeleteBackground(item)}>
                            Eliminar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex justify-start mt-2">
                  <PlusIcon
                    className="w-6 h-6 text-white bg-[#0d2c53] rounded-md p-1 cursor-pointer hover:bg-[#0b2444]"
                    onClick={() => {
                      setModalType(type);
                      setModalInitial(undefined);
                      setModalOpen(true);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <ClinicalBackgroundModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(payload) => handleSave(modalType, payload)}
        initial={modalInitial}
        type={modalType}
      />
    </div>
  );
}