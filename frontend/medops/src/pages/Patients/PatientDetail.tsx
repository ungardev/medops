// src/pages/PatientDetail.tsx
import { useParams } from "react-router-dom";
import { usePatient } from "../../hooks/patients/usePatient";

import { Tabs, Tab } from "../../components/ui/Tabs";

import PatientInfoTab from "../../components/Patients/PatientInfoTab";
import PatientConsultationsTab from "../../components/Patients/PatientConsultationsTab";
import PatientDocumentsTab from "../../components/Patients/PatientDocumentsTab";
import PatientPaymentsTab from "../../components/Patients/PatientPaymentsTab";
import PatientPendingAppointmentsTab from "../../components/Patients/PatientPendingAppointmentsTab";
import PatientEventsTab from "../../components/Patients/PatientEventsTab";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);

  const { data: patient, isLoading, error } = usePatient(patientId);

  if (isLoading) return <p className="text-sm text-gray-600 dark:text-gray-400">Cargando paciente...</p>;
  if (error) return <p className="text-sm text-red-600">Error al cargar paciente</p>;
  if (!patient) return <p className="text-sm text-gray-600 dark:text-gray-400">No se encontró el paciente</p>;

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Detalle del Paciente</h2>
        <h3 className="text-sm text-gray-600 dark:text-gray-400">{patient.full_name}</h3>
      </div>

      {/* Tabs con estilo homogéneo */}
      <Tabs
        defaultTab="info"
        className="border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300"
      >
        <Tab id="info" label="Información">
          <PatientInfoTab patient={patient} />
        </Tab>
        <Tab id="consultas" label="Consultas">
          <PatientConsultationsTab patient={patient} />
        </Tab>
        <Tab id="documentos" label="Documentos">
          <PatientDocumentsTab patient={patient} />
        </Tab>
        <Tab id="pagos" label="Pagos">
          <PatientPaymentsTab patient={patient} />
        </Tab>
        <Tab id="citas" label="Citas pendientes">
          <PatientPendingAppointmentsTab patient={patient} />
        </Tab>
        <Tab id="eventos" label="Eventos">
          <PatientEventsTab patient={patient} />
        </Tab>
      </Tabs>
    </div>
  );
}
