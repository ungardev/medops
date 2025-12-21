// src/components/ui/Tabs.tsx
import { ReactNode } from "react";

interface TabProps {
  id: string;
  label: string;
  children: ReactNode;
}

interface TabsProps {
  children: ReactNode[] | ReactNode;
  value: string; // ← controlado externamente
  onChange: (id: string) => void; // ← notifica cambios
  className?: string;
  layout?: "vertical" | "horizontal";
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}
Tab.displayName = "Tab"; // 👈 clave para identificar los hijos

export function Tabs({
  children,
  value,
  onChange,
  className,
  layout = "vertical",
}: TabsProps) {
  // Normalizamos children a array
  const childArray = Array.isArray(children) ? children : [children];

  // Filtramos solo los Tab válidos
  const tabs = childArray.filter((c: any) => c.type?.displayName === "Tab");

  return (
    <div className={className ?? "space-y-3 sm:space-y-4"}>
      {/* 🔹 Tabs header */}
      <div className="flex flex-wrap gap-1 sm:gap-2 border-b pb-2 overflow-x-auto">
        {tabs.map((tab: any) => (
          <button
            key={tab.props.id}
            className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              value === tab.props.id
                ? "bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444]"
                : "bg-gray-100 text-[#0d2c53] hover:bg-gray-200 border border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            }`}
            onClick={() => onChange(tab.props.id)}
          >
            {tab.props.label}
          </button>
        ))}
      </div>

      {/* 🔹 Tabs content */}
      {layout === "vertical" ? (
        <div>
          {tabs.map((tab: any) =>
            tab.props.id === value ? (
              <div
                key={tab.props.id}
                className="rounded-lg shadow-lg p-3 sm:p-4 bg-white dark:bg-gray-800"
              >
                {tab.props.children}
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {tabs.map((tab: any) =>
            tab.props.id === value ? (
              <div
                key={tab.props.id}
                className="rounded-lg shadow-lg p-3 sm:p-4 bg-white dark:bg-gray-800"
              >
                {tab.props.children}
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}