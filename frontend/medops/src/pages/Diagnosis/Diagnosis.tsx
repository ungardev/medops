// src/pages/Diagnosis/Diagnosis.tsx
import PageHeader from "@/components/Common/PageHeader";
export default function Diagnosis() {
  return (
    <div className="space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/doctor" },
          { label: "Diagnóstico", active: true }
        ]}
      />
      
      <div className="bg-white/5 border border-white/15 rounded-xl p-10">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-3">Centro de Diagnóstico Inteligente</h2>
          <p className="text-white/50 mb-5">Próximamente: Análisis de imágenes, resultados de laboratorio y más</p>
          <div className="mt-5 p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl inline-block">
            <span className="text-blue-400 text-base font-medium">MEDOPZ AI Diagnostics</span>
            <p className="text-white/40 text-sm mt-2">Machine Learning + OCR + Análisis Predictivo</p>
          </div>
        </div>
      </div>
    </div>
  );
}