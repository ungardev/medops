// src/pages/PatientPortal/PatientSurgery.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/Common/PageHeader";
import { useSurgeries } from "@/hooks/patients/useSurgeries";
import { usePatientAuth } from "@/hooks/patient/usePatientAuth";
import { usePatient } from "@/context/PatientContext";
import SurgeryDetailDrawer from "@/components/Patients/SurgeryDetailDrawer";
import type { Surgery } from "@/types/patients";
import {
  ScissorsIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pre_op: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  in_progress: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  canceled: "bg-red-500/10 text-red-400 border-red-500/20",
  postponed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const tabs = [
  { key: "all", label: "Todas" },
  { key: "scheduled", label: "Programadas" },
  { key: "in_progress", label: "En Curso" },
  { key: "completed", label: "Completadas" },
  { key: "canceled", label: "Canceladas" },
];

export default function PatientSurgery() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = usePatientAuth();
  const { activePatientId } = usePatient();

  const [activeTab, setActiveTab] = useState("all");
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState<Surgery | undefined>(undefined);

  const { query } = useSurgeries(activePatientId || 0);
  const { data: surgeries, isLoading, error } = query;

  const stats = useMemo(() => {
    if (!surgeries) return { total: 0, scheduled: 0, in_progress: 0, completed: 0, canceled: 0 };
    return {
      total: surgeries.length,
      scheduled: surgeries.filter((s) => s.status === "scheduled").length,
      in_progress: surgeries.filter((s) => s.status === "in_progress").length,
      completed: surgeries.filter((s) => s.status === "completed").length,
      canceled: surgeries.filter((s) => s.status === "canceled").length,
    };
  }, [surgeries]);

  const filteredSurgeries = useMemo(() => {
    if (!surgeries) return [];
    if (activeTab === "all") return surgeries;
    return surgeries.filter((s) => s.status === activeTab);
  }, [surgeries, activeTab]);

  if (authLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-xs text-emerald-400/60">Verificando autenticación...</p>
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
          <p className="text-xs text-emerald-400/60">Cargando cirugías...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
          <p className="text-xs text-red-400">Error al cargar las cirugías</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "Cirugía", active: true },
        ]}
        stats={[
          { label: "Total", value: stats.total },
          { label: "Programadas", value: stats.scheduled, color: "text-blue-400" },
          { label: "En Curso", value: stats.in_progress, color: "text-purple-400" },
          { label: "Completadas", value: stats.completed, color: "text-emerald-400" },
        ]}
      />

      <div className="flex gap-2 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
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
        {filteredSurgeries.length === 0 ? (
          <div className="bg-white/10 border border-white/20 rounded-xl p-8 text-center">
            <ScissorsIcon className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/40">No hay cirugías {activeTab !== "all" ? `con status "${tabs.find(t => t.key === activeTab)?.label}"` : "registradas"}</p>
          </div>
        ) : (
          filteredSurgeries.map((surgery) => (
            <div
              key={surgery.id}
              className="bg-white/10 border border-white/20 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="mt-1">
                  <ScissorsIcon className="w-5 h-5 text-white/30" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{surgery.name || "Cirugía sin nombre"}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-white/40">
                    {(surgery as any).surgeon_name && (
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" />
                        {(surgery as any).surgeon_name}
                      </span>
                    )}
                    {surgery.scheduled_date && (
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {new Date(surgery.scheduled_date).toLocaleDateString("es-VE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${statusColors[surgery.status as keyof typeof statusColors] || "bg-white/5 text-white/40 border-white/10"}`}>
                      {surgery.status_display || surgery.status}
                    </span>
                    {(surgery as any).risk_level_display && (
                      <span className="text-xs text-white/40">{(surgery as any).risk_level_display}</span>
                    )}
                    {(surgery as any).specialty_name && (
                      <span className="text-xs text-white/30">{(surgery as any).specialty_name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedSurgery(surgery);
                    setDetailDrawerOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/20 text-white/60 rounded-lg hover:bg-white/10 transition-all flex items-center gap-1.5"
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  Ver
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <SurgeryDetailDrawer
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedSurgery(undefined);
        }}
        surgery={selectedSurgery}
        readOnly
      />
    </div>
  );
}