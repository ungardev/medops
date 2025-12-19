import React, { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";

import DemographicsSection from "./sections/DemographicsSection";
import PersonalHistorySection from "./sections/PersonalHistorySection";
import FamilyHistorySection from "./sections/FamilyHistorySection";
import SurgeriesSection from "./sections/SurgeriesSection";
import HabitsSection from "./sections/HabitsSection";
import GeneticSection from "./sections/GeneticSection";
import AlertsSection from "./sections/AlertsSection";

import { useVaccinations } from "../../hooks/patients/useVaccinations";

export default function PatientInfoTab({ patientId }: { patientId: number }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { vaccinations: vaccQuery, schedule } = useVaccinations(patientId);

  // Función institucional para refrescar el perfil clínico
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

      <DemographicsSection
        patient={profile}
        onRefresh={refreshProfile}
      />

      <AlertsSection
        patient={profile}
        vaccinations={Array.isArray(vaccQuery.data) ? vaccQuery.data : []}
        vaccinationSchedule={Array.isArray(schedule.data) ? schedule.data : []}
      />

      <PersonalHistorySection
        items={profile.personal_history}
        patientId={patientId}
        onRefresh={refreshProfile}
      />

      <FamilyHistorySection
        items={profile.family_history}
        patientId={patientId}
        onRefresh={refreshProfile}
      />

      <SurgeriesSection
        items={profile.surgeries}
        patientId={patientId}
        onRefresh={refreshProfile}
      />

      <HabitsSection
        items={profile.habits}
        patientId={patientId}
        onRefresh={refreshProfile}
      />

      <GeneticSection
        items={profile.genetic_predispositions}
        patientId={patientId}
        onRefresh={refreshProfile}   // 🔥 FIX INSTITUCIONAL
      />
    </div>
  );
}
