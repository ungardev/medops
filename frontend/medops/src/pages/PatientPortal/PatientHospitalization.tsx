// src/pages/PatientPortal/PatientHospitalization.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/Common/PageHeader";
import { useHospitalizations } from "@/hooks/patients/useHospitalizations";
import { usePatientAuth } from "@/hooks/patient/usePatientAuth";
import HospitalizationDetailDrawer from "@/components/Patients/HospitalizationDetailDrawer";
import type { Hospitalization } from "@/types/patients";
import {
  Bed,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Heart,
  Eye,
} from "lucide-react";

const statusColors: Record<string, string> = {
  admitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  stable: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  improving: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  awaiting_discharge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  discharged: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  transferred: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  deceased: "bg-red-900/20 text-red-500 border-red-900/30",
};

const tabs = [
  { key: "all", label: "Todos" },
  { key: "admitted", label: "Admitidos" },
  { key: "stable", label: "Estables" },
  { key: "critical", label: "Críticos" },
  { key: "improving", label: "En Mejoría" },
  { key: "discharged", label: "Dados de Alta" },
];

export default function PatientHospitalization() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, patient: authPatient } = usePatientAuth();
  const patientId = Number(localStorage.getItem("patient_id")) || authPatient?.id;

  const [activeTab, setActiveTab] = useState("all");
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedHospitalization, setSelectedHospitalization] = useState<Hospitalization | undefined>(undefined);

  const { query } = useHospitalizations(patientId);
  const { data: hospitalizations, isLoading, error } = query;

  const stats = useMemo(() => {
    if (!hospitalizations) return { total: 0, admitted: 0, stable: 0, critical: 0, improving: 0, discharged: 0 };
    return {
      total: hospitalizations.length,
      admitted: hospitalizations.filter((h) => h.status === "admitted").length,
      stable: hospitalizations.filter((h) => h.status === "stable").length,
      critical: hospitalizations.filter((h) => h.status === "critical").length,
      improving: hospitalizations.filter((h) => h.status === "improving").length,
      discharged: hospitalizations.filter((h) => h.status === "discharged").length,
    };
  }, [hospitalizations]);

  const filteredHospitalizations = useMemo(() => {
    if (!hospitalizations) return [];
    if (activeTab === "all") return hospitalizations;
    return hospitalizations.filter((h) => h.status === activeTab);
  }, [hospitalizations, activeTab]);

  if (authLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-[10px] text-emerald-400/60">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/patient/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-[10px] text-emerald-400/60">Cargando hospitalizaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
          <p className="text-[10px] text-red-400">Error al cargar las hospitalizaciones</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "Hospitalización", active: true },
        ]}
        stats={[
          { label: "Total", value: stats.total },
          { label: "Admitidos", value: stats.admitted, color: "text-blue-400" },
          { label: "Críticos", value: stats.critical, color: "text-red-400" },
          { label: "Dados de Alta", value: stats.discharged, color: "text-gray-400" },
        ]}
      />

      <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-[12px] font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.key
                ? "text-white border-white"
                : "text-white/40 border-transparent hover:text-white/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredHospitalizations.length === 0 ? (
          <div className="bg-white/5 border border-white/15 rounded-lg p-8 text-center">
            <Bed className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-[12px] text-white/40">
              No hay hospitalizaciones {activeTab !== "all" ? `con status "${tabs.find((t) => t.key === activeTab)?.label}"` : "registradas"}
            </p>
          </div>
        ) : (
          filteredHospitalizations.map((hosp) => (
            <div
              key={hosp.id}
              className="bg-white/5 border border-white/15 rounded-lg p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="mt-1">
                  <Bed className="w-5 h-5 text-white/30" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-white/80">
                      {(hosp as any).admission_diagnosis_title || "Hospitalización"}
                    </p>
                    {hosp.length_of_stay !== undefined && (
                      <span className="text-[9px] text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {hosp.length_of_stay} {hosp.length_of_stay === 1 ? "día" : "días"}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-white/40">
                    {(hosp as any).attending_doctor_name && (
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5" />
                        {(hosp as any).attending_doctor_name}
                      </span>
                    )}
                    {hosp.ward && (
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        {hosp.ward}
                        {hosp.bed_number ? ` - Cama ${hosp.bed_number}` : ""}
                      </span>
                    )}
                    {hosp.admission_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(hosp.admission_date).toLocaleDateString("es-VE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-medium rounded-md border ${statusColors[hosp.status] || "bg-white/5 text-white/40 border-white/10"}`}>
                      {hosp.status_display || hosp.status}
                    </span>
                    {(hosp as any).institution_name && (
                      <span className="text-[9px] text-white/30">{(hosp as any).institution_name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedHospitalization(hosp);
                    setDetailDrawerOpen(true);
                  }}
                  className="px-3 py-1.5 text-[10px] font-medium bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-all flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <HospitalizationDetailDrawer
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedHospitalization(undefined);
        }}
        hospitalization={selectedHospitalization}
        readOnly
      />
    </div>
  );
}