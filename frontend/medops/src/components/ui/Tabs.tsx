// src/components/ui/Tabs.tsx
import React, { ReactNode, isValidElement, ReactElement } from "react";
interface TabProps {
  id: string;
  label: ReactNode;
  children: ReactNode;
}
interface TabsProps {
  children: ReactNode[] | ReactNode;
  value: string;
  onChange: (id: string) => void;
  className?: string;
  layout?: "vertical" | "horizontal";
}
/**
 * Componente Tab: Actúa principalmente como un contenedor de datos
 * para que el componente Tabs pueda extraer las props.
 */
export function Tab({ children }: TabProps) {
  return <>{children}</>;
}
export function Tabs({
  children,
  value,
  onChange,
  className,
  layout = "vertical",
}: TabsProps) {
  
  // ✅ FIX: Usamos React.Children.toArray para manejar los hijos de forma segura.
  // Esto evita errores cuando hay un solo hijo o cuando React Fast Refresh 
  // envuelve los componentes en proxies durante el desarrollo.
  const tabs = React.Children.toArray(children).filter((child) => {
    return isValidElement(child);
  }) as ReactElement<TabProps>[];
  return (
    <div className={className ?? "space-y-4"}>
      
      {/* 🛠️ NAVIGATION HEADER */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--palantir-border)] pb-0 overflow-x-auto scrollbar-hide bg-black/20">
        {tabs.map((tab) => {
          const isActive = value === tab.props.id;
          return (
            <button
              key={tab.props.id}
              type="button"
              onClick={() => {
                onChange(tab.props.id);
              }}
              className={`
                relative px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-200
                ${isActive 
                  ? "text-blue-500 bg-blue-500/5" 
                  : "text-white/30 hover:text-white/70 hover:bg-white/5"}
              `}
            >
              {/* Contenedor flexible para alinear iconos y texto */}
              <div className="flex items-center justify-center gap-2">
                {tab.props.label}
              </div>
              
              {/* 💡 Active Indicator Line con efecto Glow */}
              {isActive && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
              )}
            </button>
          );
        })}
      </div>
      {/* 🧊 CONTENT DISPLAY */}
      <div className={layout === "horizontal" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : ""}>
        {tabs.map((tab) => {
          return tab.props.id === value ? (
            <div
              key={tab.props.id}
              className="animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out"
            >
              <div className="bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-sm p-4 sm:p-6 shadow-2xl">
                {tab.props.children}
              </div>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}