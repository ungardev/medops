// src/components/Consultation/PatientHeader.tsx
import type { Patient } from "../../types/patients";  // 👈 corregido

interface PatientHeaderProps {
  patient: Patient & {
    age?: number;
    allergies?: string | null;
    balance_due?: number;
  };
}

export default function PatientHeader({ patient }: PatientHeaderProps) {
  return (
    <div className="patient-header card">
      <div className="flex justify-between items-center">
        {/* Identidad */}
        <div>
          <h2 className="patient-name text-xl font-bold">
            {patient.full_name}
          </h2>
          <p className="text-muted">
            C.I.: {patient.national_id || "N/A"} | Edad: {patient.age ?? "-"}
          </p>
        </div>

        {/* Estado financiero */}
        <div className="text-right">
          <p className="font-semibold">
            Saldo pendiente:{" "}
            {patient.balance_due && patient.balance_due > 0 ? (
              <span className="text-danger">
                ${patient.balance_due.toFixed(2)}
              </span>
            ) : (
              <span className="text-success">✔ Al día</span>
            )}
          </p>
        </div>
      </div>

      {/* Datos clínicos clave */}
      <div className="mt-2 flex gap-4 text-sm">
        <span>
          <strong>Sexo:</strong> {patient.gender}
        </span>
        {patient.allergies && (
          <span className="text-warning">
            <strong>Alergias:</strong> {patient.allergies}
          </span>
        )}
      </div>
    </div>
  );
}
