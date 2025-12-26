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

type BackgroundType = "personal" | "family" | "genetic" | "habit";
type ModalType = BackgroundType | "allergy";

interface ClinicalBackground {
  id: number;
  type: BackgroundType;
  condition: string;
  relative?: string;
  status?: string;
  source?: string;
  notes?: string;
}

interface Habit {
  id: number;
  type: string;
  frequency: string;
  impact?: string;
  description?: string;
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
  habit: "Hábitos",
};

const backgroundIcons: Record<BackgroundType, React.ElementType> = {
  personal: UserIcon,
  family: UsersIcon,
  genetic: SparklesIcon,
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
  const [modalType, setModalType] = useState<ModalType>("personal");
  const [modalInitial, setModalInitial] = useState<any>(undefined);

  const grouped: Record<BackgroundType, ClinicalBackground[]> = {
    personal: [],
    family: [],
    genetic: [],
    habit: [],
  };

  backgrounds.forEach((item) => {
    if (grouped[item.type]) {
      grouped[item.type].push(item);
    }
  });

  const handleDeleteBackground = async (item: any) => {
    try {
      if (item.kind === "habit") {
        await apiFetch(`patients/${patientId}/habits/${item.id}/`, { method: "DELETE" });
      } else if (item.type === "genetic") {
        await apiFetch(`patients/${patientId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genetic_predispositions: backgrounds
              .filter((b) => b.type === "genetic" && b.id !== item.id)
              .map((b) => b.id),
          }),
        });
      } else if (item.type === "allergy") {
        await apiFetch(`patients/${patientId}/allergies/${item.id}/`, { method: "DELETE" });
      } else {
        let endpoint = "";
        if (item.type === "personal") endpoint = `personal-history/${item.id}/`;
        if (item.type === "family") endpoint = `family-history/${item.id}/`;
        await apiFetch(endpoint, { method: "DELETE" });
      }
      onRefresh?.();
    } catch (err) {
      console.error("Error eliminando registro:", err);
    }
  };

  const handleSave = async (type: ModalType, payload: any) => {
    const isEdit = modalInitial?.id;
    let endpoint = "";
    if (type === "personal") endpoint = "personal-history/";
    if (type === "family") endpoint = "family-history/";
    if (type === "genetic") endpoint = "genetic-predispositions/";
    if (type === "habit") endpoint = `patients/${patientId}/habits/`;

    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit
      ? type === "habit"
        ? `patients/${patientId}/habits/${modalInitial.id}/`
        : `${endpoint}${modalInitial.id}/`
      : endpoint;

    try {
      let res: any;
      if (type === "genetic") {
        // lógica genética...
      } else if (type === "allergy") {
        const allergyBody = {
          name: payload.name,
          severity: payload.severity,
          source: payload.source,
          notes: payload.notes,
        };
        const allergyUrl = isEdit
          ? `patients/${patientId}/allergies/${modalInitial.id}/`
          : `patients/${patientId}/allergies/`;
        res = await apiFetch(allergyUrl, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(allergyBody),
        });
      } else if (type === "habit") {
        const habitBody = {
          type: payload.type,
          description: payload.description,
          frequency: payload.frequency,
          impact: payload.impact,
          notes: payload.notes,
        };
        res = await apiFetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(habitBody),
        });
      } else {
        res = await apiFetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      console.log("[SAVE] Response:", res);
      setModalOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error("[SAVE] Error guardando registro:", err);
    }
  };

    return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white">Perfil clínico</h3>

      {/* Renderizamos primero personales, familiares y genéticos */}
      {(["personal", "family", "genetic"] as BackgroundType[]).map((type) => {
        const Icon = backgroundIcons[type];
        const items = grouped[type];
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
                      <li key={item.id} className="p-2 border rounded-md text-sm bg-gray-50 dark:bg-gray-700">
                        <div className="flex justify-between">
                          <span className="font-medium">{item.condition || item.name || item.type}</span>
                          <span className="text-xs text-gray-500">{item.status || "—"}</span>
                        </div>
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
                          <button
                            className="text-red-700 text-xs"
                            onClick={() => handleDeleteBackground(item)}
                          >
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

      {/* Bloque separado para alergias (antes que hábitos) */}
      <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <button
          className="w-full flex justify-between items-center px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          onClick={() => setExpanded(expanded === "allergy" ? null : "allergy")}
        >
          <span className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-[#0d2c53]" />
            Alergias
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-300">{allergies.length} registro(s)</span>
        </button>

        {expanded === "allergy" && (
          <div className="px-3 pt-3 pb-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2">
            {allergies.length === 0 ? (
              <p className="text-xs text-gray-500">No hay registros.</p>
            ) : (
              <ul className="space-y-2">
                {allergies.map((item) => (
                  <li key={item.id} className="p-2 border rounded-md text-sm bg-gray-50 dark:bg-gray-700">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-gray-500">{item.severity || "—"}</span>
                    </div>
                    {item.source && <p className="text-xs text-gray-600">Fuente: {item.source}</p>}
                    {item.notes && <p className="text-xs text-gray-600">{item.notes}</p>}
                    <div className="flex gap-2 mt-1">
                      <button
                        className="text-blue-700 text-xs"
                        onClick={() => {
                          setModalType("allergy");
                          setModalInitial(item);
                          setModalOpen(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="text-red-700 text-xs"
                        onClick={() => handleDeleteBackground({ ...item, type: "allergy" })}
                      >
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
                  setModalType("allergy");
                  setModalInitial(undefined);
                  setModalOpen(true);
                }}
              />
            </div>
          </div>
        )}
      </div>
            {/* Finalmente, Hábitos */}
      <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <button
          className="w-full flex justify-between items-center px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          onClick={() => setExpanded(expanded === "habit" ? null : "habit")}
        >
          <span className="flex items-center gap-2">
            <FireIcon className="w-4 h-4 text-[#0d2c53]" />
            Hábitos
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-300">{habits.length} registro(s)</span>
        </button>

        {expanded === "habit" && (
          <div className="px-3 pt-3 pb-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2">
            {habits.length === 0 ? (
              <p className="text-xs text-gray-500">No hay registros.</p>
            ) : (
              <ul className="space-y-2">
                {habits.map((item: any) => (
                  <li key={item.id} className="p-2 border rounded-md text-sm bg-gray-50 dark:bg-gray-700">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.type}</span>
                      <span className="text-xs text-gray-500">{item.frequency || "—"}</span>
                    </div>
                    {item.description && <p className="text-xs text-gray-600">{item.description}</p>}
                    {item.notes && <p className="text-xs text-gray-600">{item.notes}</p>}
                    <div className="flex gap-2 mt-1">
                      <button
                        className="text-blue-700 text-xs"
                        onClick={() => {
                          setModalType("habit");
                          setModalInitial({ ...item, kind: "habit" });
                          setModalOpen(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="text-red-700 text-xs"
                        onClick={() => handleDeleteBackground({ ...item, kind: "habit" })}
                      >
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
                  setModalType("habit");
                  setModalInitial(undefined);
                  setModalOpen(true);
                }}
              />
            </div>
          </div>
        )}
      </div>

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
