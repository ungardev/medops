// src/components/Patients/sections/ClinicalProfileSection.tsx
import React, { useState } from "react";
import {
  UserIcon,
  UsersIcon,
  SparklesIcon,
  FireIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";

type BackgroundType = "personal" | "familiar" | "genetico";
type HabitType = "tabaquismo" | "alcohol" | "drogas" | "ejercicio" | "alimentacion";
type HabitFrequency = "diario" | "ocasional" | "semanal" | "mensual";
type HabitImpact = "alto" | "medio" | "bajo";

interface ClinicalBackground {
  id: number;
  type: BackgroundType;
  condition: string;
  relation?: "padre" | "madre" | "hermano" | "hijo";
  status: "activo" | "resuelto" | "sospecha" | "positivo" | "negativo";
  source?: "historia_clinica" | "prueba_genetica" | "verbal";
  notes?: string;
}

interface Habit {
  id: number;
  type: HabitType;
  frequency: HabitFrequency;
  impact?: HabitImpact;
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
  antecedentes: ClinicalBackground[];
  allergies?: Allergy[];               // 👈 ahora opcional
  habits?: Habit[];                     // 👈 ahora opcional
  patientId: number;
  onRefresh?: () => void;
  onCreateAntecedente?: (type: BackgroundType) => void;
  onCreateHabito?: () => void;
  onCreateAlergia?: () => void;
}

const antecedentesLabels: Record<BackgroundType, string> = {
  personal: "Antecedentes personales",
  familiar: "Antecedentes familiares",
  genetico: "Predisposiciones genéticas",
};

const antecedentesIcons: Record<BackgroundType, React.ElementType> = {
  personal: UserIcon,
  familiar: UsersIcon,
  genetico: SparklesIcon,
};

const impactColors: Record<HabitImpact, string> = {
  alto: "bg-red-100 border-red-300 text-red-800",
  medio: "bg-yellow-100 border-yellow-300 text-yellow-800",
  bajo: "bg-green-100 border-green-300 text-green-800",
};

export default function ClinicalProfileSection({
  antecedentes,
  allergies = [],   // 👈 valor por defecto
  habits = [],      // 👈 valor por defecto
  patientId,
  onRefresh,
  onCreateAntecedente,
  onCreateHabito,
  onCreateAlergia,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const grouped: Record<BackgroundType, ClinicalBackground[]> = {
    personal: [],
    familiar: [],
    genetico: [],
  };

  antecedentes.forEach((item) => {
    grouped[item.type].push(item);
  });

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white">
        Clinical Profile
      </h3>

      {/* Secciones de antecedentes */}
      {(["personal", "familiar", "genetico"] as BackgroundType[]).map((type) => {
        const Icon = antecedentesIcons[type];
        return (
          <div
            key={type}
            className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <button
              className="w-full flex justify-between items-center px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => setExpanded(expanded === type ? null : type)}
            >
              <span className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#0d2c53]" />
                {antecedentesLabels[type]}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {grouped[type].length} registro(s)
              </span>
            </button>

            {expanded === type && (
              <div className="px-3 pt-3 pb-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2">
                {grouped[type].length === 0 ? (
                  <p className="text-xs text-gray-500">No hay registros.</p>
                ) : (
                  <ul className="space-y-2">
                    {grouped[type].map((item) => (
                      <li
                        key={item.id}
                        className="p-2 border rounded-md text-sm bg-gray-50 dark:bg-gray-700"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{item.condition}</span>
                          <span className="text-xs text-gray-500">
                            {item.status}
                          </span>
                        </div>
                        {item.relation && (
                          <p className="text-xs text-gray-600">
                            Relación: {item.relation}
                          </p>
                        )}
                        {item.source && (
                          <p className="text-xs text-gray-600">
                            Fuente: {item.source}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-gray-600">{item.notes}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex justify-start mt-2">
                  <PlusIcon
                    className="w-6 h-6 text-white bg-[#0d2c53] rounded-md p-1 cursor-pointer hover:bg-[#0b2444]"
                    onClick={() => onCreateAntecedente?.(type)}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Sección de alergias */}
      <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <button
          className="w-full flex justify-between items-center px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          onClick={() => setExpanded(expanded === "alergias" ? null : "alergias")}
        >
          <span className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-[#0d2c53]" />
            Alergias
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {allergies.length} registro(s)
          </span>
        </button>

        {expanded === "alergias" && (
          <div className="px-3 pt-3 pb-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2">
            {allergies.length === 0 ? (
              <p className="text-xs text-gray-500">No hay alergias registradas.</p>
            ) : (
              <ul className="space-y-2">
                {allergies.map((item) => (
                  <li
                    key={item.id}
                    className="p-2 border rounded-md text-sm bg-red-50 dark:bg-red-900"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-gray-500">
                        {item.severity || "—"}
                      </span>
                    </div>
                    {item.source && (
                      <p className="text-xs text-gray-600">Fuente: {item.source}</p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-gray-600">{item.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-start mt-2">
              <PlusIcon
                className="w-6 h-6 text-white bg-[#0d2c53] rounded-md p-1 cursor-pointer hover:bg-[#0b2444]"
                onClick={() => onCreateAlergia?.()}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sección de hábitos */}
      <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <button
          className="w-full flex justify-between items-center px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          onClick={() => setExpanded(expanded === "habitos" ? null : "habitos")}
        >
          <span className="flex items-center gap-2">
            <FireIcon className="w-4 h-4 text-[#0d2c53]" />
            Hábitos
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {habits.length} registro(s)
          </span>
        </button>

        {expanded === "habitos" && (
          <div className="px-3 pt-3 pb-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2">
            {habits.length === 0 ? (
              <p className="text-xs text-gray-500">No hay hábitos registrados.</p>
            ) : (
              <ul className="space-y-2">
                {habits.map((item) => (
                  <li
                    key={item.id}
                    className={`p-2 border rounded-md text-sm ${
                      item.impact
                        ? impactColors[item.impact]
                        : "bg-gray-50 dark:bg-gray-700"
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{item.type}</span>
                      <span className="text-xs text-gray-500">
                        {item.frequency}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-gray-600">{item.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-start mt-2">
              <PlusIcon
                className="w-6 h-6 text-white bg-[#0d2c53] rounded-md p-1 cursor-pointer hover:bg-[#0b2444]"
                onClick={onCreateHabito}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
