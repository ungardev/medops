// src/components/Patients/sections/ImmunizationScheduleModal.tsx
import React, { useState } from "react";
import { VaccineDose } from "../../../types/patients"; // 👈 FIX: usar tipo global

interface Props {
  open: boolean;
  onClose: () => void;
  schedule: VaccineDose[];
  onRegisterDose?: (dose: VaccineDose) => void;
}

export default function ImmunizationScheduleModal({
  open,
  onClose,
  schedule,
  onRegisterDose,
}: Props) {
  const [highlightedCell, setHighlightedCell] = useState<string | null>(null);

  if (!open) return null;

  // Extraer vacunas únicas y edades únicas
  const uniqueVaccines = Array.from(
    new Map(schedule.map((d) => [d.vaccine.code, d.vaccine])).values()
  );
  const uniqueAges = Array.from(new Set(schedule.map((d) => d.age)));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Navegación por teclado podría implementarse aquí si se requiere
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-6xl p-6 overflow-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#0d2c53] dark:text-white">
            Immunization Schedule
          </h2>
          <button
            onClick={onClose}
            className="text-red-600 dark:text-red-400 hover:underline"
          >
            Close
          </button>
        </div>

        {/* Grid estilo cartón oficial */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100">
                <th className="px-2 py-2 border">Age</th>
                {uniqueVaccines.map((vaccine) => (
                  <th key={vaccine.code} className="px-2 py-2 border">
                    {vaccine.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uniqueAges.map((age) => (
                <tr key={age}>
                  <td className="px-2 py-2 border font-medium">{age}</td>
                  {uniqueVaccines.map((vaccine) => {
                    const dose = schedule.find(
                      (d) => d.age === age && d.vaccine.code === vaccine.code
                    );
                    const status = dose?.applied
                      ? "Applied"
                      : dose?.expected
                      ? "Pending"
                      : "Not required";

                    const cellKey = `${age}-${vaccine.code}`;

                    return (
                      <td
                        key={cellKey}
                        className={`px-2 py-2 border text-center cursor-pointer ${
                          highlightedCell === cellKey
                            ? "bg-[#0d2c53]/20 dark:bg-gray-600"
                            : dose?.applied
                            ? "bg-green-100 dark:bg-green-700"
                            : dose?.expected
                            ? "bg-yellow-100 dark:bg-yellow-700"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}
                        onMouseEnter={() => setHighlightedCell(cellKey)}
                        onClick={() => dose && onRegisterDose?.(dose)}
                      >
                        {dose ? dose.dose_number : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          © 2025 MedOps — Schedule based on SVPP
        </div>
      </div>
    </div>
  );
}
