export default function Consultation() {
  const { data: currentConsultation, isLoading } = useCurrentConsultation();
  const { mutate: updateAppointmentStatus } = useUpdateAppointmentStatus();
  const { mutate: updateAppointmentNotes } = useUpdateAppointmentNotes();
  const { mutate: createDiagnosis } = useCreateDiagnosis();
  const { mutate: createTreatment } = useCreateTreatment();
  const { mutate: createPrescription } = useCreatePrescription();

  if (isLoading) return <p>Cargando consulta...</p>;
  if (!currentConsultation) return <p>No hay paciente en consulta</p>;

  const { patient, notes, diagnoses } = currentConsultation;

  return (
    <div className="consultation-page">
      {/* Panel superior: Identidad del paciente */}
      <PatientHeader patient={patient} />

      {/* Tabs clínicos */}
      <Tabs>
        <Tab title="Diagnóstico">
          <DiagnosisPanel
            diagnoses={diagnoses}
            onAdd={(data) => createDiagnosis({ ...data, appointment: currentConsultation.id })}
          />
        </Tab>
        <Tab title="Tratamiento">
          <TreatmentPanel
            diagnoses={diagnoses}
            onAdd={(data) => createTreatment({ ...data })}
          />
        </Tab>
        <Tab title="Prescripción">
          <PrescriptionPanel
            diagnoses={diagnoses}
            onAdd={(data) => createPrescription({ ...data })}
          />
        </Tab>
        <Tab title="Notas">
          <NotesPanel
            notes={notes}
            onSave={(newNotes) => updateAppointmentNotes({ id: currentConsultation.id, notes: newNotes })}
          />
        </Tab>
      </Tabs>

      {/* Documentos clínicos y pagos */}
      <div className="side-panels">
        <DocumentsPanel appointmentId={currentConsultation.id} />
        <PaymentsPanel appointmentId={currentConsultation.id} />
      </div>

      {/* Footer: acciones de cierre */}
      <div className="consultation-actions">
        <button
          className="btn-primary"
          onClick={() => updateAppointmentStatus({ id: currentConsultation.id, status: "completed" })}
        >
          Finalizar consulta
        </button>
        <button
          className="btn-secondary"
          onClick={() => updateAppointmentStatus({ id: currentConsultation.id, status: "canceled" })}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
