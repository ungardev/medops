// src/components/Consultation/MedicalTestsPanel.tsx
import { useState } from "react";
import {
  useMedicalTest,
  useCreateMedicalTest,
  useUpdateMedicalTest,
  useDeleteMedicalTest,
} from "../../hooks/consultations/useMedicalTest";

export interface MedicalTestsPanelProps {
  appointmentId: number;
  readOnly?: boolean;
}

export default function MedicalTestsPanel({ appointmentId, readOnly = false }: MedicalTestsPanelProps) {
  const { data, isLoading } = useMedicalTest(appointmentId);
  const { mutate: createTest } = useCreateMedicalTest();
  const { mutate: updateTest } = useUpdateMedicalTest();
  const { mutate: deleteTest } = useDeleteMedicalTest();

  // ✅ Blindaje: si data no es array, usamos []
  const tests = Array.isArray(data) ? data : [];

  const [testType, setTestType] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "stat">("routine");
  const [status, setStatus] = useState<"pending" | "completed" | "cancelled">("pending");

  const handleAdd = () => {
    if (!testType || readOnly) return;

    const payload = {
      appointment: appointmentId,
      test_type: testType,
      description,
      urgency,
      status,
    };

    // 🔹 Debug institucional para validar que appointmentId y test_type llegan bien
    console.debug("📤 Creando examen médico:", payload);

    createTest(payload);

    // reset
    setTestType("");
    setDescription("");
    setUrgency("routine");
    setStatus("pending");
  };

  return (
    <div className="rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
        Órdenes de Exámenes Médicos
      </h3>

      {isLoading && (
        <p className="text-sm text-gray-600 dark:text-gray-400">Cargando exámenes...</p>
      )}

      <ul className="mb-4">
        {tests.length === 0 && (
          <li className="text-sm text-gray-600 dark:text-gray-400">
            Sin exámenes registrados
          </li>
        )}
        {tests.map((t: any) => (
          <li
            key={t.id}
            className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 py-2"
          >
            <div>
              <strong>{t.test_type_display}</strong> — {t.description || "Sin descripción"}
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                ({t.urgency} / {t.status})
              </span>
            </div>
            {!readOnly && (
              <button
                className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                onClick={() => deleteTest({ id: t.id, appointment: appointmentId })}
              >
                Eliminar
              </button>
            )}
          </li>
        ))}
      </ul>

      {!readOnly && (
        <div className="flex flex-col gap-2">
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">-- Seleccionar tipo de examen --</option>
            <option value="blood_test">Análisis de sangre</option>
            <option value="urine_test">Análisis de orina</option>
            <option value="stool_test">Análisis de heces</option> {/* ✅ agregado */}
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
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="routine">Rutina</option>
            <option value="urgent">Urgente</option>
            <option value="stat">Inmediato (STAT)</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="pending">Pendiente</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>

          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors self-start"
          >
            + Agregar examen
          </button>
        </div>
      )}
    </div>
  );
}
