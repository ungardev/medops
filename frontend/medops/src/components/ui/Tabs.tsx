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
      <div className="flex flex-wrap gap-1 border-b border-white/20 pb-0 overflow-x-auto scrollbar-hide bg-black/30">
        {tabs.map((tab) => {
          const isActive = value === tab.props.id;
          return (
            <button
              key={tab.props.id}
              type="button"
              onClick={() => onChange(tab.props.id)}
              className={`
                relative px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-200
                ${isActive 
                  ? "text-white bg-white/10"  // Activo: blanco puro, fondo sutil
                  : "text-white/80 hover:text-white hover:bg-white/5"}  // Inactivo: MÁS VISIBLE (80%), hover blanco
              `}
            >
              {/* Contenedor flexible para alinear iconos y texto */}
              <div className="flex items-center justify-center gap-2">
                {tab.props.label}
              </div>
              
              {/* 💡 Active Indicator Line - Neutro, sin azul */}
              {isActive && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/50" />
              )}
            </button>
          );
        })}
      </div>
      {/* 🧊 CONTENT DISPLAY - CORREGIDO PARA SOLUCIONAR PROBLEMA CRÍTICO */}
      <div className={layout === "vertical" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
        {tabs.map((tab) =>
          tab.props.id === value ? (
            <div
              key={tab.props.id}
              className={`animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out ${
                layout === "vertical" ? "" : "w-full"
              }`}
            >
              <div className="bg-black/50 border border-white/20 rounded-sm p-4 sm:p-6 shadow-2xl">
                {tab.props.children}
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}