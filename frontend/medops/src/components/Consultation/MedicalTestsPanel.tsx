// src/components/Consultation/MedicalTestsPanel.tsx
import { useState, useEffect } from "react";
import {
  useMedicalTest,
  useCreateMedicalTest,
  useUpdateMedicalTest,
  useDeleteMedicalTest,
} from "../../hooks/consultations/useMedicalTest";

export interface MedicalTestsPanelProps {
  appointmentId: number;
  diagnosisId?: number;   // ✅ diagnosis opcional
  readOnly?: boolean;
}

export default function MedicalTestsPanel({ appointmentId, diagnosisId, readOnly = false }: MedicalTestsPanelProps) {
  const { data, isLoading } = useMedicalTest(appointmentId);
  const { mutate: createTest } = useCreateMedicalTest();
  const { mutate: updateTest } = useUpdateMedicalTest();
  const { mutate: deleteTest } = useDeleteMedicalTest();

  // ✅ Blindaje: si data no es array, usamos []
  const tests = Array.isArray(data) ? data : [];

  // 🧠 Debug institucional
  useEffect(() => {
    console.debug("🧠 appointmentId recibido en MedicalTestsPanel:", appointmentId);
    console.debug("📦 Datos recibidos en useMedicalTest:", data);
  }, [appointmentId, data]);

  const [testType, setTestType] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "stat">("routine");
  const [status, setStatus] = useState<"pending" | "completed" | "cancelled">("pending");

  const handleAdd = () => {
    if (!testType || readOnly) return;

    const payload: any = {
      appointment: appointmentId,
      test_type: testType,
      description,
      urgency,
      status,
    };

    if (diagnosisId) {
      payload.diagnosis = diagnosisId; // ✅ se envía diagnosis cuando existe
    }

    console.debug("📤 Creando examen médico:", payload);
    createTest(payload);

    setTestType("");
    setDescription("");
    setUrgency("routine");
    setStatus("pending");
  };
    return (
    <div className="rounded-lg shadow-lg p-3 sm:p-4 bg-white dark:bg-gray-800">
      <h3 className="text-base sm:text-lg font-semibold text-[#0d2c53] dark:text-white mb-2">
        Órdenes de Exámenes Médicos
      </h3>

      {isLoading && (
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Cargando exámenes...</p>
      )}

      <ul className="mb-4 space-y-1">
        {tests.length === 0 ? (
          <li className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Sin exámenes registrados
          </li>
        ) : (
          tests.map((t: any, index: number) => (
            <li
              key={t.id ?? index}
              className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-200 dark:border-gray-700 py-2 text-xs sm:text-sm"
            >
              <div>
                <strong className="text-[#0d2c53] dark:text-white">
                  {t.test_type_display || t.test_type || "—"}
                </strong> — {t.description || "Sin descripción"}
                <span className="ml-0 sm:ml-2 text-gray-600 dark:text-gray-400">
                  ({t.urgency_display || t.urgency || "—"} / {t.status_display || t.status || "—"})
                </span>
                <span className="ml-0 sm:ml-2 text-[#0d2c53] dark:text-blue-400">
                  {t.diagnosis ? `Dx: ${t.diagnosis}` : "Sin diagnóstico"}
                </span>
              </div>
              {!readOnly && (
                <button
                  className="mt-2 sm:mt-0 px-2 sm:px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors text-xs sm:text-sm"
                  onClick={() => deleteTest({ id: t.id, appointment: appointmentId })}
                >
                  Eliminar
                </button>
              )}
            </li>
          ))
        )}
      </ul>

      {!readOnly && (
        <div className="flex flex-col gap-2">
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          >
            <option value="">-- Seleccionar tipo de examen --</option>
            <option value="blood_test">Análisis de sangre</option>
            <option value="urine_test">Análisis de orina</option>
            <option value="stool_test">Análisis de heces</option>
            <option value="biopsy">Biopsia</option>
            <option value="genetic_test">Prueba genética</option>
            <option value="microbiology_culture">Cultivo microbiológico</option>
            <option value="xray">Rayos X</option>
            <option value="ultrasound">Ecografía</option>
            <option value="ct_scan">Tomografía (TC)</option>
            <option value="mri">Resonancia magnética</option>
            <option value="ecg">Electrocardiograma</option>
            <option value="stress_test">Ergometría</option>
            <option value="audiometry">Audiometría</option>
            <option value="spirometry">Espirometría</option>
            <option value="physical_exam">Examen físico</option>
            <option value="eye_exam">Examen visual</option>
            <option value="dental_exam">Examen dental</option>
            <option value="gynecological_exam">Examen ginecológico</option>
            <option value="prostate_exam">Examen prostático</option>
          </select>

          <textarea
            placeholder="Notas clínicas para este examen"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />

          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as any)}
            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          >
            <option value="routine">Rutina</option>
            <option value="urgent">Urgente</option>
            <option value="stat">Inmediato (STAT)</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          >
            <option value="pending">Pendiente</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>

          <button
            onClick={handleAdd}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors self-start"
          >
            + Agregar examen
          </button>
        </div>
      )}
    </div>
  );
}
