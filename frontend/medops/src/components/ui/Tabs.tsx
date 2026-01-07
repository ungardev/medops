// src/components/ui/Tabs.tsx
import { ReactNode } from "react";

interface TabProps {
  id: string;
  label: ReactNode; // ✅ CAMBIO: De 'string' a 'ReactNode' para aceptar iconos/JSX
  children: ReactNode;
}

interface TabsProps {
  children: ReactNode[] | ReactNode;
  value: string;
  onChange: (id: string) => void;
  className?: string;
  layout?: "vertical" | "horizontal";
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}
Tab.displayName = "Tab";

export function Tabs({
  children,
  value,
  onChange,
  className,
  layout = "vertical",
}: TabsProps) {
  // Aseguramos que children sea un array para poder filtrar
  const childArray = Array.isArray(children) ? children : [children];
  
  // Filtramos solo los componentes de tipo Tab
  const tabs = childArray.filter((c: any) => c?.type?.displayName === "Tab");

  return (
    <div className={className ?? "space-y-4"}>
      {/* 🛠️ NAVIGATION HEADER */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--palantir-border)] pb-0 overflow-x-auto scrollbar-hide">
        {tabs.map((tab: any) => {
          const isActive = value === tab.props.id;
          return (
            <button
              key={tab.props.id}
              type="button" // Buena práctica para evitar submit accidentales
              onClick={() => onChange(tab.props.id)}
              className={`
                relative px-4 py-3 text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-200
                ${isActive 
                  ? "text-[var(--palantir-active)] bg-[var(--palantir-active)]/5" 
                  : "text-[var(--palantir-muted)] hover:text-[var(--palantir-text)] hover:bg-white/5"}
              `}
            >
              {/* Contenedor flexible para alinear iconos y texto que vengan en el label */}
              <div className="flex items-center justify-center gap-2">
                {tab.props.label}
              </div>
              
              {/* 💡 Active Indicator Line */}
              {isActive && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--palantir-active)] shadow-[0_0_8px_var(--palantir-active)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* 🧊 CONTENT DISPLAY */}
      <div className={layout === "horizontal" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : ""}>
        {tabs.map((tab: any) =>
          tab.props.id === value ? (
            <div
              key={tab.props.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-sm p-4 sm:p-6 shadow-xl shadow-black/20">
                {tab.props.children}
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
