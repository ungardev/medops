// src/components/Payments/PaymentsSummary.tsx
import { formatCurrency } from "@/utils/format";  // ✅ AGREGADO: Import de formatCurrency
interface Props {
  totals?: {
    total: number;
    confirmed: number;
    pending: number;
    failed: number;
  };
}
export default function PaymentsSummary({ totals }: Props) {
  // Configuración de los bloques de datos
  const metrics = [
    {
      id: "GROSS_DISPLAYED",
      label: "TOTAL_VOLUME",
      value: totals?.total ?? 0,
      color: "text-[var(--palantir-text)]",
      decoration: "bg-white/10"
    },
    {
      id: "ASSETS_CONFIRMED",
      label: "SETTLED_CREDIT",
      value: totals?.confirmed ?? 0,
      color: "text-emerald-400",
      decoration: "bg-emerald-500/20"
    },
    {
      id: "ASSETS_PENDING",
      label: "UNRESOLVED_FLOW",
      value: totals?.pending ?? 0,
      color: "text-yellow-500",
      decoration: "bg-yellow-500/20"
    },
    {
      id: "ASSETS_FAILED",
      label: "VOID_REJECTED",
      value: totals?.failed ?? 0,
      color: "text-red-400",
      decoration: "bg-red-500/20"
    }
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[var(--palantir-border)] border border-[var(--palantir-border)] overflow-hidden rounded-sm">
      {metrics.map((m) => (
        <div 
          key={m.id} 
          className="bg-[var(--palantir-bg)] p-3 sm:p-4 flex flex-col gap-1 hover:bg-white/[0.02] transition-colors group"
        >
          {/* HEADER TÉCNICO */}
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono font-black tracking-[0.2em] text-[var(--palantir-muted)] uppercase">
              {m.label}
            </span>
            <div className={`w-1 h-1 rounded-full opacity-30 group-hover:opacity-100 transition-opacity ${m.color.replace('text', 'bg')}`} />
          </div>
          {/* VALOR NUMÉRICO */}
          <div className="flex items-baseline gap-1">
            <span className={`text-base sm:text-lg font-black font-mono tracking-tighter ${m.color}`}>
              {formatCurrency(m.value, undefined)}  {/* ✅ CORREGIDO: Usa formatCurrency en lugar de toLocaleString */}
            </span>
            {/* ✅ ELIMINADO: Línea con hardcoded "USD" - formatCurrency ya incluye el símbolo de moneda */}
          </div>
          {/* DECORACIÓN DE CARGA (Simulada) */}
          <div className="w-full h-[2px] bg-white/5 mt-1 overflow-hidden">
            <div 
              className={`h-full opacity-40 ${m.color.replace('text', 'bg')}`} 
              style={{ width: `${Math.random() * 60 + 20}%` }} 
            />
          </div>
          
          <span className="text-[7px] font-mono text-[var(--palantir-muted)] opacity-20 uppercase mt-1 tracking-widest">
            {m.id} // STABLE
          </span>
        </div>
      ))}
    </div>
  );
}