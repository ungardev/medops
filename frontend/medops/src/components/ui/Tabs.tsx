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
  
  const tabs = React.Children.toArray(children).filter((child) => {
    return isValidElement(child);
  }) as ReactElement<TabProps>[];
  return (
    <div className={className ?? "space-y-4"}>
      
      <div className="flex flex-wrap gap-0 border-b border-white/15 pb-0 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = value === tab.props.id;
          return (
            <button
              key={tab.props.id}
              type="button"
              onClick={() => onChange(tab.props.id)}
              className={`
                relative px-5 py-3 text-[11px] font-medium transition-all duration-200
                ${isActive 
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"}
              `}
            >
              <div className="flex items-center justify-center gap-2">
                {tab.props.label}
              </div>
            </button>
          );
        })}
      </div>
      <div className={layout === "vertical" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
        {tabs.map((tab) =>
          tab.props.id === value ? (
            <div
              key={tab.props.id}
              className={`animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out ${
                layout === "vertical" ? "" : "w-full"
              }`}
            >
              <div className="bg-white/5 border border-white/15 rounded-lg p-5 sm:p-6">
                {tab.props.children}
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}