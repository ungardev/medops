// src/components/Consultation/MedicalTestsPanel.tsx
import { useState } from "react";
import {
  useMedicalTest,
  useCreateMedicalTest,
  useUpdateMedicalTest,
  useDeleteMedicalTest,
} from "../../hooks/consultations/useMedicalTest";

interface MedicalTestsPanelProps {
  appointmentId: number;
}

export default function MedicalTestsPanel({ appointmentId }: MedicalTestsPanelProps) {
  const { data: tests = [], isLoading } = useMedicalTest(appointmentId);
  const { mutate: createTest } = useCreateMedicalTest();
  const { mutate: updateTest } = useUpdateMedicalTest();
  const { mutate: deleteTest } = useDeleteMedicalTest();

  const [testType, setTestType] = useState("");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    if (!testType) return;
    createTest({ appointment: appointmentId, test_type: testType, description });
    setTestType("");
    setDescription("");
  };

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-2">Órdenes de Exámenes Médicos</h3>

      {isLoading && <p>Cargando exámenes...</p>}

      <ul className="mb-4">
        {tests.length === 0 && <li className="text-muted">Sin exámenes registrados</li>}
        {tests.map((t: any) => (
          <li key={t.id} className="flex justify-between items-center border-b py-1">
            <div>
              <strong>{t.test_type_display}</strong> — {t.description || "Sin descripción"}
              <span className="ml-2 text-sm text-muted">({t.status})</span>
            </div>
            <button
              className="btn-danger btn-sm"
              onClick={() => deleteTest({ id: t.id, appointment: appointmentId })}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <select
          value={testType}
          onChange={(e) => setTestType(e.target.value)}
          className="input"
        >
          <option value="">-- Seleccionar tipo de examen --</option>
          <option value="blood_test">Análisis de sangre</option>
          <option value="urine_test">Análisis de orina</option>
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
          className="textarea"
        />

        <button onClick={handleAdd} className="btn-primary self-start">
          + Agregar examen
        </button>
      </div>
    </div>
  );
}
