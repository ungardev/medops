// src/pages/PatientDetail.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPatient } from "api/patients";
import { Patient } from "types/patients";

import { Tabs, Tab } from "../../components/ui/Tabs";

import PatientInfoTab from "../../components/Patients/PatientInfoTab";
import PatientConsultationsTab from "../../components/Patients/PatientConsultationsTab";
import PatientDocumentsTab from "../../components/Patients/PatientDocumentsTab";
import PatientPaymentsTab from "../../components/Patients/PatientPaymentsTab";
import PatientPendingAppointmentsTab from "../../components/Patients/PatientPendingAppointmentsTab";
import PatientEventsTab from "../../components/Patients/PatientEventsTab";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getPatient(Number(id))
      .then(setPatient)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Cargando paciente...</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;
  if (!patient) return <p>No se encontró el paciente</p>;

  const patientId = Number(id);

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
          <PatientInfoTab patientId={patientId} />
        </Tab>
        <Tab id="consultas" label="Consultas">
          <PatientConsultationsTab patientId={patientId} />
        </Tab>
        <Tab id="documentos" label="Documentos">
          <PatientDocumentsTab patientId={patientId} />
        </Tab>
        <Tab id="pagos" label="Pagos">
          <PatientPaymentsTab patientId={patientId} />
        </Tab>
        <Tab id="citas" label="Citas pendientes">
          <PatientPendingAppointmentsTab patientId={patientId} />
        </Tab>
        <Tab id="eventos" label="Eventos">
          <PatientEventsTab patientId={patientId} />
        </Tab>
      </Tabs>
    </div>
  );
}
