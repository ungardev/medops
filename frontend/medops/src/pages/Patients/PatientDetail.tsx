// src/pages/PatientDetail.tsx
import { useParams } from "react-router-dom";
import { usePatient } from "../../hooks/patients/usePatient"; // ✅ usamos el hook con React Query

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

  // ✅ Hook React Query
  const { data: patient, isLoading, error } = usePatient(patientId);

  if (isLoading) return <p>Cargando paciente...</p>;
  if (error) return <p className="text-danger">Error al cargar paciente</p>;
  if (!patient) return <p>No se encontró el paciente</p>;

    return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Detalle del Paciente</h2>
          <h3 className="text-muted">{patient.full_name}</h3>
        </div>
      </div>

      {/* Tabs con botones estilizados */}
      <Tabs defaultTab="info" className="tabs">
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
