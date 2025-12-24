// src/components/Patients/PatientInfoTab.tsx
import React, { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";

import DemographicsSection from "./sections/DemographicsSection";
import AlertsSection from "./sections/AlertsSection";
import ClinicalProfileSection from "./sections/ClinicalProfileSection";

import { useVaccinations } from "../../hooks/patients/useVaccinations";

export default function PatientInfoTab({ patientId }: { patientId: number }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { vaccinations: vaccQuery, schedule } = useVaccinations(patientId);

  const refreshProfile = () => {
    setLoading(true);
    apiFetch(`patients/${patientId}/profile/`)
      .then((data) => setProfile(data))
      .catch((err) => {
        console.error("Error reloading clinical profile:", err);
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
        backgrounds={profile.clinical_background ?? []}
        allergies={profile.allergies ?? []}
        habits={profile.habits ?? []}
        surgeries={profile.surgeries ?? []}
        vaccinations={Array.isArray(vaccQuery.data) ? vaccQuery.data : []}
        vaccinationSchedule={Array.isArray(schedule.data) ? schedule.data : []}
        onChangeTab={(tab) => {
          console.log("Cambiar a tab:", tab);
        }}
      />

      <ClinicalProfileSection
        backgrounds={profile.clinical_background ?? []}
        allergies={profile.allergies ?? []}
        habits={profile.habits ?? []}
        patientId={patientId}
        onRefresh={refreshProfile}
      />
    </div>
  );
}
