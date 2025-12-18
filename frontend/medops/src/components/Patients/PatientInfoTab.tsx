import React, { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";

import DemographicsSection from "./sections/DemographicsSection";
import PersonalHistorySection from "./sections/PersonalHistorySection";
import FamilyHistorySection from "./sections/FamilyHistorySection";
import SurgeriesSection from "./sections/SurgeriesSection";
import HabitsSection from "./sections/HabitsSection";
import VaccinationSection from "./sections/VaccinationSection";
import GeneticSection from "./sections/GeneticSection";
import AlertsSection from "./sections/AlertsSection";

import { useVaccinations } from "../../hooks/patients/useVaccinations";

export default function PatientInfoTab({ patientId }: { patientId: number }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Traer vacunación + esquema nacional
  const { vaccinations: vaccQuery, schedule } = useVaccinations(patientId);

  // Función institucional para refrescar el perfil clínico
  const refreshProfile = () => {
    apiFetch(`patients/${patientId}/profile/`)
      .then((data) => setProfile(data))
      .catch((err) =>
        console.error("Error recargando perfil clínico:", err)
      );
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

      {/* DATOS PERSONALES */}
      <DemographicsSection
        patient={profile}
        onRefresh={refreshProfile}   // 🔥 FIX INSTITUCIONAL
      />

      {/* ALERTAS CLÍNICAS INTELIGENTES */}
      <AlertsSection
        patient={profile}
        vaccinations={Array.isArray(vaccQuery.data) ? vaccQuery.data : []}
        vaccinationSchedule={Array.isArray(schedule.data) ? schedule.data : []}
      />

      <PersonalHistorySection
        items={profile.personal_history}
        patientId={patientId}
      />

      <FamilyHistorySection
        items={profile.family_history}
        patientId={patientId}
      />

      <SurgeriesSection
        items={profile.surgeries}
        patientId={patientId}
      />

      <HabitsSection
        items={profile.habits}
        patientId={patientId}
      />

      <GeneticSection
        items={profile.genetic_predispositions}
        patientId={patientId}
      />

      <VaccinationSection
        vaccinations={profile.vaccinations}
        patientId={patientId}
      />
    </div>
  );
}
