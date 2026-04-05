// src/pages/Diagnosis/Diagnosis.tsx
import PageHeader from "@/components/Common/PageHeader";
export default function Diagnosis() {
  return (
    <div className="space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "Diagnóstico", active: true }
        ]}
      />
      
      <div className="bg-white/5 border border-white/15 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Centro de Diagnóstico Inteligente</h2>
          <p className="text-white/50 mb-4">Próximamente: Análisis de imágenes, resultados de laboratorio y más</p>
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg inline-block">
            <span className="text-blue-400 text-sm">MEDOPZ AI Diagnostics</span>
            <p className="text-white/40 text-xs mt-1">Machine Learning + OCR + Análisis Predictivo</p>
          </div>
        </div>
      </div>
    </div>
  );
}