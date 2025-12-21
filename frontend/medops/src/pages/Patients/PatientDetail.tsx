// src/pages/Patients/PatientDetail.tsx
import { useParams, useSearchParams } from "react-router-dom";
import { usePatient } from "../../hooks/patients/usePatient";

import { Tabs, Tab } from "../../components/ui/Tabs";

import PatientInfoTab from "../../components/Patients/PatientInfoTab";
import PatientConsultationsTab from "../../components/Patients/PatientConsultationsTab";
import PatientDocumentsTab from "../../components/Patients/PatientDocumentsTab";
import PatientPaymentsTab from "../../components/Patients/PatientPaymentsTab";
import PatientPendingAppointmentsTab from "../../components/Patients/PatientPendingAppointmentsTab";
import PatientEventsTab from "../../components/Patients/PatientEventsTab";
import VaccinationTab from "../../components/Patients/VaccinationTab";
import SurgeriesTab from "../../components/Patients/SurgeriesTab"; // 👈 nuevo import

function normalizeTab(id?: string): string {
  const map: Record<string, string> = {
    info: "info",
    consultas: "consultas",
    documents: "documentos",
    documentos: "documentos",
    pagos: "pagos",
    citas: "citas",
    events: "eventos",
    eventos: "eventos",
    vacunacion: "vacunacion",
    cirugias: "cirugias", // 👈 soporte explícito para el nuevo tab
  };
  if (!id) return "info";
  return map[id.toLowerCase()] ?? id;
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);

  const { data: patient, isLoading, error } = usePatient(patientId);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = normalizeTab(searchParams.get("tab") ?? "info");

  const setTab = (next: string) => {
    const normalized = normalizeTab(next);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("tab", normalized);
      return p;
    });
  };

  if (isLoading)
    return (
      <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">
        Cargando paciente...
      </p>
    );

  if (error)
    return (
      <p className="text-xs sm:text-sm text-red-600">
        Error al cargar paciente
      </p>
    );

  if (!patient)
    return (
      <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">
        No se encontró el paciente
      </p>
    );

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-[#0d2c53] dark:text-white">
          Detalle del Paciente
        </h2>
        <h3 className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">
          {patient.full_name}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <Tabs
          value={currentTab}
          onChange={setTab}
          className="border-b border-gray-200 dark:border-gray-700 text-xs sm:text-sm font-medium text-[#0d2c53] dark:text-gray-300"
        >
          <Tab id="info" label="Información">
            <PatientInfoTab patientId={patientId} />
          </Tab>

          <Tab id="consultas" label="Consultas">
            <PatientConsultationsTab patient={patient} />
          </Tab>

          <Tab id="documentos" label="Documentos">
            <PatientDocumentsTab patient={patient} />
          </Tab>

          <Tab id="vacunacion" label="Vacunación">
            <VaccinationTab patientId={patientId} onRefresh={() => {}} />
          </Tab>

          <Tab id="cirugias" label="Cirugías">
            <SurgeriesTab patientId={patientId} onRefresh={() => {}} />
          </Tab>

          <Tab id="citas" label="Citas pendientes">
            <PatientPendingAppointmentsTab patient={patient} />
          </Tab>

          <Tab id="pagos" label="Pagos">
            <PatientPaymentsTab patient={patient} />
          </Tab>

          <Tab id="eventos" label="Eventos">
            <PatientEventsTab patient={patient} />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
