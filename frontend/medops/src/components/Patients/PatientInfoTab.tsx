// src/components/Patients/PatientInfoTab.tsx
import React, { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";

import DemographicsSection from "./sections/DemographicsSection";
import AlertsSection from "./sections/AlertsSection";
import ClinicalProfileSection from "./sections/ClinicalProfileSection";
import ClinicalBackgroundModal from "./sections/ClinicalBackgroundModal";
import HabitsModal from "./sections/HabitsModal";

import { useVaccinations } from "../../hooks/patients/useVaccinations";

export default function PatientInfoTab({ patientId }: { patientId: number }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [modalAntecedenteType, setModalAntecedenteType] = useState<
    "personal" | "familiar" | "genetico" | null
  >(null);
  const [modalHabitoOpen, setModalHabitoOpen] = useState(false);

  const { vaccinations: vaccQuery, schedule } = useVaccinations(patientId);

  const refreshProfile = () => {
    setLoading(true);
    apiFetch(`patients/${patientId}/profile/`)
      .then((data) => setProfile(data))
      .catch((err) => {
        console.error("Error recargando perfil clínico:", err);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshProfile();
  }, [patientId]);

  if (loading && !profile) {
    return (
      <div className="p-4 text-sm text-gray-600 dark:text-gray-300">
        Cargando expediente clínico...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-sm text-red-600 dark:text-red-400">
        No se pudo cargar el expediente clínico.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-8">
      <DemographicsSection patient={profile} onRefresh={refreshProfile} />

      <AlertsSection
        patient={profile}
        antecedentes={profile.clinical_background ?? []}
        habits={profile.habits ?? []}
        surgeries={profile.surgeries ?? []}
        vaccinations={Array.isArray(vaccQuery.data) ? vaccQuery.data : []}
        vaccinationSchedule={Array.isArray(schedule.data) ? schedule.data : []}
        onChangeTab={(tab) => {
          // Aquí puedes integrar con PatientDetail para cambiar de tab
          console.log("Cambiar a tab:", tab);
        }}
      />

      <ClinicalProfileSection
        antecedentes={profile.clinical_background ?? []}
        habits={profile.habits ?? []}
        patientId={patientId}
        onRefresh={refreshProfile}
        onCreateAntecedente={(type) => setModalAntecedenteType(type)}
        onCreateHabito={() => setModalHabitoOpen(true)}
      />

      {modalAntecedenteType && (
        <ClinicalBackgroundModal
          open={true}
          type={modalAntecedenteType}
          onClose={() => setModalAntecedenteType(null)}
          onSave={(data) => {
            apiFetch(`patients/${patientId}/clinical-background/`, {
              method: "POST",
              body: JSON.stringify(data),
            })
              .then(() => refreshProfile())
              .finally(() => setModalAntecedenteType(null));
          }}
        />
      )}

      {modalHabitoOpen && (
        <HabitsModal
          open={true}
          onClose={() => setModalHabitoOpen(false)}
          onSave={(data) => {
            apiFetch(`patients/${patientId}/habits/`, {
              method: "POST",
              body: JSON.stringify({ ...data, patient: patientId }),
            })
              .then(() => refreshProfile())
              .finally(() => setModalHabitoOpen(false));
          }}
        />
      )}
    </div>
  );
}
